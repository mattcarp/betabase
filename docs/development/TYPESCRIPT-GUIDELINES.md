# TypeScript Guidelines

TypeScript-first development standards and best practices for SIAM.

## TypeScript-First Development - MANDATORY STANDARD

**CRITICAL**: All NEW code MUST pass `npm run type-check` before being proposed as PR-ready.

## The Standard (Effective Immediately)

**BEFORE proposing ANY PR as ready for review:**

```bash
# 1. MANDATORY: Check TypeScript errors in YOUR files
npm run type-check 2>&1 | grep "error TS"

# 2. Verify YOUR changed files are error-free
git diff --name-only main...HEAD | while read file; do
  errors=$(npm run type-check 2>&1 | grep "$file")
  if [ -n "$errors" ]; then
    echo "❌ ERRORS in $file:"
    echo "$errors"
  fi
done

# 3. Format check
npm run format:check

# 4. Lint check
npm run lint

# 5. Build check
npm run build
```

## Why This Matters

**Before this standard**: Virtually none of our PRs passed because they weren't tested at write-time.

**After this standard**: Every PR is TypeScript-clean, preventing type errors from reaching production.

## Pre-existing Errors

**Status**: 541 pre-existing TypeScript errors exist in the codebase (as of 2025-10-24).

**Your responsibility**: Only fix errors in files YOU modify. Pre-existing errors are NOT blockers for your PR.

**See**: `docs/TYPESCRIPT-ERROR-STATUS.md` for complete breakdown of pre-existing errors and cleanup plan.

## Common TypeScript Errors and Fixes

### TS6133: Variable declared but never used

```typescript
// ❌ Bad
import { Foo, Bar } from './utils';
const [count, setCount] = useState(0);

// ✅ Good - Remove unused imports/variables
import { Foo } from './utils';
const [count, setCount] = useState(0);

// ✅ Good - Prefix with _ if intentionally unused
const [count, _setCount] = useState(0);
items.map((item, _index) => ...)
```

### TS7030: Not all code paths return a value

```typescript
// ❌ Bad
useEffect(() => {
  if (condition) {
    return () => cleanup();
  }
}); // Missing return in else case

// ✅ Good
useEffect(() => {
  if (condition) {
    return () => cleanup();
  }
  return undefined; // Explicit return
});
```

### TS7006: Parameter implicitly has 'any' type

```typescript
// ❌ Bad
const handleClick = (e) => { ... }

// ✅ Good
const handleClick = (e: React.MouseEvent) => { ... }
```

### TS18048: Expression is possibly undefined

```typescript
// ❌ Bad
const name = user.profile.name; // profile might be undefined

// ✅ Good
const name = user.profile?.name;
const name = user.profile?.name ?? "Unknown";
```

### TS2345: Argument type not assignable

```typescript
// ❌ Bad
function greet(name: string) { ... }
greet(123);

// ✅ Good
greet("John");
greet(String(123));
```

### TS2339: Property does not exist on type

```typescript
// ❌ Bad
interface User {
  name: string;
}
const user: User = { name: "John" };
console.log(user.age); // Property 'age' does not exist

// ✅ Good - Add property to interface
interface User {
  name: string;
  age?: number;
}

// ✅ Good - Use type assertion if you know it exists
console.log((user as any).age);
```

## Claude Code Workflow Integration

**MANDATORY for Claude**: Before claiming PR-ready status:

1. ✅ Run `npm run type-check`
2. ✅ Check if YOUR modified files have errors
3. ✅ Fix ALL errors in YOUR files
4. ✅ Run format:check, lint, build
5. ✅ ONLY THEN claim PR-ready

**DO NOT**:

- ❌ Suppress errors with `@ts-ignore` or `@ts-expect-error` (unless absolutely necessary)
- ❌ Disable strict type checks in tsconfig.json
- ❌ Claim PR-ready without running type-check
- ❌ Leave type errors for "later"

## Type Checking Commands

### Check All Errors

