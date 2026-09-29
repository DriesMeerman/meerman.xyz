# Meerman Industries website requirements

Researched: 29 September 2026.

## Intended page

`/industries` is a company profile with a contact link on the existing personal portfolio. It does not accept orders or bookings.

This is a sensible location because the portfolio already presents Dries Meerman's software engineering work. A separate company domain is not identified as a requirement in the official website guidance. Using the existing domain is a design recommendation, not a legal conclusion about every possible future business activity.

Use the skills page and handmade trading cards as the visual reference: Bruno Ace headings, cyan/teal accents, translucent gradient surfaces, inset details, and subtle cyberpunk styling. Business disclosures should be readable without flipping a card or using JavaScript. Support the site's light and dark themes and small screens.

The page is implemented without a header entry, added to `siteConfig.staticPages` in `tools/lib/config.ts`, and included in the regenerated `static/sitemap.xml`. A small link beneath the homepage social links provides a usable navigation path for visitors.

## Business identity and contact information

[RVO's rules for business correspondence](https://business.gov.nl/regulations/rules-business-correspondence/) include websites in business correspondence and require the trade name and KVK number. Its website section calls for clear identity information in a logical place, physical address details subject to its stated exception for a shielded visiting address, and contact details such as email plus a telephone number or chat option.

The [Dutch version](https://ondernemersplein.overheid.nl/wetten-en-regels/regels-voor-bedrijfscorrespondentie/) specifically lists email and telephone. Do not describe email alone as sufficient in all circumstances. Confirm the intended public contact details before treating the page as complete.

For this sole proprietorship, present the trade name, proprietor identity, KVK number, registered business address as applicable, and business contact details. A sole proprietorship has no deed of incorporation or separate BV statutory seat to reproduce. The legal form and establishment number are useful context; the cited guidance does not identify the establishment number as a general website disclosure requirement.

Business details displayed on the page:

| Field | Supplied value |
| --- | --- |
| Trade name | Meerman Industries |
| Business activity | Het ontwikkelen van software. |
| KVK number | 42174874 |
| Legal form | Eenmanszaak |
| Establishment | Hoofdvestiging |
| Establishment number | 000066808715 |

Maintain these details in `src/lib/data/companyData.js`. A visiting address is not stored in the repository. The page identifies the proprietor as Dries Meerman.

## VAT identification number

RVO and [KVK's VAT number guidance](https://www.kvk.nl/starten/alles-wat-je-moet-weten-over-het-btw-nummer/) say to display the VAT identification number when selling products or providing services online. A profile with a contact link does not establish every aspect of how the business operates. Confirm the VAT status and include a supplied public btw-id where applicable; do not invent a number or claim comprehensive compliance while a required identifier is missing.

The public identifier is the **btw-id**, not the **omzetbelastingnummer / ob-nummer** used with the Tax Administration. KVK explains that the ob-nummer for a sole proprietor contains the BSN and should not be published.

`src/lib/data/companyData.js` contains a nullable `vatId` field; the page renders the VAT row only when a real public identifier is supplied.

## Contact implementation

The business email is shown in a PNG collage of torn magazine and advertisement clippings from a cyberpunk setting, created using the built-in imagegen tool and saved at `static/assets/industries-contact.png`. The artwork uses printed paper textures, the site's cyan/teal/charcoal palette, and two lines for legibility on mobile. The published image contains no selectable text or email metadata.

Generation prompt summary: preserve the supplied lowercase email exactly; arrange it across two lines; use irregular scissor-cut and torn paper clippings from futuristic magazines and ads, varied printed headline typography, paper fibers, misregistered offset printing, halftones, and small circuit/ad fragments; use cyan, teal, steel blue, off-white, and charcoal with transparent surroundings; keep the main glyphs readable at small sizes; avoid uniform tiles, rainbow colours, neon glow, extra primary text, logos, and incorrect characters. The previous email graphic was the edit target and the dark-theme page screenshot was the palette reference.

The page decodes character codes only when a visitor activates the image or the reveal button. It then exposes a selectable address and normal mail link. The controls work with a keyboard and announce the revealed address to assistive technology. Without JavaScript, sighted visitors can read the image and type the address manually. The initial HTML, metadata, and image alt text contain no plain email or mailto link. This deters basic harvesting but does not prevent OCR or JavaScript-aware scraping. The business contact is intentionally public; this mechanism does not protect secrets.

The optional `company.phone` field defaults to null, which hides the telephone row. Assess the guidance's additional direct-contact requirement before considering disclosure complete; an image and email reveal do not replace a phone or chat channel.

## Privacy and cookies

[KVK's business website guidance](https://business.gov.nl/starting-your-business/first-steps/creating-a-business-website/) covers identity disclosures, privacy information, cookies, and additional requirements for online sales. [The Dutch Data Protection Authority](https://autoriteitpersoonsgegevens.nl/nl/zelf-doen/gebruik-uw-privacyrechten/recht-op-informatie) explains the duty to give clear information before collecting personal data.

The repository currently loads Tinylytics sitewide in `src/app.html`, stores the theme preference in local storage, and has no privacy page in `src/routes`. A company contact link also leads to personal data processing when someone sends an email. Before drafting a privacy notice, establish the controller, email provider, purposes, legal bases, retention practices, recipients, and relevant hosting/logging arrangements rather than inventing them.

[Tinylytics' own visitor-data documentation](https://tinylytics.app/docs/trust/privacy) says it does not use visitor cookies and describes temporary IP processing and rotating hashes. This is provider documentation, not an independent legal compliance assessment. Adding a company page does not itself create a reason to add a cookie consent banner. Evaluate consent requirements against the actual technologies and configuration.

## Future scope

If the site later offers consumer purchases, bookings, or contracts, reassess pre-contract information, pricing, cancellation rights and applicable exceptions, ordering, delivery, complaints, and accessibility rules. A company profile should not introduce speculative checkout policies or invented terms.

## Remaining legal follow-ups

- Insert the public btw-id once issued, where applicable.
- Resolve the additional public telephone/chat contact requirement.
- Establish the operational facts needed for an accurate privacy notice; no privacy notice or complete-compliance claim has been added.

## Implementation tooling

The project instructions require Svelte MCP documentation discovery and autofixing for Svelte changes. No Svelte MCP tools or documentation resources were exposed in the current session when tools and resources were inspected. Implementation used [official Svelte documentation](https://svelte.dev/docs/svelte/scoped-styles) and local compiler checks instead; this is a tooling limitation, not an MCP autofixer pass.

Validation: production build succeeded and emitted `build/industries.html`; both changed Svelte components compiled with zero warnings. Browser checks covered light/dark themes at 320, 390, 768, and 1280 pixels with no horizontal overflow, hidden address/VAT fields, no initial mailto links, and correct email reveal. The repository-wide `npm run check` reports 70 errors and one warning in existing files outside this change. The existing Tinylytics embed returned a third-party 404 during the browser preview; analytics configuration was not changed.
