import {useEffect, useState} from "react"
import {get_preview} from "~/services/previews.js"
import {get_files} from "~/services/files.js"
import {useUploadManager} from "~/hooks/useUploadManager.js"
import axios from "axios"
import {account_session} from "~/services/account.js"

export function useManager() {
    const [user, setUser] = useState(null)
    const [session, setSession] = useState(null)

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

    function refreshSession() {
        const controller = new AbortController()
        account_session(controller)
            .then((response) => {
                if (response.success) {
                    setUser(response.user)
                    setSession(response.session)
                } else {
                    setUser(null)
                    setSession(false)
                }
            })
        return () => controller.abort()
    }

    const uploadManager = useUploadManager({ addLocalFile, setFilePreview, refreshSession })

    useEffect(refreshSession, [])

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
    }, [session?.creation_date])

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

    return { user, session, files, addLocalFile, removeLocalFile, uploadManager, refreshSession }
}