export function hexToArrayBuffer(hex) {
    const typedArray = new Uint8Array(hex.length / 2)
    for (let i = 0; i < typedArray.length; i++) {
        typedArray[i] = parseInt(hex.substring(i*2, i*2 + 2), 16)
    }
    return typedArray.buffer
}

export function bufferToHex(buffer) {
    return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function deriveMasterKey(password, saltHex) {
    const salt = hexToArrayBuffer(saltHex)
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
    )
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt,
            iterations: 100_000,
            hash: "SHA-256"
        },
        keyMaterial,
        32 * 8 // 32 bytes = 256 bits
    )
    return new Uint8Array(derivedBits)
}

export async function hashMasterKey(masterKeyBytes) {
    const digest = await crypto.subtle.digest("SHA-256", masterKeyBytes)
    return bufferToHex(new Uint8Array(digest))
}

export function incrementIV(iv) {
    for (let i = iv.length - 1; i >= 0; i--) {
        if (iv[i] < 255) {
            iv[i]++
            break
        } else {
            iv[i] = 0
        }
    }
}