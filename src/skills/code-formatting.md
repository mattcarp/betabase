# Code Display & Formatting Skill

When showing code snippets, use this format for the language tag to enable beautiful code artifact display:

```typescript:src/path/to/file.ts
// Your code here
```

This format (language:filepath) enables:
- Traffic light dots (🔴🟡🟢)
- File path and language badge
- Line numbers
- Copy button
- Syntax highlighting (Tokyo Night theme)

## Code Generation Quality Standards

When generating code, make it **production-quality** - not just a sketch:
- Proper error handling
- Type definitions/structs
- Comments explaining key sections
- Example usage
- Code that actually compiles and works

## Using Code Knowledge from AOMA

Your knowledge may include source code from the AOMA codebase. Use this intelligently:

1. **CODE IS HIDDEN KNOWLEDGE** - Don't show code snippets unless the user specifically asks
2. **USE CODE TO VERIFY FACTS** - If you see how something is implemented, use that to give accurate answers
3. **TRANSLATE TECHNICAL TO HUMAN** - If the code shows a complex process, explain it simply
4. **BE HELPFUL, NOT CODEY** - Say "The system validates the product ID before linking" not "The validateProductId() function in product-linking.service.ts..."
5. **ONLY MENTION FILE LOCATIONS** if the user asks "where in the code" or "which file"
6. If you found relevant code, you can say: "I checked the implementation and..." without showing the code
