import {useTitle} from "~/hooks/useTitle.js"
import {Header} from "~/layouts/Header.js"
import { Outlet } from "react-router-dom"

export function Page(props) {
    const { title, manager } = props
    const { uploadManager } = manager

    if (title) useTitle(`${title} — TiCloud`)

    return <>
        <Header uploadManager={uploadManager} />
        <div className="page page__centered">
            {props.children}
            <Outlet />
        </div>
    </>
}