import {AUTH_TAG_LENGTH, url} from "~/utils/utils.js"
import {bufferToHex, EncryptionKey, hexToArrayBuffer, IV} from "~/utils/encryption.js"
import axios from "axios"

export async function get_preview(file_id, signal) {
    try {
        const encryption_key_hex = localStorage.getItem("encryption_key")
        if (!encryption_key_hex) {
            return { success: false, message: "authentication_required" }
        }

        const encryption_key = await EncryptionKey.from(encryption_key_hex)

        const response = await axios.get(url(`/api/preview/${file_id}/`), { signal })
        if (!response.data.success) {
            return { success: false, message: response.data.message }
        }

        const iv = IV.from(response.data.iv)
        const data = await encryption_key.decryptAsText(response.data.encrypted_data, iv)

        return { success: true, data }
    } catch (error) {
        return { success: false, message: "error_fetching_preview" }
    }
}

export async function upload_preview(file_id, base64, encryption_key_hex, endpoint_url) {
    try {
        if (!encryption_key_hex) {
            return { success: false, message: "authentication_required" }
        }

        const encryption_key = await EncryptionKey.from(encryption_key_hex)
        const { hex: encrypted_base64, iv } = await encryption_key.encrypt(base64)

        const response = await axios.post(endpoint_url, { encrypted_data: encrypted_base64, iv: iv.hex })
        if (!response.data.success) {
            return { success: false, message: response.data.message }
        }

        return { success: true, message: "preview_uploaded" }
    } catch (error) {
        console.error(error)
        return { success: false, message: "error_uploading_preview" }
    }
}