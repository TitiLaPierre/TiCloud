import {PREVIEW_ICONS} from "~/utils/utils.js"
import {useState} from "react"

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

export function ImageFile({ file, preview, setMenuTarget }) {
    const [isLoaded, setIsLoaded] = useState(false)
    return <div className={isLoaded ? "file": "file file__loading"} onContextMenu={(e) => handleMenu(e, file, setMenuTarget)}>
        <div className="file--preview">
            <img className="file--image" src={preview} alt={file.filename} style={isLoaded ? { opacity: 1 } : { opacity: 0 }} onLoad={() => setIsLoaded(true)} />
        </div>
        <div className="file--label">
            <span className="file--name">{file.filename}</span>
            <button className="file--actions" onClick={(e) => handleMenu(e, file, setMenuTarget)}>
                <span className="material-symbols-rounded">more_vert</span>
            </button>
        </div>
    </div>
}

export function File({ file, preview, setMenuTarget }) {
    let previewIcon = { icon: "draft", color: "var(--black)" }
    for (const { regex, icon, color } of PREVIEW_ICONS) {
        if (file.filename.match(regex)) {
            previewIcon = { icon, color }
            break
        }
    }

    if (file.hasPreview && !preview) {
        return <LoadingFile file={file} setMenuTarget={setMenuTarget} />
    }

    if (preview && preview.startsWith("data:image/")) {
        return <ImageFile file={file} preview={preview} setMenuTarget={setMenuTarget} />
    }

    return <div className="file" onContextMenu={(e) => handleMenu(e, file, setMenuTarget)}>
        <div className="file--preview">
            <span className="material-symbols-rounded" style={{ color: previewIcon.color }}>{previewIcon.icon}</span>
        </div>
        <div className="file--label">
            <span className="file--name">{file.filename}</span>
            <button className="file--actions" onClick={(e) => handleMenu(e, file, setMenuTarget)}>
                <span className="material-symbols-rounded">more_vert</span>
            </button>
        </div>
    </div>
}