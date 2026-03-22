# Auto Doc Update Skill

This skill enables Claude to automatically update project documentation files (CLAUDE.md and plan.md) with context information, ensuring documentation remains current with development activities.

## Purpose

The Auto Doc Update Skill addresses the common problem of keeping project documentation synchronized with development activities. Rather than requiring manual updates to documentation files, this skill allows Claude to automatically record important changes, fixes, and additions to project documentation as work progresses.

## Components

The skill consists of:

1. **skill.md** - Public description of the skill for Claude
2. **spec.md** - Technical specification of the function interface
3. **implementation.md** - Detailed implementation guide
4. **usage.md** - User guide for when and how to use the skill
5. **skill.ts** - TypeScript implementation of the auto-update functionality

## How It Works

When Claude completes a task that warrants documentation, it can call the `autoDocUpdate` function with parameters specifying:

- The type of activity (bug fix, feature addition, refactoring, etc.)
- A brief summary of the changes
- Additional details about the work
- Which files to update

The skill then intelligently updates the appropriate sections of the documentation files while preserving existing structure and formatting.

## Supported File Types

- **CLAUDE.md**: Project improvement records and documentation
- **plan.md**: Project planning and task tracking
- Other markdown files in the project directory

## Context Types

- `development`: General development work
- `bug_fix`: Bug fixes and corrections
- `feature_addition`: New feature implementations
- `refactoring`: Code restructuring and optimization
- `other`: Miscellaneous updates

## Benefits

- Keeps documentation current without manual intervention
- Maintains chronological records of project changes
- Reduces overhead in documentation maintenance
- Ensures important changes are recorded consistently