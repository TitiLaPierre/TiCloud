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

dotenv.config()

const LISTENING_PORT = process.env.PORT

const server = express()
expressWs(server)

const database = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
})

database.queryFirst = database_single_query.bind(null, database)
database.queryAll = database_multiple_query.bind(null, database)

server.use(express.json({ limit: "6mb" }))
server.use(cookieParser())
server.use(contextParser(database))

server.use("/public", express.static("src/public"))
server.use("/", express.static("src/external"))
server.get(["/", "/account/"], route_html)
// TODO: Remove the debug route
server.get("/debug/", (request, response) => {
    response.status(200).contentType("text/html").send(fs.readFileSync("src/html/debug.html", "utf8"))
})

server.ws("/api/upload/", route_upload)
server.ws("/api/download/:fileId", route_download)

server.get("/api/files/", route_files)
server.get("/api/files/:fileId", route_file_get)
server.delete("/api/files/:fileId", route_file_delete)

server.get("/api/preview/:fileId", route_preview_get)
server.post("/api/preview/:fileId", route_preview_post)

server.post("/api/prelogin/", route_prelogin)
server.post("/api/login/", route_login)
server.post("/api/register/", route_register)
server.post("/api/logout/", route_logout)

server.all(["/api/*route", "/api/"], handleApi404)
server.all("*path", handle404)

server.listen(LISTENING_PORT, () => {
    console.log(`Server is listening on port ${LISTENING_PORT}`)
    console.log(`http://localhost:${LISTENING_PORT}/`)
})