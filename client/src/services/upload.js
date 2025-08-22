import {AUTH_TAG_LENGTH, UPLOAD_CHUNK_SIZE} from "~/utils/utils.js"
import {bufferToHex, hexToArrayBuffer, incrementIV} from "~/utils/encryption.js"

export async function upload_file(socket, nextUploadId, file, setProgress) {
    try {

        let newFile = null

        const filename = file.name
        const encryption_key_hex = localStorage.getItem("encryption_key")
        if (!encryption_key_hex) {
            return { success: false, message: "authentication_required" }
        }

        const encryption_key = await crypto.subtle.importKey(
            "raw",
            hexToArrayBuffer(encryption_key_hex),
            { name: "AES-GCM" },
            false,
            ["encrypt"]
        )

        const iv = crypto.getRandomValues(new Uint8Array(12))

        const encrypted_filename = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv,
                tagLength: AUTH_TAG_LENGTH*8,
            },
            encryption_key,
            new TextEncoder().encode(filename)
        )

        const estimated_size = file.size + Math.ceil(file.size/UPLOAD_CHUNK_SIZE)*AUTH_TAG_LENGTH
        newFile = {
            id: nextUploadId,
            iv: bufferToHex(iv),
            auth_tag_length: AUTH_TAG_LENGTH,
            filename,
            encrypted_filename: bufferToHex(encrypted_filename),
            chunk_size: UPLOAD_CHUNK_SIZE,
            size: estimated_size,
            creation_date: new Date().getTime()/1000,
        }

        socket.send(JSON.stringify({ type: "start_upload", encrypted_filename: bufferToHex(encrypted_filename), iv: bufferToHex(iv), auth_tag_length: AUTH_TAG_LENGTH, chunk_size: UPLOAD_CHUNK_SIZE, estimated_size }))

        const chunkCount = Math.ceil(file.size/UPLOAD_CHUNK_SIZE)
        setProgress(0)
        for (let i = 0; i < chunkCount; i++) {
            if (socket.readyState !== WebSocket.OPEN) {
                throw new Error("websocket_closed")
            }
            const chunk = await file.slice(i*UPLOAD_CHUNK_SIZE, Math.min((i+1)*UPLOAD_CHUNK_SIZE, file.size)).arrayBuffer()
            incrementIV(iv)

            const encrypted = await crypto.subtle.encrypt(
                {
                    name: "AES-GCM",
                    iv: iv,
                    tagLength: AUTH_TAG_LENGTH*8,
                },
                encryption_key,
                chunk
            )

            socket.send(encrypted)
            setProgress(i*100/chunkCount)
        }

        socket.send(JSON.stringify({ type: "end_upload" }))

        setProgress(100)
        return { success: true, message: "file_uploaded", file: newFile }
    } catch (error) {
        return { success: false, message: error.message || "file_upload_failed" }
    }
}