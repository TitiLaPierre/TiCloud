import {useEffect, useRef, useState} from "react"
import {upload_file} from "~/services/upload.js"
import {imageFileToThumbnail} from "~/utils/images.js"
import {upload_preview} from "~/services/previews.js"

export const UploadManagerStatus = {
    CLOSED: "CLOSED",
    INITIALIZING: "INITIALIZING",
    OPEN: "OPEN",
}

export function useUploadManager({ addLocalFile }) {
    const [websocket, setWebsocket] = useState(null)
    const status = useRef(UploadManagerStatus.CLOSED)

    const [uploadQueue, setUploadQueue] = useState([])
    const [uploadedFiles, setUploadedFiles] = useState([])
    const [nextUploadId, setNextUploadId] = useState(null)

    function openWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const socket = new WebSocket(`${protocol}//${window.location.host}/api/upload/`)
        socket.binaryType = "arraybuffer"

        socket.addEventListener("open", () => {
            console.info("WebSocket connection established")
            status.current = UploadManagerStatus.INITIALIZING
        })
        socket.addEventListener("message", (e) => {
            let response
            try {
                response = JSON.parse(e.data)
            } catch (error) {
                response = { message: "invalid_response", error: e.data }
            }
            if (response.message === "ready_for_upload") {
                status.current = UploadManagerStatus.OPEN
                setNextUploadId(response.file_id)
            } else {
                console.warn("Received unexpected message from file manager:", response)
            }
        })
        socket.addEventListener("close", () => {
            console.info("WebSocket connection terminated")
            status.current = UploadManagerStatus.CLOSED
            setWebsocket(null)
        })

        setWebsocket(socket)
    }

    function addToUploadQueue(file) {
        const localId = crypto.randomUUID()
        setUploadQueue(oldQueue => [...oldQueue, { localId, file, progress: 0, uploaded: false }])
    }

    useEffect(() => {
        if (websocket === null && uploadQueue.length > 0) {
            openWebSocket()
        } else if (websocket !== null && uploadQueue.length === 0) {
            websocket.close()
        }
    }, [uploadQueue])

    useEffect(() => {
        if (websocket === null || status.current !== UploadManagerStatus.OPEN || uploadQueue.length === 0) {
            return
        }
        const upload = uploadQueue[0]
        upload_file(websocket, nextUploadId, upload.file, (progress) => {
            setUploadQueue(oldQueue => oldQueue.map((f, index) => {
                if (index === 0) {
                    return { ...f, progress }
                }
                return f
            }))
        }).then(async response => {
            if (response.success) {
                status.current = UploadManagerStatus.INITIALIZING
                if (upload.file.type.startsWith("image/")) {
                    const preview = await imageFileToThumbnail(upload.file)
                    const previewResponse = await upload_preview(response.file.id, preview)
                    if (previewResponse.success) {
                        response.file.hasPreview = true
                        response.file.preview = preview
                    }
                }
                setUploadedFiles(oldFiles => [{ ...upload, uploaded: true }, ...oldFiles])
                setUploadQueue(oldQueue => oldQueue.slice(1))
                addLocalFile(response.file)
            }
        })

    }, [websocket, nextUploadId])

    return { status: status.current, addToUploadQueue, uploadQueue, uploadedFiles }
}