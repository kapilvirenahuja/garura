/**
 * Phoenix OS Project Installer (Node.js)
 *
 * Handles creation of new Phoenix OS projects with proper structure and configuration.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// List of supported AI copilots
const SUPPORTED_COPILOTS = ['claude', 'copilot'];

// Validation constants
const MAX_PROJECT_NAME_LENGTH = 100;
const INVALID_CHARS = '<>:"/\\|?*';
const GIT_INIT_TIMEOUT_MS = 10000;

// Directory and file name constants
const DIR_CLAUDE = '.claude';
const DIR_GITHUB = '.github';
const DIR_PHOENIX_OS = '.phoenix-os';
const DIR_AGENTS = 'agents';
const DIR_COMMANDS = 'commands';
const DIR_PROMPTS = 'prompts';
const DIR_CORE = 'core';
const FILE_COPILOT_INSTRUCTIONS = 'copilot-instructions.md';
const FILE_COPILOT_MD = 'COPILOT.md';
const FILE_CLAUDE_MD = 'CLAUDE.md';
const PROMPT_EXTENSION = '.prompt.md';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[0;31m',
  green: '\x1b[0;32m',
  blue: '\x1b[0;34m',
};

/**
 * Print colored messages
 */
function printInfo(message) {
  console.log(`${colors.blue}[INFO]${colors.reset} ${message}`);
}

