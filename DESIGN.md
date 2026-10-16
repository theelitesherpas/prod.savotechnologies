---
name: SAVO Technologies
description: The engineering dossier — warm paper and sand bands, blue-black ink chapters, one vermilion signal; Source Serif 4 voice over Manrope UI, duotone photography, drawn vector infographics.
colors:
  paper: "#f7f5f0"
  paper-surface: "#fcfbf8"
  sand: "#ede9de"
  paper-ink: "#17171a"
  paper-muted: "#565449"
  ink-bg: "#101319"
  ink-surface: "#171b22"
  ink-surface-2: "#1f242d"
  ink-foreground: "#eef0f4"
  ink-muted: "#a3a8b3"
  vermilion: "#e8490f"
  vermilion-dark: "#d9480f"
  vermilion-hover-paper: "#b23a09"
  vermilion-hover-ink: "#ff7c4d"
  vermilion-bright: "#ff5a24"
  success: "#1e7a3f"
  warning: "#94660f"
  error: "#b3261e"
typography:
  display:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "clamp(2.75rem, 6.9vw, 6.2rem)"
    fontWeight: 590
    lineHeight: 1.03
    letterSpacing: "-0.015em"
  statement:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "clamp(2.4rem, 8.6vw, 5.9rem)"
    fontWeight: 590
    lineHeight: 1.05
  section-display:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "clamp(2.1rem, 4.5vw, 3.8rem)"
    fontWeight: 600
    lineHeight: 1.07
  headline-1:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "clamp(1.75rem, 3.1vw, 2.6rem)"
    fontWeight: 600
  headline-2:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "clamp(1.45rem, 2.2vw, 2rem)"
    fontWeight: 600
  subhead:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.125rem, 1.5vw, 1.3rem)"
    fontWeight: 700
  body:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.68
  body-large:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.0625rem, 1.35vw, 1.25rem)"
    lineHeight: 1.62
  body-small:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
  label:
    fontFamily: "Fragment Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    letterSpacing: "0.16em"
    textTransform: "uppercase"
  caption:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
  control:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
rounded:
  field: "2px"
  chip: "2px"
  node: "0px"
  browser-chrome-only: "focus ring 1px; scrollbar thumb 99px — browser surfaces, never components"
spacing:
  shell-inline: "clamp(1.25rem, 4.5vw, 4.5rem)"
  section-y: "clamp(5rem, 9vw, 9rem)"
  group: "1.75rem–2.25rem"
components:
  button-solid:
    backgroundColor: "{colors.paper-ink}"
    textColor: "{colors.paper}"
    rounded: "2px"
    height: "3.25rem"
    padding: "0 1.75rem"
  button-solid-hover:
    backgroundColor: "{colors.vermilion}"
    textColor: "{colors.paper}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.paper-ink}"
    rounded: "2px"
  field:
    backgroundColor: "transparent"
    textColor: "{colors.paper-ink}"
    rounded: "0px"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.paper-muted}"
    rounded: "2px"
    padding: "4px 10px"
---

# SAVO Technologies — Design System (v2)

## Current v7 Portal access and workspace override

This scoped extension governs `/portal`, its dashboard/projects/invoices,
`/employee-portal` and its employee dashboard. Implementation sources are
`src/components/portal/portal.module.css`, `entrance.module.css`, `entrance.tsx`
and `site-chrome.tsx`. It takes precedence over legacy paper/ink/frontmatter
for these routes only. Preserve other website scopes, admin UI, session and
ownership contracts. Client/employee CAPTCHA is explicitly strengthened to
mandatory first-attempt verification; admin retains its existing policy.
This is not a global identity or missing-sidecar refresh.

### Overview

Portal access and workspaces extend the current Savo website: Outfit/Inter,
white/soft-gray task surfaces, strong black editorial/welcome regions and
clear red actions/active navigation. Existing monochrome desk imagery gives
the entrances a human editorial character; it is illustrative, not proof of
Savo's office or staff. Real client/employee records remain the product.

### Colors

The local CSS defines canvas `#f7f7f7`, foreground/rail `#111`, panels `#fff`,
secondary surfaces `#eee`, muted text `#626262`, borders `#dedede`, action
red `#df2525` and hover/error `#b82222`. Supporting state colors accompany
explicit text labels; never communicate payment/project state through color
alone. Controls use stronger borders than quiet panel separators.

### Typography

Outfit supplies medium-weight page/section/project headings. Inter supplies
body text, labels, controls and records; inherit the site's metric-adjusted
font stacks. Page headings step from 44px desktop to 30px compact. Entrance
story headings use 56px desktop and 40px phone; sign-in headings use 32px.
Normal
record text is 13–15px; public entrance inputs remain 16px to avoid mobile
focus zoom. Dates and amounts use tabular numerals. Long titles, references
and company names wrap; body introduction measure stays at 65ch.

### Layout

Authenticated desktop uses a 244px dark rail, white account bar and a
1240px maximum task container with 40px padding. At 1100px the rail/padding
compact; at 900px navigation becomes a visible horizontal top rail. Metrics
reflow from four columns to two, and project/detail panels stack on phones.
At 700px invoice tables become labeled record rows without dropping fields.
Keep all three primary routes visible rather than hiding them in a drawer.

Public access uses focused logo/back-to-website chrome and a compact legal/
help footer, not the marketing navigation/footer. The 1240px gateway pairs
black editorial copy and an actual desk image with a white sign-in side.
Phones place the form first. The form fills its column; its inline-size
container must not shrink to zero. Client/employee switching is explicit.
Use Google's native compact widget below 304px available width; normal
widgets stay contained when a solved form is subsequently resized.

Portal routes never mount sales-form providers or the sales assistant;
other site routes preserve the original provider hierarchy. Employee records
use the shared task/container vocabulary, not the client sidebar.

### Elevation & Depth

Depth is predominantly tonal and bordered, not decorative shadows. Dark
welcome/project headers and the primary billing summary create hierarchy.
Hover and focus communicate interaction; loading uses an understated surface
pulse. Respect reduced-motion preferences and keep records visible at rest.

### Shapes

Use lightly rounded, bordered panels (8px), an entrance container (10px),
controls (5px) and navigation items (6px). Status labels are compact tags,
not large promotional pills. Native fields/selects preserve familiar behavior.

### Components

- **Wayfinding:** shared `WorkspaceNav` supplies `aria-current`; the shell
  exposes a skip link, named account, sign-out and real team contact.
- **Sign-in:** visible labels, password-manager autocomplete, show/hide
  password, pending/disabled feedback, task-specific validation summary,
  mandatory first-attempt CAPTCHA and human recovery. Missing/forged tokens
  are rejected before credential work; unavailable configuration/status fails
  closed. Verification errors focus the verification group, not a valid email.
  Preserve server-side validation. Google's test keys are local-only preview
  tools; a live release requires a real v2 checkbox key pair.
- **Employee records:** preserve session expiration, employment-status and
  linked-panel-user gates. Render only the employee's employment/leave and
  authored content; the admin shortcut retains independent admin permissions.
- **Records:** reuse `ProjectCard`, `PortalStatus`, `PortalProgress` and
  `InvoiceTable`; desktop tables retain semantics on narrow labeled rows.
- **Browsers:** project/invoice search and native status filters provide
  live result counts, clear-filters recovery and honest empty states.
- **Billing:** retain original currencies, summarize each separately and
  exclude draft/cancelled invoices from balances. Issued invoices have real
  Download PDF and View / print actions in a Documents column, retained in
  mobile record rows. Actions use native anchors, 44px targets and red focus.
  The stored `sent` status is labelled Unpaid consistently. Optional validated
  invoice-specific HTTPS links add a red **Pay now** action for positive unpaid/
  overdue invoices only; then the column is titled Actions. Dashboard/project
  rows reuse the same native link, with no referrer and a new provider tab.
  No link means the prior Documents experience. Paid/cancelled/draft records
  never offer payment. Email/PDF actions follow the same policy; no invented
  gateway confirmation. Admin link entry is labelled and optional, with explicit
  reconfirmation when retaining a link after financial/client edits.
- **Invoice documents:** branded white A4 pages with the official black logo,
  supplier/client identity, stored reference/dates, service amount, status,
  paid/due balances and actual notes. Embed complete static Inter Regular/
  SemiBold programs (not unreliable variable/subset font outlines), retain
  two-decimal ISO-currency amounts and paginate long fields. PDFs have their
  own printer-safe layout, not screenshots of the portal. No invented tax,
  GST, itemized rates or bank details. See `docs/INVOICES.md`.
- **Business references:** use the existing admin/portal fonts and tabular
  numerals, not a new visual system. New CS/PR/IN references are server-assigned,
  five-digit and immutable. Create forms show the actual reserved ID before save,
  with Copy ID, loading/retry feedback and an explicit no-recycling explanation.
  Saving keeps that exact owner-bound ID; refresh resumes the browser draft.
  The copy button wraps below the full-width ID on phones; no clipped digits.
  Edit fields remain read-only. Client IDs
  accompany names in selectors and the client's own workspace/PDF. Preserve
  issued legacy references and all employee IDs. No fake history/count claims.
- **Budgeted projects:** the admin extends its existing operations theme, not
  public marketing chrome. Labelled two-column details/financial fields precede
  repeatable base-milestone fieldsets. Title/cost/date/state align in four columns,
  two below 1100px and one below 650px. Live allocation summary exposes exact
  remaining/over-budget amounts and disables ordinary saving until balanced.
  A single revision-keyed plan editor refreshes committed row IDs after save.
  Quick module controls, additional-scope editing, invoices and the delivery log
  have separate task headings; completion/cancellation require confirmation.
  Inherit admin light/dark surface, text, error, success and focus tokens.
- **Client project budgets:** keep the existing hero/progress, then a separated
  agreed-cost/payment summary and base milestone/delivery panels. Additional
  work is itemised separately with its description, price, state and estimate.
  Distinguish milestone delivery progress from payment-based completion; retain
  native responsive records and no marketing interruptions. No forced currency
  conversion, fictional budgets or unearned completed module progress.
- **Recovery:** preserve readable loading, retry/home recovery, and scoped
  project-unavailable UI. Foreign project IDs must not reveal ownership.

### Do's and Don'ts

- **Do** preserve independent client ownership checks at every server page
  and serialize only required client-visible fields into interactive lists.
- **Do** maintain visible keyboard focus, textual status and 44px-or-larger
  primary action targets. Keep the real task usable at 320px.
- **Don't** add invented client activity, contracts, downloads, support
  messaging, payment functionality or response-time promises.
- **Don't** apply these local workspace components/styles to legacy admin
  pages or rewrite unrelated shared website chrome.

## Current v7 Not-found recovery override

This scoped override governs `src/app/not-found.tsx`, including unmatched root
URLs and nested resource fallbacks. It inherits the approved homepage/Start/
location world. Preserve all other v7 scopes; do not reinterpret legacy global
frontmatter or repair the missing-sidecar drift through this task.

### Overview
Native chosen recovery: a plain missing-address explanation, original homepage
and project actions, and the complete original nine-destination directory.
No fabricated migration story, timed redirect, fake search or marketing close.

### Colors
White (`#FFFFFF`) brand strip, light-grey (`#F7F7F7`) recovery field, black
(`#000000`) heading/directory, reading grey (`#666666`), light separator
(`#E8E8E8`), dark rules (`#383838`), white directory text. Display brand red
(`#FF3333`); accessible primary action (`#DF2525`), hover/light focus
(`#B82222`), dark hover/focus (`#FF6B6B`). Dark focus uses a selector specific
enough to win over the general page rule; computed colour is authority.

### Typography
Real Outfit (`--font-serif`) heading, Inter (`--font-sans`) body/controls.
H1 `clamp(2.4rem,4.7vw,4.2rem)`, 500/1.08, -.035em; directory title
1.625rem/1.2, 500, reducing to 1.5rem on phones. Body 1rem/1.8, max 52ch;
quiet recovery note .875rem/1.8; native directory links .9375rem/1.8;
52px action type .875rem/1.5, 600. Error 404 is readable diagnostic text
below the headline, not an eyebrow, decorative giant numeral or metric.

### Layout
1280px rail, 32px desktop/20px phone gutters. Standalone brand strip is 80px
(72px on phones), followed by viewport-height grey recovery. Copy/directory
use 1fr/1fr with 80px gap (48px below 1101px), stacking below 900px with
40px gap. Section rhythm 48–64px; nested fallback clears retained fixed
header with nav-height+48px top and 88px bottom spacing.

### Elevation & Depth
Flat colour fields and editorial rules, no shadows or physical simulation.
No page-load choreography; colour transitions 160ms, removed for reduced
motion. Existing parent footer/chrome is not redesigned by the fallback.

### Shapes
52px native actions with 6px corners; 12px black directory corners, 28×32px
padding (24px phone); list rows at least 52px, brand/home target 56px and
skip target 44px. Focus outline 3px with 4px offset; dark-panel outline is
bright red. White-on-black selection, inverted in the black directory.
Authored arrow SVG matches the established stroke/cap grammar; official
wordmark reuses the actual shared vector paths.

### Components
Server-rendered named recovery section/region and native Next links; only
best-effort reporting needs a small client boundary. Named section works
standalone and within retained main without adding another main. Own brand/
skip strip hides only in retained-main context; parent header/footer and
manual controls remain. Automatic project-popup fire is suppressed only
when the real fallback marker exists, never by guessing invalid routes;
forced/manual controls are preserved. Existing report404 endpoint/payload/
beacon/fetch behavior stays unchanged with a once-per-mount guard.

### Do's and Don'ts
**The Chosen Recovery Rule.** Preserve original destination labels/hrefs/order
and let visitors choose; don't invent a missing-page cause or auto-redirect.

**The Retained Shell Rule.** A root fallback may be standalone or rendered
inside an already-streamed site shell. Use a named region, avoid nested main,
and don't duplicate the site's brand strip or interrupt recovery with an
automatic marketing popup.

