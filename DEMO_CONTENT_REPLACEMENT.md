# DEMO CONTENT REPLACEMENT — Master Table

Every demo value in savo.v6, where it renders, and what Savo must supply before production.

**Mode:** staging runs `NEXT_PUBLIC_CONTENT_MODE=demo` (default). Production launch requires
`NEXT_PUBLIC_CONTENT_MODE=production` — demo rows below then suppress automatically.

| # | Field | Demo Value | Used In | Final Value Required |
|---|---|---|---|---|
| 1 | Projects Delivered | 120+ | Homepage metrics · About facts | ______ (verified count) |
| 2 | Clients Supported | 45+ | Homepage metrics · About facts | ______ |
| 3 | Industries Served | 12+ | Homepage metrics · About facts | ______ |
| 4 | Markets Reached | 8+ | Homepage metrics · About facts | ______ |
| 5 | Team size (if design needs) | 25+ Technology Professionals | reserved (`DEMO_TEAM_SIZE`, unused) | ______ |
| 6 | Years of experience (if design needs) | 10+ Years | reserved (`DEMO_YEARS_EXPERIENCE`, unused) | founding/incorporation date + which date is public history |
| 7 | Case study 1 | Meridian Commerce — Ecommerce · +42% / −31% / 2.4× | Homepage selected work · /case-studies web board | Real project + client approval (`publicationPermission`) |
| 8 | Case study 2 | NovaFlow — SaaS/AI · 38% / 2.1× / 24/7 | Homepage selected work · /case-studies ai board | Real project + approvals |
| 9 | Case study 3 | Aster Health — Healthcare mobile · 4.7/5 / 46% / 32% | Homepage selected work · /case-studies mobile board | Real project + approvals |
| 10 | Case study 4 | Northstar Logistics — Logistics · 34% / 28% / 99.9% | /case-studies software board | Real project + approvals |
| 11 | Testimonial | "Client testimonial preview" block + Client Name / Role · Company | Homepage selected work (staging) | Approved client quote, name, role (or keep suppressed) |
| 12 | Fictional client brands | Meridian, NovaFlow, Aster, Northstar, Lumio, Orbit | reserved (`DEMO_CLIENTS`, unused) | Real client logo permissions (or keep unused) |
| 13 | Switzerland presence | "European Market" + §12 description | Contact offices · footer · About presence (staging) | Confirm presence type: physical office (address) or market |
| 14 | Saudi Arabia & GCC presence | "Middle East Market" + description | same | Confirm type |
| 15 | Australia presence | "APAC Market" + description | same | Confirm type |
| 16 | United Kingdom presence | "UK Market" + description | same | Confirm type |
| 17 | United States presence | "North American Market" + description | same | Confirm type |
| 18 | Contact team roster | 6 invented members (Aarav Mehta, Priya Nair, Rohan Desai, Sara Khan, Vikram Rao, Ananya Iyer) + portraits | Contact page team (staging) | Real team: names, roles, bios, photos, LinkedIn URLs |
| 19 | Leadership roster | 4 invented members + portraits | About leadership (staging) | Real leadership + approvals |
| 20 | Company milestones | 2016 Jaipur → 2026 "forty people" timeline | About story (staging) | Verified timeline (dates + events) |
| 21 | Founding year | 2016 (currently treated as real) | Site statement · About · JSON-LD `foundingDate` | Confirm incorporation date + which date to publicize |
| 22 | Trust strip | Capability labels (not certifications) | Footer | Real certifications only, when held |
| 23 | HQ street address & postal code | null (city-level only) | Schema `PostalAddress`, contact | Verified street + postal code |
| 24 | Social profiles | Platform homepage placeholders | Footer (not in schema `sameAs`) | Real profile URLs |
| 25 | Registration IDs | null | reserved (CIN/GST slots) | Verified CIN/GST if publicized |

## Replacement procedure per row

1. **Statistics (1–6):** Savo supplies verified figures → replace in `src/content/demo/company.ts`
   by changing the records to `status: "verified"` (or move them into the constants/admin
   company config) → production build renders them; demo gate passes them through.
2. **Case studies (7–10):** create the real entry via the admin (`/admin/content/case-studies`)
   with lifecycle **published**, or in constants with `status: "verified"`. The demo overlay
   in `src/constants/case-studies.ts` keys off `IS_DEMO` and disappears in production regardless.
3. **Testimonial (11):** supply approved quote → move into selected-work as verified content.
4. **Presence (13–17):** confirm type per region → physical offices get verified addresses
   (never invented); markets keep the §12 wording with `status: "verified"` once confirmed.
5. **People (18–19):** supply real roster → replace seeds, flip to verified.
6. **Timeline (20–21):** supply verified history → replace milestone seeds, flip to verified.

Until a row is replaced, production simply suppresses it — nothing invented can leak.
