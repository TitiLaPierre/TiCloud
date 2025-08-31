import "~/css/account.css"
import {useTitle} from "~/hooks/useTitle.js"
import {formatBytes} from "~/utils/utils.js"
import {useEffect, useState} from "react"
import {account_logout, get_sessions} from "~/services/account.js"
import {Session} from "~/components/Session.js"

export function Account(props) {
    const { manager } = props
    const { user } = manager

    const [sessions, setSessions] = useState([])
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    async function handleLogout() {
        if (isLoggingOut) return

        setIsLoggingOut(true)
        let response = await account_logout()
        setIsLoggingOut(false)

        if (response.success) {
            manager.refreshSession()
        }
    }

    useEffect(() => {
        const controller = new AbortController()
        get_sessions(controller)
            .then(response => {
                if (!response.success) {
                    console.error(response)
                    return
                }
                setSessions(response.sessions)
            })
        return () => controller.abort()
    }, [])

    useTitle("Mon compte — TiCloud")

    const usedPercent = (user.allocated_space !== 0 ?
        Math.min(user.used_space, user.allocated_space) * 100 / user.allocated_space :
        100)
    const letter = user.username.search(/\p{L}/u) !== -1 ? user.username.match(/\p{L}/u)[0].toUpperCase() : " "

    return <div className="centered">
        <div className="account">
            <div className="account--section section__large">
                <div className="account--user">
                    <div className="account--avatar">
                        <span className="account--avatar--letter">{letter}</span>
                    </div>
                    <div className="account--infos">
                        <h2 className="account--username">{user.username}</h2>
                        <p className="account--type">Compte Standard</p>
                    </div>
                </div>
                <div className="progress">
                    <div className="progress--bar" style={{ width: `${usedPercent}%` }}>
                        <span className="progress--text">{usedPercent.toFixed(0)}%</span>
                    </div>
                </div>
            </div>
            <div className="account--split">
                <div className="account--section">
                    <h1 className="account--number">{formatBytes(user.used_space)}</h1>
                    <p className="account--label">Espace utilisé</p>
                </div>
                <div className="account--section">
                    <h1 className="account--number">{formatBytes(user.allocated_space)}</h1>
                    <p className="account--label">Place totale</p>
                </div>
            </div>
            <div className="account--section section__large">
                <h3 className="account--title">Mes Actions</h3>
                <button className="account--action" onClick={handleLogout} disabled={isLoggingOut}>
                    <span className="material-symbols-rounded">logout</span>
                    Se Déconnecter
                </button>
            </div>
        </div>
        <h3 className="page--subtitle">Connexions Actives</h3>
        <div className="account">
            {sessions.map((session) => <Session session={session} key={session.creation_date} />)}
        </div>
    </div>
}