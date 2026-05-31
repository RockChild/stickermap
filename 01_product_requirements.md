# Product Requirements

## Vision
Make sticky notes delightful and social: a simple, cute, mapвЂ‘first app where anyone can create a board, add stickers, save it to appear on a city/country map, and optionally sell edit access or enable premium drawing tools.

## Core user flows
1. Create board
   - User taps "New board"
   - System pre-fills a friendly dummy name (editable)
   - User adds at least one sticker
   - User saves board
   - If visibility=public and board has в‰Ґ1 sticker and saved в†’ board appears on map at city/country level
   - If visibility=private в†’ map shows only a pin with no title/preview

2. View board from map
   - Public board: map shows title and preview; open in read-only mode unless edit grant exists
   - Private board: map shows anonymous pin; only owner or invited editors can open

3. Share and access control
   - Owner can invite editors by email or share a paid access link
   - Granting edit access is a premium feature (subscription or per-board payment)
   - Public read access is free (unless owner chooses paywall for viewers)

4. Crayon drawing
   - Basic free pen (single color, single width)
   - Premium: multiple brushes, layers, pressure simulation, undo history, export PNG/SVG

## Map behavior and privacy
- Map is political/administrative view (countries, regions, cities). No satellite or terrain detail.
- Published pin location is reduced to city centroid or country centroid (owner chooses city or country).
- No precise coordinates stored or displayed unless user explicitly opts in (and consents).
- Private boards show only a generic pin; no metadata visible.

## Premium features
- Paid editing: invite editors; pay-per-editor or subscription.
- Crayon suite: advanced brushes, layers, export, collaborative drawing.
- Board analytics: views, saves, paid conversions.
- Version history & restore

## Non-functional requirements
- Mobile-first PWA, responsive web
- Offline-first for board editing; sync on reconnect
- GDPR and privacy compliant; location precision reduction
- Scalable: support millions of pins with geo-indexing
- Secure: role-based access control, audit logs

## Acceptance criteria
- Creating and saving a board with в‰Ґ1 sticker and visibility=public creates a map pin at city/country level.
- Private boards appear as anonymous pins with no title/preview.
- Only owners or granted editors can modify a board.
- Premium gating prevents non-subscribers from granting edit access or using premium crayon features.