**The Framework Status Rule.** Next owns notFound/noindex and streamed versus
non-streamed status behavior. Don't claim every streamed fallback is an HTTP
404 or enable experimental globalNotFound merely to change the composition.

Do keep genuine navigation/no-JS recovery, legible dark focus and complete
link content. Don't add speculative search/history actions or new legal,
commercial, contact or availability claims. Root inherited metadata, demo/
dev overlays, closed-inert capture paint and existing Next development timing
diagnostics are not new design-system tokens or production guarantees.

## Current v7 Email correspondence override — 2026-10-15

Scope: `src/lib/mail/design.ts`, client/HR templates, saved/custom email shells,
account-security and live-chat notifications, and their admin/local previews.
This inherits the current website identity; other surface overrides and legacy
project-level frontmatter are unchanged. It supersedes the previous alternating
white header / black title / white body / black footer email treatment.

### Overview

**The Correspondence Rule.** One cohesive branded letter: identify the sender,
read the message, scan its details, take the next step or reply. Avoid the
wireframe-like pile of contrasting rectangular bands the owner rejected.

### Colors

Light mode has a charcoal masthead (`#151515`), white continuous title/body,
`#f7f7f7` ground/detail panels/footer, black headings, `#333333` body and
`#626262` secondary text. Red actions remain `#df2525` with white text;
light-surface text links use `#b82222`.

Dark mode uses `#101112` ground, `#1b1d20` letter, `#25282d` panels/footer,
`#f4f4f5` headings, `#d6d8dc` body, `#b1b5bd` secondary text and `#c2c5cb`
footer copy. Links/text marks lighten to `#ff9999`; red action fill stays
unchanged. Borders use `#34363b`/`#3c4047`, secondary actions `#666a73`.
Declare light/dark schemes, support both colour-scheme media and Outlook's
`data-ogsc` selectors, and preserve inline light fallbacks.

**The Self-contained Mark Rule.** The official wordmark must carry both its
foreground and ground inside the raster. White lettering is flattened onto
opaque charcoal, never black letters on transparency depending on an inbox's
white background. `logo-lockup-v2.png` is 396×216 RGB, displayed at 110×60 (compact masthead
mark, ~3.6× source);
its versioned filename avoids cached copies of the old asset. Rebuild with
`scripts/build-email-logo.mjs`; provenance accompanies the asset.

### Typography

Existing Outfit headings and Inter reading remain brand-pinned, with Arial/
Helvetica and explicit MSO fallbacks. Titles are 36px/1.15, weight 500, 29px/1.17
below 480px; body 15px/1.8, introductions 16px/1.85, details 13–15px,
footer/legal 11–13px. Webfonts swap; missing font support must not hide content.

### Layout

**The Inbox Rule.** Fluid 600px table-based letter with inline critical styles
and a 600px Outlook ghost table. One aligned 36px desktop / 20px phone content
rail continues from title to signature and footer. The masthead shows the logo
and department only—no sender email address at any size; contact email remains
in the footer/sign-off area. On phones, facts stack as label/value pairs and
red actions fill the reading width. Long values wrap;
preheaders remain visually hidden. No animation in delivered HTML.

### Elevation & Depth

One subtle outer letter shadow (`0 12px 32px rgba(0,0,0,.04)`), a quiet 1px
perimeter and tonal inset panels. No per-row divider grid or nested app cards.

### Shapes

Letter corners 16px, inset detail/note panels 12px, actions 8px. Outlook may
render square corners without losing spacing, legibility or destinations.

### Components

Shared primitives own the dark masthead, title, reading copy, detail panels,
red ≥44px native link actions, human signature and quiet contact/legal footer.
Client letters use hello@ and client phone details; HR/careers letters use hr@
and HR contacts. All 43 registered defaults, custom messages, saved bodies,
account-security and live-chat shells inherit these components. The pitch's
secondary action and dark-mode icon text have explicit theme treatments.

The development-only `/email-preview` gallery starts with portal welcome,
provides department/template choice, desktop/320px, light/dark and plain text.
Asset paths use the gallery's own origin, not a stale configured dev port.
Preview frames remain sandboxed and send/save nothing; production returns 404.

### Do's and Don'ts

- **Do** preserve subjects, plain-text twins, variables, recipients, legal copy,
  unsubscribe signing and delivery-policy gates.
- **Do** test all templates in light/dark at 320/390/600/768px, long values,
  stripped CSS, logo opacity and department identity.
- **Don't** assume all inboxes honour dark CSS. Gmail's forced recolouring
  requires a later approved real-device/inbox check; browser previews certify
  only the authored palettes, not Gmail/Outlook delivery rendering.
- **Don't** turn existing body-specific icons or optional reference sublabels
  into a new global decoration or eyebrow convention.

Local evidence: `tmp/mail-redesign/`, 405 browser layout checks, 43 templates,
no contrast/overflow/image failures; full unit/build results in the handoff.
No emails sent, live DB writes or production deployment for this redesign.

## Current v7 Meeting invitation override

This scoped override governs `/meeting/[token]` only. It inherits the approved
homepage/Start/Profile/location identity, not the legacy frontmatter. Preserve
all other current v7 scopes and shared chrome. The global missing-sidecar and
legacy-token drift remain outside this task.

### Overview
A precise Operate surface: actual invitation, IST preference, missing details,
inline review, truthful receipt and authoritative recorded status. No extra
marketing closing section, layout gate, speculative calendar proof or modal.

### Colors
White (`#FFFFFF`) workspace, light grey (`#F7F7F7`) opening/status ground,
black (`#000000`) headings/invitation/selected options, readable grey
(`#666666`), quiet separators (`#E8E8E8`), dark separators (`#383838`) and
dark secondary text (`#B0B0B0`). Brand display red (`#FF3333`) is not small
white-button text background: primary actions use `#DF2525`, hover/focus/error
`#B82222`. Input/choice strokes use `#949494`.

### Typography
Real Outfit (`--font-serif`) headings, Inter (`--font-sans`) reading and
controls. Compact task h1: `clamp(2.2rem,4.1vw,3.4rem)`, 500, 1.1, -.035em;
h2: 1.875rem/1.2, 500, -.025em; h3: 1.25rem/1.3. Body 1rem/1.75,
maximum 65ch; record/review values .9375rem/1.8; labels/help .8125rem/1.8.
Native inputs are 1rem, never zoom-prone tiny phone type. Dates, times,
phones and reference values use tabular figures. Long values wrap; agenda
and message line breaks stay readable.

### Layout
1280px maximum rail, 32px desktop/20px phone gutters. Grey opening uses
1fr/1fr with 64px gap; white workspace .75fr/1.25fr with 80px gap. Sticky
context is desktop-only; both areas stack below 900px. Native time choices
use four columns, three below 1101px; contact fields stack below 640px.
Primary section rhythm 48–88px, grouped fields 20–28px. Reserve 80px below
form actions for inherited floating chrome. Header stays pinned on exact
single-segment meeting routes.

### Elevation & Depth
Flat tonal hierarchy, not shadows or synthetic physicality. Black invitation,
white record sheet and simple rules establish structure. No entrance/reveal
animation delays a scheduling task. Control colour transitions are 160ms and
removed with reduced motion.

### Shapes
52px primary/secondary actions with 6px corners; native options 48px with
6px corners; inputs/selects/textareas 48px minimum with 5px corners;
12px invitation/status-sheet corners. Text/edit/contact actions are at least
44px. Focus uses a 3px `#B82222` outline with 4px offset; selected native
radio focus is also drawn on its visible label. Selection is white on black;
carets use focus red.

### Components
Native date/time radio groups, optional native date suggestion, country
select and phone/email/address/message inputs; exact inline review with
individual edit/focus return; focused error recovery and HTTP+ok receipt.
Actual type, duration, location, agenda, reference and client identity remain
records rather than decorative cards. Pending controls lock and duplicate
posts are guarded synchronously. Genuine mail/WhatsApp/status links remain
native. Safe supplied meeting URLs are links only for confirmed records.
Generic static 1200×630 social art uses the same lettering, fields and an
authored calendar symbol, never client details or occupancy evidence.

### Do's and Don'ts
**The Preference Is Not Proof Rule.** A submit response with ok/reference
establishes receipt only; neither claim nor deny optional backend
auto-confirmation. Use actual invitation status for booking confirmation.

**The Supported Contact Rule.** Added phone/email travel in supported meeting
notes, not as a contact-account or notification-address update. Show that
boundary and keep combined notes within 2,000 characters without truncation.

**The Task Is Not Interrupted Rule.** Suppress automatic marketing popups on
exact meeting tasks; keep manual shared actions and forced `?popup` intact.

Do retain IST, admin date/time constraints, native focus/choice semantics,
recovery and complete substantive invitation content. Don't invent free/busy
results, confirmations, email delivery, meeting availability or production
clearance. Don't store drafts or put personal invitation details into social
metadata. Temporary synthetic preview machinery, inherited preview badge and
global legacy design drift are not house-style rules.

## Current v7 Case-study showcase override

This scoped override governs `/case-studies`, actual `/case-studies/[slug]`
project stories and the explicit development-only `/case-studies/preview/[slug]`
review namespace. It replaces the discipline cabinet, ink process cards and
wireframe filler. Other current v7 surfaces, backend contracts and the shared
footer/close remain authoritative; legacy global frontmatter/absent design
sidecar are not repaired by this merge.

### Overview
An open image-led portfolio lets visitors inspect a product before reading its
reasoning. Project colours belong inside the supplied screenshots or explicitly
labelled concept illustrations, not the Savo navigation or page field.

### Colors
White (`#FFFFFF`) page, black (`#000000`) headings, readable secondary grey
(`#626262`), quiet separator (`#E8E8E8`), light-grey disclosure/stage/close
(`#F7F7F7`) and accessible functional red (`#DF2525`); hover/selection red
(`#B82222`). No page gradient, glass panel or invented rating treatment.

### Typography
Outfit500 display/headings, Inter body/controls. Index hero
`clamp(2.8rem,5.1vw,4.6rem)`; project title
`clamp(2.5rem,4.4vw,4.2rem)` with a phone-specific scale. Shared section scale
`clamp(1.7rem,3.4vw,2.7rem)`, body15–18px/1.7–1.8, context measure≤72ch,
small factual captions12–13px. Technical complexity is explained, not dressed
in monospace or numbered ornaments.

### Layout
1344px outer rail with32px gutters gives1280px content;20px phone gutters.
Open two-column gallery32px gap/56px row rhythm, full-width lead and supported
wide closing project. Stack≤700px; tools stack≤1000px. Natural screenshot
canvases are never cropped into proof of a different interface. Story chapters
use48px phone/72px desktop vertical padding, concise reading pairs and captioned
full-width visual stages. Native inspection scrolls only within its own region;
the page retains ordinary vertical scrolling.

### Elevation & Depth
No new card shadows. Tonal screenshot stages, whitespace and the images carry
depth. Inherited closed enquiry-drawer shadow is not canonized as gallery style.

### Shapes
Image stages8px/phone6px, controls5px, native preview disclosures6px; quiet
separators only where they clarify grouping. White circular image-link arrows
become accessible red on hover. Visible red focus outlines; native disclosures
keep their readable textual labels.

### Components
- `PortfolioCardView`: one real destination around image/caption, descriptive
  category, title, summary/action and explicit status for every review concept.
- Native GET category links/search preserve combined query state; no-match has
  clear recovery. No client-only filtering requirement or autoplay.
- `ProjectStory`: supplied context → distinct interfaces → decisions/technical
  details → actual outcomes/feedback when present → related work → shared grey
  enquiry close. Unknown data does not produce invented paragraphs or metrics.
- `PortfolioImage`: actual image dimensions, full canvas, eager lead/lazy
  supporting views. Native full-width inspection and original-image link remain
  useful without JavaScript. One650ms gallery clip arrival; reduced motion static.
- Compact native preview notice keeps “Not client work” visible; complete
  boundary text remains available rather than occupying the opening.

### Do's and Don'ts
Do use active Published managed project data and explicit supplied screenshots.
Do retain all supplied dossier/architecture/research/verification information.
Do show only approved verified figures, with no guessed ratings or publication
facts. Do label synthetic interfaces visibly. Don't republish the historical
fictional seeds as client work; review pages have their own canonicals, noindex,
production404, and never enter publication feeds. Actual case content/media
approval, deployment and production verification remain separate.

Evidence: `tmp/case-showcase/README.md`, `finish-verdict.md` (inline ship for two
scored visual fixes), main14route-width checks, focused native/fixture checks,
408tests/28files, typecheck/scoped lint. One detector:58advisory/3legacy-font
warnings; no second scan or blanket console-clean claim.

## Current v7 Case-study detail override (2026-10-06)

This scoped override governs the project-story surface shared by actual
`/case-studies/[slug]` records and development-only preview reviews, after the
user-pinned concise visual detail upgrade. It layers on the showcase override
above; publication authority, canonicals, footer/close and identity are
unchanged.

### Composition
Back link/title/summary → hero actions (`View live project` black link when a
real http/https URL is supplied; neutral `Live URL awaiting details` never links
on previews; existing `Start a Similar Project` hero enquiry) → full-canvas
overview → aligned project-information grid (Client/Industry/Location/Business
Model/Platforms/Year/Duration/Team, only supplied values, never defaulted) →
mid-page left red invitation card (`Your idea. Our next build.` with line-art
and the shared project popup; concise challenge/solution story right) → manual
screenshot slider → up to six notable-feature cards → technologies + project
palette → genuine client review (explicit pending state,
never an invented quote/rating) → related work → unchanged grey close. Outcome
metrics and their admin repeater (§11) were removed per owner decision
(2026-10-07); stored results pass through untouched but never render.
The former “Design & engineering notes” dossier disclosure and its admin
editor (§12 Flagship Dossier) were removed per owner decision (2026-10-07);
legacy dossier data is preserved untouched in saved records but never
rendered publicly. The author credit renders as a quiet line after the
project palette.

