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
        countryInput.style.visibility = "visible"
      }
    });
}

