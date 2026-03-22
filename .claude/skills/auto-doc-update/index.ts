import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Auto Documentation Update Skill
 * Automatically updates project documentation and plan files with context information
 * with optional GitHub push functionality
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
 * Gets current timestamp in YYYY-MM-DD format
 */
function getCurrentDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Formats context information for insertion into documentation
 */
function formatContextEntry(params: AutoDocUpdateParams): string {
  const { context_type, summary, details } = params;
  const date = getCurrentDate();

  switch(context_type) {
    case 'bug_fix':
      return `- [x] **${date}** - ${summary}\n  - Details: ${details || 'No additional details'}\n`;
    case 'feature_addition':
      return `- [x] **${date}** - ${summary}\n  - Details: ${details || 'No additional details'}\n`;
    case 'refactoring':
      return `- [x] **${date}** - ${summary}\n  - Details: ${details || 'No additional details'}\n`;
    case 'development':
    case 'other':
    default:
      return `- **${date}** - ${summary}\n  - Details: ${details || 'No additional details'}\n`;
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
 * Updates CLAUDE.md file with new context information
 */
async function updateClaudeMd(filePath: string, contextEntry: string): Promise<void> {
  try {
    let content = await fs.readFile(filePath, 'utf8');

    // Look for the "待完成改进" section or create one if it doesn't exist
    if (content.includes('待完成改进')) {
      // Find the "P0 - 高优先级" section and add the update before it
      const p0Index = content.indexOf('### P0 - 高优先级');
      if (p0Index !== -1) {
        // Insert the new entry in the appropriate section based on context type
        const beforeP0 = content.substring(0, p0Index);
        const afterP0 = content.substring(p0Index);

        // Add to the top of the improvements section
        content = `${beforeP0}\n### 最近更新\n\n${contextEntry}\n${afterP0}`;
      } else {
        // Append to the end
        content += `\n### 最近更新\n\n${contextEntry}\n`;
      }
    } else {
      // Add the section if it doesn't exist
      content += `\n### 待完成改进\n\n### 最近更新\n\n${contextEntry}\n`;
    }

    await fs.writeFile(filePath, content, 'utf8');
    console.log(`Updated CLAUDE.md with: ${summary}`);
  } catch (error: any) {
    console.error(`Error updating CLAUDE.md: ${error.message}`);
  }
}

/**
 * Updates plan.md file with new context information
 */
async function updatePlanMd(filePath: string, contextEntry: string): Promise<void> {
  try {
    let content = await fs.readFile(filePath, 'utf8');

    // Add to the top of the file or create a new section if none exists
    if (!content.includes('## Recent Updates')) {
      content = `# Project Plan\n\n## Recent Updates\n\n${contextEntry}\n\n${content}`;
    } else {
      // Find the Recent Updates section and add to it
      const recentUpdatesIndex = content.indexOf('## Recent Updates');
      const nextHeaderIndex = content.indexOf('\n## ', recentUpdatesIndex + 1);
      const endIndex = nextHeaderIndex !== -1 ? nextHeaderIndex : content.length;

      const beforeUpdates = content.substring(0, endIndex);
      const afterUpdates = content.substring(endIndex);

      content = `${beforeUpdates}\n${contextEntry}${afterUpdates}`;
    }

    await fs.writeFile(filePath, content, 'utf8');
    console.log(`Updated plan.md with: ${summary}`);
  } catch (error: any) {
    console.error(`Error updating plan.md: ${error.message}`);
  }
}

/**
 * Main function to update documentation files
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

  const results: string[] = [];

  // Format the context entry
  const contextEntry = formatContextEntry({ context_type, summary, details });

  // Determine project root directory
  const projectRoot = process.cwd(); // Or pass this as a parameter

  const updatedFiles: string[] = [];

  // Update specified files
  for (const fileName of files_to_update) {
    const filePath = path.join(projectRoot, fileName);

    // Check if file exists
    try {
      await fs.access(filePath);

      if (fileName === 'CLAUDE.md') {
        await updateClaudeMd(filePath, contextEntry);
        updatedFiles.push(fileName);
      } else if (fileName === 'plan.md') {
        await updatePlanMd(filePath, contextEntry);
        updatedFiles.push(fileName);
      } else {
        // Generic update for other markdown files
        let content = await fs.readFile(filePath, 'utf8');
        content += `\n\n### Updated on ${getCurrentDate()}\n\n${contextEntry}\n`;
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`Updated ${fileName} with: ${summary}`);
        updatedFiles.push(fileName);
      }
      results.push(`Successfully updated ${fileName}`);
    } catch (error) {
      console.warn(`File ${fileName} does not exist in project root, skipping...`);
      results.push(`Skipped ${fileName} (file not found)`);
    }
  }

  // Push to GitHub if requested
  if (push_to_github && updatedFiles.length > 0) {
    const finalCommitMessage = commit_message || generateCommitMessage(params);
    const pushResult = await pushToGitHub(projectRoot, updatedFiles, finalCommitMessage, branch);
    results.push('\n--- GitHub Push Results ---');
    results.push(pushResult);
  }

  console.log('Documentation update completed.');
  return results.join('\n');
}

export default autoDocUpdate;