function printSuccess(message) {
  console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`);
}

function printError(message) {
  console.log(`${colors.red}[ERROR]${colors.reset} ${message}`);
}

/**
 * Safe string replacement that treats search string as literal
 * @param {string} content - Content to search in
 * @param {string} search - String to search for (literal)
 * @param {string} replacement - String to replace with
 * @returns {string} - Content with replacements
 */
function safeReplace(content, search, replacement) {
  return content.split(search).join(replacement);
}

/**
 * Validate that target directory is safe (no path traversal)
 * @param {string} targetDir - Target directory path
 * @param {string} baseDir - Base directory (current working directory)
 * @returns {{isValid: boolean, error: string|null}}
 */
function validateTargetPath(targetDir, baseDir) {
  try {
    const normalizedTarget = path.resolve(targetDir);
    const normalizedBase = path.resolve(baseDir);

    // Check if target is within base directory
    if (!normalizedTarget.startsWith(normalizedBase)) {
      return {
        isValid: false,
        error: 'Target directory must be within current working directory'
      };
    }

    return { isValid: true, error: null };
  } catch (error) {
    return {
      isValid: false,
      error: `Invalid path: ${error.message}`
    };
  }
}

/**
 * Safely remove a directory or file
 * @param {string} targetPath - Path to remove
 * @returns {{success: boolean, error: string|null}}
 */
function safeRemove(targetPath) {
  try {
    if (!fs.existsSync(targetPath)) {
      return { success: true, error: null };
    }

    if (fs.statSync(targetPath).isDirectory()) {
      fs.rmSync(targetPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(targetPath);
    }

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: `Failed to remove ${targetPath}: ${error.message}`
    };
  }
}

/**
 * Validate project name for filesystem compatibility
 * @param {string} name - Project name to validate
 * @returns {{isValid: boolean, error: string|null}}
 */
function validateProjectName(name) {
  if (!name) {
    return { isValid: false, error: 'Project name cannot be empty' };
  }

  // Check for invalid characters (filesystem incompatible)
  for (const char of INVALID_CHARS) {
    if (name.includes(char)) {
      return {
        isValid: false,
        error: `Project name contains invalid characters: ${INVALID_CHARS}`,
      };
    }
  }

  // Check if name starts with dot or dash
  if (name.startsWith('.') || name.startsWith('-')) {
    return {
      isValid: false,
      error: "Project name cannot start with '.' or '-'",
    };
  }

  // Check for spaces
  if (name.includes(' ')) {
    return {
      isValid: false,
      error: 'Project name should not contain spaces. Use hyphens or underscores instead.',
    };
  }

  // Check length
  if (name.length > MAX_PROJECT_NAME_LENGTH) {
    return {
      isValid: false,
      error: `Project name too long (max ${MAX_PROJECT_NAME_LENGTH} characters)`,
    };
  }

  return { isValid: true, error: null };
}

/**
 * Initialize git repository with proper error handling
 * @param {string} targetDir - Directory to initialize git in
 * @returns {boolean} - True if successful, false otherwise
 */
function initGitRepository(targetDir) {
  try {
    execSync('git init', {
      cwd: targetDir,
      stdio: 'pipe',
      timeout: GIT_INIT_TIMEOUT_MS,
    });
    return true;
  } catch (err) {
    if (err.message.includes('git') && err.message.includes('not found')) {
      printInfo('  ⚠ Git not found, skipping repository initialization');
    } else {
      printError(`Failed to initialize git: ${err.message}`);
    }
    return false;
  }
}

/**
 * Get the Phoenix OS installation root directory
 * @returns {string} - Root directory path
 */
function getPhoenixRoot() {
  // The root is the parent directory of lib/
  return path.join(__dirname, '..');
}

/**
 * Copy directory recursively
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 * @param {string[]} exclude - Files/directories to exclude
 */
function copyDirRecursive(src, dest, exclude = []) {
  if (!fs.existsSync(src)) {
    return;
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    if (exclude.includes(entry.name)) {
      continue;
    }

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath, exclude);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Recursively flatten command files to dotted naming convention
 * @param {string} dir - Current directory to process
 * @param {string} baseDir - Base directory for relative path calculation
 * @param {string} outputDir - Output directory for flattened files
 */
function flattenCommands(dir, baseDir, outputDir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      flattenCommands(fullPath, baseDir, outputDir);
    } else if (entry.name.endsWith('.md')) {
      // Get relative path from phoenix directory
      const relativePath = path.relative(baseDir, fullPath);

      // Remove .md extension
      const pathWithoutExt = relativePath.replace(/\.md$/, '');

      // Convert path separators to dots for flattened naming
      const dottedPath = pathWithoutExt.split(path.sep).join('.');

      // Create new filename with .prompt.md extension
      const newFilename = `${dottedPath}${PROMPT_EXTENSION}`;

      // Copy file to output directory
      fs.copyFileSync(fullPath, path.join(outputDir, newFilename));
    }
  }
}

/**
 * Generate .github structure for GitHub Copilot
 * Copies agents and flattens commands into prompts with dotted naming
 * @param {string} phoenixRoot - Phoenix OS root directory
 * @param {string} targetDir - Target project directory
 * @param {string} projectName - Name of the project
 * @returns {boolean} - True if successful, false otherwise
 */
function generateGitHubStructure(phoenixRoot, targetDir, projectName) {
  printInfo('Generating .github structure for GitHub Copilot...');

  try {
    // Create .github directory
    const githubDir = path.join(targetDir, DIR_GITHUB);
    if (!fs.existsSync(githubDir)) {
      fs.mkdirSync(githubDir, { recursive: true });
    }

    // Copy agents directory as-is
    const agentsSrc = path.join(phoenixRoot, DIR_CORE, DIR_AGENTS);
    if (!fs.existsSync(agentsSrc)) {
      printError(`Agents directory not found: ${agentsSrc}`);
      return false;
    }
    copyDirRecursive(agentsSrc, path.join(githubDir, DIR_AGENTS));
    printInfo(`  [+] Copied agents to ${DIR_GITHUB}/${DIR_AGENTS}/`);

    // Create prompts directory
    const promptsDir = path.join(githubDir, DIR_PROMPTS);
    if (!fs.existsSync(promptsDir)) {
      fs.mkdirSync(promptsDir, { recursive: true });
    }

    // Flatten commands from core/commands/phoenix to .github/prompts
    const commandsPhoenixSrc = path.join(phoenixRoot, DIR_CORE, DIR_COMMANDS, 'phoenix');
    if (!fs.existsSync(commandsPhoenixSrc)) {
      printError(`Commands directory not found: ${commandsPhoenixSrc}`);
      return false;
    }
    flattenCommands(commandsPhoenixSrc, commandsPhoenixSrc, promptsDir);
    printInfo(`  [+] Generated flattened prompts in ${DIR_GITHUB}/${DIR_PROMPTS}/`);

    // Copy and update copilot-instructions.md from COPILOT.md
    const copilotMdSrc = path.join(phoenixRoot, FILE_COPILOT_MD);
    if (!fs.existsSync(copilotMdSrc)) {
      printError(`${FILE_COPILOT_MD} not found in Phoenix OS root`);
      return false;
    }

    let copilotContent = fs.readFileSync(copilotMdSrc, 'utf-8');

    // Use safe string replacement for project name and URLs
    copilotContent = safeReplace(copilotContent, 'name: Phoenix OS', `name: ${projectName}`);
    copilotContent = safeReplace(copilotContent, 'type: Agentic Framework', 'type: Application');
    copilotContent = safeReplace(
      copilotContent,
      'https://github.com/nagarro-digital/phoenix-os.git',
      '[Your repository URL]'
    );

    fs.writeFileSync(path.join(githubDir, FILE_COPILOT_INSTRUCTIONS), copilotContent, 'utf-8');
    printInfo(`  [+] Created ${DIR_GITHUB}/${FILE_COPILOT_INSTRUCTIONS}`);

    printSuccess('.github structure generated successfully!');
    return true;
  } catch (error) {
    printError(`Failed to generate .github structure: ${error.message}`);
    return false;
  }
}

/**
 * Prompt user for input
 * @param {string} question - Question to ask
 * @returns {Promise<string>} - User's answer
 */
function promptForInput(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question}: `, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Prompt user for copilot selection
 * @returns {Promise<string>} - Selected copilot
 */
async function promptForCopilot() {
  console.log();
  printInfo('AI copilot not specified. Please select an AI copilot');
  console.log();
  console.log('Supported AI Copilots:');
  SUPPORTED_COPILOTS.forEach((copilot, index) => {
    console.log(`  ${index + 1}. ${copilot}`);
  });
  console.log();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('Select copilot (enter number or name): ', (answer) => {
      rl.close();
      const choice = answer.trim();

      // Check if user entered a number
      if (/^\d+$/.test(choice)) {
        const index = parseInt(choice) - 1;
        if (index >= 0 && index < SUPPORTED_COPILOTS.length) {
          resolve(SUPPORTED_COPILOTS[index]);
        } else {
          printError('Invalid selection');
          resolve(null);
        }
      } else {
        resolve(choice);
      }
    });
  });
}

