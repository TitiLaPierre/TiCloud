import { sendJSON } from "../utils/response.js"

export function contextParser(database) {
    return async function contextParser(request, response, next) {
        request.database = database

        const token = request.cookies?.token

        request.user = null
        request.isLogged = false

        const session = await database.queryFirst("SELECT * FROM sessions WHERE token = ?", [token])
        if (session) {
            request.user = await database.queryFirst("SELECT * FROM users WHERE id = ?", [session.user_id])
            request.isLogged = true
        }

        response.sendJSON = sendJSON.bind(null, response)

        next()
    }
}

export function handleApi404(request, response) {
    response.sendJSON(404, { sucess: false, message: "unknown_route" })
}

export function apiErrorHandler(request, response, next) {
    try {
        next()
    } catch (e) {
        response.sendJSON(500, { success: false, message: "internal_error" })
    }
}