### Slider
`ProjectGallery` client component over the managed `gallery` attachments (max
eight, CMS order) — the two-up slider experience from the v6 case studies
(two large screens side by side on desktop, one full-width on phones):
native scroll-snap track, position dots, bounded prev/next arrows, tabular
`n / m` status, per-screen counter chip, keyboard Left/Right/Home/End,
original image link per slide, `noscript` scroll hint. Disabled-until-hydration
buttons; native scrolling and image links work without JavaScript. No
autoplay, tilt or drag hijack; reduced motion forces instant scrolling.

### Current frame-filling screenshot treatment
Index/detail covers use their established16:9 geometry; gallery slides keep
16:10 stages. The latest owner-authorized homepage/gallery fill correction
uses centered `object-fit:cover`, eliminating letterbox bands by proportional
edge cropping rather than stretching. Keep original media and frame geometry;
no extra zoom, image-byte change or gallery interaction change. The industry
case fan retains its pinned editorial composition. Evidence: `tmp/project-image-fill/`.

### Details
Feature grid three-per-row desktop/one column phone with drawn line icons;
technology tiles reuse the official local brand SVGs neutralized with a scoped
`brightness(0)` filter (shared assets untouched) or a drawn icon fallback;
palette swatches are data, not page styling — only supplied or concept-artifact
colours render. Preview pages keep `Layout example · Not Aster Health project
facts` beside user-supplied example metadata and `Concept interface · Not
client work` on every slide; actual records show only their own supplied facts,
live URL and approved testimonial.

### Do's and Don'ts
Do keep supplied dossier depth inside the native technical-notes disclosure. Do
keep hero/middle/close enquiry sources distinct
(`case-study-hero`, `case-study[-preview]-<slug>-middle`, existing close
sources). Don't invent live URLs, reviews, ratings, durations or team sizes for
records that lack them; don't present example metadata as Aster delivery facts;
don't add public upload endpoints. Gallery upload stays in the authenticated
case-study editor (JPEG/PNG/WebP, ≤1600px, ≤4MB, alt text, ordering, 8-image
schema cap unchanged).

Evidence: `tmp/case-detail-upgrade/README.md`, inline review
`finish-review-first.md`/`finish-verdict.md` (ship for the scored technology-mark
fix), `verification-first.json`, `confirmation.json`, 420tests/29files,
typecheck/scoped lint, protected/DB diffs empty, one detector scan 46advisory +
1 inherited `Outfit` warning.

## Current v7 Technology override

This scoped override governs `/technology`, the first route in the user's remaining
page-redesign list. The user explicitly delegated understanding/using the homepage
and other redesigned pages rather than another layout-choice step. Other pending
routes remain unchanged. [Technology surface brief](.impeccable/surfaces/src-app-site-technology-page-tsx.md).

### Overview
A readable technical decision guide replaces the warm-paper document and building
photograph. Grey problem-first offer/illustration → white native six-family stack
explorer → black six visible architecture principles → white native FAQ/related
information → unchanged shared grey close → existing black footer.

### Colors
Approved white/black/#F7F7F7 grounds. #FF3333 emphasises the large problem-first
headline; accessible #df2525 actions/module and #b82222 hover/focus/connections;
#ff6b6b icons/focus on black. #555/#666 light copy, #b0b0b0 dark copy,
#383838 dark structure and #E8E8E8 light separators. No orange/warm-paper/blue-black
chapter treatment, new accent family or decorative gradient.

### Typography
Outfit500 headings and Inter copy/controls; existing font-variable aliases.
Hero `clamp(2.4rem,4.7vw,4.2rem)`/1.08, section
`clamp(1.7rem,3.4vw,2.7rem)`/1.12, stack titles28px/24px phones,
principle titles22px/20px phones. Hero lead18px/16px phones; body16px,
reasoning/FAQ15px/1.8, controls14px, small illustration/context notes11–13px.
No eyebrows, section numbers or costume monospace. Tablet headline joins the
explicit desktop/phone line breaks with real whitespace.

### Layout
Same1280px content rail,32px desktop/20px phone gutters,56–88px section rhythm.
Equal opening columns/64px gap stack below900px. A200px family rail and48px gap
sit alongside the explanation/tool shelf; below900px choices become three columns,
below640px two columns and explanation precedes tools. All six complete panels
remain in server HTML. Architecture is an open two-column reading list, then one
phone column. Questions use a narrower context rail/wider list; tablet context
pairs with related links, phones stack. No scroll hijacking or autoplay.

### Elevation & Depth
Tonal layer nodes, whitespace and a black data layer supply depth; no new shadows,
glass, tilted frames or simulated dashboard proof. One650ms already-visible red
service-module clip/settle; reduced motion makes it static. Native family changes
and FAQ disclosure are immediate, not a repeated entrance sequence.

### Shapes
6px actions/choices,10px illustration/tool/related surfaces,8px illustration nodes
on phones. A thin shared bus joins both platform nodes into services, then data;
AI branches alongside services as a conditional layer. Flat, aligned SVG/HTML,
readable labels and no extra icon-tile chrome. Primary actions52px, family
choices52–56px, native summaries72–76px; visible red keyboard focus.

### Components
Native radio + CSS `:has` explorer, usable without JavaScript; unsupported `:has`
exposes every complete panel and removes ineffective choices. Original six family
choices/picks/why/fit texts and six architecture records match the archived source
verbatim. Thirteen original local technology SVGs are reused and neutralised only
locally; generic AI/cloud symbols introduce no new vendor claims. Layer drawing
is labelled illustrative—not a client deployment or fixed stack. All eleven
original FAQs use native details (first initially open) and one schema source.
Canonical metadata and original `technology-cta`/“Ask an engineer” modal action
remain; new hero source`technology-hero` uses the same provider, with a real
no-JS contact link. Exact Technology pinned-header guard only; shared menu,
assistant, footer, enquiries and database unchanged.

### Do's and Don'ts
Do retain the reasons and fitting conditions, not just logos. Do keep all
architecture principles visible and all answers server-rendered. Do preserve
approved fonts, rails and the grey-close/black-footer distinction. Don't infer
client deployments, results, credentials or providers from illustrative layers;
don't repeat the legacy document shell or add a layout-choice gate after the
user's explicit delegation. Existing technical-copy and trademark approvals,
production/security/backend and real-device verification remain separate.

Evidence: `tmp/technology-redesign/`;467tests/32files, typecheck/scoped lint pass,
299browser assertions across320/390/768/1280/1440/1920px, no failures/runtime errors,
native/no-JS/radio/FAQ/modal/Escape/anchor/schema/reduced-motion checks. One detector:
59advisories/0warnings. Inline finish verdict ships the scored diagram-connection
fix, not a production sign-off.440other existing source/Prisma files unchanged;
no new raster/dependency. Verification-only lazy-image/no-JS-style-injection
harness corrections and initial failed assertions are recorded, not hidden.
Legacy global frontmatter/missing sidecar are deliberately outside this scoped merge.

## Current v7 Trust override

This scoped override governs `/trust`, the second remaining route after Technology.
The user approved direct continuation using the homepage/redesigned page family;
no new identity or layout-choice gate. Other pending routes remain untouched.
[Trust surface brief](.impeccable/surfaces/src-app-site-trust-page-tsx.md).

### Overview
A readable ownership and working-practices guide: grey invitation/labelled asset
packet, white complete ownership list, grey confidentiality, black security and
conspicuous certification boundary, white handover/questions, original shared
grey close and unchanged black footer. Policies are content, not decorative proof.

### Colors
Approved white/black/#F7F7F7 grounds, #FF3333 headline emphasis, #df2525 actual
primary actions and #b82222 hover/focus/light symbols. #ff6b6b symbols on black,
#666 light reading/#b0b0b0 dark reading, #E8E8E8 light separators/#383838 dark.
The packet agreement is quiet document text, not an inert red action look-alike.

### Typography
Outfit500 headings/titles and Inter reading/controls through existing aliases.
Hero `clamp(2.4rem,4.7vw,4.2rem)`/1.08, section
`clamp(1.7rem,3.4vw,2.7rem)`/1.12, record titles22px/20px phones.
Lead18px/16px phones; body16px/1.75, policies/FAQ15px/1.8 measured to65ch,
actions14px/600. Legitimate editorial/illustration captions are11px, not eyebrows.

### Layout
1280px rail,32px desktop/20px phone gutters,56–88px sections. Equal opening
columns/64px gap stack below900px; phone actions fill the rail. Ownership uses
an .85/1.15 reading split and native desktop sticky context under the pinned
header, static below900px; tablet records use two columns, phones one.
Confidentiality/security are open two-column definition lists, then one phone
column. Handover pairs an editorial photo and three source-derived stages;
tablets put the stages in three columns, phones stack. Questions pair a context
rail with wider native disclosures, stacking below900px.

### Elevation & Depth
Flat tonal fields, actual editorial photography, fine separators and a clear
folder silhouette; no new shadows/glass/tilt or simulated certificate material.
One650ms visible clip/settle of the packet body; reduced motion removes it.

### Shapes
6px actions,12px packet/photo corners/8px phones,10px agreement/certification
context surfaces. Authored consistent line SVGs; no glyph badges or compliance
logos. Primary actions52px, text destinations44px, FAQ summaries72–76px with
3px red keyboard outlines. The packet footer has no button/click affordance.

### Components
All original7 ownership/4 confidentiality/6 security/3 handover records and5 FAQ
entries preserved verbatim; core policies never collapsed. Negative certification
statement remains conspicuous; specific ownership/licences/control scope belong
in the engagement agreement. Verified-rating registry renders nothing while empty;
provided approved records retain actual profile/value/date fields, never fillers.
Native details (first open) and schema share one source. Original metadata,
canonical, `trust-cta`/“Talk to a senior consultant” and shared close remain.
New `trust-hero` uses the existing modal and has a genuine no-JS contact recovery.
Original studio photo has accurate editorial alt/caption/provenance, not real
client/staff/handover proof. Exact Trust pinned-header guard only; shared assistant,
footer, providers, APIs and database unchanged.

### Do's and Don'ts
Do preserve original policy depth and native reading. Do qualify engagement terms
and distinguish practices from formal certifications. Do keep the packet illustrative
and editorial photography honest. Don't invent ratings, audits, credentials,
clients or outcomes; don't dress static text as a control or return to the warm-paper
legacy shell. Legal/actual control/media rights, production and physical-device
approval remain separate from this local redesign.

Evidence: `tmp/trust-redesign/`;483tests/33files, typecheck/scoped lint pass,
229browser assertions across320/390/768/1280/1440/1920px, no failures/runtime errors.
Keyboard/native FAQ/schema, canonical, modal/Escape/focus, anchors, image decoding,
measured contrast, no-JS and reduced motion checked. One detector:56advisories,
0warnings (CLI exit2 retained). Inline finish verdict ships the two scored fixes.
444other existing source/Prisma files unchanged; no new raster or dependency.
Initial test-attribute casing and component-prop typing failures retained in logs.
Legacy global frontmatter/missing sidecar are outside this scoped merge.

## Current v7 Company Profile override

This scoped override governs `/company-profile`, directly approved after Trust.
It inherits the homepage/Technology/Trust identity; the legacy numbered document
shell is replaced without discarding its ten topics or printable purpose.
[Company Profile surface brief](.impeccable/surfaces/src-app-site-company-profile-page-tsx.md).

### Overview
Grey company-profile invitation and real-registry black brand sheet; white
identity/capabilities, grey industries, white technology/work, black delivery
process, grey engagement/trust, white native questions and grey contact record.
A task-specific print/contact close remains, not a newly introduced modal CTA.

### Colors
White/black/#F7F7F7 fields, #FF3333 large heading emphasis, #df2525 actual print
action and #b82222 hover/focus. #666 light reading/#b0b0b0 black-sheet/process
reading, #E8E8E8/#383838 separators and #ff6b6b continuation symbols on black.
Paper adapts all fields to white with black text and quiet grey separators.

### Typography
Outfit500 headings, Inter reading/controls via existing aliases. Hero
`clamp(2.4rem,4.7vw,4.2rem)`/1.08 and section
`clamp(1.7rem,3.4vw,2.7rem)`/1.12; titles22px/20px phones. Body16px/1.75,
lead18px/16px phones, detail15px/1.8/65ch; actions14px/600, record labels13px,
pending/context12–13px. Actual facts use tabular numerals, not costume mono.
Paper uses30pt hero/18pt headings/12pt titles/10pt reading, with smaller
legitimate record captions; multi-line headings/heading-lead groups stay intact.

### Layout
1280px rail with32px desktop/20px phone gutters,56–88px rhythm. Equal opening
columns/64px gap stack below900px. Identity/FAQ/contact .85/1.15 columns become
one below900px. Capabilities/industries and paired briefs use two desktop columns,
one on phones. The five-phase process becomes two tablet columns then a phone
stack; continuation arrows follow that actual direction. All company topics stay
visible, not inside tabs or collapsed summaries.
Named A4 paper with16mm margins applies only to this profile. Paper restores
full reading width, compact two-column catalogues/briefs and complete FAQ answers.

### Elevation & Depth
Flat brand sheet, whitespace, tonal chapters and open definition/catalogue rows;
no new shadows, glass, mock credentials, tilted frames or stock proof. One650ms
already-visible brand-sheet clip/settle; reduced motion removes it. No new raster.

### Shapes
6px actual actions,12px black-sheet corner/8px phones. Consistent authored line
SVG navigation/disclosure/print symbols plus the unchanged genuine Savo wordmark.
52px print actions,44px text links,72–76px FAQ summaries; red visible keyboard
focus. Disabled prerender/no-JS print controls have genuine browser-print recovery.

