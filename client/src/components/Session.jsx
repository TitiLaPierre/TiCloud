export function Session({ session }) {
    const position = []
    if (session.city) position.push(session.city)
    if (session.country) position.push(session.country)

    const tool = []
    if (session.browser_name) tool.push(session.browser_name)
    if (session.os_name) tool.push(session.os_name)

    const date = new Date(session.creation_date * 1000).toLocaleDateString("fr-FR")
    const time = new Date(session.creation_date * 1000).toLocaleTimeString("fr-FR", {hour: "2-digit", minute: "2-digit"})

    return <div className="account--section section__inline">
        <span className="account--icon material-symbols-rounded">login</span>
        <div className="account--infos">
            <h3 className="account--field">
                {session.ip}
                {tool.length === 1 && ` sur ${tool[0]}`}
                {tool.length === 2 && ` sur ${tool[0]} (${tool[1]})`}
            </h3>
            <p className="account--label">
                {session.active && <>
                    <span className="label__active">Session actuelle</span>
                    <span className="label__separator"></span>
                </>}
                {position.length > 0 ? position.join(", ") : "Position inconnue"}
                {!session.active && <>
                    <span className="label__separator"></span>
                    Connecté le {date} à {time}
                </>}
            </p>
        </div>
    </div>
}