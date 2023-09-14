const countryInput = document.getElementById('countryInput');
const suggestions = document.getElementById('suggestions');

let countrySuggestionList
let countriesName = [];
GetAllCountriesName()

countryInput.addEventListener('input', UpdateSuggestions)
countryInput.addEventListener('click', UpdateSuggestions)
document.body.addEventListener("click", (e) => {
  if(countryInput.style.visibility === "hidden" || e.target === countryInput) {
    return
  }
  countrySuggestionList.Hide()
})

function UpdateSuggestions() {
  const searchText = countryInput.value.trim();
  fetch(`/type?input=${searchText}`)
    .then(response => response.json())
    .then(suggestion => {
      //console.log("server data", suggestion);
      countrySuggestionList.Show(JSON.parse(suggestion))
    })
    .catch(error => {
      console.error('Une erreur s\'est produite :', error);
    });
}

async function WaitForAllCountriesNames() {
  const apiURL = `/AllCountriesName`
  const response = await fetch(apiURL);
  return await response.json();
}

function GetAllCountriesName() {
  WaitForAllCountriesNames()
  .then(data => {
    if (data.status === 404) {
        console.log("aucun pays trouvé");
    } else {
      countriesName = JSON.parse(data)
      countrySuggestionList = new CountrySuggestionList(countriesName, suggestions, countryInput)
      countryInput.style.visibility = "visible"
    }
  });
}

