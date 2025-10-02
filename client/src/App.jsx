import { Routes, Route, Navigate } from "react-router-dom"

import { MyFiles } from "@/pages/MyFiles.jsx"
import { RegisterAndLogin } from "@/pages/RegisterAndLogin.jsx"
import { useManager } from "@/hooks/useManager.js"
import { Debug } from "@/pages/Debug.jsx"
import { Loader } from "@/pages/Loader.jsx"
import { Account } from "@/pages/Account.jsx"
import { Page } from "@/layouts/Page.jsx"

export function App() {
    const manager = useManager()

    if (manager.session === null) {
        return <Loader />
    }

    function RequireAuth({ children }) {
        return manager.session ? children : <Navigate to="/login/" replace />
    }

    function RequireNotAuth({ children }) {
        return manager.session ? <Navigate to="/my-files/" replace /> : children
    }

    return (
        <Routes>
            {/* Layout commun protégé pour les pages authentifiées */}
            <Route element={<RequireAuth><Page manager={manager} /></RequireAuth>}>
                <Route path="my-files/" element={<MyFiles manager={manager} />} />
                <Route path="account/" element={<Account manager={manager} />} />
            </Route>

            {/* Pages publiques */}
            <Route path="/login/" element={<RequireNotAuth><RegisterAndLogin manager={manager} /></RequireNotAuth>} />
            <Route path="/register/" element={<RequireNotAuth><RegisterAndLogin manager={manager} /></RequireNotAuth>} />

            {/* Route de test (non protégée, laissée telle quelle) */}
            <Route path="/test/" element={<Account manager={manager} />} />
            <Route path="/debug/" element={<Debug />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/my-files/" replace />} />
        </Routes>
    )
}