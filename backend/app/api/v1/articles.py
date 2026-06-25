"""
Articles API - User-submitted articles with draft/review/publish workflow
"""

import re
import secrets
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete, update

from app.api.deps import get_db, get_current_active_user, get_current_user_optional
from app.models.user import User
from app.models.article import Article, ArticleTag, ArticleStatus
from app.schemas.common import ServiceResponse
from app.schemas.article import (
    ArticleCreate,
    ArticleUpdate,
    ArticleResponse,
    ArticleListResponse,
    ArticleListResult,
)

import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/articles", tags=["Articles"])


def generate_slug(title: str) -> str:
    """Generate URL-friendly slug from title."""
    slug = title.lower()
    slug = re.sub(r'\s+', '-', slug)
    slug = re.sub(r'[^\w\-\u4e00-\u9fa5]', '', slug)
    slug = re.sub(r'-+', '-', slug)
    slug = slug.strip('-')
    return slug[:100] or 'article'


async def get_unique_slug(db: AsyncSession, title: str, max_attempts: int = 10) -> str:
    """Generate unique slug for article."""
    base_slug = generate_slug(title)
    slug = base_slug
    counter = 1

    for attempt in range(max_attempts):
        result = await db.execute(select(Article).where(Article.slug == slug))
        if not result.scalar_one_or_none():
            return slug
        counter += 1
        if attempt > 0:
            slug = f"{base_slug}-{counter}-{secrets.randbelow(900) + 100}"
        else:
            slug = f"{base_slug}-{counter}"

    return f"{base_slug}-{int(datetime.now(timezone.utc).timestamp())}"


async def get_unique_slug_for_update(
    db: AsyncSession, title: str, exclude_id: int, max_attempts: int = 10
) -> str:
    """Generate unique slug for article update, excluding current article."""
    base_slug = generate_slug(title)
    slug = base_slug
    counter = 1

    for attempt in range(max_attempts):
        result = await db.execute(
            select(Article).where(Article.slug == slug, Article.id != exclude_id)
        )
        if not result.scalar_one_or_none():
            return slug
        counter += 1
        if attempt > 0:
            slug = f"{base_slug}-{counter}-{secrets.randbelow(900) + 100}"
        else:
            slug = f"{base_slug}-{counter}"

    return f"{base_slug}-{int(datetime.now(timezone.utc).timestamp())}"


async def _batch_fetch_tags(db: AsyncSession, article_ids: list[int]) -> dict[int, list[str]]:
    """Fetch tags for multiple articles in one query. Returns {article_id: [tags]}."""
    if not article_ids:
        return {}
    result = await db.execute(
        select(ArticleTag.article_id, ArticleTag.tag).where(
            ArticleTag.article_id.in_(article_ids)
        )
    )
    mapping: dict[int, list[str]] = {}
    for aid, tag in result:
        mapping.setdefault(aid, []).append(tag)
    return mapping


async def transform_article_to_response(
    article: Article,
    db: AsyncSession | None = None,
    tags: list[str] | None = None,
    tags_map: dict[int, list[str]] | None = None,
) -> dict:
    """Transform Article model to response dict.

    Tags can be provided directly (tags), via a pre-fetched map (tags_map),
    or queried via db. If none are given, falls back to an empty list.
    """
    if tags is not None:
        tag_list = tags
    elif tags_map is not None:
        tag_list = tags_map.get(article.id, [])
    elif db is not None:
        tag_result = await db.execute(
            select(ArticleTag.tag).where(ArticleTag.article_id == article.id)
        )
        tag_list = [row[0] for row in tag_result.fetchall()]
    else:
        tag_list = []

    created_at = article.created_at
    if hasattr(created_at, "timestamp"):
        created_at = int(created_at.timestamp() * 1000)

    updated_at = article.updated_at
    if updated_at and hasattr(updated_at, "timestamp"):
        updated_at = int(updated_at.timestamp() * 1000)

    return {
        "id": article.id,
        "title": article.title,
        "slug": article.slug,
        "content": article.content,
        "excerpt": article.excerpt,
        "subtitle": article.subtitle,
        "cover_image": article.cover_image,
        "author_id": article.author_id,
        "author_name": article.author_name,
        "author_avatar": article.author_avatar,
        "category": article.category,
        "status": article.status,
        "tags": tag_list,
        "views": article.views or 0,
        "likes": article.likes or 0,
        "is_featured": article.is_featured,
        "published_at": article.published_at,
        "created_at": created_at,
        "updated_at": updated_at,
    }


