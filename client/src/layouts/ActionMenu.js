import {useEffect, useState} from "react"
import {delete_file} from "~/services/files.js"
import {download_file} from "~/services/download.js"

export function ActionMenu({ file, x, y, setMenuTarget, removeLocalFile, refreshSession }) {
    const [loading, setIsLoading] = useState(false)

    useEffect(() => {
        function handleClick(e) {
            if (!e.target.closest(".actions")) {
                e.preventDefault()
                e.stopPropagation()
                setMenuTarget(null)
            }
        }
        document.addEventListener("click", handleClick)
        return () => {
            document.removeEventListener("click", handleClick)
        }
    })

    async function handleDelete() {
        setIsLoading(true)
        let response = await delete_file(file.id)
        setIsLoading(false)

        if (response.success) {
            removeLocalFile(file.id)
            setMenuTarget(null)
            refreshSession()
        }
    }

    async function handleDownload() {
        const response = await download_file(file.id)
    }

    return <div className="actions" style={{ left: x, top: y }}>
        <button className="action" disabled={loading} onClick={handleDownload}>
            <span className="material-symbols-rounded">download</span>
            Télécharger
        </button>
        <button className="action" disabled={loading} onClick={handleDelete}>
            <span className="material-symbols-rounded">delete</span>
            Supprimer
        </button>
    </div>
}