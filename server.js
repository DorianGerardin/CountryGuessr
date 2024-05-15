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
import Country from './static/js/Country.js' //Save the port number where your server will be listening
import { CronJob } from 'cron';
const app = express();              //Instantiate an express app, the main work horse of this server
import axios from 'axios'
import dotenv from 'dotenv'
import admin from 'firebase-admin';
import { initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

const port = process.env.PORT || 8000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const firebaseapp = initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.europe-west1.firebasedatabase.app`
});
const database = getDatabase(firebaseapp);

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
            CURRENT_COUNTRY : newCountryCode,
            DAY_COUNT : parseInt(process.env.DAY_COUNT) + 1,
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

async function UpdateDayCount(newDayCount) {
    try {
        const data = {
            DAY_COUNT : newDayCount
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

/*async function WaitForAllCountriesData() {
    const apiURL = `https://restcountries.com/v3.1/all?fields=translations,cca3,cca2,continents,languages,population,currencies,borders,area,flags,latlng,maps,capital`
    const response = await fetch(apiURL);
    return await response.json();
}*/

function WaitForAllCountriesData() {
    return new Promise(async (resolve, reject) => {
        try {
            const jsonData = Fs.readFileSync("all_countries_data.json", 'utf8');
            const parsedData = JSON.parse(jsonData);
            resolve(parsedData);
        } catch (error) {
            reject(new Error('Erreur lors de la lecture du fichier JSON local : ' + error.message));
        }
    });
}