async def _get_article_detail_response(
    article: Article,
    db: AsyncSession,
    increment_views: bool = True,
) -> dict:
    """Build article detail response with tags and optional view increment."""
    tags_map = await _batch_fetch_tags(db, [article.id])
    tag_list = tags_map.get(article.id, [])

    if increment_views:
        # Atomic increment to prevent TOCTOU race under concurrent reads
        await db.execute(
            update(Article)
            .where(Article.id == article.id)
            .values(views=func.coalesce(Article.views, 0) + 1)
        )
        await db.commit()
        # Reload to get the updated view count
        await db.refresh(article)

    return await transform_article_to_response(article, tags=tag_list)


@router.get("", response_model=ServiceResponse[ArticleListResult])
async def get_articles(
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None, description="Filter by status (published only for public)"),
    sortBy: Optional[str] = Query("newest", description="newest|oldest|popular"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Get published articles list. Public endpoint — only published articles visible."""
    query = select(Article).where(Article.status == ArticleStatus.PUBLISHED.value)

    if category:
        query = query.where(Article.category == category)

    if search:
        search_filter = f"%{search}%"
        query = query.where(
            (Article.title.ilike(search_filter))
            | (Article.content.ilike(search_filter))
            | (Article.excerpt.ilike(search_filter))
        )

    # Sorting
    if sortBy == "oldest":
        query = query.order_by(Article.created_at.asc())
    elif sortBy == "popular":
        query = query.order_by(Article.views.desc())
    else:
        query = query.order_by(Article.created_at.desc())

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    articles = result.scalars().all()

    # Batch-fetch tags for all articles on this page
    tags_map = await _batch_fetch_tags(db, [a.id for a in articles])

    article_list = []
    for article in articles:
        data = await transform_article_to_response(article, tags_map=tags_map)
        article_list.append(ArticleListResponse(**data))

    total_pages = (total + limit - 1) // limit if total > 0 else 0

    return ServiceResponse(
        success=True,
        data=ArticleListResult(
            articles=article_list,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        ),
    )


@router.get("/slug/{slug}", response_model=ServiceResponse[ArticleResponse])
async def get_article_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a published article by slug. Public endpoint."""
    result = await db.execute(
        select(Article).where(Article.slug == slug, Article.status == ArticleStatus.PUBLISHED.value)
    )
    article = result.scalar_one_or_none()

    if not article:
        return ServiceResponse(
            success=False,
            error={"code": "NOT_FOUND", "message": "Article not found or not published"},
        )

    return ServiceResponse(
        success=True,
        data=ArticleResponse(**await _get_article_detail_response(article, db, increment_views=True)),
    )


@router.get("/me", response_model=ServiceResponse[ArticleListResult])
async def get_my_articles(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's articles (including drafts). Requires authentication."""
    query = select(Article).where(Article.author_id == current_user.id)

    if status:
        query = query.where(Article.status == status)

    query = query.order_by(Article.created_at.desc())

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    articles = result.scalars().all()

    tags_map = await _batch_fetch_tags(db, [a.id for a in articles])

    article_list = [
        ArticleListResponse(**await transform_article_to_response(a, tags_map=tags_map))
        for a in articles
    ]
    total_pages = (total + limit - 1) // limit if total > 0 else 0

    return ServiceResponse(
        success=True,
        data=ArticleListResult(
            articles=article_list,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        ),
    )


@router.get("/{article_id}", response_model=ServiceResponse[ArticleResponse])
async def get_article_by_id(
    article_id: int,
    current_user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """Get article by ID. Published articles are public; drafts require author login."""
    result = await db.execute(select(Article).where(Article.id == article_id))
    article = result.scalar_one_or_none()

    if not article:
        return ServiceResponse(
            success=False,
            error={"code": "NOT_FOUND", "message": "Article not found"},
        )

    # Published articles are visible to everyone
    if article.status == ArticleStatus.PUBLISHED.value:
        return ServiceResponse(
            success=True,
            data=ArticleResponse(**await _get_article_detail_response(article, db, increment_views=True)),
        )

    # Draft/pending — only the author can view
    if not current_user or article.author_id != current_user.id:
        return ServiceResponse(
            success=False,
            error={"code": "NOT_FOUND", "message": "Article not found"},
        )

    return ServiceResponse(
        success=True,
        data=ArticleResponse(**await _get_article_detail_response(article, db, increment_views=False)),
    )


@router.post("", response_model=ServiceResponse[ArticleResponse])
async def create_article(
    article_data: ArticleCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new article. Requires authentication."""
    max_retries = 3

    for attempt in range(max_retries):
        try:
            slug = await get_unique_slug(db, article_data.title)

            now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)
            article = Article(
                title=article_data.title,
                slug=slug,
                content=article_data.content,
                excerpt=article_data.excerpt,
                subtitle=article_data.subtitle,
                cover_image=article_data.cover_image,
                author_id=current_user.id,
                author_name=current_user.username,
                author_avatar=current_user.avatar,
                category=article_data.category,
                status=article_data.status,
                published_at=now_ms if article_data.status == ArticleStatus.PUBLISHED.value else None,
            )
            db.add(article)
            await db.flush()

            # Add tags
            if article_data.tags:
                for tag in article_data.tags:
                    tag_text = tag.strip()
                    if tag_text:
                        db.add(ArticleTag(
                            article_id=article.id,
                            tag=tag_text[:50],
                            created_at=now_ms,
                        ))

            await db.flush()
            await db.refresh(article)
            await db.commit()
            return ServiceResponse(
                success=True,
                data=ArticleResponse(**await transform_article_to_response(article, db)),
            )
        except Exception as e:
            logger.error("create_article error: %s", e, exc_info=True)
            await db.rollback()
            if attempt == max_retries - 1:
                raise
            continue

    return ServiceResponse(
        success=False,
        error={"code": "CREATE_FAILED", "message": "Failed to create article after retries"},
    )


@router.put("/{article_id}", response_model=ServiceResponse[ArticleResponse])
async def update_article(
    article_id: int,
    article_data: ArticleUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an article. Only the author can update."""
    result = await db.execute(select(Article).where(Article.id == article_id))
    article = result.scalar_one_or_none()

    if not article:
        return ServiceResponse(
            success=False,
            error={"code": "NOT_FOUND", "message": "Article not found"},
        )

    if article.author_id != current_user.id:
        return ServiceResponse(
            success=False,
            error={"code": "FORBIDDEN", "message": "You can only edit your own articles"},
        )

    # Update fields
    if article_data.title is not None:
        article.title = article_data.title
        article.slug = await get_unique_slug_for_update(db, article_data.title, article.id)

    if article_data.content is not None:
        article.content = article_data.content
    if article_data.excerpt is not None:
        article.excerpt = article_data.excerpt
    if article_data.subtitle is not None:
        article.subtitle = article_data.subtitle
    if article_data.cover_image is not None:
        article.cover_image = article_data.cover_image
    if article_data.category is not None:
        article.category = article_data.category

    # Handle status change
    if article_data.status is not None:
        article.status = article_data.status
        if article_data.status == ArticleStatus.PUBLISHED.value and not article.published_at:
            article.published_at = int(datetime.now(timezone.utc).timestamp() * 1000)

    # Update tags
    if article_data.tags is not None:
        # Delete existing tags
        await db.execute(delete(ArticleTag).where(ArticleTag.article_id == article.id))

        # Add new tags
        now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)
        for tag in article_data.tags:
            tag_text = tag.strip()
            if tag_text:
                db.add(ArticleTag(
                    article_id=article.id,
                    tag=tag_text[:50],
                    created_at=now_ms,
                ))

    await db.flush()
    await db.commit()
    return ServiceResponse(
        success=True,
        data=ArticleResponse(**await transform_article_to_response(article, db)),
    )


@router.delete("/{article_id}", response_model=ServiceResponse[dict])
async def delete_article(
    article_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an article. Only the author or admin can delete."""
    result = await db.execute(select(Article).where(Article.id == article_id))
    article = result.scalar_one_or_none()

    if not article:
        return ServiceResponse(
            success=False,
            error={"code": "NOT_FOUND", "message": "Article not found"},
        )

    if article.author_id != current_user.id and current_user.role != "admin":
        return ServiceResponse(
            success=False,
            error={"code": "FORBIDDEN", "message": "You can only delete your own articles"},
        )

    await db.delete(article)
    await db.flush()
    await db.commit()

    return ServiceResponse(
        success=True,
        data={"message": "Article deleted successfully", "id": article_id},
    )


@router.post("/{article_id}/publish", response_model=ServiceResponse[ArticleResponse])
async def publish_article(
    article_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Publish an article (change status from draft/pending to published). Author only."""
    result = await db.execute(select(Article).where(Article.id == article_id))
    article = result.scalar_one_or_none()

    if not article:
        return ServiceResponse(
            success=False,
            error={"code": "NOT_FOUND", "message": "Article not found"},
        )

    if article.author_id != current_user.id and current_user.role != "admin":
        return ServiceResponse(
            success=False,
            error={"code": "FORBIDDEN", "message": "You can only publish your own articles"},
        )

    article.status = ArticleStatus.PUBLISHED.value
    if not article.published_at:
        article.published_at = int(datetime.now(timezone.utc).timestamp() * 1000)

    await db.flush()
    await db.commit()
    return ServiceResponse(
        success=True,
        data=ArticleResponse(**await transform_article_to_response(article, db)),
    )
