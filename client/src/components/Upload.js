export function Upload({ upload }) {
    return <div className="upload">
        <h5 className="upload--head">
            {upload.uploaded ?
                <span className="upload--icon material-symbols-rounded icon__success">cloud_done</span> :
                <span className="upload--icon material-symbols-rounded">cloud_upload</span>
            }
            <span className="upload--filename">{upload.file.name}</span>
        </h5>
        <div className="upload--bar">
            <div className="upload--progress" style={{ width: `${upload.uploaded ? 100 : (upload.progress || 0)}%` }}></div>
        </div>
    </div>
}