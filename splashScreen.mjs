import ANSI from "./utils/ANSI.mjs";

const outputGraphics = `
 ██▓    ▄▄▄       ▄▄▄▄ ▓██   ██▓ ██▀███   ██▓ ███▄    █ ▄▄▄█████▓ ██░ ██
▓██▒   ▒████▄    ▓█████▄▒██  ██▒▓██ ▒ ██▒▓██▒ ██ ▀█   █ ▓  ██▒ ▓▒▓██░ ██▒
▒██░   ▒██  ▀█▄  ▒██▒ ▄██▒██ ██░▓██ ░▄█ ▒▒██▒▓██  ▀█ ██▒▒ ▓██░ ▒░▒██▀▀██░
▒██░   ░██▄▄▄▄██ ▒██░█▀  ░ ▐██▓░▒██▀▀█▄  ░██░▓██▒  ▐▌██▒░ ▓██▓ ░ ░▓█ ░██
░██████▒▓█   ▓██▒░▓█  ▀█▓░ ██▒▓░░██▓ ▒██▒░██░▒██░   ▓██░  ▒██▒ ░ ░▓█▒░██▓
░ ▒░▓  ░▒▒   ▓▒█░░▒▓███▀▒ ██▒▒▒ ░ ▒▓ ░▒▓░░▓  ░ ▒░   ▒ ▒   ▒ ░░    ▒ ░░▒░▒
░ ░ ▒  ░ ▒   ▒▒ ░▒░▒   ░▓██ ░▒░   ░▒ ░ ▒░ ▒ ░░ ░░   ░ ▒░    ░     ▒ ░▒░ ░
  ░ ░    ░   ▒    ░    ░▒ ▒ ░░    ░░   ░  ▒ ░   ░   ░ ░   ░       ░  ░░ ░
    ░  ░     ░  ░ ░     ░ ░        ░      ░           ░           ░  ░  ░
                       ░░ ░
`;

class SplashScreen {

    constructor() {
        this.dirty = true;
        this.fadeAmount = 0;
        this.fadeDirection = 1;
        this.startTime = Date.now();
    }

    update() {
        let elapsed = Date.now() - this.startTime;
        
        if (elapsed >= 5000) {
            this.stopSplash();
        }

        if (this.fadeDirection === 1) {
            this.fadeAmount += 0.01;
            if (this.fadeAmount >= 1) {
                this.fadeDirection = -1;
            }
        } else {
            this.fadeAmount -= 0.01;
            if (this.fadeAmount <= 0) {
                this.fadeDirection = 1;
            }
        }
    }

    draw() {
        if (this.dirty) {
            this.dirty = false;
            console.log(ANSI.CLEAR_SCREEN, ANSI.CURSOR_HOME);
        }

        let fadeColor = Math.floor(this.fadeAmount * 255);
        let textColor = `rgb(${fadeColor}, ${fadeColor}, ${fadeColor})`;

        console.log(`\x1b[38;2;${fadeColor};${fadeColor};${fadeColor}m`);

        let lines = outputGraphics.split("\n");
        let maxLength = Math.max(...lines.map(line => line.length));
        let padding = Math.floor((process.stdout.columns - maxLength) / 2);
        lines.forEach(line => {
            console.log(" ".repeat(padding) + line);
        });

        console.log(ANSI.COLOR_RESET);
    }

    stopSplash() {
        this.dirty = true;
        this.startTime = 0;
    }
}

export default SplashScreen;