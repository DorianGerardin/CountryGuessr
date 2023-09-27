const countryInput = document.getElementById('countryInput');
const countryForm = document.getElementById('countryForm');
const countrySubmit = document.getElementById('countrySubmit');
const suggestions = document.getElementById('suggestions');
const answersContainer = document.getElementById('answersContainer');
const answersGrid = document.getElementById('answersGrid');
const zoomContainer = document.getElementById('zoomContainer')
const zoomButton = document.getElementById('zoomButton')

let incrementAttempt, getAttemptCount;
(function () {
    let attempt = 0;
    incrementAttempt = function() {
        attempt++;
    };
    getAttemptCount = function() {
        return attempt;
    };
})();

let addShareLine, getShareContent, get5FirstShare
(function () {
    let shareContent = "";
    addShareLine = function(newline) {
        shareContent = "\n" + newline + shareContent;
    };
    getShareContent = function() {
        return shareContent;
    };
    get5FirstShare = function() {
        return "\n" + shareContent.split("\n").slice(1, 6).join("\n") + "\n";
    }
})();

let decrementClueAttempt, getDetailClueRemainAttempt, getLetterClueRemainAttempt, getFlagClueRemainAttempt;
(function () {
    let detailClueRemainAttempt = 5;
    let letterClueRemainAttempt = 10;
    let flagClueRemainAttempt = 15;
    decrementClueAttempt = function() {
        detailClueRemainAttempt -= 1;
        letterClueRemainAttempt -= 1;
        flagClueRemainAttempt -= 1;
    };
    getDetailClueRemainAttempt = function() {
        return detailClueRemainAttempt;
    };
    getLetterClueRemainAttempt = function() {
        return letterClueRemainAttempt;
    };
    getFlagClueRemainAttempt = function() {
        return flagClueRemainAttempt;
    }
})();

function startGame() {
    let hasWon = false;
    function endGame() {
        hasWon = true;
    }
    function HasWon() {
        return hasWon;
    }
    return {
        endGame,
        HasWon,
    };
}
const game = startGame()

let zoomedIn = false
let isZoomDisplayed = false
let hasAlreadyAnswered = false
let currentCountry = null
let countrySuggestionList
let countriesName = [];
GetAllCountriesName()

countrySubmit.addEventListener('click', SubmitCountry)
countryInput.addEventListener('keydown', (e) => TrySubmitCountry(e))
countryInput.addEventListener('input', (e) => UpdateSuggestions(e))
countryInput.addEventListener('click', (e) => UpdateSuggestions(e))
document.addEventListener("DOMContentLoaded", () => {
    window.addEventListener("resize", () => {
        adjustTextSize()
        if(window.innerWidth > 480) {
            HideZoomButton()
            if(zoomedIn) ZoomOut()
        } else {
            ShowZoomButton();
        }
    });
});
document.body.addEventListener("click", (e) => {
  if(countryInput.style.visibility === "hidden" || e.target === countryInput) {
    return
  }
  countrySuggestionList.Hide()
})
zoomButton.addEventListener('click', () => {
    zoomedIn ? ZoomOut() : ZoomIn()
})

function GetCountriesBySuggestion(suggestion) {
    let regExpSuggestion = new RegExp(`.*${suggestion}.*`, 'giu')
    return countriesName.filter(country => country.name.match(regExpSuggestion) || country.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(regExpSuggestion));
}

function UpdateSuggestions(event) {
    if(event.type === "input" && currentCountry !== null) {
        currentCountry = null
    }
    const searchText = countryInput.value.trim();
    countrySuggestionList.Show(GetCountriesBySuggestion(searchText))
}

function GetAllCountriesName() {
  fetch(`/AllCountriesName`)
    .then(response => response.json())
    .then(data => {
      if (data.status === 404) {
          console.log("aucun pays trouvé");
      } else {
        countriesName = JSON.parse(data)
        countrySuggestionList = new CountrySuggestionList(countriesName, suggestions, countryInput)
        countryForm.style.display = "flex"
      }
    });
}

function TrySubmitCountry(event) {
    if(event.key !== "Enter" || !countrySuggestionList.IsEmpty()) {
        return
    }
    event.preventDefault();
    SubmitCountry()
}

function SubmitCountry() {
    if(game.HasWon()) {
        return
    }
    if(!currentCountry) {
      DisplayWrongCountry()
      return
    }
    fetch(`/guess?code=${currentCountry}`)
      .then(response => response.json())
      .then(data => {
          incrementAttempt()
          if(!hasAlreadyAnswered) {
              answersContainer.style.display = "flex"
          }
          countryInput.value = ""
          currentCountry = null
          hasAlreadyAnswered = true
          let countryData = JSON.parse(data)
          CreateAnswerRow(countryData)
          UpdateClues()
          ShowZoomButton();
          if(countryData.isAnswer) {
              WinGame(countryData)
          }
      })
      .catch(error => {
          console.error('Une erreur s\'est produite :', error);
      });
}

