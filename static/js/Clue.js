class Clue {
    constructor(clueID, remainAttempts, clueNode, clueImgContainer, clueImg, clueImgUnlocked, clueTextNode, clueText, cluePointerLeft, remainAttemptsTextNode, apiURL) {
        this.clueID = clueID
        this.clueNode = clueNode
        this.clueImgContainer = clueImgContainer
        this.clueImg = clueImg
        this.clueImgUnlocked = clueImgUnlocked
        this.clueTextNode = clueTextNode
        this.clueText = clueText
        this.cluePointerLeft = cluePointerLeft
        this.remainAttempts = remainAttempts
        this.remainAttemptsTextNode = remainAttemptsTextNode
        this.InitiateRemainAttempts()
        this.contentNodeText = null
        this.contentNode = null
        this.apiURL = apiURL

        this.isUnlocked = false
        this.hasBeenUsed = false
    }

    static currentVisibleClueID = -1
    static allClues = []
    static parser = new DOMParser();

    InitiateRemainAttempts() {
        this.remainAttemptsTextNode.innerText = this.remainAttempts
    }

    Unlock() {
        if(this.isUnlocked) {
            return
        }
        const scaleUpAndDown = [
            { transform: "scale(1)" },
            { transform: "scale(1.075)" },
        ];
        const scaleUpAndDownTiming = {
            duration: 250,
            iterations: 6,
            direction: "alternate",
            easing:"ease-in-out"
        };
        WaitForClue(this.apiURL)
            .then(data => {
                let border = localStorage.getItem('border');
                if(this.clueID === 1 && border !== null) {
                    this.contentNodeText = border
                } else {
                    this.contentNodeText = data.content
                }
                this.contentNode = Clue.parser.parseFromString(this.contentNodeText, 'text/html').body.firstChild;
                this.contentNode.style.display = "none"
                let clueContent = document.getElementById("clueContent")
                clueContent.appendChild(this.contentNode)

                this.isUnlocked = true
                this.remainAttempts = 0
                this.clueTextNode.innerHTML = this.clueText
                this.clueNode.classList.add("clueHover", "clueUnlocked")
                this.clueImgContainer.classList.add("clueImgUnlocked")
                this.clueImg.src = `./static/images/${this.clueImgUnlocked}.svg`
                this.clueNode.animate(scaleUpAndDown, scaleUpAndDownTiming)
                this.clueNode.addEventListener("click", () => {
                    if(Clue.currentVisibleClueID === this.clueID) {
                        this.ToggleContent()
                        return
                    }
                    if(!this.hasBeenUsed && !game.HasWon()) {
                        this.hasBeenUsed = true
                    }
                    localStorage.setItem('clues', JSON.stringify(Clue.GetDataForLocalStorage()));
                    Clue.allClues[this.clueID] = this

                    if(this.clueID === 1) {
                        localStorage.setItem('border', this.contentNodeText)
                    }
                    this.ToggleContent()
                })
            })
    }

    DecrementAttempts() {
        if(this.remainAttempts <= 0) {
            return
        }

        this.remainAttempts--
        this.remainAttempts === 0 ? this.Unlock() : this.remainAttemptsTextNode.innerText = this.remainAttempts
    }

    ToggleContent() {
        let clueContentContainer = document.getElementById("clueContentContainer")
        let cluePointer = document.getElementById("cluePointer")
        let isContainerDisplayed = getComputedStyle(clueContentContainer).display === "flex"
        cluePointer.style.left = this.cluePointerLeft
        if(!isContainerDisplayed) {
            this.contentNode.style.display = "flex"
            clueContentContainer.style.display = "flex"
            Clue.currentVisibleClueID = this.clueID
        }
        else if(isContainerDisplayed && Clue.currentVisibleClueID === this.clueID) {
            this.contentNode.style.display = "none"
            clueContentContainer.style.display = "none"
            Clue.currentVisibleClueID = -1
        } else {
            Clue.allClues[Clue.currentVisibleClueID].contentNode.style.display = "none"
            this.contentNode.style.display = "flex"
            Clue.currentVisibleClueID = this.clueID
        }
    }

    static UpdateCluesAttempts() {
        Clue.allClues.forEach((clue) => {
            clue.DecrementAttempts()
        });
    }

    static UnlockAllClues() {
        Clue.allClues.forEach((clue) => {
            clue.Unlock()
        });
    }

    static UsedClueCount() {
        let sum = 0
        Clue.allClues.forEach((clue) => {
            if(clue.hasBeenUsed) {
                sum++
            }
        });
        return sum
    }

    static GetDataForLocalStorage() {
        let returnData = []
        Clue.allClues.forEach((clue) => {
            let clueData = {
                clueID : clue.clueID,
                hasBeenUsed : clue.hasBeenUsed
            }
            returnData.push(clueData)
        });
        return returnData
    }
}

async function WaitForClue(apiURL) {
    const response = await fetch(apiURL);
    return await response.json();
}

