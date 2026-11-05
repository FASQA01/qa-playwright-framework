import { Page, Locator } from '@playwright/test';

export class InventoryPage {
  readonly page: Page;
  readonly title: Locator;
  readonly addToCartButtons: Locator;
  readonly cartBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('.title');
    this.addToCartButtons = page.getByRole('button', { name: 'Add to cart' });
    this.cartBadge = page.locator('.shopping_cart_badge');
  }

  async addFirstItems(count: number) {
    for (let i = 0; i < count; i++) {
      await this.addToCartButtons.first().click();
    }
  }
}
