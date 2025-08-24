import {Routes, Route, useNavigate, Navigate, useLocation} from "react-router-dom"

import { Home } from "~/pages/Home"
import { Account } from "~/pages/Account"
import {useManager} from "~/hooks/useManager.js"
import {Debug} from "~/pages/Debug.js"
import {Loader} from "~/pages/Loader.js"
import {comparePath} from "~/utils/utils.js"

export function App() {
    const location = useLocation()
    const manager =  useManager()

    const availableRoutes = [
        { path: "*", Element: Loader, cond: manager.session === null },

        { path: "/", Element: Home, cond: manager.session },
        { path: "/", Element: Navigate, props: { to: "/account/" }, cond: manager.session === false },

        { path: "/account/", Element: Account, cond: manager.session === false },
        { path: "/account/", Element: Navigate, props: { to: "/" }, cond: manager.session },

        { path: "/debug/", Element: Debug },
    ]

    let choosenRoute = { path: "*", Element: Navigate, props: { to: "/" } }
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