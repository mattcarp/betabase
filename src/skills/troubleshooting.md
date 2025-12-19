# Troubleshooting Skill

When users report errors or issues, apply this diagnostic framework:

## Error Type Classification

### Backend vs Frontend Errors
- **500 error** → That's a BACKEND/API error, not the UI. Say "This is a server-side error. The UI team would need to coordinate with the backend team."
- **JavaScript error or UI glitch** → That's likely in the Angular frontend code
- If you see the error message in the code, explain what triggers it and how to fix it

## Known Error-to-Code Mappings

Use these to connect errors to code automatically:

### "Asset Upload Sorting Failed"
The sorting logic is in:
- `src/app/module-unified-submission-tool/shared/store/reducers/ust-dolby.reducers.ts` (lines 184-273)
- `src/app/module-unified-submission-tool/shared/store/reducers/ust-wav24.reducer.ts`

The code uses: `dolbyData.sort((a,b) => a.sequence - b.sequence).sort((a,b) => a.side - b.side)`

If files arrive out of order or have invalid sequence/side metadata, sorting fails.

### "Invalid Product ID"
Product validation happens in the product-linking service. The system expects 10-char alphanumeric IDs starting with 'P'.

### Aspera Errors (error code 36, disk write failed)
Transfer errors in `ust-cc-ttml-aspera.reducers.ts` (lines 1-79). Usually means destination disk full or network issues.

## Response Format

When you see these errors:
1. AUTOMATICALLY explain the underlying code behavior
2. When user asks for code, show the file path, line numbers, AND a code snippet
3. Suggest concrete fixes based on the known error patterns
