import { randomUUID } from "crypto"

export async function route_login(request, response) {
    const { database } = request
    const { username, hashed_master_key } = request.body

    if (!username || !hashed_master_key) {
        response.sendJSON(400, { success: false, message: "invalid_request" })
        return
    }

    const user = await database.queryFirst("SELECT * FROM users WHERE UPPER(username) = UPPER(?) AND hashed_master_key = ?", [username, hashed_master_key])
    if (!user) {
        response.sendJSON(400, { success: false, message: "invalid_credentials" })
        return
    }
    const token = randomUUID()
    await database.queryFirst("INSERT INTO sessions (user_id, token, creation_date) VALUES (?, ?, ?)", [user.id, token, Math.floor(Date.now() / 1000)])
    response.cookie("token", token, { maxAge: 1000 * 3600 * 24 * 7, sameSite: "strict" })
    response.sendJSON(200, { success: true, message: "logged_in", encrypted_encryption_key: user.encrypted_encryption_key, iv: user.iv, tag: user.tag })
}