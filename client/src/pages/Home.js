import "~/css/home.css"
import { Header } from "~/layouts/Header.js"
import {useState} from "react"
import {ActionMenu} from "~/layouts/ActionMenu.js"
import {File, LoadingFile} from "~/components/File.js"
import {useTitle} from "~/hooks/useTitle.js"

export function Home({ manager }) {
    useTitle("Mes fichiers — TiCloud")

    const [menuTarget, setMenuTarget] = useState(null)

    return <>
        <Header manager={manager} uploadManager={manager.uploadManager} />
        <div className="page">
            <nav className="nav">
                <h3 className="nav--title">Mes Fichiers</h3>
            </nav>
            {manager.files === null && <div className="files">
                <LoadingFile /><LoadingFile /><LoadingFile /><LoadingFile /><LoadingFile /><LoadingFile /><LoadingFile />
            </div>}
            {manager.files?.length === 0 && <label className="empty" htmlFor="upload--input">
                <span className="material-symbols-rounded empty--icon">upload</span>
                <h3 className="empty--title">Vous n'avez pas encore de fichier</h3>
                <p className="empty--text">Pour en ajouter, cliquez ici ou glissez-déposez vos fichiers.</p>
            </label>}
            {manager.files?.length > 0 && <div className="files">
                {manager.files.map(file => <File file={file} key={file.id} setMenuTarget={setMenuTarget} />)}
            </div>}
        </div>
        {menuTarget && <ActionMenu {...menuTarget} setMenuTarget={setMenuTarget} removeLocalFile={manager.removeLocalFile} />}
    </>
}