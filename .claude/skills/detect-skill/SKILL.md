---
name: detect-skill
description: Automated bug detection and testing skill. Runs static analysis (ruff/mypy/bandit/eslint), API contract validation (frontend-backend type matching), executes test suites (pytest/npm), discovers new issues, and updates TODOLIST.md. Integrates with review-skill and fix-skill for complete bug fixing pipeline.
---

# Detect-Skill

Automated bug detection and testing skill. Runs static analysis, **API contract validation**, executes test suites, discovers new issues, and updates TODOLIST.md. Integrates with review-skill and fix-skill for complete bug fixing pipeline.

## Usage

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `mode` | string | "full" | Operation mode: "detect", "test", "full", "report" |
| `scope` | string | "all" | Detection scope: "all", "backend", "frontend", "security", "contract" |
| `add_to_todolist` | boolean | true | Add discovered issues to TODOLIST.md |
| `run_tests` | boolean | true | Run test suites after detection |
| `fail_fast` | boolean | false | Stop on first test failure |
| `called_by` | string | null | Parent skill name (internal use) |
| `output_format` | string | "table" | Output format: "table", "json", "markdown" |

### Commands

```bash
# Full detection and testing (includes contract validation)
/detect-skill

# Detect only (no tests)
/detect-skill {"mode": "detect"}

# Run tests only
/detect-skill {"mode": "test"}

# Backend security scan
/detect-skill {"scope": "security"}

# API Contract validation only (cross-cutting)
/detect-skill {"scope": "contract"}

# Generate report only
/detect-skill {"mode": "report"}

# Called by review-skill (internal)
/detect-skill {"mode": "full", "called_by": "review-skill", "output_format": "json"}
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DETECT-SKILL                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   DETECT    │───►│  CONTRACT   │───►│    TEST     │───►│   REPORT    │  │
│  │             │    │             │    │             │    │             │  │
│  │ - Backend   │    │ - API Schema│    │ - Frontend  │    │ - Generate  │  │
│  │   (Ruff/    │    │   Matching  │    │   (ESLint)  │    │   Report    │  │
│  │   MyPy/     │    │ - Field Name│    │ - Backend   │    │ - Update    │  │
│  │   Bandit)   │    │   Style     │    │   (pytest)  │    │   TODOLIST  │  │
│  │ - Frontend  │    │ - Type      │    │ - Coverage  │    │ - Return    │  │
│  │   (ESLint)  │    │   Compatibility│  │             │    │   Results   │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
│         │                  │                  │                  │          │
│         ▼                  ▼                  ▼                  ▼          │
│    Static Issues    Contract Issues    Test Results       Final Report      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Workflow Phases

### Phase 1: INIT

1. **Load Configuration**:
   - Read `E:\KIMI_web\problem_fixing\TODOLIST.md` for existing bugs
   - Check virtual environment: `E:\KIMI_web\.venv`
   - Verify tools availability

2. **Verify Tool Chain**:

   **Backend Tools**:
   ```bash
   # Check Python virtual environment
   E:\KIMI_web\.venv\Scripts\python.exe --version

   # Check pytest
   E:\KIMI_web\.venv\Scripts\pytest.exe --version

   # Check linters
   E:\KIMI_web\.venv\Scripts\ruff.exe --version
   E:\KIMI_web\.venv\Scripts\mypy.exe --version
   E:\KIMI_web\.venv\Scripts\bandit.exe --version
   ```

   **Frontend Tools**:
   ```bash
   cd E:\KIMI_web\app && npm --version
   cd E:\KIMI_web\app && npx eslint --version
   ```

3. **Initialize Detection Context**:
   - Create detection session ID
   - Set timestamp for report

---

### Phase 2: DETECT

**Purpose**: Run static analysis tools to discover code issues

#### 2.1 Backend Detection

**Step 1: Ruff Linter (Python)**
```bash
E:\KIMI_web\.venv\Scripts\ruff.exe check E:\KIMI_web\backend\app --output-format json
```

**Categories Detected**:
- F: Pyflakes (unused imports, variables)
- E: pycodestyle errors
- W: pycodestyle warnings
- I: isort (import sorting)
- N: pep8-naming
- UP: pyupgrade
- B: flake8-bugbear
- SIM: flake8-simplify

**Step 2: MyPy Type Checking**

NOTE: Must run from `backend/` directory with `mypy.ini` to avoid 200+ false positives from SQLAlchemy Column types.
```bash
cd E:\KIMI_web\backend && E:\KIMI_web\.venv\Scripts\mypy.exe .
```

**Step 3: Bandit Security Scan**
```bash
E:\KIMI_web\.venv\Scripts\bandit.exe -r E:\KIMI_web\backend\app -f txt
```

**Security Issues Detected**:
- B105: hardcoded password string
- B106: hardcoded password function argument
- B301-B303: insecure deserialization/cryptography
- B307: eval usage
- B608: hardcoded SQL expression
- And more security patterns...

#### 2.2 Frontend Detection

**Step 1: ESLint**
```bash
cd E:\KIMI_web\app && npm run lint
```

**Categories Detected**:
- @typescript-eslint: TypeScript-specific issues
- react-hooks: React Hooks rule violations
- no-unused-vars: Unused variables
- no-explicit-any: TypeScript any usage

**Step 2: TypeScript Build Check**
```bash
cd E:\KIMI_web\app && npm run build
```

**Detects**:
- Type errors
- Missing imports
- Build failures

#### 2.3 API Contract Detection (NEW - Cross-cutting)

**Purpose**: Compare backend Pydantic schemas with frontend TypeScript types to find mismatches.

**Files to Compare**:

| Backend Schema | Frontend Type | Location |
|----------------|---------------|----------|
| `backend/app/schemas/auth.py` | `app/src/lib/apiClient.ts` | AuthUser, TokenData |
| `backend/app/schemas/user.py` | `app/src/lib/apiClient.ts` | UserPublic, UserStats |
| `backend/app/schemas/post.py` | `app/src/lib/apiClient.ts` | Post, PostListResponse |
| `backend/app/schemas/comment.py` | `app/src/lib/apiClient.ts` | Comment |
| `backend/app/schemas/notification.py` | `app/src/lib/apiClient.ts` | Notification |

**Detection Steps**:

1. **Extract Backend Schemas**:
   - Read each `backend/app/schemas/*.py` file
   - Parse Pydantic model field names and types
   - Note: Backend uses `snake_case` by default

2. **Extract Frontend Types**:
   - Read `app/src/lib/apiClient.ts`
   - Parse TypeScript interface field names and types
   - Note: Frontend should use `camelCase` convention

3. **Compare Field Names**:
   - Check if snake_case fields are properly transformed
   - Flag inconsistent naming patterns

4. **Compare Field Types**:
   - Match Python types to TypeScript types
   - Flag type mismatches

**Type Mapping Reference**:

| Python (Pydantic) | TypeScript |
|-------------------|------------|
| `int` | `number` |
| `str` | `string` |
| `bool` | `boolean` |
| `float` | `number` |
| `Optional[T]` | `T \| undefined` |
| `List[T]` | `T[]` |
| `Dict[str, Any]` | `Record<string, any>` |

**Common Contract Issues**:

| Issue | Example | Severity |
|-------|---------|----------|
| Field name not transformed | `author_id` vs `authorId` | MEDIUM |
| Missing field | Backend has `like_count`, frontend missing | HIGH |
| Extra field | Frontend has `lastActiveAt`, backend doesn't return | LOW |
| Type mismatch | Backend `int`, frontend `string` | HIGH |
| Inconsistent naming style | `postCount` vs `post_count` in same API | MEDIUM |

**Contract Detection Output**:
```
=== API CONTRACT VALIDATION ===

Auth API:
  ✓ TokenData: Field names match (camelCase)
  ✓ AuthUser: Field names match (camelCase)

User API:
  ⚠ UserPublic: snake_case fields need transformation
    - post_count → postCount
    - comment_count → commentCount
    - created_at → joinedAt
  ⚠ UserStats: snake_case fields not transformed

Post API:
  ⚠ Post: snake_case fields not transformed
    - author_id, reply_count, created_at, etc.

Comment API:
  ⚠ Comment: snake_case fields not transformed
    - post_id, author_id, created_at, etc.

Notification API:
  ⚠ Notification: snake_case fields not transformed
    - user_id, is_read, created_at

SUMMARY:
- Total APIs checked: 5
- APIs with issues: 4
- Missing transformations: 15 fields
```

#### 2.4 Issue Classification

Map detected issues to TODOLIST priority:

| Severity | Priority | Examples |
|----------|----------|----------|
| Critical Security | P0 | Hardcoded secrets, SQL injection, eval() |
| High Security | P0-P1 | Weak crypto, missing validation |
| Type Errors | P0-P1 | Build-breaking type issues |
| API Contract Mismatch | P1-P2 | Field name/type mismatch between frontend/backend |
| Lint Errors | P1-P2 | Code quality issues |
| Lint Warnings | P2 | Style issues, minor improvements |

---

### Phase 3: TEST

**Purpose**: Execute test suites and collect results

#### 3.1 Backend Tests

**Run pytest**:
```bash
cd E:\KIMI_web\backend && E:\KIMI_web\.venv\Scripts\pytest.exe tests/ -v --tb=short
```

**Collect Results**:
```
Test Results:
- Total tests: 25
- Passed: 23
- Failed: 2
- Skipped: 0
- Duration: 12.5s
```

#### 3.2 Frontend Tests

**ESLint verification**:
```bash
cd E:\KIMI_web\app && npm run lint
```

**TypeScript Build**:
```bash
cd E:\KIMI_web\app && npm run build
```

---

### Phase 4: UPDATE TODOLIST

**Purpose**: Add newly discovered issues to TODOLIST.md

#### 4.1 Issue Deduplication

Before adding, check if issue already exists:
- Compare file path and line number
- Compare issue description
- Skip if already tracked

#### 4.2 Generate New Bug Entry

Format for new issues:
```markdown
| P1-XX | `[ ]` | <Problem Description> | `<file>:<line>` |
```

Example:
```markdown
| P1-31 | `[ ]` | Unused import os | `app/api/v1/users.py:6` |
| P1-32 | `[ ]` | Missing type annotation | `app/models/user.py:45` |
| P2-33 | `[ ]` | Use of datetime.utcnow | `app/api/v1/auth.py:120` |
| P7-XX | `[ ]` | API field name not transformed | `apiClient.ts:Post` |
```

#### 4.3 Add Scope Config

For each new issue, add scope config:
```yaml
### P1-31: Unused Import
target: P1-31
allowed: [app/api/v1/users.py]
locked: []
strategy: Remove unused import
test: pytest tests/ -v
auto_fix: true
```

#### 4.4 Update Statistics

Update the Stats section in TODOLIST.md with new counts.

---

### Phase 5: REPORT

**Purpose**: Generate comprehensive report

#### 5.1 Detection Report

```
=== DETECTION REPORT ===
Timestamp: 2026-03-22 17:00:00
Scope: all
Session ID: detect-20260322-1700

STATIC ANALYSIS RESULTS:
┌─────────┬───────────────┬─────────────┬──────────┬──────────┐
│ Tool    │ Files Scanned │ Issues Found│ Critical │ Warning  │
├─────────┼───────────────┼─────────────┼──────────┼──────────┤
│ Ruff    │ 25            │ 12          │ 0        │ 12       │
│ MyPy    │ 25            │ 5           │ 2        │ 3        │
│ Bandit  │ 25            │ 3           │ 1        │ 2        │
│ ESLint  │ 45            │ 8           │ 0        │ 8        │
│ TS Build│ 45            │ 0           │ 0        │ 0        │
└─────────┴───────────────┴─────────────┴──────────┴──────────┘

API CONTRACT VALIDATION:
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ API Module  │ Fields      │ Transformed │ Issues      │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ Auth        │ 5           │ 5 ✓         │ 0           │
│ User        │ 8           │ 4 ⚠         │ 4           │
│ Post        │ 15          │ 0 ⚠         │ 15          │
│ Comment     │ 10          │ 0 ⚠         │ 10          │
│ Notification│ 6           │ 0 ⚠         │ 6           │
└─────────────┴─────────────┴─────────────┴─────────────┘

NEW ISSUES FOUND:
┌──────┬─────────────────────────────────┬──────────────────────┬──────────┐
│ ID   │ Problem                         │ Location             │ Severity │
├──────┼─────────────────────────────────┼──────────────────────┼──────────┤
│ P1-31│ Unused import os                │ app/api/v1/users.py:6│ LOW      │
│ P1-32│ Missing type annotation         │ app/models/user.py:45│ MEDIUM   │
│ P7-83│ Post API fields not transformed │ apiClient.ts:341     │ MEDIUM   │
└──────┴─────────────────────────────────┴──────────────────────┴──────────┘

TEST RESULTS:
┌─────────┬───────────────┬─────────┬─────────┬──────────┐
│ Suite   │ Total         │ Passed  │ Failed  │ Duration │
├─────────┼───────────────┼─────────┼─────────┼──────────┤
│ Backend │ 25            │ 23      │ 2       │ 12.5s    │
│ Frontend│ N/A (lint)    │ -       │ -       │ 3.2s     │
└─────────┴───────────────┴─────────┴─────────┴──────────┘

SUMMARY:
- Total Issues Found: 28 (4 new)
- Critical: 1 (new)
- High: 2
- Medium: 8
- Low: 17
- API Contract Issues: 35 fields need transformation
- Tests: 23/25 passed (92%)
- New issues added to TODOLIST: 4

RECOMMENDED ACTIONS:
1. [URGENT] Fix P0-34: Possible SQL injection
2. Run /fix-skill {"bug_id": "P1-32"} for type annotation
3. [NEW] Run /fix-skill {"bug_id": "P7-83"} for API contract fix
4. Review failed tests
=== END REPORT ===
```

#### 5.2 JSON Output (for programmatic use)

```json
{
  "success": true,
  "session_id": "detect-20260322-1700",
  "timestamp": "2026-03-22T17:00:00Z",
  "scope": "all",
  "mode": "full",
  "detection": {
    "tools_run": ["ruff", "mypy", "bandit", "eslint", "typescript", "contract"],
    "files_scanned": 70,
    "total_issues": 28,
    "new_issues": 4,
    "by_severity": {
      "critical": 1,
      "high": 2,
      "medium": 8,
      "low": 17
    }
  },
  "contract": {
    "apis_checked": 5,
    "apis_with_issues": 4,
    "fields_needing_transformation": 35,
    "issues": [
      {
        "api": "Post",
        "field": "author_id",
        "issue": "snake_case not transformed to camelCase"
      }
    ]
  },
  "tests": {
    "backend": {
      "total": 25,
      "passed": 23,
      "failed": 2,
      "duration_ms": 12500
    },
    "frontend": {
      "eslint_errors": 0,
      "eslint_warnings": 5,
      "build_success": true
    }
  },
  "new_issues_added": [
    {
      "id": "P1-31",
      "problem": "Unused import os",
      "location": "app/api/v1/users.py:6",
      "severity": "LOW"
    }
  ],
  "todolist_updated": true,
  "recommended_next": ["P0-34", "P1-32", "P7-83"],
  "error": null
}
```

---

## Mode Reference

### `mode: "detect"`
- Execute Phase 1 → Phase 2 → Phase 4 → Phase 5
- Run static analysis only
- **Include API contract validation**
- Add new issues to TODOLIST
- No test execution

### `mode: "test"`
- Execute Phase 1 → Phase 3 → Phase 5
- Run test suites only
- Report test results
- No static analysis

### `mode: "full"` (default)
- Execute all phases: 1 → 2 → 3 → 4 → 5
- Complete detection and testing
- **Include API contract validation**
- Update TODOLIST with new issues

### `mode: "report"`
- Execute Phase 5 only
- Generate report from existing TODOLIST
- No new detection or tests

---

## Scope Reference

### `scope: "all"`
- Backend: Ruff, MyPy, Bandit, pytest
- Frontend: ESLint, TypeScript build
- **API Contract: Schema validation**

### `scope: "backend"`
- Ruff linter
- MyPy type checking
- Bandit security scan
- pytest test suite

### `scope: "frontend"`
- ESLint
- TypeScript build check

### `scope: "security"`
- Bandit (backend)
- Security-focused patterns
- Skip non-security tests

### `scope: "contract"` (NEW)
- API Schema comparison (backend vs frontend)
- Field name transformation check
- Type compatibility check
- No other static analysis

---

## Skill Coordination

### Called by review-skill

```javascript
// In review-skill Phase 1
const detectResult = await Skill("detect-skill", {
  mode: "detect",
  scope: "all",  // Now includes contract validation
  add_to_todolist: true,
  run_tests: false,
  called_by: "review-skill",
  output_format: "json"
});
```

### Returns data for fix-skill

The `recommended_next` field contains bug IDs that fix-skill can process:
```json
{
  "recommended_next": ["P0-34", "P1-32", "P7-83"]
}
```

---

## Error Handling

| Error | Action |
|-------|--------|
| Tool not found | Report error, skip tool, continue with others |
| Virtual env missing | Report error, suggest running setup |
| Test file missing | Skip test suite, report warning |
| TODOLIST.md locked | Queue changes, retry after delay |
| JSON parse error | Fall back to text parsing |
| Permission denied | Report and skip affected files |
| Schema file not found | Skip contract check, report warning |

---

## File References

| Purpose | Path |
|---------|------|
| Bug List + Scope | `E:\KIMI_web\problem_fixing\TODOLIST.md` |
| Active Task | `E:\KIMI_web\problem_fixing\active_task.md` |
| Backend Dir | `E:\KIMI_web\backend` |
| Frontend Dir | `E:\KIMI_web\app` |
| Backend Schemas | `E:\KIMI_web\backend\app\schemas\*.py` |
| Frontend API Client | `E:\KIMI_web\app\src\lib\apiClient.ts` |
| Virtual Env | `E:\KIMI_web\.venv` |
| Fix Skill | `E:\KIMI_web\.claude\skills\fix-skill\SKILL.md` |
| Review Skill | `E:\KIMI_web\.claude\skills\review-skill\SKILL.md` |

---

## Example Sessions

### Full Detection with Contract Validation

```
User: /detect-skill

Claude:
=== INIT ===
Loading TODOLIST.md...
Checking tool chain...
✓ Python 3.12 found
✓ pytest installed
✓ ruff installed
✓ mypy installed
✓ bandit installed
✓ Node.js found
✓ ESLint configured

=== DETECT ===
Running Ruff linter...
✓ Scanned 25 files, found 12 issues

Running MyPy type checker...
✓ Scanned 25 files, found 5 issues

Running Bandit security scanner...
✗ Found 3 security issues (1 CRITICAL)

Running ESLint...
✓ Scanned 45 files, found 8 warnings

Running TypeScript build...
✓ Build successful

=== API CONTRACT VALIDATION ===
Checking Auth schemas...
✓ TokenData: All fields transformed
✓ AuthUser: All fields transformed

Checking User schemas...
⚠ UserPublic: 4 fields need transformation (post_count, comment_count, like_count, created_at)
⚠ UserStats: 3 fields not transformed

Checking Post schemas...
⚠ Post: 15 fields not transformed (author_id, reply_count, created_at, etc.)

Checking Comment schemas...
⚠ Comment: 10 fields not transformed

Checking Notification schemas...
⚠ Notification: 6 fields not transformed

Contract Summary: 35 fields need transformation across 4 APIs

=== TEST ===
Running pytest...
✓ 23/25 tests passed (2 failures)

Running ESLint verification...
✓ No errors

=== UPDATE TODOLIST ===
Adding 7 new issues to TODOLIST.md...
✓ P1-31: Unused import os
✓ P1-32: Missing type annotation
✓ P2-33: Use of datetime.utcnow
✓ P0-34: Possible SQL injection [CRITICAL]
✓ P7-83: Post API fields not transformed
✓ P7-84: Comment API fields not transformed
✓ P7-85: Notification API fields not transformed

=== REPORT ===
Total Issues: 35 (7 new)
Critical: 1 (requires immediate attention)
API Contract: 35 fields need transformation
Tests: 23/25 passed (92%)

RECOMMENDED:
1. Fix P0-34 immediately: /fix-skill {"bug_id": "P0-34"}
2. Review failed tests
3. Fix API contract issues: /fix-skill {"bug_id": "P7-83"}
4. Continue with fix-skill for remaining issues
```

### Contract Validation Only

```
User: /detect-skill {"scope": "contract", "mode": "detect"}

Claude:
=== API CONTRACT VALIDATION ===

Scanning backend schemas...
Found: auth.py, user.py, post.py, comment.py, notification.py

Scanning frontend types...
Found: apiClient.ts

COMPARING SCHEMAS:

AuthUser (auth.py ↔ apiClient.ts):
  ✓ id: int ↔ number
  ✓ username: str ↔ string
  ✓ email: str ↔ string
  ✓ avatar: Optional[str] ↔ string | undefined
  ✓ role: str ↔ string
  Status: PASS

UserPublic (user.py ↔ apiClient.ts):
  ✓ id, username, avatar, bio, role - Match
  ⚠ post_count (snake_case) - Should be postCount
  ⚠ comment_count (snake_case) - Should be commentCount
  ⚠ like_count (snake_case) - Should be likeCount
  ⚠ created_at (snake_case) - Should be joinedAt
  Status: NEEDS TRANSFORMATION

Post (post.py ↔ apiClient.ts):
  ⚠ 15 fields using snake_case
  Status: NEEDS TRANSFORMATION

Comment (comment.py ↔ apiClient.ts):
  ⚠ 10 fields using snake_case
  Status: NEEDS TRANSFORMATION

Notification (notification.py ↔ apiClient.ts):
  ⚠ 6 fields using snake_case
  Status: NEEDS TRANSFORMATION

SUMMARY:
- APIs validated: 5
- APIs passed: 1 (AuthUser)
- APIs needing transformation: 4
- Total fields to transform: 35

Added 4 contract issues to TODOLIST.md (P7-83 to P7-86)
```

---

## Return Format (for review-skill)

When `called_by` is set, return structured JSON:

```json
{
  "success": true,
  "session_id": "detect-20260322-1700",
  "mode": "full",
  "scope": "all",
  "detection": {
    "total_issues": 28,
    "new_issues": 4,
    "by_severity": {
      "critical": 1,
      "high": 2,
      "medium": 8,
      "low": 17
    }
  },
  "contract": {
    "apis_checked": 5,
    "apis_with_issues": 4,
    "fields_needing_transformation": 35
  },
  "tests": {
    "backend_passed": 23,
    "backend_failed": 2,
    "frontend_success": true
  },
  "new_issues_added": ["P0-34", "P1-31", "P1-32", "P2-33", "P7-83"],
  "todolist_updated": true,
  "recommended_fix_order": ["P0-34", "P7-83", "P1-32", "P1-31", "P2-33"],
  "error": null
}
```

---

## Integration with Existing Pipeline

```
                    ┌─────────────────────────────────┐
                    │        REVIEW-SKILL (Master)    │
                    └───────────────┬─────────────────┘
                                    │
                    ┌───────────────▼─────────────────┐
                    │  Phase 1: REVIEW                │
                    │  ┌───────────────────────────┐  │
                    │  │ detect-skill              │  │
                    │  │ mode: detect              │  │
                    │  │ scope: all (incl. contract)│  │
                    │  └───────────────────────────┘  │
                    └───────────────┬─────────────────┘
                                    │
                    ┌───────────────▼─────────────────┐
                    │  Phase 2: FIX                   │
                    │  ┌───────────────────────────┐  │
                    │  │ fix-skill (per bug)       │  │
                    │  │ - Can now fix P7 contract │  │
                    │  └───────────────────────────┘  │
                    └───────────────┬─────────────────┘
                                    │
                    ┌───────────────▼─────────────────┐
                    │  Phase 3: VERIFY                │
                    │  ┌───────────────────────────┐  │
                    │  │ detect-skill              │  │
                    │  │ mode: test                │  │
                    │  └───────────────────────────┘  │
                    └───────────────┬─────────────────┘
                                    │
                    ┌───────────────▼─────────────────┐
                    │  Phase 4: SAVE                  │
                    │  ┌───────────────────────────┐  │
                    │  │ auto-doc-update           │  │
                    │  └───────────────────────────┘  │
                    └───────────────┬─────────────────┘
                                    │
                    ┌───────────────▼─────────────────┐
                    │  Phase 5: PUSH                  │
                    │  Git commit and push            │
                    └─────────────────────────────────┘
```