function UpdateClues() {
    let detailClueNode = document.getElementById("clueDetail")
    let detailClueImgContainer = document.getElementById("clueDetailImgContainer")
    let detailClueImg = document.getElementById("clueDetailImg")
    let detailClueAttemptsText = document.getElementById("detailClueAttempts")
    let clueTextDetail = document.getElementById("clueTextDetail")

    let letterClueNode = document.getElementById("clueLetter")
    let letterClueImgContainer = document.getElementById("clueLetterImgContainer")
    let letterClueImg = document.getElementById("clueLetterImg")
    let letterClueAttemptsText = document.getElementById("letterClueAttempts")
    let clueTextLetter = document.getElementById("clueTextLetter")

    let flagClueNode = document.getElementById("clueFlag")
    let flagClueImgContainer = document.getElementById("clueFlagImgContainer")
    let flagClueImg = document.getElementById("clueFlagImg")
    let flagClueAttemptsText = document.getElementById("flagClueAttempts")
    let clueTextFlag = document.getElementById("clueTextFlag")

    decrementClueAttempt();
    let detailClueAttempts = getDetailClueRemainAttempt()
    let letterClueAttempts = getLetterClueRemainAttempt()
    let flagClueAttempts = getFlagClueRemainAttempt()

    if(detailClueAttempts <= 0) {
        clueTextDetail.innerHTML = "Indice caractéristique"
        detailClueNode.classList.add("clueHover", "clueUnlocked")
        detailClueImgContainer.classList.add("clueImgUnlocked")
        detailClueImg.src = "./static/images/detailClue_unlocked.svg"
        detailClueNode.addEventListener("click", () => {
            console.log("indice detail")
        })

    }
    else {
        detailClueAttemptsText.innerText = detailClueAttempts
    }

    if(letterClueAttempts <= 0) {
        clueTextLetter.innerHTML = "Indice première lettre"
        letterClueNode.classList.add("clueHover", "clueUnlocked")
        letterClueImgContainer.classList.add("clueImgUnlocked")
        letterClueImg.src = "./static/images/letterClue_unlocked.svg"
        letterClueNode.addEventListener("click", () => {
            console.log("indice lettre")
        })
    }
    else {
        letterClueAttemptsText.innerText = letterClueAttempts
    }

    if(flagClueAttempts <= 0) {
        clueTextFlag.innerHTML = "Indice drapeau"
        flagClueNode.classList.add("clueHover", "clueUnlocked")
        flagClueImgContainer.classList.add("clueImgUnlocked")
        flagClueImg.src = "./static/images/flagClue_unlocked.svg"
        flagClueNode.addEventListener("click", () => {
            console.log("indice drapeau")
        })
    }
    else {
        flagClueAttemptsText.innerText = flagClueAttempts
    }
}

function WinGame(countryData) {
    countryForm.remove()
    const scaleUpAndDown = [
        { transform: "scale(1)" },
        { transform: "scale(1.05)" },
    ];
    const scaleUpAndDownTiming = {
        duration: 250,
        iterations: 6,
        direction: "alternate",
        easing:"ease-in-out"
    };
    game.endGame()
    let attemptCount = getAttemptCount()
    let attemptsElements = document.getElementsByClassName("ggAttemptsCount")
    for (let i = 0; i < attemptsElements.length; i++) {
        attemptsElements[i].innerText = attemptCount
    }

    document.getElementById("essai").innerText = attemptCount > 1 ? "essais" : "essai"
    let shareContent = getShareContent()
    let shareContentElement = document.getElementById('shareContent')
    if(attemptCount > 5) {
        shareContentElement.innerHTML += get5FirstShare() + `+ ${attemptCount - 5} de plus`
    } else {
        shareContentElement.innerHTML += shareContent;
    }
    let copyButton = document.getElementById("shareButton")
    copyButton.addEventListener("click", () => {
        navigator.clipboard.writeText(shareContentElement.innerText).then(function() {
            DisplayCopiedToClipboard()
        }).catch(function(err) {
            console.error('Erreur lors de la copie du texte : ', err);
        });
    })

    let ggFlagImg = document.getElementById("ggFlagImg")
    let ggCountryName = document.getElementById("ggCountryName")
    ggFlagImg.src = `./static/images/flags/${countryData.code}.svg`
    ggCountryName.innerText = countryData.name

    setTimeout(function() {
        let ggContainer = document.getElementById("ggContainer")
        ggContainer.style.display = "flex";
        ggContainer.scrollIntoView({ behavior: "smooth"});
        ggContainer.animate(scaleUpAndDown, scaleUpAndDownTiming)
    }, 50);
}

