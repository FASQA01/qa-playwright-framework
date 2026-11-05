import { test, expect } from './fixtures';
import { users } from '../testdata/users';

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('valid login', async ({ page, loginPage, inventoryPage }) => {
    await loginPage.login(users.standard.username, users.standard.password);
    await expect(page).toHaveURL(/inventory/);
    await expect(inventoryPage.title).toHaveText('Products');
  });

  test('invalid credentials show error', async ({ loginPage }) => {
    await loginPage.login(users.invalid.username, users.invalid.password);
    await expect(loginPage.errorMessage).toContainText('do not match');
  });

  test('locked out user cannot login', async ({ loginPage }) => {
    await loginPage.login(users.locked.username, users.locked.password);
    await expect(loginPage.errorMessage).toContainText('locked out');
  });

  test('empty username shows validation', async ({ loginPage }) => {
    await loginPage.login('', users.standard.password);
    await expect(loginPage.errorMessage).toContainText('Username is required');
  });

  test('empty password shows validation', async ({ loginPage }) => {
    await loginPage.login(users.standard.username, '');
    await expect(loginPage.errorMessage).toContainText('Password is required');
  });
});

test.describe('Inventory and Cart', () => {
  test('add one item updates cart badge', async ({ loggedIn }) => {
    await loggedIn.addFirstItems(1);
    await expect(loggedIn.cartBadge).toHaveText('1');
  });

  test('remove item clears cart badge', async ({ loggedIn }) => {
    await loggedIn.addFirstItems(1);
    await loggedIn.removeFirstItem();
    await expect(loggedIn.cartBadge).toHaveCount(0);
  });

  test('cart shows the added item', async ({ loggedIn, cartPage }) => {
    const name = await loggedIn.firstItemName();
    await loggedIn.addFirstItems(1);
    await loggedIn.openCart();
    await expect(cartPage.items).toHaveCount(1);
    await expect(cartPage.itemNames).toHaveText([name]);
  });

  test('logout returns to login page', async ({ loggedIn, loginPage }) => {
    await loggedIn.logout();
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('products sort by price low to high', async ({ loggedIn }) => {
    await loggedIn.sortBy('lohi');
    const prices = await loggedIn.getPrices();
    const sorted = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sorted);
  });
});