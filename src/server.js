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
import {route_file_delete, route_files} from "./api/files.js"

const LISTENING_PORT = 8080

const server = express()
expressWs(server)

const database = mysql.createConnection({
    host: "localhost",
    user: "cloud",
    password: "rNkfRL2EwZ7gE6#ikRKKkRAQa%62Wo7r",
    database: "cloud",
})

database.queryFirst = database_single_query.bind(null, database)
database.queryAll = database_multiple_query.bind(null, database)

server.use(express.json())
server.use(cookieParser())
server.use(contextParser(database))

server.use("/public", express.static("src/public"))
server.get(["/", "/account/"], route_html)

server.ws("/api/upload/", route_upload)
server.get("/api/files/", route_files)
server.delete("/api/files/:fileId", route_file_delete)

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