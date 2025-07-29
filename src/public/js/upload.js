const CHUNK_SIZE = 1024*1024*5 // 5 Mo

async function upload_file(file, progressCallback) {
    return new Promise(async (resolve, reject) => {
        let newFile = null

        const filename = file.name
        const encryption_key_hex = localStorage.getItem("encryption_key")

        if (!encryption_key_hex) resolve({ success: false, message: "authentication_required" })

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
                iv: iv
            },
            encryption_key,
            new TextEncoder().encode(filename)
        )

        const socket = new WebSocket(URL + "/api/upload/")
        socket.binaryType = "arraybuffer"

        socket.addEventListener("message", async function(event) {
            const response = JSON.parse(event.data)
            if (response.message === "ready_for_upload") {
                console.info("Envoi du fichier en cours...")
                newFile = {
                    id: response.file_id,
                    iv: bufferToHex(iv),
                    filename,
                    encrypted_filename: bufferToHex(encrypted_filename),
                    chunk_size: CHUNK_SIZE,
                    size: file.size,
                    creation_date: file.creation_date,
                }
                socket.send(JSON.stringify({ type: "start_upload", encrypted_filename: bufferToHex(encrypted_filename), iv: bufferToHex(iv), chunk_size: CHUNK_SIZE, size: file.size }))
                incrementIV(iv)
                await sendChunks()
                console.info("Fichier envoyé avec succès")
                socket.send(JSON.stringify({ type: "end_upload" }))
                resolve({ success: true, message: "file_uploaded", file: newFile })
            }
            console.warn(response.message)
        })

        socket.addEventListener("error", (event) => console.error("Une erreur de connexion est survenue", event))

        async function sendChunks() {
            const chunkCount = Math.ceil(file.size/CHUNK_SIZE)
            progressCallback(0)
            for (let i = 0; i < chunkCount; i++) {
                const chunk = await file.slice(i*CHUNK_SIZE, Math.min((i+1)*CHUNK_SIZE, file.size)).arrayBuffer()

                const encrypted = await crypto.subtle.encrypt(
                    {
                        name: "AES-GCM",
                        iv: iv
                    },
                    encryption_key,
                    chunk
                )
                socket.send(encrypted)
                incrementIV(iv)
                progressCallback(i*100/chunkCount)
            }
            progressCallback(100)
        }
    })
}