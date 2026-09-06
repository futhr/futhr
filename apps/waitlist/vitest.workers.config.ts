import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin'
import { defineConfig } from 'vitest/config'
import { localSecrets } from './tests/local-secrets.ts'

const library = new URL('./src/lib', import.meta.url).pathname
const migrations = await readD1Migrations(new URL('./migrations', import.meta.url).pathname)

export default defineConfig({
  resolve: {
    alias: { $lib: library }
  },
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          cloudflareTest({
            wrangler: { configPath: './wrangler.toml' },
            miniflare: {
              bindings: {
                TEST_MIGRATIONS: migrations,
                ...localSecrets,
                WAITLIST_ENVIRONMENT: 'test'
              }
            }
          })
        ],
        test: {
          name: 'public',
          include: ['tests/workers/public/**/*.test.ts'],
          setupFiles: ['./tests/workers/apply-migrations.ts']
        }
      },
      {
        extends: true,
        plugins: [
          cloudflareTest({
            wrangler: { configPath: './wrangler.admin.toml' },
            miniflare: {
              bindings: {
                TEST_MIGRATIONS: migrations,
                ...localSecrets,
                WAITLIST_ENVIRONMENT: 'test',
                ACCESS_TEAM_DOMAIN: 'example.cloudflareaccess.com',
                ACCESS_AUDIENCE: 'test-audience',
                ADMIN_REVIEWER_BRAND_GRANTS: JSON.stringify({ 'review-bot': ['rivure'] }),
                ADMIN_BRAND_GRANTS: JSON.stringify({
                  'owner@example.com': ['*'],
                  'rivure-bot': ['rivure']
                })
              }
            }
          })
        ],
        test: {
          name: 'admin',
          include: ['tests/workers/admin/**/*.test.ts'],
          setupFiles: ['./tests/workers/apply-migrations.ts']
        }
      }
    ]
  }
})
