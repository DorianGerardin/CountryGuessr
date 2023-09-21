/* _____ ______ _______      ________ _____  
  / ____|  ____|  __ \ \    / /  ____|  __ \ 
 | (___ | |__  | |__) \ \  / /| |__  | |__) |
  \___ \|  __| |  _  / \ \/ / |  __| |  _  / 
  ____) | |____| | \ \  \  /  | |____| | \ \ 
 |_____/|______|_|  \_\  \/   |______|_|  \_\  */

import Fs from 'fs'
import Https from 'https'
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
    const apiURL = `https://restcountries.com/v3.1/all?fields=translations,cca3,cca2,continents,languages,population,currencies,borders,area,flags,latlng,maps`
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
            for (let i = 0; i < countryCount; i++) {
                let countryData = data[i]
                let code = countryData.cca3;
                let name = countryData.translations.fra.common;
                let continent = countryData.continents[0];
                let language = Object.keys(countryData.languages).length !== 0 ? Object.values(countryData.languages)[0] : "No language"
                let populationCount = countryData.population
                let currency = Object.keys(countryData.currencies).length !== 0 ? Object.values(countryData.currencies)[0].name : "No Currency"
                let bordersCount = countryData.borders.length
                let area = countryData.area
                let latlng = countryData.latlng
                let maps = countryData.maps.googleMaps

                let country = new Country(code, name, continent, language, populationCount, currency, bordersCount, area, latlng, maps)
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

function ComputeRatio(tryValue, valueToGuess) {
    if(valueToGuess !== 0) {
        if(tryValue >= valueToGuess * 2 || tryValue <= 0) {
            return 0
        }
    } else {
        if(tryValue >= 4 || tryValue <= 0) {
            return 0
        }
        return (Math.abs(tryValue - 4) / 4)
    }
    return 1 - (Math.abs(tryValue - valueToGuess) / valueToGuess)
}

function getDistance(lat1, lon1, lat2, lon2) {
    // Rayon de la Terre en mètres
    const earthRadius = 6371000;

    // Conversion des latitudes et longitudes en radians
    const radLat1 = (Math.PI * lat1) / 180;
    const radLon1 = (Math.PI * lon1) / 180;
    const radLat2 = (Math.PI * lat2) / 180;
    const radLon2 = (Math.PI * lon2) / 180;

    // Différences de latitudes et de longitudes en radians
    const dLat = radLat2 - radLat1;
    const dLon = radLon2 - radLon1;

    // Formule Haversine
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(radLat1) * Math.cos(radLat2) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Distance en km
    return Math.round((earthRadius * c) / 1000);
}

function getProximityPercent(distance) {
    let halfEarthCircumference = 20037
    return (1 - (distance / halfEarthCircumference)).toFixed(2)
}

function CreateCountryData(country) {
    let populationCompare = country.populationCount > countryToGuess.populationCount ? "-" : country.populationCount < countryToGuess.populationCount ? "+" : "="
    let borderCompare = country.borderCount > countryToGuess.borderCount ? "-" : country.borderCount < countryToGuess.borderCount ? "+" : "="
    let areaCompare = country.area > countryToGuess.area ? "-" : country.area < countryToGuess.area ? "+" : "="
    let distance = getDistance(country.latlng[0], country.latlng[1], countryToGuess.latlng[0], countryToGuess.latlng[1])

    return {
        name: country.name,
        code: country.code,
        maps : country.maps,
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
            ratio: ComputeRatio(country.populationCount, countryToGuess.populationCount),
            equals: populationCompare
        },
        currency: {
            value: country.currency,
            equals: country.currency === countryToGuess.currency
        },
        borderCount: {
            value: country.borderCount,
            ratio: ComputeRatio(country.borderCount, countryToGuess.borderCount),
            equals: borderCompare
        },
        area: {
            value: country.area,
            ratio: ComputeRatio(country.area, countryToGuess.area),
            equals: areaCompare
        },
        distance: {
            value: distance,
            ratio: getProximityPercent(distance)
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
    if(!country) {
        res.status(404).json({error: "Country not found"});
        return
    }
    let countryData = CreateCountryData(country)
    res.json(JSON.stringify(countryData))
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