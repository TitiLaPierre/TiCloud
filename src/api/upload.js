import fs from "fs"
import crypto from "crypto"

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

    const upload_data = {
        is_completed: false,
        received_headers: false,
        iv: null,
        chunk_size: null,
        estimated_size: null,
        calculated_size: 0,
        encrypted_filename: null,
    }

    if (!request.isLogged) {
        ws.send(JSON.stringify({ success: false, message: "authentification_required" }))
        ws.close()
        return
    }

    let stream = fs.createWriteStream(`${UPLOAD_FOLDER}/${id}`, { flags: "a" })

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
            if (!data || !data.type) {
                ws.send(JSON.stringify({ success: false, message: "invalid_request" }))
                ws.close()
                return
            }
            if (data.type === "start_upload") {
                if (!data.encrypted_filename || !data.iv || !data.auth_tag_length || !data.chunk_size || !data.estimated_size) {
                    ws.send(JSON.stringify({ success: false, message: "invalid_request" }))
                    ws.close()
                    return
                }
                if (upload_data.received_headers) {
                    ws.send(JSON.stringify({ success: false, message: "invalid_request" }))
                    ws.close()
                    return
                }
                if (upload_data.estimated_size+user.used_space > user.allocated_space) {
                    ws.send(JSON.stringify({ success: false, message: "quota_exceeded" }))
                    ws.close()
                    return
                }
                upload_data.received_headers = true
                upload_data.iv = data.iv
                upload_data.auth_tag_length = data.auth_tag_length
                upload_data.chunk_size = data.chunk_size
                upload_data.estimated_size = data.estimated_size
                upload_data.encrypted_filename = data.encrypted_filename
                return
            } else if (data.type === "end_upload") {
                if (stream === null) {
                    ws.send(JSON.stringify({ success: false, message: "invalid_request" }))
                    ws.close()
                    return
                }
                stream.end(async () => {
                    const updated_user = await database.queryFirst("SELECT * FROM users WHERE id = ?", [user.id])
                    if (upload_data.calculated_size+updated_user.used_space > updated_user.allocated_space) {
                        ws.send(JSON.stringify({ success: false, message: "quota_exceeded" }))
                        ws.close()
                        return
                    }
                    upload_data.is_completed = true
                    await database.queryFirst("UPDATE users SET used_space = used_space + ? WHERE id = ?", [upload_data.calculated_size, user.id])
                    await database.queryFirst("INSERT INTO files (id, iv, auth_tag_length, chunk_size, size, encrypted_filename, user_id, creation_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
                        id,
                        upload_data.iv,
                        upload_data.auth_tag_length,
                        upload_data.chunk_size,
                        upload_data.calculated_size,
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
        } else if (stream === null || !upload_data.received_headers) {
            ws.send(JSON.stringify({ success: false, message: "invalid_request" }))
            ws.close()
            return
        }
        const buffer = Buffer.from(event.data)
        upload_data.calculated_size += buffer.length
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

    ws.send(JSON.stringify({ success: true, message: "ready_for_upload", file_id: id }))
}