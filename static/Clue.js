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
        this.remainAttemptsTextNode.innerText = this.remainAttempts
        this.contentNode = contentNode

        this.isUnlocked = false
        this.hasBeenUsed = false
    }

    static currentVisibleClueID = -1
    static allClues = []

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
            if(!this.hasBeenUsed) {
                this.hasBeenUsed = true
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
            clueContentContainer.style.display = "flex"
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


// SHAPE CLUE
let shapeClueNode = document.getElementById("clueShape")
let shapeClueImgContainer = document.getElementById("clueShapeImgContainer")
let shapeClueImg = document.getElementById("clueShapeImg")
let shapeClueTextNode = document.getElementById("clueTextShape")
let shapeClueAttemptsText = document.getElementById("shapeClueAttempts")
let clueShape = null
WaitForCountryShape()
    .then(data => {
        let parsedData = JSON.parse(data)
        let contentNode = document.createElement("img")
        contentNode.classList.add('countryShape')
        contentNode.src = `./static/images/shapes/${parsedData.code}.svg`
        clueShape = new Clue(0, 7, shapeClueNode, shapeClueImgContainer, shapeClueImg, "shapeClue_unlocked",
            shapeClueTextNode, "Indice forme du pays", "12%", shapeClueAttemptsText, contentNode)
        Clue.allClues.push(clueShape)
    })
    .catch(error => {
        console.error('Une erreur s\'est produite :', error);
    })


// BORDER CLUE
let borderClueNode = document.getElementById("clueBorder")
let borderClueImgContainer = document.getElementById("clueBorderImgContainer")
let borderClueImg = document.getElementById("clueBorderImg")
let borderClueTextNode = document.getElementById("clueTextBorder")
let borderClueAttemptsText = document.getElementById("borderClueAttempts")
let borderClue = null
WaitForBorderName()
    .then(data => {
        let parsedData = JSON.parse(data)
        let borderName = parsedData.value
        let contentNode = document.createElement("div")
        contentNode.innerText = borderName
        borderClue = new Clue(1, 12, borderClueNode, borderClueImgContainer, borderClueImg, "borderClue_unlocked",
            borderClueTextNode, "Indice pays frontalier","50%", borderClueAttemptsText, contentNode)
        Clue.allClues.push(borderClue)
    })
    .catch(error => {
        console.error('Une erreur s\'est produite :', error);
    })


// CAPITAL CLUE
let capitalClueNode = document.getElementById("clueCapital")
let capitalClueImgContainer = document.getElementById("clueCapitalImgContainer")
let capitalClueImg = document.getElementById("clueCapitalImg")
let capitalClueTextNode = document.getElementById("clueTextCapital")
let capitalClueAttemptsText = document.getElementById("capitalClueAttempts")
let capitalClue = null
WaitForCapital()
    .then(data => {
        let parsedData = JSON.parse(data)
        let capital = parsedData.capital
        let contentNode = document.createElement("div")
        contentNode.innerText = capital
        capitalClue = new Clue(2, 17, capitalClueNode, capitalClueImgContainer, capitalClueImg, "capitalClue_unlocked",
            capitalClueTextNode,"Indice capitale", "88%", capitalClueAttemptsText, contentNode)
        Clue.allClues.push(capitalClue)
    })
    .catch(error => {
        console.error('Une erreur s\'est produite :', error);
    })