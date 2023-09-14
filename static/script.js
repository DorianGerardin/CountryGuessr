const countryInput = document.getElementById('countryInput');
const suggestions = document.getElementById('suggestions');

let countries = new Array();
let currentFocusIndex = -1;

function compareCountryNames(country1, country2) {
  return country1.localeCompare(country2);
}

function GetCountriesBySuggestion(suggestion) {
  let regExpSuggestion = new RegExp(`.*${suggestion}.*`, 'giu')
  return countries.filter(country => country.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(regExpSuggestion));
}

function ToggleCountryFocus(countryNode, setOn) {
  setOn ? countryNode.classList.add("suggestionFocus") : countryNode.classList.remove("suggestionFocus")
}

function SelectCountry(countryName) {
  suggestions.style.visibility = "hidden"
  countryInput.value = countryName
  suggestions.innerHTML = "";
}

function UpdateSuggestions() {
  const searchText = countryInput.value.trim();
  if (searchText) {
    suggestions.innerHTML = ""
    currentFocusIndex = -1
    let suggestedCountries = GetCountriesBySuggestion(searchText)
    suggestedCountries.length > 0 ? suggestions.style.visibility = "visible" : suggestions.style.visibility = "hidden"
    for(let i = 0; i < suggestedCountries.length; i++) {
      let countryNode = document.createElement("div");
      countryNode.innerHTML = suggestedCountries[i].name
      countryNode.classList.add("suggestion")
      countryNode.addEventListener("click", () => {
        SelectCountry(suggestedCountries[i].name)
      })
      countryNode.addEventListener("mouseover", () => {
        UnfocusCurrentCountry()
        currentFocusIndex = i
        ToggleCountryFocus(countryNode, true)
      })
      /*AddMultipleEventListener(countryNode, ['mouseover', 'mousemove'], () => {
        UnfocusCurrentCountry()
        currentFocusIndex = i
        ToggleCountryFocus(countryNode, true)
      })*/
      countryNode.addEventListener("mouseout", () => {
        ToggleCountryFocus(countryNode, false)
      })
      suggestions.appendChild(countryNode)
    }
  } else {
      suggestions.style.visibility = "hidden";
      suggestions.innerHTML = '';
  }
}

function FocusCountryMouse() {

}

function isNewCountryFocusOut(index, countryCount) {
  return index >= suggestions.childNodes.length || index < 0
}

function UnfocusCurrentCountry() {
  if(currentFocusIndex >= 0 && currentFocusIndex < countries.length) {
    let currentFocus = suggestions.childNodes[currentFocusIndex]
    ToggleCountryFocus(currentFocus, false)
  }
}

function SetNewCountryFocus(newIndex) {

  UnfocusCurrentCountry();
  
  if(isNewCountryFocusOut(newIndex)) {
    currentFocusIndex = -1
    countryInput.focus()
    return
  }
  else {
    console.log(newIndex)
    let newCountryNode = suggestions.childNodes[newIndex]
    ToggleCountryFocus(newCountryNode, true)
    countryInput.value = newCountryNode.innerText
    countryInput.setSelectionRange(newCountryNode.innerText.length, newCountryNode.innerText.length)
    suggestions.childNodes[newIndex].scrollIntoViewIfNeeded(false)
  }

  currentFocusIndex = newIndex
}

function UpdateFocusedCountry(event) {
  if(event.keyCode === 40){//down 
   SetNewCountryFocus(currentFocusIndex + 1)
  }
  if(event.keyCode === 38){//up 
    SetNewCountryFocus(currentFocusIndex - 1)
  }
}

countryInput.addEventListener('input', UpdateSuggestions)
countryInput.addEventListener("keydown", UpdateFocusedCountry)
countryInput.addEventListener("click", () => currentFocusIndex = -1)

async function WaitForAllCountriesData() {
  const apiURL = `https://restcountries.com/v3.1/all?fields=translations,cca3`
  const response = await fetch(apiURL);
  return await response.json();
}

function SetAllCountries() {
  WaitForAllCountriesData()
  .then(data => {
    if (data.status === 404) {
        console.log("aucun pays trouvé");
    } else {
      const countryCount = data.length;
      for(let i = 0; i < countryCount; i++) {
        var country = {
          code: data[i].cca3,
          name: data[i].translations.fra.common
        }
        countries.push(country)
      }
    }
  countries.sort((c1, c2) => c1.name.localeCompare(c2.name))
  });
}

async function WaitForCountryData(countryCode) {
  const apiURL = `https://restcountries.com/v3.1/alpha/${countryCode}`
  const response = await fetch(apiURL);
  return await response.json();
}

function GetCountryData(countryCode) {
  WaitForCountryData(countryCode)
  .then(data => {
    if (data.status === 404) {
        console.log("Pays non trouvé");
    } else {
        const country = data[0];
        console.log("name : " + country.name.common)
        console.log("continent : " + country.continents[0])
        console.log("langue : ", Object.values(country.languages)[0])
        console.log("population : " + country.population.toLocaleString())
        console.log("monnaie : ", Object.values(country.currencies)[0].name)
        console.log("Nb pays voisins : " + country.borders.length)
        console.log("superficie : " + country.area.toLocaleString() + "km²")   
    }
  });
}

//GetCountryData("col")
SetAllCountries();

function AddMultipleEventListener(element, events, handler) {
  events.forEach(e => element.addEventListener(e, handler))
}