function SetAllCountries() {
    WaitForAllCountriesData()
    .then(data => {
        const countryCount = data.length;
        for (let i = 0; i < countryCount; i++) {
            let countryData = data[i]
            let code = countryData.cca3;
            if(noUseCountries.includes(code)) {
                continue
            }
            let name = countryData.translations.fra.common;
            let continents = countryData.continents;
            let language = Object.keys(countryData.languages).length !== 0 ? Object.values(countryData.languages) : ["No language"]
            let populationCount = countryData.population
            let currency = Object.keys(countryData.currencies).length !== 0 ? Object.values(countryData.currencies)[0].name : null
            let currencyCode = Object.keys(countryData.currencies)[0]
            let bordersCount = countryData.borders.length
            let area = countryData.area
            let latlng = countryData.latlng
            let maps = countryData.maps.googleMaps
            let borders = countryData.borders
            let capital = countryData.capital
            let wikiLink = getWikiLink(name)
            let flagAlt = countryData.flags.alt

            let currencyType
            if(!currency) {
                currencyType = [null, "No currency"]
            } else {
                 currencyType = getCurrency(currency, currencyCode)
            }
            let country = new Country(code, name, continents, language, populationCount, currencyType, bordersCount, area, latlng, maps, borders, capital, wikiLink, flagAlt)
            countries.push(country)
        }

        countries.sort((c1, c2) => c1.name.localeCompare(c2.name))
        job = new CronJob(
            '00 00 * * *',
            function () {
                if(process.env.NODE_ENV === "debug") {
                    return
                }
                addHistoryGame(process.env.DAY_COUNT, countryToGuess.code);
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

    if(valueToGuess <= 4) {
        if(valueToGuess === 0) {
            if(tryValue > 4) {
                return 0
            } else {
                return (Math.abs(tryValue - 4) / 4)
            }
        } else {
            return 1 - (Math.abs(tryValue - valueToGuess) / 4)
        }
    } else {
        if(tryValue >= valueToGuess * 2 || tryValue <= 0) {
            return 0
        } else {
            return 1 - (Math.abs(tryValue - valueToGuess) / valueToGuess)
        }
    }
}

function getDistance(lat1, lon1, lat2, lon2) {
    // Rayon de la Terre en mètres
    const earthRadius = 6371000;

    const radLat1 = (Math.PI * lat1) / 180;
    const radLon1 = (Math.PI * lon1) / 180;
    const radLat2 = (Math.PI * lat2) / 180;
    const radLon2 = (Math.PI * lon2) / 180;

    const dLat = radLat2 - radLat1;
    const dLon = radLon2 - radLon1;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(radLat1) * Math.cos(radLat2) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round((earthRadius * c) / 1000);
}

function getProximityPercent(distance) {
    let halfEarthCircumference = 20037
    return (1 - (distance / halfEarthCircumference)).toFixed(2)
}

function GetLanguagesInCommon(languages1, languages2) {
    return languages1.filter(element => languages2.includes(element));
}

function GetContinentsInCommon(continents1, continents2) {
    return continents1.filter(element => continents2.includes(element));
}

function CreateCountryData(country, requiredCountry = null) {

    let countryToCompare = requiredCountry ? GetCountryData(requiredCountry) : countryToGuess

    let populationCompare = country.populationCount > countryToCompare.populationCount ? "-" : country.populationCount < countryToCompare.populationCount ? "+" : "="
    let borderCompare = country.borderCount > countryToCompare.borderCount ? "-" : country.borderCount < countryToCompare.borderCount ? "+" : "="
    let areaCompare = country.area > countryToCompare.area ? "-" : country.area < countryToCompare.area ? "+" : "="
    let distance = getDistance(country.latlng[0], country.latlng[1], countryToCompare.latlng[0], countryToCompare.latlng[1])
    let languagesInCommon = GetLanguagesInCommon(country.language, countryToCompare.language)
    let languagesToDisplay = languagesInCommon.length > 0 ? languagesInCommon.slice(0,3).join(",\n") : country.language.slice(0,3).join(",\n")
    let continentsInCommon = GetContinentsInCommon(country.continent, countryToCompare.continent)
    let continentsToDisplay = continentsInCommon.length > 0 ? continentsInCommon.join(", \n") : country.continent.join(", \n")

    return {
        isAnswer : country.code === countryToCompare.code,
        name: country.name,
        code: country.code,
        maps : country.maps,
        wikiLink : country.wikiLink,
        flagAlt : country.flagAlt,
        continent: {
            value: continentsToDisplay,
            isEqual: continentsInCommon.length > 0
        },
        language: {
            value: languagesToDisplay,
            isEqual: languagesInCommon.length > 0
        },
        populationCount: {
            value: country.populationCount,
            ratio: ComputeRatio(country.populationCount, countryToCompare.populationCount),
            isEqual: populationCompare
        },
        currency: {
            value: currencyToString(country.currency),
            isEqual: hasSameCurrency(country.currency, countryToCompare.currency)
        },
        borderCount: {
            value: country.borderCount,
            ratio: ComputeRatio(country.borderCount, countryToCompare.borderCount),
            isEqual: borderCompare
        },
        area: {
            value: country.area,
            ratio: ComputeRatio(country.area, countryToCompare.area),
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

app.get('/game', async function (req, res) {
    let gameID = req.query.id;
    if(!gameID) {
        res.redirect('/');
        return
    }
    try {
        const requiredCountry = await getCountryByGame(gameID);
        if (requiredCountry) {
            res.sendFile(`index.html`, {root: __dirname});
        } else {
            res.status(400).json({error: "No game available with ID : " + gameID});
        }
    } catch (error) {
        console.error("Error fetching country with game", error);
        res.status(400).json({error: "Error fetching country with game"});
    }
});

app.get('/guess', async function (req, res) {
    //res.header("Content-Type",'application/json');
    const validParams = ['code', 'game'];
    for (const param in req.query) {
        if (!validParams.includes(param)) {
            res.status(400).json({error: "invalid url parameter : " + param});
            return;
        }
    }

    let guessCode = req.query.code
    let gameID = req.query.game

    let country = GetCountryData(guessCode)
    if(!country) {
        res.status(404).json({error: "Country not found"});
        return
    }

    let countryData
    if(gameID) {
        try {
            const requiredCountry = await getCountryByGame(gameID);
            if (requiredCountry) {
                countryData = CreateCountryData(country, requiredCountry);
                res.json(JSON.stringify(countryData));
            } else {
                res.status(400).json({error: "No game available with ID : " + gameID});
            }
        } catch (error) {
            console.error("Error fetching country with game", error);
            res.status(400).json({error: "Error fetching country with game"});
        }
    } else {
        countryData = CreateCountryData(country);
        res.json(JSON.stringify(countryData));
    }
})

app.get('/AllCountriesName', function (req, res) {
    res.header("Content-Type",'application/json');
    let countriesName= countries.map(c => ({name:c.name, code: c.code}))
    res.json(JSON.stringify(countriesName))
})

app.get('/countryShape', async function (req, res) {
    res.header("Content-Type",'application/json');

    let gameID = req.query.game
    let refCountryCode

    if(gameID) {
        try {
            const requiredCountry = await getCountryByGame(gameID);
            if (requiredCountry) {
                refCountryCode = requiredCountry
            } else {
                res.status(400).json({error: "No game available with ID : " + gameID});
            }
        } catch (error) {
            console.error("Error fetching country with game", error);
            res.status(400).json({error: "Error fetching country with game"});
        }
    } else {
        refCountryCode = countryToGuess.code
    }

    const content = `<img src="./static/images/shapes/${refCountryCode}.svg" class="countryShape clueContentNode" alt="shape clue">`;
    res.json({ content });
})

app.get('/randomBorder', async function (req, res) {
    res.header("Content-Type",'application/json');

    let gameID = req.query.game
    let refCountry

    if(gameID) {
        try {
            const requiredCountry = await getCountryByGame(gameID);
            if (requiredCountry) {
                refCountry = GetCountryData(requiredCountry)
            } else {
                res.status(400).json({error: "No game available with ID : " + gameID});
            }
        } catch (error) {
            console.error("Error fetching country with game", error);
            res.status(400).json({error: "Error fetching country with game"});
        }
    } else {
        refCountry = countryToGuess
    }

    let content
    if(refCountry.borderCount === 0) {
        let nearestCountryName = GetNearestCountry(refCountry).name
        content = `<div class="clueContentNode">Aucun pays frontalier<br>(Le plus proche : ${nearestCountryName})</div>`;
    } else {
        let randomBorderCode = refCountry.borders[Math.floor(Math.random()*refCountry.borderCount)]
        let countryName = GetCountryData(randomBorderCode).name
        content = `<div class="clueContentNode">${countryName}</div>`;
    }
    res.json({ content })
})

app.get('/capital', async function (req, res) {
    res.header("Content-Type",'application/json');

    let gameID = req.query.game
    let refCountry
    if(gameID) {
        try {
            const requiredCountry = await getCountryByGame(gameID);
            if (requiredCountry) {
                refCountry = GetCountryData(requiredCountry)
            } else {
                res.status(400).json({error: "No game available with ID : " + gameID});
            }
        } catch (error) {
            console.error("Error fetching country with game", error);
            res.status(400).json({error: "Error fetching country with game"});
        }
    } else {
        refCountry = countryToGuess
    }

    let content
    const capital = refCountry.capital
    if(capital.length === 0) {
        content = `<div class="clueContentNode">Aucune capitale</div>`;
    } else {
        content = `<div class="clueContentNode">${refCountry.capital.join(",\n")}</div>`;
    }
    res.json({ content })
})

app.get('/dayCount', function (req, res) {
    res.header("Content-Type",'application/json');
    res.json( {dayCount:process.env.DAY_COUNT} )
})

app.get('/rules', (req, res) => {
    res.sendFile('rules.html', {root: __dirname});
});

app.get('/welcome', (req, res) => {
    res.sendFile('welcome.html', {root: __dirname});
});

app.get('/history', function (req, res) {
    res.sendFile('history.html', {root: __dirname});
})

app.get('/gameHistory', function (req, res) {
    waitForHistory()
    .then(games => {
        res.json({ games })
    })
    .catch(error => {
        res.status(400).json({error: "No history"});
    });
})

app.use("/static", express.static('./static/'));

app.use((req, res) => {
    res.redirect('/');
});

app.listen(port, () => {
    console.log(`Now listening on port ${port}`);
});

function waitForHistory() {
    return new Promise(async (resolve, reject) => {
        try {
            const dbRef = database.ref();
            const snapshot = await dbRef.get();
            if (snapshot.exists()) {
                const keys = Object.keys(snapshot.val());
                resolve(keys);
            } else {
                console.log("No data available");
                resolve(null);
            }
        } catch (error) {
            console.error(error);
            reject(new Error('Error reading json file : ' + error.message));
        }
    });
}
async function getCountryByGame(gameID) {
    try {
        const dbRef = database.ref(gameID);
        const snapshot = await dbRef.get();
        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error with database when fetching country", error);
        return null;
    }
}

async function addHistoryGame(gameID, countryCode) {
    try {
        const dbRef = database.ref(gameID);
        await dbRef.set(countryCode);
    } catch (error) {
        console.error("Error with database when adding game id", error);
    }
}


// =====================================================================================================================
// =====================================================================================================================


function downloadSVG(url, filename) {
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Une erreur s'est produite lors du téléchargement du fichier. 
                Code de statut : ${response.status}`);
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

// database.ref(new Date().toDateString()).set(data)
// .then(() => {
//     console.log('Données écrites avec succès.');
//     const dbRef = database.ref();
//     dbRef.get().then((snapshot) => {
//         if (snapshot.exists()) {
//             //console.log("value get : " + snapshot.val());
//             const keys = Object.keys(snapshot.val());
//             console.log("keys : ", keys);
//         } else {
//             console.log("No data available");
//         }
//       }).catch((error) => {
//         console.error(error);
//       });
// })
// .catch((error) => {
//     console.error('Erreur lors de l\'écriture des données : ', error);
// });
