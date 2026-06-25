"""
Test Models - P0-5 and P0-6: Unique Constraints
"""



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


class TestFollowConstraints:
    """Follow model should enforce uniqueness and no self-follow at DB level."""

    def test_follow_has_unique_pair_and_no_self_check(self):
        from sqlalchemy import CheckConstraint, UniqueConstraint
        from app.models.follow import Follow

        table_args = Follow.__table_args__
        assert any(
            isinstance(arg, UniqueConstraint)
            and {"follower_id", "following_id"} == {col.name for col in arg.columns}
            for arg in table_args
        )
        assert any(
            isinstance(arg, CheckConstraint)
            and arg.name == "ck_follows_no_self"
            for arg in table_args
        )


class TestMigrationModelConsistency:
    """Model metadata should match explicit migration contracts for key tables."""

    def test_favorite_table_name_matches_migration(self):
        from app.models.favorite import Favorite

        assert Favorite.__tablename__ == "user_favorites"

    def test_article_slug_is_unique_in_model(self):
        from app.models.article import Article

        assert Article.__table__.c.slug.unique is True

    def test_message_indexes_match_query_patterns(self):
        from app.models.message import Message

        index_names = {idx.name for idx in Message.__table__.indexes}
        assert "ix_messages_sender_receiver" in index_names
        assert "ix_messages_receiver_sender" in index_names