### Components
Canonical company facts are status/visibility guarded, including populated but
unverified values. Original9 identity rows,6 source service groups,10 source
industries,5 process phases,4 models and3 original FAQ records remain. CIN/GST
retain“Available on request” with explicit“Verification pending”; no fabricated
identifiers, scale metrics or review timestamp. Original technology/trust copy and
metadata compare verbatim. Unsupported guaranteed named-reference availability
becomes an enquiry about what may be shared; no pretend client proof is added.
Native details and FAQ schema use the same source; a CSS-hidden screen duplicate
prints every answer portably without needing to expand disclosures or run JS.
The sole new client boundary is a hydration-gated browser `window.print()` action,
not a download URL/API. Named page and live `.page` presence guard hide shared
chrome only for this current route's paper output, even when Next retains CSS.
Genuine email/sales/HR/social links remain. Exact Company Profile pinned-header
guard only; facts registry, shared layout/providers/footer/assistant/API/database
and pending routes are unchanged.

### Do's and Don'ts
Do retain the complete company record on screen and paper. Do check registry
status/visibility before publishing values; a render date is not a review date.
Do inspect real paginated PDFs, not only print-media screenshots. Don't infer
clients/certifications/references from capability lists, pretend a static PDF exists,
or promote paper adaptations into global screen style. Original policy/governance
copy still needs actual company approval; local checks are not an independent audit.

Evidence: `tmp/company-profile-redesign/`;503tests/34files, typecheck/scoped lint
pass,267browser assertions at320/390/768/1280/1440/1920px with zero failures/runtime
errors. Two four-page A4 outputs, actual PDF-page captures, all FAQ/topics/contact
links verified; native PDFKit decodes contact text where pypdf's variable-font
mapping yields private-use punctuation/digits.15background non-GET calls mocked,
no enquiry/callback/contact call sent.448other existing source/Prisma files unchanged.
One detector61advisories/0warnings (CLI exit2 retained), one correction batch/two
capture rounds, inline verdict `ship` limited to heading pagination/sequence fixes.
Initial test-only readonly-clone/HR-fixture errors retained. No new raster/library.
Global legacy frontmatter/missing sidecar are deliberately outside this scoped merge;
production CSS/build, actual OS dialog, physical devices and legal/controls remain separate.

## Current v7 About override (complete company-story restoration)

The user's latest correction supersedes BOTH rejected About redesigns. Preserve
all original company-page sections, especially leadership, rather than reducing
About to a fact directory or logo/diagram assembly. `/enterprise` still supplies
the typography, rails, palette and action language, not a template to duplicate.
Only About-owned sources/documentation change; shared chrome/providers stay intact.
[About surface brief](.impeccable/surfaces/src-app-site-about-page-tsx.md).

### Truth boundary
Canonical COMPANY_FACTS/SITE values govern identity, founding, locations and
specialist disciplines. The recovered pre-removal source is archived under
`tmp/about-content-restore/original/`. All six original timeline milestones and
four original named leadership portraits/bios/sample contact strings are restored
verbatim in `about-preview-content.ts`, ONLY as conspicuously labelled demo content.
They are not verified Savo history or people. Original statistics return through
DEMO_METRICS in demo mode and admin-managed values/pending slots in production.
No demo identity, metric or achievement enters metadata/JSON-LD; demo builds retain
the inherited noindex guard. The user's later team-card instruction replaces
biographies/contact disclosures with LinkedIn and mail icons to the right of each
name. Those icons use the original sample destinations only within the labelled
demo team; real identity/contact approval is still required before publication. Production retains the
team/story sections with honest publication-pending information and verified facts,
not the fictional roster/achievements. Existing photo pixels are reused unchanged;
workplace photos and portraits are explicitly editorial/demo, not authentic staff
or office depictions. Mission/vision/culture additions are editorial principles,
not invented perks, employment arrangements, certifications or achieved outcomes.

### Composition
Grey original-style “One team, accountable since 2015” offer beside substantial
workplace photography/red-year/black-brand signature → white company overview,
identity sheet and restored four-statistics band → grey complete six-milestone
preview → white paired mission/vision statements → portrait-led leadership with
names/roles and two right-aligned contact icons, without biographies → grey six fully visible values → black three-craft
philosophy, all copy visible → white ten-specialist link directory → grey photo-led
culture/careers invitation → white two physical offices plus distinct Dubai/GCC
and US market-presence rows → white native buyer FAQ/related links → shared grey
close (`about-cta`, Careers secondary) → existing black footer. The rejected craft
radio studio and company assembly are removed; do not bring them back by default.
Hero `/contact#send` and `/case-studies#work` actions remain; story/team/values/offices
anchors use native scrolling. Verified addresses and all phone lines are retained.

### Details
Outfit500/Inter, Enterprise hero `clamp(2.4rem,4.7vw,4.2rem)` and section
`clamp(1.7rem,3.4vw,2.7rem)` scales. Desktop team heading has a deliberate larger
`clamp(2rem,4vw,3.2rem)` focal scale; phone headings rejoin the section scale. Body
16px, hero lead18px, details14–15px, notes11–13px. Same1280px rail,32px desktop/20px
phone gutters,56–88px rhythm,52px actions,6px controls,10px portrait/12px photographic
corners (8px phones). White/#F7F7F7/#000 grounds; #df2525 primary, #b82222 light focus,
#ff6b6b dark focus/marks; #555/#666/#757575/#b0b0b0/#383838/#d6d6d6/#E8E8E8 neutrals.

Four portrait columns become two on tablet and one on phones. Name/contact rows
use flex alignment, two 44px icon-link targets, accessible labels, red hover/focus,
LinkedIn in a safe new tab and email through mailto. No biography or preview-detail
text appears on cards; those archived source values remain unchanged. Dates reflow from a
three-column/two-row timeline to a vertical phone rail. Core values/crafts/history
are never hidden behind selection. Only FAQs use native plus/minus disclosures. One650ms photographic clip reveal, static reduced
motion; no new dependency/client component. All content and disclosures work
without JS. FAQ/schema equality, dynamic rendering, canonical metadata, enquiry
attribution, global footer/assistant/header and database behavior remain unchanged.

Evidence: `tmp/about-content-restore/` — 450tests/31files,105 browser assertions
across320/390/768/1280/1440/1920px; original content counts, loaded images, noindex,
no-JS/native-keyboard, enquiry/Escape, anchors, schema and demo-production unit gates;
typecheck/scoped lint pass. One detector scan84advisory/0warnings. Inline finish
verdict ships the three scored corrections, not production/security/legal readiness.
No new raster pixels; origins/classification recorded in provenance sidecars and
manifest. Legacy global frontmatter/missing sidecar remain outside this scoped merge.

## Current v7 Contact override

This scoped override governs `/contact`, preserving the approved Savo identity
and shared footer/conversion pipeline. It supersedes the old numbered document,
response-time specimen and demo-team layout; global legacy frontmatter and the
absent design sidecar remain outside this merge.

### Overview
A useful invitation and working message composer lead together. Direct channels,
verified-office disclosures, conditional next steps and practical questions
support the task rather than adding a second service catalogue.

### Colors
Neutral-grey (`#F7F7F7`) invitation/next steps/close, white composer and reading
fields, black type. Brand red (`#FF3333`) carries the headline emphasis and
functional photographic email mark. Accessible action red (`#DF2525`), readable
secondary grey (`#626262`), error/hover red (`#B82222`), field strokes (`#949494`)
and quiet separators (`#E8E8E8`) complete the scoped palette. Shared country
controls are neutralised locally, not reskinned site-wide.

### Typography
Outfit500 headings, Inter body/fields/controls. Invitation
`clamp(2.7rem,4.35vw,4rem)` with natural phone sizing; established section scale
`clamp(1.7rem,3.4vw,2.7rem)`. Body15–17px, label14px, native input15px/16px on
phones to avoid software-keyboard zoom. Supporting metadata is functional,
never a decorative eyebrow or response-time metric.

### Layout
1280px content rail within a1344px wrapper,32px desktop/20px phone gutters.
Grey opening pairs invitation/editorial photo left and white composer right;
below900px it stacks and the nonessential photograph recedes. Main chapters use
56–88px rhythm. Name/email share a row on desktop; narrow phones stack. Direct
channels become open rows; native offices and FAQs expand in place. FAQ heading
spans a wider list and narrower Careers/HR help panel, stacking on phones.

### Elevation & Depth
Tone and real photography, not new card shadows. The reused country popup keeps
its functional inherited shadow. One650ms visible photo clip arrival; reduced
motion makes it static. No tilt, autoplay or decorative loops.

### Shapes
Composer12px/phone10px, controls5px, shared-close actions4px. Editorial photo is
square-edged. Inputs are48px minimum and primary action52px; native topic labels
and disclosure summaries retain44px targets and visible red focus.

### Components
Native topic radios keep the five accepted contact enums. Required name/email/
message use the existing limits; phone/company/new-project budget remain optional
inside a native disclosure. Client validation precedes CAPTCHA, error focus opens
optional fields when necessary, country search Enter does not submit and Escape
returns focus. Actual API responses drive focused success/error states; a new
message resets the form. Shared API/CAPTCHA/honeypot/rate limits are unchanged.
First-touch attribution is allowlisted from existing session context, with no new
personal-data storage. No-JS submit is disabled with actual email recovery.
Canonical ContactPage/Breadcrumb/FAQ data matches the visible page and escapes
managed strings. Exact Contact chrome guards leave other families intact.

### Do's and Don'ts
Do lead with the task and preserve real managed destinations. Do distinguish a
Careers question from an application and provide the genuine Careers/HR links.
Do label editorial imagery and keep original rights unresolved until approved.
Don't invent staff, reply deadlines, free discovery, NDA/ownership/privacy
promises or instant availability. Don't publish sample CMS material or reskin
shared controls, footer or other page families as a side effect.

## Current v7 Insights override

This scoped override governs `/insights`, actual Published `/insights/[slug]`
reading pages and development-only `/insights/preview/[slug]` review pages. It inherits the approved Savo identity, superseding the legacy
journal/card-grid and warm-paper assumptions for this family only. Global legacy
front matter and the absent design sidecar remain outside this merge.

### Overview
An open editorial thinking room: useful questions, trade-offs and actual
published reading. Avoid repeated card containers, fake features, inferred
engagement stories and seeded articles presented as real publications.

### Colors
White and black carry the page; neutral grey (`#F7F7F7`) carries the thinking desk
and shared close. Savo red (`#FF3333`) marks the photographic invitation and
original concept drawings; accessible action red (`#DF2525`) supports white
button copy and small selected labels. Secondary copy is readable `#626262`.

### Typography
Outfit carries display/section/question/article headings, Inter body and native
controls. Hero uses `clamp(2.6rem,4.7vw,4.35rem)` with phone/tablet variants;
section scale remains `clamp(1.7rem,3.4vw,2.7rem)`. Article prose is 18px/1.85,
17px on phones, measured to 70ch. Reading metadata is actual context, not an
ornamental section eyebrow; no fake dates/authors or assumed reading times.

### Layout
A 1280px content rail inside a 1344px wrapper uses 32px desktop/20px phone
gutters and 56–88px chapter rhythm. Desktop opening pairs two-line copy/action
with an editorial photograph. The thinking desk uses four native radio choices,
question/three review points/labelled concept drawing; phones use two-by-two
choices, then one reading column. Nonessential artwork recedes below 1100px.
The library leads with a large editorial result, then open image-led cards in
two desktop columns and one phone column. Photographs, type and whitespace—not
boxed containers or shadows—carry the composition. Category/search/pagination use native GET navigation,
six entries per manual page. Article contents become a native list on phones.

### Elevation & Depth
Flat reading surfaces, real photography and tonal section changes create depth;
no new card shadows/glass/tilt. One already-visible 700ms clip arrival belongs
to the hero photograph; reduced motion removes it, without repeating reveals
throughout the page.

### Shapes
Square editorial image fields and original two-colour guide drawings; compact
primary actions use the established 4px corner. The red “Look closer.” link
stays fully inside the photograph, never clipped or pretending to be inert art.

### Components
Native radio labels retain selected underlines and visible keyboard focus;
no destination arrows on in-place topic choices. All four guides remain in
server HTML and work without JS. Unsupported `:has` exposes all guides instead.
The reading library hides pointless filters/search when genuinely empty, and
provides clear no-match recovery when populated. Actual Published timestamps
supply public dates; unsafe/incomplete article records fail closed. Static
params, metadata, sitemap/crawler consumers and related reading share that
publication authority. Grey close keeps `resources-cta` and actual article
sources, enquiry behavior and canonical secondary routes. Header/assistant
changes are exact-route guards only; shared footer and other page families stay
unchanged. Homepage reading now takes publication-only preview props, never
legacy seeds or private body payloads.

When the development library has no published records, a separate, explicitly
labelled preview displays five authored articles. Each links to a full noindex
review page with introduction, five substantive sections, practical examples,
key takeaways, further reading, related previews and a functioning print action.
Reading estimates are derived from the actual preview content at 220 words/min
and labelled approximate. Author assignment is pending and dates say “Not
published”; neither is invented. These are not CMS entries, canonical published
article routes, sitemap entries or dossier/homepage fallback data. Production
preview routes return 404. Actual records automatically replace the local
preview shelf. Native framework contents links avoid the inherited hash/popstate
route-veil interaction while retaining complete no-JS HTML.

### Do's and Don'ts
Do use useful original on-page guidance when no articles are published; clearly
separate it from the managed article library. Do label editorial photography
and concept drawings, preserve native exploration/recovery and record raster
origin. Don't publish/import sample articles to fill a layout, invent authors,
reply deadlines or engagement-derived claims, or turn this route's metaphor
into a new global design identity.

## Current v7 Careers override