/**
 * Prompt user for yes/no confirmation
 * @param {string} question - Question to ask
 * @returns {Promise<boolean>} - True if yes, false if no
 */
function promptForYesNo(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question} (y/n): `, (answer) => {
      rl.close();
      const choice = answer.trim().toLowerCase();
      resolve(choice === 'y' || choice === 'yes');
    });
  });
}

/**
 * Calculate what will be updated in an existing project
 * @param {string} targetDir - Target directory path
 * @param {string} aiProvider - AI copilot to use (claude or copilot)
 * @returns {Object} - Update diff information
 */
function calculateUpdateDiff(targetDir, aiProvider) {
  const diff = {
    willUpdate: [],
    willNotTouch: [],
  };

  if (aiProvider === 'claude') {
    // Check .claude directory
    const claudeDir = path.join(targetDir, '.claude');
    if (fs.existsSync(claudeDir)) {
      diff.willUpdate.push('[~] .claude/ (will be updated)');
    } else {
      diff.willUpdate.push('[+] .claude/ (will be created)');
    }

    // Check CLAUDE.md
    const claudeMd = path.join(targetDir, 'CLAUDE.md');
    if (fs.existsSync(claudeMd)) {
      diff.willUpdate.push('[~] CLAUDE.md (will be updated)');
    } else {
      diff.willUpdate.push('[+] CLAUDE.md (will be created)');
    }
  } else if (aiProvider === 'copilot') {
    // Check .github directory
    const githubDir = path.join(targetDir, '.github');
    if (fs.existsSync(githubDir)) {
      diff.willUpdate.push('[~] .github/ (will be updated)');
    } else {
      diff.willUpdate.push('[+] .github/ (will be created)');
    }
  }

  // Check .phoenix-os directory (common for both)
  const phoenixOsDir = path.join(targetDir, '.phoenix-os');
  if (fs.existsSync(phoenixOsDir)) {
    diff.willUpdate.push('[~] .phoenix-os/ (will be updated)');
  } else {
    diff.willUpdate.push('[+] .phoenix-os/ (will be created)');
  }

  // Files that will NOT be touched
  const preservedFiles = ['README.md', 'LICENSE', '.gitignore', 'src/', 'package.json', 'node_modules/'];
  preservedFiles.forEach((file) => {
    const filePath = path.join(targetDir, file);
    if (fs.existsSync(filePath)) {
      diff.willNotTouch.push(`[ ] ${file} (preserved)`);
    }
  });

  // Add note about other files
  diff.willNotTouch.push('[ ] All other existing files (preserved)');

  return diff;
}

/**
 * Show update diff to user
 * @param {Object} diff - Diff information from calculateUpdateDiff
 */
function showUpdateDiff(diff) {
  console.log();
  printInfo('Phoenix OS Update Summary:');
  console.log();
  console.log('Will be updated/created:');
  diff.willUpdate.forEach((item) => {
    console.log(`  ${item}`);
  });
  console.log();
  console.log('Will NOT be touched:');
  diff.willNotTouch.forEach((item) => {
    console.log(`  ${item}`);
  });
  console.log();
}

/**
 * Create a new Phoenix OS project
 * @param {string} projectName - Name of the project
 * @param {string} aiProvider - AI copilot to use
 * @param {string} targetDir - Target directory for the project
 * @param {boolean} allowExisting - Allow creation in existing directory (default: false)
 * @returns {boolean} - True if successful, false otherwise
 */
function createProject(projectName, aiProvider, targetDir, allowExisting = false) {
  const phoenixRoot = getPhoenixRoot();

  printInfo(`Initializing Phoenix OS project: ${projectName}`);
  printInfo(`Phoenix OS root: ${phoenixRoot}`);
  printInfo(`Target directory: ${targetDir}`);
  printInfo(`AI Provider: ${aiProvider}`);

  // Check if target directory already exists (unless we're allowing existing)
  if (!allowExisting && fs.existsSync(targetDir)) {
    printError(`Directory already exists: ${targetDir}`);
    return false;
  }

  // Create the project directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    printInfo('Creating project directory...');
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Create basic Phoenix OS structure
  printInfo('Setting up Phoenix OS structure...');
  fs.mkdirSync(path.join(targetDir, DIR_PHOENIX_OS, 'project', 'specs'), { recursive: true });
  fs.mkdirSync(path.join(targetDir, DIR_PHOENIX_OS, DIR_CORE), { recursive: true });
  fs.mkdirSync(path.join(targetDir, 'src'), { recursive: true });

  // Setup AI-specific directories based on provider
  if (aiProvider === 'claude') {
    // Copy agents and commands to .claude folder for Claude Code
    fs.mkdirSync(path.join(targetDir, DIR_CLAUDE), { recursive: true });
    printInfo('Copying agents and commands to .claude folder...');

    const agentsSrc = path.join(phoenixRoot, DIR_CORE, DIR_AGENTS);
    if (!fs.existsSync(agentsSrc)) {
      printError(`Agents directory not found: ${agentsSrc}`);
      return false;
    }
    copyDirRecursive(agentsSrc, path.join(targetDir, DIR_CLAUDE, DIR_AGENTS));
    printInfo('  [+] Copied agents');

    const commandsPhoenixSrc = path.join(phoenixRoot, DIR_CORE, DIR_COMMANDS, 'phoenix');
    if (!fs.existsSync(commandsPhoenixSrc)) {
      printError(`Commands directory not found: ${commandsPhoenixSrc}`);
      return false;
    }
    fs.mkdirSync(path.join(targetDir, DIR_CLAUDE, DIR_COMMANDS), { recursive: true });
    copyDirRecursive(commandsPhoenixSrc, path.join(targetDir, DIR_CLAUDE, DIR_COMMANDS, 'phoenix'));
    printInfo('  [+] Copied commands/phoenix');
  } else if (aiProvider === 'copilot') {
    // Generate .github structure for GitHub Copilot
    const success = generateGitHubStructure(phoenixRoot, targetDir, projectName);
    if (!success) {
      printError('Failed to generate .github structure');
      return false;
    }
  } else {
    // This should not happen due to validation earlier, but handle it explicitly
    printError(`Unsupported AI provider: ${aiProvider}`);
    return false;
  }

  // Copy everything from core except agents, commands, and install to .phoenix-os/core
  printInfo(`Copying core files to ${DIR_PHOENIX_OS}/${DIR_CORE}...`);
  const coreSrc = path.join(phoenixRoot, DIR_CORE);
  if (fs.existsSync(coreSrc)) {
    const entries = fs.readdirSync(coreSrc, { withFileTypes: true });
    const excludeDirs = [DIR_AGENTS, DIR_COMMANDS, 'install', '__pycache__'];

    for (const entry of entries) {
      if (excludeDirs.includes(entry.name)) {
        continue;
      }

      const srcPath = path.join(coreSrc, entry.name);
      const destPath = path.join(targetDir, DIR_PHOENIX_OS, DIR_CORE, entry.name);

      if (entry.isDirectory()) {
        copyDirRecursive(srcPath, destPath, ['__pycache__']);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
      printInfo(`  [+] Copied ${entry.name}`);
    }
  }

  // Copy and update CLAUDE.md (only for Claude)
  if (aiProvider === 'claude') {
    printInfo(`Creating ${FILE_CLAUDE_MD} with updated paths...`);
    const claudeMdSrc = path.join(phoenixRoot, FILE_CLAUDE_MD);
    if (fs.existsSync(claudeMdSrc)) {
      let claudeMdContent = fs.readFileSync(claudeMdSrc, 'utf-8');

      // Extract only Overview and Configuration sections
      const lines = claudeMdContent.split('\n');
      const overviewLines = [];
      const configLines = [];
      let inOverview = false;
      let inConfig = false;

      for (const line of lines) {
        if (line.trim() === '## Overview') {
          inOverview = true;
          overviewLines.push(line);
        } else if (line.trim() === '## Configuration') {
          inConfig = true;
          configLines.push(line);
        } else if (line.startsWith('## ') && inOverview) {
          inOverview = false;
        } else if (inOverview) {
          overviewLines.push(line);
        } else if (inConfig) {
          configLines.push(line);
        }
      }

      // Build the new CLAUDE.md
      claudeMdContent = `# CLAUDE.md\n\n${projectName} configuration for Claude Code.\n\n`;
      claudeMdContent += `${overviewLines.join('\n')}\n\n`;
      claudeMdContent += configLines.join('\n');

      // Use safe string replacement for paths
      claudeMdContent = safeReplace(claudeMdContent, 'name: Phoenix OS', `name: ${projectName}`);
      claudeMdContent = safeReplace(claudeMdContent, 'type: Agentic Framework', 'type: Application');
      claudeMdContent = safeReplace(claudeMdContent, './core/memory/', `./${DIR_PHOENIX_OS}/${DIR_CORE}/memory/`);
      claudeMdContent = safeReplace(claudeMdContent, './core/commands/', `./${DIR_CLAUDE}/${DIR_COMMANDS}/`);
      claudeMdContent = safeReplace(claudeMdContent, './core/agents/', `./${DIR_CLAUDE}/${DIR_AGENTS}/`);
      claudeMdContent = safeReplace(claudeMdContent, './core/templates/', `./${DIR_PHOENIX_OS}/${DIR_CORE}/templates/`);
      claudeMdContent = safeReplace(
        claudeMdContent,
        'https://github.com/nagarro-digital/phoenix-os.git',
        '[Your repository URL]'
      );

      fs.writeFileSync(path.join(targetDir, FILE_CLAUDE_MD), claudeMdContent, 'utf-8');
      printInfo(`  [+] Updated ${FILE_CLAUDE_MD} with project-specific paths`);
    } else {
      printError(`${FILE_CLAUDE_MD} not found in Phoenix OS root`);
    }
  }

  // Copy LICENSE file
  printInfo('Copying LICENSE file...');
  const licenseSrc = path.join(phoenixRoot, 'LICENSE');
  if (fs.existsSync(licenseSrc)) {
    fs.copyFileSync(licenseSrc, path.join(targetDir, 'LICENSE'));
    printInfo('  [+] Copied LICENSE');
  } else {
    printInfo('  ⚠ LICENSE file not found, skipping');
  }

  // Copy and update README.md
  printInfo('Creating README.md...');
  const readmeSrc = path.join(phoenixRoot, 'README.md');
  if (fs.existsSync(readmeSrc)) {
    let readmeContent = fs.readFileSync(readmeSrc, 'utf-8');
    const lines = readmeContent.split('\n');

    if (lines.length > 0 && lines[0].startsWith('# ')) {
      lines[0] = `# ${projectName}`;
    }

    readmeContent = lines.join('\n');
    readmeContent = readmeContent.replace(
      /https:\/\/github\.com\/nagarro-digital\/phoenix-os/g,
      '[Your repository URL]'
    );

    fs.writeFileSync(path.join(targetDir, 'README.md'), readmeContent, 'utf-8');
    printInfo('  [+] Copied and updated README.md');
  } else {
    printError('README.md not found in Phoenix OS root');
  }

  // Copy .gitignore
  printInfo('Creating .gitignore...');
  const gitignoreSrc = path.join(phoenixRoot, '.gitignore');
  if (fs.existsSync(gitignoreSrc)) {
    fs.copyFileSync(gitignoreSrc, path.join(targetDir, '.gitignore'));
    printInfo('  [+] Copied .gitignore');
  } else {
    // Create a default .gitignore
    const defaultGitignore = `# Dependencies
node_modules/
vendor/

# Build outputs
dist/
build/
*.log

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Phoenix OS temporary files
.phoenix-os/temp/

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
`;
    fs.writeFileSync(path.join(targetDir, '.gitignore'), defaultGitignore, 'utf-8');
    printInfo('  [+] Created default .gitignore');
  }

  // Initialize git repository
  printInfo('Initializing git repository...');
  initGitRepository(targetDir);

  printSuccess(`Phoenix OS project '${projectName}' created successfully!`);
  console.log();
  printInfo(`Project location: ${targetDir}`);
  printInfo(`AI Provider: ${aiProvider}`);
  console.log();
  console.log('Next steps:');
  console.log(`  1. cd ${targetDir}`);
  if (aiProvider === 'claude') {
    console.log('  2. Start using Phoenix OS with Claude Code');
  } else if (aiProvider === 'copilot') {
    console.log('  2. Open in VS Code and start using Phoenix OS with GitHub Copilot');
  }
  console.log();

  return true;
}

