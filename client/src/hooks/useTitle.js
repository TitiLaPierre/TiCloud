import { useState, useEffect } from "react"

export const useTitle = (default_title) => {
    const [title, setTitle] = useState(default_title)
    useEffect(() => { document.title = title }, [title])
    return setTitle
}