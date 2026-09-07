import { test } from '@playwright/test';
import { openFixture } from './helpers';

/** Not an assertion — captures the editor for visual review. */
test('capture editor screenshot', async ({ page }) => {
  await openFixture(page, 'sample.pdf');
  await page.click('[data-testid="tool-highlight"]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'test-results/editor.png', fullPage: false });
});
