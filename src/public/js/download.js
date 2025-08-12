async function download_file(fileId) {
    return new Promise(async (resolve) => {
        const encryption_key_hex = localStorage.getItem("encryption_key")

        if (!encryption_key_hex) {
            resolve({ success: false, message: "authentication_required" })
            return
        }

        const encryption_key = await crypto.subtle.importKey(
            "raw",
            hexToArrayBuffer(encryption_key_hex),
            { name: "AES-GCM" },
            false,
            ["decrypt"]
        )

        const fileDataResponse = await (await fetch(SITE_URL+`/api/files/${fileId}/`, { method: "GET" })).json()
        const fileData = fileDataResponse.file

        const iv = new Uint8Array(hexToArrayBuffer(fileData.iv))

        const filename = new TextDecoder().decode(await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            encryption_key,
            hexToArrayBuffer(fileData.encrypted_filename)
        ))

        const socket = new WebSocket(SITE_URL+ `/api/download/${fileId}/`)
        socket.binaryType = "arraybuffer"

        const readableStream = new ReadableStream({
            start(controller) {
                socket.addEventListener("message", async function (event) {
                    if (event.data instanceof ArrayBuffer) {
                        incrementIV(iv)
                        const decryptedData = await crypto.subtle.decrypt(
                            {
                                name: "AES-GCM",
                                iv: iv,
                            },
                            encryption_key,
                            event.data
                        )
                        controller.enqueue(new Uint8Array(decryptedData))
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
                    resolve({ success: false, message: "connection_error" })
                    socket.close()
                })
                socket.addEventListener("close", () => {
                    controller.close()
                })
            }
        })

        const writable = streamSaver.createWriteStream(filename, { size: fileData.size })

        await readableStream.pipeTo(writable)
    })
}