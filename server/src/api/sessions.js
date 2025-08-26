export async function route_sessions(request, response) {
    const { user, database, session } = request

    if (!session) {
        response.sendJSON(401, { success: false, message: "authentification_required" })
        return
    }

    const sessions = await database.queryAll("SELECT * FROM sessions WHERE user_id = ?", [user.id])

    response.sendJSON(200, { success: true, message: "valid_session", sessions: sessions.map(old => ({
        ip: old.ip,
        country: old.country,
        city: old.city,
        browser_name: old.browser_name,
        browser_version: old.browser_version,
        os_name: old.os_name,
        os_version: old.os_version,
        creation_date: old.creation_date,
        active: old.token === session.token,
    }))})
}