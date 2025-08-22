import axios from "axios"
import { deriveMasterKey, hashMasterKey, bufferToHex, hexToArrayBuffer } from "~/utils/encryption.js"
import {url} from "~/utils/utils.js"

export async function account_login(username, password) {
    try {
        username = username?.trim()
        if (!username || !password) {
            return { success: false, message: "invalid_fields" }
        }

        const preLoginResponse = await axios.post(url("api/prelogin/"), { username })
        if (!preLoginResponse.data.success) {
            return { success: false, message: preLoginResponse.data.message || "prelogin_failed" }
        }

        const { salt } = preLoginResponse.data
        const master_key_buffer = await deriveMasterKey(password, salt)
        const hashed_master_key = await hashMasterKey(master_key_buffer)
        const master_key = await crypto.subtle.importKey(
            "raw",
            master_key_buffer,
            { name: "AES-GCM" },
            false,
            ["decrypt"]
        )

        const loginResponse = await axios.post(url("api/login/"), { username, hashed_master_key })
        if (!loginResponse.data.success) {
            return { success: false, message: loginResponse.data.message || "login_failed" }
        }

        const iv = hexToArrayBuffer(loginResponse.data.iv)
        const tag = hexToArrayBuffer(loginResponse.data.tag)
        const encrypted = hexToArrayBuffer(loginResponse.data.encrypted_encryption_key)

        const data = new Uint8Array([...new Uint8Array(encrypted), ...new Uint8Array(tag)])

        const decrypted = await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv,
                tagLength: 128
            },
            master_key,
            data
        )

        const encryption_key = new Uint8Array(decrypted)
        localStorage.setItem("encryption_key", bufferToHex(encryption_key))
        return { success: true, message: "logged_in" }
    } catch (error) {
        return { success: false, message: error.response?.data?.message || "login_failed" }
    }
}

export async function account_register(username, password) {
    try {
        username = username?.trim()
        if (!username || !password) {
            return { success: false, message: "invalid_fields" }
        }

        const registerResponse = await axios.post(url("api/register/"), { username, password })
        if (!registerResponse.data.success) {
            return { success: false, message: registerResponse.data.message || "register_failed" }
        }

        return { success: true, message: "user_created" }
    } catch (error) {
        return { success: false, message: error.response?.data?.message || "register_failed" }
    }
}

export async function account_logout() {
    try {
        const encryption_key = localStorage.getItem("encryption_key")
        if (!encryption_key) {
            return { success: true, message: "logged_out" }
        }

        const logoutResponse = await axios.post(url("api/logout/"))
        if (!logoutResponse.data.success) {
            return { success: false, message: logoutResponse.data.message || "logout_failed" }
        }

        localStorage.removeItem("encryption_key")
        return { success: true, message: "logged_out" }
    } catch (error) {
        return { success: false, message: error.response?.data?.message || "logout_failed" }
    }
}