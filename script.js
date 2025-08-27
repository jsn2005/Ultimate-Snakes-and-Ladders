// ===================== Constants and Config =====================

const LADDERS = {
    4: 14, 9: 31, 20: 38, 28: 84, 40: 59, 63: 81, 71: 91
};

const SNAKES = {
    17: 7, 54: 34, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 99: 78
};

const POWERUP_LOCATIONS = {
    attack: [12, 18, 27, 34, 41, 46, 53, 59, 67, 74],
    defence: [13, 21, 29, 37, 44, 50, 56, 63, 70, 78],
    movement: [14, 23, 30, 38, 45, 52, 60, 66, 73, 80],
    chaos: [22, 36, 49, 61, 75, 82, 88, 94],
    legendary: [35, 57, 69, 85, 97]
};

const POWERUP_TYPES = ["attack", "defence", "movement", "chaos", "legendary"];

const POWERUP_ICONS = {
    attack: "⚔️",
    defence: "🛡️",
    movement: "🏃",
    chaos: "☠️",
    legendary: "⭐"
};

// ===================== Powerup Definitions =====================

const powerupDefinitions = {
    attack: [
        {
            name: "Dice Curse",
            description: "Opponent's next roll will be 1.",
            duration: "turn", // lasts one turn
            effect: (player, opponent, gameManager) => {
                opponent.effects.push({ type: "diceCurse", duration: "turn" });
                gameManager.displayStatus(`${capitalize(player.color)} used Dice Curse! ${capitalize(opponent.color)}'s next roll will be 1.`);
            }
        },
        {
            name: "Mark of Misfortune",
            description: "If the next roll is even, opponent moves down one row.",
            duration: "turn",
            effect: (player, opponent, gameManager) => {
                opponent.effects.push({ type: "markOfMisfortune", duration: "turn" });
                gameManager.displayStatus(`${capitalize(player.color)} used Mark of Misfortune! If the next roll is even, ${opponent.color} moves down one row.`);
            }
        }
        // ... more attack powerups
    ],
    defence: [
        {
            name: "Shield Wall",
            description: "Blocks one attack powerup.",
            duration: "turn",
            effect: (player, opponent, gameManager) => {
                player.effects.push({ type: "shieldWall", duration: "turn" });
                gameManager.displayStatus(`${player.color} used Shield Wall! Blocks next attack powerup.`);
            }
        }
        // ... more defence powerups
    ],
    movement: [
        {
            name: "Dash",
            description: "Move forward 3 extra spaces.",
            duration: "instant",
            effect: (player, opponent, gameManager) => {
                gameManager.movePlayerAnimated(player, 3);
                gameManager.displayStatus(`${capitalize(player.color)} used Dash! Moves forward 3 spaces.`);
            }
        },
        {
            name: "Jetpack",
            description: "Move vertically up 2 rows.",
            duration: "instant",
            effect: (player, opponent, gameManager) => {
                const oldPosition = player.position;
                const newPosition = moveRowsUp(player.position, 2);

                // Remove old counter
                document.querySelectorAll(`.counter.${player.color}`).forEach(counter => counter.remove());
                player.position = newPosition;
                // Add counter to new cell
                const newCell = document.getElementById("cell-" + player.position);
                const newCounter = document.createElement("div");
                newCounter.className = "counter " + player.color;
                newCell.appendChild(newCounter);

                gameManager.displayStatus(`${capitalize(player.color)} used Jetpack! Moved from ${oldPosition} to ${newPosition} (up 2 rows).`);
                gameManager.logTurn({
                    player,
                    action: "usePowerup",
                    dice: null,
                    from: oldPosition,
                    to: newPosition,
                    events: ["powerup"],
                    powerupUsed: "Jetpack",
                    effectsApplied: player.effects.map(e => e.type)
                });
            }
        },
        {
            name: "Double Dice",
            description: "Your next dice roll is doubled.",
            duration: "turn",
            effect: (player, opponent, gameManager) => {
                player.effects.push({ type: "doubleDice", duration: "turn" });
                gameManager.displayStatus(`${capitalize(player.color)} used Double Dice! Next roll will be doubled.`);
            }
        },
        {
            name: "Even Roll",
            description: "Your next dice roll will be an even number (2, 4, or 6).",
            duration: "turn",
            effect: (player, opponent, gameManager) => {
                player.effects.push({ type: "evenRoll", duration: "turn" });
                gameManager.displayStatus(`${capitalize(player.color)} used Even Roll! Next roll will be even.`);
            }
        },
        {
            name: "Reverse Roll",
            description: "On your next roll, you move backwards instead of forwards.",
            duration: "turn",
            effect: (player, opponent, gameManager) => {
                player.effects.push({ type: "reverseRoll", duration: "turn" });
                gameManager.displayStatus(`${capitalize(player.color)} used Reverse Roll! Next roll will move backwards.`);
            }
        },
        {
            name: "L.A.D.D.E.R Intelligence",
            description: "Move to the base of the nearest ladder ahead of you.",
            duration: "instant",
            effect: (player, opponent, gameManager) => {
                const ladders = Object.keys(gameManager.ladders).map(Number).sort((a, b) => a - b);
                // Find the next ladder start greater than current position
                const nextLadderBase = ladders.find(cell => cell > player.position);
                const oldPosition = player.position;
                if (nextLadderBase) {
                    // Remove old counter
                    document.querySelectorAll(`.counter.${player.color}`).forEach(counter => counter.remove());
                    player.position = nextLadderBase;
                    // Add counter to new cell
                    const newCell = document.getElementById("cell-" + player.position);
                    const newCounter = document.createElement("div");
                    newCounter.className = "counter " + player.color;
                    newCell.appendChild(newCounter);

                    gameManager.displayStatus(`${capitalize(player.color)} used L.A.D.D.E.R Intelligence! Moved from ${oldPosition} to ladder base at ${nextLadderBase}.`);
                    gameManager.logTurn({
                        player,
                        action: "usePowerup",
                        dice: null,
                        from: oldPosition,
                        to: nextLadderBase,
                        events: ["powerup"],
                        powerupUsed: "L.A.D.D.E.R Intelligence",
                        effectsApplied: player.effects.map(e => e.type)
                    });
                } else {
                    gameManager.displayStatus(`${capitalize(player.color)} used L.A.D.D.E.R Intelligence but there are no ladders ahead!`);
                    gameManager.logTurn({
                        player,
                        action: "usePowerup",
                        dice: null,
                        from: oldPosition,
                        to: oldPosition,
                        events: ["powerup"],
                        powerupUsed: "L.A.D.D.E.R Intelligence",
                        effectsApplied: player.effects.map(e => e.type)
                    });
                }
            }
        },
        {
            name: "Hermes Boots",
            description: "For the next 2 rolls, add +2 to each dice roll.",
            duration: 2, // Use number to represent turns left
            effect: (player, opponent, gameManager) => {
                player.effects.push({ type: "hermesBoots", duration: 2 });
                gameManager.displayStatus(`${capitalize(player.color)} used Hermes Boots! Next 2 rolls will get +2.`);
            }
        },
        {
            name: "Broken Teleporter",
            description: "Teleports you to a random square behind the opponent.",
            duration: "instant",
            effect: (player, opponent, gameManager) => {
                const oldPosition = player.position;
                // Get all squares behind the opponent (less than opponent.position)
                const possibleSquares = [];
                for (let i = 1; i < opponent.position; i++) {
                    possibleSquares.push(i);
                }

                if (possibleSquares.length === 0) {
                    // If there are no squares behind the opponent
                    gameManager.displayStatus(`${capitalize(player.color)} used Broken Teleporter, but there are no squares behind ${capitalize(opponent.color)}!`);
                    gameManager.logTurn({
                        player,
                        action: "usePowerup",
                        dice: null,
                        from: oldPosition,
                        to: oldPosition,
                        events: ["powerup"],
                        powerupUsed: "Broken Teleporter",
                        effectsApplied: player.effects.map(e => e.type)
                    });
                    return;
                }

                // Pick a random square
                const targetSquare = possibleSquares[Math.floor(Math.random() * possibleSquares.length)];

                // Remove old counter
                document.querySelectorAll(`.counter.${player.color}`).forEach(counter => counter.remove());
                player.position = targetSquare;
                // Add counter to new cell
                const newCell = document.getElementById("cell-" + player.position);
                const newCounter = document.createElement("div");
                newCounter.className = "counter " + player.color;
                newCell.appendChild(newCounter);

                gameManager.displayStatus(`${capitalize(player.color)} used Broken Teleporter! Moved from ${oldPosition} to ${targetSquare}, behind ${capitalize(opponent.color)}.`);
                gameManager.logTurn({
                    player,
                    action: "usePowerup",
                    dice: null,
                    from: oldPosition,
                    to: targetSquare,
                    events: ["powerup"],
                    powerupUsed: "Broken Teleporter",
                    effectsApplied: player.effects.map(e => e.type)
                });
            }
        },
    ],
    chaos: [
        {
            name: "Swap Places",
            description: "Swap positions with opponent.",
            duration: "instant",
            effect: (player, opponent, gameManager) => {
                let temp = player.position;
                player.position = opponent.position;
                opponent.position = temp;
                gameManager.updatePlayerPositions();
                gameManager.displayStatus(`${player.color} used Swap Places!`);
            }
        }
        // ... more chaos powerups
    ],
    legendary: [
        {
            name: "Time Stop",
            description: "Take two turns in a row.",
            duration: "instant",
            effect: (player, opponent, gameManager) => {
                gameManager.extraTurnFor(player);
                gameManager.displayStatus(`${player.color} used Time Stop! Gets an extra turn.`);
            }
        }
        // ... more legendary powerups
    ]
};

