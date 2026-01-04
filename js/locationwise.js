var wordStates = document.querySelectorAll(".divst-of-states > div");
var svgStates = document.querySelectorAll("#states > *");

var wordCity = document.querySelectorAll(".divst-of-cities > div");
var svgCity = document.querySelectorAll("#city > *");

var owordStates = document.querySelectorAll(".divst-of-ostates > div");
var osvgStates = document.querySelectorAll("#ostates > *");

var owordCity = document.querySelectorAll(".divst-of-ocities .divtm");
var osvgCity = document.querySelectorAll("#ocity > *");

function removeAllOn() {
    [wordStates, svgStates, wordCity, svgCity, owordStates, osvgStates, owordCity, osvgCity]
        .forEach(group => group.forEach(el => el.classList.remove("on")));
}

function addOnFromList(el, attr) {
    var code = el.getAttribute(attr);
    var svgEl = document.querySelector("#" + code);
    el.classList.add("on");
    if (svgEl) svgEl.classList.add("on");
}

function addOnFromSvg(el, attr) {
    var id = el.getAttribute("id");
    var wordEl = document.querySelector("[" + attr + "='" + id + "']");
    el.classList.add("on");
    if (wordEl) wordEl.classList.add("on");
}

function bindHoverTouch(listItems, svgItems, attr) {
    listItems.forEach(el => {
        el.addEventListener("mouseenter", () => addOnFromList(el, attr));
        el.addEventListener("mouseleave", removeAllOn);
        el.addEventListener("focusin", () => addOnFromList(el, attr));
        el.addEventListener("focusout", removeAllOn);
        el.addEventListener("touchstart", () => { removeAllOn(); addOnFromList(el, attr); });
    });

    svgItems.forEach(el => {
        el.addEventListener("mouseenter", () => addOnFromSvg(el, attr));
        el.addEventListener("mouseleave", removeAllOn);
        el.addEventListener("focusin", () => addOnFromSvg(el, attr));
        el.addEventListener("focusout", removeAllOn);
        el.addEventListener("touchstart", () => { removeAllOn(); addOnFromSvg(el, attr); });
    });
}

bindHoverTouch(wordStates, svgStates, "data-state");
bindHoverTouch(wordCity, svgCity, "data-city");
bindHoverTouch(owordStates, osvgStates, "data-ostate");
bindHoverTouch(owordCity, osvgCity, "data-ocity");


const schoolText = document.querySelector('.school .divtm');
const schoolPaths = document.querySelectorAll('#school path');

function highlightSchool(isOn) {
    schoolPaths.forEach(path => path.classList.toggle('on', isOn));
    schoolText.classList.toggle('on', isOn);
}

schoolText.addEventListener('mouseenter', () => highlightSchool(true));
schoolText.addEventListener('mouseleave', () => highlightSchool(false));
schoolText.addEventListener('touchstart', () => highlightSchool(true));
schoolText.addEventListener('touchend', () => highlightSchool(false));

schoolPaths.forEach(path => {
    path.addEventListener('mouseenter', () => highlightSchool(true));
    path.addEventListener('mouseleave', () => highlightSchool(false));
    path.addEventListener('touchstart', () => highlightSchool(true));
    path.addEventListener('touchend', () => highlightSchool(false));
});


