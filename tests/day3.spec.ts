import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';

test.describe('SauceDemo with POM', () => {
  let loginPage: LoginPage;
  let inventoryPage: InventoryPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    inventoryPage = new InventoryPage(page);
    await loginPage.goto();
  });

  test('valid login', async ({ page }) => {
    await loginPage.login('standard_user', 'secret_sauce');
    await expect(page).toHaveURL(/inventory/);
    await expect(inventoryPage.title).toHaveText('Products');
  });

  test('invalid login shows error', async () => {
    await loginPage.login('wrong_user', 'wrong_pass');
    await expect(loginPage.errorMessage).toContainText('do not match');
  });

  test('add two items to cart', async () => {
    await loginPage.login('standard_user', 'secret_sauce');
    await inventoryPage.addFirstItems(2);
    await expect(inventoryPage.cartBadge).toHaveText('2');
  });
});