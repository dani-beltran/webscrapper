/** @param {import('playwright').Page} page */
export default async function plugin(page) {
  await page.click('a');
  await page.waitForTimeout(1000);

  try {
    await page.hover('#example-domains');
  } catch {
    // Optional actions can be handled by the plugin itself.
  }
}
