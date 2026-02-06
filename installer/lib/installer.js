'use strict';

const fs = require('fs');
const path = require('path');

const EXCLUDED_SKILLS = ['sync-claude'];

/**
 * Resolve the package root where core/ and root files live.
 * In production (npm install), core/ is bundled alongside bin/ and lib/.
 * In dev mode, core/ lives one level up from installer/.
 */
function resolvePackageRoot() {
  const installerRoot = path.resolve(__dirname, '..');
  const packagedCore = path.join(installerRoot, 'core');

  if (fs.existsSync(packagedCore)) {
    return installerRoot;
  }

  // Dev mode: look one level up (repo root)
  const repoRoot = path.resolve(installerRoot, '..');
  const repoCore = path.join(repoRoot, 'core');

  if (fs.existsSync(repoCore)) {
    return repoRoot;
  }

  throw new Error(
    'Cannot find core/ directory. Run pack.sh first or execute from the repo root.'
  );
}

/**
 * Copy a directory recursively.
 */
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Copy a file if it exists at source.
 */
function copyFileIfExists(src, dest) {
  if (fs.existsSync(src)) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

/**
 * Transform config.yaml for installed project context.
 * Rewrites component paths from ./core/components/ to .phoenix-os/core/
 * and keeps claude paths as-is.
 */
function transformConfig(content, projectName) {
  let result = content;

  // Update project name
  result = result.replace(
    /^(\s*name:\s*).+$/m,
    `$1${projectName}`
  );

  // Update project type
  result = result.replace(
    /^(\s*type:\s*).+$/m,
    '$1Project'
  );

  // Rewrite component source paths to installed locations
  result = result.replace(
    /^(\s*skills:\s*).+$/m,
    '$1./.claude/skills/'
  );
  result = result.replace(
    /^(\s*recipes:\s*).+$/m,
    '$1./.claude/skills/'
  );
  result = result.replace(
    /^(\s*agents:\s*).+$/m,
    '$1./.claude/agents/'
  );
  result = result.replace(
    /^(\s*memory:\s*).+$/m,
    '$1./.phoenix-os/core/memory/'
  );

  // Remove github section (project-specific)
  result = result.replace(/^platform:.*\n/m, '');
  result = result.replace(/^github:\n(\s+.+\n)*/m, '');

  return result.replace(/\n{3,}/g, '\n\n');
}

/**
 * Transform CLAUDE.md for installed project context.
 * Updates paths and removes dev-only references.
 */
function transformClaudeMd(content, projectName) {
  let result = content;

  // Replace the overview to be project-specific
  result = result.replace(
    /^# CLAUDE\.md$/m,
    `# CLAUDE.md — ${projectName}`
  );

  // Update architecture diagram to reflect installed layout
  result = result.replace(
    /```\ncore\/components\/.*?```/s,
    `\`\`\`
.claude/                   # AI components (managed by Phoenix OS)
├── agents/               # Agent definitions
└── skills/               # Skills + recipes

.phoenix-os/
├── core/
│   ├── memory/           # LTM: practices, templates, standards
│   └── config.yaml       # Project configuration
└── project/              # STM: checkpoints, specs
    └── specs/
\`\`\``
  );

  // Remove "Source of Truth" section — not applicable to installed projects
  result = result.replace(
    /### 1\. Source of Truth[\s\S]*?(?=### 2\. Execution Model)/,
    ''
  );

  // Remove "After editing source, run `/sync-claude`." if still present
  result = result.replace(/After editing source, run `\/sync-claude`\.\n*/g, '');

  // Remove reference to core/config.yaml, update to installed path
  result = result.replace(
    /`core\/config\.yaml`/g,
    '`.phoenix-os/core/config.yaml`'
  );

  // Remove references to docs/ (not installed)
  result = result.replace(/- `docs\/.*\n/g, '');

  return result.replace(/\n{3,}/g, '\n\n');
}

/**
 * Initialize Phoenix OS in the target directory.
 */
async function init(targetDir, options = {}) {
  const projectName = options.projectName || path.basename(targetDir);
  const pkgRoot = resolvePackageRoot();
  const componentsDir = path.join(pkgRoot, 'core', 'components');

  console.log(`Initializing Phoenix OS in ${targetDir}...`);
  console.log(`  Project name: ${projectName}`);

  // Check if already initialized
  const claudeDir = path.join(targetDir, '.claude');
  const phoenixDir = path.join(targetDir, '.phoenix-os');

  if (fs.existsSync(path.join(phoenixDir, 'core', 'config.yaml'))) {
    console.log('\nPhoenix OS is already initialized in this directory.');
    console.log('To reinitialize, remove .phoenix-os/ and .claude/ first.');
    process.exit(1);
  }

  // 1. Deploy agents → .claude/agents/
  const agentsDir = path.join(componentsDir, 'agents');
  const targetAgentsDir = path.join(claudeDir, 'agents');
  if (fs.existsSync(agentsDir)) {
    console.log('  Deploying agents...');
    copyDirSync(agentsDir, targetAgentsDir);
  }

  // 2. Deploy skills → .claude/skills/ (excluding sync-claude)
  const skillsDir = path.join(componentsDir, 'skills');
  const targetSkillsDir = path.join(claudeDir, 'skills');
  if (fs.existsSync(skillsDir)) {
    console.log('  Deploying skills...');
    fs.mkdirSync(targetSkillsDir, { recursive: true });

    for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
      if (entry.isDirectory() && !EXCLUDED_SKILLS.includes(entry.name)) {
        copyDirSync(
          path.join(skillsDir, entry.name),
          path.join(targetSkillsDir, entry.name)
        );
      }
    }
  }

  // 3. Deploy recipes → .claude/skills/ (recipes are user-invocable skills)
  const recipesDir = path.join(componentsDir, 'recipes');
  if (fs.existsSync(recipesDir)) {
    console.log('  Deploying recipes...');
    fs.mkdirSync(targetSkillsDir, { recursive: true });

    for (const entry of fs.readdirSync(recipesDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        copyDirSync(
          path.join(recipesDir, entry.name),
          path.join(targetSkillsDir, entry.name)
        );
      }
    }
  }

  // 4. Deploy memory → .phoenix-os/core/memory/
  const memoryDir = path.join(componentsDir, 'memory');
  const targetMemoryDir = path.join(phoenixDir, 'core', 'memory');
  if (fs.existsSync(memoryDir)) {
    console.log('  Deploying memory...');
    copyDirSync(memoryDir, targetMemoryDir);
  }

  // 5. Transform and write config.yaml → .phoenix-os/core/config.yaml
  const configSrc = path.join(pkgRoot, 'core', 'config.yaml');
  if (fs.existsSync(configSrc)) {
    console.log('  Writing config...');
    const configContent = fs.readFileSync(configSrc, 'utf8');
    const transformed = transformConfig(configContent, projectName);
    const configDest = path.join(phoenixDir, 'core', 'config.yaml');
    fs.mkdirSync(path.dirname(configDest), { recursive: true });
    fs.writeFileSync(configDest, transformed, 'utf8');
  }

  // 6. Create project directories
  console.log('  Creating project structure...');
  fs.mkdirSync(path.join(phoenixDir, 'project', 'specs'), { recursive: true });
  fs.mkdirSync(path.join(targetDir, 'src'), { recursive: true });

  // 7. Transform and write CLAUDE.md
  const claudeMdSrc = path.join(pkgRoot, 'CLAUDE.md');
  if (fs.existsSync(claudeMdSrc)) {
    console.log('  Writing CLAUDE.md...');
    const claudeContent = fs.readFileSync(claudeMdSrc, 'utf8');
    const transformed = transformClaudeMd(claudeContent, projectName);
    fs.writeFileSync(path.join(targetDir, 'CLAUDE.md'), transformed, 'utf8');
  }

  // 8. Copy root files
  const rootFiles = ['README.md', 'LICENSE', '.gitignore'];
  for (const file of rootFiles) {
    copyFileIfExists(
      path.join(pkgRoot, file),
      path.join(targetDir, file)
    );
  }

  console.log('\nPhoenix OS initialized successfully!');
  console.log(`\nProject structure created:`);
  console.log(`  .claude/agents/      — Agent definitions`);
  console.log(`  .claude/skills/      — Skills and recipes`);
  console.log(`  .phoenix-os/core/    — Memory and config`);
  console.log(`  .phoenix-os/project/ — Project artifacts`);
  console.log(`  src/                 — Source code`);
  console.log(`  CLAUDE.md            — AI instructions`);
  console.log(`\nNext steps:`);
  console.log(`  1. Review and customize CLAUDE.md for your project`);
  console.log(`  2. Update .phoenix-os/core/config.yaml with your repo details`);
  console.log(`  3. Start developing with Claude Code!`);
}

module.exports = { init };
