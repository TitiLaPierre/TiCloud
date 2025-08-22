import fs from "fs"

const UPLOAD_FOLDER = "uploads"

export async function route_files(request, response) {
    const { database, session, user } = request

    if (!session) {
        response.sendJSON(401, { success: false, message: "authentification_required" })
        return
    }

    const files = await database.queryAll("SELECT * FROM files WHERE user_id = ?", [user.id])
    const output = files.map(file => ({
        id: file.id,
        iv: file.iv,
        encrypted_filename: file.encrypted_filename,
        chunk_size: file.chunk_size,
        size: file.size,
        creation_date: file.creation_date,
        hasPreview: file.preview_id !== null,
    }))

    response.sendJSON(200, { success: true, message: "files_fetched", files: output })
}

export async function route_file_get(request, response) {
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

    const output = {
        id: file.id,
        iv: file.iv,
        encrypted_filename: file.encrypted_filename,
        chunk_size: file.chunk_size,
        size: file.size,
        creation_date: file.creation_date,
        hasPreview: file.preview_id !== null,
    }
    response.sendJSON(200, { success: true, message: "file_fetched", file: output })
}

export async function route_file_delete(request, response) {
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

    if (fs.existsSync(`${UPLOAD_FOLDER}/${file.id}`)) {
        fs.unlinkSync(`${UPLOAD_FOLDER}/${file.id}`)
    }

    await database.queryFirst("UPDATE users SET used_space = used_space - ? WHERE id = ?", [file.size, user.id])
    await database.queryFirst("DELETE FROM files WHERE id = ?", [fileId])
    response.sendJSON(200, { success: true, message: "file_deleted" })
}