# Known Issues

Current limitations, workarounds, and future fixes for SIAM.

## React Hydration Error (Error 306)

**Issue**: Server/client render differently

**Workaround**: Add `"use client"` directive and mounted state check

**File**: `/src/components/auth/MagicLinkLoginForm.tsx`

## Sharp Warning

**Issue**: pnpm security warning about build scripts

**Impact**: None - Sharp is for image processing (not used with `images.unoptimized: true`)

**Action**: Can be safely ignored in dev

## SPA Navigation Limitations

**Issue**: Cannot navigate via explicit deep links

**Workaround**: App is a SPA - navigation must be through app interface

**Future**: May change to support deep linking

## 541 Pre-existing TypeScript Errors

**Status**: Known and documented

**Impact**: Only fix errors in files YOU modify

**Documentation**: See `docs/TYPESCRIPT-ERROR-STATUS.md`

## Reference

- **Common Issues**: See [COMMON-ISSUES.md](COMMON-ISSUES.md)
- **Debug Commands**: See [DEBUG-COMMANDS.md](DEBUG-COMMANDS.md)

---

_For quick reference, see [QUICK-START.md](../QUICK-START.md)_
