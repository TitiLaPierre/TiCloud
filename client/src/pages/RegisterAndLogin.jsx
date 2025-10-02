import "@/css/login_register.css"
import {useEffect, useRef, useState} from "react"
import {getErrorMessage} from "@/utils/errors.js"
import {account_login, account_register} from "@/services/account.js"
import {useTitle} from "@/hooks/useTitle.js"
import {Link, useLocation} from "react-router-dom"

export function RegisterAndLogin({ manager }) {
    useTitle("Accès au compte — TiCloud")

    const location = useLocation()

    const [error, setError] = useState(null)
    const [isLoading, setIsLoading] = useState(false)

    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")

    const loginRef = useRef()
    const registerRef = useRef()

    useEffect(() => {
        function handleScroll() {
            if (location.pathname.startsWith("/login")) {
                loginRef.current?.scrollIntoView({ behavior: "smooth" })
            } else if (location.pathname.startsWith("/register")) {
                registerRef.current?.scrollIntoView({ behavior: "smooth" })
            }
        }
        handleScroll()
        window.addEventListener("resize", handleScroll)
        setError(null)
        return () => window.removeEventListener("resize", handleScroll)
    }, [location])

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
        <div className="form--scroll">
            <div className="form" ref={loginRef}>
                <h2 className="form--title">Connexion</h2>
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
                    <button className="form--button" disabled={!username || !password || isLoading} onClick={handleLogin}>Se connecter</button>
                    <Link className="form--link" to="/register/" replace={true}>Je n'ai pas encore de compte</Link>
                </div>
            </div>
            <div className="form" ref={registerRef}>
                <h2 className="form--title">Nouveau compte</h2>
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
                    <Link className="form--link" to="/login/" replace={true}>J'ai déjà un compte</Link>
                </div>
            </div>
        </div>
    </div>
}