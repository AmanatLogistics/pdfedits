import { test } from '@playwright/test'
import { openEditor } from './helpers.js'

/** Not an assertion — captures the editor for visual review. */
test('capture editor screenshot', async ({ page }) => {
  await openEditor(page)
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'test-results/editor.png' })
})
