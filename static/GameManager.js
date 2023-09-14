const countryInput = document.getElementById('countryInput');
const suggestions = document.getElementById('suggestions');

let countries = [];
SetAllCountries();

countryInput.addEventListener('input', UpdateSuggestions)
countryInput.addEventListener('click', UpdateSuggestions)
let countrySuggestionList = new CountrySuggestionList(countries, suggestions, countryInput)
document.body.addEventListener("click", (e) => {
  if(e.target === countryInput) {
    return
  }
  countrySuggestionList.Hide()
})

function GetCountriesBySuggestion(suggestion) {
  let regExpSuggestion = new RegExp(`.*${suggestion}.*`, 'giu')
  return countries.filter(country => country.name.match(regExpSuggestion) || country.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(regExpSuggestion));
}

function UpdateSuggestions() {
  const searchText = countryInput.value.trim();
  console.log("s", searchText)
  console.log(GetCountriesBySuggestion(searchText))
  countrySuggestionList.Show(GetCountriesBySuggestion(searchText), searchText)
}

async function WaitForAllCountriesData() {
  const apiURL = `https://restcountries.com/v3.1/all?fields=translations,cca3,continents,languages,population,currencies,borders,area`
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
        let countryData = data[i]
        let code = countryData.cca3;
        let name = countryData.translations.fra.common;
        let continent = countryData.continents[0];
        let language = Object.values(countryData.languages)[0]
        let populationCount= countryData.population.toLocaleString()
        let currency = countryData.currencies ? "No Currency" : Object.values(countryData.currencies)[0].name
        let bordersCount = countryData.borders.length
        let area= countryData.area.toLocaleString()

        let country = new Country(code, name, continent, language, populationCount, currency, bordersCount, area)
        countries.push(country)
      }
    }
  countries.sort((c1, c2) => c1.name.localeCompare(c2.name))
  });
}

