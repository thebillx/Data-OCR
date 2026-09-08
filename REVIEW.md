# Review — 2026-09-08

## Readiness

Ready for developer trial as a mock-image editor, not certified for the bank's OCR/NTB flow.
The original supplied image is preserved when fields are unchanged. Edited text uses
self-hosted Sarabun over one continuous clean plate; exact typography and background
equivalence is not claimed. The original permanent mock warning remains intact.

## Verified

- TypeScript typecheck: pass.
- Production build: pass after final changes.
- Automated tests: 9/9 pass — date conversion, leap years, invalid values, identifier formatting,
  zero preservation, non-mutating validation, reference rendering dimensions and final
  watermark, SSR page, CSS and component contracts.
- Browser: Thai/English name editing, 13-digit identifier with leading zeros, address,
  issuer and invalid DOB (31 February remains invalid and export stays available).
- Actual PNG files produced at 1536×1024 and 3072×2048; decoded and visually inspected.
  The final 1× checks covered all editable values cleared, a complete replacement fixture,
  and the issuer cleared independently. No original text shadow remained in those exports.
  Browser automation's download event timed out although files were written successfully;
  the downloaded artifacts were located in its shared download directory and verified.
- PNG upload and keyboard crop zoom (1.00 → 1.05); reset restores original fixture.
- Post-export fallback verified: save-again link, full-size PNG dialog and 3072×2048
  decoded image. Editing after export removes the stale download link as intended.
- Browser console contained no application errors. Logged errors came only from the
  browser-test extension (`chrome-extension://…`), outside this application.
- Narrow-width browser check using a 390px iframe: content width 375px, scroll width 375px;
  no horizontal overflow, export visible, text input usable. Not an actual iOS device test.

## Changes from review

- Replaced the generic mock layout with the owner's original reference image.
- Kept original static artwork and portrait instead of regenerating the entire card.
- Fixed export dimensions/aspect ratio, stale image load handling, opaque photo base,
  and leftover address/issuer pixels at replacement boundaries.
- Moved export controls above preview so the download action is visible immediately.
- Added a persistent post-export result with “save again” and a full PNG preview for
  mobile browsers where an automatic download may be hidden or ignored.
- Switched edited cards to one continuous clean plate, then redraws every editable field.
  This removes original text shadows and the rectangular seams produced by per-field patches.
- Added a feathered local repair for the issuer line retained in the clean plate while
  restoring the fixed stamp and signature after the repair.
- Invalidated a generated PNG whenever any field, photo crop or output scale changes,
  preventing an earlier image from being saved after editing.
- Removed obsolete starter artwork/examples and aligned starter tests with the editor.

## Limitations / next acceptance checks

1. Run a positive and negative fixture through the actual DEV OCR/NTB environment.
   No bank API, device, account or downstream flow has been accessed by this project.
2. Test PNG saving on the target iPhone/Safari and Android browser; browser download
   behavior and photo-picker memory limits differ by device.
3. Source fonts or a layered original are required for closer typography matching.
   The clean plate can differ subtly from the supplied JPEG. 2× export upscales the
   reference; it does not add original background detail.
4. Barcode/chip/stamp/signature are fixed specimen pixels, not generated identifiers.
5. Address is limited to two rendered lines; overly long text warns and may clip.
6. No autosave, persistence, server upload, OCR recognition or checksum validation.
   Do not enter real personal/customer data. Keep the mock warning in all exports.

## Asset provenance

The owner supplied `public/card-reference.jpeg`. The clean patch image was made once
with built-in imagegen from that reference: remove variable ID, Thai/English name,
DOB, address and issue/expiry date values; preserve layout, labels, blue background,
portrait, artwork and permanent MOCK DATA / DEV TEST / NOT VALID warning.
When any text changes, the full clean plate is used so all editable fields share one
continuous background. The unchanged state still uses the original JPEG. The issuer
repair uses a feathered nearby blank blue region and restores the fixed stamp afterward.
