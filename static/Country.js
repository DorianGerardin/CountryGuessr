export default class Country {
	constructor(code, name, continent, language, populationCount, currency, borderCount, area, latlng, maps, borders, capital, wikiLink, flagAlt) {
		this.code = code;
		this.name = name;
	    this.continent = continent;
	    this.language = language;
	    this.populationCount = populationCount;
	    this.currency = currency;
	    this.borderCount = borderCount;
	    this.area = area;
		this.latlng = latlng
		this.maps = maps
		this.borders = borders
		this.capital = capital
		this.wikiLink = wikiLink
		this.flagAlt = flagAlt
  }
}