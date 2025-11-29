# Merge Strategy: Allergist on Demand Theme

## Current Situation

You have **two versions** of the Allergist on Demand Shopify theme:
1. **Current location** (this one): `/Users/andrewskinner/Local Sites/allergist-on-demand/allergist-on-demand/`
2. **MacBook version**: (location to be specified)

## Repository Setup

### Current State
- Repository initialized from Shopify's skeleton-theme
- Remote currently points to: `https://github.com/Shopify/skeleton-theme.git`
- Local `main` branch has your customizations (commit: "transition to macbookpro")
- Includes extensive theme customizations (379 files changed)

### Recommended Approach for Merging Two Versions

#### Step 1: Set Up GitHub Repository
1. ✅ GitHub repository created: `https://github.com/askinne2/allergist-on-demand`
2. ✅ Remote updated:
   ```bash
   git remote set-url origin https://github.com/askinne2/allergist-on-demand.git
   ```

#### Step 2: Push Current Version First
✅ **COMPLETED** - Current version pushed to GitHub:
```bash
cd "/Users/andrewskinner/Local Sites/allergist-on-demand/allergist-on-demand"
git push -u origin main
```

#### Step 3: Prepare MacBook Version for Merge
On your MacBook:

1. **If MacBook version is already a git repo:**
   ```bash
   # Navigate to MacBook theme directory
   cd /path/to/macbook/theme
   
   # Add this repository as a remote
   git remote add current-machine https://github.com/askinne2/allergist-on-demand.git
   
   # Fetch the current version
   git fetch current-machine
   
   # Create a branch for merging
   git checkout -b merge-from-current
   
   # Merge the current machine's main branch
   git merge current-machine/main --no-ff
   ```

2. **If MacBook version is NOT a git repo:**
   ```bash
   # Navigate to MacBook theme directory
   cd /path/to/macbook/theme
   
   # Initialize git if needed
   git init
   
   # Add all files
   git add .
   git commit -m "MacBook version - initial commit"
   
   # Add remote and merge
   git remote add origin https://github.com/askinne2/allergist-on-demand.git
   git fetch origin
   git checkout -b macbook-version
   git merge origin/main --no-ff
   ```

#### Step 4: Resolve Conflicts
When merging, you'll likely encounter conflicts. Recommended approach:

1. **Review conflicts carefully:**
   ```bash
   git status
   git diff
   ```

2. **Use a merge tool:**
   ```bash
   git mergetool
   ```

3. **Common conflict areas to watch:**
   - `config/settings_data.json` - Theme settings
   - `assets/` - CSS and JavaScript customizations
   - `sections/` - Section customizations
   - `templates/` - Template files

4. **After resolving conflicts:**
   ```bash
   git add .
   git commit -m "Merge: Combine current machine and MacBook versions"
   ```

#### Step 5: Push Merged Version
```bash
git push origin macbook-version  # or main, depending on your branch
```

## Best Practices for Future Sync

### Option A: Single Source of Truth (Recommended)
- Always work on one machine and push/pull to GitHub
- Pull before starting work: `git pull origin main`
- Push after completing work: `git push origin main`

### Option B: Feature Branch Workflow
- Create feature branches for different machines:
  - `main` - Production-ready code
  - `macbook-features` - MacBook-specific work
  - `current-machine-features` - Current machine work
- Merge feature branches to `main` when ready

### Option C: Regular Sync Points
- Set up a schedule (daily/weekly) to merge changes
- Use descriptive commit messages: "MacBook: [feature description]"
- Tag important versions: `git tag v1.0.0`

## Useful Git Commands for Merging

```bash
# Compare two branches
git diff main macbook-version

# See commit history
git log --oneline --graph --all

# Find which files differ
git diff --name-only main macbook-version

# Create a backup before merging
git branch backup-before-merge

# Abort a merge if things go wrong
git merge --abort
```

## Important Files to Check After Merge

1. **`.shopify-cli.yml`** - Store configuration
2. **`config/settings_data.json`** - Theme settings (may need manual merge)
3. **`.gitignore`** - Ignore patterns
4. **`README.md`** - Documentation updates

## Next Steps

1. ✅ Current version saved to `main` branch
2. ✅ Set up GitHub remote: `https://github.com/askinne2/allergist-on-demand`
3. ✅ Push current version to GitHub
4. ⏳ Set up MacBook version for merge
5. ⏳ Perform merge and resolve conflicts
6. ⏳ Push merged version

---
**Last Updated**: After initial setup
**Current Branch**: `main`
**Commit**: `1a624d0 - transition to macbookpro` (merged)

