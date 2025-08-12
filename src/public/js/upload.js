async function upload_file(file, progressCallback) {
    return new Promise(async (resolve) => {
        let newFile = null

        const filename = file.name
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

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const socket = new WebSocket(`${protocol}//${window.location.host}/api/upload/`)
        socket.binaryType = "arraybuffer"

        socket.addEventListener("message", async function(event) {
            const response = JSON.parse(event.data)
            if (response.message === "ready_for_upload") {
                console.info("Envoi du fichier en cours...")
                newFile = {
                    id: response.file_id,
                    iv: bufferToHex(iv),
                    auth_tag_length: AUTH_TAG_LENGTH,
                    filename,
                    encrypted_filename: bufferToHex(encrypted_filename),
                    chunk_size: CHUNK_SIZE,
                    size: file.size,
                    creation_date: new Date().getTime()/1000,
                }
                socket.send(JSON.stringify({ type: "start_upload", encrypted_filename: bufferToHex(encrypted_filename), iv: bufferToHex(iv), auth_tag_length: AUTH_TAG_LENGTH, chunk_size: CHUNK_SIZE, size: file.size }))
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
                progressCallback(i*100/chunkCount)
            }
            progressCallback(100)
        }
    })
}