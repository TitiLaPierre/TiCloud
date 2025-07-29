const uploadInput = document.querySelector("#upload--input")
const uploadFileList = document.querySelector("#upload--list")
const uploadEmptyLabel = document.querySelector("#upload--empty")
const uploadLabelIcon = document.querySelector("#upload--label--icon")
const uploadLabelText = document.querySelector("#upload--label--text")

const fileList = document.querySelector("#files")

const logoutButton = document.querySelector("#logout--button")

let files = null

function update_upload_list() {
    uploadFileList.innerHTML = ""
    let completedUploads = 0
    if (uploadInput.files.length === 0) {
        uploadFileList.setAttribute("style", "display: none;")
        uploadEmptyLabel.removeAttribute("style")
    } else {
        uploadFileList.removeAttribute("style")
        uploadEmptyLabel.setAttribute("style", "display: none;")
        for (const file of uploadInput.files) {
            if (file.uploaded) completedUploads++

            if (file.progress === undefined) file.progress = 0
            if (file.uploaded === undefined) file.uploaded = false

            const fileElement = document.createElement("div")
            fileElement.classList.add("upload")
            fileElement.innerHTML = `
            <h5 class="upload--head">
                ${file.uploaded ?
                `<span class="upload--icon material-symbols-rounded icon__success">cloud_done</span>` :
                `<span class="upload--icon material-symbols-rounded">cloud_upload</span>`
            }
                <span class="upload--filename">${file.name}</span>
            </h5>
            <div class="upload--bar"><div class="upload--progress" style="width: ${file.progress}%"></div></div>`
            uploadFileList.appendChild(fileElement)
        }
    }
    if (uploadInput.files.length === 0) {
        uploadLabelIcon.classList.remove("icon__success")
        uploadLabelIcon.innerText = "cloud"
        uploadLabelText.innerText = "Aucun transfert en cours"
    } else if (completedUploads === uploadInput.files.length) {
        uploadLabelIcon.classList.add("icon__success")
        uploadLabelIcon.innerText = "cloud_done"
        uploadLabelText.innerText = "Fichiers transférés"
    } else {
        uploadLabelIcon.classList.remove("icon__success")
        uploadLabelIcon.innerText = "cloud_upload"
        uploadLabelText.innerText = `${completedUploads}/${uploadInput.files.length} fichiers transférés`
    }
}

async function update_file_list(refetch) {
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

uploadInput.addEventListener("change", async function () {
    update_upload_list()
    for (const file of uploadInput.files) {
        if (file.uploaded) continue
        const response = await upload_file(file, (progress) => {
            file.progress = progress
            update_upload_list()
        })
        file.uploaded = true
        update_upload_list()
        files.push(response.file)
        update_file_list(false)
    }
})

logoutButton.addEventListener("click", account_logout)

document.body.addEventListener("drop", (e) => e.preventDefault())
document.body.addEventListener("dragover", (e) => e.preventDefault())

document.addEventListener("DOMContentLoaded", function () {
    uploadInput.value = ""
    update_upload_list()
    update_file_list(true)
})

// document.addEventListener("click", async function (e) {
//     if (e.target.closest(".file")) {
//         const fileId = e.target.closest(".file").getAttribute("data-file-id")
//         await delete_file(fileId)
//         files.splice(files.findIndex(file => file.id === fileId), 1)
//         update_file_list(false)
//     }
// })