// ===================== Helper Functions =====================

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getCellCenter(num) {
    const cell = document.getElementById("cell-" + num);
    const boardRect = document.getElementById("board").getBoundingClientRect();
    const rect = cell.getBoundingClientRect();

    return {
        x: rect.left - boardRect.left + rect.width / 2,
        y: rect.top - boardRect.top + rect.height / 2
    };
}

function moveOneRowDown(position, cols = 10) {
    const index = position - 1;
    const row = Math.floor(index / cols);
    const col = index % cols;
    if (row === 0) return 1;
    let newRow = row - 1;
    let newCol;
    if (row % 2 === 0) {
        newCol = newRow % 2 === 0 ? col : cols - 1 - col;
    } else {
        newCol = newRow % 2 === 0 ? cols - 1 - col : col;
    }
    return newRow * cols + newCol + 1;
}

function moveRowsUp(position, rows = 2, cols = 10) {
    // Move player vertically up by N rows, preserving column logic for zigzag
    const index = position - 1;
    const row = Math.floor(index / cols);
    const col = index % cols;

    let newRow = Math.min(row + rows, 9);
    let newCol;
    if (row % 2 === 0) {
        newCol = newRow % 2 === 0 ? col : cols - 1 - col;
    } else {
        newCol = newRow % 2 === 0 ? cols - 1 - col : col;
    }
    return newRow * cols + newCol + 1;
}


