import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { origin } from './hosts.ts'

test('explains an invalid address without leaving the page', async ({ page }) => {
  await page.goto(`${origin('diggymon.com')}/`)
  await page.getByLabel('Email address').fill('not-an-address')
  await page.getByRole('button', { name: 'Notify me' }).click()
  await expect(page.getByRole('alert')).toHaveText('Enter a valid email address.')
  await expect(page).toHaveURL(`${origin('diggymon.com')}/`)
  await expect(page.getByLabel('Email address')).toBeVisible()
  await expect(page.getByLabel('Email address')).toHaveValue('not-an-address')
  await expect(page.getByLabel('Email address')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByLabel('Email address')).toHaveAttribute(
    'aria-describedby',
    'join-form-error'
  )
})

test('keeps error text and the hovered button readable throughout the week', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(`${origin('diggymon.com')}/`)
  await page.getByLabel('Email address').fill('not-an-address')
  const submit = page.getByRole('button', { name: 'Notify me' })
  await submit.click()
  await expect(page.getByRole('alert')).toHaveText('Enter a valid email address.')
  await submit.hover()

  for (let day = 0; day < 7; day += 1) {
    await page.locator('html').evaluate((element, value) => {
      element.setAttribute('data-day', String(value))
    }, day)
    const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze()
    expect(results.violations, `weekday ${day}`).toEqual([])
  }
})
