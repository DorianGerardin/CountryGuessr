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
import { CronJob } from 'cron';
const app = express();              //Instantiate an express app, the main work horse of this server
import axios from 'axios'
import dotenv from 'dotenv'
const port = process.env.PORT || 8080;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

let noUseCountries = ["UMI"]

let currencyTypes = ["dollar", "lev", "yuan", "riel", "gourde", "vatu", "colón", "won", "convertible mark", "Euro", "somoni", "leu", "franc", "CFA franc", "CFP franc",
    "dobra", "kip", "lek", "lira", "pound", "rial", "riyal", "naira", "peso", "escudo", "yen", "krone", "koruna", "króna", "krona", "ruble", "guilder", "kwacha",
    "manat", "tögrög", "tālā", "ngultrum", "rupee", "rupiah", "taka", "guaraní", "pataca", "nakfa", "afghani", "bolívar soberano", "leone", "kyat", "dinar", "shilling",
    "ariary", "lempira", "balboa", "florin", "denar", "kwanza", "new shekel", "soʻm", "lari", "rufiyaa", "som", "sol", "dirham", "dirham", "kina", "dram", "forint", "hryvnia",
    "pula", "paʻanga", "baht", "quetzal", "córdoba", "lilangeni", "rand", "dalasi", "birr", "real", "złoty", "boliviano", "cedi", "metical", "tenge", "ringgit", "đồng", "loti", "ouguiya"]
let countries = [];
let countryToGuess = null
let job = null
SetAllCountries();

async function UpdateCurrentCountry(newCountryCode) {
    try {
        const data = {
            CURRENT_COUNTRY : newCountryCode
        }
        await axios({
            method: 'patch',
            url: `https://api.heroku.com/apps/country-guessr/config-vars`,
            headers: {
                'Authorization': `Bearer ${process.env.HEROKU_API_KEY}`,
                'Accept': 'application/vnd.heroku+json; version=3',
                'Content-Type': 'application/json',
            },
            data: data
        });
    }
    catch (error) {
        console.error('Erreur lors de la mise à jour de la variable d\'environnement sur Heroku :', error);
        throw error;
    }

}

function getCurrency(currency, currencyCode) {
    let bestMatch = ""
    let currencyTypesCount = currencyTypes.length
    for (let i = 0; i < currencyTypesCount; i++) {

        if (currency.toLowerCase().includes(currencyTypes[i].toLowerCase()) && currencyTypes[i].length > bestMatch.length) {
            bestMatch = currencyTypes[i];
        }
    }
    currency = currency.replace(bestMatch, '')
    let currencyDescription = currency.split(' ').filter(c => c).join(' ')
    return [bestMatch, currencyCode]
}

function currencyToString(currency) {
    if(currency[0] === null) {
        return currency[1]
    }
    let returnString = `${currency[0].charAt(0).toUpperCase() + currency[0].slice(1)}`
    if(currency[1] === "") {
        return returnString
    } else {
        return `${returnString} (${currency[1]})`
    }
}

function hasSameCurrency(currency1, currency2) {
    return currency1[0] === currency2[0]
}

function SelectCountry(desiredCode = null) {
    if(desiredCode === null) {
        return countries[Math.floor(Math.random()*countries.length)];
    }
    else {
        return countries.find((country) => country.code === desiredCode)
    }
}

function getWikiLink(countryName) {
    let nameWithUnderscore = countryName.split(" ").join("_")
    return `https://fr.wikipedia.org/wiki/${nameWithUnderscore}`
}

function GetRandomCountryCode() {
    return countries[Math.floor(Math.random()*countries.length)].code
}

async function WaitForAllCountriesData() {
    const apiURL = `https://restcountries.com/v3.1/all?fields=translations,cca3,cca2,continents,languages,population,currencies,borders,area,flags,latlng,maps,capital`
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
                if(noUseCountries.includes(code)) {
                    continue
                }
                let name = countryData.translations.fra.common;
                let continent = countryData.continents[0];
                let language = Object.keys(countryData.languages).length !== 0 ? Object.values(countryData.languages) : ["No language"]
                let populationCount = countryData.population
                let currency = Object.keys(countryData.currencies).length !== 0 ? Object.values(countryData.currencies)[0].name : null
                let currencyCode = Object.keys(countryData.currencies)[0]
                let bordersCount = countryData.borders.length
                let area = countryData.area
                let latlng = countryData.latlng
                // saint martin api error
                if(code === "MAF") {
                    latlng[1] *= -1
                }
                let maps = countryData.maps.googleMaps
                let borders = countryData.borders
                let capital = countryData.capital
                let wikiLink = getWikiLink(name)

                let currencyType
                if(!currency) {
                    currencyType = [null, "No currency"]
                } else {
                     currencyType = getCurrency(currency, currencyCode)
                }
                let country = new Country(code, name, continent, language, populationCount, currencyType, bordersCount, area, latlng, maps, borders, capital, wikiLink)
                countries.push(country)
            }
        }
        countries.sort((c1, c2) => c1.name.localeCompare(c2.name))
        job = new CronJob(
            '00 00 * * *',
            function () {
                UpdateCurrentCountry(GetRandomCountryCode()).then(() => {
                    countryToGuess = SelectCountry(process.env.CURRENT_COUNTRY)
                })
                console.log(`reset country : ${countryToGuess.name}`)
            },
            null,
            true,
            'Europe/Paris'
        );
        countryToGuess = SelectCountry(process.env.CURRENT_COUNTRY)
        console.log(countryToGuess.name)
    });
}

