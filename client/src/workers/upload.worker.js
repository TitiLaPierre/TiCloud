import {upload_file} from "~/services/upload.js"
import {upload_preview} from "~/services/previews.js"

let config = null
let socket = null

let isUploading = false

const queue = []
const previewQueue = []
let nextFilesId = []

function url(path) {
    if (config === null) {
        throw new Error("Configuration isn't initialized")
    }
    if (path.startsWith("/")) {
        path = path.substring(1)
    }
    return `${config.http_protocol}//${config.host}/${path}`
}

function openWebSocket() {
    if (config === null) {
        self.postMessage({ type: "error", data: ["Configuration isn't initialized"] })
        return
    }

    socket = new WebSocket(`${config.socket_protocol}//${config.host}/api/upload/`)
    socket.binaryType = "arraybuffer"

    socket.addEventListener("open", () => {
        console.info("WebSocket connection established")
        handleNextUpload()
    })

    socket.addEventListener("close", () => {
        socket = null
        isUploading = false
        nextFilesId = []
        console.info("WebSocket connection terminated")
    })

    socket.addEventListener("message", (e) => {
        let response
        try {
            response = JSON.parse(e.data)
        } catch (error) {
            response = { message: "invalid_response", error: e.data }
        }
        if (response.message === "ready_for_upload") {
            nextFilesId.push(response.file_id)
            handleNextUpload()
        } else if (response.message === "file_uploaded") {
            const upload = previewQueue.find(u => u.fileId === response.file.id)
            if (upload) {
                previewQueue.splice(previewQueue.indexOf(upload), 1)
                handlePreviewUpload(upload)
            }
            if (queue.length + previewQueue.length === 0) {
                socket.close()
                socket = null
            }
        } else {
            console.warn("Received unexpected message from file manager:", response)
        }
    })
}

function handleNextUpload() {
    if (socket === null || socket.readyState !== WebSocket.OPEN || nextFilesId.length === 0 || queue.length === 0 || isUploading === true) {
        return
    }
    isUploading = true
    const upload = queue.shift()
    upload_file(socket, nextFilesId.shift(), upload.file, config.encryption_key, (progress) => {
        self.postMessage({ type: "upload_progress", data: { progress, uploadId: upload.uploadId } })
    }).then(async response => {
        isUploading = false

        if (response.success) {
            upload.fileId = response.file.id
            if (upload.preview) {
                previewQueue.push(upload)
            }
            self.postMessage({ type: "file_uploaded", data: { ...response, uploadId: upload.uploadId } })
        } else {
            self.postMessage({ type: "error", data: ["File upload failed", response] })
        }

        if (queue.length + previewQueue.length === 0) {
            socket.close()
            socket = null
        }
    })
}

async function handlePreviewUpload(upload) {
    const previewResponse = await upload_preview(upload.fileId, upload.preview, config.encryption_key, url(`/api/preview/${upload.fileId}/`))
    if (previewResponse.success) {
        self.postMessage({ type: "preview_uploaded", data: { fileId: upload.fileId, preview: upload.preview } })
    }
}

self.addEventListener("message", (e) => {
    const { type, file, uploadId, preview } = e.data
    if (type === "init") {
        config = e.data.config
    } else if (type === "upload_file") {
        queue.push({ file, uploadId, preview })
        if (socket === null) {
            openWebSocket()
        } else {
            handleNextUpload()
        }
    }
})