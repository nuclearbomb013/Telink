# Auto Doc Update Skill

Automatically update project documentation and plan files with context information. This skill helps maintain up-to-date documentation and project plans by saving relevant information automatically.

## Overview

This skill creates a function that allows Claude to automatically update project documentation files with context information from the conversation, ensuring documentation remains current with development activities. It also supports optional GitHub push functionality for seamless version control.

## Implementation Steps

1. **Detect Project Files**: Identify the presence of CLAUDE.md and plan.md files in the project root
2. **Parse Current Content**: Read existing documentation to understand current structure
3. **Generate Updates**: Create appropriate updates based on context type and details
4. **Apply Changes**: Update the files with new information in the correct format
5. **Preserve Formatting**: Maintain existing structure and formatting
6. **GitHub Push (Optional)**: If enabled, commit and push changes to the remote repository

## Context Types

The skill supports different context types:

- **development**: General development work and improvements
- **bug_fix**: Bug fixes and corrections
- **feature_addition**: New features implementation
- **refactoring**: Code restructuring and optimization
- **other**: Miscellaneous updates

## GitHub Integration

### Configuration
- **Target Repository**: `https://github.com/nuclearbomb013/Telink.git`
- **Default Branch**: `main`

### Push Process
When `push_to_github` is enabled, the skill:
1. Checks git initialization status
2. Configures remote repository (adds or updates origin)
3. Stages all updated documentation files
4. Creates a commit with an appropriate message
5. Pushes to the specified branch

### Commit Message Generation
Automatic commit messages follow conventional commits format:
- Bug fixes: `fix(docs): <summary>`
- Feature additions: `feat(docs): <summary>`
- Refactoring: `refactor(docs): <summary>`
- Other: `docs: <summary>`

## Integration Points

This skill integrates with:
- Project documentation files (CLAUDE.md, plan.md)
- Daily development workflows
- Task completion processes
- GitHub version control

## Expected Behavior

When called with context information, the skill should:
1. Identify the appropriate files to update
2. Format the information appropriately for each file type
3. Insert the information in the correct chronological location
4. Preserve existing document structure
5. Add timestamps for when updates were made
6. Optionally commit and push changes to GitHub

## Error Handling

The skill handles various error scenarios:
- File not found: Skips the file and reports
- Git not initialized: Initializes a new repository
- Remote not configured: Adds the target remote
- No changes to commit: Reports and skips commit
- Push failures: Reports error details for troubleshooting

## Security Considerations

- Uses system git configuration for authentication
- Does not store or transmit credentials
- Requires proper GitHub authentication setup (SSH keys or PAT)
- All operations are performed locally before pushing