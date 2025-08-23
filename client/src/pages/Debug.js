import {useEffect, useState} from "react"
import {delete_file, get_files} from "~/services/files.js"

export function Debug() {
    const [files, setFiles] = useState(null)
    const [deleted, setDeleted] = useState(0)

    useEffect(() => {
        const controller = new AbortController()
        get_files(controller.signal).then(response => {
            if (response.success) {
                setFiles(response.files)
            }
        })
        return () => controller.abort()
    }, [])

    useEffect(() => {
        for (const file of files || []) {
            delete_file(file.id).then(response => {
                if (!response.success) {
                    console.error(`Failed to delete file ${file.id}:`, response)
                } else {
                    console.log(`File ${file.id} deleted successfully`)
                }
                setDeleted(old => old + 1)
            })

        }
    }, [files])

    return <div>
        <h1>Debug page</h1>
        <p>/!\ This page delete all your files /!\</p>
        <progress value={deleted} max={files ? files.length : 0} />
        <p>Deleted {Math.round(deleted/ (files?.length ?? 1)*100)}% of files</p>
    </div>
}