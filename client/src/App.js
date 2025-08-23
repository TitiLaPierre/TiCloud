import {Routes, Route, useNavigate} from "react-router-dom"

import { Home } from "~/pages/Home"
import { Account } from "~/pages/Account"
import {useManager} from "~/hooks/useManager.js"
import {Debug} from "~/pages/Debug.js"

export function App() {
    const navigate = useNavigate()
    const manager =  useManager()

    return <Routes>
        <Route path="/" element={<Home navigate={navigate} manager={manager} />} />
        <Route path="/account/" element={<Account navigate={navigate} />} />
        <Route path="/debug/" element={<Debug />} />
    </Routes>
}