const countryInput = document.getElementById('countryInput');
const countryForm = document.getElementById('countryForm');
const countrySubmit = document.getElementById('countrySubmit');
const suggestions = document.getElementById('suggestions');
const answersContainer = document.getElementById('answersContainer');
const answersGrid = document.getElementById('answersGrid');

let hasAlreadyAnswered = false
let currentCountry = null
let countrySuggestionList
let countriesName = [];
GetAllCountriesName()

countrySubmit.addEventListener('click', SubmitCountry)
countryInput.addEventListener('keydown', (e) => TrySubmitCountry(e))
countryInput.addEventListener('input', (e) => UpdateSuggestions(e))
countryInput.addEventListener('click', (e) => UpdateSuggestions(e))
document.body.addEventListener("click", (e) => {
  if(countryInput.style.visibility === "hidden" || e.target === countryInput) {
    return
  }
  countrySuggestionList.Hide()
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
          createAnswer(countryData)
      })
      .catch(error => {
        console.error('Une erreur s\'est produite :', error);
      });
}

function createAnswer(countryData) {
    let goodAnswerClass = "goodAnswer"
    let badAnswerClass = "badAnswer"

    let answerRow= document.createElement("div");
    answerRow.classList.add("answerRow")

    let nameNode = document.createElement("div");
    nameNode.classList.add("answer")
    let flagBG = document.createElement("div");
    flagBG.classList.add("backgroundFlag")
    flagBG.style.backgroundImage = `url(${countryData.flag})`
    nameNode.innerText = countryData.name
    nameNode.appendChild(flagBG)
    answerRow.appendChild(nameNode)

    let continentNode = document.createElement("div");
    continentNode.classList.add("answer")
    continentNode.innerText = countryData.continent.value
    PickColor(continentNode, countryData.continent.equals ? 1 : 0)
    answerRow.appendChild(continentNode)

    let languageNode = document.createElement("div");
    languageNode.classList.add("answer")
    languageNode.innerText = countryData.language.value
    PickColor(languageNode, countryData.language.equals ? 1 : 0)
    answerRow.appendChild(languageNode)

    let populationNode = document.createElement("div");
    populationNode.classList.add("answer")
    populationNode.innerText = numberWithSpaces(countryData.populationCount.value)
    AddArrowIndicator(countryData.populationCount.equals, populationNode)
    PickColor(populationNode, countryData.populationCount.ratio)
    answerRow.appendChild(populationNode)

    let currencyNode = document.createElement("div");
    currencyNode.classList.add("answer")
    currencyNode.innerText = countryData.currency.value
    PickColor(currencyNode, countryData.currency.equals ? 1 : 0)
    answerRow.appendChild(currencyNode)

    let borderNode = document.createElement("div");
    borderNode.classList.add("answer")
    borderNode.innerText = numberWithSpaces(countryData.borderCount.value)
    AddArrowIndicator(countryData.borderCount.equals, borderNode)
    PickColor(borderNode, countryData.borderCount.ratio)
    answerRow.appendChild(borderNode)

    let areaNode = document.createElement("div");
    areaNode.classList.add("answer")
    areaNode.innerText = numberWithSpaces(countryData.area.value)
    AddArrowIndicator(countryData.area.equals, areaNode)
    PickColor(areaNode, countryData.area.ratio)
    answerRow.appendChild(areaNode)

    let distanceNode = document.createElement("div");
    distanceNode.classList.add("answer")
    distanceNode.innerText = `${numberWithSpaces(countryData.distance.value)} km`
    PickColor(distanceNode, countryData.distance.ratio)
    answerRow.appendChild(distanceNode)

    answersGrid.prepend(answerRow)
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


