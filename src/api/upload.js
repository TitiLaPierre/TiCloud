import fs from "fs"
import crypto from "crypto";

const UPLOAD_FOLDER = "uploads"

export async function route_upload(ws, request) {
    const { database, user } = request
    const id = crypto.randomUUID()

    function deleteFile() {
        if (fs.existsSync(`${UPLOAD_FOLDER}/${id}`)) {
            fs.unlinkSync(`${UPLOAD_FOLDER}/${id}`)
        }
    }

    if (!fs.existsSync(UPLOAD_FOLDER)) fs.mkdirSync(UPLOAD_FOLDER, { recursive: true })
    deleteFile()

    let stream = fs.createWriteStream(`${UPLOAD_FOLDER}/${id}`, { flags: "a" })

    const upload_data = {
        is_completed: false,
        received_headers: false,
        iv: null,
        chunk_size: null,
        size: null,
        encrypted_filename: null,
    }

    if (!request.isLogged) {
        ws.send(JSON.stringify({ success: false, message: "authentification_required" }))
        ws.close()
        return
    }

    ws.addEventListener("message", async (event) => {
        if (upload_data.is_completed) return
        if (typeof event.data === "string") {
            let data
            try {
                data = JSON.parse(event.data)
            } catch (error) {
                ws.send(JSON.stringify({ success: false, message: "invalid_request" }))
                ws.close()
                return
            }
            if (!data) {
                ws.send(JSON.stringify({ success: false, message: "invalid_request" }))
                ws.close()
                return
            }
            if (data.type === "start_upload") {
                if (!data.encrypted_filename || !data.iv || !data.chunk_size || !data.size) {
                    ws.send(JSON.stringify({ success: false, message: "invalid_request" }))
                    ws.close()
                    return
                }
                if (upload_data.received_headers) {
                    ws.send(JSON.stringify({ success: false, message: "invalid_request" }))
                    ws.close()
                    return
                }
                upload_data.received_headers = true
                upload_data.iv = data.iv
                upload_data.chunk_size = data.chunk_size
                upload_data.size = data.size
                upload_data.encrypted_filename = data.encrypted_filename
                return
            } else if (data.type === "end_upload") {
                if (stream === null) {
                    ws.send(JSON.stringify({ success: false, message: "invalid_request" }))
                    ws.close()
                    return
                }
                stream.end(async () => {
                    upload_data.is_completed = true
                    await database.queryFirst("INSERT INTO files (id, iv, chunk_size, size, encrypted_filename, user_id, creation_date) VALUES (?, ?, ?, ?, ?, ?, ?)", [
                        id,
                        upload_data.iv,
                        upload_data.chunk_size,
                        upload_data.size,
                        upload_data.encrypted_filename,
                        user.id,
                        new Date().getTime()/1000,
                    ])

                    const file = await database.queryFirst("SELECT * FROM files WHERE id = ?", [id])
                    if (!file) {
                        deleteFile()
                    }
                    ws.close()
                })
                return
            }
        } else if (stream === null) {
            ws.send(JSON.stringify({ success: false, message: "invalid_request" }))
            ws.close()
            return
        }
        const buffer = Buffer.from(event.data)
        stream.write(buffer, (error) => {
            if (error) {
                ws.send(JSON.stringify({ success: false, message: "internal_error" }))
                ws.close()
            }
        })
    })
    ws.addEventListener("close", async () => {
        if (!upload_data.is_completed) {
                console.warn("Upload was not completed, deleting file")
            if (stream !== null && !stream.destroyed) {
                stream.close(deleteFile)
            } else {
                deleteFile()
            }
        }
    })

    ws.send(JSON.stringify({ success: true, message: "ready_for_upload" }))
}