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
    if (!username || !password) {
        displayError("invalid_fields")
        return
    }

    const preLoginResponse = await fetch(URL+"/api/prelogin/", {
        "method": "POST",
        "headers": {
            "content-type": "application/json",
        },
        "body": JSON.stringify({ username })
    })
    const parsedPreLoginResponse = await preLoginResponse.json()
    if (!parsedPreLoginResponse.success) {
        displayError(parsedPreLoginResponse.message)
        return
    }

    const master_key = await deriveMasterKey(password, parsedPreLoginResponse.salt)
    const hashed_master_key = await hashMasterKey(master_key)

    const loginResponse = await fetch(URL+"/api/login/", {
        "method": "POST",
        "headers": {
            "content-type": "application/json",
        },
        "body": JSON.stringify({ username, hashed_master_key })
    })
    const parsedLoginResponse = await loginResponse.json()
    if (!parsedLoginResponse.success) {
        displayError(parsedLoginResponse.message)
        return
    }

    const iv = hexToArrayBuffer(parsedLoginResponse.iv)
    const tag = hexToArrayBuffer(parsedLoginResponse.tag)
    const encrypted = hexToArrayBuffer(parsedLoginResponse.encrypted_encryption_key)
    const data = new Uint8Array([...new Uint8Array(encrypted), ...new Uint8Array(tag)])

    const decrypted = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv,
            tagLength: 128
        },
        await crypto.subtle.importKey(
            "raw",
            master_key,
            { name: "AES-GCM" },
            false,
            ["decrypt"]
        ),
        data
    )
    const encryption_key = new Uint8Array(decrypted)
    localStorage.setItem("encryption_key", bufferToHex(encryption_key))
    document.location.href = "/"
})

registerButton.addEventListener("click", async () => {
    const response = await fetch(URL+"/api/register/", {
        "method": "POST",
        "headers": {
            "content-type": "application/json",
        },
        "body": JSON.stringify({ username: usernameInput.value, password: passwordInput.value })
    })
    const parsedResponse = await response.json()
    if (!parsedResponse.success) {
        displayError([parsedResponse.message, parsedResponse.reason])
        return
    }
    loginButton.click()
})