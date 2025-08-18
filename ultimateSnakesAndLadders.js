// =======================
// BOARD SETUP
// =======================

// Generate the board cells
const board = document.getElementById("board");
for (let row = 9; row >= 0; row--) {
    let rowCells = [];
    for (let col = 0; col < 10; col++) {
        let number = row * 10 + col + 1;
        rowCells.push(number);
    }
    // Reverse every other row for "snaking" effect
    if (row % 2 === 1) rowCells.reverse();

    rowCells.forEach((num) => {
        const cell = document.createElement("div");
        cell.className = "cell";   // mark as a cell
        cell.id = "cell-" + num;
        cell.innerText = num;

        board.appendChild(cell);
    });
}

// =======================
// GAME LOGIC VARIABLES
// =======================

// Ladders: key = start, value = end
const ladders = {
    4: 14, 9: 31, 20: 38, 28: 84, 40: 59, 63: 81, 71: 91
};

// Snakes: key = start, value = end
const snakes = {
    17: 7, 54: 34, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 99: 78
};

// Players and turn tracking
let players = [
    { id: 1, position: 1, color: "red", effects: [] },
    { id: 2, position: 1, color: "blue", effects: [] }
];
let currentPlayer = 0;

const powerupLocations = {
    attack: [12, 18, 27, 33, 41, 46, 53, 59, 67, 74],
    defence: [13, 21, 29, 37, 44, 50, 56, 63, 70, 78],
    movement: [14, 23, 30, 38, 45, 52, 60, 66, 73, 80],
    chaos: [22, 36, 49, 61, 75, 82, 88, 94],
    legendary: [35, 57, 69, 85, 97]
};

// =======================
// HELPER FUNCTIONS
// =======================

// Capitalize a color string
function capitalizeColor(color) {
    return color.charAt(0).toUpperCase() + color.slice(1);
}

// Roll a six-sided dice
function rollDice(player) {

    let result = Math.floor(Math.random() * 6) + 1;

    // If player has Dice Curse effect, force dice = 1
    if (player.effects.includes("diceCurse")) {
        // effect triggers
        result = 1;
        // remove the curse after applying once
        player.effects = player.effects.filter(e => e !== "diceCurse");
        return result;
    }

    // If the opponent rolls an even number, move the player down by one row
    if (player.effects.includes("markOfMisfortune")) {
        if (result % 2 === 0) {
            player.row -= 1;
        }
        // remove the curse after applying once
        player.effects = player.effects.filter(e => e !== "markOfMisfortune");
    }

    return result;
}

// Get the center coordinates of a board cell
function getCellCenter(num) {
    const cell = document.getElementById("cell-" + num);
    const boardRect = document.getElementById("board").getBoundingClientRect();
    const rect = cell.getBoundingClientRect();

    return {
        x: rect.left - boardRect.left + rect.width / 2,
        y: rect.top - boardRect.top + rect.height / 2
    };
}

function placePowerupOnBoard(cellNum, type) {
    const cell = document.getElementById(`cell-${cellNum}`);
    if (!cell) return;

    const powerupEle = document.createElement("div");
    powerupEle.className = `powerup-icon ${type}`;

    const icons = {
        attack: "⚔️",
        defence: "🛡️",
        movement: "🏃",
        chaos: "☠️",
        legendary: "⭐"
    };

    powerupEle.innerText = icons[type];
    cell.appendChild(powerupEle);
}

// =======================
// PLAYER MOVEMENT FUNCTIONS
// =======================

// Animate player movement across multiple cells
function movePlayerAnimated(player, steps) {
    document.getElementById("rollBtn").disabled = true;
    let moveCount = 0;
    const colorName = capitalizeColor(player.color);

    function step() {
        if (moveCount < steps) {
            // Remove counter from old cell
            let oldCell = document.getElementById("cell-" + player.position);
            if (oldCell) {
                let oldCounter = oldCell.querySelector(".counter." + player.color);
                if (oldCounter) oldCounter.remove();
            }

            // Increment position
            player.position += 1;
            if (player.position > 100) player.position = 100;

            // Place counter in new cell
            let newCell = document.getElementById("cell-" + player.position);
            let counter = document.createElement("div");
            counter.className = "counter " + player.color;
            newCell.appendChild(counter);

            moveCount++;
            setTimeout(step, 300); // Next step after 300ms
        } else {
            // Check for ladders, snakes, or win
            if (ladders[player.position]) {
                const ladderEnd = ladders[player.position];
                document.getElementById("status").innerText =
                    `${colorName} climbed a ladder to ${ladderEnd}!`;
                animateJump(player, ladderEnd);
            } else if (snakes[player.position]) {
                const snakeEnd = snakes[player.position];
                document.getElementById("status").innerText =
                    `Oh no! ${colorName} got bitten by a snake, sliding to ${snakeEnd}`;
                animateJump(player, snakeEnd);
            } else if (player.position === 100) {
                document.getElementById("status").innerText =
                    `${colorName} wins the game!`;
            } else {
                // Switch turn
                currentPlayer = (currentPlayer + 1) % players.length;
                const nextColor = capitalizeColor(players[currentPlayer].color);
                document.getElementById("status").innerText += ` | ${nextColor}'s turn`;
                document.getElementById("rollBtn").disabled = false;
            }
        }
    }

    step(); // Start movement
}

