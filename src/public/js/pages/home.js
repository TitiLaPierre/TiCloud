const popupInput = document.querySelector("#file--input")
const popupFileList = document.querySelector("#file--list")
const popupFileCloseButton = document.querySelector("#file--close")

const fileList = document.querySelector("#files")

const logoutButton = document.querySelector("#logout--button")

let files = null

function update_upload_list() {
    popupFileList.innerHTML = ""
    if (popupInput.files.length === 0) {
        popupFileList.setAttribute("style", "display: none;")
    } else {
        popupFileList.removeAttribute("style")
        for (const file of popupInput.files) {
            if (file.progress === undefined) file.progress = 0
            if (file.uploaded === undefined) file.uploaded = false

            const fileElement = document.createElement("div")
            fileElement.classList.add("popup--file")
            fileElement.innerHTML = `
            <h5 class="popup--file--name">
                ${file.uploaded ?
                `<span class="popup--file--icon material-symbols-rounded icon__success">cloud_done</span>` :
                `<span class="popup--file--icon material-symbols-rounded">cloud_upload</span>`
            }
                <span class="popup--file--filename">${file.name}</span>
            </h5>
            <div class="popup--file--bar"><div class="popup--file--progress" style="width: ${file.progress}%"></div></div>`
            popupFileList.appendChild(fileElement)
        }
    }
    if (popupInput.files.length !== 0 && Array.from(popupInput.files).every(file => file.uploaded)) {
        popupFileCloseButton.removeAttribute("style")
    } else {
        popupFileCloseButton.setAttribute("style", "display: none;")
    }
}

async function update_file_list(files, refetch = false) {
    if (files === null || refetch) {
        files = await get_files()
    }
    fileList.innerHTML = ""
    for (const file of files) {
        const fileElement = document.createElement("div")
        fileElement.classList.add("file")
        fileElement.setAttribute("data-file-id", file.id)
        fileElement.innerHTML = `
            <div class="file--icon">
                <span class="material-symbols-rounded">draft</span>
            </div>
            <div class="file--label">
                <span class="file--name">${file.filename}</span>
                <button class="file--actions">
                    <span class="material-symbols-rounded">more_vert</span>
                </button>
            </div>`
        fileList.appendChild(fileElement)
    }
}

popupInput.addEventListener("change", async function () {
    update_upload_list()
    for (const file of popupInput.files) {
        if (file.uploaded) continue
        await upload_file(file, (progress) => {
            file.progress = progress
            update_upload_list()
        })
        file.uploaded = true
        update_upload_list()
        update_file_list(files, true)
    }
})

popupFileCloseButton.addEventListener("click", function () {
    popupInput.value = ""
    update_upload_list()
})

logoutButton.addEventListener("click", account_logout)

document.body.addEventListener("drop", (e) => e.preventDefault())
document.body.addEventListener("dragover", (e) => e.preventDefault())

document.addEventListener("DOMContentLoaded", async function () {
    popupInput.value = ""
    update_upload_list()
    await update_file_list(files)
})

document.addEventListener("click", async function (e) {
    if (e.target.closest(".file")) {
        const fileId = e.target.closest(".file").getAttribute("data-file-id")
        console.log(fileId)
    }
})