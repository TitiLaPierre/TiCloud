const fileInput = document.querySelector("#file--input")
const fileButton = document.querySelector("#file--button")
const progressBar = document.querySelector("#file--progress")

fileButton.addEventListener("click", async function() {
    if (fileInput.files.length !== 1) {
        console.error("Aucun fichier sélectionné !")
        return
    }

    const CHUNK_SIZE = 1024*1024*5 // 5 Mo
    const file = fileInput.files[0]
    const filename = file.name
    const encryption_key_hex = localStorage.getItem("encryption_key")

    if (!encryption_key_hex) {
        console.error("Vous n'êtes pas connecté !")
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
            socket.send(JSON.stringify({ type: "start_upload", encrypted_filename: bufferToHex(encrypted_filename), iv: bufferToHex(iv), chunk_size: CHUNK_SIZE, size: file.size }))
            incrementIV(iv)
            await sendChunks()
            console.info("Fichier envoyé avec succès")
            socket.send(JSON.stringify({ type: "end_upload" }))
            socket.close()
            return
        }
        console.warn(response.message)
    })

    socket.addEventListener("error", function(event) {
        console.error("Une erreur de connexion est survenue", event)
    })

    async function sendChunks() {
        const chunkCount = Math.ceil(file.size/CHUNK_SIZE)
        progressBar.setAttribute("max", file.size)

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

            progressBar.setAttribute("value", ((i+1) * CHUNK_SIZE).toString())
        }
        progressBar.setAttribute("value", file.size)
    }
})
