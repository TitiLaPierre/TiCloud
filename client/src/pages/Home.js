import "~/css/home.css"
import { Header } from "~/layouts/Header.js"
import {useState} from "react"
import {ActionMenu} from "~/layouts/ActionMenu.js"
import {File, LoadingFile} from "~/components/File.js"
import {useTitle} from "~/hooks/useTitle.js"
import {useManager} from "~/hooks/useManager.js"

export function Home({ navigate, manager }) {
    useTitle("Mes fichiers — TiCloud")

    const [menuTarget, setMenuTarget] = useState(null)

    return <>
        <Header navigate={navigate} uploadManager={manager.uploadManager} />
        <div className="page">
            <nav className="nav">
                <h3 className="nav--title">Mes Fichiers</h3>
            </nav>
            <div className="files">
                {manager.files !== null ?
                    manager.files.map(file => <File file={file} key={file.id} setMenuTarget={setMenuTarget} />) :
                    new Array(7).map((_, index) => <LoadingFile key={index} />)
                }
            </div>
        </div>
        {menuTarget && <ActionMenu {...menuTarget} setMenuTarget={setMenuTarget} removeLocalFile={manager.removeLocalFile} />}
    </>
}