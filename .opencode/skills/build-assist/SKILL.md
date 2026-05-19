---
name: build-assist
description: |
  Execute npm build, parse errors, present each error with file + line + raw output, ask user to confirm before fixing one by one. Use when user mentions "build", "npm run build", "compilar", or any build error. Maximum 5 rounds per session.
---

# Build Assist

## Purpose

Assist with npm build errors by running build, identifying errors, presenting them clearly to the user, and fixing one error at a time with human approval at each step.

## Workflow

### Step 1: Run Build

Execute `npm run build` in the project root and capture the complete output.

### Step 2: Parse Output

If build succeeds:
- Display "✅ Build OK!" and terminate

If build fails:
- Parse all errors from the output
- Extract for each error:
  - File path
  - Line number
  - Raw error message

### Step 3: Present Error

For each error (one at a time, starting from the first):

```
⚠️ Error X of Y

📁 File: src/components/Button.tsx
📍 Line: 42
🔍 Raw Error:
  Type 'string' is not assignable to type 'number'
```

Then ask: **"Corregir esse erro?"** (Yes/No)

### Step 4: Fix Error

If user confirms YES:

1. Read the file at the specified line
2. Analyze the error and apply the fix
3. Run `npm run build` again to verify
4. If fixed → ask "Continuar para próximo erro?"
5. If not fixed → show new error, ask again

If user confirms NO:
- Stop and report summary of remaining errors

### Step 5: Loop

Continue until:
- All errors fixed (show "✅ Build OK!")
- User says NO at any point
- Maximum 5 rounds reached (ask if want to continue)

## Error Parsing Patterns

Common patterns to detect:

- TypeScript: `TSXXXX: ...`
- ESLint: `... (rule-name)`
- Next.js: `Error: ...`
- Generic: `✖ ...` or `ERROR: ...`

Extract file paths from patterns like:
- `src/file.tsx:line:col`
- `src/file.tsx(line,col)`
- `File "src/file.tsx", line N`

## Important Rules

1. **Always ask before fixing** - Never auto-fix without user confirmation
2. **One error at a time** - Fix, verify, then ask about next
3. **Show raw output** - Include the exact error message from build
4. **Verify after fix** - Run build again to confirm fix worked
5. **Respect limit** - Stop after 5 rounds and ask if continue

## Configuration

- Max rounds: 5
- Project path: workspace root
- Build command: npm run build