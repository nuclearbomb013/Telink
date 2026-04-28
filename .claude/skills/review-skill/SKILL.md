---
name: review-skill
description: Master orchestrator skill. Reviews code via detect-skill, fixes bugs via fix-skill, verifies via detect-skill, saves via auto-doc-update, and pushes to GitHub.
---

# Review Skill

Master orchestrator skill that coordinates the complete code quality pipeline:
**Review → Fix → Verify → Save → Push**

## Usage

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `push_to_github` | boolean | false | Push all changes to GitHub after pipeline |
| `stop_on_failure` | boolean | false | Stop entire pipeline if any fix fails |
| `max_fixes` | integer | 10 | Maximum number of bugs to fix in one session |
| `scope` | string | "all" | Detection scope passed to detect-skill: "all", "backend", "frontend", "security" |
| `resume` | boolean | false | Resume from last interrupted review session |

### Commands

```bash
# Full pipeline (detect + fix + verify + save)
/review-skill

# Full pipeline with GitHub push
/review-skill {"push_to_github": true}

# Resume from interrupted session
/review-skill {"resume": true}

# Limit scope and fix count
/review-skill {"scope": "backend", "max_fixes": 5}

# Stop on first failure
/review-skill {"stop_on_failure": true}
```

---

## Pipeline Architecture (5 Phases)

```
REVIEW-SKILL (Master Orchestrator)
│
├── Phase 1: REVIEW  ─── /detect-skill {"mode": "detect", "scope": "all", "output_format": "json", "called_by": "review-skill"}
│   ├── Parse JSON: extract recommended_fix_order, new_issues_added, detection results
│   └── Write "Current Review Session" section to TODOLIST.md with Fix Queue
│
├── Phase 2: FIX ────── For each bug in Fix Queue: /fix-skill {"bug_id": "<id>", "called_by": "review-skill", "skip_doc_update": true}
│   ├── Process bugs sequentially in recommended_fix_order
│   ├── Collect per-fix results (success/failed/blocked)
│   └── On failure (stop_on_failure=true): halt pipeline, report progress
│
├── Phase 3: VERIFY ─── /detect-skill {"mode": "test"}
│   ├── Run pytest (backend) + ESLint + TypeScript build (frontend)
│   ├── Compare results with pre-fix baseline
│   └── Flag any new regressions introduced by fixes
│
├── Phase 4: SAVE ───── /auto-doc-update {"context_type": "bug_fix", "summary": "<summary>", "push_to_github": false}
│   └── Single batch doc update summarizing all fixes in this session
│
└── Phase 5: PUSH ───── (if push_to_github=true)
    ├── git add all modified files
    ├── git commit with batch message listing all fixed Bug IDs
    └── git push origin main
```

---

## Phase 1: REVIEW (Detection)

### 1.1 Launch Detection

Call detect-skill with the review-skill coordination protocol:

```
/detect-skill {
  "mode": "detect",
  "scope": "<scope>",
  "add_to_todolist": true,
  "run_tests": false,
  "called_by": "review-skill",
  "output_format": "json"
}
```

### 1.2 Parse JSON Response

detect-skill returns structured JSON. Extract these fields:

```json
{
  "success": true,
  "session_id": "detect-20260322-1700",
  "detection": {
    "total_issues": 28,
    "new_issues": 4,
    "by_severity": { "critical": 1, "high": 2, "medium": 8, "low": 17 }
  },
  "tests": {
    "backend_passed": 23,
    "backend_failed": 2,
    "frontend_success": true
  },
  "new_issues_added": ["P0-34", "P1-31", "P1-32", "P2-33"],
  "todolist_updated": true,
  "recommended_fix_order": ["P0-34", "P1-32", "P1-31", "P2-33"],
  "error": null
}
```

### 1.3 Build Fix Queue

Create or update the "Current Review Session" in TODOLIST.md:

```markdown
## Current Review Session

> Session ID: review-20260329-0900
> Pipeline status: Phase 2 (FIX) - 2/5 bugs fixed

**Fix Queue**:
| # | Bug ID | Status | Summary |
|---|--------|--------|---------|
| 1 | P0-34 | Pending | Possible SQL injection |
| 2 | P1-32 | Pending | Missing type annotation |
| 3 | P1-31 | Pending | Unused import |
| 4 | P2-33 | Pending | Deprecated datetime usage |

**Detection Baseline**:
- Total issues before fix: 28
- Test baseline: 23/25 passed, frontend build: ✓

**Progress**:
| Category | Count |
|----------|-------|
| Pending | 5 |
| Fixed | 0 |
| Failed | 0 |
| Skipped | 0 |
```

### 1.4 Determine Fix Scope

