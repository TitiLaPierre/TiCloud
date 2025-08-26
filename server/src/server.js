import express from "express"
import expressWs from "express-ws"
import { route_upload } from "./api/upload.js"
import { route_login } from "./api/login.js"
import mysql from "mysql2"
import cookieParser from "cookie-parser"
import {contextParser, handleApi404} from "./middleware/context.js"
import { database_single_query, database_multiple_query } from "./utils/database.js"
import {route_register} from "./api/register.js"
import {route_prelogin} from "./api/prelogin.js"
import {route_logout} from "./api/logout.js"
import {route_file_get, route_file_delete, route_files} from "./api/files.js"
import {route_download} from "./api/download.js"
import dotenv from "dotenv"
import {route_preview_get, route_preview_post} from "./api/preview.js"
import cors from "cors"
import {route_session} from "./api/session.js"
import {route_sessions} from "./api/sessions.js"

dotenv.config()

const LISTENING_PORT = parseInt(process.env.PORT, 10) || 3000
const IS_DEVELOPMENT = process.env.IS_DEVELOPMENT === "true"

console.log(`Running in ${IS_DEVELOPMENT ? "development" : "production"} mode`)

const app = express()
expressWs(app)

const database = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
})

database.queryFirst = database_single_query.bind(null, database)
database.queryAll = database_multiple_query.bind(null, database)

app.use(express.json({ limit: "6mb" }))
app.use(cookieParser())
app.use(contextParser(database))
app.use(cors())

app.ws("/api/upload/", route_upload)
app.ws("/api/download/:fileId", route_download)

app.get("/api/files/", route_files)
app.get("/api/files/:fileId", route_file_get)
app.delete("/api/files/:fileId", route_file_delete)

app.get("/api/preview/:fileId", route_preview_get)
app.post("/api/preview/:fileId", route_preview_post)

app.post("/api/prelogin/", route_prelogin)
app.post("/api/login/", route_login)
app.post("/api/register/", route_register)
app.post("/api/logout/", route_logout)

app.get("/api/session/", route_session)
app.get("/api/sessions/", route_sessions)

app.use(handleApi404)

app.listen(LISTENING_PORT, "127.0.0.1", () => {
    console.log(`Server is listening on port ${LISTENING_PORT}`)
    if (IS_DEVELOPMENT) {
        console.log(`http://localhost:${LISTENING_PORT}/api/`)
    } else {
        console.log(`https://cloud.titilapierre.fr/api/`)
    }
})