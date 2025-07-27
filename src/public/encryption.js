async function encryptFile(file, encryptionKey) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12))

    const fileBuffer = await file.arrayBuffer()

    const cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        encryptionKey, // Uint8Array
        { name: "AES-GCM" },
        false,
        ["encrypt"]
    )

    const encrypted = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        cryptoKey,
        fileBuffer
    )

    return {
        ciphertext: new Uint8Array(encrypted),
        iv: iv
    }
}

async function decryptFile(encryptedData, iv, encryptionKey) {
    const cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        encryptionKey,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
    )

    const decrypted = await window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        cryptoKey,
        encryptedData
    )

    return new Uint8Array(decrypted)
}