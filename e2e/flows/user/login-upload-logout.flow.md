# Login, Upload and Logout Flow

## Overview
The user logs in with email and password, uploads one or two skin images for AI-based dermatology analysis, reviews the prediction result, and then logs out. This is the primary end-to-end user journey for DermaVision.

## Pre-conditions
- The frontend dev server is running at `http://localhost:5173`
- The `/token` and `/predict` backend endpoints are reachable (or mocked in tests)
- A valid user account exists (or mocks are in place)

## User Journey

1. **Navigate to /login** — app redirects unauthenticated users here automatically
2. **Enter email** in the `exemple@email.com` input field
3. **Enter password** in the `••••••••` password field
4. **Click the submit button** ("Se Connecter") — triggers POST to `/token` with form-encoded credentials
5. **Land on dashboard** (`/`) — authenticated users see the image upload area
6. **Upload a skin image** by clicking the upload zone or dragging a file (PNG/JPG/GIF)
7. **Click "Lancer l'Analyse"** — triggers POST to `/predict` with the image
8. **View prediction result** — label (e.g., "Bénin" or "Malin"), confidence bar, and advisory text
9. **Clear the image** using the × button in the preview
10. **Upload a second image** and analyze it (optional, tested in recording)
11. **Clear the second image**
12. **Click "Déconnexion"** in the top-right — clears token, navigates to `/login`

## Key Assertions

| Step | Assertion | What it verifies |
|------|-----------|-----------------|
| Login page load | heading "Connexion" visible | Page renders correctly |
| After submit | URL is `/` | Auth succeeded and redirect happened |
| After file select | `img[alt="Preview"]` visible | File was accepted by the component |
| After analysis | "Bénin" (or label) visible | `/predict` mock returns correct payload |
| After clear | "Cliquez pour upload" visible | ImageUpload resets to empty state |
| After logout | URL is `/login` | Token cleared and redirect executed |

## Known Issues

- **Regression (commit 4fa1cd5):** Login button text was changed from `Se Connecter` to `Connexion`. The E2E test uses `Se Connecter` and will fail until reverted.
- **Auth race condition (fixed):** `AuthContext` originally initialized `user` as `null` even when a valid token was in `localStorage`, causing `ProtectedRoute` to redirect on every fresh page load. Fixed by synchronously decoding the stored token in the `useState` initializer and also calling `setUser` immediately in the `login()` function.

## Related Flows

- `e2e/flows/user/register.flow.md` (not yet created) — user registration before first login
