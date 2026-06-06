"""Alembic environment configuration for async PostgreSQL migrations."""
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine

# Alembic Config object
config = context.config

# Set up logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import all models so autogenerate can detect them
# noqa: E402 - model imports must follow config initialization
from app.db.session import Base  # noqa: E402
from app.models.base import BaseModel  # noqa: E402, F401
from app.models.user import User, RefreshToken, PasswordResetToken  # noqa: E402, F401
from app.models.post import Post, PostTag, PostLike  # noqa: E402, F401
from app.models.comment import Comment, CommentLike  # noqa: E402, F401
from app.models.moment import Moment, MomentLike, MomentComment  # noqa: E402, F401
from app.models.notification import Notification  # noqa: E402, F401
from app.models.token_blacklist import TokenBlacklist  # noqa: E402, F401

target_metadata = Base.metadata

# Database URL from environment or app config
def get_db_url():
    from app.config import settings
    return settings.DATABASE_URL


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = get_db_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in 'online' mode with async engine."""
    connectable = create_async_engine(
        get_db_url(),
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    """Run async migrations."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