// ===================== Player Class =====================

class Player {
    constructor(id, color) {
        this.id = id;
        this.position = 1;
        this.color = color;
        this.effects = [];
        this.inventory = {
            attack: [],
            defence: [],
            movement: [],
            chaos: [],
            legendary: []
        };
    }

    rollDice() {
        return Math.floor(Math.random() * 6) + 1;
    }
}


// ===================== GameManager Class =====================

class GameManager {
    constructor() {
        this.players = [];
        this.currentPlayerIdx = 0;
        this.ladders = LADDERS;
        this.snakes = SNAKES;
        this.powerupLocations = POWERUP_LOCATIONS;
        this.powerupTypes = POWERUP_TYPES;
        this.powerupIcons = POWERUP_ICONS;
        this.gameHistory = [];
        this.isGameOver = false;

        this.setupGame();
    }

    logTurn({ player, action, dice, from, to, events, powerupUsed, effectsApplied }) {
        const turnEntry = {
            turn: this.gameHistory.length + 1,
            player: player.color,
            action,              // "roll", "usePowerup", etc.
            dice,                // integer or null
            from,                // starting position
            to,                  // ending position
            events: events || [],// array of strings: "ladder", "snake", "powerup", "win"
            powerupUsed: powerupUsed || null,
            effectsApplied: effectsApplied || [],
            timestamp: new Date().toISOString()
        };
        this.gameHistory.push(turnEntry);
    }

    // --- Game Setup ---
    setupGame() {
        this.setupBoard();
        this.setupOverlay();
        this.setupInventoryContainer();
    }

