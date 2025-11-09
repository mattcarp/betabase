# Infisical Setup - Claude Code CLI Handoff Instructions

**Context:** This project has ~96 environment variables scattered across various sources. We're setting up Infisical to centralize secrets management.

**Goal:** Set up Infisical Cloud, install CLI, test with a few secrets, then bulk import.

**Time Estimate:** 15-30 minutes

---

## Phase 1: Install & Verify (5 minutes)

### Step 1.1: Install Infisical CLI globally

```bash
npm install -g @infisical/cli
```

**Expected output:** Installation success message

**Verification:**
```bash
infisical --version
```

**Expected output:** Should show version number (e.g., `infisical version 0.x.x`)

**If installation fails:**
```bash
# Try local install instead
npm install @infisical/cli
npx infisical --version
```

---

### Step 1.2: Check current project structure

```bash
# Verify we're in the right directory
pwd
ls -la | grep -E "package.json|.env"
```

**Expected output:** Should show `/home/user/siam` and list package.json

---

## Phase 2: Infisical Cloud Setup (5 minutes)

### Step 2.1: Login to Infisical

**IMPORTANT:** This will open a browser window for authentication.

```bash
infisical login
```

**Expected behavior:**
1. Browser opens to Infisical login page
2. User authenticates (may need to create account first at https://app.infisical.com/signup)
3. Browser shows "Successfully authenticated!"
4. Terminal shows "✅ Successfully logged in"

**If browser doesn't open automatically:**
- Copy the URL from terminal output
- Paste into browser manually
- Complete authentication

---

### Step 2.2: Initialize Infisical in this project

```bash
cd /home/user/siam
infisical init
```

**Prompts you'll see:**
```
? How would you like to create your project?
  > Create a new project

? What would you like to name your project?
  > siam (or thebetabase)

? Which environment would you like to use?
  > development
```

**Expected output:**
```
✅ Project initialized successfully
Created .infisical.json configuration file
```

---

## Phase 3: Test with Sample Secrets (5 minutes)

### Step 3.1: Add test secrets

Add 3 non-sensitive test secrets to verify the system works:

```bash
# Add public/test secrets first
infisical secrets set NEXT_PUBLIC_BYPASS_AUTH="true" --env=development
infisical secrets set NEXT_PUBLIC_SUPABASE_URL="https://kfxetwuuzljhybfgmpuc.supabase.co" --env=development
infisical secrets set NODE_ENV="development" --env=development
```

**Expected output (for each):**
```
✅ Successfully set secret NEXT_PUBLIC_BYPASS_AUTH
```

---

### Step 3.2: Verify secrets are stored

```bash
# List all secrets
infisical secrets list --env=development

# Get specific secret
infisical secrets get NEXT_PUBLIC_BYPASS_AUTH --env=development
```

**Expected output:** Should show the secrets you just added

---

### Step 3.3: Test secrets injection

```bash
# Test that secrets are injected into a command
infisical run --env=development -- node -e "console.log('NEXT_PUBLIC_BYPASS_AUTH:', process.env.NEXT_PUBLIC_BYPASS_AUTH)"
```

**Expected output:**
```
NEXT_PUBLIC_BYPASS_AUTH: true
```

**If this works:** ✅ Infisical is working correctly!

---

## Phase 4: Inventory Current Secrets (10 minutes)

### Step 4.1: Scan codebase for all env vars

```bash
# Create a list of all environment variables referenced in code
grep -roh "process\.env\.[A-Z_]*" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --include="*.jsx" \
  src/ app/ lib/ scripts/ 2>/dev/null | \
  sed 's/process\.env\.//' | \
  sort -u > /tmp/env-vars-needed.txt

# Count how many we found
wc -l /tmp/env-vars-needed.txt

# Show first 20
head -20 /tmp/env-vars-needed.txt
```

**Expected output:** Should find ~96 unique environment variables

---

### Step 4.2: Check existing env file examples

```bash
# List all env-related files
ls -la .env* 2>/dev/null

# Count variables in example files
echo "=== Variables in .env.example ==="
grep -v "^#" .env.example 2>/dev/null | grep -v "^$" | grep "=" | wc -l

echo "=== Variables in .env.render ==="
grep -v "^#" .env.render 2>/dev/null | grep -v "^$" | grep "=" | wc -l

echo "=== Variables in .env.build ==="
grep -v "^#" .env.build 2>/dev/null | grep -v "^$" | grep "=" | wc -l
```

---

### Step 4.3: Create master template

```bash
# Combine all env vars from code scan and example files
cat /tmp/env-vars-needed.txt > /tmp/all-env-vars.txt

# Add any from example files
grep -h "^[A-Z_]*=" .env.example .env.render .env.build 2>/dev/null | \
  cut -d'=' -f1 >> /tmp/all-env-vars.txt

# Remove duplicates and sort
sort -u /tmp/all-env-vars.txt > /tmp/env-vars-master-list.txt

# Show the final count
echo "Total unique environment variables needed: $(wc -l < /tmp/env-vars-master-list.txt)"

# Save to project for reference
cp /tmp/env-vars-master-list.txt docs/infisical-secrets-needed.txt
```

---

## Phase 5: Report Status & Next Steps

### Step 5.1: Generate status report

```bash
cat > /tmp/infisical-setup-report.md <<'EOF'
# Infisical Setup Status Report

## ✅ Completed Steps

- [ ] Infisical CLI installed
- [ ] Logged into Infisical Cloud
- [ ] Project initialized in /home/user/siam
- [ ] Test secrets added and verified
- [ ] Secrets injection tested (infisical run --)
- [ ] Codebase scanned for env vars
- [ ] Master secrets list created

## 📊 Inventory Results

**Environment variables found in code:** <COUNT>
**Stored in:** docs/infisical-secrets-needed.txt

## 🔍 Sample secrets needed (first 20):

<PASTE FROM env-vars-master-list.txt>

## ⚠️ Issues Encountered

<LIST ANY ERRORS OR WARNINGS>

## 🎯 Next Steps for User

1. **Review the secrets list:** Check docs/infisical-secrets-needed.txt
2. **Decide on bulk import method:**
   - Option A: Import from existing .env.local (if you have one)
   - Option B: Manual entry via Infisical web UI (https://app.infisical.com)
   - Option C: Gradual CLI import as needed
3. **Set up environments:**
   - development (for local dev)
   - production (for Render)
   - staging (optional)
4. **Integrate with CI/CD:**
   - GitHub Actions integration
   - Render environment variable sync

## 💡 Recommended Command Workflow

Once secrets are imported, use this workflow:

\`\`\`bash
# Local development
infisical run --env=development -- npm run dev

# Run tests
infisical run --env=development -- npm test

# Run any script
infisical run --env=development -- node scripts/whatever.js
\`\`\`

## 📝 Files Created

- .infisical.json (project config - DO NOT commit sensitive data)
- docs/infisical-secrets-needed.txt (secrets inventory)

EOF

# Fill in the counts
TOTAL_VARS=$(wc -l < /tmp/env-vars-master-list.txt)
sed -i "s/<COUNT>/$TOTAL_VARS/g" /tmp/infisical-setup-report.md

# Add sample of first 20 secrets
echo "" >> /tmp/infisical-setup-report.md
echo "\`\`\`" >> /tmp/infisical-setup-report.md
head -20 /tmp/env-vars-master-list.txt >> /tmp/infisical-setup-report.md
echo "\`\`\`" >> /tmp/infisical-setup-report.md

# Copy to project
cp /tmp/infisical-setup-report.md INFISICAL_SETUP_REPORT.md

# Display report
cat INFISICAL_SETUP_REPORT.md
```

---

### Step 5.2: Check for .infisical.json in gitignore

```bash
# Make sure .infisical.json is gitignored
if ! grep -q ".infisical.json" .gitignore; then
  echo "" >> .gitignore
  echo "# Infisical configuration" >> .gitignore
  echo ".infisical.json" >> .gitignore
  echo "✅ Added .infisical.json to .gitignore"
else
  echo "✅ .infisical.json already in .gitignore"
fi
```

---

## ⚠️ Important Notes for Claude CLI

1. **Browser interaction required:** The `infisical login` command WILL open a browser. The user needs to complete authentication there.

2. **Don't commit secrets:** If you create any files with actual secret values, DO NOT commit them. Only templates/examples.

3. **Report any errors:** If any command fails, capture the full error message and include it in the report.

4. **Stop if stuck:** If authentication fails or you can't proceed, stop and report the status. Don't try to work around auth issues.

5. **Existing .env.local:** If you find a .env.local file with actual secrets:
   - DO NOT read it or display its contents in this conversation
   - DO mention that it exists
   - User can import it themselves with: `infisical secrets import .env.local --env=development`

---

## 🆘 Troubleshooting

### CLI won't install globally
```bash
# Try without -g flag
npm install @infisical/cli
# Then use: npx infisical instead of infisical
```

### Login fails
```bash
# Check if you're already logged in
infisical user

# If not, try login again
infisical login --domain=https://app.infisical.com
```

### Can't initialize project
```bash
# Check if .infisical.json already exists
ls -la .infisical.json

# If it exists, you may already be initialized
cat .infisical.json
```

---

## ✅ Success Criteria

**Minimum success (Phase 1-3):**
- ✅ CLI installed and working
- ✅ Logged into Infisical Cloud
- ✅ Test secrets set and can be retrieved
- ✅ `infisical run --` command works

**Full success (All phases):**
- ✅ Above + secrets inventory completed
- ✅ Report generated
- ✅ .gitignore updated
- ✅ Ready for bulk secret import

---

## 📤 What to Report Back

Please provide:

1. **Status of each phase** (completed/failed/skipped)
2. **Total env vars found** in inventory
3. **Any errors encountered**
4. **Contents of INFISICAL_SETUP_REPORT.md**
5. **Whether .env.local exists** (yes/no, don't show contents)

---

**END OF HANDOFF INSTRUCTIONS**

Good luck! 🚀
