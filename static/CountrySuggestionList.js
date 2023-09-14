class CountrySuggestionList {
    constructor(allCountriesList, container, countryInput) {
        this.allCountriesList = allCountriesList
        this.list = []
        this.countryInput = countryInput
        this.container = container
        this.currentFocusIndex = 0

        this.countryInput.addEventListener("keydown", (e) => this.UpdateFocused(e))
        //this.countryInput.addEventListener("click", () => this.currentFocusIndex = 0)
    }

    Show(suggestionList) {
        this.currentFocusIndex = 0
        this.container.innerHTML = '';
        this.container.style.visibility = "visible";
        this.UpdateCountrySuggestionList(suggestionList)
    }

    Hide() {
        this.currentFocusIndex = 0
        this.container.style.visibility = "hidden";
        this.container.innerHTML = '';
    }

    UpdateCountrySuggestionList(suggestionList) {
        this.list = suggestionList.length === 0 ? this.allCountriesList : suggestionList
        for(let i = 0; i < this.list.length; i++) {
            let countryNode= document.createElement("div");
            countryNode.innerHTML = this.list[i].name
            countryNode.classList.add("suggestion")
            countryNode.addEventListener("click", () => {
                this.SelectCountry(i)
            })
            countryNode.addEventListener("mouseover", () => {
                this.UnfocusCurrent()
                this.currentFocusIndex = i
                this.ToggleFocus(countryNode, true)
            })
            countryNode.addEventListener("mouseout", () => {
                this.ToggleFocus(countryNode, false)
            })
            this.container.appendChild(countryNode)
        }
        this.ToggleFocus(this.container.childNodes[0], true)
    }

    SelectCountry(index) {
        this.container.style.visibility = "hidden"
        this.countryInput.value = this.list[index].name
        this.container.innerHTML = "";
        this.currentFocusIndex = 0;
    }

    ToggleFocus(countryNode, setOn) {
        setOn ? countryNode.classList.add("suggestionFocus") : countryNode.classList.remove("suggestionFocus")
    }

    IsNewIndexOut(index) {
        return index >= this.list.length || index < 0
    }

    UnfocusCurrent() {
        if(this.currentFocusIndex >= 0 && this.currentFocusIndex < this.list.length) {
            let currentFocus = this.container.childNodes[this.currentFocusIndex]
            this.ToggleFocus(currentFocus, false)
        }
    }

    SetNewFocus(newIndex) {
        this.UnfocusCurrent();
        if(this.IsNewIndexOut(newIndex)) {
            this.currentFocusIndex = 0
            this.countryInput.focus()
            return
        }
        else {
            let newCountryNode = this.container.childNodes[newIndex]
            this.ToggleFocus(newCountryNode, true)
            this.countryInput.value = newCountryNode.innerText
            this.countryInput.setSelectionRange(newCountryNode.innerText.length, newCountryNode.innerText.length)
            this.container.childNodes[newIndex].scrollIntoViewIfNeeded(false)
        }
        this.currentFocusIndex = newIndex
    }

    UpdateFocused(event) {
        if(event.keyCode === 40){//down
            this.SetNewFocus(this.currentFocusIndex + 1)
        }
        else if(event.keyCode === 38){//up
            this.SetNewFocus(this.currentFocusIndex - 1)
        } else if(event.key === "Enter") {
            this.SelectCountry(this.currentFocusIndex)
        }
    }
}