import express from "express"
import expressWs from "express-ws"
import { route_html } from "./html.js"
import { handle404 } from "./404.js"
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
import fs from "fs";
import * as https from "node:https";

dotenv.config()

const LISTENING_PORT = process.env.PORT

const app = express()
let server

if (process.env.IS_DEVELOPMENT) {
    expressWs(app)
} else {
    server = https.createServer({
        key: fs.readFileSync("/etc/letsencrypt/live/titilapierre.fr/privkey.pem"),
        cert: fs.readFileSync("/etc/letsencrypt/live/titilapierre.fr/fullchain.pem"),
    })
    expressWs(app, server)
}

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

app.use("/public", express.static("src/public"))
app.use("/", express.static("src/external"))
app.get(["/", "/account/"], route_html)
// TODO: Remove the debug route
app.get("/debug/", (request, response) => {
    response.status(200).contentType("text/html").send(fs.readFileSync("src/html/debug.html", "utf8"))
})

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

app.all(["/api/*route", "/api/"], handleApi404)
app.all("*path", handle404)

if (process.env.IS_DEVELOPMENT) {
    app.listen(LISTENING_PORT, () => {
        console.log(`Server is listening on port ${LISTENING_PORT}`)
        console.log(`http://localhost:${LISTENING_PORT}/`)
    })
} else {
    server.listen(LISTENING_PORT, () => {
        console.log(`Server is listening on port ${LISTENING_PORT}`)
        console.log(`https://cloud.titilapierre.fr/`)
    })
}