Truncate Fix Queue to `max_fixes` entries. Skip:
- Items marked `[!]` (Blocked) with unmet dependencies
- Items already `[x]` (Completed)
- Items without scope config in TODOLIST.md

If no fixable bugs remain, skip to Phase 4.

---

## Phase 2: FIX (Iterative Bug Fixing)

### 2.1 Iteration Protocol

For each bug in Fix Queue (in order):

```
1. Report: "Fixing P0-34 (1/5): Possible SQL injection..."
2. Call: /fix-skill {"bug_id": "P0-34", "called_by": "review-skill", "skip_doc_update": true}
3. Wait for fix-skill completion
4. Parse return JSON
5. Update session progress
6. If success → next bug
   If failed + stop_on_failure=true → halt pipeline
   If failed + stop_on_failure=false → log failure, continue
```

### 2.2 fix-skill Return Parsing

Each fix-skill call returns:

```json
{
  "success": true,
  "bug_id": "P0-34",
  "status": "fixed",          // "fixed" | "failed" | "blocked" | "skipped"
  "files_modified": ["app/config.py"],
  "files_created": [],
  "test_result": "pass",      // "pass" | "fail" | "skipped"
  "cascade_warning": null,    // null | ["P0-3", "P0-4"]
  "next_recommended": "P0-35",
  "error": null
}
```

### 2.3 Session Progress Update

After each fix, update the "Current Review Session" progress:

```
Fixed count ++ (or Failed count ++)
Pending count --
Update Fix Queue status column ("Fixed" / "Failed")
```

### 2.4 Cascade Handling

If fix returns `cascade_warning` (GLOBAL bug was fixed):
1. Check which dependent bugs are now unblocked
2. Update their status from `[!]` to `[ ]` in TODOLIST
3. Append to Fix Queue if `max_fixes` not yet reached
4. Log: "P0-4 was GLOBAL. Unblocked: P0-3, P0-5"

### 2.5 Failure Decision Matrix

| fix-skill Status | stop_on_failure=true | stop_on_failure=false |
|------------------|---------------------|----------------------|
| `fixed` | Continue | Continue |
| `failed` | **HALT pipeline** | Log, continue |
| `blocked` | **HALT pipeline** | Log, skip to next |
| `skipped` | Continue | Continue |

---

## Phase 3: VERIFY (Regression Check)

### 3.1 Run Tests

Call detect-skill in test mode:

```
/detect-skill {"mode": "test", "scope": "all"}
```

### 3.2 Compare with Baseline

Compare Phase 3 results with Phase 1 baseline:

```
TEST RESULTS COMPARISON:
                  Before Fix    After Fix    Delta
Backend Tests:    23/25 PASS    24/25 PASS   +1 ✓
Frontend ESLint:  29 warnings   29 warnings  0
Frontend Build:   ✓ PASS        ✓ PASS       -

REGRESSION CHECK: ✓ No new regressions detected
```

### 3.3 If Regression Found

If tests degrade after fixes:
1. Report which tests now fail
2. List which fixes likely caused it (based on modified files)
3. Option: rollback the offending fix, or proceed with known regression
4. Prompt user for action

---

## Phase 4: SAVE (Documentation)

### 4.1 Generate Session Summary

```markdown
Session ID: review-20260329-0900
Duration: 5 phases
Bugs Fixed: 4/5 (P0-34, P1-32, P1-31, P2-33)
Bugs Failed: 1 (P0-35 - blocked by dependency P0-4)
Tests: 24/25 PASS (was 23/25, +1 improvement)
New Issues: 0 regressions introduced
Files Modified: app/config.py, app/models/user.py, ...
```

### 4.2 Call auto-doc-update

Single batch call summarizing all fixes:

```
/auto-doc-update {
  "context_type": "bug_fix",
  "summary": "Fixed 4 bugs: P0-34 (SQL injection), P1-32 (type annotation), P1-31 (unused import), P2-33 (deprecated datetime)",
  "push_to_github": false
}
```

---

## Phase 5: PUSH (GitHub)

### 5.1 Batch Commit

Only if `push_to_github: true`:

```bash
cd E:\KIMI_web
git add .
git commit -m "$(cat <<'EOF'
fix: review session review-20260329-0900

Fixed bugs: P0-34, P1-32, P1-31, P2-33
Tests: 24/25 passed, no regressions

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
git push origin main
```

### 5.2 Commit Message Format