`/careers` and `/careers/apply` use the approved Savo identity in a developer
workspace, not the legacy looping code specimen or stock-team culture page.
Surface contract: [.impeccable/surfaces/src-app-site-careers-page-tsx.md](.impeccable/surfaces/src-app-site-careers-page-tsx.md).

- Outfit 500 display / Inter body and controls; monospace only for actual route
  labels. Careers hero `clamp(2.4rem,4.7vw,4.2rem)`, application hero
  `clamp(2.4rem,4.4vw,3.8rem)`, section headings the established
  `clamp(1.7rem,3.4vw,2.7rem)`. Body16px/1.75, supporting workspace/task copy14px.
- Grounds #F7F7F7/#FFFFFF/#000000, workspace chrome #171717; #666 light copy,
  #b0b0b0 dark copy, #E8E8E8 structure and #949494 field strokes. Accessible
  #df2525 primary/#b82222 hover-focus; #ff6b6b interaction on black.
- 1280px rail,32px desktop/20px phone gutters,56–88px sections. Equal desktop
  hero columns/64px gap, stacking below900px; phone actions full-width.
  Workspace14px/phone12px radius; controls6px, fields5px,48px field/52px action
  minimums. One650ms workspace arrival; reduced motion is static.
- Real company introduction/preparation radio views and a local-only checklist;
  no dummy code, execution results, repositories, staff profiles or benefits.
  Published vacancy directory has native radios/filters, complete hidden panels
  and optional responsibility disclosures. The authorised local collection now
  includes HR Intern, AI / ML Engineer and Full Stack AI Engineer; no additional
  legacy jobs or unconfirmed employment terms were imported. Empty collection offers a general
  application, not coded sample jobs. Native no-JS fallback content is explicit.
- Hiring stages use original red outline icons on quiet 44px grey grounds,
  not visible numbering. The FAQ has a full-width heading, a wider native
  disclosure list and a narrower light-grey HR help panel aligned at the top.
  The panel uses an original conversation icon, 24px heading,16px explanation
  and explicit email/call/WhatsApp rows with aligned arrows and real destinations.
  Below900px, questions precede contacts in a stack.
- Application: aligned black route bar, neutral guide rail, white form canvas;
  skills, experience and start availability are required and always visible.
  Role-specific native checkbox categories, search and custom skills support
  1–12 selections. General choices span technology, design/quality, people,
  operations and growth; HR choices are HR-specific. Role changes clear skills
  with an explanation. Only browsing categories collapse. Employer/expected CTC
  remain optional; freshers and uncertain availability have explicit choices.
  Selects start blank. Client/server career validation agree, errors focus and
  clear correctly, and search Enter does not submit. Checked consent clears its
  error. Submit remains disabled until hydration; no-JS users have an HR email.
- Existing light-grey shared close stays distinct from the black footer. Header
  remains white/pinned and assistant compact on these two exact routes only.
  Managed navigation, contacts, analytics, CAPTCHA and enquiry pipeline remain.
- Short real sentences, no remote/hybrid/deadline or guaranteed-offer claims.
  Compensation remains private; vacancy dates derive from managed publication.
  No new shipping raster. Evidence/checkpoints/provenance/inline fix-to-ship
  review: `tmp/careers-redesign/`; authorised openings and section-refinement
  evidence: `tmp/careers-openings/`; required qualifications/HR help:
  `tmp/careers-required-skills/`. Global legacy frontmatter and absent sidecar
  remain outside this scoped merge.

## Current v7 Enterprise override

`/enterprise` now inherits the approved Outfit/Inter black/white/red identity,
not its earlier warm-paper service catalogue. The route's distinct purpose is a
buyer decision guide: starting arrangement, delivery review and vendor questions.
[Enterprise surface brief](.impeccable/surfaces/src-app-site-enterprise-page-tsx.md).

- Grey offer, white engagement studio, one black review desk, white vendor review
  and questions, shared light-grey close, unchanged black footer. No black close.
- Same 1280px rail, 32px desktop/20px phone gutters, 56–88px rhythm and section
  scale as the approved families. Hero uses the separate hiring-like
  `clamp(2.4rem,4.7vw,4.2rem)` scale; supporting graphics stay aligned, never tilted.
- One selected engagement/review view instead of repeated capability cards.
  Native radio controls retain all server content and explicit no-JS fallbacks.
  On phones the model explanation precedes its supporting illustration.
- Native optional details use plus/minus; arrows indicate actions/destinations.
  Original vector coordination/model symbols and review documents are labelled
  illustrative, not client work, available staff, a live portal or promised output.
- Company identity comes from verified canonical facts only. Security, commercial,
  ownership and support specifics are matters to agree for the actual engagement,
  not blanket promises or certification claims. No faux team photograph or metrics.
- Motion is one 650ms direction-settle and 250ms manual selection feedback;
  reduced motion is static. Only Enterprise joins the pinned white header and
  compact assistant guards; other families and shared CTA/footer styles are intact.

This is a scoped documentation merge; legacy global frontmatter and the missing
sidecar are deliberately not regenerated.

## Current v7 shared closing-section override

The latest user instruction standardises existing marketing-page closes using
`src/components/shared/closing-cta.tsx`. This overrides the older family-specific
closing colour/layout descriptions below, not the rest of those page designs.

- Light neutral #F7F7F7 ground, #000 heading, #666 body. The closing section is
  **not black**: it remains distinct from the unchanged black footer. Core-family
  FAQ grounds are white so the ending reads white → light grey → black.
- Outfit 500 section heading `clamp(1.7rem,3.4vw,2.7rem)`, line-height 1.12,
  tracking -.025em; Inter 16px/1.75 body and 14px/600 action labels.
- Shared 1280px rail, 32px desktop/20px phone gutters; 56–88px vertical rhythm.
  Desktop copy/actions use 1.2fr/.8fr columns with a 64px gap and vertical
  centring; actions sit at the right rail. Below 900px they follow the copy.
- Red #df2525 primary, #b82222 hover/focus, 6px radius and a 52px minimum target;
  desktop action column is 280px and becomes full-width below 640px. The secondary
  remains a quiet dark text action with a 44px minimum target. No CTA entrance
  animation; reduced-motion removes transitions.
- Page-owned wording, heading/anchor IDs, enquiry context, analytics attribution,
  secondary URLs and project-popup versus enquiry-drawer routing are preserved.
  Single-action executive closes remain single-action; no controls are invented.
- Used by homepage, service/AI/hiring/industry families, shared detail closes,
  case-study index, Enterprise, Trust and Technology. Printable/profile or contact
  pages without an existing closing CTA do not receive an invented section.

[Shared closing surface brief](.impeccable/surfaces/src-components-shared-closing-cta-tsx.md).
Legacy global frontmatter and the absent sidecar remain outside this scoped merge.

## Current v7 detailed Start override

`/start-a-project` inherits the approved world while functioning as an Operate surface.
This supersedes its legacy paper workbench and earlier large opening/outline;
the shared quick-start providers remain separate. Contract:
[Start surface brief](.impeccable/surfaces/src-app-site-start-page-tsx.md).

### Colors
- Compact white offer; #F7F7F7 task surround; black brief invitation/help beside
  a white live form. White testimonial section, gray follow-up sequence.
  Reading #666 on light/#b0b0b0 on dark; separators #e8e8e8/#383838.
  #df2525 display/actions/current stage, #b82222 hover/focus/error,
  #ff6b6b dark emphasis/focus; input/choice strokes #949494.

### Typography
- Outfit 500 headings; hero `clamp(2rem,3.5vw,3rem)`/1.12,
  sections `clamp(1.75rem,3.4vw,2.7rem)`/1.12; brief title32–44px,
  form titles26–30px. Inter labels/body/controls,16px inputs,14px actions,
  12–13px radio/error/detail labels,14–16px guidance/1.75–1.8.
  No new kickers, monospace costume or display-font labels.

### Layout
- 1280px rail,32px gutters/20px below640px;48–72px section rhythm.
  Compact offer/actions precede a single black/white .82fr/1.6fr workspace.
  At899px the order becomes invitation → form → reassurance/confidentiality.
  Contact fields use two columns, stack on narrower desktop/phones, restore
  two at tablet width. Three-column native radio choices become two on phones.
  Review rows wrap long values and preserve line breaks;320px actions stack.
- Retain two error lines inside the shared phone control to prevent blur-time
  click shifts. No clipping of the inherited country-list overlay.

### Elevation & Depth
- Flat tonal regions, no new shadows or entrance choreography. The inherited
  country popup keeps its existing overlay; it is not a new card grammar.

### Shapes
- 12px workspace corners,5px input corners,6px actions/radio labels.
  Actual stage markers are circular32px desktop/26px phone sequence controls.
  No ornamental accent border or new card grid.

### Components
- Primary52px red controls;44px edit/text actions,48px radio targets,52px
  inputs. Native radios select black/white, red3px keyboard focus; optional
  budget has an explicit clear action. Numbered progress and live step status
  express the actual three-stage sequence, not decorative chapter numbering.
- **The Review Before Sending Rule.** Encourage an early idea without claiming
  draft persistence or a guaranteed response. Contact details stay unsent until
  Send the brief; errors retain the in-memory draft. Required fields and optional
  phone/company/budget remain explicit. Confidentiality help is a native disclosure.
- Reuse the homepage testimonial component and Published data; pass through the
  existing CMS video URL, original attribution/poster, native labelled controls,
  inline playback, no autoplay. Never use demo endorsements to build confidence.
- Shared phone widget receives route-scoped outlined presentation and a
  viewport-bounded, natively scrolling country list. Field errors stay
  attached to their controls/groups. Review, loading, error, no-JS recovery
  and inline success retain the same typography and flat treatment.
- Ordinary 160ms state feedback; reduced motion removes transitions.
  No new modal success interruption or invented shared closing CTA.
- Project receipt uses “Thank you for sharing your vision.” with truthful enquiry
  acknowledgement and the submitted follow-up email. Three52px action links share
  a baseline and equal widths: red email action, outlined work/services actions.
  Container width≤580px stacks them. A separate44px Start another project action
  resets the form; status/focus behavior remains inline. No timeline/email-delivery
  guarantee. Scoped evidence: `tmp/start-confirmation-refresh/` (1,183 tests).

### Do's and Don'ts
- Do keep the brief/review task ahead of ornament. Don't put demonstration
  submissions, vendor proof or delivery guarantees into the interface.
- Do keep manual enquiry controls usable. Automatic competing popup opening
  is suppressed only on this exact route; all other shared behavior persists.

Documentation/review were substituted inline (no subagents). Evidence:
Latest evidence: `tmp/start-brief-refresh/`;70 files/1,181 tests, typecheck/scoped
lint,1440/768/390/320px journeys, three intercepted synthetic submissions and
no-JS email recovery. Real video playback is blocked by absent local Published
records/URLs. Production/backend/CAPTCHA/legal/device approval is not implied.
Legacy global frontmatter and missing global sidecar are not repaired or canonized
by this scoped merge.

## Current v7 Indore location override

`/locations/indore` extends the approved homepage/Trust/Profile world. This
supersedes only its legacy paper location-page composition, not Switzerland
or shared contact/provider behavior. Task/content contract:
[Indore surface brief](.impeccable/surfaces/src-app-site-locations-indore-page-tsx.md).

### Overview
- A clear local offer, readable real office/contact record, editorial service
  rows, dark working chapter and native questions. Preserve the shared grey
  close and native detailed-brief/contact routes. No new visual world.

### Colors
- White/black/#F7F7F7 fields; #ff3333 display emphasis, #df2525 actions,
  #b82222 hover/light focus, #ff6b6b dark links/focus. Light reading #555/#666,
  dark reading #b0b0b0; light separators #e8e8e8/#d6d6d6, dark #383838.

### Typography
- Outfit 500 headings, hero `clamp(2.4rem,4.7vw,4.2rem)`/1.08,
  sections `clamp(1.7rem,3.4vw,2.7rem)`/1.12. Inter body/controls;
  15px/1.8 service, working and answer text bounded near 65ch; 16px/1.75
  general paragraphs, 18px hero lead on larger screens, 14px action labels.
  No new eyebrow labels, display-font controls or monospace costume.

### Layout
- 1280px rail, 32px gutters/20px below 640px; 56–88px section rhythm.
  Half-width desktop opening; .85fr/1.15fr office/question columns with
  an 80px desktop gap. These stack below 900px. Services/working rows
  stay two-column through tablet and stack below 640px; office definition
  rows also stack on phones. Wide and long record values wrap.

### Elevation & Depth
- Flat tonal chapters, thin structural separators, no new shadows or faux
  depth. The white address sheet contrasts with the grey offer. A single
  650ms clipped/10px arrival belongs only to that sheet; never hides copy
  pending JavaScript. Reduced motion removes it and 160ms action transitions.

### Shapes
- 12px address-sheet corners, 6px primary/secondary action corners.
  Services are open editorial rows, not a repeated rounded-card grid.
  Location/arrow/plus symbols are authored inline SVG, not glyph icons.

### Components
- Primary actions are at least 52px high, text/contact actions 44px,
  native question summaries 76px/72px on phones. Red 3px focus with 4px
  offset, lighter red focus on black. First question open; all answers
  readable without JavaScript, with matching FAQ schema.
- **The Real Address Rule.** An address-search action derives from a
  publishable Indore headquarters record; don't imitate a verified business
  pin, coordinates, office photograph, availability or opening hours.
- **The Native Destination Rule.** Keep `/start`, `/contact` and the sibling
  office route as genuine links. Don't replace this route's original close
  with a newly invented popup interaction. Shared manual enquiry stays usable.

### Do's and Don'ts
- Do require public visibility plus approved/derived status for route facts.
  Keep honest pending states and withhold unusable email/phone/map links.
- Do retain four service records and all seven question topics. Don't convert
  a location into evidence of seniority, guaranteed savings, rankings,
  named-reference availability or a committed response/proposal schedule.
