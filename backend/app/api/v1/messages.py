"""
Messages API - Private messaging between users.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, update, desc, case
import time

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.message import Message
from app.models.follow import Follow
from app.schemas import ServiceResponse
from app.schemas.message import (
    MessageCreate, MessageResponse, ConversationResponse,
    ConversationListResult, MessageListResult, MessageUnreadCountResponse,
)

router = APIRouter(prefix="/messages", tags=["Messages"])

PAGE_SIZE = 50


def _visible_to_user(message: Message, user_id: int) -> bool:
    if message.is_deleted:
        return False
    if message.sender_id == user_id:
        return not message.deleted_by_sender
    if message.receiver_id == user_id:
        return not message.deleted_by_receiver
    return False


def _to_response(msg: Message) -> MessageResponse:
    return MessageResponse(
        id=msg.id,
        sender_id=msg.sender_id,
        receiver_id=msg.receiver_id,
        content=msg.content,
        status=msg.status,
        is_read=msg.is_read,
        is_deleted=msg.is_deleted,
        created_at=int(msg.created_at.timestamp() * 1000) if msg.created_at else 0,
    )


# ──────────────────── Conversations ────────────────────


@router.get("/conversations", response_model=ServiceResponse[ConversationListResult])
async def get_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get all conversations for the current user.

    A conversation exists if at least one non-deleted message has been
    exchanged between the current user and another user.

    Uses window functions to fetch latest messages and unread counts
    in fixed 3 queries regardless of conversation count.
    """
    uid = current_user.id

    # ── Partner list ──────────────────────────────────────────
    sent_subq = select(Message.receiver_id).where(
        Message.sender_id == uid,
        Message.is_deleted.is_(False),
        Message.deleted_by_sender.is_(False),
    )
    recv_subq = select(Message.sender_id).where(
        Message.receiver_id == uid,
        Message.is_deleted.is_(False),
        Message.deleted_by_receiver.is_(False),
    )
    partner_ids_query = select(sent_subq.union(recv_subq).subquery().c.receiver_id)
    result = await db.execute(partner_ids_query)
    partner_ids = [row[0] for row in result.fetchall()]

    if not partner_ids:
        return ServiceResponse(
            success=True,
            data=ConversationListResult(conversations=[], total=0),
        )

    # ── Latest message per partner (window function, 1 query) ─
    partner_expr = case(
        (Message.sender_id == uid, Message.receiver_id),
        else_=Message.sender_id,
    ).label("partner_id")

    base_msg = (
        select(
            Message.id.label("msg_id"),
            Message.content,
            Message.created_at,
            partner_expr,
        )
        .where(
            Message.is_deleted.is_(False),
            or_(
                and_(Message.sender_id == uid, Message.deleted_by_sender.is_(False)),
                and_(Message.receiver_id == uid, Message.deleted_by_receiver.is_(False)),
            ),
        )
        .cte("base_msg")
    )

    ranked = (
        select(
            base_msg.c.partner_id,
            base_msg.c.content,
            base_msg.c.created_at,
            base_msg.c.msg_id,
            func.row_number()
            .over(
                partition_by=base_msg.c.partner_id,
                order_by=[desc(base_msg.c.created_at), desc(base_msg.c.msg_id)],
            )
            .label("rn"),
        )
        .cte("ranked")
    )

    latest_result = await db.execute(
        select(
            ranked.c.partner_id,
            ranked.c.content,
            ranked.c.created_at,
            ranked.c.msg_id,
        ).where(ranked.c.rn == 1)
    )
    latest_rows = {
        row[0]: row for row in latest_result.fetchall()
    }  # partner_id -> (partner_id, content, created_at, msg_id)

    # ── Unread counts per partner (1 query, group by) ────────
    unread_result = await db.execute(
        select(Message.sender_id, func.count())
        .where(
            Message.receiver_id == uid,
            Message.is_read.is_(False),
            Message.is_deleted.is_(False),
            Message.deleted_by_receiver.is_(False),
            Message.sender_id.in_(partner_ids),
        )
        .group_by(Message.sender_id)
    )
    unread_map = {row[0]: row[1] for row in unread_result.fetchall()}

    # ── User info (1 batch query) ────────────────────────────
    user_result = await db.execute(
        select(User).where(User.id.in_(partner_ids))
    )
    user_map = {u.id: u for u in user_result.scalars().all()}

    # ── Assemble ─────────────────────────────────────────────
    conversations = []
    for partner_id in partner_ids:
        latest = latest_rows.get(partner_id)
        if not latest:
            continue
        partner = user_map.get(partner_id)
        if not partner:
            continue

        created_at = latest[2]
        conversations.append(
            ConversationResponse(
                user_id=partner_id,
                username=partner.username,
                avatar=partner.avatar,
                last_message=latest[1],  # content
                last_message_at=int(created_at.timestamp() * 1000) if created_at else 0,
                unread_count=unread_map.get(partner_id, 0),
            )
        )

    conversations.sort(key=lambda c: c.last_message_at, reverse=True)

    return ServiceResponse(
        success=True,
        data=ConversationListResult(conversations=conversations, total=len(conversations)),
    )


