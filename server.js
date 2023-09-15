/* _____ ______ _______      ________ _____  
  / ____|  ____|  __ \ \    / /  ____|  __ \ 
 | (___ | |__  | |__) \ \  / /| |__  | |__) |
  \___ \|  __| |  _  / \ \/ / |  __| |  _  / 
  ____) | |____| | \ \  \  /  | |____| | \ \ 
 |_____/|______|_|  \_\  \/   |______|_|  \_\  */

import path from 'path';
import {fileURLToPath} from 'url';
import express from 'express'; //Import the express dependency
import Country from './static/Country.js' //Save the port number where your server will be listening
const app = express();              //Instantiate an express app, the main work horse of this server
const port = process.env.PORT || 8080;
//Idiomatic expression in express to route and respond to a client request

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let countries = [];
let countryToGuess = null
SetAllCountries();


function SelectCountry() {
    return countries[Math.floor(Math.random()*countries.length)];
}

async function WaitForAllCountriesData() {
    const apiURL = `https://restcountries.com/v3.1/all?fields=translations,cca3,cca2,continents,languages,population,currencies,borders,area,flags`
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
                let language = Object.keys(countryData.languages).length !== 0 ? Object.values(countryData.languages)[0] : "No language"
                let populationCount= countryData.population
                let currency = Object.keys(countryData.currencies).length !== 0 ? Object.values(countryData.currencies)[0].name : "No Currency"
                let bordersCount = countryData.borders.length
                let area= countryData.area
                let flag = Object.values(countryData.flags)[1]

                let country = new Country(code, name, continent, language, populationCount, currency, bordersCount, area, flag)
                countries.push(country)
            }
        }
        countries.sort((c1, c2) => c1.name.localeCompare(c2.name))
        countryToGuess = SelectCountry()
        console.log(countryToGuess.name)
    });
}

function GetCountryData(countryCode) {
    for (let i = 0; i < countries.length; i++) {
        if (countries[i].code === countryCode) {
            return countries[i];
        }
    }
    return null
}

function GetCountriesBySuggestion(suggestion) {
    let regExpSuggestion = new RegExp(`.*${suggestion}.*`, 'giu')
    return countries.filter(country => country.name.match(regExpSuggestion) || country.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(regExpSuggestion));
}

function CreateCountryData(country) {
    let populationCompare = country.populationCount > countryToGuess.populationCount ? "-" : country.populationCount < countryToGuess.populationCount ? "+" : "="
    let borderCompare = country.borderCount > countryToGuess.borderCount ? "-" : country.borderCount < countryToGuess.borderCount ? "+" : "="
    let areaCompare = country.area > countryToGuess.area ? "-" : country.area < countryToGuess.area ? "+" : "="

    return {
        name: country.name,
        code: country.code,
        flag : country.flag,
        continent: {
            value: country.continent,
            equals: country.continent === countryToGuess.continent
        },
        language: {
            value: country.language,
            equals: country.language === countryToGuess.language
        },
        populationCount: {
            value: country.populationCount,
            equals: populationCompare
        },
        currency: {
            value: country.currency,
            equals: country.currency === countryToGuess.currency
        },
        borderCount: {
            value: country.borderCount,
            equals: borderCompare
        },
        area: {
            value: country.area,
            equals: areaCompare
        }
    }
}

app.get('/', (req, res) => {        //get requests to the root ("/") will route here
    res.sendFile('index.html', {root: __dirname});      //server responds by sending the index.html file to the client's browser
                                                        //the .sendFile method needs the absolute path to the file, see: https://expressjs.com/en/4x/api.html#res.sendFile 
});

app.get('/guess', function (req, res) {
  res.header("Content-Type",'application/json');
    let guessCode = req.query.code
    let country = GetCountryData(guessCode)
    let countryData = CreateCountryData(country)
    res.json(JSON.stringify(countryData))
})

app.get('/type', function (req, res) {
    res.header("Content-Type",'application/json');
    let input = req.query.input
    let suggestedCountries= GetCountriesBySuggestion(input).map(c => ({name:c.name, code: c.code, flag:c.flag}))
    res.json(JSON.stringify(suggestedCountries))
})

app.get('/AllCountriesName', function (req, res) {
    res.header("Content-Type",'application/json');
    let countriesName= countries.map(c => ({name:c.name, code: c.code, flag:c.flag}))
    res.json(JSON.stringify(countriesName))
})

app.use("/static", express.static('./static/'));

app.listen(port, () => {            //server starts listening for any attempts from a client to connect at port: {port}
    console.log(`Now listening on port ${port}`);
});
