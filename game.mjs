import Labyrinth from "./labyrint.mjs";
import ANSI from "./utils/ANSI.mjs";
import SplashScreen from "./splashScreen.mjs";

const REFRESH_RATE = 250;

console.log(ANSI.RESET, ANSI.CLEAR_SCREEN, ANSI.HIDE_CURSOR);

let intervalID = null;
let isBlocked = false;
let state = null;
let splashScreen = new SplashScreen();
let gameStarted = false;

function init() {
    intervalID = setInterval(update, REFRESH_RATE);
}

function update() {
    if (isBlocked) { return; }
    isBlocked = true;

    if (!gameStarted) {
        splashScreen.update();
        splashScreen.draw();
    } else {
        state.update();
        state.draw();
    }

    isBlocked = false;
}

splashScreen.stopSplash = function() {
    state = new Labyrinth();
    gameStarted = true;
    clearInterval(intervalID);
    intervalID = setInterval(update, REFRESH_RATE);
}

init();