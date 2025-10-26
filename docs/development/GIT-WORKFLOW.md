# Git Workflow Guide

Complete git workflow for SIAM development including merge strategies, commit guidelines, and automation.

## Auto-Resolve package-lock.json Conflicts

**PROBLEM SOLVED**: `package-lock.json` conflicts now resolve automatically!

### Quick Fix

```bash
./scripts/fix-package-lock-conflict.sh
```

The script will:

- Remove the conflicted file
- Regenerate it from `package.json`
- Stage the changes
- Tell you what to do next

### How It Works

Custom git merge driver automatically:

1. Detects `package-lock.json` conflicts
2. Regenerates the lockfile from `package.json`
3. Resolves the conflict automatically

**Configuration files:**

- `.gitattributes` - Tells git to use custom merge strategy
- `.git-merge-drivers/npm-merge-lockfile.sh` - Auto-regeneration script
- Git config (set automatically in repo)

**See full documentation:** `docs/GIT-MERGE-STRATEGIES.md`

### Verification

```bash
# Check if auto-merge is configured
git config --get merge.npm-merge-lockfile.driver
# Should output: .git-merge-drivers/npm-merge-lockfile.sh %O %A %B %P

# If not configured, run:
git config merge.npm-merge-lockfile.name "Auto-regenerate package-lock.json"
git config merge.npm-merge-lockfile.driver ".git-merge-drivers/npm-merge-lockfile.sh %O %A %B %P"
```

## Git Commit Guidelines

### Commit Message Format

Follow conventional commits format:

```bash
feat: add new feature
fix: resolve bug
docs: update documentation
style: formatting changes
refactor: code restructuring
test: add tests
chore: maintenance tasks
```

### Promotional Content - NEVER

**NEVER** add promotional references to commit messages, PRs, or documentation:

- ❌ "Co-Authored-By: Claude"
- ❌ "Generated with Claude Code"
- ❌ Links to claude.com/claude-code
- ❌ Any other promotional/advertising content

These references are unnecessary and unwanted.

### Git Aliases

**`git acm "message"`** - Add all changes and commit with message:

```bash
git acm "Your commit message"
# Equivalent to: git add . && git commit -m "Your commit message"
```

**IMPORTANT**: When user runs `git acm` without a message, Claude should:

1. Analyze recent changes with `git status` and `git diff`
2. Create an appropriate commit message based on the changes
3. Execute `git acm "generated message"`

## Branch Management

### Creating Branches

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Create bugfix branch
git checkout -b fix/bug-description

# Create Claude Code agent branch (auto-deleted after merge)
git checkout -b claude/agent-task-name
```

### Branch Cleanup

```bash
# List all branches
git branch -a

# Delete local branch
git branch -d branch-name

# Force delete local branch
git branch -D branch-name

# Delete remote branch
git push origin --delete branch-name
```

### Auto-Cleanup After PR Merge

`claude/*` branches are automatically deleted after PR merge (configured in `.github/workflows/pr-merge-deploy.yml`).

## Working with Remote

### Pulling Changes

```bash
# Pull latest from main
git pull origin main

# Pull with rebase
git pull --rebase origin main
```

### Pushing Changes

```bash
# Push to remote branch
git push origin <branch-name>

# Force push (use with caution)
git push --force origin <branch-name>

# Push and set upstream
git push -u origin <branch-name>
```

### Syncing Fork

```bash
# Add upstream remote
git remote add upstream <original-repo-url>

# Fetch upstream changes
git fetch upstream

# Merge upstream main into your main
git checkout main
git merge upstream/main
```

## Merge Conflicts

### Resolving Conflicts

```bash
# See which files have conflicts
git status

# Manually resolve conflicts in your editor
# Look for conflict markers: <<<<<<<, =======, >>>>>>>

# After resolving, stage the files
git add <resolved-file>

# Complete the merge
git commit
```

### Common Conflict Patterns

**package-lock.json**: Use auto-resolve script

```bash
./scripts/fix-package-lock-conflict.sh
```

**Code conflicts**: Manually resolve in editor

1. Find conflict markers
2. Choose correct version or merge both
3. Remove conflict markers
4. Test the code
5. Stage and commit

## Git Worktrees (Parallel Development)

```bash
# Create worktree for parallel task development
git worktree add ../project-auth feature/auth-system
git worktree add ../project-api feature/api-refactor

# Run Claude Code in each worktree
cd ../project-auth && claude    # Terminal 1: Auth work
cd ../project-api && claude     # Terminal 2: API work

# List worktrees
git worktree list

# Remove worktree
git worktree remove ../project-auth
```

## Version Bumping

### Before Deployment to Main

```bash
# Bump patch version (0.13.5 -> 0.13.6)
npm version patch

# Bump minor version (0.13.6 -> 0.14.0)
npm version minor

# Bump major version (0.14.0 -> 1.0.0)
npm version major
```

**CRITICAL**: Always bump version before pushing to main - triggers Render deployment!

## GitHub CLI Integration

### Pull Requests

```bash
# Create PR
gh pr create --title "Complete task 1.2: User authentication" \
             --body "Implements JWT auth system as specified in task 1.2"

# View PR status
gh pr status

# List PRs
gh pr list

# Check out PR locally
gh pr checkout <pr-number>

# Merge PR
gh pr merge <pr-number>
```

### Issues

```bash
# Create issue
gh issue create --title "Bug: Login fails" --body "Description..."

# List issues
gh issue list

# View issue
gh issue view <issue-number>

# Close issue
gh issue close <issue-number>
```

### Workflow Monitoring

```bash
# Watch GitHub Actions run
gh run watch

# List recent runs
gh run list

# View specific run
gh run view <run-id>
```

## Git Best Practices

1. **Commit frequently** - Small, focused commits are easier to review and revert
2. **Write clear messages** - Future you will thank present you
3. **Test before committing** - Run quality checks (see [Code Quality](CODE-QUALITY.md))
4. **Pull before pushing** - Avoid unnecessary merge conflicts
5. **Branch for features** - Keep main stable
6. **Clean up branches** - Delete after merge
7. **Use `.gitignore`** - Don't commit build artifacts, secrets, or temp files

## Git Configuration

### User Identity

```bash
# Set user name
git config --global user.name "Your Name"

# Set user email
git config --global user.email "your.email@example.com"
```

### Useful Aliases

```bash
# Add to ~/.gitconfig or set with git config --global alias.<name> <command>

[alias]
    st = status
    co = checkout
    br = branch
    ci = commit
    acm = "!f() { git add -A && git commit -m \"$1\"; }; f"
    lg = log --graph --oneline --decorate --all
    last = log -1 HEAD
    unstage = reset HEAD --
```

## Reference

- **Git Merge Strategies**: Full documentation in `docs/GIT-MERGE-STRATEGIES.md`
- **Code Quality**: See `docs/development/CODE-QUALITY.md` for pre-commit hooks
- **Deployment**: See `docs/deployment/DEPLOYMENT-GUIDE.md` for git-based deployment

---

_For quick reference, see [QUICK-START.md](../QUICK-START.md)_
