import "~/css/account.css"
import {useState} from "react"
import {getErrorMessage} from "~/utils/errors.js"
import {account_login, account_register} from "~/services/account.js"
import {useTitle} from "~/hooks/useTitle.js"

export function Account({ manager }) {
    useTitle("Accès au compte — TiCloud")

    const [error, setError] = useState(null)
    const [isLoading, setIsLoading] = useState(false)

    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")

    async function handleLogin() {
        setError(null)
        setIsLoading(true)
        let response = await account_login(username, password)
        setIsLoading(false)

        if (!response.success) {
            setError(response.message)
        } else {
            manager.refreshSession()
        }
    }

    async function handleRegister() {
        setError(null)
        setIsLoading(true)

        let registerResponse
        try {
            registerResponse = await account_register(username, password)
        } catch (err) {
            setError(err)
            setIsLoading(false)
            return
        }
        setIsLoading(false)
        if (!registerResponse.success) {
            setError(registerResponse.message)
            return
        }

        let loginResponse
        try {
            loginResponse = await account_login(username, password)
        } catch (err) {
            setError(err)
            return
        }
        if (!loginResponse.success) {
            setError(loginResponse.message)
            return
        }

        manager.refreshSession()
    }

    return <div className="form--container">
        <div className="form">
            <h2 className="form--title">Accès au compte</h2>
            {error && <p className="form--error">
                <span className="material-symbols-rounded">error</span>
                <span>{getErrorMessage(error)}</span>
            </p>}
            <div className="form--field">
                <label className="form--label" htmlFor="username--input">Nom d'utilisateur</label>
                <input
                    type="text"
                    className="form--input"
                    id="username--input"
                    placeholder="Nom d'utilisateur"
                    onChange={(e) => setUsername(e.target.value)}
                    value={username}
                />
            </div>
            <div className="form--field">
                <label className="form--label" htmlFor="password--input">Mot de passe</label>
                <p className="form--hint">
                    Il est impossible de récupérer vos données si vous perdez votre mot de passe.
                </p>
                <input
                    type="password"
                    className="form--input"
                    id="password--input"
                    placeholder="Mot de passe"
                    onChange={(e) => setPassword(e.target.value)}
                    value={password}
                />
            </div>
            <div className="form--actions">
                <button className="form--button" disabled={!username || !password || isLoading} onClick={handleRegister}>Créer un compte</button>
                <button className="form--button" disabled={!username || !password || isLoading} onClick={handleLogin}>Se connecter</button>
            </div>
        </div>
    </div>
}