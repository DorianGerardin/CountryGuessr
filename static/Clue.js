class Clue {
    constructor(clueID, remainAttempts, clueNode, clueImgContainer, clueImg, clueImgUnlocked, clueTextNode, clueText, cluePointerLeft, remainAttemptsTextNode, contentNode) {
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
        this.contentNode = contentNode

        this.isUnlocked = false
        this.hasBeenUsed = false
    }

    static currentVisibleClueID = -1
    static allClues = []


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

            let clueContent = document.getElementById("clueContent")
            if(clueContent.childNodes.length === 0) {
                clueContent.appendChild(this.contentNode)
            } else {
                clueContent.childNodes[0].replaceWith(this.contentNode)
            }
            this.ToggleContent()
            if(!this.hasBeenUsed && !game.HasWon()) {
                this.hasBeenUsed = true
            }
            localStorage.setItem('clues', JSON.stringify(Clue.GetDataForLocalStorage()));
            Clue.allClues[this.clueID] = this

            if(this.clueID === 1) {
                let border = {
                    value : this.contentNode.innerText
                }
                localStorage.setItem('border', JSON.stringify(border))
            }
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
        let isDisplayed = getComputedStyle(clueContentContainer).display === "flex"
        cluePointer.style.left = this.cluePointerLeft
        if(!isDisplayed) {
            clueContentContainer.style.display = "flex"
            Clue.currentVisibleClueID = this.clueID
        }
        else if(isDisplayed && Clue.currentVisibleClueID === this.clueID) {
            clueContentContainer.style.display = "none"
            Clue.currentVisibleClueID = -1
        } else {
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

async function WaitForCountryShape() {
    const apiURL = `/countryShape`
    const response = await fetch(apiURL);
    return await response.json();
}

async function WaitForBorderName() {
    const apiURL = `/randomBorder`
    const response = await fetch(apiURL);
    return await response.json();
}

async function WaitForCapital() {
    const apiURL = `/capital`
    const response = await fetch(apiURL);
    return await response.json();
}

function GetLocalStorageExpirationDate() {
    let date = new Date();
    let offsetMinutes = date.getTimezoneOffset();
    let parisOffsetMinutes = -60; // En hiver
    let isSummerTime = false;
    if (date.getMonth() >= 2 && date.getMonth() <= 9) {
        isSummerTime = true;
    }
    if (isSummerTime) {
        parisOffsetMinutes = -120; // En été (mars à octobre)
    }
    let adjustedOffsetMinutes = parisOffsetMinutes - offsetMinutes;
    date.setMinutes(date.getMinutes() + adjustedOffsetMinutes);
    date.setHours(23, 59, 59);
    return date
}

function InitiateShapeClue(data) {
    let saveClues = JSON.parse(localStorage.getItem('clues'));
    let shapeClueNode = document.getElementById("clueShape")
    let shapeClueImgContainer = document.getElementById("clueShapeImgContainer")
    let shapeClueImg = document.getElementById("clueShapeImg")
    let shapeClueTextNode = document.getElementById("clueTextShape")
    let shapeClueAttemptsText = document.getElementById("shapeClueAttempts")
    let clueShape = null

    let parsedData = JSON.parse(data)
    let contentNode = document.createElement("img")
    contentNode.classList.add('countryShape')
    contentNode.src = `./static/images/shapes/${parsedData.code}.svg`
    clueShape = new Clue(0, 7, shapeClueNode, shapeClueImgContainer, shapeClueImg, "shapeClue_unlocked",
        shapeClueTextNode, "Indice forme du pays", "14%", shapeClueAttemptsText, contentNode)
    if(saveClues !== null) {
        clueShape.hasBeenUsed = saveClues[0].hasBeenUsed
    }
    Clue.allClues.push(clueShape)
}

function InitiateBorderClue(data) {
    let saveClues = JSON.parse(localStorage.getItem('clues'));
    let border = JSON.parse(localStorage.getItem('border'));
    let borderClueNode = document.getElementById("clueBorder")
    let borderClueImgContainer = document.getElementById("clueBorderImgContainer")
    let borderClueImg = document.getElementById("clueBorderImg")
    let borderClueTextNode = document.getElementById("clueTextBorder")
    let borderClueAttemptsText = document.getElementById("borderClueAttempts")
    let borderClue = null

    let borderName
    if(border !== null) {
        borderName = border.value
    } else {
        let parsedData = JSON.parse(data)
        borderName = parsedData.value
    }

    let contentNode = document.createElement("div")
    contentNode.innerText = borderName
    borderClue = new Clue(1, 12, borderClueNode, borderClueImgContainer, borderClueImg, "borderClue_unlocked",
        borderClueTextNode, "Indice pays frontalier", "50%", borderClueAttemptsText, contentNode)
    if(saveClues !== null) {
        borderClue.hasBeenUsed = saveClues[1].hasBeenUsed
    }
    Clue.allClues.push(borderClue)
}

function InitiateCapitalClue(data) {
    let saveClues = JSON.parse(localStorage.getItem('clues'));
    let capitalClueNode = document.getElementById("clueCapital")
    let capitalClueImgContainer = document.getElementById("clueCapitalImgContainer")
    let capitalClueImg = document.getElementById("clueCapitalImg")
    let capitalClueTextNode = document.getElementById("clueTextCapital")
    let capitalClueAttemptsText = document.getElementById("capitalClueAttempts")
    let capitalClue = null

    let parsedData = JSON.parse(data)
    let capital = parsedData.capital
    let contentNode = document.createElement("div")
    contentNode.innerText = capital
    capitalClue = new Clue(2, 15, capitalClueNode, capitalClueImgContainer, capitalClueImg, "capitalClue_unlocked",
        capitalClueTextNode, "Indice capitale", "86%", capitalClueAttemptsText, contentNode)
    if(saveClues !== null) {
        capitalClue.hasBeenUsed = saveClues[2].hasBeenUsed
    }
    Clue.allClues.push(capitalClue)
}

function InitiateClues() {
    let expirationDate = new Date(JSON.parse(localStorage.getItem('expirationDate')));
    if(expirationDate !== null) {
        if(expirationDate < new Date()) {
            localStorage.clear()
        }
    }

    localStorage.setItem('expirationDate', JSON.stringify(GetLocalStorageExpirationDate().getTime()));

    WaitForCountryShape()
        .then(shapeData => {
            InitiateShapeClue(shapeData)
            WaitForBorderName().then((borderData) => {
                InitiateBorderClue(borderData)
                WaitForCapital().then((capitalData) => {
                    InitiateCapitalClue(capitalData)
                    CheckForHistory()
                })
            })
        })
        .catch(error => {
            console.log("Erreur : " + error);
        })
}
InitiateClues()