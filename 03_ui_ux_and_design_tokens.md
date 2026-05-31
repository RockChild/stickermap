# UI and UX Guidance

## Design goals
- Playful and simple: two visual modes вЂ” Minimal and Cute.
- Mobile-first: single-column board editor, bottom toolbar for stickers and crayon.
- Map-first discovery: map view with clustered pins; tap to open board preview.

## Key screens
1. Map screen
   - Top search (city/country)
   - Pin clusters; zoom reveals city pins
   - Public pins show title + small preview card
   - Private pins show anonymous dot; tap prompts auth or request access

2. Board editor
   - Canvas with grid background
   - Left: sticker palette; Right: layers & history (premium)
   - Bottom: save/publish button; visibility toggle; invite button (premium)
   - Crayon toggle (free/basic vs premium advanced)

3. Board preview
   - Read-only view for public boards
   - CTA to request edit access or purchase

## Interaction patterns
- Save to publish: changes are local until user taps Save. On Save, run validation: must have в‰Ґ1 sticker to publish.
- Offline editing: local storage; sync on reconnect; conflict resolution: last-writer-wins with version history.
- Invite flow: owner enters email в†’ system creates invite token в†’ if invitee pays (if required) or accepts, role assigned.

## Design tokens
- Primary palette: pastel colors for cute mode; neutral for minimal mode
- Typography: rounded friendly font for cute; system font for minimal
- Microinteractions: sticker drop bounce, crayon stroke wobble, save confetti for cute mode

## Accessibility
- High contrast mode
- Keyboard navigation for web
- Screen reader labels for stickers and controls

## Experimentation guidance
- Ship two UI variants: Minimal and Cute.
- Run A/B tests on onboarding completion, publish rate, and premium conversion.
