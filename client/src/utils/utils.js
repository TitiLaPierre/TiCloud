export function url(path) {
    if (path.startsWith("/")) {
        path = path.substring(1)
    }
    return `${window.location.origin}/${path}`
}

export const formatUrl = (str) => str.replace(/^\/|\/$/g, '').toLowerCase()

export function comparePath(route, pathname) {
    const [routeParts, pathnameParts] = [formatUrl(route).split("/"), formatUrl(pathname).split("/")]
    if (formatUrl(route) === "*") return { match: true, params: {} }
    if (routeParts.length !== pathnameParts.length) return { match: false }

    const params = {}
    for (let i = 0; i < routeParts.length; i++) {
        if (routeParts[i] === "*") continue
        else if (routeParts[i].startsWith(":")) params[routeParts[i].slice(1)] = pathnameParts[i]
        else if (routeParts[i] !== pathnameParts[i]) return { match: false }
    }
    return { match: true, params }
}

export const UPLOAD_CHUNK_SIZE = 1024*1024*5 // 5 Mo
export const PREVIEW_MAX_BYTES = 1024*100 // 100 Ko
export const PREVIEW_MAX_SIZE = 800
export const AUTH_TAG_LENGTH = 16
export const PREVIEW_ICONS = [
    // Image files
    {
        regex: /\.(jpg|jpeg|jpe|jfif|pjpeg|pjp|png|apng|gif|webp|avif|heif|heic|bmp|dib|tif|tiff|svg|svgz|ico|cur|ani|raw|arw|cr2|cr3|nef|orf|rw2|dng|pef|sr2|raf|3fr|mef|mos|mrw|nrw|srw|x3f|bay|bpg|hdr|exr|jxr|wdp|tga)$/i,
        icon: "image",
        color: "#27A3F5",
    },
    // Video files
    {
        regex: /\.(mp4|m4v|m4p|mov|qt|avi|wmv|asf|amv|flv|f4v|f4p|f4a|f4b|webm|mkv|mk3d|mka|mks|3gp|3g2|ogv|ogg|drc|mts|m2ts|ts|vob|rm|rmvb|yuv|divx|xvid|mpg|mpeg|mpv|m2v|mpe)$/i,
        icon: "videocam",
        color: "#D352FF",
    },
    // Audio files
    {
        regex: /\.(mp3|wav|wave|flac|alac|aac|m4a|m4b|m4p|m4r|aiff|aif|aifc|ogg|oga|opus|spx|amr|awb|wv|wma|ra|rm|mka|dsf|dff|mid|midi|kar|rmi|cda)$/i,
        icon: "headphones",
        color: "#FAA611",
    },
    // PDF files
    {
        regex: /\.(pdf)$/i,
        icon: "picture_as_pdf",
        color: "#E03C31",
    },
    // Archive & compressed files
    {
        regex: /\.(zip|zipx|rar|r[0-9]{2}|7z|7zip|tar|gz|tgz|bz2|tbz|tbz2|xz|txz|lz|lzma|tlz|z|Z|iso|img|dmg|vhd|vhdx|vmdk|qcow|qcow2|squashfs|cab|arj|ace|lzh|lha|uue|xxe|bin|cue)$/i,
        icon: "archive",
        color: "#A67238",
    },
    // Document files
    {
        regex: /\.(txt|pdf|doc|docx|docm|dot|dotx|dotm|odt|ott|rtf|wps|wpd)$/i,
        icon: "description",
        color: "#2B7BE5",
    },
    // Spreadsheet files
    {
        regex: /\.(xls|xlsx|xlsm|xlt|xltx|xltm|ods|ots|csv|tsv|dif|slk)$/i,
        icon: "table_view",
        color: "#5C9648",
    },
    // Presentation files
    {
        regex: /\.(ppt|pptx|pptm|pps|ppsx|ppsm|pot|potx|potm|odp|otp)$/i,
        icon: "slide_library",
        color: "#2B7BE5",
    },
    // Code files
    {
        regex: /\.(c|h|cpp|cc|cxx|hpp|hxx|ino|cs|java|class|jar|jsp|kt|kts|scala|py|pyw|pyc|pyo|ipynb|r|Rmd|rb|php|php3|php4|php5|phtml|pl|pm|t|lua|sh|bash|zsh|fish|bat|cmd|ps1|psm1|vbs|vb|asp|aspx|js|mjs|jsx|ts|tsx|html|htm|xhtml|xml|css|scss|sass|less|go|dart|swift|m|mm|hlsl|glsl|vert|frag|shader)$/i,
        icon: "code",
        color: "#FF4F4F",
    },
    // Text files
    {
        regex: /\.(txt|md|markdown|rst|adoc|asciidoc|log|nfo|info|readme|me|tex)$/i,
        icon: "text_fields",
        color: "#525252",
    },
    // Data files
    {
        regex: /\.(json|jsonl|ndjson|xml|yaml|yml|toml|ini|cfg|conf|properties|db|sqlite|sqlite3|sql|parquet|avro|orc)$/i,
        icon: "code",
        color: "#FFF840",
    },
    // Font files
    {
        regex: /\.(ttf|otf|woff|woff2|eot|fon)$/i,
        icon: "font_download",
        color: "#525252",
    },
    // Executable files
    {
        regex: /\.(exe|msi|msix|app|apk|deb|rpm|pkg|dmg|run|bin|sh|bash|bat|cmd|com|elf|jar)$/i,
        icon: "sdk",
        color: "#525252",
    },
    // 3D model files
    {
        regex: /\.(stl|obj|mtl|fbx|dae|3ds|blend|ply|gltf|glb|iges|igs|step|stp)$/i,
        icon: "3d_rotation",
        color: "#27A3F5",
    },
]