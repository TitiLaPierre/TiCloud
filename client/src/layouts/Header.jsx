import {Upload} from "@/components/Upload.jsx"
import "@/css/header.css"
import {Link, useLocation} from "react-router-dom"
import {useEffect, useRef, useState} from "react"

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

export function Header({ uploadManager }) {
    function handleUpload(e) {
        for (const inputedFile of e.target.files) {
            uploadManager.uploadFile(inputedFile)
        }
        e.target.value = null
    }

    const links = [
        { to: "/my-files/", label: "Mes fichiers" },
        { to: "/account/", label: "Mon compte" },
    ]

    const location = useLocation()
    const navRef = useRef(null)
    const [bubbleStyle, setBubbleStyle] = useState({})

    useEffect(() => {
        if (!navRef.current) return

        const activeLink = navRef.current.querySelector(`a[href^="${location.pathname}"]`)

        if (activeLink) {
            const rect = activeLink.getBoundingClientRect()
            const navRect = navRef.current.getBoundingClientRect()

            setBubbleStyle({
                left: rect.left - navRect.left,
                width: rect.width,
                opacity: 1,
            })
        } else {
            setBubbleStyle((prev) => ({ ...prev, opacity: 0 }))
        }
    }, [location])

    return <div className="header">
        <div className="header--content">
            <div className="header--group">
                <h1 className="header--title">TiCloud</h1>
                <hr className="header--line"/>
                <HeaderLabel uploadManager={uploadManager} />
            </div>
            <div className="header--links" ref={navRef}>
                {links.map(({ to, label }) => {
                    const isActive = location.pathname.startsWith(to)
                    return <Link
                        to={to}
                        key={to}
                        className={`header--link ${isActive ? "link__active" : ""}`}
                    >{label}</Link>
                })}
                <div className="header--bubble" style={bubbleStyle} />
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