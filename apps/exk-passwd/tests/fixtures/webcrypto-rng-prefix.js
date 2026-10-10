// Test-only prefix. The original generated MJS follows this block unchanged.
;(() => {
  const inWorker = typeof document === 'undefined'
  let control = inWorker ? null : (globalThis.__exkAuditControl ?? null)
  let missingControlCalls = 0
  if (inWorker) {
    globalThis.addEventListener('message', (event) => {
      if (event.data?.cmd === 'load' && event.data.__exkAuditBuffer instanceof SharedArrayBuffer) {
        control = new Int32Array(event.data.__exkAuditBuffer)
        Atomics.add(control, 5, 1)
        Atomics.add(control, 12, missingControlCalls)
      }
    })
  }
  const realGetRandomValues = globalThis.crypto.getRandomValues.bind(globalThis.crypto)
  Object.defineProperty(Crypto.prototype, 'getRandomValues', {
    configurable: true,
    value(target) {
      if (!control) {
        missingControlCalls += 1
        return realGetRandomValues(target)
      }
      if (Atomics.load(control, 0) === 1) {
        Atomics.add(control, 2, 1)
        Atomics.add(control, inWorker ? 9 : 11, 1)
        throw new DOMException('Owned Web Crypto failure injection', 'OperationError')
      }
      Atomics.add(control, 13, 1)
      let result
      try {
        result = realGetRandomValues(target)
      } catch (error) {
        Atomics.add(control, 14, 1)
        throw error
      }
      Atomics.add(control, 1, 1)
      Atomics.add(control, 3, target.byteLength)
      Atomics.add(control, inWorker ? 8 : 10, 1)
      return result
    }
  })
})()