- Don't fabricate local imagery, people, customer deployments or office proof.

Inline review/documentation substitution; evidence `tmp/indore-redesign/`.
No production, backend, legal, actual Maps result or physical-device approval
is implied. Legacy global frontmatter/sidecar drift is not repaired or
canonized by this scoped merge.

## Current v7 Switzerland location override

`/locations/switzerland` inherits the approved Indore location family and
homepage/Trust/Profile world. This replaces only the legacy Swiss page,
not shared presence registries or the Indore route. Task/truth contract:
[Switzerland surface brief](.impeccable/surfaces/src-app-site-locations-switzerland-page-tsx.md).

### Overview
- A readable office offer and genuine contact sheet, public office/entity
  record, six open service rows, dark working chapter and native questions.
  The original native conversation close adopts the shared grey grammar.

### Colors
- White/black/#F7F7F7 fields; #ff3333 display emphasis, #df2525 actions,
  #b82222 hover/light focus, #ff6b6b dark links/focus. Light reading #555/#666,
  dark reading #b0b0b0; #e8e8e8/#d6d6d6 light and #383838 dark separators.

### Typography
- Outfit500 heading voice; hero `clamp(2.4rem,4.7vw,4.2rem)`/1.08,
  sections `clamp(1.7rem,3.4vw,2.7rem)`/1.12. Inter body/control voice.
  Detail/answer copy15px/1.8/65ch, general16px/1.75, hero18px (16px phones),
  action14px/600. Contact numerals are tabular, not decorative monospace.
  Tablet headings join the explicit line breaks with actual whitespace.

### Layout
- 1280px rail,32px desktop/20px phone gutters,56–88px section rhythm.
  Equal opening columns/64px gap; .85fr/1.15fr office/question split with
  80px gap. These stack below900px. Services and working records stay in
  two columns on tablet, stack below640px. Long addresses/identity wrap;
  definition rows stack on phones. Primary/secondary hero actions fill
  the phone rail; contact and search remain distinct native actions.

### Elevation & Depth
- Flat fields, open reading rows and tonal separation; no new shadows,
  office photograph, faux map, physicality or simulated geographic proof.
  One already-visible650ms clipped/10px address-sheet arrival; ordinary
  160ms action colour feedback. Reduced motion removes both.

### Shapes
- White contact sheet12px corners, primary/secondary actions6px.
  Open service/working rows are not repeated rounded feature cards.
  Authored consistent inline SVG pin/arrow/plus, not glyph icons.

### Components
- Primary controls52px minimum, contact/text controls44px, native question
  summaries76px/72px phones,3px red focus with4px offset. First question
  open; all ten complete answers in server HTML with identical FAQ schema.
- **The Public Office Rule.** Require public approved company-office facts
  plus a verified physical Swiss office record, not just a populated/demo
  presence. Search the published address; never fake a business pin or hours.
- **The Office Is Not An Entity Rule.** A physical office must not become an
  invented Swiss incorporation/contract/certification claim. Make actual
  contracting arrangements something to confirm, not decorative proof.
- **The Native Destination Rule.** Retain `/start`, `/contact` and Indore
  links. Shared manual enquiry still works; no invented popup closing flow.

### Do's and Don'ts
- Do keep all six original service records and ten question topics. Do make
  office, phone, email and pending states readable without JavaScript.
- Do distinguish Europe/Zurich CET/CEST from fixed IST, without a fake live
  office clock or guaranteed next-morning progress/reply.
- Don't infer available staff, seniority, short timelines, client counts,
  extra-city offices, hybrid-cost savings or a Swiss legal entity.
- Don't treat approved record markers as independent legal/governance or
  actual delivery verification.

Inline review/documentation substitution; evidence `tmp/switzerland-redesign/`.
No production/backend/legal/Maps-result/physical-device approval is implied.
This scoped merge leaves legacy global frontmatter/missing-sidecar drift
untouched and does not canonize it.

## Current v7 homepage and project-brief overrides

The user-approved v7 homepage and project popup supersede the legacy dossier
specification below **within these surfaces**. Do not apply the old font/palette
front matter to them or repair unrelated documentation as part of this task.

- Base palette: #FF3333, #000000, #FFFFFF, #F7F7F7, #757575, #E8E8E8.
  `#000`/`#fff` are aliases. Scoped neutral ramps support hierarchy and controls;
  the popup uses #111, #555, #666, #949494, #b0b0b0, #383838 and #d6d6d6.
  #949494 provides a >=3:1 input stroke on white. Accessible action/focus reds
  are #df2525, #c92121 and #b82222; #ff6b6b serves small text on black.
- Fonts: Outfit display, Inter UI/body, Afacad Flux quotation voice only.
- Homepage section headings and footer tagline match Technology:
  `clamp(1.7rem, 3.4vw, 2.7rem)`, line-height 1.1, tracking -.018em.
  Hero typography remains distinct. No new eyebrow/kicker rows.
- Common rail: 1280px, 32px gutters, 20px phone gutters; section spacing 56–88px.
- Approved order: Hero/logos, Services, Portfolio, consolidated AI/engineering,
  Industries, Process, Client proof, Technology, Insights, FAQ, Belief, final CTA.
- Portfolio now uses one actual straight cover per Web/Mobile/AI tab from the
  first matching Published managed case marked “Featured on homepage”, with
  a genuine cover supplied. Preserve the original shell/tabs/black rail and
  all three capability descriptions/tags/Explore text. Remove tilted mockups;
  Centered `object-fit:cover` fills the frame without letterboxing; proportional
  edge cropping is owner-authorized. Web/AI use an upright inner
  browser window (1px neutral border,8px/6px corners,36px/30px decorative top
  bar,24px/14px inset). Neutral dots/public project name only, no fake URL or
  working browser controls. Mobile stays a plain cover without a browser bar.
  Outer scene/tabs/black rail and copy remain unchanged. Framing evidence:
  `tmp/home-browser-frame/`. Cover/caption/Explore link
  to the actual case page; empty categories are honest, never filled with an
  unrelated client or fictional interface. Fetch on the server, pass only
  minimal public display props. Latest evidence: `tmp/home-case-link/`.
  Demo proof remains labelled non-endorsement; conversion forms receive only
  managed testimonials. Technology retains 48 items in three manual pages.
- Popup: 1040px desktop shell with black introduction and white form; a
  single-column 680px tablet panel and a bottom sheet on phones. Initial brief:
  name, email, service and description. Optional company, country/phone, stage,
  budget, timeline and contact method are retained behind disclosure.
  WhatsApp opt-in remains explicit. Header and submit/captcha footer remain
  fixed while the fields scroll natively. Controls use 48px fields/actions,
  44px close/selection targets, 5px field radius and a 16px dialog radius.
- Copy favors business context, concrete requirements and a clear next step.
  No invented delivery guarantees, outcomes, clients, certifications or metrics.
  Published managed quotations, official brand lines and contact data are not
  rewritten. Proposal, ownership and confidentiality details remain contractual.

Direct surface specifications:
[homepage](.impeccable/surfaces/src-app-site-page-tsx.md),
[project brief](.impeccable/surfaces/src-components-shared-project-lead-modal-tsx.md),
[portfolio](.impeccable/surfaces/src-sections-home-v2-portfolio-tsx.md).
Legacy PRODUCT.md/front-matter drift remains explicitly out of scope.

## Current v7 industries override

`/industries` and its ten canonical chapters now inherit the approved v7 service
identity, not the legacy warm-paper industry atlas. Contract:
[industries surface brief](.impeccable/surfaces/src-app-site-industries-page-tsx.md).

- Outfit display / Inter UI. Hero `clamp(2.35rem,4.5vw,4rem)`, sections
  `clamp(1.7rem,3.4vw,2.7rem)`; 1280px rail, 32px desktop /20px phone gutters,
  56–88px section spacing. Black opening/AI/delivery, white decisions and close,
  #F7F7F7 context and reading. Accessible #df2525 action /#b82222 focus on light
  and #ff6b6b interaction on dark; scoped #666/#b0b0b0 neutral copy.
- Hub: editorial three-sector photographic opening, ten manual native industry
  choices with a photo/solution preview, direct chapter directory, common delivery
  map, brief questions/capability links, available public work/reading, FAQ, close.
- Details: current-sector breadcrumb and distinctive business headline beside a
  substantial six-actor ecosystem; context/challenges, six manual solution briefs,
  reviewed AI opportunities, integrations/safeguards/outcome criteria, delivery,
  public work/reading, related links, FAQs and contextual enquiry. The topology,
  actors, workflow, challenges and decision boundaries are sector-specific.
- Flat, straight authored SVGs and HTML labels; 6–10px control/surface corners.
  Ecosystem actors use pressed buttons and a live responsibility explanation;
  solutions use native radios with all panels server-rendered and inactive ones
  natively hidden. Secondary material uses native disclosures. No tilt, autoplay,
  fake dashboard numbers, giant decorative metrics, drag or scroll hijacking.
- One 700ms once-only ecosystem connection draw; 220ms manually triggered
  selection feedback and 160ms control transitions. Reduced motion is complete
  static content. Sticky contents follow passive RAF native-scroll geometry;
  pinned service-style header and compact assistant apply to industries only.
- Existing sector photographs are editorial, not delivered client sites. Diagrams,
  workflows and editorial marks are labelled illustrative. Proposed outcome measures
  are not achieved results. Regulations describe matters to assess with responsible
  specialists, never certification or autonomous decision authority.
- Full chapters are editable in `/admin/content/industry-dossiers`, using existing
  JSONB storage, order/active/lifecycle controls and explicit publication validation.
  Once managed rows exist, missing/draft/hidden records do not resurrect defaults;
  an actual read failure is fail-closed. Explicit published case-study and insight
  relationships govern public resources. No migration or automatic import.
- Canonicals, static params, sitemap and industry crawler entries use the same
  managed dossiers. Service aliases resolve to canonical detail URLs; public
  managed navigation labels retain precedence. Contacts, header/footer identity,
  enquiries, attribution and CAPTCHA remain shared. Production/security/legal
  sign-off and physical-device tests are not implied by the local finish verdict.

Latest detail-artwork containment overrides the earlier offset-circle geometry:
hero badges have a concentric 12px-inset ring and a 52%-size sector SVG. Products
couple the entire white disc and proportional SVG in one centred square wrapper
(216px desktop /166px phone), with captions 24px below. No disc extends outside
its card; no masking or SVG-path edits hide overflow. This is shared across all
ten layouts and preserves content, controls, motion preferences and hub styling.
Evidence: `tmp/industry-shape-fit/` (25 layouts, all 150 selected product panels).

Evidence, reversible checkpoints, provenance and the substituted inline fix/ship
review are in `tmp/industry-redesign/`. The legacy global frontmatter and missing
global sidecar remain outside this scoped merge; do not apply them to these pages.

## Current v7 service-detail override

`/services/[slug]` now inherits the approved homepage identity, not the legacy
engineering-dossier chapters. The user rejected the initial text-forward draft.
Contract: [.impeccable/surfaces/src-sections-services-service-detail-tsx.md](.impeccable/surfaces/src-sections-services-service-detail-tsx.md).

- Black opening with a substantial, straight browser/phone product exhibition and
  manual concept selectors. Browser and phone frames must not rotate: the user's
  later AI-page request explicitly rejected tilted hero imagery on services too.
  White/gray scope, black engineering map, illustrated delivery
  and sector photography provide visual pacing; no invented client proof or metrics.
- Outfit display / Inter copy; section headings `clamp(1.7rem,3.4vw,2.7rem)`;
  hero `clamp(2.35rem,4.5vw,4rem)`, restrained phone wrapping.1280px rails,
  32px gutters /20px phones,56–88px section spacing. No eyebrow/section indexes.
- Six capability tabs, four delivery stages, native engineering/overview/fit
  disclosures; all explanations remain available. Keyboard roving, responsive
  orientation, manual selection, native vertical scrolling and reduced motion.
- Sticky service contents track native scrolling; the service header stays visible
  and changes from black over the opening to white after scroll. Service-only
  assistant uses a compact outer-edge launcher; its conversation logic is retained.
- Brand #FF3333; accessible #df2525 action surfaces and #b82222 light-surface
  interaction; #ff6b6b on black. Neutral #FFFFFF/#F7F7F7/#000000/#666/#757575.
  No warm-paper/orange/blue-black dossier treatment within this route.
- Existing local photos and technology SVGs are reused, no new shipping rasters.
  `tmp/service-visual/asset-provenance.json` records origins and rights limitations.
  UI/covers/system maps are explicitly illustrative, not delivered client projects.
- Canonical URLs/metadata and enquiry provider remain; FAQ schema matches the new
  visible answers. Team/demo proof and unverified reply/ownership/ranking promises
  do not enter this page. This editorial redesign is not CMS dynamization.

## Current v7 AI hub, agent and practice overrides

`/ai-agents`, its six canonical role pages, and the four `/ai/[slug]` practices
inherit the approved Savo identity. Contract:
[AI surface brief](.impeccable/surfaces/src-sections-ai-ai-pages-tsx.md).

- White opening; clear offer and enquiry/exploration actions beside a substantial
  black-framed, aligned example workspace. No tilted imagery, robotic stock art,
  invented performance figures or claims of a live connection. Distinct examples
  show agent sources/preparation/review, workflow exceptions, strategy readiness,
  and forecast uncertainty versus a simple baseline.
- Outfit display / Inter copy. Existing CSS variable names `--font-serif` and
  `--font-sans` resolve to Outfit and Inter, not the legacy font front matter.
  Hero `clamp(2.35rem,4.5vw,4rem)`; section headings
  `clamp(1.7rem,3.4vw,2.7rem)`; body 16px, hero lead 18px, task copy 14–15px,
  controls 13–14px, minor captions 10–12px. Native phone reflow and full-width CTAs.
