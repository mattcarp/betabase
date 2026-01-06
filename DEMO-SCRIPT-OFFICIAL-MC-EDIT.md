# Betabase Demo Script - Official (MC Edit)



## Preamble

* ask system to make mermaind ERD

* all open source: Apache or MIT, or I wrote it.
  Multi-tenant (see if diagram is done)
* all on localhost except for gemini call
* 
* Three pillars (quick)
  * Conversational knowledge base with some unique tool calling

* Knowledge curation with HITL
  * show segue of thumbs down, respond, swith to curation

* Test
  * Self-Healing
  * AI Reinforced
  * Ranking of legacy test candidates for Automation
  * Natural Language to Test Code

## Main Content

1. Knowledge base with tool calls:
   Start with hard, but answerable question
   > **ASK**: "What are the steps to link a product to a master in AOMA?"

2. Also what's in the upcoming release and how to prepare for it (maybe see JIRAs)
   > **ASK**: "What's in the upcoming release and how should we prepare for it?"

3. Diagramming - mermaid to nano banana pro - pick good question/answer candidate ("visual intelligence")
   > **ASK**: "Use your visual intelligence to show me a diagram of the AOMA asset ingestion workflow"

4. Tool calling: ask to read a DDP (should parse all files, including the CD text) - ignore files over 20 megs and check for DDPMS
   > **ASK**: "Can you read and summarize the DDP file structure?"
   > **FOLLOW-UP**: "Read this DDP. Does it include CD-TEXT? Also check for DDPMS and ignore files over 20MB."

5. Curation segue - thumbs down on an answer
   1. Ask no-hallucination question
      > **ASK**: "Does AOMA have a blockchain integration?"
      (Should indicate NO blockchain - honest answer, no fabrication)

6. Knowledge Curation with RLHF, HITL

   1. Management of the knowledge base

      ​	• "Upload proprietary documents"

      ​	• "Delete outdated files"

   2. Show curation cue, how thumbs down in chat produces note in the cue

   3. Mention Human Knowledge vs Knowledge that no LLM could *ever* know (Keith) - anecdotal, "water cooler", phone calls, etc. Also, guardrails that only hums could put on AI.

   4. **If possible,** Tester Mode with moveable ladybug, Switching of testing context depending on which app ladybug moves to (ask claude code to make a feature - will have to use Windsurf or Antigravity)

7. Testing with natural speech to code, code to human-runnable (Prerequisites, steps, expected outcome)

   1. Scroll through long list of human-created tests and results, expand one (pick) (Jack)

   2. Auto-ranking of tests ready for Automation

      1. **Three-tier system**: Tier 1 (>90% auto-approved), Tier 2 (60-90% human review), Tier 3 (<60% architect)

         ##### Tier 1: Auto-Approved (>90% confidence)

         1. **What**: Simple, unambiguous fixes (button renamed, selector changed)
         2. **AI Decision**: Auto-applies immediately
         3. **Human Role**: None - AI is confident
         4. **Example**: Upload button moved from sidebar to toolbar
   
         ##### Tier 2: Human Review Required (60-90% confidence)
   
         - **What**: Structural changes requiring judgment
         - **AI Decision**: Proposes fix, **asks human for approval**
         - **Human Role**: **Review and approve/reject**
         - **Example**: Component refactored with new nesting
   
         ##### Tier 3: Architect Review (< 60% confidence)
   
         - **What**: Complex logic changes, timing issues
         - **AI Decision**: **Escalates to expert human**
         - **Human Role**: **Architect redesigns test**
         - **Example**: Async search debouncing strategy
   
         **KEY MESSAGE**: AI knows when it needs a human. This is collaboration, not replacement.
   
      2. show one test generation
   
   3. Self Healing with Blast Radius, demo (stand up the AOMA login page?)
   
      1. Move rename button, self healing fixes the test. Move to the top right: ask for human intervention.
   
      

## Wrap

* HITL

* New Title Add-On: Knowledge Curator of AI (doesn't cost anything to give a fancy title)





======== DO NOT AUTOMATE PLAYWRIGHT TESTS BELOW THIS LINE -=========

==========================

## AI Slop - See if You Can Splice It In:

## Strategy Section: Small Language Models (45 seconds)

**Transition**: "Now let me explain our strategic approach..."

**Your talking points:**

• " Gemini knows: protein folding, quantum physics, medieval history"

• "Do Sony Music users need that?"

• "This creates an opportunity for Small Language Models"

• "Our solution: Fine-tuned SLM, domain-specific training"

• "The benefits are substantial -cost "
  - **Faster response times** - queries that take 20 seconds could take 2 seconds
  - **Lower cost** - fine-tuned small models are 10-20x cheaper to run
  - **More accurate** - domain-specific knowledge, no irrelevant information

• You can see a roadmap, where:
  - Current: Gemini 3 with RAG
  - Next: Fine-tuned possible locally hosted, open source model
  - "Similar intelligence, faster responses, lower cost"



## Former Closing Recap (15 seconds)

**Your final lines:**

• "Let's recap the seven differentiators:"

• "✅ Multi-source knowledge with too calls and re-ranking"

• "✅ Visual diagram generation"

• "✅ Development context intelligence"

• "✅ Anti-hallucination trust"

• "✅ Strategic SLM approach"

• "✅ Semantic deduplication"
