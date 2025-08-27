import { Routes, Route, Navigate } from "react-router-dom"

import { MyFiles } from "~/pages/MyFiles.js"
import { RegisterAndLogin } from "~/pages/RegisterAndLogin.js"
import { useManager } from "~/hooks/useManager.js"
import { Debug } from "~/pages/Debug.js"
import { Loader } from "~/pages/Loader.js"
import { Account } from "~/pages/Account.js"
import { Page } from "~/layouts/Page.js"

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