function DisplayWrongCountry() {
    let toast = Toastify({
        text: "Pays introuvable",
        duration: 1500,
        gravity: "top", // `top` or `bottom`
        position: "center", // `left`, `center` or `right`
        avatar: './static/images/alert.svg',
        className: "toast",
        stopOnFocus: false, // Prevents dismissing of toast on hover
        onClick: function(){
            toast.hideToast()
        }
    })
    toast.showToast();
}

function DisplayCopiedToClipboard() {
    let toast = Toastify({
        text: "Copié dans le presse-papiers",
        duration: 1500,
        gravity: "top", // `top` or `bottom`
        position: "center", // `left`, `center` or `right`
        avatar: './static/images/clipboard.png',
        className: "toast",
        stopOnFocus: false, // Prevents dismissing of toast on hover
        onClick: function(){
            toast.hideToast()
        }
    })
    toast.showToast();
}

function CreateAnswerSquare(answerNumber, rowNode, textValue, ratio) {
    let squareNode = document.createElement("div");
    let squareContentNode = document.createElement("div");
    squareNode.classList.add("answerSquare")
    squareNode.classList.add(`answer${answerNumber}`)
    squareContentNode.classList.add("answerContent")
    squareContentNode.innerText = textValue
    PickColor(squareNode, ratio)
    squareNode.appendChild(squareContentNode)
    rowNode.appendChild(squareNode)
    return squareNode
}

function CreateArrowSquare(answerNumber, rowNode, textValue, ratio, equals, isDistance = false) {
    let squareNode = document.createElement("div");
    let squareContentNode = document.createElement("div");
    squareNode.classList.add("answerSquare")
    squareNode.classList.add(`answer${answerNumber}`)
    squareContentNode.classList.add("answerContent")
    squareContentNode.innerText = numberWithSpaces(textValue)
    if(isDistance) {
        PickColorDistance(squareNode, ratio)
    } else {
        AddArrowIndicator(equals, squareContentNode)
        PickColor(squareNode, ratio)
    }
    squareNode.appendChild(squareContentNode)
    rowNode.appendChild(squareNode)
    return squareNode
}

function CreateAnswerRow(countryData) {
    let answerRow= document.createElement("div");
    answerRow.classList.add("answerRow")

    let newLineEmojis = ""

    // NAME
    let nameNode = document.createElement("div");
    let nameContentNode = document.createElement("div");
    nameNode.style.cursor = "pointer"
    nameNode.addEventListener("click", () => {
        window.open(countryData.maps, "_blank");
    })
    nameNode.classList.add("answerSquare")
    nameNode.classList.add("answer0")
    nameContentNode.classList.add("answerContent")
    let flagBG = document.createElement("div");
    flagBG.classList.add("backgroundFlag")
    flagBG.style.backgroundImage = `url(./static/images/flags/${countryData.code}.svg)`
    nameContentNode.innerText = countryData.name
    nameContentNode.appendChild(flagBG)
    nameNode.appendChild(nameContentNode)
    answerRow.appendChild(nameNode)

    // CONTINENT
    let continentRatio = countryData.continent.isEqual ? 1 : 0
    let continentSquareNode = CreateAnswerSquare(1, answerRow, countryData.continent.value, continentRatio)
    let continentEmoji = getEmojiByColor(continentSquareNode.classList)
    newLineEmojis += continentEmoji

    // LANGUAGE
    let languageRatio = countryData.language.isEqual ? 1 : 0
    let languageSquareNode = CreateAnswerSquare(2, answerRow, countryData.language.value, languageRatio)
    let languageEmoji = getEmojiByColor(languageSquareNode.classList)
    newLineEmojis += languageEmoji

    // POPULATION
    let populationSquareNode = CreateArrowSquare(3, answerRow, countryData.populationCount.value, countryData.populationCount.ratio, countryData.populationCount.isEqual)
    let populationEmoji = getEmojiByColor(populationSquareNode.classList)
    newLineEmojis += populationEmoji

    // CURRENCY
    let currencyRatio = countryData.currency.isEqual ? 1 : 0
    let currencySquareNode = CreateAnswerSquare(4, answerRow, countryData.currency.value, currencyRatio)
    let currencyEmoji = getEmojiByColor(currencySquareNode.classList)
    newLineEmojis += currencyEmoji

    // BORDERS
    let bordersSquareNode = CreateArrowSquare(5, answerRow, countryData.borderCount.value, countryData.borderCount.ratio, countryData.borderCount.isEqual)
    let bordersEmoji = getEmojiByColor(bordersSquareNode.classList)
    newLineEmojis += bordersEmoji

    // AREA
    let areaSquareNode = CreateArrowSquare(6, answerRow, countryData.area.value, countryData.area.ratio, countryData.area.isEqual)
    let areaEmoji = getEmojiByColor(areaSquareNode.classList)
    newLineEmojis += areaEmoji

    // DISTANCE
    let distanceSquareNode = CreateArrowSquare(7, answerRow, countryData.distance.value, countryData.distance.ratio, false, true)
    let distanceEmoji = getEmojiByColor(distanceSquareNode.classList)
    newLineEmojis += distanceEmoji

    addShareLine(newLineEmojis)
    answersGrid.prepend(answerRow)
    adjustTextSize(answerRow);
}

