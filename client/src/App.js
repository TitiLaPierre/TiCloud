import {Routes, Route, useNavigate, Navigate, useLocation} from "react-router-dom"

import { MyFiles } from "~/pages/MyFiles.js"
import { RegisterAndLogin } from "~/pages/RegisterAndLogin.js"
import {useManager} from "~/hooks/useManager.js"
import {Debug} from "~/pages/Debug.js"
import {Loader} from "~/pages/Loader.js"
import {comparePath} from "~/utils/utils.js"

export function App() {
    const location = useLocation()
    const manager =  useManager()

    const availableRoutes = [
        { path: "*", Element: Loader, cond: manager.session === null },

        { path: "/my-files/", Element: MyFiles, cond: manager.session },
        { path: "/my-files/", Element: Navigate, props: { to: "/login/" }, cond: manager.session === false },

        { path: "/login/", Element: RegisterAndLogin, cond: manager.session === false },
        { path: "/register/", Element: RegisterAndLogin, cond: manager.session === false },
        { path: "/login/", Element: Navigate, props: { to: "/my-files/" }, cond: manager.session },
        { path: "/register/", Element: Navigate, props: { to: "/my-files/" }, cond: manager.session },

        { path: "/debug/", Element: Debug },
    ]

    let choosenRoute = { path: "*", Element: Navigate, props: { to: "/my-files/" } }
    let choosenRouteParams = {}

    for (const route of availableRoutes) {
        if (route.cond !== undefined && !route.cond) continue
        const { match, params: routeParams } = comparePath(route.path, location.pathname)
        if (!match) continue
        [choosenRoute, choosenRouteParams] = [route, routeParams]
        break
    }

    return <choosenRoute.Element {...choosenRoute.props} manager={manager} />
}