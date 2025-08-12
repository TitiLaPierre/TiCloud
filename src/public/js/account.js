async function account_login(username, password) {
    if (!username || !password) return { success: false, message: "invalid_fields" }

    const preLoginResponse = await fetch(SITE_URL+"/api/prelogin/", {
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

    const loginResponse = await fetch(SITE_URL+"/api/login/", {
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
    const response = await fetch(SITE_URL+"/api/register/", {
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
    await fetch(SITE_URL+"/api/logout/", { method: "POST" })
    localStorage.removeItem("encryption_key")
    document.location.href = "/account/"
}

async function get_files() {
    return new Promise(async (resolve) => {
        const response = await fetch(SITE_URL+"/api/files/", { method: "GET" })
        const parsed = await response.json()
        const encryption_key_hex = localStorage.getItem("encryption_key")

        if (!encryption_key_hex) {
            resolve({ success: false, message: "authentication_required" })
            return
        }

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
    const response = await fetch(SITE_URL+`/api/files/${file_id}/`, {method: "DELETE"})
    return await response.json()
}

async function get_preview(file_id) {
    return new Promise(async (resolve) => {
        const encryption_key_hex = localStorage.getItem("encryption_key")

        if (!encryption_key_hex) {
            resolve({ success: false, message: "authentication_required" })
            return
        }

        const encryption_key = await crypto.subtle.importKey(
            "raw",
            hexToArrayBuffer(encryption_key_hex),
            { name: "AES-GCM" },
            false,
            ["decrypt"]
        )

        const response = await (await fetch(SITE_URL+`/api/preview/${file_id}/`, { method: "GET" })).json()
        if (!response.success || !response.encrypted_data || !response.iv) {
            resolve({ success: false, message: response.message })
            return
        }

        const iv = hexToArrayBuffer(response.iv)
        response.data = new TextDecoder().decode(await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv,
            },
            encryption_key,
            hexToArrayBuffer(response.encrypted_data)
        ))

        resolve(response)
    })
}

async function upload_preview(file_id, base64) {
    return new Promise(async (resolve) => {
        const encryption_key_hex = localStorage.getItem("encryption_key")

        if (!encryption_key_hex) {
            resolve({ success: false, message: "authentication_required" })
            return
        }

        const encryption_key = await crypto.subtle.importKey(
            "raw",
            hexToArrayBuffer(encryption_key_hex),
            { name: "AES-GCM" },
            false,
            ["encrypt"]
        )

        const iv = crypto.getRandomValues(new Uint8Array(12))

        const encrypted_base64 = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv,
                tagLength: AUTH_TAG_LENGTH*8,
            },
            encryption_key,
            new TextEncoder().encode(base64)
        )

        const response = await fetch(SITE_URL+`/api/preview/${file_id}/`, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({ encrypted_data: bufferToHex(encrypted_base64), iv: bufferToHex(iv) })
        })

        const parsedResponse = await response.json()
        if (!parsedResponse.success) {
            resolve({ success: false, message: parsedResponse.message })
            return
        }
        resolve({ success: true, message: "preview_uploaded" })
    })
}