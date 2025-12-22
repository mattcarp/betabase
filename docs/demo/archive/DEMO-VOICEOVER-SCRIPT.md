# SIAM Technical Demo - Voiceover Script (Final Cut)

**Audience:** Senior Engineers / Tech Support Colleagues
**Tone:** Informal, Technical, "Under the Hood"
**Goal:** Show the architecture and the 3 key pillars (Chat, Curate, Testing)

| Visual Cue (DaVinci Resolve Overlay) | Script / Voiceover |
| :--- | :--- |
| **[FACE VIGNETTE ONLY]** | "Hey everyone. I want to show you what we've built with **SIAM** (Smart In A Meeting)." |
| **[FACE VIGNETTE ONLY]** | "Before we get to the shiny stuff, let's look at the data model because that's the real unlock here." |
| **[IMAGE: siam_multitenant_erd.png]**<br>*(Fade In, Zoom 100% -> 105%)* | "We built this from the ground up to be **multi-tenant**. It's not just one bucket of docs. We have **Organizations** at the top, which split into **Divisions** (like MSO, RCA), and then down to individual **Applications** (AOMA, DDEX)." |
| **[IMAGE: siam_multitenant_erd.png]** | "This isolation means we can spin up a new instance for any team without data bleed. It's clean, it's secure, and it scales." |
| **[SCREEN RECORDING: Chat Interface]** | "So, the Chat interface. The hard part wasn't the LLM; it was the **context window management**." |
| **[ACTION: Type 'Status of AOMA migration']** | "Watch the latency. We're hitting Jira, Git, and Confluence simultaneously. We're using a **hybrid RAG approach**—keyword search for precision, vector search for semantics." |
| **[ACTION: Open Thought Bubble]** | "This 'Thought Bubble' isn't just UI candy. It's exposing the agent's reasoning chain. You can see it deciding to prioritize the Jira ticket over the old Wiki page." |
| **[ACTION: Type 'Generate architecture diagram']** | "And for output, we moved beyond text. We're rendering **Mermaid diagrams** on the fly." |
| **[IMAGE: siam_architecture_diagram_v2.png]**<br>*(Overlay on top of chat)* | "This is fully interactive. The agent generates the code, and we render it client-side. Great for explaining complex flows during an incident." |
| **[SCREEN RECORDING: Curate Tab]** | "Now, the problem with RAG is drift. Docs get stale. Models hallucinate. We built a dedicated **Curate Tab** to handle this via RLHF." |
| **[ACTION: Scroll Feedback Queue]** | "This is where our domain experts live. It's a direct feedback loop into the vector store." |
| **[IMAGE: rlhf_virtuous_cycle.png]**<br>*(Fade In)* | "When I downvote an answer here and mark a doc as 'irrelevant', we're actually **updating the embedding metadata**." |
| **[IMAGE: rlhf_virtuous_cycle.png]** | "Next time the query runs, that bad chunk is penalized. We're essentially fine-tuning the retrieval without retraining the model." |
| **[SCREEN RECORDING: Testing Tab]** | "Finally, how do we deploy on Friday without sweating? We've seeded this with **thousands of automated tests**." |
| **[IMAGE: automated_testing_pipeline.png]**<br>*(Fade In)* | "The killer feature here is **Self-Healing Tests**. We're using **TestSprite** (our AI Agent) to analyze failures." |
| **[IMAGE: automated_testing_pipeline.png]** | "If a selector breaks—say, `#submit-btn` becomes `#confirm-btn`—TestSprite doesn't just fail the test. It looks at the DOM, finds the semantically equivalent element, and **heals the test automatically**." |
| **[FACE VIGNETTE ONLY]** | "So that's the stack. Multi-tenant architecture, hybrid RAG aggregation, and a closed-loop testing pipeline. It's running in prod now. Let me know if you want to dig into the code." |