function isSummerTime() {
    const now = new Date();
    const year = now.getFullYear();
    const marchLastSunday = new Date(year, 2, 31 - (new Date(year, 2, 31).getDay()));
    const octoberLastSunday = new Date(year, 9, 31 - (new Date(year, 9, 31).getDay()));

    return now >= marchLastSunday && now < octoberLastSunday;
}

function GetLocalStorageExpirationDate() {
    const desiredHour = 23;
    const desiredMinute = 59;
    const desiredSecond = 59
    const now = new Date();
    let expirationDate;
    let localHour;
    
    const clientTimeZoneOffset = now.getTimezoneOffset();
    const clientTimeZoneOffsetHours = clientTimeZoneOffset / 60;
    const timeShift = isSummerTime() ? 2 : 1
    const timeZoneDifferenceHours = clientTimeZoneOffsetHours + timeShift
    if(timeZoneDifferenceHours <= 0) {
        localHour = desiredHour + Math.abs(timeZoneDifferenceHours)
        expirationDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), localHour, desiredMinute, desiredSecond);
    } else {
        localHour = desiredHour - Math.abs(timeZoneDifferenceHours)
        expirationDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1, localHour, desiredMinute, desiredSecond);
    }

    return expirationDate;
}

function InitiateShapeClue() {
    let saveClues = JSON.parse(localStorage.getItem('clues'));
    let shapeClueNode = document.getElementById("clueShape")
    let shapeClueImgContainer = document.getElementById("clueShapeImgContainer")
    let shapeClueImg = document.getElementById("clueShapeImg")
    let shapeClueTextNode = document.getElementById("clueTextShape")
    let shapeClueAttemptsText = document.getElementById("shapeClueAttempts")
    let clueShape = null

    clueShape = new Clue(0, 5, shapeClueNode, shapeClueImgContainer, shapeClueImg, "shapeClue_unlocked",
        shapeClueTextNode, "Indice forme du pays", "14%", shapeClueAttemptsText, `/countryShape`)
    if(saveClues !== null) {
        clueShape.hasBeenUsed = saveClues[0].hasBeenUsed
    }
    Clue.allClues.push(clueShape)
}

function InitiateBorderClue() {
    let saveClues = JSON.parse(localStorage.getItem('clues'));
    let borderClueNode = document.getElementById("clueBorder")
    let borderClueImgContainer = document.getElementById("clueBorderImgContainer")
    let borderClueImg = document.getElementById("clueBorderImg")
    let borderClueTextNode = document.getElementById("clueTextBorder")
    let borderClueAttemptsText = document.getElementById("borderClueAttempts")
    let borderClue = null

    borderClue = new Clue(1, 8, borderClueNode, borderClueImgContainer, borderClueImg, "borderClue_unlocked",
        borderClueTextNode, "Indice pays frontalier", "50%", borderClueAttemptsText, `/randomBorder`)
    if(saveClues !== null) {
        borderClue.hasBeenUsed = saveClues[1].hasBeenUsed
    }
    Clue.allClues.push(borderClue)
}

function InitiateCapitalClue() {
    let saveClues = JSON.parse(localStorage.getItem('clues'));
    let capitalClueNode = document.getElementById("clueCapital")
    let capitalClueImgContainer = document.getElementById("clueCapitalImgContainer")
    let capitalClueImg = document.getElementById("clueCapitalImg")
    let capitalClueTextNode = document.getElementById("clueTextCapital")
    let capitalClueAttemptsText = document.getElementById("capitalClueAttempts")
    let capitalClue = null

    capitalClue = new Clue(2, 11, capitalClueNode, capitalClueImgContainer, capitalClueImg, "capitalClue_unlocked",
        capitalClueTextNode, "Indice capitale", "86%", capitalClueAttemptsText, `/capital`)
    if(saveClues !== null) {
        capitalClue.hasBeenUsed = saveClues[2].hasBeenUsed
    }
    Clue.allClues.push(capitalClue)
}

function ClearLocalStorage() {
    const keysToDelete = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key !== "isFirstTime") {
            keysToDelete.push(key);
        }
    }

    for (const key of keysToDelete) {
        localStorage.removeItem(key);
    }
}

function GoToPage(page) {
    window.location.href = `${window.location.href}${page}`
}

function InitiateClues() {
    let expirationDate = new Date(JSON.parse(localStorage.getItem('expirationDate')));
    if(expirationDate !== null) {
        if(expirationDate < new Date()) {
            ClearLocalStorage()
        }
    }

    localStorage.setItem('expirationDate', JSON.stringify(GetLocalStorageExpirationDate().getTime()));

    let isFirstTime = JSON.parse(localStorage.getItem('isFirstTime'));
    if(isFirstTime === null || isFirstTime) {
        GoToPage("welcome")
        localStorage.setItem('isFirstTime', JSON.stringify(false));
    }

    InitiateShapeClue()
    InitiateBorderClue()
    InitiateCapitalClue()
}
InitiateClues()