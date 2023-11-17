const countryInput = document.getElementById('countryInput');
const countryForm = document.getElementById('countryForm');
const countrySubmit = document.getElementById('countrySubmit');
const suggestions = document.getElementById('suggestions');
const answersContainer = document.getElementById('answersContainer');
const answersGrid = document.getElementById('answersGrid');
const zoomContainer = document.getElementById('zoomContainer')
const zoomButton = document.getElementById('zoomButton')
const rulesButton = document.getElementById('rulesButton')

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

let SetSubmittedCountriesToLocalStorage, GetSubmittedCountries, SetSubmittedCountry
(function () {
    let submittedCountries = [];
    SetSubmittedCountriesToLocalStorage = function() {
        localStorage.setItem('submittedCountries', JSON.stringify(GetSubmittedCountries()));
    };
    GetSubmittedCountries = function() {
        return submittedCountries
    };
    SetSubmittedCountry = function(countryCode) {
        submittedCountries.push(countryCode);
    };
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

let isLoadingCountry = false
let isLoadingCountries = false
let zoomedIn = false
let isZoomDisplayed = false
let hasAlreadyAnswered = false
let currentCountry = null
let countrySuggestionList
let countriesName = [];
GetAllCountriesName()

let countdownInterval
function UpdateCountdownUntilNextCountry() {
    let now = new Date();
    let expirationDate = new Date(JSON.parse(localStorage.getItem('expirationDate')));
    let difference = expirationDate.getTime() - now.getTime();

    let hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((difference % (1000 * 60)) / 1000);
    let countdownNode = document.getElementById("nextCountryCountdown")
    const formatTimer = function(hours, minutes, seconds) {
        const formattedHours = hours < 10 ? `0${hours}` : hours;
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
        const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;

        return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    };

    countdownNode.innerText = `(Il te reste ${formatTimer(hours, minutes, seconds)})`

    if(hours <= 0 && minutes <= 0 && seconds <= 0) {
        clearInterval(countdownInterval)
        countdownNode.innerText = `(Il te reste ${formatTimer(0, 0, 0)})`
        RefreshGame()
    }
}
UpdateCountdownUntilNextCountry()
countdownInterval = setInterval(UpdateCountdownUntilNextCountry, 1000);

function GetCountryPromises(submittedCountries) {
    ToggleLoading(true)
    isLoadingCountries = true
    return submittedCountries.map(countryCode => SubmitCountry(countryCode));
}

function GetDayCount() {
    let launchDate = new Date('2023-10-03');
    let msDifference = new Date() - launchDate;
    return Math.floor(msDifference / (1000 * 60 * 60 * 24))
}

function CheckForHistory() {
    let submittedCountries = JSON.parse(localStorage.getItem('submittedCountries'));

    if(submittedCountries !== null) {
        Promise.all(GetCountryPromises(submittedCountries))
            .then(results => {
                for (const countryData of results) {
                    ResolveCountry(countryData)
                }
                isLoadingCountries = false
                ToggleLoading(false)
            })
            .catch(error => {
                console.error(error);
            });
    }
}

countrySubmit.addEventListener('click', () => {
    if(isLoadingCountry || isLoadingCountries) {
        return
    }
    SubmitCountry(currentCountry).then((countryData) => {
        ResolveCountry(countryData)
    })
})
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
rulesButton.addEventListener('click', () => GoToPage("rules"))

function GetCountriesBySuggestion(suggestion) {
    const forbiddenCharacters = "\\{}[]/+*_.|?^&<>!=$"
    for (let i = 0; i < forbiddenCharacters.length; i++) {
        if(suggestion.includes(forbiddenCharacters[i])) {
            return []
        }
    }
    let regExpSuggestion = new RegExp(`.*${suggestion}.*`, 'giu')
    return countriesName.filter(country =>  {
        let normalizedCountryName = country.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        return country.name.match(regExpSuggestion) ||
            country.name.replace(/-/g, ' ').match(regExpSuggestion) ||
            normalizedCountryName.match(regExpSuggestion) ||
            normalizedCountryName.replace(/-/g, ' ').match(regExpSuggestion)
    });
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
    SubmitCountry(currentCountry).then((countryData) => {
        ResolveCountry(countryData)
    })
}

function ResolveCountry(countryData) {
    if(countryData === null) {
        return
    }
    incrementAttempt()
    if (!hasAlreadyAnswered) {
        answersContainer.style.display = "flex"
    }
    currentCountry = null
    hasAlreadyAnswered = true

    let country = JSON.parse(countryData)
    Clue.UpdateCluesAttempts()
    SetSubmittedCountry(country.code)
    SetSubmittedCountriesToLocalStorage()
    ShowZoomButton();
    CreateAnswerRow(country)
    if(country.isAnswer) {
        game.endGame()
        countryForm.remove()
    }
}


function RefreshGame() {
    alert("Un nouveau pays a été sélectionné. La page va se recharger")
    ClearLocalStorage()
    window.location.reload();
}

function ToggleLoading(setOn) {
    if(isLoadingCountries) {
        return
    }
    if(setOn) {
        isLoadingCountry = true
        countrySubmit.innerHTML = ""
        countrySubmit.classList.add("loading")
    } else {
        isLoadingCountry = false;
        countrySubmit.classList.remove("loading")
        countrySubmit.innerHTML = "Deviner"
    }
}

async function SubmitCountry(countryCode) {
    let expirationDate = new Date(JSON.parse(localStorage.getItem('expirationDate')));
    if(expirationDate !== null) {
        if(expirationDate < new Date()) {
            RefreshGame()
        }
    }

    if(game.HasWon()) {
        return Promise.resolve(null)
    }
    if(!countryCode) {
        DisplayToast('Pays introuvable !', './static/images/alert.svg')
        return Promise.resolve(null);
    }

    countryInput.value = ""
    ToggleLoading(true)

    return new Promise((resolve, reject) => {
        fetch(`/guess?code=${countryCode}`)
            .then(response => response.json())
            .then(data => {
                ToggleLoading(false)
                resolve(data)
            })
            .catch(error => {
                reject('Une erreur s\'est produite :', error);
            });
    })
}

function WinGame(countryData) {
    if(!countryData.isAnswer) {
        console.log("Nope")
        return
    }
    Clue.UnlockAllClues()
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
    let attemptCount = getAttemptCount()
    let attemptsElements = document.getElementsByClassName("ggAttemptsCounts")
    for (let i = 0; i < attemptsElements.length; i++) {
        attemptsElements[i].innerText = attemptCount
    }

    document.getElementById("dayCount").innerText = GetDayCount().toString()

    let clueUsedCountNode = document.getElementById("clueUsedCount")
    clueUsedCountNode.innerText = Clue.UsedClueCount().toString()
    document.getElementById("indices").innerText = Clue.UsedClueCount() > 1 ? "indices" : "indice"

    document.getElementById("essai").innerText = attemptCount > 1 ? "essais" : "essai"
    let shareContent = getShareContent()
    let shareContentElement = document.getElementById('shareContent')
    if(attemptCount > 5) {
        shareContentElement.innerHTML += get5FirstShare() + `+ ${attemptCount - 5} de plus`
    } else {
        shareContentElement.innerHTML += shareContent;
    }
    let copyButton = document.getElementById("copyButton")
    copyButton.addEventListener("click", () => {
        let copyText = shareContentElement.textContent + "\nhttps://countryguessr.mrdo.fr"
        navigator.clipboard.writeText(copyText).then(function() {
            DisplayToast("Copié !",'./static/images/clipboard.png')
        }).catch(function(err) {
            DisplayToast("Erreur",'./static/images/alert.svg')
        });
    })

    let shareButton = document.getElementById("shareButton")
    shareButton.addEventListener("click", () => {
        const shareData = {
            title: "Country Guessr",
            text: shareContentElement.textContent + "\nhttps://countryguessr.mrdo.fr",
        };
        navigator.share(shareData).then(r => {
            DisplayToast("Partagé !",null)
        }).catch(function(err) {
            DisplayToast("Erreur",'./static/images/alert.svg')
        });

    })

    let ggFlagImg = document.getElementById("ggFlagImg")
    ggFlagImg.alt = countryData.flagAlt
    let ggCountryName = document.getElementById("ggCountryName")
    ggFlagImg.src = `./static/images/flags/${countryData.code}.svg`
    ggCountryName.innerText = countryData.name

    let ggContainer = document.getElementById("ggContainer")
    ggContainer.style.display = "flex";
    ggContainer.scrollIntoView({ behavior: "smooth"});
    ggContainer.animate(scaleUpAndDown, scaleUpAndDownTiming)

    let nameNodes = document.getElementsByClassName("answer0")
    for (let i = 0; i < nameNodes.length; i++) {
        nameNodes[i].style.cursor = "pointer"
    }

    let ggFlag = document.getElementById("ggFlag")
    ggFlag.addEventListener("click", () => {
        window.open(countryData.maps, "_blank")
    })

    let wikiLink = document.getElementById("wikipediaLink")
    wikiLink.addEventListener("click", () => {
        window.open(countryData.wikiLink, "_blank")
    })
}

function DisplayToast(text, avatar) {
    let toast
    if(avatar) {
        toast = Toastify({
            text: text,
            duration: 1500,
            gravity: "top", // `top` or `bottom`
            position: "center", // `left`, `center` or `right`
            avatar: avatar,
            className: "toast",
            stopOnFocus: false, // Prevents dismissing of toast on hover
            onClick: function(){
                toast.hideToast()
            }
        })
    } else {
        toast = Toastify({
            text: text,
            duration: 1500,
            gravity: "top", // `top` or `bottom`
            position: "center", // `left`, `center` or `right`
            className: "toast",
            stopOnFocus: false, // Prevents dismissing of toast on hover
            onClick: function(){
                toast.hideToast()
            }
        })
    }
    toast.showToast();
}

function CreateAnswerSquare(answerNumber, rowNode, textValue, ratio) {
    let squareNode = document.createElement("div");
    let squareContentNode = document.createElement("div");
    squareNode.classList.add("answerSquare")
    squareNode.classList.add(`answer${answerNumber}`)
    squareNode.style.opacity = '0'
    squareContentNode.classList.add("answerContent")
    squareContentNode.innerText = textValue
    let colorThresholds = [0.55, 0.75, 1]
    PickColor(squareNode, ratio, colorThresholds)
    squareNode.appendChild(squareContentNode)
    rowNode.appendChild(squareNode)
    return squareNode
}

function CreateArrowSquare(answerNumber, rowNode, textValue, ratio, equals, isDistance = false, isBorder = false) {
    let squareNode = document.createElement("div");
    let squareContentNode = document.createElement("div");
    squareNode.classList.add("answerSquare")
    squareNode.classList.add(`answer${answerNumber}`)
    squareNode.style.opacity = '0'
    squareContentNode.classList.add("answerContent")
    squareContentNode.innerText = numberWithSpaces(textValue)
    let distanceColorThresholds = [0.575, 0.75, 0.85]
    let borderColorThresholds = [0.25, 0.5, 0.75]
    let basicColorThresholds = [0.55, 0.75, 1]
    if(isDistance) {
        PickColor(squareNode, ratio, distanceColorThresholds)
    } else if(isBorder) {
        AddArrowIndicator(equals, squareContentNode)
        PickColor(squareNode, ratio, borderColorThresholds)
    } else {
        AddArrowIndicator(equals, squareContentNode)
        PickColor(squareNode, ratio, basicColorThresholds)
    }
    squareNode.appendChild(squareContentNode)
    rowNode.appendChild(squareNode)
    return squareNode
}

function AnimateAnswerRow(answerRow, country, index) {
    const fadeIn = [
        { opacity: "0", scale: "0.6"},
        { opacity: "1", scale: "1" },
    ];
    const fadeInTiming = {
        duration: 600,
        iterations: 1,
        easing:"ease-in-out",
        fill: 'forwards'
    };

    let squareNodes = answerRow.childNodes
    if (index < squareNodes.length) {
        setTimeout(function() {
            squareNodes[index].animate(fadeIn, fadeInTiming)
            AnimateAnswerRow(answerRow, country,index + 1);
        }, 330);
    } else {
        setTimeout(function() {
            if (country.isAnswer) {
                WinGame(country)
            }
        }, 700);
    }
}

function CreateAnswerRow(countryData) {
    let answerRow= document.createElement("div");
    answerRow.classList.add("answerRow")

    let newLineEmojis = ""

    // NAME
    let nameNode = document.createElement("div");
    let nameContentNode = document.createElement("div");
    nameNode.classList.add("answerSquare")
    nameNode.classList.add("answer0")
    nameNode.addEventListener("click", () => {
        if(!game.HasWon()) {
            return
        }
        window.open(countryData.maps, "_blank");
    })
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
    let bordersSquareNode = CreateArrowSquare(5, answerRow, countryData.borderCount.value, countryData.borderCount.ratio, countryData.borderCount.isEqual, false, true)
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
    AnimateAnswerRow(answerRow, countryData,1)
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
        return
    }
    node.appendChild(value === "+" ? upArrow : downArrow)
}

function PickColor(node, ratio, thresholds) {
    let answerColorClass = ratio < thresholds[0] ? "badAnswer" : ratio < thresholds[1] ? "answerPercent25_50" : ratio < thresholds[2] ? "answerPercent50_75" : "goodAnswer"
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