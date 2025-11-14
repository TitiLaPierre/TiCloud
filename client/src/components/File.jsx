import {PREVIEW_ICONS} from "@/utils/utils.js"
import {useState} from "react"
import {useQuery} from "@tanstack/react-query"
import {get_preview} from "@/services/previews.js"

function handleMenu(event, file, setMenuTarget) {
    event.preventDefault()
    event.stopPropagation()
    setMenuTarget({ file, x: event.pageX, y: event.pageY })
}

export function LoadingFile({ file, setMenuTarget } = {}) {
    return <div className="file file__loading" onContextMenu={(e) => file && handleMenu(e, file, setMenuTarget)}>
        <div className="file--preview"></div>
        <div className="file--label">
            {file && <span className="file--name">{file.filename}</span>}
            {file && <button className="file--actions" onClick={(e) => handleMenu(e, file, setMenuTarget)}>
                <span className="material-symbols-rounded">more_vert</span>
            </button>}
        </div>
    </div>
}

export function ImageFile({ file, imageData, setMenuTarget }) {
    const [isLoaded, setIsLoaded] = useState(false)
    return <div className={isLoaded ? "file": "file file__loading"} onContextMenu={(e) => handleMenu(e, file, setMenuTarget)}>
        <div className="file--preview">
            <img className="file--image" src={imageData} alt={file.filename} style={isLoaded ? { opacity: 1 } : { opacity: 0 }} onLoad={() => setIsLoaded(true)} />
        </div>
        <div className="file--label">
            <span className="file--name">{file.filename}</span>
            <button className="file--actions" onClick={(e) => handleMenu(e, file, setMenuTarget)}>
                <span className="material-symbols-rounded">more_vert</span>
            </button>
        </div>
    </div>
}

export function File({ file, setMenuTarget }) {
    const query = useQuery({ queryKey: ["preview", file.id], queryFn: async () => {
        const data = { preview: null, icon: "draft", color: "var(--black)" }
        for (const { regex, icon, color } of PREVIEW_ICONS) {
            if (file.filename.match(regex)) {
                data.icon = icon
                data.color = color
                break
            }
        }

        if (file.hasPreview) {
            const response = await get_preview(file.id)
            if (response.success === true) {
                data.preview = response.data
            }
        }

        return data
    }, refetchOnMount: false, refetchOnWindowFocus: false })

    if (query.isFetching === true) {
        return <LoadingFile file={file} setMenuTarget={setMenuTarget} />
    }

    if (query.data.preview !== null && query.data.preview.startsWith("data:image/")) {
        return <ImageFile file={file} imageData={query.data.preview} setMenuTarget={setMenuTarget} />
    }

    return <div className="file" onContextMenu={(e) => handleMenu(e, file, setMenuTarget)}>
        <div className="file--preview">
            <span className="material-symbols-rounded" style={{ color: query.data.color }}>{query.data.icon}</span>
        </div>
        <div className="file--label">
            <span className="file--name">{file.filename}</span>
            <button className="file--actions" onClick={(e) => handleMenu(e, file, setMenuTarget)}>
                <span className="material-symbols-rounded">more_vert</span>
            </button>
        </div>
    </div>
}