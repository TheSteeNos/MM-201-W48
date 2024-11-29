import ANSI from "./utils/ANSI.mjs";
import KeyBoardManager from "./utils/KeyBoardManager.mjs";
import { readMapFile, readRecordFile } from "./utils/fileHelpers.mjs";
import * as CONST from "./constants.mjs";

const startingLevel = CONST.START_LEVEL_ID;
const levels = loadLevelListings();

function loadLevelListings(source = CONST.LEVEL_LISTING_FILE) {
    let data = readRecordFile(source);
    let levels = {};
    for (const item of data) {
        let keyValue = item.split(":");
        if (keyValue.length >= 2) {
            let key = keyValue[0];
            let value = keyValue[1];
            levels[key] = value;
        }
    }
    return levels;
}

let levelData = readMapFile(levels[startingLevel]);
let level = levelData;

let pallet = {
    "█": ANSI.COLOR.LIGHT_GRAY,
    "H": ANSI.COLOR.RED,
    "$": ANSI.COLOR.YELLOW,
    "B": ANSI.COLOR.GREEN,
};

let isDirty = true;

let playerPos = {
    row: null,
    col: null,
};

const EMPTY = " ";
const HERO = "H";
const LOOT = "$";
const ENTRY = "d";
const EXIT = "D";

let currentMapName = startingLevel;
let direction = -1;

let items = [];

const THINGS = [LOOT, EMPTY];

let eventText = "";

const HP_MAX = 10;

const playerStats = {
    hp: 8,
    cash: 0
};

class Labyrinth {
    update() {
        if (playerPos.row == null) {
            for (let row = 0; row < level.length; row++) {
                for (let col = 0; col < level[row].length; col++) {
                    if (level[row][col] == HERO) {
                        playerPos.row = row;
                        playerPos.col = col;
                        break;
                    }
                }
                if (playerPos.row != undefined) {
                    break;
                }
            }
        }

        let drow = 0;
        let dcol = 0;

        if (KeyBoardManager.isUpPressed()) {
            drow = -1;
        } else if (KeyBoardManager.isDownPressed()) {
            drow = 1;
        }

        if (KeyBoardManager.isLeftPressed()) {
            dcol = -1;
        } else if (KeyBoardManager.isRightPressed()) {
            dcol = 1;
        }

        let tRow = playerPos.row + drow;
        let tCol = playerPos.col + dcol;

        if (
            THINGS.includes(level[tRow][tCol]) ||
            level[tRow][tCol] === EXIT ||
            level[tRow][tCol] === ENTRY
        ) {
            let currentItem = level[tRow][tCol];

            if (currentItem == LOOT) {
                let loot = Math.round(Math.random() * 7) + 3;
                playerStats.cash += loot;
                eventText = `Player gained ${loot}$`;
            } else if (currentItem == EXIT) {
                // Transition to the next map
                let nextMapKey = Object.keys(levels).find(
                    (key, index, keys) => keys[index - 1] === currentMapName
                );
                if (nextMapKey) {
                    currentMapName = nextMapKey;
                    loadMap(currentMapName);
                    return;
                }
            } else if (currentItem == ENTRY) {
                // Transition to the previous map
                let previousMapKey = Object.keys(levels).find(
                    (key, index, keys) => keys[index + 1] === currentMapName
                );
                if (previousMapKey) {
                    currentMapName = previousMapKey;
                    loadMap(currentMapName);
                    return;
                }
            }

            // Move the HERO
            level[playerPos.row][playerPos.col] = EMPTY;
            level[tRow][tCol] = HERO;

            // Update the HERO
            playerPos.row = tRow;
            playerPos.col = tCol;

            // Mark for redrawing
            isDirty = true;
        } else {
            direction *= -1;
        }
    }

    draw() {
        if (isDirty == false) {
            return;
        }
        isDirty = false;
    
        console.log(ANSI.CLEAR_SCREEN, ANSI.CURSOR_HOME);
    
        let rendering = "";
    
        rendering += renderHud();
    
        for (let row = 0; row < level.length; row++) {
            let rowRendering = "";
            for (let col = 0; col < level[row].length; col++) {
                let symbol = level[row][col];
                
                // Override D and d with an empty space for rendering
                if (symbol === EXIT || symbol === ENTRY) {
                    symbol = EMPTY;
                }
    
                if (pallet[symbol] != undefined) {
                    rowRendering += pallet[symbol] + symbol + ANSI.COLOR_RESET;
                } else {
                    rowRendering += symbol;
                }
            }
            rowRendering += "\n";
            rendering += rowRendering;
        }
    
        console.log(rendering);
        if (eventText != "") {
            console.log(eventText);
            eventText = "";
        }
    }
}    

function loadMap(mapName) {
    if (!mapName || !levels[mapName]) {
        eventText = "No map to transition to.";
        return;
    }

    levelData = readMapFile(levels[mapName]);
    level = levelData;

    playerPos.row = null;
    playerPos.col = null;
    isDirty = true;
    eventText = `Loaded map: ${mapName}`;
}

function renderHud() {
    let hpBar = `Life:[${ANSI.COLOR.RED + pad(playerStats.hp, "♥︎") + ANSI.COLOR_RESET}${ANSI.COLOR.LIGHT_GRAY + pad(HP_MAX - playerStats.hp, "♥︎") + ANSI.COLOR_RESET}]`;
    let cash = `$:${playerStats.cash}`;
    return `${hpBar} ${cash}\n`;
}

function pad(len, text) {
    let output = "";
    for (let i = 0; i < len; i++) {
        output += text;
    }
    return output;
}

export default Labyrinth;
