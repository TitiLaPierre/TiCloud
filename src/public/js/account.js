async function account_login(username, password) {
    if (!username || !password) return { success: false, message: "invalid_fields" }

    const preLoginResponse = await fetch(URL+"/api/prelogin/", {
        "method": "POST",
        "headers": {
            "content-type": "application/json",
        },
        "body": JSON.stringify({ username })
    })
    const parsedPreLoginResponse = await preLoginResponse.json()
    if (!parsedPreLoginResponse.success) return { success: false, message: parsedPreLoginResponse.message }

    const master_key = await deriveMasterKey(password, parsedPreLoginResponse.salt)
    const hashed_master_key = await hashMasterKey(master_key)

    const loginResponse = await fetch(URL+"/api/login/", {
        "method": "POST",
        "headers": {
            "content-type": "application/json",
        },
        "body": JSON.stringify({ username, hashed_master_key })
    })
    const parsedLoginResponse = await loginResponse.json()
    if (!parsedLoginResponse.success) return { success: false, message: parsedLoginResponse.message }

    const iv = hexToArrayBuffer(parsedLoginResponse.iv)
    const tag = hexToArrayBuffer(parsedLoginResponse.tag)
    const encrypted = hexToArrayBuffer(parsedLoginResponse.encrypted_encryption_key)
    const data = new Uint8Array([...new Uint8Array(encrypted), ...new Uint8Array(tag)])

    const decrypted = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv,
            tagLength: 128
        },
        await crypto.subtle.importKey(
            "raw",
            master_key,
            { name: "AES-GCM" },
            false,
            ["decrypt"]
        ),
        data
    )
    const encryption_key = new Uint8Array(decrypted)
    localStorage.setItem("encryption_key", bufferToHex(encryption_key))
    return { success: true, message: "logged_in" }
}

async function account_register(username, password) {
    const response = await fetch(URL+"/api/register/", {
        "method": "POST",
        "headers": {
            "content-type": "application/json",
        },
        "body": JSON.stringify({ username, password })
    })
    const parsedResponse = await response.json()
    if (!parsedResponse.success) return { success: false, message: [parsedResponse.message, parsedResponse.reason] }

    return { success: true, message: "user_created" }
}

async function account_logout() {
    await fetch(URL+"/api/logout/", { method: "POST" })
    localStorage.removeItem("encryption_key")
    document.location.href = "/account/"
}

async function get_files() {
    return new Promise(async (resolve, reject) => {
        const response = await fetch("/api/files/", { method: "GET" })
        const parsed = await response.json()
        const encryption_key_hex = localStorage.getItem("encryption_key")

        if (!encryption_key_hex) resolve({ success: false, message: "authentication_required" })

        const encryption_key = await crypto.subtle.importKey(
            "raw",
            hexToArrayBuffer(encryption_key_hex),
            { name: "AES-GCM" },
            false,
            ["decrypt"]
        )

        for (const file of parsed.files) {
            const iv = hexToArrayBuffer(file.iv)
            const filename = await crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv: iv
                },
                encryption_key,
                hexToArrayBuffer(file.encrypted_filename)
            )
            file.filename = new TextDecoder().decode(filename)
        }

        resolve(parsed.files)
    })
}

async function delete_file(file_id) {
    const response = await fetch(`/api/files/${file_id}/`, {method: "DELETE"})
    return await response.json()
}