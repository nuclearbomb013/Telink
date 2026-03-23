"""
Notification API Endpoints
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update

from app.api.deps import get_db, get_current_active_user
from app.models.user import User, UserRole
from app.models.notification import Notification
from app.schemas import (
    ServiceResponse,
    NotificationCreate,
    NotificationResponse,
    NotificationListResult,
    UnreadCountResponse
)

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=ServiceResponse[NotificationListResult])
async def get_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    unreadOnly: bool = Query(False),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get notifications for current user.
    """
    if not current_user:
        return ServiceResponse(
            success=False,
            error={
                "code": "UNAUTHORIZED",
                "message": "Authentication required"
            }
        )

    # Build query
    query = select(Notification).where(Notification.user_id == current_user.id)

    if unreadOnly:
        query = query.where(Notification.is_read.is_(False))

    # Filter out expired notifications
    current_time = int(datetime.now(timezone.utc).timestamp() * 1000)
    query = query.where(
        (Notification.expires_at.is_(None)) | (Notification.expires_at > current_time)
    )

    # Sort by newest first
    query = query.order_by(Notification.created_at.desc())

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Count unread
    unread_query = select(func.count()).select_from(
        select(Notification).where(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False)
        ).subquery()
    )
    unread_result = await db.execute(unread_query)
    unread_count = unread_result.scalar() or 0

    # Paginate
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    notifications = result.scalars().all()

    return ServiceResponse(
        success=True,
        data=NotificationListResult(
            notifications=[
                NotificationResponse(
                    id=n.id,
                    user_id=n.user_id,
                    type=n.type,
                    title=n.title,
                    message=n.message,
                    link=n.link,
                    is_read=n.is_read,
                    created_at=int(n.created_at.timestamp() * 1000)
                ) for n in notifications
            ],
            total=total,
            unread_count=unread_count
        )
    )


@router.post("", response_model=ServiceResponse[NotificationResponse])
async def create_notification(
    notification_data: NotificationCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a notification (admin only in production).
    """
    if not current_user or current_user.role != UserRole.ADMIN:
        return ServiceResponse(
            success=False,
            error={
                "code": "FORBIDDEN",
                "message": "Admin only"
            }
        )

    notification = Notification(
        user_id=notification_data.user_id,
        type=notification_data.type,
        title=notification_data.title,
        message=notification_data.message,
        link=notification_data.link,
        expires_at=notification_data.expires_at
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)

    return ServiceResponse(
        success=True,
        data=NotificationResponse(
            id=notification.id,
            user_id=notification.user_id,
            type=notification.type,
            title=notification.title,
            message=notification.message,
            link=notification.link,
            is_read=notification.is_read,
            created_at=int(notification.created_at.timestamp() * 1000)
        )
    )


@router.put("/{notification_id}/read", response_model=ServiceResponse)
async def mark_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark notification as read.
    """
    if not current_user:
        return ServiceResponse(
            success=False,
            error={
                "code": "UNAUTHORIZED",
                "message": "Authentication required"
            }
        )

    # Get notification
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        )
    )
    notification = result.scalar_one_or_none()

    if not notification:
        return ServiceResponse(
            success=False,
            error={
                "code": "NOT_FOUND",
                "message": "Notification not found"
            }
        )

    notification.is_read = True
    await db.commit()

    return ServiceResponse(
        success=True,
        data={"message": "Notification marked as read"}
    )


@router.put("/read-all", response_model=ServiceResponse)
async def mark_all_as_read(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark all notifications as read.
    """
    if not current_user:
        return ServiceResponse(
            success=False,
            error={
                "code": "UNAUTHORIZED",
                "message": "Authentication required"
            }
        )

    # Update all unread notifications
    await db.execute(
        update(Notification)
        .where(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False)
        )
        .values(is_read=True)
    )
    await db.commit()

    return ServiceResponse(
        success=True,
        data={"message": "All notifications marked as read"}
    )


@router.delete("/{notification_id}", response_model=ServiceResponse)
async def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a notification.
    """
    if not current_user:
        return ServiceResponse(
            success=False,
            error={
                "code": "UNAUTHORIZED",
                "message": "Authentication required"
            }
        )

    # Get notification
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        )
    )
    notification = result.scalar_one_or_none()

    if not notification:
        return ServiceResponse(
            success=False,
            error={
                "code": "NOT_FOUND",
                "message": "Notification not found"
            }
        )

    await db.delete(notification)
    await db.commit()

    return ServiceResponse(
        success=True,
        data={"message": "Notification deleted"}
    )


@router.get("/unread-count", response_model=ServiceResponse[UnreadCountResponse])
async def get_unread_count(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get unread notification count.
    """
    if not current_user:
        return ServiceResponse(
            success=False,
            error={
                "code": "UNAUTHORIZED",
                "message": "Authentication required"
            }
        )

    # Count unread
    result = await db.execute(
        select(func.count()).select_from(Notification).where(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False)
        )
    )
    count = result.scalar() or 0

    return ServiceResponse(
        success=True,
        data=UnreadCountResponse(count=count)
    )