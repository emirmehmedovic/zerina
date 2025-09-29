# API Error Responses (Standardized)

All API errors return a JSON object in the following shape:

```
{
  "error": string,            // human-readable short error
  "code"?: string,            // stable machine code (UPPER_SNAKE_CASE)
  "details"?: object,         // optional structured info (e.g. Zod validation errors)
  "retryAfterSeconds"?: number // optional; used by rate/lock endpoints
}
```

## Common Error Codes

- UNAUTHENTICATED — request requires a valid session cookie
- FORBIDDEN — authenticated, but not allowed to access this resource
- INVALID_BODY — invalid request body (Zod validation failed)
- INVALID_TOKEN — token provided is invalid/expired (e.g., password reset)
- INVALID_CREDENTIALS — login failed (wrong email/password)
- ACCOUNT_LOCKED — temporary lock after repeated failed logins
- EMAIL_IN_USE — email already exists (register/admin-create)
- NOT_FOUND — requested entity does not exist
- CSRF_FORBIDDEN — CSRF token missing/invalid
- UNSUPPORTED_MIME — upload file type is not allowed

## Endpoints and Error Shapes

### Auth
- POST /api/v1/auth/register
  - 400 INVALID_BODY (details: Zod)
  - 409 EMAIL_IN_USE
- POST /api/v1/auth/login
  - 400 INVALID_BODY (details: Zod)
  - 401 INVALID_CREDENTIALS
  - 429 ACCOUNT_LOCKED (retryAfterSeconds)
- POST /api/v1/auth/logout
  - 200 { ok: true }
- POST /api/v1/auth/forgot
  - 400 INVALID_BODY (details: Zod)
  - 200 { ok: true } (no user enumeration)
- POST /api/v1/auth/reset
  - 400 INVALID_BODY (details: Zod)
  - 400 INVALID_TOKEN
  - 404 NOT_FOUND
- GET /api/v1/auth/csrf
  - 200 { csrfToken }

### Products
- POST /api/v1/products
  - 404 NOT_FOUND (Shop not found)
  - 400 INVALID_BODY (details: Zod)
- PATCH /api/v1/products/:id
  - 404 NOT_FOUND (Shop or Product missing/not owned)
  - 400 INVALID_BODY (details: Zod)
- DELETE /api/v1/products/:id
  - 404 NOT_FOUND (Shop or Product missing/not owned)
- GET /api/v1/products/slug/:slug and /:slug, /id/:id
  - 404 NOT_FOUND

### Shops
- POST /api/v1/shops (VENDOR)
  - 400 INVALID_BODY (details: Zod)
  - 409 shop_exists (may be standardized later to SHOP_EXISTS)
- PATCH /api/v1/shops/:id
  - 400 INVALID_BODY (details: Zod)
  - 403 FORBIDDEN (owner/admin)
  - 404 NOT_FOUND
- PATCH /api/v1/shops/:id/status (ADMIN)
  - 400 INVALID_BODY (details: Zod)
  - 404 NOT_FOUND

### Vendor Orders
- GET /api/v1/vendor/orders
  - 200 with items/total; filters via status/from/to/q
- PATCH /api/v1/vendor/orders/:id/status
  - 403 FORBIDDEN (not owner)
  - 404 NOT_FOUND (order not in shop)
  - 400 INVALID_BODY (details: Zod)

### Uploads
- POST /api/v1/uploads
  - 400 no_file
  - 400 unsupported_mime (UNSUPPORTED_MIME)
  - 413 Payload too large (multer fileSize limit)

## Notes
- CSRF is enforced on non-GET routes, excluding /api/v1/auth and /api/v1/dev. Missing or mismatched token → 403 CSRF_FORBIDDEN.
- CORS allows X-CSRF-Token header; cookies must be sent with credentials: true from web.
