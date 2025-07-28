import fs from "fs"

export function route_html(request, response) {
    const { session } = request
    response.status(200)
    if (request.path === "/" && !session) {
        response.redirect("/account/")
        return
    }
    if (request.path === "/account/" && session) {
        response.redirect("/")
        return
    }

    if (request.path === "/account/") {
        response.contentType("text/html")
        response.send(fs.readFileSync("src/html/account.html", "utf8"))
    } else if (request.path === "/") {
        response.contentType("text/html")
        response.send(fs.readFileSync("src/html/home.html", "utf8"))
    } else {
        response.redirect("/")
    }
}