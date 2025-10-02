import {EncryptionKey, hexToUint8Array, incrementIV, IV} from "@/utils/encryption.js"
import axios from "axios"
import streamSaver from "streamsaver"

export async function download_file(fileId) {
    try {
        const encryption_key_hex = localStorage.getItem("encryption_key")
        if (!encryption_key_hex) {
            return { success: false, message: "authentication_required" }
        }

        const encryption_key = await EncryptionKey.from(encryption_key_hex)

        const fileDataResponse = await axios.get(`/api/files/${fileId}/`)
        if (!fileDataResponse.data.success) {
            return { success: false, message: fileDataResponse.data.message || "internal_error" }
        }

        const fileData = fileDataResponse.data.file
        const iv = IV.from(fileData.iv)
        const filename = await encryption_key.decryptAsText(fileData.encrypted_filename, iv)

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const socket = new WebSocket(`${protocol}//${window.location.host}/api/download/${fileId}/`)
        socket.binaryType = "arraybuffer"

        const readableStream = new ReadableStream({
            start(controller) {
                socket.addEventListener("message", async function (event) {
                    if (event.data instanceof ArrayBuffer) {
                        iv.increment()
                        const decryptedData = await encryption_key.decryptAsUint8Array(event.data, iv)
                        controller.enqueue(decryptedData)
                    } else if (typeof event.data === "string") {
                        let data
                        try {
                            data = JSON.parse(event.data)
                        } catch (error) {
                            console.error("Erreur lors de la réception du message", error)
                            controller.error("internal_error")
                            socket.close()
                            return
                        }
                        if (data.message === "end_download") {
                            socket.close()
                        }
                    }
                })
                socket.addEventListener("error", (event) => {
                    console.error("Une erreur de connexion est survenue", event)
                    socket.close()
                    return { success: false, message: "connection_error" }
                })
                socket.addEventListener("close", () => {
                    controller.close()
                })
            }
        })

        const writable = streamSaver.createWriteStream(filename, { size: fileData.size })

        await readableStream.pipeTo(writable)
    } catch (error) {
        return { success: false, message: error.message || "internal_error" }
    }
}