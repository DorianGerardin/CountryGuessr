const countryInput = document.getElementById('countryInput');
const countryForm = document.getElementById('countryForm');
const countrySubmit = document.getElementById('countrySubmit');
const suggestions = document.getElementById('suggestions');
const answers = document.getElementById('answers');

let currentCountry = null
let countrySuggestionList
let countriesName = [];
GetAllCountriesName()

countrySubmit.addEventListener('click', SubmitCountry)
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

function SubmitCountry() {
  fetch(`/guess?code=${currentCountry}`)
      .then(response => response.json())
      .then(countryData => {
        let countryAnswer= document.createElement("div");
        let country = JSON.parse(countryData)
        for (let data in country) {
          countryAnswer.innerText += `${data} : ${country[data]}     `
        }
        answers.appendChild(countryAnswer)
      })
      .catch(error => {
        console.error('Une erreur s\'est produite :', error);
      });
}
