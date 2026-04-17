import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGE_DIR = path.join(__dirname, '../../testing images');

function makeFakeJwt(email: string): string {
  const header = Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({ sub: email, exp: 9_999_999_999 })
  ).toString('base64url');
  return `${header}.${payload}.fake-signature`;
}

const FAKE_JWT = makeFakeJwt('yboufangha@outlook.fr');

test.describe('Login, Upload and Logout', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/token', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ access_token: FAKE_JWT, token_type: 'bearer' }),
      })
    );

    await page.route('**/predict', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ label: 'Bénin', is_malignant: false, probability: 0.12 }),
      })
    );
  });

  test('login, upload and analyze two images, then logout @critical', async ({ page }) => {
    await test.step('Navigate to login page', async () => {
      await page.goto('/login');
      await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
    });

    await test.step('Fill login credentials and submit', async () => {
      await page.getByPlaceholder('exemple@email.com').fill('yboufangha@outlook.fr');
      await page.locator('input[type="password"]').fill('yahya1234');
      // Regression check: button text should be 'Se Connecter' (changed to 'Connexion' in regression commit 4fa1cd5)
      await page.getByRole('button', { name: 'Se Connecter' }).click();
      await expect(page).toHaveURL('/');
    });

    await test.step('Upload first image and run analysis', async () => {
      await expect(page.getByText('Cliquez pour upload', { exact: false })).toBeVisible();
      await page.locator('input[type="file"]').setInputFiles(path.join(IMAGE_DIR, 'benign.png'));
      await expect(page.locator('img[alt="Preview"]')).toBeVisible();
      await page.getByRole('button', { name: "Lancer l'Analyse" }).click();
      await expect(page.getByText('Bénin')).toBeVisible();
    });

    await test.step('Clear first image', async () => {
      await page.locator('button.absolute').click();
      await expect(page.getByText('Cliquez pour upload', { exact: false })).toBeVisible();
    });

    await test.step('Upload second image and run analysis', async () => {
      await page.locator('input[type="file"]').setInputFiles(path.join(IMAGE_DIR, 'melanoma.png'));
      await expect(page.locator('img[alt="Preview"]')).toBeVisible();
      await page.getByRole('button', { name: "Lancer l'Analyse" }).click();
      await expect(page.getByText('Bénin')).toBeVisible();
    });

    await test.step('Clear second image and logout', async () => {
      await page.locator('button.absolute').click();
      await expect(page.getByText('Cliquez pour upload', { exact: false })).toBeVisible();
      await page.getByRole('button', { name: 'Déconnexion' }).click();
      await expect(page).toHaveURL('/login');
    });
  });
});
