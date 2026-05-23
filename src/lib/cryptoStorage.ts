const DB_NAME = 'transfor-prd-keystore'
const STORE_NAME = 'keys'
const KEY_ID = 'storage-key'

async function openKeyStore(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function getCryptoKey(): Promise<CryptoKey> {
  const db = await openKeyStore()

  // Try to get existing key
  const stored = await new Promise<ArrayBuffer | undefined>((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).get(KEY_ID)
    tx.oncomplete = () => resolve(req.result)
    db.close()
  })

  if (stored) {
    return crypto.subtle.importKey('raw', stored, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
  }

  // Generate new key
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ])
  const raw = await crypto.subtle.exportKey('raw', key)

  // Store in IndexedDB
  const db2 = await openKeyStore()
  const tx = db2.transaction(STORE_NAME, 'readwrite')
  tx.objectStore(STORE_NAME).put(raw, KEY_ID)
  await new Promise<void>((resolve) => {
    tx.oncomplete = () => {
      db2.close()
      resolve()
    }
  })

  return key
}

async function encrypt(plaintext: string): Promise<string> {
  const key = await getCryptoKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  // Combine IV + ciphertext as base64
  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), iv.length)
  return btoa(String.fromCharCode(...combined))
}

async function decrypt(encrypted: string): Promise<string> {
  const key = await getCryptoKey()
  const combined = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(decrypted)
}

export function createEncryptedStorage(): {
  getItem: (name: string) => Promise<string | null>
  setItem: (name: string, value: string) => Promise<void>
  removeItem: (name: string) => Promise<void>
} {
  return {
    getItem: async (name: string) => {
      const raw = localStorage.getItem(name)
      if (!raw) return null
      try {
        return await decrypt(raw)
      } catch {
        // If decryption fails (e.g. key was lost), treat as missing
        return null
      }
    },
    setItem: async (name: string, value: string) => {
      const encrypted = await encrypt(value)
      localStorage.setItem(name, encrypted)
    },
    removeItem: async (name: string) => {
      localStorage.removeItem(name)
    },
  }
}