function GetNearestCountry(country) {
    let nearestCountry = null
    let minDistance = Infinity
    for (let i = 0; i < countries.length; i++) {
        let otherCountry = countries[i]
        if(otherCountry.code === country.code) {
            continue
        }
        let distance = getDistance(country.latlng[0], country.latlng[1], otherCountry.latlng[0], otherCountry.latlng[1])
        if(distance < minDistance) {
            minDistance = distance
            nearestCountry = otherCountry
        }
    }
    return nearestCountry
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
    if(tryValue === valueToGuess) {
        return 1
    }
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

function GetLanguagesInCommon(languages1, languages2) {
    return languages1.filter(element => languages2.includes(element));
}

function CreateCountryData(country) {
    let populationCompare = country.populationCount > countryToGuess.populationCount ? "-" : country.populationCount < countryToGuess.populationCount ? "+" : "="
    let borderCompare = country.borderCount > countryToGuess.borderCount ? "-" : country.borderCount < countryToGuess.borderCount ? "+" : "="
    let areaCompare = country.area > countryToGuess.area ? "-" : country.area < countryToGuess.area ? "+" : "="
    let distance = getDistance(country.latlng[0], country.latlng[1], countryToGuess.latlng[0], countryToGuess.latlng[1])
    let languagesInCommon = GetLanguagesInCommon(country.language, countryToGuess.language)
    let languagesToDisplay = languagesInCommon.length > 0 ? languagesInCommon.slice(0,3).join(",\n") : country.language.slice(0,3).join(",\n")

    return {
        isAnswer : country.code === countryToGuess.code,
        name: country.name,
        code: country.code,
        maps : country.maps,
        wikiLink : country.wikiLink,
        continent: {
            value: country.continent,
            isEqual: country.continent === countryToGuess.continent
        },
        language: {
            value: languagesToDisplay,
            isEqual: languagesInCommon.length
        },
        populationCount: {
            value: country.populationCount,
            ratio: ComputeRatio(country.populationCount, countryToGuess.populationCount),
            isEqual: populationCompare
        },
        currency: {
            value: currencyToString(country.currency),
            isEqual: hasSameCurrency(country.currency, countryToGuess.currency)
        },
        borderCount: {
            value: country.borderCount,
            ratio: ComputeRatio(country.borderCount, countryToGuess.borderCount),
            isEqual: borderCompare
        },
        area: {
            value: country.area,
            ratio: ComputeRatio(country.area, countryToGuess.area),
            isEqual: areaCompare
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
    let countriesName= countries.map(c => ({name:c.name, code: c.code}))
    res.json(JSON.stringify(countriesName))
})

app.get('/countryShape', function (req, res) {
    let response = {
        code : countryToGuess.code
    }
    res.json(JSON.stringify(response))
})

app.get('/randomBorder', function (req, res) {
    let response
    if(countryToGuess.borderCount === 0) {
        let nearestCountryName = GetNearestCountry(countryToGuess).name
        response = {
            value : `Aucun pays frontalier \n (Pays le plus proche : ${nearestCountryName})`
        }
    } else {
        let randomBorderCode = countryToGuess.borders[Math.floor(Math.random()*countryToGuess.borderCount)]
        let countryName = GetCountryData(randomBorderCode).name
        response = {
            value : countryName
        }
    }
    res.json(JSON.stringify(response))
})

app.get('/capital', function (req, res) {
    const capital = countryToGuess.capital
    let response = {
        capital : capital.length === 0 ? "No Capital" : countryToGuess.capital.join(",\n")
    }
    res.json(JSON.stringify(response))
})

app.get('/rules', (req, res) => {
    res.sendFile('rules.html', {root: __dirname});
});

app.get('/welcome', (req, res) => {
    res.sendFile('welcome.html', {root: __dirname});
});


app.use("/static", express.static('./static/'));

app.listen(port, () => {            //server starts listening for any attempts from a client to connect at port: {port}
    console.log(`Now listening on port ${port}`);
});


function downloadSVG(url, filename) {
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Une erreur s'est produite lors du téléchargement du fichier. Code de statut : ${response.status}`);
            }
            return response.arrayBuffer();
        })
        .then(buffer => {
            Fs.writeFileSync(filename, Buffer.from(buffer));
            console.log(`Le fichier ${filename} a été téléchargé avec succès.`);
        })
        .catch(error => {
            console.error(`Une erreur s'est produite lors du téléchargement du fichier : ${error.message}`);
        });
}

function updateSVG(filename) {
    if (Fs.existsSync(filename)) {
        const file = Fs.readFileSync(filename, 'utf-8');
        const newColor = '#FFFFFF';
        if (!file.match(/fill="[^"]*"/)) {
            const updatedSVGWithFill = file.replace(/<svg/, `<svg fill="${newColor}"`);
            Fs.writeFileSync(filename, updatedSVGWithFill);
            console.log('La propriété fill a été ajoutée avec succès.');
        } else {
            const updatedSVG = file.replace(/fill="[^"]*"/g, `fill="${newColor}"`);
            Fs.writeFileSync(filename, updatedSVG);
            console.log('La propriété fill a été modifiée avec succès.');
        }
    }
    else {
        console.log('Le fichier SVG n\'existe pas. Aucune modification effectuée.');
    }

}
