# Leadership card artwork

Updated: 29 September 2026.

The four leadership cards use isolated, weathered corporate cyberpunk props generated with the built-in imagegen tool. Their rarity colours are intentionally varied: Team Lead rare, Coaching epic, Team Growth legendary, and Stakeholders uncommon. The management summary line was removed at the owner's request. Other skill categories retain their existing artwork and rarity choices.

The PNG originals are saved under `static/assets/leadership/`; the normal build generates responsive PNG, WebP, and AVIF variants. The card image service selects these variants. Alpha transparency is preserved. Leadership entries set `artwork: true`, which reduces the inset padding in their image windows so the illustrations remain legible on mobile.

## Prompts

The first image established the material reference for the other three. Each prompt below is the full prompt used for that asset. The follow-on images used `team-lead.png` as a material/style reference.

### team-lead.png

```text
Use case: stylized-concept. Asset type: a small square image inside a handmade trading card on a software engineer's personal website. Create a tactile object from a gritty corporate cyberpunk universe, still restrained and professional. Style: art-directed industrial product photography / detailed sculptural game prop, harsh angular geometry, machined gunmetal, oxidized steel, scratched edges, stamped relief, worn brushed surfaces. Charcoal and steel with muted cyan/teal circuitry and the specified small accent. A strong simple silhouette and close crop, legible at 64 pixels; subject fills 85 percent of a square canvas. Studio side lighting with crisp highlights and deep but readable shadows. Genuinely transparent background, no environment or rectangular backdrop. Keep all edges inside the canvas. No lettering, numbers, corporate logos, people portraits, weapons, cute cartoons, flat vector icons, candy neon, rainbow, ornate heraldry, or generic sci-fi UI. One coherent object or compact sculptural composition.
Subject: a weathered corporate personnel rank insignia, one larger angular executive node above three smaller personnel emblems joined by a thick engraved organizational circuit. A compact physical badge of leadership rather than a military crest. Restrained cyan accent.
```

### coaching.png

```text
Use case: stylized-concept. Asset type: a small square image inside a handmade trading card on a software engineer's personal website. Create a tactile object from a gritty corporate cyberpunk universe, still restrained and professional. Style: art-directed industrial product photography / detailed sculptural game prop, harsh angular geometry, machined gunmetal, oxidized steel, scratched edges, stamped relief, worn brushed surfaces. Charcoal and steel with muted cyan/teal circuitry and the specified small accent. A strong simple silhouette and close crop, legible at 64 pixels; subject fills 85 percent of a square canvas. Studio side lighting with crisp highlights and deep but readable shadows. Genuinely transparent background, no environment or rectangular backdrop. Keep all edges inside the canvas. No lettering, numbers, corporate logos, people portraits, weapons, cute cartoons, flat vector icons, candy neon, rainbow, ornate heraldry, or generic sci-fi UI. One coherent object or compact sculptural composition.
Subject: a mentor's angular cybernetic hand carefully handing a single small luminous rectangular data shard to a second smaller reaching hand. A compact sculptural relief of knowledge transfer, not a handshake. Restrained muted violet and cyan accents.
Input image: style/material reference only. Create the new subject above, matching the reference's worn metal surface quality, harsh professional corporate art direction and restrained circuit accents. Do not copy its organizational shape.
```

### team-growth.png

```text
Use case: stylized-concept. Asset type: a small square image inside a handmade trading card on a software engineer's personal website. Create a tactile object from a gritty corporate cyberpunk universe, still restrained and professional. Style: art-directed industrial product photography / detailed sculptural game prop, harsh angular geometry, machined gunmetal, oxidized steel, scratched edges, stamped relief, worn brushed surfaces. Charcoal and steel with muted cyan/teal circuitry and the specified small accent. A strong simple silhouette and close crop, legible at 64 pixels; subject fills 85 percent of a square canvas. Studio side lighting with crisp highlights and deep but readable shadows. Genuinely transparent background, no environment or rectangular backdrop. Keep all edges inside the canvas. No lettering, numbers, corporate logos, people portraits, weapons, cute cartoons, flat vector icons, candy neon, rainbow, ornate heraldry, or generic sci-fi UI. One coherent object or compact sculptural composition.
Subject: three abstract corporate personnel silhouettes sculpted from metal, integrated into one chunky ascending circuit spine, each supported by the same structure. A collective team development insignia. Clear rising rhythm, no generic chart axes. Restrained amber detail and cyan circuitry.
Input image: style/material reference only. Create the new subject above, matching the reference's worn metal surface quality, harsh professional corporate art direction and restrained circuit accents. Do not copy its organizational shape.
```

### stakeholders.png

```text
Use case: stylized-concept. Asset type: a small square image inside a handmade trading card on a software engineer's personal website. Create a tactile object from a gritty corporate cyberpunk universe, still restrained and professional. Style: art-directed industrial product photography / detailed sculptural game prop, harsh angular geometry, machined gunmetal, oxidized steel, scratched edges, stamped relief, worn brushed surfaces. Charcoal and steel with muted cyan/teal circuitry and the specified small accent. A strong simple silhouette and close crop, legible at 64 pixels; subject fills 85 percent of a square canvas. Studio side lighting with crisp highlights and deep but readable shadows. Genuinely transparent background, no environment or rectangular backdrop. Keep all edges inside the canvas. No lettering, numbers, corporate logos, people portraits, weapons, cute cartoons, flat vector icons, candy neon, rainbow, ornate heraldry, or generic sci-fi UI. One coherent object or compact sculptural composition.
Subject: close-up of a firm professional handshake, one human hand with a sharply tailored charcoal corporate cuff and one machined prosthetic hand, incorporated into a compact angular metal contract insignia. Mutual agreement and stakeholder relationships. Restrained muted green and cyan accents.
Input image: style/material reference only. Create the new subject above, matching the reference's worn metal surface quality, harsh professional corporate art direction and restrained circuit accents. Do not copy its organizational shape.
```