// Handle jumps caused by snakes or ladders
function animateJump(player, target) {
    let oldCell = document.getElementById("cell-" + player.position);
    if (oldCell) {
        let oldCounter = oldCell.querySelector(".counter." + player.color);
        if (oldCounter) oldCounter.remove();
    }

    player.position = target;
    let newCell = document.getElementById("cell-" + player.position);
    let counter = document.createElement("div");
    counter.className = "counter " + player.color;
    newCell.appendChild(counter);

    // Switch turn after jump
    currentPlayer = (currentPlayer + 1) % players.length;
    const nextColor = capitalizeColor(players[currentPlayer].color);
    document.getElementById("status").innerText += ` | ${nextColor}'s turn`;
    document.getElementById("rollBtn").disabled = false;
}

// =======================
// INITIAL PLAYER SETUP
// =======================

// Place player counters on start
players.forEach(player => {
    player.position = 1;
    let startCell = document.getElementById("cell-" + player.position);
    let counter = document.createElement("div");
    counter.className = "counter " + player.color;
    startCell.appendChild(counter);
});

// =======================
// BUTTON EVENTS
// =======================

// Roll dice button
document.getElementById("rollBtn").addEventListener("click", () => {
    let player = players[currentPlayer];
    let dice = rollDice(player);
    const colorName = capitalizeColor(player.color);

    document.getElementById("status").innerText =
        `${colorName} rolled a ${dice}.`;

    movePlayerAnimated(player, dice);
});

// =======================
// SVG OVERLAY FUNCTIONS (SNAKES & LADDERS)
// =======================

