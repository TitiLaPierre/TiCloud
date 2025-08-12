const CHUNK_SIZE = 1024*1024*5 // 5 Mo
const MAX_PREVIEW_BYTES = 1024*100 // 100 Ko
const MAX_PREVIEW_SIZE = 800
const AUTH_TAG_LENGTH = 16

const SITE_URL = window.location.protocol + "//" + window.location.host

streamSaver.mitm = SITE_URL+"/mitm.html"

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(SITE_URL+"/sw.js", { scope: '/' })
}

function hexToArrayBuffer(hex) {
    const typedArray = new Uint8Array(hex.length / 2)
    for (let i = 0; i < typedArray.length; i++) {
        typedArray[i] = parseInt(hex.substring(i*2, i*2 + 2), 16)
    }
    return typedArray.buffer
}

function bufferToHex(buffer) {
    return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('')
}

function incrementIV(iv) {
    for (let i = iv.length - 1; i >= 0; i--) {
        if (iv[i] < 255) {
            iv[i]++
            break
        } else {
            iv[i] = 0
        }
    }
}

const EXTERNAL_MESSAGES = {
    "invalid_request": "Un problème est survenu lors de la requête.",
    "invalid_credentials": "La combinaison nom d'utilisateur/mot de passe est incorrecte.",
    "invalid_fields": "Certains champs sont invalides.",
    "authentification_required": "Vous devez être connecté pour effectuer cette action.",
    "already_existing_user": "Un utilisateur possède déjà ce nom d'utilisateur.",
    "internal_error": "Une erreur est survenue de notre côté.",
    "file_not_found": "Le fichier demandé n'a pas été trouvé.",
    "unknown_route": "Une requête a été faite vers une route inconnue.",

    "username_not_starting_with_alphanumeric": "Le nom d'utilisateur doit commencer par une lettre ou un chiffre.",
    "username_too_short": "Le nom d'utilisateur doit comporter au moins 3 caractères.",
    "username_too_long": "Le nom d'utilisateur ne doit pas dépasser 24 caractères.",
    "username_unauthorized_character": "Le nom d'utilisateur ne peut contenir que des lettres, des chiffres, des espaces, des tirets et des tirets bas.",
    "invalid_username": "Le nom d'utilisateur n'est pas valide.",
    "invalid_password": "Le mot de passe n'est pas valide.",
    "user_creation_failed": "Un problème est survenu de notre côté lors de la création du compte.",

    "password_too_short": "Le mot de passe doit comporter au moins 6 caractères.",
    "password_too_long": "Le mot de passe ne doit pas dépasser 100 caractères.",
    "password_require_uppercase": "Le mot de passe doit contenir au moins une lettre majuscule.",
    "password_require_lowercase": "Le mot de passe doit contenir au moins une lettre minuscule.",
    "password_require_number": "Le mot de passe doit contenir au moins un chiffre.",
    "password_require_special_character": "Le mot de passe doit contenir au moins un caractère spécial parmi !@#$%^&*()_+-=[]{};':\"|,.<>/?",
    "password_unauthorized_character": "Le mot de passe ne peut contenir que des lettres, des chiffres et les caractères spéciaux parmi !@#$%^&*()_+-=[]{};':\"|,.<>/?",

    "account_fount": "Le compte a été trouvé.",
    "user_created": "Votre compte a correctement été créé.",
    "logged_in": "Vous avez été connecté à votre compte.",
    "logged_out": "Vous avez été déconnecté de votre compte.",
    "ready_for_upload": "Le serveur est prêt à recevoir un fichier.",
    "files_fetched": "Fichiers ont été récupérés.",
    "file_deleted": "Le fichier a été supprimé.",
}

