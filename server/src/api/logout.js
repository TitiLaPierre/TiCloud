export async function route_logout(request, response) {
    const { database, session } = request

    if (!session) {
        response.sendJSON(401, { success: false, message: "authentification_required" })
        return
    }

    await database.queryFirst("DELETE FROM sessions WHERE token = ?", [session.token])
    response.clearCookie("token")

    response.sendJSON(200, { success: true, message: "logged_out" })
}