// Draw a ladder between two cells
function drawLadder(start, end) {
    const { x: x1, y: y1 } = getCellCenter(start);
    const { x: x2, y: y2 } = getCellCenter(end);
    const overlay = document.getElementById("overlay");

    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);

    const nx = dx / length;
    const ny = dy / length;
    const px = -ny;
    const py = nx;
    const halfWidth = 10;

    const rail1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    rail1.setAttribute("x1", x1 + px * halfWidth);
    rail1.setAttribute("y1", y1 + py * halfWidth);
    rail1.setAttribute("x2", x2 + px * halfWidth);
    rail1.setAttribute("y2", y2 + py * halfWidth);
    rail1.setAttribute("stroke", "saddlebrown");
    rail1.setAttribute("stroke-width", "4");

    const rail2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    rail2.setAttribute("x1", x1 - px * halfWidth);
    rail2.setAttribute("y1", y1 - py * halfWidth);
    rail2.setAttribute("x2", x2 - px * halfWidth);
    rail2.setAttribute("y2", y2 - py * halfWidth);
    rail2.setAttribute("stroke", "saddlebrown");
    rail2.setAttribute("stroke-width", "4");

    overlay.appendChild(rail1);
    overlay.appendChild(rail2);

    const rungCount = Math.floor(length / 30);
    for (let i = 1; i < rungCount; i++) {
        const t = i / rungCount;
        const rx = x1 + dx * t;
        const ry = y1 + dy * t;

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

// Draw a snake between two cells
function drawSnake(start, end) {
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

    const headSize = 10;
    const angle = Math.atan2(y2 - midY, x2 - midX);
    const hx = x2;
    const hy = y2;
    const hx1 = hx - headSize * Math.cos(angle - Math.PI / 6);
    const hy1 = hy - headSize * Math.sin(angle - Math.PI / 6);
    const hx2 = hx - headSize * Math.cos(angle + Math.PI / 6);
    const hy2 = hy - headSize * Math.sin(angle + Math.PI / 6);

    const head = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    head.setAttribute("points", `${hx},${hy} ${hx1},${hy1} ${hx2},${hy2}`);
    head.setAttribute("fill", "red");
    overlay.appendChild(head);
}

// Draw all ladders and snakes
Object.entries(ladders).forEach(([start, end]) => drawLadder(Number(start), end));
Object.entries(snakes).forEach(([start, end]) => drawSnake(Number(start), end));

// Draw all powerups
Object.entries(powerupLocations).forEach(([type, cells]) => {
    cells.forEach(cellNum => {
        placePowerupOnBoard(cellNum, type);

        // Add tint for legendary cells
        if (type === "legendary") {
            const cell = document.getElementById(`cell-${cellNum}`);
            if (cell) {
                cell.classList.add("legendary-cell");
            }
        }
    });
});

// =======================
// PLAYER INVENTORY & POWERUPS
// =======================

const powerupTypes = ["attack", "defence", "chaos", "movement", "legendary"];
const maxSlots = 5;
const playerInventory = {};

let inventoryContainer = document.getElementById("inventory-container");
if (!inventoryContainer) {
    inventoryContainer = document.createElement("div");
    inventoryContainer.id = "inventory-container";
    document.body.appendChild(inventoryContainer);
}

// Generate inventories dynamically
players.forEach(player => {
    if (!playerInventory[player.color]) playerInventory[player.color] = {};

    const inventoryDiv = document.createElement("div");
    inventoryDiv.className = "player-inventory";
    inventoryDiv.id = `player-${player.color}-inventory`;

    const title = document.createElement("h3");
    title.innerText = `${capitalizeColor(player.color)}'s Inventory`;
    inventoryDiv.appendChild(title);

    powerupTypes.forEach(type => {
        playerInventory[player.color][type] = [];

        const typeRow = document.createElement("div");
        typeRow.className = "powerup-type";

        const slot = document.createElement("div");
        slot.className = `powerup-slot ${type}`;
        slot.dataset.type = type;
        slot.dataset.index = 0;
        slot.addEventListener("click", () => {
            if (slot.dataset.filled) {
                usePowerup(players[currentPlayer], slot);
            }
        })
        typeRow.appendChild(slot);

        inventoryDiv.appendChild(typeRow);
    });

    inventoryContainer.appendChild(inventoryDiv);
});

// Add a powerup dynamically to a player's inventory
function addPowerup(player, type, name) {
    const slot = document.querySelector(`#player-${player.color}-inventory .powerup-slot.${type}`);
    if (slot.dataset.filled) {
        console.log(`${capitalizeColor(player.color)} already has a ${type} powerup!`);
        return;
    }
    slot.dataset.filled = true;
    slot.innerText = name;
    playerInventory[player.color][type].push(name);
}


// Function to use powerup
function usePowerup(player, slot) {
    const type = slot.dataset.type;
    const name = slot.innerText;

    // Find the powerup in our list
    const powerup = allPowerups.find(p => p.name === name);
    if (!powerup) return;

    const opponent = players.find(p => p !== player);

    powerup.effect(player, opponent);

    // Remove from inventory (slot is consumed)
    slot.innerText = "";
    slot.dataset.filled = false;

    // Remove from player inventory array by value
    const i = playerInventory[player.color][type].indexOf(name);
    if (i > -1) playerInventory[player.color][type].splice(i, 1);
}


// Array of all powerups grouped by type
const powerupsByType = {
    Attack: [
        {
            name: "Dice Curse", effect: (player, opponent) => {
                opponent.effects.push("diceCurse");
                document.getElementById("status").innerText =
                    `${capitalizeColor(player.color)} used Dice Curse! ${capitalizeColor(opponent.color)}'s next roll will be 1.`;
            }
        },

        {
            name: "Mark of Misfortune", effect: (player, opponent) => {
                opponent.effects.push("markOfMisfortune");
                document.getElementById("status").innerText =
                    `${capitalizeColor(player.color)} used Mark of Misfortune! If the next roll is even, ${capitalizeColor(opponent.color)} will move down one row.`;
            }
        },

        {
            name: "Snake Food", effect: (player, opponent) => {
                opponent.effects.push("snakeFood");
                document.getElementById("status").innerText =
                    `${capitalizeColor(player.color)} used Snake Food! The closest snake is extended by 5 squares back.`;
            }
        },

        {
            name: "Copycat", effect: (player, opponent) => {
                opponent.effects.push("copycat");
                document.getElementById("status").innerText =
                    `${capitalizeColor(player.color)} uses Copycat! If ${capitalizeColor(opponent.color)} used a powerup last turn, this powerup uses that ability.`;
            }
        },

        {
            name: "Theif", effect: (player, opponent) => {
                opponent.effects.push("theif");
                document.getElementById("status").innerText =
                    `${capitalizeColor(player.color)} uses Theif! Randomly choose one of ${capitalizeColor(opponent.color)}'s powerups and use it`;
            }
        },

        {
            name: "Push Forward", effect: (player, opponent) => {
                opponent.effects.push("pushForward");
                document.getElementById("status").innerText =
                    `${capitalizeColor(player.color)} uses Push Forward! Move ${capitalizeColor(opponent.color)} is moved one square forward`;
            }
        },

        {
            name: "Push Backwards", effect: (player, opponent) => {
                opponent.effects.push("pushBackwards");
                document.getElementById("status").innerText =
                    `${capitalizeColor(player.color)} uses Push Backwards! Move ${capitalizeColor(opponent.color)} is moved one square backwards`;
            }
        },

        {
            name: "Power Drain", effect: (player, opponent) => {
                opponent.effects.push("powerDrain");
                document.getElementById("status").innerText =
                    `${capitalizeColor(player.color)} uses Power Drain! One of ${capitalizeColor(opponent.color)}'s powerups is chosen and discarded`;
            }
        },

        {
            name: "Ladder Breaker", effect: (player, opponent) => {
                opponent.effects.push("ladderBreak");
                document.getElementById("status").innerText =
                    `${capitalizeColor(player.color)} uses Ladder Breaker! The closest ladder is broken for the rest of the game.`;
            }
        },
    ],
};

addPowerup(players[0], "attack", "Mark of Misfortune");
addPowerup(players[1], "attack", "Dice Curse");