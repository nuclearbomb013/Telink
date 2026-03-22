import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Auto Doc Update Skill
 * A skill to automatically update project documentation and plan files with context information
 */

interface AutoDocUpdateParams {
  context_type: 'development' | 'bug_fix' | 'feature_addition' | 'refactoring' | 'other';
  summary: string;
  details?: string;
  files_to_update?: string[];
  push_to_github?: boolean;
  commit_message?: string;
  branch?: string;
}

// GitHub repository configuration
const GITHUB_REPO = 'https://github.com/nuclearbomb013/Telink.git';
const DEFAULT_BRANCH = 'main';

/**
 * Executes a shell command and returns the result
 */
async function runCommand(command: string, cwd: string): Promise<{ stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execAsync(command, { cwd });
    return { stdout, stderr };
  } catch (error: any) {
    throw new Error(`Command failed: ${command}\nError: ${error.message}\nStderr: ${error.stderr || ''}`);
  }
}

/**
 * Generates a commit message based on context type and summary
 */
function generateCommitMessage(params: AutoDocUpdateParams): string {
  const { context_type, summary } = params;
  const prefixes: Record<string, string> = {
    bug_fix: 'fix(docs)',
    feature_addition: 'feat(docs)',
    refactoring: 'refactor(docs)',
    development: 'docs',
    other: 'docs'
  };
  const prefix = prefixes[context_type] || 'docs';
  return `${prefix}: ${summary}`;
}

/**
 * Pushes changes to GitHub
 */
async function pushToGitHub(
  projectDir: string,
  files: string[],
  commitMessage: string,
  branch: string
): Promise<string> {
  const results: string[] = [];

  try {
    // Check if git is initialized
    try {
      await runCommand('git rev-parse --git-dir', projectDir);
    } catch {
      // Initialize git if not already
      await runCommand('git init', projectDir);
      results.push('Initialized git repository');
    }

    // Check if remote exists
    const { stdout: remoteOutput } = await runCommand('git remote -v', projectDir);
    if (!remoteOutput.includes('origin')) {
      await runCommand(`git remote add origin ${GITHUB_REPO}`, projectDir);
      results.push('Added remote origin');
    } else if (!remoteOutput.includes(GITHUB_REPO)) {
      // Update remote URL if it's different
      await runCommand(`git remote set-url origin ${GITHUB_REPO}`, projectDir);
      results.push('Updated remote origin URL');
    }

    // Stage files
    for (const file of files) {
      try {
        await runCommand(`git add "${file}"`, projectDir);
        results.push(`Staged: ${file}`);
      } catch (error: any) {
        results.push(`Warning: Could not stage ${file}: ${error.message}`);
      }
    }

    // Check if there are changes to commit
    const { stdout: statusOutput } = await runCommand('git status --porcelain', projectDir);
    if (!statusOutput.trim()) {
      results.push('No changes to commit');
      return results.join('\n');
    }

    // Commit changes
    await runCommand(`git commit -m "${commitMessage}"`, projectDir);
    results.push(`Committed: ${commitMessage}`);

    // Push to GitHub
    try {
      // Try to push to the specified branch
      await runCommand(`git push -u origin ${branch}`, projectDir);
      results.push(`Pushed to origin/${branch}`);
    } catch (pushError: any) {
      // If branch doesn't exist remotely, create it
      if (pushError.message.includes('no upstream branch') || pushError.message.includes('does not exist')) {
        await runCommand(`git push -u origin ${branch}`, projectDir);
        results.push(`Created and pushed to origin/${branch}`);
      } else {
        throw pushError;
      }
    }

  } catch (error: any) {
    results.push(`Error during git operations: ${error.message}`);
  }

  return results.join('\n');
}

/**
 * Updates project documentation files with new context information
 */
async function autoDocUpdate(params: AutoDocUpdateParams): Promise<string> {
  const {
    context_type,
    summary,
    details = '',
    files_to_update = ['CLAUDE.md', 'plan.md'],
    push_to_github = false,
    commit_message,
    branch = DEFAULT_BRANCH
  } = params;

  const projectDir = 'E:/KIMI_web'; // Project directory
  const results: string[] = [];

  // Format the update entry
  const date = new Date().toISOString().split('T')[0];
  const contextEntry = `- **[${context_type}] ${date}** - ${summary}\n  - Details: ${details || 'No additional details'}\n`;

  const updatedFiles: string[] = [];

  // Update specified files
  for (const fileName of files_to_update) {
    const filePath = path.join(projectDir, fileName);

    try {
      // Check if file exists
      await fs.access(filePath);

      let content = await fs.readFile(filePath, 'utf8');

      // Different update strategies based on file type
      if (fileName === 'CLAUDE.md') {
        // For CLAUDE.md, look for "待完成改进" section or append to end
        if (content.includes('待完成改进')) {
          // Insert after "待完成改进" section header
          content = content.replace(
            /(### 待完成改进[\s\S]*?)(\n### P0 - 高优先级)/,
            `$1\n${contextEntry}$2`
          );
        } else {
          // Append to end of file
          content += `\n### 待完成改进\n\n${contextEntry}`;
        }
      } else if (fileName === 'plan.md') {
        // For plan.md, add to recent updates or create section
        if (content.includes('## Recent Updates')) {
          content = content.replace(
            /(## Recent Updates\s*\n)/,
            `$1${contextEntry}\n`
          );
        } else {
          content = `# Project Plan\n\n## Recent Updates\n\n${contextEntry}\n\n${content}`;
        }
      } else {
        // For other files, just append to the end
        content += `\n\n### Updated: ${date}\n${contextEntry}\n`;
      }

      // Write the updated content back to the file
      await fs.writeFile(filePath, content, 'utf8');
      results.push(`Successfully updated ${fileName}: ${summary}`);
      updatedFiles.push(fileName);
    } catch (error) {
      results.push(`Error updating ${fileName}: ${(error as Error).message}`);
    }
  }

  // Push to GitHub if requested
  if (push_to_github && updatedFiles.length > 0) {
    const finalCommitMessage = commit_message || generateCommitMessage(params);
    const pushResult = await pushToGitHub(projectDir, updatedFiles, finalCommitMessage, branch);
    results.push('\n--- GitHub Push Results ---');
    results.push(pushResult);
  }

  return results.join('\n');
}

// Export the function for use in Claude Code environment
export default autoDocUpdate;