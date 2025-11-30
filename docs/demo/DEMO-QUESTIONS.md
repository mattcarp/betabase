# Best Demo Questions for SIAM

## Purpose
These questions have been curated from test runs to demonstrate SIAM's capabilities effectively. Each generates substantive, non-trivial responses that showcase the system's knowledge and visual generation abilities.

---

## Top 3 Demo Questions (Verified Working)

### 1. System Architecture (Diagram Generation)
**Question:** "Draw a diagram of the AOMA architecture showing how assets flow through the system"

**Why it's good:**
- Generates a Mermaid diagram (visual differentiation)
- Shows cross-system understanding
- Demonstrates non-text output capability

**Expected output type:** Mermaid diagram + explanation

---

### 2. Cross-System Analysis (Multi-Source Synthesis)
**Question:** "Compare the key differences between AOMA2 and AOMA3 for asset registration"

**Why it's good:**
- Requires synthesis across multiple documents
- Shows structured comparison ability
- Multiple source citations prove it's not fabricating

**Expected output type:** Structured comparison table + citations

---

### 3. Process Flow (Workflow Visualization)
**Question:** "Show me the workflow for how an asset gets registered, validated, and exported in AOMA"

**Why it's good:**
- Generates flowchart/process diagram
- Demonstrates understanding of operational workflows
- Visual output showcases diagram generation capability

**Expected output type:** Mermaid flowchart + step explanations

---

## Additional Demo Questions (Also Working)

### 4. Integration Diagram
**Question:** "Show the data flow between AOMA and Sony Ci"

**Expected output type:** Integration diagram showing export flow

### 5. Export Destinations
**Question:** "Create a diagram showing AOMA's export destinations"

**Expected output type:** Export flow diagram

---

## Notes for Demo

- **Pre-caching:** These responses can be pre-cached to reduce latency during live demo
- **Order:** Recommended to start with #1 or #3 (visual) to immediately show differentiation
- **All questions work offline** - No live MCP connections required
- **Anti-hallucination test:** Ask "Does AOMA support blockchain integration?" - should honestly say no info available

---

## Questions NOT to Use (Won't Work)

- ~~"What JIRA tickets are open for AOMA?"~~ - No JIRA MCP integration
- ~~"What is the current health status of AOMA systems?"~~ - No health monitoring data available

---

*Last updated: 2025-11-30*
*Source: Automated test run observations*