/**
 * Update an existing project with Phoenix OS files
 * @param {string} projectName - Name of the project
 * @param {string} aiProvider - AI copilot to use
 * @param {string} targetDir - Target directory for the project
 * @returns {boolean} - True if successful, false otherwise
 */
function updateProject(projectName, aiProvider, targetDir) {
  const phoenixRoot = getPhoenixRoot();

  printInfo(`Updating Phoenix OS files in: ${projectName}`);
  printInfo(`Phoenix OS root: ${phoenixRoot}`);
  printInfo(`Target directory: ${targetDir}`);
  printInfo(`AI Provider: ${aiProvider}`);

  try {

    // Create .phoenix-os structure if it doesn't exist
    const phoenixOsDir = path.join(targetDir, '.phoenix-os');
    if (!fs.existsSync(phoenixOsDir)) {
      fs.mkdirSync(path.join(targetDir, '.phoenix-os', 'project', 'specs'), { recursive: true });
      fs.mkdirSync(path.join(targetDir, '.phoenix-os', 'core'), { recursive: true });
    }

    // Setup AI-specific directories based on provider
    if (aiProvider === 'claude') {
      // Create .claude structure if it doesn't exist
      const claudeDir = path.join(targetDir, '.claude');
      if (!fs.existsSync(claudeDir)) {
        fs.mkdirSync(claudeDir, { recursive: true });
      }

      // Update agents and commands in .claude folder
      printInfo('Updating agents and commands in .claude folder...');
      const agentsSrc = path.join(phoenixRoot, 'core', 'agents');
      if (fs.existsSync(agentsSrc)) {
        const agentsDest = path.join(targetDir, '.claude', 'agents');
        // Remove existing agents directory if it exists
        const removeResult = safeRemove(agentsDest);
        if (!removeResult.success) {
          printError(removeResult.error);
          return false;
        }
        copyDirRecursive(agentsSrc, agentsDest);
        printInfo('  [~] Updated agents');
      }

      const commandsPhoenixSrc = path.join(phoenixRoot, 'core', 'commands', 'phoenix');
      if (fs.existsSync(commandsPhoenixSrc)) {
        const commandsDest = path.join(targetDir, '.claude', 'commands', 'phoenix');
        // Remove existing commands/phoenix directory if it exists
        const removeResult = safeRemove(commandsDest);
        if (!removeResult.success) {
          printError(removeResult.error);
          return false;
        }
        fs.mkdirSync(path.join(targetDir, '.claude', 'commands'), { recursive: true });
        copyDirRecursive(commandsPhoenixSrc, commandsDest);
        printInfo('  [~] Updated commands/phoenix');
      }

      // Update CLAUDE.md
      printInfo('Updating CLAUDE.md...');
      const claudeMdSrc = path.join(phoenixRoot, 'CLAUDE.md');
      if (fs.existsSync(claudeMdSrc)) {
        let claudeMdContent = fs.readFileSync(claudeMdSrc, 'utf-8');

        // Update paths for project structure
        claudeMdContent = claudeMdContent
          .replace(/name: Phoenix OS/g, `name: ${projectName}`)
          .replace(/type: Agentic Framework/g, 'type: Application')
          .replace(/\.\/core\/memory\//g, './.phoenix-os/core/memory/')
          .replace(/\.\/core\/commands\//g, './.claude/commands/')
          .replace(/\.\/core\/agents\//g, './.claude/agents/')
          .replace(/\.\/core\/templates\//g, './.phoenix-os/core/templates/')
          .replace(/https:\/\/github\.com\/nagarro-digital\/phoenix-os\.git/g, '[Your repository URL]');

        fs.writeFileSync(path.join(targetDir, 'CLAUDE.md'), claudeMdContent, 'utf-8');
        printInfo('  [~] Updated CLAUDE.md');
      } else {
        printError('CLAUDE.md not found in Phoenix OS root');
      }
    } else if (aiProvider === 'copilot') {
      // Generate .github structure for GitHub Copilot
      const success = generateGitHubStructure(phoenixRoot, targetDir, projectName);
      if (!success) {
        printError('Failed to generate/update .github structure');
        return false;
      }
    } else {
      // This should not happen due to validation earlier, but handle it explicitly
      printError(`Unsupported AI provider: ${aiProvider}`);
      return false;
    }

    // Update core files in .phoenix-os/core
    printInfo('Updating core files in .phoenix-os/core...');
    const coreSrc = path.join(phoenixRoot, 'core');
    if (fs.existsSync(coreSrc)) {
      const entries = fs.readdirSync(coreSrc, { withFileTypes: true });
      const excludeDirs = ['agents', 'commands', 'install'];

      for (const entry of entries) {
        if (excludeDirs.includes(entry.name)) {
          continue;
        }

        const srcPath = path.join(coreSrc, entry.name);
        const destPath = path.join(targetDir, '.phoenix-os', 'core', entry.name);

        // Remove existing directory/file if it exists
        const removeResult = safeRemove(destPath);
        if (!removeResult.success) {
          printError(removeResult.error);
          return false;
        }

        if (entry.isDirectory()) {
          copyDirRecursive(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
        printInfo(`  [~] Updated ${entry.name}`);
      }
    }

    printSuccess(`Phoenix OS files in '${projectName}' updated successfully!`);
    console.log();
    printInfo(`Project location: ${targetDir}`);
    console.log();
    console.log('Next steps:');
    if (aiProvider === 'claude') {
      console.log('  1. Review updated files in .claude/ and .phoenix-os/');
      console.log('  2. Continue using Phoenix OS with Claude Code');
    } else if (aiProvider === 'copilot') {
      console.log('  1. Review updated files in .github/ and .phoenix-os/');
      console.log('  2. Continue using Phoenix OS with GitHub Copilot');
    }
    console.log();

    return true;
  } catch (error) {
    printError(`Failed to update project: ${error.message}`);
    console.log();
    printInfo('Update was interrupted due to errors.');
    printInfo('Your project files remain unchanged.');
    return false;
  }
}

/**
 * Initialize a new Phoenix OS project
 * @param {string|null} projectName - Project name (optional, uses current dir if not provided)
 * @param {string|null} aiProvider - AI copilot (optional)
 * @param {string} currentDir - Current working directory
 * @returns {Promise<number>} - Exit code (0 for success, 1 for failure)
 */
async function initProject(projectName, aiProvider, currentDir) {
  let targetDir;
  let useCurrentDirectory = false;

  // Prompt for AI copilot first if not provided
  if (!aiProvider) {
    aiProvider = await promptForCopilot();

    if (!aiProvider) {
      return 1;
    }
  }

  // If no project name provided, ask user what they want to do
  if (!projectName) {
    console.log();
    const initInCurrentDir = await promptForYesNo('Initialize Phoenix OS in current directory?');

    if (initInCurrentDir) {
      // Use current directory
      useCurrentDirectory = true;
      targetDir = currentDir;
      projectName = path.basename(currentDir);

      // Validate current directory name
      const validation = validateProjectName(projectName);
      if (!validation.isValid) {
        printError(`Current directory name is invalid: ${validation.error}`);
        printInfo('Please run this command from a directory with a valid name, or provide a project name.');
        return 1;
      }
    } else {
      // Create new project - prompt for project name
      console.log();
      projectName = await promptForInput('Enter project name');

      if (!projectName || projectName.trim() === '') {
        printError('Project name cannot be empty');
        return 1;
      }

      projectName = projectName.trim();

      // Validate project name
      const validation = validateProjectName(projectName);
      if (!validation.isValid) {
        printError(validation.error);
        return 1;
      }

      targetDir = path.join(currentDir, projectName);

      // Validate target path for security (prevent path traversal)
      const pathValidation = validateTargetPath(targetDir, currentDir);
      if (!pathValidation.isValid) {
        printError(pathValidation.error);
        return 1;
      }
    }
  } else {
    // Project name provided - create subdirectory
    targetDir = path.join(currentDir, projectName);

    // Validate project name
    const validation = validateProjectName(projectName);
    if (!validation.isValid) {
      printError(validation.error);
      return 1;
    }

    // Validate target path for security (prevent path traversal)
    const pathValidation = validateTargetPath(targetDir, currentDir);
    if (!pathValidation.isValid) {
      printError(pathValidation.error);
      return 1;
    }
  }

  // Validate AI provider is supported
  if (!SUPPORTED_COPILOTS.includes(aiProvider)) {
    printError(`Unsupported AI provider: ${aiProvider}`);
    console.log();
    console.log('Supported AI Copilots:');
    SUPPORTED_COPILOTS.forEach((copilot) => {
      console.log(`  - ${copilot}`);
    });
    return 1;
  }

  // Check if we're initializing in current directory
  if (useCurrentDirectory) {
    // Check if current directory has any Phoenix OS files or other content
    const hasPhoenixFiles = fs.existsSync(path.join(targetDir, DIR_CLAUDE)) ||
                           fs.existsSync(path.join(targetDir, DIR_GITHUB)) ||
                           fs.existsSync(path.join(targetDir, DIR_PHOENIX_OS)) ||
                           fs.existsSync(path.join(targetDir, FILE_CLAUDE_MD));

    const dirContents = fs.readdirSync(targetDir);
    const hasOtherFiles = dirContents.length > 0;

    if (hasPhoenixFiles || hasOtherFiles) {
      // Directory has content - enter update mode
      console.log();
      printInfo(`Initializing Phoenix OS in current directory: ${projectName}`);

      if (hasOtherFiles) {
        printInfo('Directory contains existing files.');
      }

      // Prompt user: initialize/update Phoenix OS files?
      const shouldUpdate = await promptForYesNo('Initialize/update Phoenix OS files in current directory?');

      if (!shouldUpdate) {
        printInfo('Operation cancelled.');
        return 1;
      }

      // Calculate and show diff
      const diff = calculateUpdateDiff(targetDir, aiProvider);
      showUpdateDiff(diff);

      // Prompt for final confirmation
      const confirmUpdate = await promptForYesNo('Proceed?');

      if (!confirmUpdate) {
        printInfo('Operation cancelled.');
        return 1;
      }

      // Perform update
      const success = updateProject(projectName, aiProvider, targetDir);
      return success ? 0 : 1;
    } else {
      // Empty directory - create new project (allow existing directory)
      const success = createProject(projectName, aiProvider, targetDir, true);
      return success ? 0 : 1;
    }
  }

  // Project name was provided - check if subdirectory exists
  if (fs.existsSync(targetDir)) {
    // Directory exists - enter update mode
    console.log();
    printInfo(`Directory '${projectName}' already exists.`);

    // Prompt user: update Phoenix OS files?
    const shouldUpdate = await promptForYesNo('Update Phoenix OS files in existing project?');

    if (!shouldUpdate) {
      printInfo('Update cancelled.');
      return 1;
    }

    // Calculate and show diff
    const diff = calculateUpdateDiff(targetDir, aiProvider);
    showUpdateDiff(diff);

    // Prompt for final confirmation
    const confirmUpdate = await promptForYesNo('Proceed with update?');

    if (!confirmUpdate) {
      printInfo('Update cancelled.');
      return 1;
    }

    // Perform update
    const success = updateProject(projectName, aiProvider, targetDir);
    return success ? 0 : 1;
  }

  // Directory doesn't exist - create new project
  const success = createProject(projectName, aiProvider, targetDir);

  return success ? 0 : 1;
}

module.exports = {
  validateProjectName,
  validateTargetPath,
  safeRemove,
  safeReplace,
  initGitRepository,
  getPhoenixRoot,
  createProject,
  updateProject,
  initProject,
  promptForYesNo,
  calculateUpdateDiff,
  showUpdateDiff,
  flattenCommands,
  generateGitHubStructure,
  SUPPORTED_COPILOTS,
  MAX_PROJECT_NAME_LENGTH,
  INVALID_CHARS,
  GIT_INIT_TIMEOUT_MS,
};
