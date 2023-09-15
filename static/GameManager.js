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
      .then(countryData => {
          if(!hasAlreadyAnswered) {
              answersContainer.style.display = "flex"
          }
          hasAlreadyAnswered = true
          let country = JSON.parse(countryData)
          createAnswer(country)
      })
      .catch(error => {
        console.error('Une erreur s\'est produite :', error);
      });
}

function createAnswer(country) {
    let answerRow= document.createElement("div");
    answerRow.classList.add("answerRow")

    let nameNode = document.createElement("div");
    nameNode.classList.add("answer")
    let flagBG = document.createElement("div");
    let textNode = document.createElement("div");
    nameNode.classList.add("backgroundFlag")
    nameNode.style.backgroundImage = `url(${country.flag})`
    nameNode.innerText = country.name
    nameNode.style.textShadow = "2px 2px 5px rgba(0, 0, 0, 1)"
    //textNode.style.zIndex = "1"
    //nameNode.appendChild(flagBG)
    //nameNode.appendChild(textNode)
    answerRow.appendChild(nameNode)

    let continentNode = document.createElement("div");
    continentNode.classList.add("answer")
    continentNode.innerText = country.continent
    answerRow.appendChild(continentNode)

    let languageNode = document.createElement("div");
    languageNode.classList.add("answer")
    languageNode.innerText = country.language
    answerRow.appendChild(languageNode)

    let populationNode = document.createElement("div");
    populationNode.classList.add("answer")
    populationNode.innerText = country.populationCount
    answerRow.appendChild(populationNode)

    let currencyNode = document.createElement("div");
    currencyNode.classList.add("answer")
    currencyNode.innerText = country.currency
    answerRow.appendChild(currencyNode)

    let borderNode = document.createElement("div");
    borderNode.classList.add("answer")
    borderNode.innerText = country.borderCount
    answerRow.appendChild(borderNode)

    let areaNode = document.createElement("div");
    areaNode.classList.add("answer")
    areaNode.innerText = country.area
    answerRow.appendChild(areaNode)

    answersGrid.prepend(answerRow)
}