    setupBoard() {
        this.board = document.getElementById("board");
        for (let row = 9; row >= 0; row--) {
            let rowCells = [];
            for (let col = 0; col < 10; col++) {
                let number = row * 10 + col + 1;
                rowCells.push(number);
            }
            if (row % 2 === 1) rowCells.reverse();

            rowCells.forEach(num => {
                const cell = document.createElement("div");
                cell.className = "cell";
                cell.id = "cell-" + num;
                cell.innerText = num;
                this.board.appendChild(cell);
            });
        }

        Object.entries(this.ladders).forEach(([start, end]) => this.drawLadder(Number(start), end));
        Object.entries(this.snakes).forEach(([start, end]) => this.drawSnake(Number(start), end));
        Object.entries(this.powerupLocations).forEach(([type, cells]) => {
            cells.forEach(cellNum => this.placePowerupOnBoard(cellNum, type));
        });
    }

    setupOverlay() {
        // SVG overlay for ladders/snakes
        if (!document.getElementById("overlay")) {
            const overlay = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            overlay.id = "overlay";
            overlay.style.position = "absolute";
            overlay.style.top = "0";
            overlay.style.left = "0";
            overlay.style.width = "100%";
            overlay.style.height = "100%";
            document.body.appendChild(overlay);
        }
    }

    setupInventoryContainer() {
        this.inventoryContainer = document.getElementById("inventory-container");
        if (!this.inventoryContainer) {
            this.inventoryContainer = document.createElement("div");
            this.inventoryContainer.id = "inventory-container";
            document.body.appendChild(this.inventoryContainer);
        }
    }

    // --- Player Management ---
    addPlayer(player) {
        this.players.push(player);
    }

    spawnPlayers() {
        this.players.forEach(player => {
            player.position = 1;
            let startCell = document.getElementById("cell-" + player.position);
            let counter = document.createElement("div");
            counter.className = "counter " + player.color;
            startCell.appendChild(counter);
        });
    }

    startGame() {
        this.spawnPlayers();
        this.renderPlayerInventories();
        this.attachDiceListener();
        this.updateInventoryInteractivity();
    }

    // --- Turn and Movement Logic ---
    attachDiceListener() {
        document.getElementById("rollBtn").addEventListener("click", () => {
            let player = this.players[this.currentPlayerIdx];
            let dice = player.rollDice();
            const result = this.processPlayerEffects(player, dice);

            // Show all messages
            let statusMsg = "";
            if (result.messages.length) {
                statusMsg += result.messages.join("\n") + "\n";
            }
            statusMsg += `${capitalize(player.color)} rolled a ${result.value}.`;
            document.getElementById("status").innerText = statusMsg;

            this.movePlayerAnimated(player, result.value);
        });
    }

    displayStatus(message) {
        const statusDiv = document.getElementById("status");
        if (statusDiv) {
            statusDiv.innerText = message;
        } else {
            console.log("STATUS:", message);
        }
    }

    movePlayerAnimated(player, steps) {
        document.getElementById("rollBtn").disabled = true;
        this.lastPlayerPositionBefore = player.position;
        this.lastDiceValue = steps;
        this.lastEvents = [];
        this.stepAnimation(player, 0, Math.abs(steps), steps < 0 ? -1 : 1);
    }

    stepAnimation(player, count, total, direction = 1) {
        if (count < total) {
            let oldCell = document.getElementById("cell-" + player.position);
            if (oldCell) {
                let oldCounter = oldCell.querySelector(".counter." + player.color);
                if (oldCounter) oldCounter.remove();
            }

            player.position = Math.max(1, Math.min(player.position + direction, 100));

            let newCell = document.getElementById("cell-" + player.position);
            let counter = document.createElement("div");
            counter.className = "counter " + player.color;
            newCell.appendChild(counter);

            setTimeout(() => this.stepAnimation(player, count + 1, total, direction), 300);
        } else {
            this.resolveBoardEvents(player);
        }
    }

    animateJump(player, target, eventType = null) {
        let oldCell = document.getElementById("cell-" + player.position);
        if (oldCell) {
            let oldCounter = oldCell.querySelector(".counter." + player.color);
            if (oldCounter) oldCounter.remove();
        }

        const from = player.position;
        player.position = target;
        let newCell = document.getElementById("cell-" + player.position);
        let counter = document.createElement("div"); // <-- fixed
        counter.className = "counter " + player.color;
        newCell.appendChild(counter);

        // Log the jump event (ladder or snake)
        this.logTurn({
            player,
            action: "roll",
            dice: this.lastDiceValue,
            from,
            to: target,
            events: eventType ? [eventType] : [],
            powerupUsed: this.lastPowerupUsed || null,
            effectsApplied: player.effects.map(e => e.type)
        });

        this.switchTurn();
    }

