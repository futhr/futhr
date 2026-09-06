import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { origin } from './hosts.ts'

test('accepts withdrawal requests from the website and retains invalid input', async ({ page }) => {
  await page.goto(`${origin('rivure.com')}/`)
  await page.getByRole('contentinfo').getByRole('link', { name: 'Withdraw' }).click()
  await expect(page).toHaveURL(`${origin('rivure.com')}/withdraw`)
  await page.getByLabel('Email address').fill('invalid')
  await page.getByRole('button', { name: 'Request removal' }).click()
  await expect(page.getByRole('alert')).toHaveText('Enter a valid email address.')
  await expect(page.getByLabel('Email address')).toHaveValue('invalid')
  await page.getByLabel('Email address').fill('unknown@example.com')
  await page.getByRole('button', { name: 'Request removal' }).click()
  await expect(page.getByRole('status')).toContainText('If this address is on the list')
  await expect(page.getByRole('link', { name: 'hi@futhr.io' })).toHaveAttribute(
    'href',
    'mailto:hi@futhr.io'
  )
})

test('works without JavaScript and has accessible form controls', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto(`${origin('diggymon.com')}/withdraw`)
  await page.getByLabel('Email address').fill('unknown@example.com')
  await page.getByRole('button', { name: 'Request removal' }).click()
  await expect(page.getByRole('status')).toContainText('If this address is on the list')
  await context.close()
})

test('has no serious accessibility violations on the request and privacy pages', async ({
  page
}) => {
  for (const path of ['/withdraw', '/privacy']) {
    await page.goto(`${origin('rivure.com')}${path}`)
    const result = await new AxeBuilder({ page }).analyze()
    expect(
      result.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical')
    ).toEqual([])
  }
})
