export function sendJSON(response, code, data) {
    response.status(code).contentType("application/json").send(JSON.stringify({ ...data, code }))
}