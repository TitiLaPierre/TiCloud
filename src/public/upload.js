const fileInput = document.querySelector("#file--input")
const fileButton = document.querySelector("#file--button")
const progressBar = document.querySelector("#file--progress")

fileButton.addEventListener("click", async function() {
    if (fileInput.files.length !== 1) {
        console.error("Aucun fichier sélectionné !")
        return
    }

    const CHUNK_SIZE = 1024*1024*5 // 5 Mo

    const reader = new FileReader()
    const file = fileInput.files[0]

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
    );

    reader.onload = async function(e) {
        const buffer = e.target.result
        const chunkCount = Math.ceil(buffer.byteLength/CHUNK_SIZE)

        const socket = new WebSocket(URL + "/api/upload/")

        async function sendChunks() {
            progressBar.setAttribute("max", buffer.byteLength)
            for (let i = 0; i < chunkCount; i++) {
                const chunk = buffer.slice(i*CHUNK_SIZE, (i+1)*CHUNK_SIZE)
                socket.send(chunk)
                progressBar.setAttribute("value", i*CHUNK_SIZE)
            }
            progressBar.setAttribute("value", buffer.byteLength)
        }

        socket.addEventListener("message", function(event) {
            const response = JSON.parse(event.data)
            if (response.message === "ready_for_upload") {
                console.info("Envoi du fichier en cours...")
                socket.send(JSON.stringify({ type: "start_upload", filename: file.name }))
                sendChunks().then(() => {
                    console.info("Fichier envoyé avec succès")
                    socket.close()
                }).catch(error => {
                    console.error("Une erreur est survenue lors de l'envoi du fichier", error)
                })
                return
            }
            console.log(response.message)
        })
        socket.addEventListener("error", function(event) {
            console.error("Une erreur de connexion est survenue", event)
        })
    }

    reader.readAsArrayBuffer(file)
})