    resolveBoardEvents(player) {
        let from = this.lastPlayerPositionBefore;
        let to = player.position;
        if (this.ladders[player.position]) {
            const ladderEnd = this.ladders[player.position];
            document.getElementById("status").innerText =
                `${capitalize(player.color)} climbed a ladder to ${ladderEnd}!`;
            this.animateJump(player, ladderEnd, "ladder"); // <-- PASS "ladder" HERE!
            return;
        } else if (this.snakes[player.position]) {
            const snakeEnd = this.snakes[player.position];
            document.getElementById("status").innerText =
                `Oh no! ${capitalize(player.color)} got bitten by a snake, sliding to ${snakeEnd}`;
            this.animateJump(player, snakeEnd, "snake"); // <-- PASS "snake" HERE!
            return;
        } else if (player.position === 100) {
            document.getElementById("status").innerText =
                `${capitalize(player.color)} wins the game!`;
            this.isGameOver = true; // <-- set game over!
            document.getElementById("rollBtn").disabled = true; // Disable rolling
            this.updateInventoryInteractivity(); // Optionally disables inventory usage
            // Log Win Event
            this.logTurn({
                player,
                action: "roll",
                dice: this.lastDiceValue,
                from,
                to,
                events: ["win"],
                powerupUsed: this.lastPowerupUsed || null,
                effectsApplied: player.effects.map(e => e.type)
            });
            return; // Exit so no further code runs
        } else {
            // Log a normal move (no event)
            this.logTurn({
                player,
                action: "roll",
                dice: this.lastDiceValue,
                from,
                to,
                events: [],
                powerupUsed: this.lastPowerupUsed || null,
                effectsApplied: player.effects.map(e => e.type)
            });
        }
        this.switchTurn();
    }

    switchTurn() {
        if (this.isGameOver) {
            document.getElementById("rollBtn").disabled = true;
            this.updateInventoryInteractivity();
            return;
        }
        this.currentPlayerIdx = (this.currentPlayerIdx + 1) % this.players.length;
        const nextColor = capitalize(this.players[this.currentPlayerIdx].color);
        document.getElementById("status").innerText += ` | ${nextColor}'s turn`;
        document.getElementById("rollBtn").disabled = false;
        this.updateInventoryInteractivity();
    }

    updateInventoryInteractivity() {
        // Disable all slots first
        document.querySelectorAll('.powerup-slot').forEach(slot => {
            slot.style.pointerEvents = 'none';
            slot.style.opacity = '0.5'; // visually dim
        });
        // Enable only current player's slots
        const currentPlayer = this.players[this.currentPlayerIdx];
        document.querySelectorAll(`#player-${currentPlayer.color}-inventory .powerup-slot`).forEach(slot => {
            slot.style.pointerEvents = 'auto';
            slot.style.opacity = '1';
        });
    }

    processPlayerEffects(player, diceValue) {
        let newDiceValue = diceValue;
        let effectsToRemove = [];
        let messages = [];

        for (const effect of player.effects) {
            if (effect.type === "diceCurse") {
                newDiceValue = 1;
                effectsToRemove.push(effect);
                messages.push(`${capitalize(player.color)} is cursed. The next dice roll will be 1.`);
            }
            if (effect.type === "markOfMisfortune") {
                if (newDiceValue % 2 === 0) {
                    document.querySelectorAll(`.counter.${player.color}`).forEach(counter => counter.remove());
                    player.position = moveOneRowDown(player.position);
                    const newCell = document.getElementById("cell-" + player.position);
                    const newCounter = document.createElement("div");
                    newCounter.className = "counter " + player.color;
                    newCell.appendChild(newCounter);
                    messages.push(`${capitalize(player.color)} rolled even and moves down one row!`);
                }
                effectsToRemove.push(effect);
            }
            if (effect.type === "doubleDice") {
                newDiceValue *= 2;
                effectsToRemove.push(effect);
                messages.push(`${capitalize(player.color)}'s roll is doubled to ${newDiceValue}!`);
            }
            if (effect.type === "evenRoll") {
                const evens = [2, 4, 6];
                newDiceValue = evens[Math.floor(Math.random() * evens.length)];
                effectsToRemove.push(effect);
                messages.push(`${capitalize(player.color)}'s roll is changed to an even number: ${newDiceValue}.`);
            }
            if (effect.type === "reverseRoll") {
                newDiceValue = -Math.abs(newDiceValue);
                effectsToRemove.push(effect);
                messages.push(`${capitalize(player.color)}'s roll will move them backwards by ${Math.abs(newDiceValue)} spaces!`);
            }
            if (effect.type === "hermesBoots") {
                newDiceValue += 2;
                effect.duration -= 1;
                messages.push(`${capitalize(player.color)}'s Hermes Boots effect: +2 to dice. Rolled ${diceValue} → ${newDiceValue}.`);
                if (effect.duration <= 0) {
                    effectsToRemove.push(effect);
                }
            }
        }
        player.effects = player.effects.filter(e => !effectsToRemove.includes(e));
        return { value: newDiceValue, messages };
    }

