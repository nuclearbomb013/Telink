---
name: fix-skill
description: Bug fixing workflow skill. Fixes bugs from TODOLIST.md respecting scope/locked files, runs tests, reports results, and optionally pushes to GitHub.
---

# Fix Skill

Bug fixing workflow skill. Fixes bugs from TODOLIST.md respecting scope/locked files, runs tests, reports results, and optionally pushes to GitHub.

## Usage

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `bug_id` | string | next pending | Bug ID to fix (e.g., "P0-1") |
| `push_to_github` | boolean | false | Push changes to GitHub after fix |
| `skip_test` | boolean | false | Skip running tests |
| `force` | boolean | false | Fix even if blocked (`[!]`) |
| `called_by` | string | null | Parent skill name (internal use) |
| `skip_doc_update` | boolean | false | Skip auto-doc-update (when called by review-skill) |

### Commands

```bash
# Fix next pending bug in queue
/fix-skill

# Fix specific bug
/fix-skill {"bug_id": "P0-1"}

# Fix and push to GitHub
/fix-skill {"push_to_github": true}

# Fix blocked bug (force)
/fix-skill {"bug_id": "P0-3", "force": true}

# Called by review-skill (internal)
/fix-skill {"bug_id": "P0-1", "called_by": "review-skill", "skip_doc_update": true}
```

---

## Workflow

### Phase 1: INIT

1. Read `E:\KIMI_web\problem_fixing\TODOLIST.md`
2. Find target bug:
   - If `bug_id` provided: locate that bug
   - If `called_by: "review-skill"`: read **Fix Queue** from "Current Review Session"
   - Otherwise: find first `[ ]` (pending) in recommended order
3. Check dependencies:
   - If `[G]` GLOBAL: warn about cascade, proceed
   - If `[!]` Blocked: check `depends_on` in scope config
   - If dependencies not complete AND not `force`: STOP with error
4. Load scope config for target bug from TODOLIST.md
5. Update `active_task.md` with bug info

### Phase 2: FIX

1. Read allowed files from scope config
2. **NEVER modify locked files**
3. Read source code at bug location
4. Apply fix according to `strategy` in scope config
5. Create new files if `requires_new` specified
6. Write changes to `active_task.md` Code section

### Phase 3: TEST

1. Check if `test` hook defined in scope config
2. If test hook exists AND `skip_test` is false:
   - Run test command
   - Capture result
   - If FAIL: report and ask user to proceed or rollback
3. Write test result to `active_task.md`

### Phase 4: REPORT

Generate structured report:

```
=== FIX REPORT ===
Bug ID: P0-X
Status: SUCCESS / FAILED
Files Modified:
  - path/to/file1.py
  - path/to/file2.py
Files Created:
  - path/to/new_file.py (if any)
Test Result: PASS / FAIL / SKIPPED
Cascade Warning:
  - P0-X is GLOBAL, will affect: P0-Y, P0-Z
Next Recommended: P0-Y
=== END REPORT ===
```

### Phase 5: UPDATE TODOLIST.MD

1. Find bug row in TODOLIST.md
2. Update status:
   - SUCCESS: `[x]`
   - FAILED: Keep `[~]` or revert to `[ ]`
3. Update Fix History table with date, ID, summary
4. Update Statistics section
5. **If called by review-skill**: Update "Current Review Session" Progress:
   - Increment Fixed or Failed count
   - Decrement Pending count
   - Remove fixed bug from Fix Queue

### Phase 6: GITHUB PUSH (optional)

If `push_to_github` is true:
1. Stage modified files
2. Create commit with message:
   - Format: `fix(backend): <bug_id> - <summary>`
   - Example: `fix(backend): P0-1 - Use env var for SECRET_KEY`
3. Push to `main` branch
4. Report commit hash

### Phase 7: AUTO-DOC-UPDATE

Call auto-doc-update skill:
```
/auto-doc-update {
  "context_type": "bug_fix",
  "summary": "<bug_id>: <fix summary>",
  "push_to_github": <same as input>
}
```

### Phase 8: PROMPT USER

After completion, prompt user:
```
Fix complete for P0-X.
[ ] Clear context and continue to next bug?
[ ] Review changes before proceeding?
[ ] Stop here.
```

---

## Scope Rules

### Allowed Files
- ONLY modify files listed in `allowed` array
- If need to modify other files, ASK USER first

### Locked Files
- NEVER modify files in `locked` array
- If fix requires locked file, report BLOCKED

### New Files
- Create files specified in `requires_new`
- Place in correct directory structure

---

## Cascade Handling

When fixing `[G]` GLOBAL bugs:

1. **Before fix**: Display cascade warning
   ```
   WARNING: P0-10 is GLOBAL
   This fix will enable/unblock:
   - P0-3 (was blocked by P0-10)
   - P0-4 (was blocked by P0-10)
   ```

2. **After fix**: Update dependent bugs' status
   - Change `[!]` to `[ ]` for unblocked bugs
   - Log in Fix History

---

## Error Handling

| Error | Action |
|-------|--------|
| Bug not found | Report and suggest valid IDs |
| Dependency not met | Report dependency, suggest fixing it first |
| File locked | Report, ask user to update scope config |
| Test failed | Report, ask to proceed or rollback |
| Git push failed | Report error, keep local changes |

---

## File References

| Purpose | Path |
|---------|------|
| Bug List + Scope | `E:\KIMI_web\problem_fixing\TODOLIST.md` |
| Active Task | `E:\KIMI_web\problem_fixing\active_task.md` |
| Backend Dir | `E:\KIMI_web\backend` |
| GitHub Repo | `https://github.com/nuclearbomb013/Telink.git` |

---

## Example Session

```
User: /fix-skill {"bug_id": "P0-1"}

Claude:
=== INIT ===
Loading TODOLIST.md...
Target: P0-1 Hardcoded SECRET_KEY
Status: [ ] Pending
Scope: allowed=[app/config.py, .env.example], locked=[app/main.py]
Strategy: Use os.environ.get with fallback

=== FIX ===
Reading app/config.py:23...
Current: SECRET_KEY = "hardcoded-secret"
Fixed: SECRET_KEY = os.environ.get("SECRET_KEY", "dev-fallback")

=== TEST ===
Running: pytest tests/test_config.py -v
Result: PASS

=== REPORT ===
Bug ID: P0-1
Status: SUCCESS
Files Modified: app/config.py
Test Result: PASS
Next Recommended: P0-2

=== UPDATE ===
TODOLIST.md updated: P0-1 → [x]

Push to GitHub? (push_to_github was not set)

=== DONE ===
Run /clear to reset workspace, or continue with P0-2
```

---

## Return Format (for review-skill)

When `called_by` is set, return structured JSON for programmatic use:

```json
{
  "success": true,
  "bug_id": "P0-1",
  "status": "fixed",
  "files_modified": ["app/config.py"],
  "files_created": [],
  "test_result": "pass",
  "cascade_warning": null,
  "next_recommended": "P0-2",
  "error": null
}
```

### Failure Return

```json
{
  "success": false,
  "bug_id": "P0-3",
  "status": "blocked",
  "files_modified": [],
  "files_created": [],
  "test_result": null,
  "cascade_warning": null,
  "next_recommended": null,
  "error": "Dependency P0-10 not fixed"
}
```

---

## Coordination with review-skill

When `called_by: "review-skill"`:

1. **Skip Phase 6 (GitHub Push)** - review-skill handles batch push
2. **Skip Phase 7 (auto-doc-update)** if `skip_doc_update: true`
3. **Return structured JSON** instead of user prompt
4. **Don't prompt user** - return immediately after Phase 5