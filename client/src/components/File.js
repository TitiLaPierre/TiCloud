import {PREVIEW_ICONS} from "~/utils/utils.js"

export function LoadingFile() {
    return <div className="file file__loading">
        <div className="file--preview"></div>
        <div className="file--label"></div>
    </div>
}

export function File({ file, setMenuTarget }) {
    let previewIcon = { icon: "draft", color: "var(--black)" }
    for (const { regex, icon, color } of PREVIEW_ICONS) {
        if (file.filename.match(regex)) {
            previewIcon = { icon, color }
            break
        }
    }

    function handleMenu(event) {
        event.preventDefault()
        event.stopPropagation()
        setMenuTarget({ file, x: event.pageX, y: event.pageY })
    }

    return <div className="file" onContextMenu={handleMenu}>
        <div className="file--preview">
            {file.preview ?
                <img src={file.preview} alt={file.filename} /> :
                <span className="material-symbols-rounded" style={{ color: previewIcon.color }}>{previewIcon.icon}</span>
            }
        </div>
        <div className="file--label">
            <span className="file--name">{file.filename}</span>
            <button className="file--actions" onClick={handleMenu}>
                <span className="material-symbols-rounded">more_vert</span>
            </button>
        </div>
    </div>
}