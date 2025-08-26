import { randomUUID } from "crypto"
import { UAParser } from "ua-parser-js"

export async function route_login(request, response) {
    const {database, session} = request
    const {username, hashed_master_key} = request.body

    if (!username || !hashed_master_key) {
        response.sendJSON(400, {success: false, message: "invalid_request"})
        return
    }

    const user = await database.queryFirst("SELECT * FROM users WHERE UPPER(username) = UPPER(?) AND hashed_master_key = ?", [username, hashed_master_key])
    if (!user) {
        response.sendJSON(400, {success: false, message: "invalid_credentials"})
        return
    }

    if (session) {
        await database.queryFirst("DELETE FROM sessions WHERE token = ?", [session.token])
    }

    const ip = request.ip
    const parser = new UAParser(request.headers["user-agent"])
    const result = parser.getResult()

    const geo = await fetch(`https://ip-api.com/json/${ip}?fields=16401&lang=fr`).then(res => res.json()).catch(() => null)

    const sessionFields = [
        {name: "country", value: geo?.country || null},
        {name: "city", value: geo?.city || null},
        {name: "browser_name", value: result?.browser.name || null},
        {name: "browser_version", value: result?.browser.version || null},
        {name: "os_name", value: result?.os.name || null},
        {name: "os_version", value: result?.os.version || null},
    ]
    let whereClause = "user_id = ?"
    let params = [user.id]
    for (const field of sessionFields) {
        if (field.value === null) {
            whereClause += ` AND ${field.name} IS NULL`
        } else {
            whereClause += ` AND ${field.name} = ?`
            params.push(field.value)
        }
    }
    await database.queryFirst(`DELETE FROM sessions WHERE ${whereClause}`, params)

    const token = randomUUID()
    await database.queryFirst("INSERT INTO sessions (user_id, token, ip, country, city, browser_name, browser_version, os_name, os_version, creation_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [
        user.id,
        token,
        ip,
        geo?.country || null,
        geo?.city || null,
        result?.browser.name || null,
        result?.browser.version || null,
        result?.os.name || null,
        result?.os.version || null,
        Math.floor(Date.now() / 1000),
    ])

    response.cookie("token", token, {maxAge: 1000 * 3600 * 24 * 7, sameSite: "strict"})
    response.sendJSON(200, {
        success: true,
        message: "logged_in",
        encrypted_encryption_key: user.encrypted_encryption_key,
        iv: user.iv,
        tag: user.tag
    })
}