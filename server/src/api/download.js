import fs from "fs"
import { UPLOAD_FOLDER } from "../utils/utils.js"

export async function route_download(ws, request) {
    const { database, user } = request
    const fileId = request.params.fileId

    if (!request.isLogged) {
        ws.send(JSON.stringify({ success: false, message: "authentification_required" }))
        ws.close()
        return
    }

    const file = await database.queryFirst("SELECT * FROM files WHERE id = ? AND user_id = ?", [fileId, user.id])
    if (!file) {
        ws.send(JSON.stringify({ success: false, message: "file_not_found" }))
        ws.close()
        return
    }

    if (!fs.existsSync(`${UPLOAD_FOLDER}/${fileId}`)) {
        ws.send(JSON.stringify({ success: false, message: "file_not_found" }))
        ws.close()
        return
    }

    const chunkSize = file.chunk_size+file.auth_tag_length
    let stream = fs.createReadStream(`${UPLOAD_FOLDER}/${fileId}`, { flags: "r" , highWaterMark: chunkSize })

    stream.on("error", (error) => {
        console.error("Error reading file stream:", error)
        ws.send(JSON.stringify({ success: false, message: "internal_error" }))
        ws.close()
    })

    stream.on("data", (chunk) => {
        ws.send(chunk)
    })

    stream.on("end", () => {
        ws.send(JSON.stringify({ success: true, message: "end_download" }))
    })
}