import fs from "fs"
import crypto from "crypto";

const UPLOAD_FOLDER = "uploads"

export async function route_upload(ws, request) {
    const id = crypto.randomUUID()
    let stream = null

    if (!request.isLogged) {
        ws.send(JSON.stringify({ success: false, message: "authentification_required" }))
        ws.close()
        return
    }

    ws.send(JSON.stringify({ success: true, message: "ready_for_upload" }))
    ws.addEventListener("message", async (event) => {
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
                if (!data.filename || typeof data.filename !== "string" || /^(?! +$)(?![.]+$)[^\x00-\x1F\x7F\\\/:*?"<>|]{1,215}$/.test(data.filename) === false) {
                    ws.send(JSON.stringify({ success: false, message: "invalid_request" }))
                    ws.close()
                    return
                }
                const source_filename = data.filename
                if (!fs.existsSync(UPLOAD_FOLDER)) {
                    fs.mkdirSync(UPLOAD_FOLDER, { recursive: true })
                }
                if (fs.existsSync(`${UPLOAD_FOLDER}/${source_filename}`)) {
                    fs.unlinkSync(`${UPLOAD_FOLDER}/${source_filename}`)
                }
                stream = fs.createWriteStream(`${UPLOAD_FOLDER}/${source_filename}`, { flags: "a" })
                return
            } else if (data.type === "end_upload") {
                if (stream === null) {
                    ws.send(JSON.stringify({ success: false, message: "invalid_request" }))
                    ws.close()
                    return
                }
                stream.end(() => {
                    ws.send(JSON.stringify({ success: true, message: "file_uploaded" }))
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
            } else {
                ws.send(JSON.stringify({ success: true, message: "chunk_received" }))
            }
        })
    })
}