# ──────────────────── Messages in a conversation ────────────────────


@router.get("/conversations/{user_id}", response_model=ServiceResponse[MessageListResult])
async def get_conversation_messages(
    user_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(PAGE_SIZE, ge=1, le=100),
    before_id: int | None = Query(None, description="Cursor: return messages with id < before_id"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get paginated messages between current user and another user.

    Supports two modes:
    - Cursor-based: pass before_id to get older messages (id < before_id).
    - Offset-based: pass page to get a specific page (default page=1).
    When before_id is provided, page is ignored.
    """
    uid = current_user.id

    # Build base WHERE clause
    base_where = and_(
        Message.is_deleted.is_(False),
        or_(
            and_(
                Message.sender_id == uid,
                Message.receiver_id == user_id,
                Message.deleted_by_sender.is_(False),
            ),
            and_(
                Message.sender_id == user_id,
                Message.receiver_id == uid,
                Message.deleted_by_receiver.is_(False),
            ),
        ),
    )

    # Count total (needed for has_more in both modes)
    count_query = select(func.count()).select_from(Message).where(base_where)
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    # Build message query
    msg_query = select(Message).where(base_where)

    if before_id is not None:
        # Cursor-based: fetch messages older than before_id
        msg_query = msg_query.where(Message.id < before_id)
        msg_query = msg_query.order_by(desc(Message.created_at)).limit(limit + 1)  # +1 to check has_more
        result = await db.execute(msg_query)
        messages = result.scalars().all()
        has_more = len(messages) > limit
        if has_more:
            messages = messages[:limit]
        used_page = 0  # Not applicable for cursor mode
    else:
        # Offset-based pagination (backward compatible)
        msg_query = msg_query.order_by(desc(Message.created_at))
        msg_query = msg_query.offset((page - 1) * limit).limit(limit)
        result = await db.execute(msg_query)
        messages = result.scalars().all()
        has_more = (page * limit) < total
        used_page = page

    # Mark messages received from this user as read
    now_ms = int(time.time() * 1000)
    await db.execute(
        update(Message)
        .where(
            Message.sender_id == user_id,
            Message.receiver_id == uid,
            Message.is_read.is_(False),
            Message.is_deleted.is_(False),
            Message.deleted_by_receiver.is_(False),
        )
        .values(is_read=True, read_at=now_ms, status="read")
    )
    await db.commit()

    # Sync ORM objects after bulk UPDATE so the response reflects the new state.
    # expire_on_commit=False means objects retain pre-commit values.
    for m in messages:
        if m.sender_id == user_id and m.receiver_id == uid and not m.is_read:
            m.is_read = True
            m.read_at = now_ms
            m.status = "read"

    return ServiceResponse(
        success=True,
        data=MessageListResult(
            messages=[_to_response(m) for m in reversed(messages)],
            total=total,
            page=used_page,
            limit=limit,
            has_more=has_more,
        ),
    )


# ──────────────────── Send ────────────────────


@router.post("", response_model=ServiceResponse[MessageResponse])
async def send_message(
    data: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Send a private message to another user."""
    if data.receiver_id == current_user.id:
        return ServiceResponse(
            success=False,
            error={"code": "INVALID", "message": "Cannot send message to yourself"},
        )

    # Verify receiver exists and is active
    receiver = await db.get(User, data.receiver_id)
    if not receiver or not receiver.is_active:
        return ServiceResponse(
            success=False,
            error={"code": "NOT_FOUND", "message": "Receiver not found"},
        )

    # Require mutual follow for DMs (friends-only messaging)
    mutual_result = await db.execute(
        select(func.count()).select_from(Follow).where(
            or_(
                and_(
                    Follow.follower_id == current_user.id,
                    Follow.following_id == data.receiver_id,
                ),
                and_(
                    Follow.follower_id == data.receiver_id,
                    Follow.following_id == current_user.id,
                ),
            )
        )
    )
    mutual_edges = mutual_result.scalar() or 0
    if mutual_edges < 2:
        return ServiceResponse(
            success=False,
            error={"code": "FORBIDDEN", "message": "Must be mutual followers to send messages"},
        )

    content = data.content.strip()
    if not content:
        return ServiceResponse(
            success=False,
            error={"code": "INVALID", "message": "Message content cannot be empty"},
        )

    msg = Message(
        sender_id=current_user.id,
        receiver_id=data.receiver_id,
        content=content,
        status="sent",
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)

    return ServiceResponse(success=True, data=_to_response(msg))


# ──────────────────── Read / Unread ────────────────────


@router.put("/{message_id}/read", response_model=ServiceResponse)
async def mark_message_read(
    message_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Mark a single received message as read."""
    msg = await db.get(Message, message_id)
    if not msg or not _visible_to_user(msg, current_user.id):
        return ServiceResponse(
            success=False, error={"code": "NOT_FOUND", "message": "Message not found"},
        )
    if msg.receiver_id != current_user.id:
        return ServiceResponse(
            success=False, error={"code": "FORBIDDEN", "message": "Not your message"},
        )

    now_ms = int(time.time() * 1000)
    await db.execute(
        update(Message).where(Message.id == message_id).values(
            is_read=True, read_at=now_ms, status="read"
        )
    )
    await db.commit()

    return ServiceResponse(success=True, data={"message": "Marked as read"})


@router.put("/conversations/{user_id}/read", response_model=ServiceResponse)
async def mark_conversation_read(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Mark all messages from a specific user as read."""
    uid = current_user.id
    now_ms = int(time.time() * 1000)

    result = await db.execute(
        update(Message)
        .where(
            Message.sender_id == user_id,
            Message.receiver_id == uid,
            Message.is_read.is_(False),
            Message.is_deleted.is_(False),
            Message.deleted_by_receiver.is_(False),
        )
        .values(is_read=True, read_at=now_ms, status="read")
    )
    await db.commit()

    return ServiceResponse(
        success=True,
        data={"marked_count": result.rowcount or 0},
    )


# ──────────────────── Unread count ────────────────────


@router.get("/unread-count", response_model=ServiceResponse[MessageUnreadCountResponse])
async def get_unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get total unread message count and per-conversation breakdown."""
    uid = current_user.id

    # Per-sender unread counts
    result = await db.execute(
        select(Message.sender_id, func.count(Message.id))
        .where(
            Message.receiver_id == uid,
            Message.is_read.is_(False),
            Message.is_deleted.is_(False),
            Message.deleted_by_receiver.is_(False),
        )
        .group_by(Message.sender_id)
    )
    rows = result.fetchall()
    conversation_unreads = [
        {"user_id": row[0], "unread_count": row[1]} for row in rows
    ]
    total_unread = sum(item["unread_count"] for item in conversation_unreads)

    return ServiceResponse(
        success=True,
        data=MessageUnreadCountResponse(
            total_unread=total_unread,
            conversation_unreads=conversation_unreads,
        ),
    )


# ──────────────────── Delete ────────────────────


@router.delete("/{message_id}", response_model=ServiceResponse)
async def delete_message(
    message_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Hide a message from the current user's own conversation view."""
    msg = await db.get(Message, message_id)
    if not msg or not _visible_to_user(msg, current_user.id):
        return ServiceResponse(
            success=False, error={"code": "NOT_FOUND", "message": "Message not found"},
        )
    if msg.sender_id != current_user.id and msg.receiver_id != current_user.id:
        return ServiceResponse(
            success=False, error={"code": "FORBIDDEN", "message": "Not your message"},
        )

    if msg.sender_id == current_user.id:
        msg.deleted_by_sender = True
    else:
        msg.deleted_by_receiver = True
    await db.commit()

    return ServiceResponse(success=True, data={"message": "Message deleted"})
