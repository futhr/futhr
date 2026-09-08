import { expect, test } from '@playwright/test'
import { origin } from './hosts.ts'

test('joins from the keyboard and lands on the joined state without leaving the page', async ({
  page
}) => {
  await page.goto(`${origin('refpath.io')}/`)
  await page.getByLabel('Email address').focus()
  await page.keyboard.type(`e2e-${Date.now()}@example.com`)
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'You are on the list' })).toBeVisible()
  await expect(
    page.getByText('Nothing is sent until there is something to announce.')
  ).toBeVisible()
  await expect(page).toHaveURL(`${origin('refpath.io')}/`)
})

test('joins without JavaScript through a plain form post', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto(`${origin('orvane.io')}/`)
  await expect(page.getByRole('button', { name: 'Notify me' })).toBeEnabled()
  await page.getByLabel('Email address').fill(`nojs-${Date.now()}@example.com`)
  await page.getByRole('button', { name: 'Notify me' }).click()
  await expect(page.getByRole('heading', { name: 'You are on the list' })).toBeVisible()
  await expect(page.locator('h1')).toHaveText('Orvane')
  await context.close()
})
