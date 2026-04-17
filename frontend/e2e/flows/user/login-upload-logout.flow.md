# Flow: Login → Upload → Analysis → Logout

## Overview
A user logs in with email/password credentials, uploads a skin image for dermatological analysis, removes and re-uploads to verify the reset behaviour, then logs out.

## Pre-conditions
- The app is running at `http://localhost:5173`
- A valid user account exists (`yboufangha@outlook.fr`)
- The `/token` auth endpoint and `/predict` analysis endpoint are reachable (mocked in tests)

## Steps

1. **Navigate to /login** — The page shows the "Connexion" heading with email and password fields.
2. **Fill email** — Enter `yboufangha@outlook.fr` in the email placeholder input.
3. **Fill password** — Enter password in `input[type="password"]`.
4. **Click "Se Connecter"** — The form is submitted; the user is redirected to `/`.
5. **Upload skin image** — The hidden file input accepts a PNG; an image preview appears.
6. **Click "Lancer l'Analyse"** — The app POSTs to `/predict`; the analysis result is displayed.
7. **Remove the image** — Clicking the close/remove button (SVG icon) resets the upload area back to the drop zone text.
8. **Upload a second image** — A new file is selected; preview appears again.
9. **Launch analysis again** — A second `/predict` call is made and results are shown.
10. **Click "Déconnexion"** — The user is logged out and redirected to `/login`.

## Key Assertions

| Step | Assertion |
|------|-----------|
| Login page loaded | `getByRole('heading', { name: 'Connexion' })` is visible |
| Email filled | Input has value `yboufangha@outlook.fr` |
| After login | URL is `/`, "Lancer l'Analyse" button is visible |
| After upload | `img[alt="Preview"]` is visible |
| After remove | "Cliquez pour upload ou glissez-déposez" text is visible |
| After logout | URL matches `/login`, "Connexion" heading is visible |

## Related Flows
- (none yet)