    // --- Board Drawing ---

    drawLadder(start, end) {
        const { x: x1, y: y1 } = getCellCenter(start);
        const { x: x2, y: y2 } = getCellCenter(end);
        const overlay = document.getElementById("overlay");

        const dx = x2 - x1, dy = y2 - y1, length = Math.sqrt(dx * dx + dy * dy);
        const nx = dx / length, ny = dy / length;
        const px = -ny, py = nx, halfWidth = 10;

        // Rails
        for (const sign of [+1, -1]) {
            const rail = document.createElementNS("http://www.w3.org/2000/svg", "line");
            rail.setAttribute("x1", x1 + px * halfWidth * sign);
            rail.setAttribute("y1", y1 + py * halfWidth * sign);
            rail.setAttribute("x2", x2 + px * halfWidth * sign);
            rail.setAttribute("y2", y2 + py * halfWidth * sign);
            rail.setAttribute("stroke", "saddlebrown");
            rail.setAttribute("stroke-width", "4");
            overlay.appendChild(rail);
        }

        // Rungs
        const rungCount = Math.floor(length / 30);
        for (let i = 1; i < rungCount; i++) {
            const t = i / rungCount;
            const rx = x1 + dx * t, ry = y1 + dy * t;
            const rung = document.createElementNS("http://www.w3.org/2000/svg", "line");
            rung.setAttribute("x1", rx - px * halfWidth);
            rung.setAttribute("y1", ry - py * halfWidth);
            rung.setAttribute("x2", rx + px * halfWidth);
            rung.setAttribute("y2", ry + py * halfWidth);
            rung.setAttribute("stroke", "peru");
            rung.setAttribute("stroke-width", "3");
            overlay.appendChild(rung);
        }
    }

    drawSnake(start, end) {
        const { x: x1, y: y1 } = getCellCenter(start);
        const { x: x2, y: y2 } = getCellCenter(end);
        const overlay = document.getElementById("overlay");

        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2 - 30;

        const pathData = `M ${x1} ${y1} Q ${midX} ${midY}, ${x2} ${y2}`;
        const snakeBody = document.createElementNS("http://www.w3.org/2000/svg", "path");
        snakeBody.setAttribute("d", pathData);
        snakeBody.setAttribute("stroke", "green");
        snakeBody.setAttribute("stroke-width", "6");
        snakeBody.setAttribute("fill", "none");
        snakeBody.setAttribute("stroke-linecap", "round");
        overlay.appendChild(snakeBody);

        // Snake head
        const headSize = 10;
        const angle = Math.atan2(y2 - midY, x2 - midX);
        const hx = x2, hy = y2;
        const hx1 = hx - headSize * Math.cos(angle - Math.PI / 6);
        const hy1 = hy - headSize * Math.sin(angle - Math.PI / 6);
        const hx2 = hx - headSize * Math.cos(angle + Math.PI / 6);
        const hy2 = hy - headSize * Math.sin(angle + Math.PI / 6);

        const head = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        head.setAttribute("points", `${hx},${hy} ${hx1},${hy1} ${hx2},${hy2}`);
        head.setAttribute("fill", "red");
        overlay.appendChild(head);
    }

    placePowerupOnBoard(cellNum, type) {
        const cell = document.getElementById(`cell-${cellNum}`);
        if (!cell) return;

        const powerupEle = document.createElement("div");
        powerupEle.className = `powerup-icon ${type}`;
        powerupEle.innerText = this.powerupIcons[type];

        if (type === "legendary") {
            cell.classList.add("legendary-cell");
        }

        cell.appendChild(powerupEle);
    }

