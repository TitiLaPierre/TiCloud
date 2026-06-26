import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import posthog from "posthog-js"
import { PostHogProvider } from "@posthog/react"

import "@/css/main.css"

import { App } from "@/App"

posthog.init(import.meta.env.VITE_POSTHOG_PROJECT_TOKEN, {
    api_host: import.meta.env.VITE_POSTHOG_HOST,
    defaults: "2026-05-30",
})

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(
    <PostHogProvider client={posthog}>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </PostHogProvider>
)