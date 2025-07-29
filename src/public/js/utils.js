const URL = window.location.protocol + "//" + window.location.host

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
            iv[i]++;
            break;
        } else {
            iv[i] = 0;
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