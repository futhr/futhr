import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import process from 'node:process'
import type * as Playwright from '@playwright/test'
import { expect, test } from '@playwright/test'

interface ReplySummary {
  requestId: number
  ok: boolean
  code: string | null
  message: string | null
  passwordLength: number
  seen: number | null
  blind: number | null
  hasData: boolean
  hasPassword: boolean
}

interface ProbeGlobals {
  __exkAuditControl?: Int32Array
  __exkAuditInitError?: string
  __exkAuditReply?: ReplySummary
}

const bounded = async <T>(
  label: string,
  timeoutMs: number,
  operation: () => Promise<T>
): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`Web Crypto probe timed out: ${label}`)), timeoutMs)
  })
  try {
    return await Promise.race([Promise.resolve().then(operation), deadline])
  } finally {
    clearTimeout(timer)
  }
}

const snapshot = async (frame: Playwright.Frame) =>
  await bounded('shared counters and reply', 5000, () =>
    frame.evaluate(() => {
      const probe = globalThis as typeof globalThis & ProbeGlobals
      const control = probe.__exkAuditControl
      if (!control) {
        throw new Error(probe.__exkAuditInitError ?? 'Missing Web Crypto shared control')
      }
      return {
        realCalls: Atomics.load(control, 1),
        faultCalls: Atomics.load(control, 2),
        realBytes: Atomics.load(control, 3),
        workerLoadsSent: Atomics.load(control, 4),
        workerLoadsSeen: Atomics.load(control, 5),
        workerRealCalls: Atomics.load(control, 8),
        workerFaultCalls: Atomics.load(control, 9),
        missingControlCalls: Atomics.load(control, 12),
        realCryptoExceptions: Atomics.load(control, 14),
        reply: probe.__exkAuditReply ?? null
      }
    })
  )

type Snapshot = Awaited<ReturnType<typeof snapshot>>

const newReply = async (frame: Playwright.Frame, previousRequestId: number) => {
  await bounded('new protocol reply', 25_000, () =>
    frame.waitForFunction(
      (previous) => {
        const reply = (globalThis as typeof globalThis & ProbeGlobals).__exkAuditReply
        return reply && reply.requestId > previous
      },
      previousRequestId,
      { polling: 50, timeout: 24_000 }
    )
  )
  return await snapshot(frame)
}

const receiptSnapshot = (value: Snapshot | null) => {
  if (!value) {
    return null
  }
  const { reply, ...counters } = value
  return {
    ...counters,
    reply: reply
      ? {
          requestId: reply.requestId,
          ok: reply.ok,
          code:
            reply.code === null || reply.code === 'generation_failed' ? reply.code : 'unexpected',
          matchesFailureMessage: reply.message === 'Password generation failed closed.',
          passwordLength: reply.passwordLength,
          seen: reply.seen,
          blind: reply.blind,
          hasData: reply.hasData,
          hasPassword: reply.hasPassword
        }
      : null
  }
}

