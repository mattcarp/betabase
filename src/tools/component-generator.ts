
export interface GeneratedFile {
  path: string;
  content: string;
  type: "component" | "story" | "test" | "types";
}

export interface GenerationResult {
  files: GeneratedFile[];
  errors?: string[];
  warnings?: string[];
}

export class ComponentGenerator {
  async generateComponent(
    definition: any,
    options: any
  ): Promise<GenerationResult> {
    console.log("ComponentGenerator stub called with:", definition?.name);
    return {
      files: [],
      errors: [],
      warnings: [],
    };
  }
}
