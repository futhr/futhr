;(() => {
  if (typeof SharedArrayBuffer === 'undefined') {
    globalThis.__exkAuditInitError = 'SharedArrayBuffer unavailable before runtime boot'
    return
  }
  const control = new Int32Array(new SharedArrayBuffer(64))
  globalThis.__exkAuditControl = control
  const NativeWorker = globalThis.Worker
  globalThis.Worker = class ExkWebCryptoWorker extends NativeWorker {
    constructor(...args) {
      super(...args)
      Atomics.add(control, 6, 1)
    }
    postMessage(message, transfer) {
      if (message && message.cmd === 'load') {
        Atomics.add(control, 4, 1)
        return super.postMessage({ ...message, __exkAuditBuffer: control.buffer }, transfer)
      }
      return super.postMessage(message, transfer)
    }
  }
})()

// Observe the bridge envelope without retaining generated password contents.
;(() => {
  const nativePostMessage = MessagePort.prototype.postMessage
  Object.defineProperty(MessagePort.prototype, 'postMessage', {
    configurable: true,
    value(...args) {
      const [message] = args
      if (message?.type === 'response' && message.reply) {
        const reply = message.reply
        globalThis.__exkAuditReply = {
          requestId: message.requestId,
          ok: reply.ok,
          code: reply.error?.code ?? null,
          message: reply.error?.message ?? null,
          passwordLength: typeof reply.data?.password === 'string' ? reply.data.password.length : 0,
          seen: reply.data?.entropy?.seen ?? null,
          blind: reply.data?.entropy?.blind ?? null,
          hasData: Object.hasOwn(reply, 'data'),
          hasPassword:
            Object.hasOwn(reply, 'password') || Object.hasOwn(reply.data ?? {}, 'password')
        }
      }
      return Reflect.apply(nativePostMessage, this, args)
    }
  })
})()
