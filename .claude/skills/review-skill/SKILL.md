---
name: review-skill
description: Master orchestrator skill. Reviews code via detect-skill, fixes bugs via fix-skill, saves via auto-doc-update, and pushes to GitHub.
---

# Review Skill

Master orchestrator skill that coordinates the complete code quality pipeline:
**Review - Fix - Verify - Save - Push**

## Pipeline Architecture

REVIEW-SKILL (Master)
  - Phase 1: REVIEW -> detect-skill (detect)
  - Phase 2: FIX -> fix-skill
  - Phase 3: VERIFY -> detect-skill (test)
  - Phase 4: PUSH -> Git + auto-doc-update

## Skill Coordination

### Calls detect-skill
- Phase 1: /detect-skill {"mode": "detect"}
- Phase 3: /detect-skill {"mode": "test"}

### Calls fix-skill
- Phase 2: /fix-skill {"bug_id": "<id>"}

## File References

| Purpose | Path |
|---------|------|
| Bug List | E:\KIMI_web\problem_fixing\TODOLIST.md |
| Detect Skill | E:\KIMI_web\.claude\skills\detect-skill\SKILL.md |
| Fix Skill | E:\KIMI_web\.claude\skillsix-skill\SKILL.md |
