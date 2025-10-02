import {useEffect, useState} from "react"
import {imageFileToThumbnail} from "@/utils/images.js"

import UploadWorker from "@/workers/upload.worker.js?worker"

export function useUploadManager({ addLocalFile, setFilePreview, refreshSession }) {
    const [worker, setWorker] = useState(null)

    const [uploadQueue, setUploadQueue] = useState([])
    const [uploadedFiles, setUploadedFiles] = useState([])

    useEffect(() => {
        // const w = new Worker(new URL("@/workers/upload.worker.js", import.meta.url, { type: "module" }))
        const w = new UploadWorker()
        setWorker(w)

        w.addEventListener("message", (e) => {
            const { type, data } = e.data
            if (type === "file_uploaded") {
                addLocalFile(data.file)
                setUploadedFiles(oldFiles => [{ file: data.file, uploadId: data.uploadId, uploaded: true }, ...oldFiles])
                setUploadQueue(oldQueue => oldQueue.filter(upload => upload.uploadId !== data.uploadId))
                refreshSession()
            } else if (type === "upload_progress") {
                setUploadQueue(oldQueue => oldQueue.map(f => {
                    if (f.uploadId === data.uploadId) {
                        return { ...f, progress: data.progress }
                    }
                    return f
                }))
            } else if (type === "preview_uploaded") {
                setFilePreview(data.fileId, data.preview)
            } else if (type === "error") {
                console.error(...data)
            } else {
                console.warn("Unknown message from upload worker:", e.data)
            }
        })

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        w.postMessage({ type: "init", config: {
            http_protocol: window.location.protocol,
            socket_protocol: protocol,
            host: window.location.host,
            encryption_key: localStorage.getItem("encryption_key"),
        }})

        return () => w.terminate()
    }, [])

    async function uploadFile(file) {
        const uploadId = crypto.randomUUID()
        setUploadQueue(oldQueue => [{ file, progress: 0, uploadId }, ...oldQueue])

        let preview = null
        if (file.type.startsWith("image/")) {
            preview = await imageFileToThumbnail(file)
        }

        worker.postMessage({ type: "upload_file", file, uploadId, preview })
    }

    return { uploadFile, uploadQueue, uploadedFiles }
}