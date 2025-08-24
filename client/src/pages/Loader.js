import {useTitle} from "~/hooks/useTitle.js"

export function Loader() {
    useTitle("TiCloud")

    return <div className="loader--container">
        <div className="loader"></div>
        <h5 className="loader--text">Chargement de TiCloud</h5>
    </div>
}