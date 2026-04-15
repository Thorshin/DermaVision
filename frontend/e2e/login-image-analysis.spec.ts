import { test, expect } from '@playwright/test';

// A minimal 1×1 transparent PNG encoded in base64
const DUMMY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Build a structurally-valid JWT (jwtDecode only checks structure, not signature)
function buildMockToken(email: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({ sub: email, exp: 9_999_999_999 })
  ).toString('base64url');
  return `${header}.${payload}.mock-signature`;
}

test.describe('DermaVision – login and image analysis @critical', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept the FastAPI auth endpoint so tests run without a live backend
    await page.route('**/token', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: buildMockToken('yboufangha@outlook.fr'),
        }),
      });
    });

    // Intercept the prediction endpoint
    await page.route('**/predict', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          prediction: 'Melanocytic nevi',
          confidence: 0.92,
        }),
      });
    });
  });

  // ── Test 1: Login ──────────────────────────────────────────────────────────
  test('should login with valid credentials and reach the dashboard', async ({ page }) => {
    await test.step('Navigate to login page', async () => {
      await page.goto('/login');
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
    });

    await test.step('Fill email and password', async () => {
      await page.getByPlaceholder('exemple@email.com').fill('yboufangha@outlook.fr');
      await expect(page.getByPlaceholder('exemple@email.com')).toHaveValue(
        'yboufangha@outlook.fr'
      );

      await page.locator('input[type="password"]').fill('yahya1234');
    });

    await test.step('Submit the login form', async () => {
      await page.getByRole('button', { name: 'Se Connecter' }).click();
      await expect(page).toHaveURL('/');
      await expect(page.getByRole('button', { name: "Lancer l'Analyse" })).toBeVisible();
    });
  });

  // ── Test 2: Upload image and launch analysis ───────────────────────────────
  test('should upload a skin image and launch the analysis', async ({ page }) => {
    await test.step('Login', async () => {
      await page.goto('/login');
      await page.getByPlaceholder('exemple@email.com').fill('yboufangha@outlook.fr');
      await page.locator('input[type="password"]').fill('yahya1234');
      await page.getByRole('button', { name: 'Se Connecter' }).click();
      await expect(page).toHaveURL('/');
    });

    await test.step('Upload a skin image via the file input', async () => {
      await page.locator('input[type="file"]').setInputFiles({
        name: 'test-skin.png',
        mimeType: 'image/png',
        buffer: Buffer.from(DUMMY_PNG_BASE64, 'base64'),
      });
      // The upload zone is replaced by an image preview
      await expect(page.locator('img[alt="Preview"]')).toBeVisible();
    });

    await test.step('Launch the skin analysis', async () => {
      const analyseButton = page.getByRole('button', { name: "Lancer l'Analyse" });
      await expect(analyseButton).toBeEnabled();
      // Set up response listener before clicking so we don't miss it
      const predictResponse = page.waitForResponse('**/predict');
      await analyseButton.click();
      await predictResponse;
      // After the response resolves the button should be re-enabled
      await expect(analyseButton).toBeEnabled();
    });
  });

  // ── Test 3: Logout ─────────────────────────────────────────────────────────
  test('should logout and redirect to the login page', async ({ page }) => {
    await test.step('Login', async () => {
      await page.goto('/login');
      await page.getByPlaceholder('exemple@email.com').fill('yboufangha@outlook.fr');
      await page.locator('input[type="password"]').fill('yahya1234');
      await page.getByRole('button', { name: 'Se Connecter' }).click();
      await expect(page).toHaveURL('/');
    });

    await test.step('Click the logout button', async () => {
      await page.getByRole('button', { name: 'Déconnexion' }).click();
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
    });
  });
});
