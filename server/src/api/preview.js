export async function route_preview_get(request, response) {
    const { database, session, user } = request
    const fileId = request.params.fileId

    if (!session) {
        response.sendJSON(401, { success: false, message: "authentification_required" })
        return
    }

    const file = await database.queryFirst("SELECT * FROM files WHERE id = ? AND user_id = ?", [fileId, user.id])

    if (!file) {
        response.sendJSON(404, { success: false, message: "file_not_found" })
        return
    }

    if (!file.preview_id) {
        response.sendJSON(404, { success: false, message: "preview_not_found" })
        return
    }

    const preview = await database.queryFirst("SELECT * FROM previews WHERE id = ?", [file.preview_id])

    if (!preview) {
        response.sendJSON(404, { success: false, message: "preview_not_found" })
        return
    }

    response.sendJSON(200, { success: true, message: "preview_fetched", encrypted_data: preview.encrypted_data, iv: preview.iv })
}

export async function route_preview_post(request, response) {
    const { database, session, user } = request
    const { encrypted_data, iv } = request.body
    const fileId = request.params.fileId

    if (!session) {
        response.sendJSON(401, { success: false, message: "authentification_required" })
        return
    }

    if (!encrypted_data || typeof encrypted_data !== "string" || encrypted_data.length > 16777215 || !iv || typeof iv !== "string" || iv.length !== 24) {
        response.sendJSON(400, { success: false, message: "invalid_request" })
        return
    }
    const file = await database.queryFirst("SELECT * FROM files WHERE id = ? AND user_id = ?", [fileId, user.id])

    if (!file) {
        response.sendJSON(404, { success: false, message: "file_not_found" })
        return
    }

    if (file.preview_id) {
        await database.queryFirst("DELETE FROM previews WHERE id = ?", [file.preview_id])
    }

    await database.queryFirst("INSERT INTO previews (encrypted_data, iv, file_id) VALUES (?, ?, ?)", [encrypted_data, iv, fileId])
    const preview = await database.queryFirst("SELECT * FROM previews WHERE file_id = ?", [fileId])
    await database.queryFirst("UPDATE files SET preview_id = ? WHERE id = ?", [preview.id, fileId])

    if (!preview) {
        response.sendJSON(500, { success: false, message: "internal_error" })
        return
    }

    response.sendJSON(200, { success: true, message: "preview_created" })
}