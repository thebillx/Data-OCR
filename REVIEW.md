# Review — 2026-09-08

## Readiness

Ready for developer trial as a mock-image editor, not certified for the bank's OCR/NTB flow.
All editable text now uses one rendering path over the continuous clean plate, including
the initial state. The complete Thai name uses self-hosted CardThai (Noto Sans Thai Looped
Bold, width 90%); other fields use Sarabun. Exact typography/background equivalence to
the raster reference is not claimed. The permanent mock warning remains intact.

## Latest follow-up: GitHub Pages migration

- Added a static Vite entry sharing the current Studio component and renderer. The existing
  Sites configuration remains available. No API, database or server is required by the static build.
- Build output contains only public assets, HTML, CSS and client JavaScript. Relative HTML,
  font and card image paths support both a custom domain and `/Data-OCR/` hosting.
- Added a GitHub Actions build/deploy workflow with contents:read, pages:write and id-token:write.
  Enabling Pages, the custom domain and unpublishing STC require repository/DNS settings access;
  the available connector exposes code and workflow operations but no Pages administration operation.
- Pages build, TypeScript and the 13 data/static-build checks passed locally. PNG functionality
  and the lifetime renderer reuse the previously reviewed implementation; no new live Pages
  deployment or DNS state is claimed by these local checks.
- Full `npm test` also passes 19/19 after both Sites and Pages builds. The standalone entry
  lives in `static-app/` to avoid being discovered as an unintended Next Pages Router route.
- Owner setup and STC shutdown steps are documented in GITHUB-PAGES.md.

## Earlier v5 checks: smaller preview and lifetime expiry

- Preview width and height are 60% of the previous size and centered. Browser measurement
  was 451.23px against 752px of available width (ratio 0.60005); the underlying preview
  canvas remains 1536×1024. This change does not reduce exported PNG resolution.
- One expiry-mode dropdown selects either a calendar date or paired ตลอดชีพ / LIVELONG.
  English spelling follows the owner's explicit specimen wording. Dates remain in state
  when hidden so switching back restores the prior date, including negative-test values.
- Lifetime mode skips only expiry-date validity, suspicious-year, order and past-expiry
  warnings. Other field warnings remain active. Reset returns to date mode and issue +8 years.
- Browser verified switching date → lifetime → date, restored 8 September 2034, clearing
  expiry, lifetime with an empty stored date, removal of the stale PNG link, and reset.
- Downloaded and decoded a 3072×2048 lifetime PNG and a 1536×1024 cleared-expiry PNG.
  Visual review confirms both lifetime labels fit; the cleared expiry contains neither
  the prior date nor lifetime text. The permanent mock warning remains visible.
- Automated tests: 17/17 pass. Typecheck and production build pass. Added regression
  coverage for warning scope, stored-date preservation and lifetime/date/empty rendering
  at both output scales. No additional testing against the actual DEV OCR/NTB system.

## Earlier v4 checks: one paired, nullable title

- Compared both supplied screenshots: the second contains 12 ID digits instead of 13.
  Raw formatting for a non-13-digit ID is intentional for negative testing. The other
  fields changing typeface was the older v2 raster-to-font switch, not a name-input issue.
  The v3 single rendering path is retained; exact original typography is still not claimed.
- Removed independent Thai/English title state and text inputs. `CardData.title` is now
  one nullable selection; both languages are derived from the same mapping at render time.
- Initial/reset title is `null`. Empty selection renders neither a prefix nor the literal
  text "null", and never rewrites the first/middle/last name fields.
- Mappings: นาย/Mr., นาง/Mrs., นางสาว/Miss, เด็กชาย/Master, เด็กหญิง/Miss.
- Browser verified initial empty state, นาย/Mr. selection, clearing both prefixes, and
  export with a 12-digit ID. Actual 2× selected-title and 1× null-title PNGs were decoded
  and visually inspected; the typed names are preserved and the permanent mock warning remains.
- Automated tests: 15/15 pass. Typecheck and production build pass. Added tests for all
  five mappings, null defaults, one dropdown without title inputs, and identical non-ID
  drawing commands after an ID-only edit.
- Browser adapter occasionally timed out on actions/download events. Verified actual DOM
  state and completed PNG files; did not infer success from the failed adapter response.
- Subsequently deployed successfully at the owner's request on 2026-09-08.
  The external GitHub mirror was not updated by that deployment.

## Earlier v3 checks: typography and dropdowns

- Thai and English titles are dropdowns, with empty and custom/negative-test options.
- Day/month/year dropdowns use Gregorian years, with Buddhist-year text on the card.
  Month/year changes clamp an unavailable day and show a notice; February 29 is supported.
- Defaults are browser-local today for issue, issue +8 years for expiry, and the existing
  mock DOB. Eight years is a fixture convention, not a claim about actual ID issuance.
- Changing issue does not silently change expiry. Explicit Today and +8-year buttons are provided.
- Manual negative-test dates survive switching tabs. Invalid dates cannot silently switch
  back to dropdowns; the user must correct or clear them first.
- Browser verified: title selection, name edits, local-date defaults, 29 Feb 2024 →
  28 Feb 2025 with notice, invalid 31 February retained across tabs, clearing DOB and PNG export.
- Final looped-font PNGs at 1536×1024 (edited name) and 3072×2048 (Thai title/name/surname
  cleared) were decoded and visually inspected. Cleared Thai-name pixels do not reappear.
  The previous save-again link is removed after editing. Name values use the same font
  as the prefix. The source font is unavailable, so 100% matching is not certified.
- Automated tests: 12/12 pass, including new dropdown date, local-default, consistent
  font rendering and empty-field regression tests. Typecheck and production build pass.
- Download-event observation timed out in the browser adapter, but the actual PNG was
  written and verified against the filename on the save-again link. No application errors
  were logged; the browser extension emitted its own metadata errors.
- This follow-up is saved separately from the previously deployed v2; no new deployment
  or GitHub mirror update has been requested or performed in this follow-up.

## Earlier v2 checks (before this follow-up)

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
The full clean plate is used from the initial state so all editable fields share one
continuous background and no raster-to-font switch occurs on the first keystroke.
The issuer repair uses a feathered nearby blank blue region and restores the fixed stamp
afterward; tiny texture artifacts may still differ from the reference.

CardThai is a static instance of the official Google Fonts Noto Sans Thai Looped variable
font (`wght=700`, `wdth=90`). The source and OFL license are included; the reproducible
command is in README.md.
