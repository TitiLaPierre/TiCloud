import {url} from "~/utils/utils.js"
import axios from "axios"
import {EncryptionKey, hexToArrayBuffer, IV} from "~/utils/encryption.js"

export async function get_files(abort) {
    try {
        const encryption_key_hex = localStorage.getItem("encryption_key")
        if (!encryption_key_hex) {
            return { success: false, message: "authentication_required" }
        }

        const response = await axios.get(url("/api/files/"), { signal: abort?.signal })
        if (!response.data.success) {
            return { success: false, message: response.data.message || "files_fetch_failed" }
        }

        const encryption_key = await EncryptionKey.from(encryption_key_hex)

        for (const file of response.data.files) {
            const iv = IV.from(file.iv)
            file.filename = await encryption_key.decryptAsText(file.encrypted_filename, iv)
        }

        return { success: true, files: response.data.files }
    } catch (error) {
        return { success: false, message: error.message || "files_fetch_failed" }
    }
}

export async function delete_file(file_id) {
    try {
        const encryption_key_hex = localStorage.getItem("encryption_key")
        if (!encryption_key_hex) {
            return { success: false, message: "authentication_required" }
        }

        const response = await axios.delete(url(`/api/files/${file_id}/`))
        if (!response.data.success) {
            return { success: false, message: response.data.message || "file_delete_failed" }
        }

        return { success: true, message: "file_deleted_successfully" }
    } catch (error) {
        return { success: false, message: error.message || "file_delete_failed" }
    }
}