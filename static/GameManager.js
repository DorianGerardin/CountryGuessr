const countryInput = document.getElementById('countryInput');
const countryForm = document.getElementById('countryForm');
const countrySubmit = document.getElementById('countrySubmit');
const suggestions = document.getElementById('suggestions');
const answersContainer = document.getElementById('answersContainer');
const answersGrid = document.getElementById('answersGrid');
const zoomContainer = document.getElementById('zoomContainer')
const zoomButton = document.getElementById('zoomButton')

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
        console.log("resize")
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
    SubmitCountry()
}

function SubmitCountry() {
  if(!currentCountry) {
    console.log("pays introuvable")
      return
  }
  fetch(`/guess?code=${currentCountry}`)
      .then(response => response.json())
      .then(data => {
          if(!hasAlreadyAnswered) {
              answersContainer.style.display = "flex"
          }
          countryInput.value = ""
          currentCountry = null
          hasAlreadyAnswered = true
          let countryData = JSON.parse(data)
          CreateAnswerRow(countryData)
          ShowZoomButton();
      })
      .catch(error => {
        console.error('Une erreur s\'est produite :', error);
      });
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
    flagBG.style.backgroundImage = `url(${countryData.flag})`
    nameContentNode.innerText = countryData.name
    nameContentNode.appendChild(flagBG)
    nameNode.appendChild(nameContentNode)
    answerRow.appendChild(nameNode)

    // CONTINENT
    let continentRatio = countryData.continent.equals ? 1 : 0
    CreateAnswerSquare(1, answerRow, countryData.continent.value, continentRatio)

    // LANGUAGE
    let languageRatio = countryData.language.equals ? 1 : 0
    CreateAnswerSquare(2, answerRow, countryData.language.value, languageRatio)

    // POPULATION
    CreateArrowSquare(3, answerRow, countryData.populationCount.value, countryData.populationCount.ratio, countryData.populationCount.equals)

    // CURRENCY
    let currencyRatio = countryData.currency.equals ? 1 : 0
    CreateAnswerSquare(4, answerRow, countryData.currency.value, currencyRatio)

    // BORDERS
    CreateArrowSquare(5, answerRow, countryData.borderCount.value, countryData.borderCount.ratio, countryData.borderCount.equals)

    // AREA
    CreateArrowSquare(6, answerRow, countryData.area.value, countryData.area.ratio, countryData.area.equals)

    // DISTANCE
    CreateArrowSquare(7, answerRow, countryData.distance.value, countryData.distance.ratio, false, true)

    answersGrid.prepend(answerRow)
    adjustTextSize(answerRow);
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
    /*let containers = answerRow !== undefined ? answerRow.querySelectorAll('.answerSquare') : document.getElementsByClassName("answerSquare");
    for (const answerSquare of containers) {
        if(!answerSquare.classList.contains("answer0") && !answerSquare.classList.contains("answer1") && !answerSquare.classList.contains("answer2")
            && !answerSquare.classList.contains("answer3") && !answerSquare.classList.contains("answer4") && !answerSquare.classList.contains("answer6")) {
            continue
        }
        console.log("adjust")
        answerSquare.style.removeProperty('fontSize');
        let defaultFontSize = parseFloat(getComputedStyle(document.getElementById("answersContainer")).fontSize);
        let containerWidth = answerSquare.clientWidth
        let answerContent = answerSquare.querySelector('.answerContent');
        let textWidth = measureTextWidth(answerContent.textContent, getComputedStyle(answerContent).font);

        let currentFontSize = parseFloat(getComputedStyle(answerContent).fontSize)
        let newFontSize = containerWidth * 3 / textWidth * currentFontSize
        answerContent.style.fontSize = Math.min(newFontSize, defaultFontSize) + "px";
    }*/
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
    answersContainer.style.fontSize = "0.8em"
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