const FILE_ICONS_REGEX = [
    // Image files
    /\.(jpg|jpeg|jpe|jfif|pjpeg|pjp|png|apng|gif|webp|avif|heif|heic|bmp|dib|tif|tiff|svg|svgz|ico|cur|ani|raw|arw|cr2|cr3|nef|orf|rw2|dng|pef|sr2|raf|3fr|mef|mos|mrw|nrw|srw|x3f|bay|bpg|hdr|exr|jxr|wdp|tga)$/i,
    // Video files
    /\.(mp4|m4v|m4p|mov|qt|avi|wmv|asf|amv|flv|f4v|f4p|f4a|f4b|webm|mkv|mk3d|mka|mks|3gp|3g2|ogv|ogg|drc|mts|m2ts|ts|vob|rm|rmvb|yuv|divx|xvid|mpg|mpeg|mpv|m2v|mpe)$/i,
    // Audio files
    /\.(mp3|wav|wave|flac|alac|aac|m4a|m4b|m4p|m4r|aiff|aif|aifc|ogg|oga|opus|spx|amr|awb|wv|wma|ra|rm|mka|dsf|dff|mid|midi|kar|rmi|cda)$/i,
    // PDF files
    /\.(pdf)$/i,
    // Archive & compressed files
    /\.(zip|zipx|rar|r[0-9]{2}|7z|7zip|tar|gz|tgz|bz2|tbz|tbz2|xz|txz|lz|lzma|tlz|z|Z|iso|img|dmg|vhd|vhdx|vmdk|qcow|qcow2|squashfs|cab|arj|ace|lzh|lha|uue|xxe|bin|cue)$/i,
    // Document files
    /\.(doc|docx|docm|dot|dotx|dotm|odt|ott|rtf|wps|wpd)$/i,
    /\.(xls|xlsx|xlsm|xlt|xltx|xltm|ods|ots|csv|tsv|dif|slk)$/i,
    /\.(ppt|pptx|pptm|pps|ppsx|ppsm|pot|potx|potm|odp|otp)$/i,
    // Code files
    /\.(c|h|cpp|cc|cxx|hpp|hxx|ino|cs|java|class|jar|jsp|kt|kts|scala|py|pyw|pyc|pyo|ipynb|r|Rmd|rb|php|php3|php4|php5|phtml|pl|pm|t|lua|sh|bash|zsh|fish|bat|cmd|ps1|psm1|vbs|vb|asp|aspx|js|mjs|jsx|ts|tsx|html|htm|xhtml|xml|css|scss|sass|less|go|dart|swift|m|mm|hlsl|glsl|vert|frag|shader)$/i,
    // Text files
    /\.(txt|md|markdown|rst|adoc|asciidoc|log|nfo|info|readme|me|tex)$/i,
    // Data files
    /\.(json|jsonl|ndjson|xml|yaml|yml|toml|ini|cfg|conf|properties|db|sqlite|sqlite3|sql|parquet|avro|orc)$/i,
    // Font files
    /\.(ttf|otf|woff|woff2|eot|fon)$/i,
    // Executable files
    /\.(exe|msi|msix|app|apk|deb|rpm|pkg|dmg|run|bin|sh|bash|bat|cmd|com|elf|jar)$/i,
    // 3D model files
    /\.(stl|obj|mtl|fbx|dae|3ds|blend|ply|gltf|glb|iges|igs|step|stp)$/i,
]
const FILE_ICONS_DATA = [
    { name: "image", color: "#27A3F5" },
    { name: "videocam", color: "#D352FF"},
    { name: "headphones", color: "#FAA611" },
    { name: "picture_as_pdf", color: "#E03C31" },
    { name: "archive", color: "#A67238" },
    { name: "description", color: "#2B7BE5" },
    { name: "table_view", color: "#5C9648" },
    { name: "slide_library", color: "#2B7BE5" },
    { name: "code", color: "#FF4F4F" },
    { name: "text_fields", color: "#525252" },
    { name: "code", color: "#FFF840" },
    { name: "font_download", color: "#525252" },
    { name: "sdk", color: "#525252" },
    { name: "3d_rotation", color: "#27A3F5" },
]

if (FILE_ICONS_REGEX.length !== FILE_ICONS_DATA.length) {
    throw new Error("FILE_ICONS_REGEX and FILE_ICONS_DATA must have the same length")
}