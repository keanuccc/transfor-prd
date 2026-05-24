async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new Uint8Array(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptForShare(content: string, password: string): Promise<string> {
  const enc = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(password, salt)

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    enc.encode(content),
  )

  const encryptedArr = new Uint8Array(encrypted)
  const payload = {
    v: 1,
    salt: btoa(String.fromCharCode(...salt)),
    iv: btoa(String.fromCharCode(...iv)),
    data: btoa(String.fromCharCode(...encryptedArr)),
  }

  return btoa(JSON.stringify(payload))
}

export async function decryptFromShare(encoded: string, password: string): Promise<string> {
  const payload = JSON.parse(atob(encoded))

  const salt = Uint8Array.from(atob(payload.salt), (c) => c.charCodeAt(0))
  const iv = Uint8Array.from(atob(payload.iv), (c) => c.charCodeAt(0))
  const data = Uint8Array.from(atob(payload.data), (c) => c.charCodeAt(0))

  const key = await deriveKey(password, salt)

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    data,
  )

  return new TextDecoder().decode(decrypted)
}

export function generateShareUrl(encodedPayload: string): string {
  return `${window.location.origin}/share#${encodedPayload}`
}
