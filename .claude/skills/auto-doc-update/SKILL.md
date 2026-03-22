---
name: auto-doc-update
description: Automatically update project documentation and plan files with context information. This skill helps maintain up-to-date documentation and project plans by saving relevant information automatically.
---

# Auto Doc Update

Automatically update project documentation and plan files with context information. This skill helps maintain up-to-date documentation and project plans by saving relevant information automatically.

## Usage

Use this skill to automatically update documentation after completing tasks or making significant changes to the codebase.

### Parameters

- `context_type`: Type of context to save ('development', 'bug_fix', 'feature_addition', 'refactoring', 'other')
- `summary`: Brief summary of changes or activities
- `details`: Detailed description of the work done (optional)
- `files_to_update`: List of files to update (defaults to ['CLAUDE.md', 'plan.md']) (optional)
- `push_to_github`: Whether to push changes to GitHub (defaults to false) (optional)
- `commit_message`: Custom commit message for GitHub push (optional, auto-generated if not provided)
- `branch`: Branch name to push to (defaults to 'main') (optional)

### Examples

```
/auto-doc-update {"context_type": "bug_fix", "summary": "Fixed SSR error in LatestArticles component", "details": "Resolved window.innerWidth access causing server-side rendering errors"}
```

```
/auto-doc-update {"context_type": "feature_addition", "summary": "Added user authentication system", "files_to_update": ["CLAUDE.md"]}
```

```
/auto-doc-update {"context_type": "refactoring", "summary": "Improved performance of scroll animations", "details": "Updated GSAP animations to use more efficient properties", "files_to_update": ["CLAUDE.md", "plan.md"], "push_to_github": true}
```

```
/auto-doc-update {"context_type": "feature_addition", "summary": "Added new API endpoint", "push_to_github": true, "commit_message": "feat: add new API endpoint for user data", "branch": "main"}
```

## Purpose

This skill helps maintain project documentation automatically by allowing Claude to record important changes, fixes, and additions to project documentation files (CLAUDE.md and plan.md) when completing tasks or making changes to the codebase.

## GitHub Integration

When `push_to_github` is set to `true`, the skill will:
1. Stage the updated documentation files
2. Create a commit with the specified or auto-generated commit message
3. Push to the specified branch (default: main)

The target repository is: `https://github.com/nuclearbomb013/Telink.git`

### GitHub Prerequisites

Before using the GitHub push feature, ensure:
1. Git is installed and configured on your system
2. You have push access to the target repository
3. The repository is either already cloned with proper remote setup, or you have configured GitHub authentication (SSH keys or personal access token)