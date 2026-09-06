import { expect, test } from '@playwright/test'
import { origin } from './hosts.ts'

test('explains an invalid address without leaving the page', async ({ page }) => {
  await page.goto(`${origin('diggymon.com')}/`)
  await page.getByLabel('Email address').fill('not-an-address')
  await page.getByRole('button', { name: 'Notify me' }).click()
  await expect(page.getByRole('alert')).toHaveText('Enter a valid email address.')
  await expect(page).toHaveURL(`${origin('diggymon.com')}/`)
  await expect(page.getByLabel('Email address')).toBeVisible()
})