- 1280px rails, 32px gutters /20px phones,56–88px section rhythm. Scope/role
  explorers, black foundation map with native disclosures, illustrated delivery,
  contextual practice/role links, FAQ and one focused closing CTA provide pacing.
- Hub-only lower-page refinement: AI services → related insights on #F7F7F7 →
  FAQ on #FFFFFF → project invitation on #F7F7F7 → existing black footer.
  The invitation uses black headings/#666 copy, the same red enquiry action and
  #b82222 focus; it must not merge into a second black band above the footer.
  Three existing public AI articles come from getManagedArticles(), with relevant
  editorial priority but no backfill of missing managed rows. If there are no AI
  articles, hide the section and its local contents link. Three-column desktop,
  side-by-side tablet reading rows, stacked phone covers/copy; no card outlines or
  extra motion. Authored light SVG covers are explicitly illustrative. AI role
  and practice detail pages retain their previous closing treatment. Evidence:
  `tmp/ai-hub-balance/`; this supersedes the hub closing color only.
- Brand #FF3333; actions #df2525, hover/focus #b82222, dark interaction #ff6b6b.
  Grounds #FFFFFF/#F7F7F7/#000000; scoped neutrals #111/#171717/#202020/#333/
  #383838/#555/#666/#757575/#949494/#b0b0b0/#E8E8E8. #ffeded is the authored
  forecast uncertainty fill, not another brand accent. #000/#fff are aliases.
- 16px desktop/12px phone exhibition frames;10px workspaces;8px scope/link
  surfaces;4–7px small controls; circular step markers carry actual sequence.
  Depth is a soft offset exhibition shadow, not decorative glass or a halo.
- Manual selectors with roving keyboard focus and responsive orientation; sticky
  local contents; native scroll; one300ms opening; no autoplay or extra library.
  Reduced motion removes animation. Persistent white AI header and compact
  outer-edge assistant preserve shared navigation/conversation behavior.
- SalesBot retains its deterministic engine, visibly distinguished from a live
  LLM/CRM. Demo fields/handoffs are samples, not enquiries or outcome predictions.
  Managed agents/practices/navigation still take precedence over fallback copy.
  Canonicals, unknown-route404s and matching visible FAQ/schema are retained.
- No new shipping raster assets. Authored JSX/SVG examples and reused local
  technology icons are inventoried in `tmp/ai-redesign/asset-provenance.json`.
  Existing publication/trademark permission and production security/legal checks
  remain separate. This editorial redesign is not broader CMS dynamization.

## Current v7 hiring hub and role-page override

`/hire` and its six canonical role pages now use a team-building journey, not the
service/AI product-exhibition template. Contract:
[hiring brief](.impeccable/surfaces/src-app-site-hire-page-tsx.md).

- Broad typographic hub introduction and full-width team-relationship illustration;
  no tilted imagery, browser/phone hero, fake staff photos, profile counts or
  availability clocks. Role pages put responsibilities alongside a compact listed
  rate summary, rather than a discounted billing-cycle plate.
- Native six-role radio studio changes the responsibility/assignment/rate brief;
  three manual working-model controls compare team shape and ownership. The dark
  collaboration passage walks through Plan/Build/Review/Release, then a vertical
  hiring sequence explains matching, scope and onboarding. Role pages use native
  responsibility sheets with illustrative assignments, a static complete stack,
  skills, complementary roles and a real service alternative.
- Outfit display / Inter UI, existing font variable aliases; hero
  `clamp(2.4rem,4.8vw,4.4rem)` /38.4px phones, section headings
  `clamp(1.7rem,3.4vw,2.7rem)`,22px subheads,16px body,13–15px detail copy,
  11–12px captions.1280px rails,32px/20px gutters,56–88px section spacing.
- Neutral #FFFFFF/#F7F7F7/#000000, #111/#171717/#202020/#383838/#555/#666/
  #949494/#b0b0b0/#E8E8E8; #df2525 actions, #b82222 light focus and marks,
  #ff6b6b dark focus/marks. Restrained 6–14px control/diagram surfaces.
  Keep one black collaboration chapter, white/gray reading stages, white FAQ,
  light-gray closing invitation and the existing black footer.
- Contextual hiring CTAs at the opening, role brief, model comparison, daily
  collaboration, onboarding, FAQ and close use the existing enquiry provider.
  Prefill carries role/model context; no new form/API, countdown or forced overlay.
- Native radios, summaries and ordinary manual buttons; no autoplay, marquee,
  ornamental loop or new library. One320ms diagram reveal, static reduced motion.
  Phone diagrams switch to readable HTML team rows; role choices are two columns
  from360px and one below. The existing header/compact assistant are hire-scoped.
- Existing monthly numeric rates are retained as listed references, not a final
  quote. Fallback-only editorial overlay removes unsupported matching-speed,
  free-replacement, certification, employee-history and blanket commercial claims.
  Managed records remain authoritative; no database writes. Canonicals/static
  params/FAQ schema and unknown-role404 preserved.
- No new shipping raster assets. Authored SVG/HTML team and assignment diagrams
  are visibly illustrative, not client work or staff profiles. Provenance/evidence:
  `tmp/hire-redesign/`. Existing media/trademark permissions, contracts, production
  delivery/security/CAPTCHA/legal and real-device validation remain separate.

### Later `/hire` hub-only flow override

The user rejected the first hub assembly as scattered. This later override applies
**only to `/hire`**; the six role pages and shared hiring modules above stay as-is.
Sources: `hire-hub.tsx`, `hire-hub-interactions.tsx`, `hire-hub.module.css`.

- Six purposeful stages: direct offer → choose a skill → choose a team shape and
  understand ownership → hiring sequence → answers → enquiry. No separate daily
  collaboration or full reading chapter; supporting assignments, brief checklist
  and existing managed article links are optional native disclosures. Detailed
  responsibility copy remains on the unchanged role pages.
- White opening pairs a readable offer/actions with an authored team/developer/
  reviewed-work assembly. Three native journey links lead to the skill, setup and
  start sections. A left role list/right concise focus/rate brief replaces the
  large six-card catalogue plus multi-column assignment/rate spread.
- One black manual team-builder connects the buyer’s direction to the roles in a
  developer/pod/broader-team shape. Explicit ownership below explains what the
  buyer guides, what is contributed and what gets reviewed. A connected vertical
  hiring sequence on white follows; gray FAQ and white invitation distinguish
  the ending from the untouched black footer.
- Approved fonts, palette and rails remain. Hero `clamp(2.4rem,4.7vw,4.2rem)`;
  section headings `clamp(1.7rem,3.4vw,2.7rem)`,16px body,13–15px detail,
  11–12px secondary labels.52px action targets,6–10px control/diagram radius.
  #949494 SVG strokes, #b82222 light connections, #ff6b6b dark connections;
  neutrals/actions inherit the established hiring palette.
- Motion explains assembly/selection/sequence: once-only hero connector drawing
  and500–650ms node arrival, manual420–500ms team-shape changes,220ms role
  selection feedback and a passive RAF native-scroll hiring rail. No autoplay,
  infinite loop, scroll hijack or dependency. Default content is visible; reduced
  motion removes spatial/drawing animation and shows the full static rail.
- Phone hero stacks while retaining its two initially visible actions. Role
  choices become a compact two-column list; team families adapt to readable
  phone grids/rows. Native radio arrows, model buttons, disclosure, article/role
  links and existing enquiry prefill/Escape/focus behavior are retained.
- Managed roles/articles, numeric rates, canonical metadata and six visible
  FAQ/schema records are preserved. New hub sources are isolated; no role-page,
  shared header/assistant/footer/enquiry source or database change.
- Only authored SVG/HTML diagrams, visibly illustrative; no new shipping raster,
  profile proof or external asset. Checkpoint/provenance/verification/inline
  review: `tmp/hire-hub-revamp/`. Legacy global front matter remains out of scope.

### Later `/hire` hero-only creative override

The user then rejected the large white hero field and asked for a more appealing
creative approach, not an all-black backdrop. This supersedes **only the hero**
of the hub flow above; lower hub sections and all role pages remain unchanged.

- Full-width #F7F7F7 canvas, tighter top/guide spacing and balanced equal-width
  desktop offer/art columns. Heading/body/action copy and destinations unchanged;
  secondary action becomes white on the gray canvas. Same1280px rails/fonts/type.
- A substantial, authored flat SVG/HTML team-fit map replaces detached narrative
  cards. One #df2525 puzzle-shaped development module joins product direction and
  tools/context to review/handover. White support modules, #E8E8E8 mapping lines,
  #b82222 connections, white role lettering. Visible illustrative disclosure;
  no portraits, staff availability, fake interface/customer proof or tilted art.
- Once-only700ms lateral role fit and650ms connection drawing; a temporary gray
  slot outline disappears as the role settles, avoiding a ragged dashed perimeter.
  Existing reduced-motion rule leaves a crisp, complete static illustration.
  No all-black field, decorative loop, extra library, raster or external asset.
- HTML labels remain readable as the graphic scales to phones; secondary code
  microcopy is omitted below640px, while the role and four relationship labels
  remain. CTAs stay initially visible at320–1920 widths.
- Source change boundary: only HiringAssembly and hero-specific CSS. Parent hub
  markup, remaining client components, lower-page CSS and shared/subpage source
  preserved. Scoped evidence/provenance/inline review: `tmp/hire-hero-creative/`.

## Current homepage galaxy star motion

Scoped to `src/sections/home-v2/hero.tsx`: existing stars drift automatically in
clockwise flattened orbital paths, with8/14/22px/s orbital-plane speeds by depth.
This is visibly moving idle ambience, not a warp flight or new hero composition.
Preserve original density/opacity/twinkle, copy/actions and horizon/header lighting.
Use the existing single canvas loop, delta-time movement and off-canvas32px wrap
margin. Mobile first frame must meet its32ms draw threshold; otherwise the loop
never starts. Reduced motion renders static stars, and offscreen/hidden views sleep.
No new particle budgets, layout motion, raster assets or dependencies. Scoped
brief/evidence: `.impeccable/surfaces/src-sections-home-v2-hero-tsx.md` and
`tmp/hero-star-motion/`. Browser FPS observations are local, not device guarantees.

### Owner-pinned soft horizon and localized sparkle

The original soft horizon lighting is retained exactly in colour, strength,
border/blur treatment and responsive geometry. An interim solid sun/white-hot
core was rejected and removed: never draw a ball on the rim. Move the existing
four light apertures together (`--sun-mask-shift`) and transform the original
halo along the true ellipse/tangent. Ease180ms toward pointer left/right, return
to center on leave; coarse pointer/reduced motion stays centered. Mask updates
are a bounded paint cost, not assumed compositor-only motion.

Add at most52 desktop/24 phone stars in the real dark gap above the central
horizon, clear of the actual CTA bounds. A sparse subset has asynchronous slow
photographic glints, not synchronized blinking; extra stars drift locally to
retain the cluster. Same single canvas/RAF (caps162/58 total,60/30fps, DPR≤2),
32px cached star-glow texture and planet occlusion; no new shipping assets.
Reduced motion renders static/no-glint stars; frame and event guards prevent
queued callbacks from restarting hidden/offscreen/reduced loops. Shared content,
actions/chrome/layout are unchanged. Evidence: `tmp/hero-horizon-light/` and the
updated hero surface brief. Local headless checks are not live/device clearance.

## Current v7 navigation override

### Shared action and reachable-link refinement

The approved shared-chrome audit fixes keep the actual top-bar **Start a Project**
action visible at all widths. Mobile uses common compact padding/type and omits
the arrow, not the action. Preserve hero-specific tones and existing home/project
versus nonhome/enquiry behavior. Header brand and footer brand/contact/phone/legal/
directory/disclosure targets have real44px minimum hit areas; keep the same55
footer anchors and native phone disclosures. Larger targets use compact link/phone
gaps, not overlapping invisible overlays.

**The Same Task Action Rule.** Responsive adaptation keeps the primary public-site
action findable in the same top-bar position, without inventing a new endpoint or
changing the established form routing.

**The Reachable Link Rule.** Extend the real clickable box, preserve the artwork,
labels and canonical destinations, and keep keyboard focus tied to that box.

Footer callback CAPTCHA preflight never enters pending state until verification
passes; duplicate sends are synchronously guarded, pending drafts locked, HTTP+
boolean success required. Receipt confirms the request/number, not a guaranteed
senior callback time or delivery. Evidence/limits: `tmp/chrome-fixes/`. Optimized
build success (with recorded DB fallback warnings) and local connectivity do not
imply live deployment; this folder lacks the documented Git promotion setup.

### Connectivity & loader contract (2026-10-06 audit)

- Every internal menu/submenu/footer href is root-relative, has **no trailing
  slash** and points at the **final canonical slug** (`/services/mobile-app-development`,
  not legacy `mobile-apps`); managed Services/Industries rows are canonicalized
  at read time (`managedHref`) so admin slugs never produce redirect bounces.
  Legacy short slugs remain served only by 308 redirects for external equity.
- Body links obey publication authority: service-page “Reading:” links render
  only for actually Published insights (otherwise an honest `/insights` hub
  link); hardcoded article URLs on Trust/AI pages replaced with real routes;
  the homepage AI card links `/ai-agents` (the `/ai` route never existed), and
  `#services`/`#ai` anchors exist on the homepage.
- `RouteLoader` arms **only for real document transitions** (`shouldArmVeil`:
  pathname change). Same-page anchors, search-only filter links and hash
  history jumps never arm — they commit without a pathname change, so a veil
  there could only hang until the 10s ceiling. Popstate arms only when the
  target pathname differs from the last committed one; arming state resets
  after completion.

The shared navigation now follows the current Savo identity, not the legacy
mega-panel description below. Source/behavior contract:
[navigation surface brief](.impeccable/surfaces/src-components-layout-nav-panels-tsx.md).

