// crypto.randomUUID only exists in secure contexts, so it is missing when testing over a LAN IP.
export const newId = () =>
  globalThis.isSecureContext
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
