import {account_logout} from "~/services/account.js"
import {useState} from "react"
import {Upload} from "~/components/Upload.js"

function HeaderLabel({ uploadManager }) {
    const uploadingCount = uploadManager.uploadQueue.length
    const uploadedCount = uploadManager.uploadedFiles.length
    return <label className="header--label" htmlFor="expandable--header">
        {uploadingCount === 0 ?
            (uploadedCount === 0 ?
                <>
                    <span className="material-symbols-rounded">cloud</span>
                    <span id="upload--label--text">Aucun transfert</span>
                </> :
                <>
                    <span className="material-symbols-rounded icon__success">cloud_done</span>
                    <span id="upload--label--text">{uploadedCount} fichiers transférés</span>
                </>) :
            <>
                <span className="material-symbols-rounded">cloud</span>
                <span id="upload--label--text">{uploadedCount}/{uploadingCount+uploadedCount} fichiers transférés</span>
            </>}
    </label>
}

export function Header({navigate, uploadManager}) {
    const [isLoading, setIsLoading] = useState(false)

    function handleUpload(e) {
        for (const inputedFile of e.target.files) {
            uploadManager.uploadFile(inputedFile)
        }
        e.target.value = null
    }

    async function handleLogout() {
        if (isLoading) return

        setIsLoading(true)
        let response = await account_logout()
        setIsLoading(false)

        if (response.success) {
            navigate("/account/")
        }
    }

    return <div className="header">
        <div className="header--content">
            <div className="header--group">
                <h1 className="header--title">TiCloud</h1>
                <hr className="header--line"/>
                <HeaderLabel uploadManager={uploadManager} />
            </div>
            <div className="header--links">
                <label className="header--link" htmlFor="upload--input">Envoyer un fichier</label>
                <button className="header--link" onClick={handleLogout}>Se déconnecter</button>
            </div>
        </div>
        <input type="checkbox" id="expandable--header" style={{ display: "none" }} />
        <div className="header--expandable">
            <input type="file" id="upload--input" style={{ display: "none" }} accept="*/*" multiple onChange={handleUpload} />
            <div className="header--group">
                <h3 className="header--subtitle">File d'attente</h3>
                <label className="header--button" htmlFor="upload--input">Ajouter un fichier</label>
            </div>
            {uploadManager.uploadQueue.length + uploadManager.uploadedFiles.length === 0 && <p className="header--label">Rien à afficher ici</p>}
            <div className="header--list">
                {uploadManager.uploadQueue.map((upload) => <Upload upload={upload} key={upload.uploadId} />)}
                {uploadManager.uploadedFiles.map((upload) => <Upload upload={upload} key={upload.uploadId} />)}
             </div>
        </div>
        <label className="header--expand" htmlFor="expandable--header">
            <span className="material-symbols-rounded">expand_more</span>
        </label>
    </div>
}