```bash
# Check total errors
npm run type-check 2>&1 | grep "error TS" | wc -l

# Check errors in specific file
npm run type-check 2>&1 | grep "src/components/MyComponent.tsx"

# Check errors by type
npm run type-check 2>&1 | grep "error TS6133"  # Unused variables
```

### Check Changed Files Only

```bash
# Get list of changed files
git diff --name-only main...HEAD

# Check errors in changed files
git diff --name-only main...HEAD | while read file; do
  npm run type-check 2>&1 | grep "$file"
done
```

## TypeScript Best Practices

### Type Annotations

```typescript
// ✅ Prefer explicit types for function parameters
function calculateTotal(items: CartItem[], tax: number): number {
  return items.reduce((sum, item) => sum + item.price, 0) * (1 + tax);
}

// ✅ Use type inference for simple cases
const count = 5; // Type inferred as number
const message = "Hello"; // Type inferred as string

// ❌ Avoid unnecessary type annotations
const count: number = 5; // Redundant
```

### Interface vs Type

```typescript
// ✅ Use interface for object shapes
interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ Use type for unions, intersections, and primitives
type Status = "pending" | "approved" | "rejected";
type ID = string | number;

// ✅ Extend interfaces
interface Admin extends User {
  permissions: string[];
}
```

### Nullable Types

```typescript
// ✅ Use optional chaining
const userName = user?.profile?.name;

// ✅ Use nullish coalescing
const displayName = userName ?? "Anonymous";

// ✅ Declare nullable types explicitly
let result: string | null = null;

// ❌ Avoid using undefined explicitly
let result: string | undefined; // Prefer null
```

### Generic Types

```typescript
// ✅ Use generics for reusable components
function identity<T>(value: T): T {
  return value;
}

// ✅ Constrain generics when needed
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

### Type Guards

```typescript
// ✅ Use type guards for narrowing
function isString(value: unknown): value is string {
  return typeof value === "string";
}

if (isString(input)) {
  console.log(input.toUpperCase()); // TypeScript knows it's a string
}
```

### Async/Await Types

```typescript
// ✅ Type async functions explicitly
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

// ✅ Handle errors with try/catch
async function fetchUserSafe(id: string): Promise<User | null> {
  try {
    return await fetchUser(id);
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return null;
  }
}
```

## tsconfig.json Configuration

### Current Settings

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

### Strict Mode

**KEEP STRICT MODE ENABLED** - Do not disable:

- `strict: true`
- `noImplicitAny`
- `strictNullChecks`
- `strictFunctionTypes`

## React TypeScript Patterns

### Component Props

```typescript
// ✅ Define props interface
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}

export function Button({ label, onClick, disabled, variant = "primary" }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled} className={variant}>
      {label}
    </button>
  );
}
```

### Event Handlers

```typescript
// ✅ Type event handlers correctly
const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
  console.log(event.currentTarget);
};

const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  console.log(event.target.value);
};
```

### Hooks

```typescript
// ✅ Type useState
const [count, setCount] = useState<number>(0);
const [user, setUser] = useState<User | null>(null);

// ✅ Type useRef
const inputRef = useRef<HTMLInputElement>(null);

// ✅ Type useCallback
const handleClick = useCallback((id: string) => {
  console.log(id);
}, []);
```

## Quick Reference

```bash
# Check total errors
npm run type-check 2>&1 | grep "error TS" | wc -l

# Check errors in specific file
npm run type-check 2>&1 | grep "src/components/MyComponent.tsx"

# Check errors by type
npm run type-check 2>&1 | grep "error TS6133"  # Unused variables

# See full status report
cat docs/TYPESCRIPT-ERROR-STATUS.md
```

## Reference

- **Code Quality**: See [CODE-QUALITY.md](CODE-QUALITY.md) for linting integration
- **Testing Strategy**: See [TESTING-STRATEGY.md](TESTING-STRATEGY.md) for type-safe testing
- **TypeScript Error Status**: See `docs/TYPESCRIPT-ERROR-STATUS.md` for current error breakdown

---

_For quick reference, see [QUICK-START.md](../QUICK-START.md)_
