# Auto Doc Update Skill

This skill enables Claude to automatically update project documentation files (CLAUDE.md and plan.md) with context information from the conversation, ensuring that project documentation stays current with development activities.

## Function Definition

The skill exposes a function that can be called by Claude to update documentation files with context information.

### Function Signature
```
autoDocUpdate(params: {
  context_type: "development" | "bug_fix" | "feature_addition" | "refactoring" | "other",
  summary: string,
  details?: string,
  files_to_update?: string[],
  push_to_github?: boolean,
  commit_message?: string,
  branch?: string
}): Promise<string>
```

### Parameters
- `context_type` (required): The type of context to save
- `summary` (required): Brief summary of changes or activities
- `details` (optional): Detailed description of the work done
- `files_to_update` (optional): List of files to update (defaults to ['CLAUDE.md', 'plan.md'])
- `push_to_github` (optional): Whether to push changes to GitHub (defaults to false)
- `commit_message` (optional): Custom commit message for GitHub push (auto-generated if not provided)
- `branch` (optional): Branch name to push to (defaults to 'main')

### Return Value
A string indicating the results of the update operations, including GitHub push results if enabled.

## Purpose
This skill helps maintain up-to-date project documentation by allowing Claude to automatically save relevant information to project documentation files (CLAUDE.md and plan.md) when completing tasks or making changes to the codebase.

## GitHub Integration

When `push_to_github` is set to `true`, the skill will:
1. Check if git is initialized in the project directory
2. Configure the remote repository if needed
3. Stage the updated documentation files
4. Create a commit with the specified or auto-generated commit message
5. Push to the specified branch (default: main)

### Target Repository
- **URL**: `https://github.com/nuclearbomb013/Telink.git`
- **Default Branch**: `main`

### Commit Message Format
The skill automatically generates commit messages based on context type:
- `bug_fix`: `fix(docs): <summary>`
- `feature_addition`: `feat(docs): <summary>`
- `refactoring`: `refactor(docs): <summary>`
- `development`/`other`: `docs: <summary>`

### Prerequisites
Before using the GitHub push feature, ensure:
1. Git is installed and configured on your system
2. You have push access to the target repository
3. GitHub authentication is configured (SSH keys or personal access token)