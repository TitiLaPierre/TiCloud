import bcrypt from "bcrypt"
import { randomUUID } from "crypto"

export async function route_prelogin(request, response) {
    const { database } = request
    const { username } = request.body

    if (!username) {
        response.sendJSON(400, { success: false, message: "invalid_request" })
        return
    }

    const user = await database.queryFirst("SELECT * FROM users WHERE UPPER(username) = UPPER(?)", [username])
    if (!user) {
        response.sendJSON(400, { success: false, message: "invalid_username" })
        return
    }
    response.sendJSON(200, { success: true, message: "account_fount", salt: user.salt })
}