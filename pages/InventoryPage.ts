import { Page, Locator } from '@playwright/test';

export class InventoryPage {
  readonly page: Page;
  readonly title: Locator;
  readonly addToCartButtons: Locator;
  readonly removeButtons: Locator;
  readonly cartBadge: Locator;
  readonly cartLink: Locator;
  readonly itemNames: Locator;
  readonly prices: Locator;
  readonly sortDropdown: Locator;
  readonly menuButton: Locator;
  readonly logoutLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('.title');
    this.addToCartButtons = page.getByRole('button', { name: 'Add to cart' });
    this.removeButtons = page.getByRole('button', { name: 'Remove' });
    this.cartBadge = page.locator('.shopping_cart_badge');
    this.cartLink = page.locator('.shopping_cart_link');
    this.itemNames = page.locator('.inventory_item_name');
    this.prices = page.locator('.inventory_item_price');
    this.sortDropdown = page.locator('[data-test="product-sort-container"]');
    this.menuButton = page.locator('#react-burger-menu-btn');
    this.logoutLink = page.locator('#logout_sidebar_link');
  }

  async addFirstItems(count: number) {
    for (let i = 0; i < count; i++) {
      await this.addToCartButtons.first().click();
    }
  }

  async removeFirstItem() {
    await this.removeButtons.first().click();
  }

  async firstItemName(): Promise<string> {
    return (await this.itemNames.first().textContent()) ?? '';
  }

  async openCart() {
    await this.cartLink.click();
  }

  async sortBy(option: 'az' | 'za' | 'lohi' | 'hilo') {
    await this.sortDropdown.selectOption(option);
  }

  async getPrices(): Promise<number[]> {
    const texts = await this.prices.allTextContents();
    return texts.map((t) => parseFloat(t.replace('$', '')));
  }

  async logout() {
    await this.menuButton.click();
    await this.logoutLink.click();
  }
}