"""
Test Models - P0-5 and P0-6: Unique Constraints
"""

import pytest


class TestPostLikeUnique:
    """Test PostLike unique constraint (P0-5)."""

    def test_postlike_has_unique_constraint(self):
        """Test that PostLike model has unique constraint defined."""
        from app.models.post import PostLike

        # Check __table_args__ exists
        assert hasattr(PostLike, "__table_args__")

        # Check that unique constraint is defined
        table_args = PostLike.__table_args__
        assert table_args is not None

        # Find the UniqueConstraint
        from sqlalchemy import UniqueConstraint
        has_unique = any(
            isinstance(arg, UniqueConstraint) or
            (hasattr(arg, '__class__') and arg.__class__.__name__ == 'UniqueConstraint')
            for arg in table_args
        )
        assert has_unique, "PostLike should have UniqueConstraint for (user_id, post_id)"

    def test_postlike_unique_constraint_name(self):
        """Test that unique constraint has explicit name."""
        from app.models.post import PostLike
        from sqlalchemy import UniqueConstraint

        table_args = PostLike.__table_args__
        for arg in table_args:
            if isinstance(arg, UniqueConstraint):
                assert arg.name is not None, "UniqueConstraint should have explicit name"
                assert "post_likes" in arg.name.lower() or "user_post" in arg.name.lower()


class TestCommentLikeUnique:
    """Test CommentLike unique constraint (P0-6)."""

    def test_commentlike_has_unique_constraint(self):
        """Test that CommentLike model has unique constraint defined."""
        from app.models.comment import CommentLike

        # Check __table_args__ exists
        assert hasattr(CommentLike, "__table_args__")

        # Check that unique constraint is defined
        table_args = CommentLike.__table_args__
        assert table_args is not None

        # Find the UniqueConstraint
        from sqlalchemy import UniqueConstraint
        has_unique = any(
            isinstance(arg, UniqueConstraint) or
            (hasattr(arg, '__class__') and arg.__class__.__name__ == 'UniqueConstraint')
            for arg in table_args
        )
        assert has_unique, "CommentLike should have UniqueConstraint for (user_id, comment_id)"

    def test_commentlike_unique_constraint_name(self):
        """Test that unique constraint has explicit name."""
        from app.models.comment import CommentLike
        from sqlalchemy import UniqueConstraint

        table_args = CommentLike.__table_args__
        for arg in table_args:
            if isinstance(arg, UniqueConstraint):
                assert arg.name is not None, "UniqueConstraint should have explicit name"
                assert "comment_likes" in arg.name.lower() or "user_comment" in arg.name.lower()