```
fix: review session <session_id>

Fixed bugs: <comma-separated bug IDs>
Tests: <passed>/<total> passed, <regressions?> regressions

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Session Management

### New Session

When `resume: false` (default):
1. Check if an incomplete "Current Review Session" exists
2. If yes: warn user and ask to either resume or overwrite
3. If no: create new session from Phase 1 detection results

### Resume Session

When `resume: true`:
1. Read "Current Review Session" from TODOLIST.md
2. Check Fix Queue for incomplete items
3. Skip Phase 1 (already detected)
4. Start from Phase 2 at the first Pending/Failed bug
5. If no pending bugs remain: skip to Phase 3

### Session Completion Check

After Phase 2, check:
- Are there remaining pending bugs in Fix Queue?
- If yes AND `stop_on_failure` was not triggered: prompt user
  ```
  Fix Queue has 2 remaining bugs. Continue or stop?
  [ ] Continue fixing (P0-36, P0-37)
  [ ] Proceed to verify with current results
  [ ] Stop and resume later with /review-skill {"resume": true}
  ```

---

## Error Handling & Recovery

| Scenario | Action |
|----------|--------|
| detect-skill fails to run | Report error, halt pipeline, suggest fixing tool chain |
| TODOLIST.md is locked/unavailable | Retry 3x, then halt and report |
| fix-skill returns unexpected JSON | Log warning, mark bug as "unknown", continue |
| Verification reveals regression | Report which fixes caused it, offer rollback option |
| Git push fails (network/auth) | Keep local changes, report commit hash, suggest manual push |
| Pipeline interrupted mid-session | Save current progress to session: resume later with `resume: true` |
| All bugs in Fix Queue are blocked | Report, suggest fixing dependency first |
| No new issues found in Phase 1 | Report clean codebase, skip Phases 2-3, go to Phase 4 |

---

## Return Format

When review-skill completes, output a final summary:

```json
{
  "success": true,
  "session_id": "review-20260329-0900",
  "detection": {
    "total_issues_before": 28,
    "total_issues_after": 24,
    "new_issues_fixed": 4
  },
  "fixes": {
    "total_attempted": 5,
    "fixed": 4,
    "failed": 1,
    "skipped": 0,
    "details": [
      { "bug_id": "P0-34", "status": "fixed", "files": ["app/config.py"] },
      { "bug_id": "P1-32", "status": "fixed", "files": ["app/models/user.py"] },
      { "bug_id": "P1-31", "status": "fixed", "files": ["app/api/v1/users.py"] },
      { "bug_id": "P2-33", "status": "fixed", "files": ["app/api/v1/auth.py"] },
      { "bug_id": "P0-35", "status": "blocked", "files": [] }
    ]
  },
  "verification": {
    "backend_tests_before": "23/25",
    "backend_tests_after": "24/25",
    "regressions": 0,
    "frontend_build": "PASS"
  },
  "pushed": false,
  "error": null
}
```

---

## Quick Reference

| What | Command |
|------|---------|
| Full pipeline | `/review-skill` |
| Full + push | `/review-skill {"push_to_github": true}` |
| Resume | `/review-skill {"resume": true}` |
| Backend only, 5 fixes | `/review-skill {"scope": "backend", "max_fixes": 5}` |
| Halt on failure | `/review-skill {"stop_on_failure": true}` |

---

## Skill Coordination Summary

| Phase | Skill Called | Parameters | Purpose |
|-------|-------------|------------|---------|
| 1. REVIEW | detect-skill | `mode: "detect"`, `output_format: "json"`, `called_by: "review-skill"` | Static analysis + API contract check |
| 2. FIX | fix-skill (per bug) | `bug_id: "<id>"`, `called_by: "review-skill"`, `skip_doc_update: true` | Apply fixes from TODOLIST scope config |
| 3. VERIFY | detect-skill | `mode: "test"` | Run test suites, check for regressions |
| 4. SAVE | auto-doc-update | `context_type: "bug_fix"`, `summary: "..."` | Batch documentation update |
| 5. PUSH | Git | `add + commit + push` | Single commit for all session changes |

**Key coordination rules**:
- fix-skill is called with `called_by: "review-skill"` → returns JSON, skips user prompt
- fix-skill is called with `skip_doc_update: true` → review-skill batches doc update in Phase 4
- review-skill handles all Git operations in Phase 5, not per-fix
- Session progress is tracked in TODOLIST.md "Current Review Session" section

---

## File References

| Purpose | Path |
|---------|------|
| Bug List + Session | `E:\KIMI_web\problem_fixing\TODOLIST.md` |
| Detect Skill | `E:\KIMI_web\.claude\skills\detect-skill\SKILL.md` |
| Fix Skill | `E:\KIMI_web\.claude\skills\fix-skill\SKILL.md` |
| Auto-Doc Skill | `E:\KIMI_web\.claude\skills\auto-doc-update\SKILL.md` |
| Backend Dir | `E:\KIMI_web\backend` |
| Frontend Dir | `E:\KIMI_web\app` |
| GitHub Repo | `https://github.com/nuclearbomb013/Telink.git` |
