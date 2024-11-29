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
    "H": ANSI.COLOR.BLUE,
    "$": ANSI.COLOR.YELLOW,
    "B": ANSI.COLOR.GREEN,
    "X": ANSI.COLOR.GREEN,
    "P": ANSI.COLOR.RED,
    "♨︎": ANSI.COLOR.CYAN,  // Correctly color the teleport pads
}

let isDirty = true;

let playerPos = {
    row: null,
    col: null,
}

const EMPTY = " ";
const HERO = "H";
const LOOT = "$";
const ENTRY = "d";
const EXIT = "D";
const POTION = "P";
const ENEMY_X = "X";
const ENEMY_B = "B";
const TELEPORT_PAD = "T";  // Teleport pad symbol (uppercase)
const TELEPORT_PAD_SMALL = "t";  // Teleport pad symbol (lowercase)

let direction = -1;

let items = [];

const THINGS = [LOOT, EMPTY, POTION, ENEMY_X, ENEMY_B, TELEPORT_PAD, TELEPORT_PAD_SMALL];

let eventText = "";

const HP_MAX = 10;

const playerStats = {
    hp: 8,
    cash: 0
}

let currentMapName = startingLevel;

let teleportPads = [];

function loadMap(mapName) {
    let newLevelData = readMapFile(levels[mapName]);
    level = newLevelData;
    playerPos = { row: null, col: null };
    teleportPads = [];  // Reset teleport pads list
    isDirty = true;

    // Find all teleport pads ("T" and "t") and store their positions
    for (let row = 0; row < level.length; row++) {
        for (let col = 0; col < level[row].length; col++) {
            if (level[row][col] === TELEPORT_PAD || level[row][col] === TELEPORT_PAD_SMALL) {
                teleportPads.push({ row, col });
            }
        }
    }
}

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
            } else if (currentItem == POTION) {
                let healAmount = Math.floor(Math.random() * 3) + 2;
                playerStats.hp = Math.min(playerStats.hp + healAmount, HP_MAX);
                eventText = `Player healed for ${healAmount} hearts!`;
            } else if (currentItem == ENEMY_X) {
                let damage = Math.floor(Math.random() * 3) + 1;
                playerStats.hp = Math.max(playerStats.hp - damage, 0);
                let loot = 2;
                playerStats.cash += loot;
                eventText = `Player took ${damage} damage from Enemy X and gained ${loot}$`;
            } else if (currentItem == ENEMY_B) {
                let damage = Math.floor(Math.random() * 3) + 3;
                playerStats.hp = Math.max(playerStats.hp - damage, 0);
                let loot = 3;
                playerStats.cash += loot;
                eventText = `Player took ${damage} damage from Enemy B and gained ${loot}$`;
            } else if (currentItem == TELEPORT_PAD || currentItem == TELEPORT_PAD_SMALL) {
                let teleportPad = teleportPads.find(pad => pad.row !== playerPos.row || pad.col !== playerPos.col);
                if (teleportPad) {
                    playerPos.row = teleportPad.row;
                    playerPos.col = teleportPad.col;
                    eventText = `Player teleported to another pad!`;
                }
            } else if (currentItem == EXIT) {
                let nextMapKey = Object.keys(levels).find(
                    (key, index, keys) => keys[index - 1] === currentMapName
                );
                if (nextMapKey) {
                    currentMapName = nextMapKey;
                    loadMap(currentMapName);
                    return;
                }
            } else if (currentItem == ENTRY) {
                let previousMapKey = Object.keys(levels).find(
                    (key, index, keys) => keys[index + 1] === currentMapName
                );
                if (previousMapKey) {
                    currentMapName = previousMapKey;
                    loadMap(currentMapName);
                    return;
                }
            }

            level[playerPos.row][playerPos.col] = EMPTY;
            level[tRow][tCol] = HERO;

            playerPos.row = tRow;
            playerPos.col = tCol;

            isDirty = true;
        } else {
            direction *= -1;
        }

        if (playerStats.hp <= 0) {
            eventText = "Game Over! You have died.";
            this.draw();
            clearInterval(gameLoop);
            return;
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
                
                if (symbol === EXIT || symbol === ENTRY) {
                    symbol = EMPTY;
                }

                if (symbol === TELEPORT_PAD || symbol === TELEPORT_PAD_SMALL) {
                    symbol = "♨︎";  // Replace "T" or "t" with the teleport pad symbol
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

function renderHud() {
    let hpBar = `Life:[${ANSI.COLOR.RED + pad(playerStats.hp, "♥︎") + ANSI.COLOR_RESET}${ANSI.COLOR.LIGHT_GRAY + pad(HP_MAX - playerStats.hp, "♥︎") + ANSI.COLOR_RESET}]`
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