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

function UpdateSuggestions(event) {
  if(event.type === "input" && currentCountry !== null) {
    currentCountry = null
  }
  const searchText = countryInput.value.trim();
  fetch(`/type?input=${searchText}`)
    .then(response => response.json())
    .then(suggestion => {
      countrySuggestionList.Show(JSON.parse(suggestion))
    })
    .catch(error => {
      console.error('Une erreur s\'est produite :', error);
    });
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
    let continentAnswerClass = countryData.continent.equals ? goodAnswerClass : badAnswerClass
    continentNode.innerText = countryData.continent.value
    continentNode.classList.add(continentAnswerClass)
    answerRow.appendChild(continentNode)

    let languageNode = document.createElement("div");
    languageNode.classList.add("answer")
    let languageAnswerClass = countryData.language.equals ? goodAnswerClass : badAnswerClass
    languageNode.innerText = countryData.language.value
    languageNode.classList.add(languageAnswerClass)
    answerRow.appendChild(languageNode)

    let populationNode = document.createElement("div");
    populationNode.classList.add("answer")
    let populationAnswerClass = countryData.populationCount.equals === "=" ? goodAnswerClass : badAnswerClass
    populationNode.innerText = numberWithSpaces(countryData.populationCount.value)
    populationNode.classList.add(populationAnswerClass)
    AddArrowIndicator(countryData.populationCount.equals, populationNode)
    answerRow.appendChild(populationNode)

    let currencyNode = document.createElement("div");
    currencyNode.classList.add("answer")
    let currencyAnswerClass = countryData.currency.equals ? goodAnswerClass : badAnswerClass
    currencyNode.innerText = countryData.currency.value
    currencyNode.classList.add(currencyAnswerClass)
    answerRow.appendChild(currencyNode)

    let borderNode = document.createElement("div");
    borderNode.classList.add("answer")
    let borderAnswerClass = countryData.borderCount.equals === "=" ? goodAnswerClass : badAnswerClass
    borderNode.innerText = numberWithSpaces(countryData.borderCount.value)
    borderNode.classList.add(borderAnswerClass)
    AddArrowIndicator(countryData.borderCount.equals, borderNode)
    answerRow.appendChild(borderNode)

    let areaNode = document.createElement("div");
    areaNode.classList.add("answer")
    let areaAnswerClass = countryData.area.equals === "=" ? goodAnswerClass : badAnswerClass
    areaNode.innerText = numberWithSpaces(countryData.area.value)
    areaNode.classList.add(areaAnswerClass)
    AddArrowIndicator(countryData.area.equals, areaNode)
    answerRow.appendChild(areaNode)

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
        return
    }
    node.appendChild(value === "+" ? upArrow : downArrow)
}


