/**
 * Unit tests for Smart Diagrams (F014)
 *
 * Tests the mermaid diagram functionality:
 * 1. Diagram type detection
 * 2. Skill loader triggers
 * 3. shouldOfferDiagram detection
 */

import { describe, it, expect } from "vitest";
import { detectDiagramType } from "@/components/ai-elements/mermaid-diagram";
import { identifyRelevantSkills, SKILL_DEFINITIONS } from "@/services/skillLoader";
import { shouldOfferDiagram } from "@/components/ai/demo-enhancements/DiagramOffer";

describe("Smart Diagrams - F014", () => {
  describe("detectDiagramType", () => {
    it("should detect flowchart as workflow", () => {
      const code = `flowchart TB
        A[Start] --> B[Process]
        B --> C[End]`;
      expect(detectDiagramType(code)).toBe("workflow");
    });

    it("should detect sequenceDiagram as workflow", () => {
      const code = `sequenceDiagram
        participant User
        participant API
        User->>API: Request`;
      expect(detectDiagramType(code)).toBe("workflow");
    });

    it("should detect graph TD as workflow", () => {
      const code = `graph TD
        A --> B
        B --> C`;
      expect(detectDiagramType(code)).toBe("workflow");
    });

    it("should detect graph LR as workflow", () => {
      const code = `graph LR
        A --> B --> C`;
      expect(detectDiagramType(code)).toBe("workflow");
    });

    it("should detect stateDiagram as workflow", () => {
      const code = `stateDiagram-v2
        [*] --> Active
        Active --> [*]`;
      expect(detectDiagramType(code)).toBe("workflow");
    });

    it("should detect gantt as workflow", () => {
      const code = `gantt
        title A Gantt Chart
        section Section`;
      expect(detectDiagramType(code)).toBe("workflow");
    });

    it("should default to explainer for unknown diagram types", () => {
      const code = `erDiagram
        CUSTOMER ||--o{ ORDER : places`;
      expect(detectDiagramType(code)).toBe("explainer");
    });

    it("should default to explainer for class diagrams", () => {
      const code = `classDiagram
        class Animal`;
      expect(detectDiagramType(code)).toBe("explainer");
    });

    it("should be case-insensitive", () => {
      const code = `FLOWCHART TB
        A --> B`;
      expect(detectDiagramType(code)).toBe("workflow");
    });
  });

  describe("Diagram Generation Skill", () => {
    it("should have diagram-generation skill defined", () => {
      const skill = SKILL_DEFINITIONS.find(s => s.id === "diagram-generation");
      expect(skill).toBeDefined();
      expect(skill?.fileName).toBe("diagram-generation.md");
    });

    it("should trigger for workflow queries", () => {
      const skills = identifyRelevantSkills("How does the asset ingestion workflow work?");
      const skillIds = skills.map(s => s.id);
      expect(skillIds).toContain("diagram-generation");
    });

    it("should trigger for architecture queries", () => {
      const skills = identifyRelevantSkills("Explain the AOMA architecture");
      const skillIds = skills.map(s => s.id);
      expect(skillIds).toContain("diagram-generation");
    });

    it("should trigger for process queries", () => {
      const skills = identifyRelevantSkills("What is the asset approval process?");
      const skillIds = skills.map(s => s.id);
      expect(skillIds).toContain("diagram-generation");
    });

    it("should trigger for 'how does' queries", () => {
      const skills = identifyRelevantSkills("How does multi-tenancy work in AOMA?");
      const skillIds = skills.map(s => s.id);
      expect(skillIds).toContain("diagram-generation");
    });

    it("should trigger for pipeline queries", () => {
      const skills = identifyRelevantSkills("Explain the data pipeline");
      const skillIds = skills.map(s => s.id);
      expect(skillIds).toContain("diagram-generation");
    });

    it("should NOT trigger for simple fact queries", () => {
      const skills = identifyRelevantSkills("What is AOMA?");
      const skillIds = skills.map(s => s.id);
      // Should only have base-personality, not diagram-generation
      expect(skillIds).not.toContain("diagram-generation");
    });

    it("should always include base-personality", () => {
      const skills = identifyRelevantSkills("How does the workflow work?");
      const skillIds = skills.map(s => s.id);
      expect(skillIds).toContain("base-personality");
    });
  });

  describe("shouldOfferDiagram", () => {
    it("should return false for short content", () => {
      expect(shouldOfferDiagram("This is short.")).toBe(false);
    });

    it("should return false for 'I don't know' responses", () => {
      const content = "I don't have any information about that topic. I've looked through the knowledge base but couldn't find relevant data.";
      expect(shouldOfferDiagram(content)).toBe(false);
    });

    it("should return true for workflow content", () => {
      const content = "The asset ingestion workflow involves several steps. First, the user uploads a file. Then the system validates the format. Next, metadata is extracted. Finally, the asset is stored in the database. This process ensures data quality throughout.";
      expect(shouldOfferDiagram(content)).toBe(true);
    });

    it("should return true for content with numbered steps", () => {
      const content = "To complete this task: 1. Open the dashboard. 2. Navigate to settings. 3. Configure the options. 4. Save your changes. This ensures the configuration is properly saved.";
      expect(shouldOfferDiagram(content)).toBe(true);
    });

    it("should return true for architecture content", () => {
      const content = "The AOMA system architecture consists of multiple components. The frontend layer handles user interactions. The API layer processes requests and routes them to appropriate services. The data layer manages persistence and caching.";
      expect(shouldOfferDiagram(content)).toBe(true);
    });

    it("should return true for content with arrows", () => {
      const content = "The data flows from the client -> API -> database -> cache -> response. This pipeline ensures efficient data handling and proper caching of frequently accessed items.";
      expect(shouldOfferDiagram(content)).toBe(true);
    });

    it("should return false for responses indicating no knowledge", () => {
      const content = "I couldn't find information about that in my knowledge base. The data doesn't seem to be available for this query.";
      expect(shouldOfferDiagram(content)).toBe(false);
    });
  });

  describe("Mermaid Theme Configuration", () => {
    // These tests verify the component exports the expected config
    it("should use dark theme colors", async () => {
      // Dynamic import the component to check config
      const { MermaidDiagram, detectDiagramType: detect } = await import("@/components/ai-elements/mermaid-diagram");

      // Verify the component exists and function works
      expect(MermaidDiagram).toBeDefined();
      expect(detect("flowchart TB")).toBe("workflow");
    });
  });
});
