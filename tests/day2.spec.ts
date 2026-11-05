import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('https://www.saucedemo.com');
});

test('valid login', async ({ page }) => {
  await page.getByPlaceholder('Username').fill('standard_user');
  await page.getByPlaceholder('Password').fill('secret_sauce');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page).toHaveURL(/inventory/);
  await expect(page.locator('.title')).toHaveText('Products');
});

test('invalid login shows error', async ({ page }) => {
  await page.getByPlaceholder('Username').fill('wrong_user');
  await page.getByPlaceholder('Password').fill('wrong_pass');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByText('Username and password do not match')).toBeVisible();
});

test('add item to cart', async ({ page }) => {
  await page.getByPlaceholder('Username').fill('standard_user');
  await page.getByPlaceholder('Password').fill('secret_sauce');
  await page.getByRole('button', { name: 'Login' }).click();

  await page.getByRole('button', { name: 'Add to cart' }).first().click();
  await expect(page.locator('.shopping_cart_badge')).toHaveText('1');
});

test('add two items to cart', async ({ page }) => {
  await page.getByPlaceholder('Username').fill('standard_user');
  await page.getByPlaceholder('Password').fill('secret_sauce');
  await page.getByRole('button', { name: 'Login' }).click();

  // Pehle click ke baad wo button "Remove" ban jata hai,
  // isliye .first() agli baar dusre item par jata hai
  await page.getByRole('button', { name: 'Add to cart' }).first().click();
  await page.getByRole('button', { name: 'Add to cart' }).first().click();

  await expect(page.locator('.shopping_cart_badge')).toHaveText('2');
});