- Borderless dark #111 catalogue, white text and #b0b0b0 supporting text;
  a #F7F7F7 feature rail with #000 text. No separator rows, top red rule,
  outer stroke or action-bar divider. Whitespace defines the groups;
  #202020 rounded hover/focus surfaces and #171717 action areas define interaction.
  #ff6b6b supports accessible interaction on dark, #df2525 actions on light.
- Outfit 28px category headings and 22px feature/mobile choices; Inter 15px
  desktop navigation labels, 13px contextual descriptions. No eyebrow or section index.
- Desktop panel: 1280px max, 32px inner spacing, intro / two-column catalogue /
  feature rail, and a 64px action bar. The header and drawer share a 1280px
  desktop breakpoint; smaller screens use a drill-down drawer with Back.
- One 220ms entrance, 160ms hover feedback; reduced motion removes animation.
  Native scrolling and keyboard/focus semantics take priority over choreography.
- AI catalogue groups its five existing destinations into **Build & connect**
  (agents, automation, generative AI) and **Plan & analyse** (consulting, machine
  learning). Its feature illustrates sources → prepare → review. Mobile retains
  Back, native inner scrolling and the fixed project action; the agent PRO flag
  and managed/canonical destinations remain. See `tmp/ai-redesign/` for evidence.
- Canonical and managed links remain; old unsupported timing/trial/security and
  estimator copy is replaced with descriptions of the real linked offerings.
  No new claims, clients or endpoints. No extra raster assets.

## Current v7 footer override

The shared footer now inherits the approved cinematic homepage rather than the
legacy dossier treatment below. Its local specification takes precedence for
`src/components/layout/site-footer.tsx`:
[footer surface brief](.impeccable/surfaces/src-components-layout-site-footer-tsx.md).
It uses a pure-black ground, white/neutral-gray text, restrained Savo-red lighting,
Outfit headings, Inter UI, an official SVG signature and a dark callback panel.
All existing links, managed contact details and callback behavior are preserved.
These styles are footer-scoped; legacy chapters elsewhere are not changed.

## Overview

**World: the engineering dossier, bound in leather.** SAVO's surfaces read as
precision-authored technical documents with the warmth of a bound volume —
serif display type over a professional sans, warm paper and sand pages,
blue-black systems chapters, and one vermilion signal. The recurring mark is
the **square node** (brand mark, hero system, marquee separators, grid ticks,
metrics dash, favicon). Photography is real but held inside the document's
ink (duotone); infographics are hand-drawn vectors that ink themselves in on
scroll.

Chapters are token scopes — `:root` (paper), `.chapter-ink`, `.chapter-accent`
in `src/app/globals.css`. Components never hard-code chapter colors.

## Colors

- **Paper chapter**: `#f7f5f0` ground, `#17171a` ink, `#565449` muted (7:1),
  hairlines `rgb(23 23 26 / 0.13)`, accent `#d9480f` (3.95:1 — large/bold and
  marks only).
- **Sand band** (`--surface-secondary` `#ede9de`): the alternate section
  ground for Technology and Growth; muted text holds 6.3:1 on it.
- **Ink chapter**: blue-black `#101319` (richer than pure black), `#eef0f4`
  text, `#a3a8b3` muted (7.8:1), accent `#ff5a24` (5.97:1 — safe at small
  sizes on ink). Surfaces step lighter `#171b22` / `#1f242d`, never pure.
- **Vermilion chapter**: `#e8490f` ground with near-full ink text (4.75:1);
  muted stays ≥0.95 ink-alpha — hierarchy by size and weight, never tone.
- Status colors only for real states.

## Typography

Three voices, one document:

- **Source Serif 4** — the voice. Display and all headlines (`t-dxl`,
  `t-statement`, `t-dl`, `t-h1`, `t-h2`), sentence case, optical sizing on.
  Italic reserved for the brand line ("Bold Brands. Built by Savo.").
- **Manrope** — the interface. Sub-heads (`t-h3`, `t-h4`), body (`t-body-lg`,
  `t-body`, `t-sm`, `t-caption`), controls, wordmark (extrabold, tracking
  −0.03em).
- **Fragment Mono** — measurement only (`t-label`): section indices, data,
  notes, chips of capabilities. Never body copy.

Statement sizes clamp down to 2.4rem so long words ("TECHNOLOGY") hold the
line at 320px. Body measure ≤ ~34rem; `.tnum` for figures.

## Layout

- `.shell` max-width 90rem, inline `clamp(1.25rem, 4.5vw, 4.5rem)`.
- Section rhythm `py-20 sm:py-28 lg:py-36`; **SectionHeader** standardizes
  every section opening: serif heading on the left rail (7 cols), lead copy
  right-aligned on the right rail (5 cols), shared baseline.
- Name rail opens each section (accent square node + `Name` mono label +
  hairline) — narrative wayfinding, not decoration. No numeric indices
  anywhere (user-pinned: the site must not read as numbered); ordinal
  meaning is carried by order, nodes and hairlines, and `.tnum` survives
  only on real figures (salaries, dates, data).
- Editorial 12-col grids; accordions and hairline rows instead of card grids;
  `gap-px` grids for metrics/growth; sticky rails (services index, AI
  pipeline, studio image) at `top-28`.

## Elevation & Depth

Flat, tonal depth — chapters, sand bands, surfaces and hairlines. Two
exceptions: the enquiry drawer's offset soft shadow
(`0 -24px 80px rgb(0 0 0 / 0.35)`) and photographic gradients over duotone
images. No halos, hard offsets, or gradient depth.

## Shapes

Radius is rare: 2px on buttons/fields/chips; 0 elsewhere. Square node motif
2–16px in every chapter. Icons are hand-authored inline SVG, 1.5px stroke on
a 28px grid (service set: browser, phone, node-circuit, stack, pen, trend).
Infographics use hairline strokes with `pathLength=1` draw-on-scroll.

## Imagery

Real photography, served as optimized WebP through `next/image` (lazy,
sized, `object-cover`). Every photo wears the **duotone** treatment
(grayscale + contrast + slight dim) so it belongs to the document; hover
eases toward full color. Bands reveal with a clip-path wipe while the photo
settles from 1.12 scale; cinematic bands drift with capped parallax (pointer
devices only). Case-study placeholders pair representative imagery with
wireframe overlays and an "In preparation" tag — never presented as clients.

## Admin panel (operations surface)

The admin wears its own chapter (`.chapter-admin` in globals.css), pinned by
the client to the NextAdmin dashboard look: a cool-gray canvas (#f6f7f9)
with white 12px-radius cards and soft 1px shadows, light grouped sidebar
with icon tiles, expandable submenus, live count chips and an icon-rail
collapse; pill badges with soft tints; boxed 8px-radius inputs with an
accent focus ring; Manrope throughout (no serif in the console); vermilion
reserved for primary actions, active states and attention. The public
site's paper/ink/vermilion system is untouched — the console borrows only
the accent.

## Components

- **Wordmark** — the official SAVO logo (ported from v1): single-color
  currentColor lockup, `SavoLogo` in `shared/savo-logo.tsx`; paper contexts
  fill ink, ink contexts fill paper.
- **Navigation (v1 architecture)** — AI mega (AI Services + flagship
  feature), Services / Hire Resources / Industries dropdowns (10/6/10 links
  + feature cards + "All …" link), Case Study, Careers, Contact Us (opens
  the enquiry drawer). Panels are full-width ink bars under the header with
  mono titles, node-marked links (accent square on hover), PRO chips, square-node feature art. Hover
  opens with a 160ms grace timer; click opens; Esc / outside / hover-leave
  closes. Mobile: full-screen ink menu with numbered accordion sections.
  Future routes resolve to the designed 404 ("still in production").
- **Footer (v1 architecture)** — brand column (logo, v1 statement, socials)
  + Services / Industries / Company / Quick Links columns; global presence
  strip (India HQ, USA, GCC, UK, Australia) + Talk to us (email/phone/
  portal); callback form (country-aware phone validation → /api/callback);
  compliance badges + © + legal.
- **Buttons** — solid (ink→vermilion hover), outline, `link-underline` text
  links; 2.75–3.25rem; arrow nudges +3px.
- **Fields** — baseline hairlines, accent focus, error caption; native
  select popup.
- **Accordion rows** (services) — index / icon / title / rotating plus;
  `grid-template-rows 0fr→1fr` panels; native button semantics.
- **Enquiry drawer / mobile menu** — focus trap, Esc, scroll lock, `inert`
  when closed.
- **Motion system** — reveals (26px rise, 0.9s expo-out), image mask wipes,
  vector line-draws (`data-draw`), marquee (52s), pipeline signal dot,
  methodology scroll progress, hero canvas orbit. All disabled under
  `prefers-reduced-motion`; content visible by default.

## Do's and Don'ts

- Do keep chapters as the only background mechanism; never hard-code chapter
  colors into components.
- Do keep the serif for voice and the sans for interface; mono measures.
- Do hold photography in duotone until hover; don't scatter full-color
  photos across paper chapters.
- Do use the square node where a mark is needed; no circles, gradients,
  glows, or extra accent colors.
- Glass is allowed only on floating chrome over scrolling content — the
  scrolled header bar, nav mega-panels, the enquiry drawer, the assistant
  bar — always the chapter's own tokens at 80–90% opacity plus
  `backdrop-blur`. Never on paper-chapter cards or section grounds.
- Don't add eyebrows/kickers; the name rail is the only label instrument.
- Don't publish invented figures, quotes, clients, or claims — placeholders
  are the honest state until verified content arrives.
- Don't soften the vermilion moment; it is the page's single shout.

## Scoped case-study hero/cover override — reference-pinned 2026-10-10

Applies only to `project-hero.tsx` / `project-hero.module.css`, shared by
published detail records and explicitly labelled concept previews. It
supersedes earlier detail-hero/full-width-overview rules, not the listing,
global navigation, story, gallery, facts, features, reviews, close or footer.
The owner explicitly rejected an editorial rebrand and then selected Kunal
Chhajer’s Dribbble case-study composition (shot `23670874`).

- **Form:** one hero, not a header followed by a separate gray image strip.
  Information occupies 0.9fr and the real project cover 1.5fr, separated by
  64px (40px below 1180px) on the existing 1344px outer / 1280px inner rail.
  Name and supplied red industry lead; readable copy and its actions stay
  together. The owner removed the separate project logo and service-scope row;
  neither renders in the hero, even when a logo/services are available.
  No redundant year/team/platform strip duplicating the facts below.
- **Established identity:** retain Outfit500 headings and Inter reading/
  controls, white `#fff`, black `#000`, muted `#626262`, Savo red `#df2525`,
  hover `#b82222`, understated underline `#b0b0b0`, and `#111` media fallback.
  This local surface preserves full-colour supplied project imagery, not
  duotone: the uploaded work is the subject. Do not import the reference’s
  serif, cream field, coral circle, tablet/hands or invented metrics.
- **Type:** title `clamp(2.4rem,4.3vw,4rem)`, 1.1 leading, -0.03em tracking,
  natural balanced wrapping; 15px industry (14px phone); 17px introduction
  with 1.75 leading (16px phone); 13px back/scope, 14px action labels.
- **Media:** original filled 16:9 cover in the hero, no image/data migration.
  8px corners (6px phone); soft offset shadow `0 16px 36px` at 10% black
  (`0 8px 24px` at 8% on phones). Compressed, cacheable existing image source,
  intrinsic dimensions, eager/high fetch priority; no nonexistent srcsets.
- **Actions:** red 5px-radius “Explore Live Website” only for supplied safe
  http/https URLs; “Discuss a Similar Project” opens the existing enquiry
  modal with unchanged `case-study-hero` source. 44–48px targets and inherited
  red focus. Optional logo, industry, scope, introduction and cover omit
  cleanly; missing live URL never generates a placeholder button.
- **Reflow / motion:** at ≤1100px, identity → image → copy/actions, with
  native document scrolling. No-cover records avoid an empty grid row.
  The cover’s one 650ms clip reveal starts visible and runs only under
  `prefers-reduced-motion:no-preference`; no new animation dependencies.
- **Managed copy:** optional `introduction` in the existing authenticated
  editor is hero-only, with legacy `summary` fallback. Fresh Art Club’s
  47-word art introduction changes no original JSON fields, card/SEO
  summaries, uploads, publishing authority or existing listing order.

Evidence: `tmp/case-hero-focus/README.md`, final eight-width screenshots and
browser report (zero failed checks/page errors), preservation proofs,
typecheck/scoped ESLint, 1,129 tests in 62 files. Review performed inline;
no production deployment or physical-device verification. One detector scan
records 73 documentation advisories plus the inherited Outfit warning;
existing/pinned typography and colours are intentionally retained.

### Latest owner-pinned hero and section-tone refinement

- **Minimal hero:** title, supplied red industry, introduction/actions and
  original cover only. No separate project-logo image, “Project scope” label
  or service list. Preserve the underlying project assets and service data.
- **Black project-information chapter:** existing supplied facts in a full-width
  `#111` band. White heading/values, `#b0b0b0` labels, no divider lines
  (owner removed the grey rules);
  existing four-column desktop / two-column phone grid. Inner vertical padding
  44px desktop, 32px phone. Empty facts do not produce an empty band.
- **Light gallery chapter:** `#f7f7f7` background, black headings/status,
  `#626262` copy and inactive dots, white screenshot stages. Red active dots,
  red keyboard focus and appropriate light-theme arrow states. Complete 16:10
  screenshots and all gallery behaviour remain unchanged.

The latest tones supersede the earlier dark screenshot chapter, not any other
section or the global system. Evidence: `tmp/case-tone-refinement/`, eight-width
browser checks with no failures/page errors, desktop/phone visual review inline,
typecheck/scoped lint and 1,129 tests. No managed-content/database writes in this
refinement; no production deployment. One detector scan: 68 documentation
advisories, the inherited Outfit warning, no severity-error findings.
