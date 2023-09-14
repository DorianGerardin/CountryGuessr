/* _____ ______ _______      ________ _____  
  / ____|  ____|  __ \ \    / /  ____|  __ \ 
 | (___ | |__  | |__) \ \  / /| |__  | |__) |
  \___ \|  __| |  _  / \ \/ / |  __| |  _  / 
  ____) | |____| | \ \  \  /  | |____| | \ \ 
 |_____/|______|_|  \_\  \/   |______|_|  \_\  */

const https = require("https");
const fs = require("fs");

const express = require('express'); //Import the express dependency
const app = express();              //Instantiate an express app, the main work horse of this server
const port = process.env.PORT || 8080;                  //Save the port number where your server will be listening
const Country = require('./static/Country.js')
//Idiomatic expression in express to route and respond to a client request

let countries = [];
SetAllCountries();

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
                let currency = Object.keys(countryData.currencies).length !== 0 ? Object.values(countryData.currencies)[0].name : "No Currency"
                let bordersCount = countryData.borders.length
                let area= countryData.area.toLocaleString()

                let country = new Country(code, name, continent, language, populationCount, currency, bordersCount, area)
                countries.push(country)
            }
        }
        countries.sort((c1, c2) => c1.name.localeCompare(c2.name))
        //console.log(countries)
    });
}

function GetCountriesBySuggestion(suggestion) {
    let regExpSuggestion = new RegExp(`.*${suggestion}.*`, 'giu')
    return countries.filter(country => country.name.match(regExpSuggestion) || country.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(regExpSuggestion));
}

app.get('/', (req, res) => {        //get requests to the root ("/") will route here
    res.sendFile('index.html', {root: __dirname});      //server responds by sending the index.html file to the client's browser
                                                        //the .sendFile method needs the absolute path to the file, see: https://expressjs.com/en/4x/api.html#res.sendFile 
});

app.get('/guess', function (req, res) {
  res.header("Content-Type",'application/json');
})

app.get('/type', function (req, res) {

    res.header("Content-Type",'application/json');
    let input = req.query.input
    let suggestedCountries= GetCountriesBySuggestion(input).map(c => ({name:c.name}))
    res.json(JSON.stringify(suggestedCountries))
})

app.get('/AllCountriesName', function (req, res) {

    res.header("Content-Type",'application/json');
    let countriesName= countries.map(c => ({name:c.name}))
    res.json(JSON.stringify(countriesName))
})

app.use("/static", express.static('./static/'));

app.listen(port, () => {            //server starts listening for any attempts from a client to connect at port: {port}
    console.log(`Now listening on port ${port}`);
});
