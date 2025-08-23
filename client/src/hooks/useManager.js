import {useEffect, useState} from "react"
import {get_preview} from "~/services/previews.js"
import {get_files} from "~/services/files.js"
import {useUploadManager} from "~/hooks/useUploadManager.js"

export function useManager() {
    const [files, setFiles] = useState(null)

    function addLocalFile(file) {
        setFiles(old => (old ? [...old, file] : [file]))
    }

    function removeLocalFile(id) {
        setFiles(oldFiles => oldFiles.filter(file => file.id !== id))
    }

    function setFilePreview(id, preview) {
        setFiles(oldFiles => oldFiles.map(file => {
            if (file.id === id) {
                return { ...file, preview, hasPreview: true }
            }
            return file
        }))
    }

    const uploadManager = useUploadManager({ addLocalFile, setFilePreview })

    useEffect(() => {
        const controller = new AbortController()
        get_files(controller)
            .then(response => {
                if (!response.success) {
                    console.error(response)
                    return
                }
                setFiles(response.files)
            })
        return () => controller.abort()
    }, [])

    useEffect(() => {
        if (files === null) return

        const controller = new AbortController()
        for (const file of files) {
            if (file.hasPreview && !file.preview) {
                get_preview(file.id)
                    .then(response => {
                        if (response.success && response.data.startsWith("data:image/")) {
                            setFiles(oldFiles => {
                                return oldFiles.map(f => {
                                    if (f.id === file.id) {
                                        return {...f, preview: response.data }
                                    }
                                    return f
                                })
                            })
                        } else {
                            setFiles(oldFiles => {
                                return oldFiles.map(f => {
                                    if (f.id === file.id) {
                                        return {...f, hasPreview: false }
                                    }
                                    return f
                                })
                            })
                        }
                    })
            }
        }

        return () => controller.abort()
    }, [files])

    return { files, addLocalFile, removeLocalFile, uploadManager }
}