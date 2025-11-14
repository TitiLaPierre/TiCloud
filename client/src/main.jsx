import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"

import "@/css/main.css"

import { App } from "@/App"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const queryClient = new QueryClient()

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(<BrowserRouter>
    <QueryClientProvider client={queryClient}>
        <App />
    </QueryClientProvider>
</BrowserRouter>)