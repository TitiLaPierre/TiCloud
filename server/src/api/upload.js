import fs from "fs"
import crypto from "crypto"
import { UPLOAD_FOLDER } from "../utils/utils.js"

export async function route_upload(ws, request) {
    const { database, user } = request

    function deleteFile(id) {
        if (fs.existsSync(`${UPLOAD_FOLDER}/${id}`)) {
            fs.unlinkSync(`${UPLOAD_FOLDER}/${id}`)
        }
    }

    if (!fs.existsSync(UPLOAD_FOLDER)) fs.mkdirSync(UPLOAD_FOLDER, { recursive: true })

    if (!request.isLogged) {
        ws.send(JSON.stringify({ success: false, message: "authentification_required" }))
        ws.close()
        return
    }

    let upload_data
    const resetUploadData = () => {
        const id = crypto.randomUUID()
        upload_data = {
            id,
            is_completed: false,
            received_headers: false,
            iv: null,
            chunk_size: null,
            estimated_size: null,
            calculated_size: 0,
            encrypted_filename: null,
            stream: null,
        }
    }
     resetUploadData()

    ws.addEventListener("message", async (event) => {
        if (typeof event.data === "string") {
            let data
            try {
                data = JSON.parse(event.data)
            } catch (error) {
                ws.send(JSON.stringify({success: false, message: "invalid_request"}))
                resetUploadData()
                ws.send(JSON.stringify({success: true, message: "ready_for_upload", file_id: upload_data.id}))
                return
            }
            if (!data?.type) {
                ws.send(JSON.stringify({success: false, message: "invalid_request"}))
                resetUploadData()
                ws.send(JSON.stringify({success: true, message: "ready_for_upload", file_id: upload_data.id}))
                return
            }
            if (data.type === "start_upload") {
                if (!data.encrypted_filename || !data.iv || !data.auth_tag_length || !data.chunk_size || !data.estimated_size) {
                    ws.send(JSON.stringify({success: false, message: "invalid_request"}))
                    resetUploadData()
                    ws.send(JSON.stringify({success: true, message: "ready_for_upload", file_id: upload_data.id}))
                    return
                }
                if (upload_data.estimated_size + user.used_space > user.allocated_space) {
                    ws.send(JSON.stringify({success: false, message: "quota_exceeded"}))
                    resetUploadData()
                    ws.send(JSON.stringify({success: true, message: "ready_for_upload", file_id: upload_data.id}))
                    return
                }
                if (upload_data.received_headers) {
                    ws.send(JSON.stringify({success: false, message: "invalid_request"}))
                    resetUploadData()
                    ws.send(JSON.stringify({success: true, message: "ready_for_upload", file_id: upload_data.id}))
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
                if (upload_data.stream === null || !upload_data.received_headers) {
                    ws.send(JSON.stringify({success: false, message: "invalid_request"}))
                    resetUploadData()
                    ws.send(JSON.stringify({success: true, message: "ready_for_upload", file_id: upload_data.id}))
                    return
                }
                upload_data.is_completed = true
                upload_data.stream.end(async () => {
                    const updated_user = await database.queryFirst("SELECT * FROM users WHERE id = ?", [user.id])
                    if (upload_data.calculated_size + updated_user.used_space > updated_user.allocated_space) {
                        ws.send(JSON.stringify({success: false, message: "quota_exceeded"}))
                        resetUploadData()
                        ws.send(JSON.stringify({success: true, message: "ready_for_upload", file_id: upload_data.id}))
                        return
                    }
                    await database.queryFirst("UPDATE users SET used_space = used_space + ? WHERE id = ?", [upload_data.calculated_size, user.id])
                    await database.queryFirst("INSERT INTO files (id, iv, auth_tag_length, chunk_size, size, encrypted_filename, user_id, creation_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
                        upload_data.id,
                        upload_data.iv,
                        upload_data.auth_tag_length,
                        upload_data.chunk_size,
                        upload_data.calculated_size,
                        upload_data.encrypted_filename,
                        user.id,
                        new Date().getTime() / 1000,
                    ])

                    const file = await database.queryFirst("SELECT * FROM files WHERE id = ?", [upload_data.id])
                    if (!file) {
                        deleteFile(upload_data.id)
                    }
                    ws.send(JSON.stringify({success: true, message: "file_uploaded", file}))
                    resetUploadData()
                    ws.send(JSON.stringify({success: true, message: "ready_for_upload", file_id: upload_data.id}))
                })
                return
            }
        } else if (!upload_data.received_headers) {
            ws.send(JSON.stringify({ success: false, message: "invalid_request" }))
            resetUploadData()
            ws.send(JSON.stringify({ success: true, message: "ready_for_upload", file_id: upload_data.id }))
            return
        }
        if (upload_data.stream === null) {
            upload_data.stream = fs.createWriteStream(`${UPLOAD_FOLDER}/${upload_data.id}`)
        }
        const buffer = Buffer.from(event.data)
        upload_data.calculated_size += buffer.length
        upload_data.stream.write(buffer, (error) => {
            if (error) {
                ws.send(JSON.stringify({ success: false, message: "internal_error" }))
                ws.close()
            }
        })
    })
    ws.addEventListener("close", async () => {
        if (!upload_data.is_completed && upload_data.received_headers) {
            console.warn("Upload was not completed, deleting file")
            if (upload_data.stream !== null && !upload_data.stream.destroyed) {
                upload_data.stream.close(() => deleteFile(upload_data.id))
            } else {
                deleteFile(upload_data.id)
            }
        }
    })

    ws.send(JSON.stringify({ success: true, message: "ready_for_upload", file_id: upload_data.id }))
}