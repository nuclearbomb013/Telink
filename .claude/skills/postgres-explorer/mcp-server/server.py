#!/usr/bin/env python3
"""PostgreSQL Explorer MCP Server — read-only database inspection for debugging.

Reads DATABASE_URL from E:/KIMI_web/backend/.env so it always matches the backend config.
Uses the official MCP Python SDK for reliable stdio transport.
"""

import json
import os
import sys
from pathlib import Path

import asyncpg
from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

env_path = Path("E:/KIMI_web/backend/.env")
load_dotenv(env_path)

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/techink"
)
PG_URL = DATABASE_URL.replace("+asyncpg", "")

# ---------------------------------------------------------------------------
# Database connection (lazy, cached)
# ---------------------------------------------------------------------------

_conn: asyncpg.Connection | None = None


async def get_conn() -> asyncpg.Connection:
    global _conn
    if _conn is None or _conn.is_closed():
        _conn = await asyncpg.connect(PG_URL)
        sys.stderr.write("[postgres-explorer] Connected to PostgreSQL\n")
    return _conn


# ---------------------------------------------------------------------------
# MCP Server
# ---------------------------------------------------------------------------

mcp = FastMCP("postgres-explorer")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_DANGEROUS = ["DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "CREATE", "TRUNCATE"]


def _is_dangerous(sql: str) -> str | None:
    """Return the dangerous keyword found, or None if the query is safe."""
    stripped = sql.strip().upper()
    for kw in _DANGEROUS:
        if stripped.startswith(kw) or f" {kw} " in stripped:
            return kw
    return None


async def _get_table_names(conn: asyncpg.Connection) -> list[str]:
    rows = await conn.fetch(
        "SELECT tablename FROM pg_catalog.pg_tables "
        "WHERE schemaname = 'public' ORDER BY tablename"
    )
    return [r["tablename"] for r in rows]


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------


@mcp.tool()
async def db_query(sql: str) -> str:
    """Execute a read-only SQL query against the techink database.

    Returns results as JSON array of rows. Use for debugging: check data,
    verify relationships, count records, find anomalies.
    """
    dangerous = _is_dangerous(sql)
    if dangerous:
        return json.dumps(
            {
                "error": f"Write operation '{dangerous}' is blocked. "
                f"Use psql or backend API to modify data. This tool is read-only.",
                "hint": "Run 'psql -U postgres -d techink' if you need to modify data.",
            },
            ensure_ascii=False,
        )

    conn = await get_conn()
    rows = await conn.fetch(sql)
    result = [dict(r) for r in rows]

    if len(result) > 200:
        result = result[:200]
        return json.dumps(
            {
                "rows": result,
                "count": len(result),
                "truncated": True,
                "note": "Result truncated to 200 rows. Add WHERE/LIMIT for more specific queries.",
            },
            ensure_ascii=False,
            default=str,
        )

    return json.dumps({"rows": result, "count": len(result)}, ensure_ascii=False, default=str)


@mcp.tool()
async def db_tables() -> str:
    """List all tables in the techink database with their row counts.

    Quick overview of the database state.
    """
    conn = await get_conn()
    rows = await conn.fetch(
        """
        SELECT relname AS tablename, n_live_tup AS estimated_rows
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
        ORDER BY relname
        """
    )

    tables = []
    for r in rows:
        try:
            count_row = await conn.fetchrow(
                f'SELECT COUNT(*) as cnt FROM "{r["tablename"]}"'
            )
            actual = count_row["cnt"]
        except Exception:
            actual = r["estimated_rows"]
        tables.append({"table": r["tablename"], "row_count": actual})

    return json.dumps(
        {"tables": tables, "database": PG_URL.split("/")[-1]},
        ensure_ascii=False,
        default=str,
    )


@mcp.tool()
async def db_schema(table: str) -> str:
    """Show the column definitions for a specific table.

    Returns column names, data types, nullability, and default values.
    """
    conn = await get_conn()
    rows = await conn.fetch(
        """
        SELECT
            column_name, data_type, is_nullable, column_default,
            character_maximum_length
        FROM information_schema.columns
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
        """,
        table,
    )

    if not rows:
        names = await _get_table_names(conn)
        return json.dumps(
            {"error": f"Table '{table}' not found", "valid_tables": names},
            ensure_ascii=False,
        )

    columns = [
        {
            "column": r["column_name"],
            "type": r["data_type"],
            "nullable": r["is_nullable"] == "YES",
            "default": r["column_default"],
            "max_length": r["character_maximum_length"],
        }
        for r in rows
    ]
    return json.dumps({"table": table, "columns": columns}, ensure_ascii=False, default=str)


@mcp.tool()
async def db_search(term: str) -> str:
    """Quick text search across common columns.

    Searches usernames, post titles, tags, and comment content.
    Finds records containing the given text.
    """
    conn = await get_conn()
    like = f"%{term}%"

    users = await conn.fetch(
        "SELECT id, username, email FROM users WHERE username ILIKE $1 OR email ILIKE $1 LIMIT 10",
        like,
    )
    posts = await conn.fetch(
        "SELECT id, title, category FROM posts WHERE title ILIKE $1 OR content ILIKE $1 LIMIT 10",
        like,
    )
    comments = await conn.fetch(
        "SELECT id, post_id, author_name, LEFT(content, 200) AS content_preview "
        "FROM comments WHERE content ILIKE $1 OR author_name ILIKE $1 LIMIT 10",
        like,
    )

    return json.dumps(
        {
            "term": term,
            "users": [dict(r) for r in users],
            "posts": [dict(r) for r in posts],
            "comments": [dict(r) for r in comments],
        },
        ensure_ascii=False,
        default=str,
    )


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    mcp.run(transport="stdio")
