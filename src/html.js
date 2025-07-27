import fs from "fs"

export function route_html(request, response) {
    response.status(200)
    response.contentType("text/html")
    response.send(fs.readFileSync("src/html/home.html", "utf8"))
}