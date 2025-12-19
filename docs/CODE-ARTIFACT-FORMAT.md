# Beautiful Code Artifact Format - Quick Reference

## 🎨 The Magic Syntax

To trigger the **gorgeous code artifact display** with traffic lights, file path, line numbers, and copy button:

### Format:
```
```language:filepath
code here
``` (close backticks)
```

### Examples:

**Rust:**
```
```rust:cdtext_parser.rs
use std::collections::BTreeMap;

fn parse_cdtext(hex: &str) -> Result<Vec<CdTextPack>, ParseError> {
    // Code here
}
``` (close)
```

**TypeScript:**
```
```typescript:src/app/api/chat/route.ts
export async function POST(req: Request) {
    // Code here
}
``` (close)
```

**Python:**
```
```python:cdtext_parser.py
def parse_cdtext(hex_string: str) -> dict:
    # Code here
``` (close)
```

---

## 🔴🟡🟢 What You Get

When using the `language:filepath` format, the code renders with:

1. **Traffic Light Dots** - macOS-style window chrome (🔴🟡🟢)
2. **File Path Display** - Shows the filename in header
3. **Language Badge** - RUST, TYPESCRIPT, PYTHON, etc.
4. **Line Numbers** - Every line numbered for reference
5. **Syntax Highlighting** - Proper color coding
6. **Copy Button** - One-click copy to clipboard (📋)
7. **Beautiful Styling** - Dark theme, proper spacing

---

## ❌ What NOT to Do

**Bad (no filepath):**
```
```rust
fn main() {
    println!("Hello");
}
``` (close)
```
Result: Plain code block, no artifact display

**Bad (no colon):**
```
```rust cdtext_parser.rs
fn main() {}
``` (close)
```
Result: Plain code block, no artifact display

**Good:**
```
```rust:cdtext_parser.rs
fn main() {
    println!("Hello from artifact!");
}
``` (close)
```
Result: ✨ Beautiful artifact with all features!

---

## 📝 System Prompt Instructions

The system prompt now includes:

```
If they ask for code, use the beautiful code artifact format:
\`\`\`rust:cdtext_parser.rs
// Your working Rust code here
\`\`\`

This triggers the gorgeous code artifact display with:
- Traffic light dots (🔴🟡🟢)
- File path and language badge
- Line numbers
- Copy button
- Syntax highlighting
```

---

## 🎯 Demo Flow

**User:** "Can you parse this CDTEXT?"
→ AI outputs beautiful ShadCN table

**User:** "Great! Show me the Rust code to parse CDTEXT."
→ AI outputs code using `rust:cdtext_parser.rs` format
→ **Beautiful artifact appears!**

---

## 🔧 Implementation

Located in: `src/components/ai-elements/response.tsx` (lines ~288-353)

The `pre` component detects the `:` separator:
- Extracts language (before `:`)
- Extracts filepath (after `:`)
- Renders with CodeBlock component
- Adds traffic lights, file path, line numbers

---

## ✅ Supported Languages

Any language works! Common ones:
- `rust:filename.rs`
- `typescript:filename.ts`
- `python:filename.py`
- `javascript:filename.js`
- `go:filename.go`
- `java:Filename.java`
- `csharp:Filename.cs`
- `cpp:filename.cpp`
- `bash:script.sh`
- `sql:query.sql`

---

## 🎬 Demo Impact

**Before (plain code block):**
- Gray text
- No syntax highlighting
- No file context
- Hard to read

**After (artifact format):**
- 🔴🟡🟢 Traffic lights
- Syntax highlighted
- File path visible
- Professional appearance
- **WOW factor!** 🔥

---

*Use this format for ALL code generation to maximize demo impact and user experience!*

*Updated: December 19, 2025*


