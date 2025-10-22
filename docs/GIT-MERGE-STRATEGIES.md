# Git Merge Strategies - SIAM Project

## Problem: Recurring package-lock.json Conflicts

`package-lock.json` is a generated file that frequently causes merge conflicts when multiple branches modify dependencies. These conflicts are tedious to resolve manually and can break the lockfile if not handled correctly.

## Solution: Automatic Conflict Resolution

We've implemented a **custom git merge driver** that automatically regenerates `package-lock.json` when conflicts occur.

### How It Works

1. **`.gitattributes`** - Tells git to use custom merge strategy for `package-lock.json`
2. **Custom merge driver** - Script that regenerates the lockfile from `package.json`
3. **Automatic resolution** - No manual intervention needed

### Configuration Files

#### 1. `.gitattributes`
```
# package-lock.json: Always regenerate instead of trying to merge
package-lock.json merge=npm-merge-lockfile

# TypeScript build info: Always use ours (it's a generated file)
tsconfig.tsbuildinfo merge=ours

# Next.js build artifacts: Always use ours (generated files)
.next/** merge=ours
```

#### 2. Git Config (per-repository)
```bash
git config merge.npm-merge-lockfile.name "Auto-regenerate package-lock.json"
git config merge.npm-merge-lockfile.driver ".git-merge-drivers/npm-merge-lockfile.sh %O %A %B %P"
```

#### 3. Custom Merge Driver
Location: `.git-merge-drivers/npm-merge-lockfile.sh`

This script:
- Removes the conflicted `package-lock.json`
- Runs `npm install --package-lock-only` to regenerate it
- Marks the conflict as resolved

## Usage

### Automatic (Recommended)

When you merge branches, git will automatically:
1. Detect `package-lock.json` conflict
2. Call the custom merge driver
3. Regenerate the lockfile
4. Continue the merge

**You don't need to do anything!** The merge will complete automatically.

### Manual Fix (If Needed)

If you're already in a conflicted state, run:

```bash
./scripts/fix-package-lock-conflict.sh
```

This helper script will:
- Remove the conflicted `package-lock.json`
- Regenerate it from `package.json`
- Stage the changes
- Show you next steps

### Verifying the Solution

You can test if the merge driver is working:

```bash
# Check git config
git config --get merge.npm-merge-lockfile.driver

# Should output:
# .git-merge-drivers/npm-merge-lockfile.sh %O %A %B %P

# Check .gitattributes
cat .gitattributes | grep package-lock.json

# Should output:
# package-lock.json merge=npm-merge-lockfile
```

## Benefits

### Before (Manual Resolution)
```bash
❌ Merge conflict in package-lock.json
❌ Open file, find conflict markers
❌ Delete entire file
❌ Run npm install
❌ Hope you didn't break anything
❌ git add package-lock.json
❌ git merge --continue
```

### After (Automatic Resolution)
```bash
✅ Auto-resolving package-lock.json conflict...
✅ Regenerated successfully!
✅ Merge completed automatically!
```

## Best Practices

### 1. Keep package.json Clean
The lockfile is regenerated from `package.json`, so ensure:
- Version ranges are correct
- No conflicting dependency versions
- package.json is properly merged before regenerating lockfile

### 2. Review Changes
After a merge with lockfile regeneration:
```bash
git diff HEAD package-lock.json
```

Check for:
- Unexpected version bumps
- Removed packages
- New packages

### 3. Test After Merge
Always run after merging:
```bash
npm ci              # Clean install from lockfile
npm test            # Run tests
npm run build       # Verify build works
```

### 4. CI/CD Integration
Our GitHub Actions already handle this:
```yaml
- name: Install dependencies
  run: npm ci  # Uses exact versions from package-lock.json
```

## Other Merge Strategies

We also configure automatic strategies for other files:

### Generated Files (Always Use Ours)
```
tsconfig.tsbuildinfo merge=ours
.next/** merge=ours
```

**Why?** These are build artifacts that should be regenerated, not merged.

### Binary Files
```
*.png binary
*.jpg binary
*.pdf binary
```

**Why?** Binary files can't be merged textually - git picks one version.

## Troubleshooting

### Problem: Merge driver not running

**Check 1: Is .gitattributes committed?**
```bash
git ls-files .gitattributes
# Should show: .gitattributes
```

**Check 2: Is git config set?**
```bash
git config --get merge.npm-merge-lockfile.driver
# Should show the driver path
```

**Check 3: Is script executable?**
```bash
ls -la .git-merge-drivers/npm-merge-lockfile.sh
# Should show: -rwxr-xr-x (executable)
```

**Fix:**
```bash
# Set config (run from repo root)
git config merge.npm-merge-lockfile.name "Auto-regenerate package-lock.json"
git config merge.npm-merge-lockfile.driver ".git-merge-drivers/npm-merge-lockfile.sh %O %A %B %P"

# Make script executable
chmod +x .git-merge-drivers/npm-merge-lockfile.sh
```

### Problem: npm install fails during merge

This usually means `package.json` has conflicts. Fix `package.json` first:

```bash
# Resolve package.json conflicts manually
git diff package.json

# Edit package.json to fix conflicts
# Remove conflict markers: <<<<<<<, =======, >>>>>>>

# Then regenerate lockfile
npm install --package-lock-only

# Stage and continue
git add package.json package-lock.json
git merge --continue
```

### Problem: Manual override needed

If you need to manually resolve the conflict:

```bash
# Remove the conflicted lockfile
rm package-lock.json

# Regenerate
npm install --package-lock-only

# Stage and commit
git add package-lock.json
git merge --continue
```

## Team Setup

### New Developers

When setting up the repository:

```bash
# Clone the repo
git clone https://github.com/mattcarp/siam.git
cd siam

# Git config is automatically set from .gitattributes
# But verify it's working:
git config --get merge.npm-merge-lockfile.driver

# If not set, run:
git config merge.npm-merge-lockfile.name "Auto-regenerate package-lock.json"
git config merge.npm-merge-lockfile.driver ".git-merge-drivers/npm-merge-lockfile.sh %O %A %B %P"
```

### CI/CD Setup

The merge driver works in CI/CD environments too:

```yaml
# .github/workflows/your-workflow.yml
- name: Setup Git
  run: |
    git config merge.npm-merge-lockfile.name "Auto-regenerate package-lock.json"
    git config merge.npm-merge-lockfile.driver ".git-merge-drivers/npm-merge-lockfile.sh %O %A %B %P"

- name: Merge main
  run: git merge origin/main
  # package-lock.json conflicts will auto-resolve!
```

## Summary

✅ **Automatic resolution** of package-lock.json conflicts
✅ **No manual intervention** needed
✅ **Guaranteed correctness** (regenerated from package.json)
✅ **Works in CI/CD** environments
✅ **Team-friendly** (committed to repo)

**Never manually edit package-lock.json conflicts again!** 🎉

## References

- Git Attributes: https://git-scm.com/docs/gitattributes
- Git Merge Drivers: https://git-scm.com/docs/gitattributes#_defining_a_custom_merge_driver
- npm package-lock.json: https://docs.npmjs.com/cli/v9/configuring-npm/package-lock-json
