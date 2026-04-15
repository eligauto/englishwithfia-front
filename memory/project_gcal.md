---
name: Google Calendar integration
description: OAuth flow details, sessionStorage flag for return detection, 204 DELETE handling
type: project
---

Google Calendar integration added to SettingsPage (2026-04-12).

**Endpoints:** `GET /google-calendar/status`, `GET /google-calendar/connect`, `DELETE /google-calendar/connect` (204 No Content).

**Why:** DELETE returns 204 with no body — `apiFetch` would break trying to parse JSON, so `disconnectGoogleCalendar` uses raw `fetch` directly (same pattern as `downloadCsv`).

**How to apply:** Any future 204-returning DELETE endpoint needs raw fetch instead of `apiFetch`.

**OAuth return detection:** Before redirecting to `authUrl`, set `sessionStorage.setItem('gcal_connecting', '1')`. On SettingsPage mount, check this flag — if present and no `?error=google_auth_failed` in URL, show success toast and clear the flag. This avoids needing a known callback query param from the backend.
