export async function route_session(request, response) {
    const { user, session } = request

    if (!session) {
        response.sendJSON(401, { success: false, message: "authentification_required" })
        return
    }

    response.sendJSON(200, { success: true, message: "valid_session", user: {
        username: user.username,
        creation_date: user.creation_date,
        allocated_space: user.allocated_space,
        used_space: user.used_space,
    }, session: {
        creation_date: session.creation_date,
        expire: session.creation_date+60*60*24*7 // 7 days
    }})
}