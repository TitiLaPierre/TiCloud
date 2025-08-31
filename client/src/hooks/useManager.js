import {useEffect, useState} from "react"
import {get_preview} from "~/services/previews.js"
import {get_files} from "~/services/files.js"
import {useUploadManager} from "~/hooks/useUploadManager.js"
import {account_session} from "~/services/account.js"

export function useManager() {
    const [user, setUser] = useState(null)
    const [session, setSession] = useState(null)

    const [files, setFiles] = useState(null)
    const [previews, setPreviews] = useState({})

    function addLocalFile(file) {
        setFiles(old => (old ? [...old, file] : [file]))
        setPreviews(old => ({ ...old, [file.id]: file.hasPreview ? null : false }))
    }

    function removeLocalFile(id) {
        setFiles(oldFiles => oldFiles.filter(file => file.id !== id))
        setPreviews(old => {
            const newPreviews = { ...old }
            delete newPreviews[id]
            return newPreviews
        })
    }

    function setFilePreview(id, preview) {
        setPreviews(old => ({ ...old, [id]: preview }))
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
            if (file.hasPreview && !previews[file.id]) {
                get_preview(file.id)
                    .then(response => {
                        if (response.success && response.data.startsWith("data:image/")) {
                            setPreviews(old => ({ ...old, [file.id]: response.data }))
                        } else {
                            setPreviews(old => ({ ...old, [file.id]: false }))
                        }
                    })
            }
        }

        return () => controller.abort()
    }, [files])

    return { user, session, files, previews, addLocalFile, removeLocalFile, uploadManager, refreshSession }
}