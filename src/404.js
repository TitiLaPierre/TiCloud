import fs from "fs"

export function handle404(request, response) {
    response.status(404)
    response.contentType("text/html")
    response.send(fs.readFileSync("src/html/404.html", "utf8"))
}