function getEmojiByColor(classList) {
    if(classList.contains("badAnswer")) {
        return "🟥"
    } else if (classList.contains("answerPercent25_50")) {
        return "🟧"
    } else if(classList.contains("answerPercent50_75")) {
        return "🟨"
    } else {
        return "🟩"
    }
}

function numberWithSpaces(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function AddArrowIndicator(value, node) {
    let upArrow = document.createElement("div");
    upArrow.classList.add("backgroundArrow")
    upArrow.style.backgroundImage = `url("./static/images/up_arrow.png")`

    let downArrow = document.createElement("div");
    downArrow.classList.add("backgroundArrow")
    downArrow.style.backgroundImage = `url("./static/images/down_arrow.png")`

    if(value === "=") {
        node.classList.add("goodAnswer")
        return
    }
    node.appendChild(value === "+" ? upArrow : downArrow)
}

function PickColor(node, ratio) {
    let answerColorClass = ratio < 0.25 ? "badAnswer" : ratio < 0.5 ? "answerPercent25_50" : ratio < 0.75 ? "answerPercent50_75" : "goodAnswer"
    node.classList.add(answerColorClass)
}

function PickColorDistance(node, ratio) {
    let answerColorClass = ratio < 0.575 ? "badAnswer" : ratio < 0.75 ? "answerPercent25_50" : ratio < 0.85 ? "answerPercent50_75" : "goodAnswer"
    node.classList.add(answerColorClass)
}

function adjustTextSize(answerRow) {
    let containers = answerRow !== undefined ? answerRow.querySelectorAll('.answerSquare') : document.getElementsByClassName("answerSquare");
    for (const answerSquare of containers) {
        if(!answerSquare.classList.contains("answer0") && !answerSquare.classList.contains("answer1") && !answerSquare.classList.contains("answer2")
            && !answerSquare.classList.contains("answer3") && !answerSquare.classList.contains("answer4") && !answerSquare.classList.contains("answer6")) {
            continue
        }
        answerSquare.style.removeProperty('fontSize');
        let defaultFontSize = parseFloat(getComputedStyle(document.getElementById("answersContainer")).fontSize);
        let containerWidth = answerSquare.clientWidth
        let answerContent = answerSquare.querySelector('.answerContent');
        let textWidth = measureTextWidth(answerContent.textContent, getComputedStyle(answerContent).font);

        let currentFontSize = parseFloat(getComputedStyle(answerContent).fontSize)
        let newFontSize = containerWidth * 3 / textWidth * currentFontSize
        answerContent.style.fontSize = Math.min(newFontSize, defaultFontSize) + "px";
    }
}

function measureTextWidth(text, font) {
    let canvas = document.createElement("canvas");
    let context = canvas.getContext("2d");
    context.font = font;
    let metrics = context.measureText(text);
    return Math.ceil(metrics.width);
}

function ZoomIn() {
    let answersCategories = document.getElementById("answersCategories")
    let answersGrid = document.getElementById("answersGrid")
    answersContainer.style.fontSize = "0.85em"
    answersContainer.style.marginTop = "2em"
    answersCategories.style.width = "175%"
    answersGrid.style.width = "175%"
    answersGrid.style.marginBottom = "2em"
    adjustTextSize()
    zoomButton.style.backgroundImage = "url(./static/images/zoomOut_w.png)"
    zoomedIn = true
}

function ZoomOut() {
    let answersCategories = document.getElementById("answersCategories")
    let answersGrid = document.getElementById("answersGrid")
    answersContainer.style.removeProperty("font-size")
    answersContainer.style.removeProperty("margin-top")
    answersCategories.style.removeProperty("width")
    answersGrid.style.removeProperty("width")
    answersGrid.style.removeProperty("margin-bottom")
    adjustTextSize()
    zoomButton.style.backgroundImage = "url(./static/images/zoomIn_w.png)"
    zoomedIn = false;
}

function ShowZoomButton() {
    if(!isZoomDisplayed && hasAlreadyAnswered && window.innerWidth <= 480) {
        zoomContainer.style.display = "flex"
        isZoomDisplayed = true;
    }
}

function HideZoomButton() {
    if(isZoomDisplayed) {
        zoomContainer.style.display = "none"
        isZoomDisplayed = false;
    }
}


