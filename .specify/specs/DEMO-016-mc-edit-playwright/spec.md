# DEMO-016: MC Edit Demo Playwright Automation

## Problem

The demo script (DEMO-SCRIPT-OFFICIAL-MC-EDIT.md) requires reliable, repeatable execution for recording and live presentations. Manual walkthroughs are error-prone and time-consuming. We need Playwright automation that covers all demo sections to ensure:

1. All UI elements are present and functional before demo
2. AI responses work correctly for key queries
3. Navigation between pillars (Chat, Curate, Test) is smooth
4. Screenshots/recordings can be captured consistently

## Source Script Reference

**Source**: `DEMO-SCRIPT-OFFICIAL-MC-EDIT.md`  
**Last Updated**: 2026-01-04

### Demo Flow Summary

```
Preamble
  → localhost, open source, multi-tenant ERD
  
Main Content
  1. Knowledge Base with Tool Calls
     → Hard but answerable question
     → Upcoming release info (JIRAs)
  
  2. Visual Intelligence
     → Mermaid to Nano Banana Pro diagramming
     → DDP parsing tool call
  
  3. Curation Segue
     → Thumbs down on answer
     → Anti-hallucination: "Does AOMA have blockchain?"
  
  4. Knowledge Curation (RLHF/HITL)
     → Upload proprietary docs
     → Delete outdated files
     → Curation queue from thumbs down
  
  5. Testing Pillar
     → Scroll through test list
     → Auto-ranking for automation
     → Self-healing with blast radius
     
Wrap
  → HITL importance
  → "Knowledge Curator of AI" title
```

## Playwright Test Scenarios

### Section 1: Preamble Verification
| Test ID | Description | Validation |
|---------|-------------|------------|
| DEMO-001 | App loads on localhost | Chat input visible, no console errors |
| DEMO-002 | Welcome screen renders | "Welcome" text or logo visible |

### Section 2: Knowledge Base with Tool Calls
| Test ID | Description | Validation |
|---------|-------------|------------|
| DEMO-010 | Hard but answerable query | AI responds with substantive content (>100 chars) |
| DEMO-011 | Upcoming release query (JIRAs) | Response mentions JIRA, tickets, or release |
| DEMO-012 | Multi-source synthesis | Response draws from multiple knowledge sources |

### Section 3: Visual Intelligence (Diagramming)
| Test ID | Description | Validation |
|---------|-------------|------------|
| DEMO-020 | Mermaid diagram generation | Response includes mermaid code block or rendered SVG |
| DEMO-021 | "Improve this diagram" button | Button visible below mermaid diagram |
| DEMO-022 | DDP parsing tool call | Ask about DDP, response shows file parsing |

### Section 4: Anti-Hallucination
| Test ID | Description | Validation |
|---------|-------------|------------|
| DEMO-030 | Blockchain trick question | AI says "no" or "not found" - does NOT fabricate |
| DEMO-031 | Thumbs down feedback flow | Thumbs down button visible, click shows feedback input |

### Section 5: Knowledge Curation (Curate Tab)
| Test ID | Description | Validation |
|---------|-------------|------------|
| DEMO-040 | Navigate to Curate tab | Curate tab content visible |
| DEMO-041 | Upload area visible | File upload input or "Upload" button present |
| DEMO-042 | Delete functionality visible | Delete button/option present |
| DEMO-043 | Curation queue renders | Queue items or empty state visible |

### Section 6: Testing Pillar (Test Tab)
| Test ID | Description | Validation |
|---------|-------------|------------|
| DEMO-050 | Navigate to Test tab | Test dashboard visible |
| DEMO-051 | Test list scrollable | Multiple test items visible |
| DEMO-052 | Expand test details | Click on test shows details panel |
| DEMO-053 | Auto-ranking visible | "Automation Rank" or similar metric shown |
| DEMO-054 | Self-healing tab | Self-Healing sub-tab navigable |
| DEMO-055 | Blast radius visualization | Blast radius indicator when selector moves |

### Section 7: Full Demo Flow
| Test ID | Description | Validation |
|---------|-------------|------------|
| DEMO-060 | Three-pillar navigation | Chat → Curate → Test without errors |
| DEMO-061 | Screenshot capture all tabs | All tabs captured for demo prep |

## Acceptance Criteria

- [ ] All DEMO-0XX tests pass on localhost:3000
- [ ] Tests gracefully skip when API is unavailable (bypass mode)
- [ ] Screenshots captured to `test-results/demo-mc-edit-*.png`
- [ ] Total test time < 3 minutes (excluding AI response waits)
- [ ] No console errors during navigation

## Technical Notes

**Auth Bypass**: Tests set `bypass_auth=true` cookie for localhost.

**AI Response Timeout**: 60s default, +15s for diagram generation.

**Screenshot Naming**: `demo-mc-edit-{section}-{step}.png`

**Test Tags**: `@demo @mc-edit` for filtering.

## Dependencies

- Playwright base test fixture (`tests/fixtures/base-test.ts`)
- Running dev server on localhost:3000
- (Optional) API keys for AI responses

## File Locations

- **Spec**: `.specify/specs/DEMO-016-mc-edit-playwright/spec.md`
- **Test**: `tests/e2e/demo/demo-mc-edit-official.spec.ts`
- **Source Script**: `DEMO-SCRIPT-OFFICIAL-MC-EDIT.md`
