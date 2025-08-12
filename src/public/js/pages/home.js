const uploadInput = document.querySelector("#upload--input")
const uploadFileList = document.querySelector("#upload--list")
const uploadEmptyLabel = document.querySelector("#upload--empty")
const uploadLabelIcon = document.querySelector("#upload--label--icon")
const uploadLabelText = document.querySelector("#upload--label--text")

const fileList = document.querySelector("#files")

const logoutButton = document.querySelector("#logout--button")

const actionsMenu = document.querySelector("#actions")
const actionDownload = document.querySelector("#action--download")
const actionDelete = document.querySelector("#action--delete")

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

function generate_file_preview(file) {
    const previewElement = document.createElement("div")
    previewElement.classList.add("file--preview")

    if (file.hasPreview) {
        if (file.preview) {
            previewElement.innerHTML = `<img src="${file.preview}" alt="${file.filename}">`
        } else {
            previewElement.innerHTML = `<span class="preview__loading material-symbols-rounded">progress_activity</span>`
            new Promise(async (resolve, reject) => {
                const preview = await get_preview(file.id)
                if (preview && preview.data && preview.data.startsWith("data:image/")) {
                    file.preview = preview.data
                    previewElement.innerHTML = `<img src="${file.preview}" alt="${file.filename}">`
                    resolve()
                } else {
                    file.hasPreview = false
                    previewElement.innerHTML = `<span class="material-symbols-rounded">draft</span>`
                }
            })
        }
    } else {
        previewElement.innerHTML = `<span class="material-symbols-rounded">draft</span>`
    }

    return previewElement
}

function generate_file_label(file) {
    const labelElement = document.createElement("div")
    labelElement.classList.add("file--label")
    labelElement.innerHTML = `
        <span class="file--name">${file.filename}</span>
        <button class="file--actions">
            <span class="material-symbols-rounded">more_vert</span>
        </button>
    `
    return labelElement
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
        fileElement.appendChild(generate_file_preview(file))
        fileElement.appendChild(generate_file_label(file))
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
        if (file.type.startsWith("image/")) {
            try {
                const preview = await imageFileToThumbnail(file)
                response.file.hasPreview = true
                response.file.preview = preview
                upload_preview(response.file.id, preview)
            } catch (error) {
                console.error(`Failed to create preview of ${file.name}`, error)
            }
        }
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
    actionsMenu.openedFor = null
})

document.addEventListener("click", function (e) {
    const fileElement = e.target.closest(".file--actions")
    const fileId = fileElement?.closest(".file")?.getAttribute("data-file-id")
    if (fileElement && fileId && e.target.closest(".file--actions")) {
        actionsMenu.openedFor = fileId
        actionsMenu.removeAttribute("style")
        actionsMenu.style.left = `${e.pageX}px`
        actionsMenu.style.top = `${e.pageY}px`
    } else if (!e.target.closest("#actions") && actionsMenu.openedFor) {
        actionsMenu.openedFor = null
        actionsMenu.setAttribute("style", "display: none;")
    }
})

document.addEventListener("contextmenu", function (e) {
    const fileId = e.target.closest(".file")?.getAttribute("data-file-id")
    if (fileId) {
        e.preventDefault()
        actionsMenu.openedFor = fileId
        actionsMenu.removeAttribute("style")
        actionsMenu.style.left = `${e.pageX}px`
        actionsMenu.style.top = `${e.pageY}px`
    } else if (!e.target.closest("#actions") && actionsMenu.openedFor) {
        actionsMenu.openedFor = null
        actionsMenu.setAttribute("style", "display: none;")
    }
})

actionDownload.addEventListener("click", async function () {
    if (actionsMenu.openedFor) {
        const fileId = actionsMenu.openedFor
        await download_file(fileId)
    }
})

actionDelete.addEventListener("click", async function () {
    if (actionsMenu.openedFor) {
        const fileId = actionsMenu.openedFor
        await delete_file(fileId)
        files.splice(files.findIndex(f => f.id === fileId), 1)
        update_file_list(false)
        actionsMenu.openedFor = null
        actionsMenu.setAttribute("style", "display: none;")
    }
})