async function deriveMasterKey(password, saltHex) {
    const salt = hexToArrayBuffer(saltHex)
    const passwordBuffer = new TextEncoder().encode(password)
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        passwordBuffer,
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
        32 * 8
    )

    return new Uint8Array(derivedBits)
}

async function hashMasterKey(masterKeyBytes) {
    const digest = await crypto.subtle.digest("SHA-256", masterKeyBytes)
    return bufferToHex(new Uint8Array(digest))
}