# API and Data Models

## Principles
- RESTful JSON APIs; GraphQL optional for client efficiency
- Clear separation: Auth, Boards, Stickers, Map, Billing, Analytics
- Use TDD: write API contract tests first

## Key endpoints (examples)
- POST /api/v1/auth/signup - create user
- POST /api/v1/auth/login - login
- POST /api/v1/boards - create board
- GET /api/v1/boards/:id - get board (respect ACL)
- PUT /api/v1/boards/:id - update board (ACL)
- POST /api/v1/boards/:id/stickers - add sticker
- PUT /api/v1/boards/:id/save - save/publish board
- GET /api/v1/map/pins?bbox=&city=&country= - fetch pins (public only)
- POST /api/v1/boards/:id/invite - invite editor (premium)
- POST /api/v1/payments/checkout - create payment session
- GET /api/v1/analytics/boards/:id - board analytics (owner/premium)

## Board model
{
  "id": "uuid",
  "owner_id": "uuid",
  "title": "string",
  "description": "string",
  "visibility": "public|private|unlisted",
  "location": {
    "type": "city|country",
    "name": "string",
    "geo": { "lat": 0.0, "lng": 0.0 }
  },
  "is_published": true,
  "created_at": "iso",
  "updated_at": "iso",
  "version": 3,
  "premium_features": { "crayon_enabled": false, "collab_enabled": false }
}

## Sticker model
{
  "id": "uuid",
  "board_id": "uuid",
  "type": "note|image|emoji|shape",
  "content": "string",
  "position": { "x": 0.5, "y": 0.5 },
  "style": { "color": "#f0c", "rotation": 0, "size": "small|medium|large" },
  "created_by": "uuid",
  "created_at": "iso"
}

## ACL model
- Roles: owner, editor, viewer
- Invite tokens: time-limited, optionally paywalled
- Audit logs for edits

## Map pin model
{
  "id": "uuid",
  "board_id": "uuid",
  "location_type": "city|country",
  "location_name": "string",
  "centroid": { "lat": 0.0, "lng": 0.0 },
  "published_at": "iso"
}

## Geocoding and privacy
- Use a geocoding service to map user input to city/country centroid.
- On publish, reduce precision to centroid and store only city/country name + centroid.
- If user selects "country" only, store country centroid.

## Notes for implementers
- Use Postgres with PostGIS for geo queries.
- Use Redis for session and real-time collaboration state.
- Use S3-compatible storage for images and exports.
