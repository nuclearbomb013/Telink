"""
Messages API - Private messaging between users.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, update, delete, desc
import time

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.message import Message
from app.schemas import ServiceResponse
from app.schemas.message import (
    MessageCreate, MessageResponse, ConversationResponse,
    ConversationListResult, MessageListResult, MessageUnreadCountResponse,
)

router = APIRouter(prefix="/messages", tags=["Messages"])

PAGE_SIZE = 50


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
    """
    uid = current_user.id

    # Find all distinct conversation partners
    sent_subq = select(Message.receiver_id).where(
        Message.sender_id == uid, Message.is_deleted.is_(False)
    )
    recv_subq = select(Message.sender_id).where(
        Message.receiver_id == uid, Message.is_deleted.is_(False)
    )
    partner_ids_query = select(sent_subq.union(recv_subq).subquery().c.receiver_id)
    result = await db.execute(partner_ids_query)
    partner_ids = [row[0] for row in result.fetchall()]

    if not partner_ids:
        return ServiceResponse(
            success=True,
            data=ConversationListResult(conversations=[], total=0),
        )

    # Fetch user info for partners
    user_result = await db.execute(
        select(User).where(User.id.in_(partner_ids))
    )
    user_map = {u.id: u for u in user_result.scalars().all()}

    conversations = []
    for partner_id in partner_ids:
        partner = user_map.get(partner_id)
        if not partner:
            continue

        # Get last message between the two users
        last_msg_result = await db.execute(
            select(Message)
            .where(
                or_(
                    and_(Message.sender_id == uid, Message.receiver_id == partner_id),
                    and_(Message.sender_id == partner_id, Message.receiver_id == uid),
                ),
                Message.is_deleted.is_(False),
            )
            .order_by(desc(Message.created_at))
            .limit(1)
        )
        last_msg = last_msg_result.scalar_one_or_none()
        if not last_msg:
            continue

        # Count unread messages received from this partner
        unread_result = await db.execute(
            select(func.count()).select_from(Message).where(
                Message.sender_id == partner_id,
                Message.receiver_id == uid,
                Message.is_read.is_(False),
                Message.is_deleted.is_(False),
            )
        )
        unread_count = unread_result.scalar() or 0

        conversations.append(ConversationResponse(
            user_id=partner_id,
            username=partner.username,
            avatar=partner.avatar,
            last_message=last_msg.content,
            last_message_at=int(last_msg.created_at.timestamp() * 1000) if last_msg.created_at else 0,
            unread_count=unread_count,
        ))

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
        or_(
            and_(Message.sender_id == uid, Message.receiver_id == user_id),
            and_(Message.sender_id == user_id, Message.receiver_id == uid),
        ),
        Message.is_deleted.is_(False),
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
    from app.models.follow import Follow
    mutual_result = await db.execute(
        select(Follow).where(
            Follow.follower_id == current_user.id,
            Follow.following_id == data.receiver_id,
        )
    )
    is_following = mutual_result.scalar_one_or_none() is not None
    if not is_following:
        return ServiceResponse(
            success=False,
            error={"code": "FORBIDDEN", "message": "Must follow user to send messages"},
        )

    msg = Message(
        sender_id=current_user.id,
        receiver_id=data.receiver_id,
        content=data.content.strip(),
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
    if not msg:
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
    """Soft-delete a message. Only sender or receiver can delete (their own view)."""
    msg = await db.get(Message, message_id)
    if not msg:
        return ServiceResponse(
            success=False, error={"code": "NOT_FOUND", "message": "Message not found"},
        )
    if msg.sender_id != current_user.id and msg.receiver_id != current_user.id:
        return ServiceResponse(
            success=False, error={"code": "FORBIDDEN", "message": "Not your message"},
        )

    msg.is_deleted = True
    await db.commit()

    return ServiceResponse(success=True, data={"message": "Message deleted"})
