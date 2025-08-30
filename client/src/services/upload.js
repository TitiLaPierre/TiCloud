import {AUTH_TAG_LENGTH, UPLOAD_CHUNK_SIZE} from "~/utils/utils.js"
import {bufferToHex, EncryptionKey, hexToArrayBuffer, incrementIV} from "~/utils/encryption.js"

export async function upload_file(socket, nextFileId, file, encryption_key_hex, setProgress) {
    try {
        if (!encryption_key_hex) {
            return { success: false, message: "authentication_required" }
        }

        const encryption_key = await EncryptionKey.from(encryption_key_hex)

        const filename = file.name
        const { hex: encrypted_filename, iv } = await encryption_key.encrypt(filename)

        const estimated_size = file.size + Math.ceil(file.size/UPLOAD_CHUNK_SIZE)*AUTH_TAG_LENGTH

        let newFile = {
            id: nextFileId,
            iv: iv.hex,
            auth_tag_length: AUTH_TAG_LENGTH,
            filename,
            encrypted_filename,
            chunk_size: UPLOAD_CHUNK_SIZE,
            size: estimated_size,
            creation_date: new Date().getTime()/1000,
        }

        socket.send(JSON.stringify({ type: "start_upload", encrypted_filename: encrypted_filename, iv: iv.hex, auth_tag_length: AUTH_TAG_LENGTH, chunk_size: UPLOAD_CHUNK_SIZE, estimated_size }))

        setProgress(0)
        const chunkCount = Math.ceil(file.size/UPLOAD_CHUNK_SIZE)
        for (let i = 0; i < chunkCount; i++) {
            if (socket.readyState !== WebSocket.OPEN) {
                throw new Error("websocket_closed")
            }
            incrementIV(iv)

            const chunk = await file.slice(i*UPLOAD_CHUNK_SIZE, Math.min((i+1)*UPLOAD_CHUNK_SIZE, file.size)).arrayBuffer()
            const { uint8array: encrypted } = await encryption_key.encrypt(chunk, iv)
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