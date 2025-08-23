import {AUTH_TAG_LENGTH, url} from "~/utils/utils.js"
import {bufferToHex, hexToArrayBuffer} from "~/utils/encryption.js"
import axios from "axios"

export async function get_preview(file_id, signal) {
    try {
        const encryption_key_hex = localStorage.getItem("encryption_key")
        if (!encryption_key_hex) {
            return { success: false, message: "authentication_required" }
        }

        const encryption_key = await crypto.subtle.importKey(
            "raw",
            hexToArrayBuffer(encryption_key_hex),
            { name: "AES-GCM" },
            false,
            ["decrypt"]
        )

        const response = await axios.get(url(`/api/preview/${file_id}/`), { signal })
        if (!response.data.success) {
            return { success: false, message: response.data.message }
        }

        const iv = hexToArrayBuffer(response.data.iv)
        response.data = new TextDecoder().decode(await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv,
            },
            encryption_key,
            hexToArrayBuffer(response.data.encrypted_data)
        ))

        return { success: true, data: response.data }
    } catch (error) {
        return { success: false, message: "error_fetching_preview" }
    }
}

export async function upload_preview(file_id, base64, encryption_key_hex, endpoint_url) {
    try {
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

        const encrypted_base64 = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv,
                tagLength: AUTH_TAG_LENGTH*8,
            },
            encryption_key,
            new TextEncoder().encode(base64)
        )

        const response = await axios.post(endpoint_url, { encrypted_data: bufferToHex(encrypted_base64), iv: bufferToHex(iv) })
        if (!response.data.success) {
            return { success: false, message: response.data.message }
        }

        return { success: true, message: "preview_uploaded" }
    } catch (error) {
        console.error(error)
        return { success: false, message: "error_uploading_preview" }
    }
}