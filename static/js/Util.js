let gameID
gameID = getGameId()

function getGameId() {
    const regex = new RegExp(`${window.location.origin}/game\\?id=(\\d+)$`);
    const match = window.location.href.match(regex);
    return match ? match[1] : null
}

function ClearLocalStorage() {
    const keysToSave = ["isFirstTime", "history"];
    let keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        console.log(key)
        if (!keysToSave.includes(key)) {
            //console.log("should remove key")
            keysToRemove.push(key);
        }
    }

    for (const key of keysToRemove) {
        localStorage.removeItem(key)
    }
}