test('reaches real worker Web Crypto and fails closed when it throws', async ({
  browser,
  browserName,
  context,
  page
}, testInfo) => {
  const [originalRuntime, wasm, avm, bridgeSource, prefix, windowInit, testSource] =
    await Promise.all([
      readFile(new URL('../../browser-core/core/AtomVM.mjs', import.meta.url)),
      readFile(new URL('../../browser-core/core/AtomVM.wasm', import.meta.url)),
      readFile(new URL('../../browser-core/core/exk_passwd.avm', import.meta.url)),
      readFile(new URL('../../src/runtime-entry.ts', import.meta.url)),
      readFile(new URL('../fixtures/webcrypto-rng-prefix.js', import.meta.url)),
      readFile(new URL('../fixtures/webcrypto-window-init.js', import.meta.url)),
      readFile(new URL('./webcrypto.test.ts', import.meta.url))
    ])
  const instrumentedRuntime = Buffer.concat([prefix, originalRuntime])
  const instrumentation = {
    original_mjs_sha256: createHash('sha256').update(originalRuntime).digest('hex'),
    served_mjs_sha256: createHash('sha256').update(instrumentedRuntime).digest('hex'),
    prefix_sha256: createHash('sha256').update(prefix).digest('hex'),
    window_init_sha256: createHash('sha256').update(windowInit).digest('hex')
  }
  const artifacts = {
    wasm: { bytes: wasm.byteLength, sha256: createHash('sha256').update(wasm).digest('hex') },
    avm: { bytes: avm.byteLength, sha256: createHash('sha256').update(avm).digest('hex') },
    runtime_entry_source_sha256: createHash('sha256').update(bridgeSource).digest('hex'),
    test_source_sha256: createHash('sha256').update(testSource).digest('hex')
  }
  let baseline: Snapshot | null = null
  let afterReal: Snapshot | null = null
  let afterFault: Snapshot | null = null
  let completed = false

  try {
    expect(browserName).toBe('chromium')
    await bounded('route runtime probe', 5000, () =>
      context.route('**/browser-core/core/AtomVM.mjs', async (route) => {
        const response = await route.fetch({ timeout: 5000 })
        await bounded('serve instrumented runtime', 5000, () =>
          route.fulfill({ response, body: instrumentedRuntime })
        )
      })
    )
    await bounded('route probe manifest', 5000, () =>
      context.route('**/browser-core/manifest.json', async (route) => {
        const response = await route.fetch({ timeout: 5000 })
        const manifest = (await bounded('read core manifest', 5000, () => response.json())) as {
          files: Record<string, { bytes: number; sha256: string }>
          test_instrumentation?: typeof instrumentation
        }
        manifest.files['core/AtomVM.mjs'] = {
          bytes: instrumentedRuntime.byteLength,
          sha256: instrumentation.served_mjs_sha256
        }
        manifest.test_instrumentation = instrumentation
        await bounded('serve instrumented manifest', 5000, () =>
          route.fulfill({ response, json: manifest })
        )
      })
    )
    await bounded('install early window probe', 5000, () =>
      page.addInitScript(windowInit.toString('utf8'))
    )
    await page.goto('/exk-passwd/', { timeout: 15_000 })
    await expect(page.locator('#feedback')).toHaveText(
      'Generated only on this device. Never sent over the network.',
      { timeout: 45_000 }
    )
    const runtimeFrame = page.frames().find((frame) => frame.url().endsWith('/runtime.html'))
    if (!runtimeFrame) {
      throw new Error('The real runtime iframe did not start')
    }

    // Boot and automatic initial generation cannot satisfy the next command's delta.
    baseline = await snapshot(runtimeFrame)
    if (!baseline.reply) {
      throw new Error('Initial generation returned no observed protocol reply')
    }
    expect(baseline.reply?.ok).toBe(true)
    expect(baseline.workerLoadsSeen).toBeGreaterThan(0)
    expect(baseline.workerLoadsSeen).toBe(baseline.workerLoadsSent)
    expect(baseline.missingControlCalls).toBe(0)

    await page.locator('#regenerate').click({ timeout: 5000 })
    afterReal = await newReply(runtimeFrame, baseline.reply.requestId)
    await expect(page.locator('#feedback')).toHaveText(
      'Generated only on this device. Never sent over the network.',
      { timeout: 25_000 }
    )
    if (!afterReal.reply) {
      throw new Error('Regeneration returned no observed protocol reply')
    }
    expect(afterReal.reply?.requestId).toBeGreaterThan(baseline.reply?.requestId ?? -1)
    expect(afterReal.reply?.ok).toBe(true)
    expect(afterReal.reply?.passwordLength).toBeGreaterThan(10)
    expect(Number.isFinite(afterReal.reply?.seen)).toBe(true)
    expect(afterReal.reply?.seen).toBeGreaterThan(0)
    expect(Number.isFinite(afterReal.reply?.blind)).toBe(true)
    expect(afterReal.reply?.blind).toBeGreaterThan(0)
    expect(afterReal.realCalls).toBeGreaterThan(baseline.realCalls)
    expect(afterReal.workerRealCalls).toBeGreaterThan(baseline.workerRealCalls)
    expect(afterReal.realBytes).toBeGreaterThan(baseline.realBytes)
    expect(afterReal.realCryptoExceptions).toBe(baseline.realCryptoExceptions)

    await bounded('enable Crypto throw', 5000, () =>
      runtimeFrame.evaluate(() => {
        const control = (globalThis as typeof globalThis & ProbeGlobals).__exkAuditControl
        if (!control) {
          throw new Error('Missing Web Crypto shared control')
        }
        Atomics.store(control, 0, 1)
      })
    )
    await page.locator('#regenerate').click({ timeout: 5000 })
    afterFault = await newReply(runtimeFrame, afterReal.reply.requestId)
    await expect(page.locator('#feedback')).toHaveText('Password generation failed closed.', {
      timeout: 25_000
    })
    expect(afterFault.reply?.requestId).toBeGreaterThan(afterReal.reply?.requestId ?? -1)
    expect(afterFault.reply).toMatchObject({
      ok: false,
      code: 'generation_failed',
      message: 'Password generation failed closed.',
      passwordLength: 0,
      hasData: false,
      hasPassword: false
    })
    expect(afterFault.faultCalls).toBeGreaterThan(afterReal.faultCalls)
    expect(afterFault.workerFaultCalls).toBeGreaterThan(afterReal.workerFaultCalls)
    expect(afterFault.realCalls).toBe(afterReal.realCalls)
    expect(afterFault.realBytes).toBe(afterReal.realBytes)
    expect(afterFault.workerLoadsSeen).toBe(afterFault.workerLoadsSent)
    expect(afterFault.missingControlCalls).toBe(0)
    expect(
      await bounded('password cleared', 5000, () =>
        page
          .locator('#password')
          .evaluate((element) => element.textContent === 'Generation stopped')
      )
    ).toBe(true)
    await expect(page.locator('#copy')).toBeDisabled({ timeout: 5000 })
    completed = true
  } finally {
    try {
      await bounded('close owned page and workers', 10_000, () => page.close())
    } finally {
      const receipt = {
        completed: completed && page.isClosed(),
        scope: 'Instrumented checked-in core through the real UI and runtime bridge; Chromium only',
        sdk: {
          node: process.version,
          playwright: testInfo.config.version,
          browser: browser.version(),
          browserName,
          project: testInfo.project.name
        },
        instrumentation,
        artifacts,
        baselineAfterInitialGeneration: receiptSnapshot(baseline),
        afterReal: receiptSnapshot(afterReal),
        afterFault: receiptSnapshot(afterFault),
        ownedPageClosed: page.isClosed()
      }
      const receiptPath = testInfo.outputPath('webcrypto-receipt.json')
      await bounded('write Web Crypto receipt', 5000, () =>
        writeFile(receiptPath, JSON.stringify(receipt, null, 2))
      )
      await bounded('attach Web Crypto receipt', 5000, () =>
        testInfo.attach('webcrypto-receipt', {
          path: receiptPath,
          contentType: 'application/json'
        })
      )
    }
  }
})
