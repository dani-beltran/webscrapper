/** @param {import('playwright').Page} page */
export default async function plugin(page) {
  await page.click('#expand');
  await page.waitForTimeout(1000);

  try {
    await page.hover('#expanded');
  } catch {
    // Optional actions can be handled by the plugin itself.
  }
}
