const errorTag = document.querySelector("#error--tag")
const errorTagContent = errorTag.querySelector("#error--tag--content")

const usernameInput = document.querySelector("#username--input")
const passwordInput = document.querySelector("#password--input")

const loginButton = document.querySelector("#login--button")
const registerButton = document.querySelector("#register--button")

function displayError(message) {
    errorTag.removeAttribute("style")
    if (typeof message === "string") {
        errorTagContent.innerText = message in EXTERNAL_MESSAGES ? EXTERNAL_MESSAGES[message] : message
    } else if (typeof message === "object") {
        errorTagContent.innerText = ""
        for (const key of message) {
            if (!key) continue
            errorTagContent.innerText += key in EXTERNAL_MESSAGES ? EXTERNAL_MESSAGES[key] : key
        }
    }
}

function enableButtons() {
    if (usernameInput.value && passwordInput.value) {
        loginButton.removeAttribute("disabled")
        registerButton.removeAttribute("disabled")
    } else {
        loginButton.setAttribute("disabled", "true")
        registerButton.setAttribute("disabled", "true")
    }
}

enableButtons()
usernameInput.addEventListener("input", enableButtons)
passwordInput.addEventListener("input", enableButtons)

loginButton.addEventListener("click", async () => {
    const username = usernameInput.value
    const password = passwordInput.value

    const response = await account_login(username, password)
    if (!response.success) {
        displayError(response.message)
        return
    }

    document.location.href = "/"
})

registerButton.addEventListener("click", async () => {
    const username = usernameInput.value
    const password = passwordInput.value

    const registerResponse = await account_register(username, password)
    if (!registerResponse.success) {
        displayError(registerResponse.message)
        return
    }

    const loginResponse = await account_login(username, password)
    if (!loginResponse.success) {
        displayError(loginResponse.message)
        return
    }

    document.location.href = "/"
})