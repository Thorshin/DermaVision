import { test, expect } from '@playwright/test';

// Minimal 1×1 transparent PNG — avoids needing real image files in CI
const DUMMY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// jwt-decode only checks structure, not signature — mock token satisfies it
function buildMockToken(email: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({ sub: email, exp: 9_999_999_999 })
  ).toString('base64url');
  return `${header}.${payload}.mock-signature`;
}

test.describe('DermaVision – login, upload and logout @critical', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.route('**/token', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: buildMockToken('yboufangha@outlook.fr'),
        }),
      });
    });

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

    await test.step('Submit login form', async () => {
      await page.getByRole('button', { name: 'Se Connecter' }).click();
      await expect(page).toHaveURL('/');
      await expect(page.getByRole('button', { name: "Lancer l'Analyse" })).toBeVisible();
    });
  });

  test('should upload a skin image, launch analysis, remove it and re-upload', async ({ page }) => {
    await test.step('Login', async () => {
      await page.goto('/login');
      await page.getByPlaceholder('exemple@email.com').fill('yboufangha@outlook.fr');
      await page.locator('input[type="password"]').fill('yahya1234');
      await page.getByRole('button', { name: 'Se Connecter' }).click();
      await expect(page).toHaveURL('/');
    });

    await test.step('Upload first skin image', async () => {
      await page.locator('input[type="file"]').setInputFiles({
        name: 'skin-image-1.png',
        mimeType: 'image/png',
        buffer: Buffer.from(DUMMY_PNG_BASE64, 'base64'),
      });
      await expect(page.locator('img[alt="Preview"]')).toBeVisible();
    });

    await test.step('Launch first analysis', async () => {
      const analyseButton = page.getByRole('button', { name: "Lancer l'Analyse" });
      await expect(analyseButton).toBeEnabled();
      const predictResponse = page.waitForResponse('**/predict');
      await analyseButton.click();
      await predictResponse;
      await expect(analyseButton).toBeEnabled();
    });

    await test.step('Remove first image and verify upload area resets', async () => {
      await page.locator('button:has(svg)').first().click();
      await expect(
        page.getByText('Cliquez pour upload ou glissez-déposez')
      ).toBeVisible();
    });

    await test.step('Upload second skin image', async () => {
      await page.locator('input[type="file"]').setInputFiles({
        name: 'skin-image-2.png',
        mimeType: 'image/png',
        buffer: Buffer.from(DUMMY_PNG_BASE64, 'base64'),
      });
      await expect(page.locator('img[alt="Preview"]')).toBeVisible();
    });

    await test.step('Launch second analysis', async () => {
      const analyseButton = page.getByRole('button', { name: "Lancer l'Analyse" });
      await expect(analyseButton).toBeEnabled();
      const predictResponse = page.waitForResponse('**/predict');
      await analyseButton.click();
      await predictResponse;
      await expect(analyseButton).toBeEnabled();
    });
  });

  test('should logout and redirect to the login page', async ({ page }) => {
    await test.step('Login', async () => {
      await page.goto('/login');
      await page.getByPlaceholder('exemple@email.com').fill('yboufangha@outlook.fr');
      await page.locator('input[type="password"]').fill('yahya1234');
      await page.getByRole('button', { name: 'Se Connecter' }).click();
      await expect(page).toHaveURL('/');
    });

    await test.step('Click logout button', async () => {
      await page.getByRole('button', { name: 'Déconnexion' }).click();
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
    });
  });
});
