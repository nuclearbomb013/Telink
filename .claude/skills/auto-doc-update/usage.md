# Auto Doc Update Skill - Usage Guide

## Overview
This skill allows Claude to automatically update project documentation files (CLAUDE.md and plan.md) with context information, ensuring documentation stays current with development activities.

## Parameters
- `context_type`: Type of activity ('development', 'bug_fix', 'feature_addition', 'refactoring', 'other')
- `summary`: Brief summary of the changes made
- `details`: Optional detailed description of the work done
- `files_to_update`: Optional array of files to update (defaults to ['CLAUDE.md', 'plan.md'])

## When to Use This Skill
Use this skill when you complete significant development tasks, fix bugs, add features, or make other important changes to the project that should be documented.

## Example Usage

When Claude completes a task, it can call this skill:

```json
{
  "context_type": "bug_fix",
  "summary": "Fixed SSR error in LatestArticles component",
  "details": "Resolved window.innerWidth access causing server-side rendering errors by moving calculation to state management",
  "files_to_update": ["CLAUDE.md"]
}
```

Or for feature additions:

```json
{
  "context_type": "feature_addition",
  "summary": "Implemented user authentication system",
  "details": "Added complete authentication system with login, register, and password reset functionality",
  "files_to_update": ["CLAUDE.md", "plan.md"]
}
```

## Implementation
The skill intelligently updates the documentation files by:
1. Reading the existing content
2. Locating the appropriate section to insert the update
3. Adding the update in the correct format
4. Preserving the existing structure and formatting
5. Writing the updated content back to the file

The skill adds timestamps to each update to maintain a chronological record of changes.