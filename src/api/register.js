import crypto from "crypto"

export async function route_register(request, response) {
    const { database } = request
    let { username, password } = request.body
    username = username.trim().replaceAll(/\s+/g, " ")

    if (!username || !password) {
        response.sendJSON(400, { success: false, message: "invalid_request" })
        return
    }

    const user = await database.queryFirst("SELECT * FROM users WHERE UPPER(username) = UPPER(?)", [username])
    if (user) {
        response.sendJSON(400, { success: false, message: "already_existing_user" })
        return
    }

    const usernameChecks = [
        { regex: /^[a-z\d]/i, reason: "not_starting_with_alphanumeric" },
        { regex: /^.{3,}$/, reason: "too_short" },
        { regex: /^.{0,24}$/, reason: "too_long" },
        { regex: /^[a-z\d _-]+$/i, reason: "unauthorized_character" },
    ]

    for (let check of usernameChecks) {
        if (!username.match(check.regex)) {
            response.sendJSON(400, { success: false, message: "invalid_username", reason: check.reason })
            return
        }
    }

    const passwordChecks = [
        { regex: /^.{6,}$/, reason: "too_short" },
        { regex: /^.{0,100}$/, reason: "too_long" },
        { regex: /[A-Z]/, reason: "require_uppercase" },
        { regex: /[a-z]/, reason: "require_lowercase" },
        { regex: /\d/, reason: "require_number" },
        { regex: /[!@#$%^&*()_+\-=\[\]{};':"|,.<>\/?]/, reason: "require_special_character" },
        { regex: /^[a-z\d!@#$%^&*()_+\-=\[\]{};':"|,.<>\/?]+$/i, reason: "unauthorized_character" },
    ]

    for (let check of passwordChecks) {
        if (!password.match(check.regex)) {
            response.sendJSON(400, { success: false, message: "invalid_password", reason: check.reason })
            return
        }
    }

    const salt = crypto.randomBytes(16)
    const master_key = crypto.pbkdf2Sync(password, salt, 100_000, 32, "sha256")
    const hashed_master_key = crypto.createHash("sha256").update(master_key).digest("hex")

    const encryption_key = crypto.randomBytes(32)
    const iv = crypto.randomBytes(12)

    const cipher = crypto.createCipheriv("aes-256-gcm", master_key, iv)
    const encrypted_encryption_key = Buffer.concat([cipher.update(encryption_key), cipher.final()])
    const tag = cipher.getAuthTag()

    await request.database.queryFirst("INSERT INTO users (username, hashed_master_key, salt, encrypted_encryption_key, tag, iv, creation_date) VALUES (?, ?, ?, ?, ?, ?, ?)", [
        username,
        hashed_master_key,
        salt.toString("hex"),
        encrypted_encryption_key.toString("hex"),
        tag.toString("hex"),
        iv.toString("hex"),
        new Date().getTime()/1000,
    ])

    const newUser = await request.database.queryFirst("SELECT * FROM users WHERE username = ?", [username])
    if (!newUser) {
        response.sendJSON(500, { success: false, message: "user_creation_failed" })
        return
    }

    response.sendJSON(200, { success: true, message: "user_created" })
}