# JIRA Export Quick Reference

**Updated**: November 1, 2025

---

## 🔗 Direct Export Link

**All Sony Music Projects (since July 4, 2025)**:

```
https://jira.smedigitalapps.com/jira/issues/?jql=project%20in%20(DPSA%2C%20AOMA%2C%20AOMA2%2C%20AOMA3%2C%20ITSM%2C%20UST)%20AND%20(created%20%3E%3D%20%222025-07-04%22%20OR%20updated%20%3E%3D%20%222025-07-04%22)%20ORDER%20BY%20updated%20DESC
```

**JQL Query** (decoded):
```jql
project in (DPSA, AOMA, AOMA2, AOMA3, ITSM, UST) AND (created >= "2025-07-04" OR updated >= "2025-07-04") ORDER BY updated DESC
```

---

## 📊 Projects Tracked

| Project | Full Name | Description |
|---------|-----------|-------------|
| DPSA | Digital Product Service Application | Digital product workflows |
| AOMA | Asset and Offering Management Application | Asset management (v1) |
| AOMA2 | AOMA v2 | Asset management (v2) |
| AOMA3 | AOMA v3 | Asset management (v3) |
| ITSM | IT Service Management | IT support tickets |
| UST | Universal Submission Tool | Universal submission workflows |

---

## 📥 How to Export (Correct Way)

### Step 1: Navigate to Issue Search

**Use the link above** OR manually:
1. Go to https://jira.smedigitalapps.com/jira
2. Click **"Issues"** → **"Search for issues"**
3. Switch to **"Advanced"** search mode
4. Paste the JQL query

### Step 2: Export with All Fields

**CRITICAL**: You must export from the **Issue Navigator/List View**, not from a board!

1. Make sure you're in **"List View"** (not Board/Kanban view)
2. Click **"Export"** dropdown (top-right)
3. Select **"Export Excel CSV (All Fields)"** or **"CSV (All Fields)"**
   - ⚠️ **NOT** just "Export to Excel" - that only exports visible columns!

### Step 3: Required Columns

The export MUST include these columns:
- ✅ Issue key / Key
- ✅ Summary
- ✅ **Created** (critical for timestamps!)
- ✅ **Updated** (critical for timestamps!)
- ✅ Description
- ✅ Status
- ✅ Priority
- ✅ Issue Type
- ✅ Project
- ✅ Assignee
- ✅ Reporter

**Minimum acceptable**: Issue key, Summary, Created, Updated

---

## 🚀 Import Commands

### For CSV Export:

```bash
# Dry run
node scripts/data-collection/import-jira-csv.js \
  ~/Downloads/jira-export.csv \
  --dry-run

# Live import
node scripts/data-collection/import-jira-csv.js \
  ~/Downloads/jira-export.csv
```

### For Excel Export (.xls or .xlsx):

```bash
# Dry run
node scripts/data-collection/import-jira-excel.js \
  ~/Downloads/jira-export.xls \
  --dry-run

# Live import
node scripts/data-collection/import-jira-excel.js \
  ~/Downloads/jira-export.xls
```

---

## 🎯 Update Frequency

**Recommended**: Update monthly or when you need current data

**Update the JQL date** each time:
```jql
created >= "2025-11-01" OR updated >= "2025-11-01"
```

Replace `2025-11-01` with the date of your last successful import.

---

## ⚠️ Common Mistakes

### ❌ Wrong Export Option
**Problem**: Using "Export to Excel" from Board view
**Result**: Only exports visible columns (Key, Summary, Progress, Type, Priority)
**Solution**: Use "Export Excel CSV (All Fields)" from Issue Navigator

### ❌ Wrong View
**Problem**: Exporting from Board/Kanban view
**Result**: Limited export options
**Solution**: Switch to List View / Issue Navigator first

### ❌ Not Including Timestamps
**Problem**: Export missing "Created" and "Updated" columns
**Result**: Timestamps will be null in database
**Solution**: Add columns to view before exporting, or use "All Fields" export

---

## 📝 Quick Reference

| What You Need | Where to Find It |
|---------------|------------------|
| **Correct JIRA View** | Issues → Search for issues → Advanced → List View |
| **Export Option** | Export dropdown → "Excel CSV (All Fields)" |
| **Verify Export** | Check first row has: Key, Summary, Created, Updated |
| **Import Script** | `import-jira-excel.js` or `import-jira-csv.js` |
| **Dry Run First** | Always use `--dry-run` flag first |

---

**Last Export**: November 1, 2025  
**Next Recommended**: December 1, 2025  
**Format**: Excel CSV (All Fields) preferred