    // --- Player Inventory + Powerup Logic ---
    renderPlayerInventories() {
        this.inventoryContainer.innerHTML = "";

        this.players.forEach(player => {
            const inventoryDiv = document.createElement("div");
            inventoryDiv.className = "player-inventory";
            inventoryDiv.id = `player-${player.color}-inventory`;

            const title = document.createElement("h3");
            title.innerText = `${capitalize(player.color)}'s Inventory`;
            inventoryDiv.appendChild(title);

            this.powerupTypes.forEach(type => {
                const typeRow = document.createElement("div");
                typeRow.className = "powerup-type";

                const slot = document.createElement("div");
                slot.className = `powerup-slot ${type}`;
                slot.dataset.type = type;
                slot.dataset.index = 1;

                const powerup = player.inventory[type][0];
                if (powerup) {
                    slot.dataset.filled = true;
                    slot.innerText = powerup.name;
                } else {
                    slot.dataset.filled = "";
                    slot.innerText = "";
                }

                slot.addEventListener("click", () => {
                    if (slot.dataset.filled) {
                        this.usePowerup(this.players[this.currentPlayerIdx], slot);
                    }
                });

                typeRow.appendChild(slot);
                inventoryDiv.appendChild(typeRow);
            });

            this.inventoryContainer.appendChild(inventoryDiv);
        });
    }

    addPowerupToPlayer(player, type, name) {
        const powerup = powerupDefinitions[type].find(p => p.name === name);
        if (powerup && !player.inventory[type].find(p => p.name === name)) {
            player.inventory[type] = [powerup]; // Only one powerup per type
            this.renderPlayerInventories();
            this.updateInventoryInteractivity();
        }
    }

    usePowerup(player, slot) {
        const type = slot.dataset.type;
        const name = slot.innerText;

        // Find the powerup in the player's inventory
        const powerup = player.inventory[type].find(p => p.name === name);
        if (!powerup) return;

        const opponent = this.players.find(p => p !== player);
        powerup.effect(player, opponent, this, powerup.duration);

        // Log the powerup use
        this.logTurn({
            player,
            action: "usePowerup",
            dice: null,
            from: player.position,
            to: player.position,
            events: ["powerup"],
            powerupUsed: powerup.name,
            effectsApplied: player.effects.map(e => e.type)
        });


        slot.innerText = "";
        slot.dataset.filled = false;

        const i = player.inventory[type].indexOf(powerup);
        if (i > -1) player.inventory[type].splice(i, 1);
    }
}

// ===================== Game Initialization =====================

const gameManager = new GameManager();
gameManager.addPlayer(new Player(1, "yellow"));
gameManager.addPlayer(new Player(2, "blue"));
gameManager.startGame();

// ===================== Game History Popup =====================

document.getElementById("show-history-btn").addEventListener("click", function () {
    const historyDiv = document.getElementById("game-history-list");
    if (historyDiv.style.display === "block") {
        historyDiv.style.display = "none";
        return;
    }
    historyDiv.innerHTML = "";
    gameManager.gameHistory.forEach(turn => {
        const line = document.createElement("div");
        line.className = "game-history-entry";
        line.innerHTML = `
            <span>Turn ${turn.turn}: <b>${turn.player}</b> (${turn.action})</span><br>
            <span>Dice: ${turn.dice ?? "-"}, From: ${turn.from}, To: ${turn.to}</span><br>
            <span>
                Events: 
                ${turn.events.length > 0 ? turn.events.map(ev => `<span class="event">${ev}</span>`).join(", ") : "<span style='color:#aaa'>None</span>"}
                ${turn.powerupUsed ? `, <span class="powerup">Powerup: ${turn.powerupUsed}</span>` : ""}
            </span>
        `;
        historyDiv.appendChild(line);
    });
    historyDiv.style.display = "block";
});

// Example: Give starting powerups
gameManager.addPowerupToPlayer(gameManager.players[0], "attack", "Mark of Misfortune");
gameManager.addPowerupToPlayer(gameManager.players[1], "attack", "Dice Curse");
gameManager.addPowerupToPlayer(gameManager.players[1], "movement", "Broken Teleporter");
