/*
 * //==============================================\\
 * || Project: WATOR Simulation Extended           ||
 * || Authors: Eberhard Felix, Kapferer Werner     ||
 * || Date:    12.11.2016                          ||
 * \\==============================================//
 */
// start vs code task: ctrl+shift+b
// variables
var fieldWidth = 50;
var fieldHeight = 50;
var pixelSize = 10;
var field;
var randomField;
var randomNeighbour;
var colorArray;
var fishCycles = 0;
var sharksCycles = 0;
var canvas;
var ctx;
var default_config = {
    // colors
    waterColor: "#0000FF",
    fishColor: "#FFFFFF",
    sharkColor: "#FF0000",
    // fish
    fishStartPopulation: 5000,
    fishEnergy: 1,
    fishBreedingRate: 10,
    fishSize: 1,
    fishEatProbability: 0.5,
    //shark
    sharkStartPopulation: 100,
    sharkStartEnergy: 25,
    sharkBreedingRate: 15,
    sharkSize: 5,
    // general
    fps: 100,
    maxDepth: 10,
    globalReproduction: false,
    c0: 1,
    c1: 1,
    c2: 1
};
var config = default_config;
class Cell {
    constructor(col, row) {
        this.col = col;
        this.row = row;
        this.fish = [];
        this.sharks = [];
        this.depth = config.maxDepth;
    }
    get color() {
        return colorArray[this.fish.length][this.sharks.length];
    }
    get spaceUsed() {
        return this.fish.length * config.fishSize + this.sharks.length * config.sharkSize;
    }
    canAddFish() {
        return this.spaceUsed + config.fishSize <= this.depth;
    }
    addFish(fish) {
        if (this.canAddFish()) {
            this.fish.push(fish);
            return true;
        }
        return false;
    }
    canAddShark() {
        // if there are no other sharks, we always fit (eating fish)
        if (this.sharks.length == 0)
            return true;
        return this.spaceUsed + config.sharkSize <= this.depth;
    }
    addShark(shark) {
        if (this.canAddShark()) {
            this.sharks.push(shark);
            return true;
        }
        return false;
    }
    setMoved(moved) {
        this.fish.forEach(fish => fish.moved = moved);
        this.sharks.forEach(shark => shark.moved = moved);
    }
}
class Animal {
}
class Fish extends Animal {
    constructor(age = 0) {
        super();
        this.age = age;
        this.moved = true;
    }
}
class Shark extends Animal {
    constructor(energy, age = 0) {
        super();
        this.energy = energy;
        this.age = age;
        this.age = age;
        this.moved = true;
        this.energy = energy;
    }
}
function initColors() {
    //               fish
    //           0 1 2 3 4 5
    //          ------------
    // shark 0 | b         w
    //       1 | r
    // b = blue, r = reat, w = white
    // blend values in between
    // shark:0, fish:1 = 20% white, 2: 40%, 3: 60%, 4: 80%, 5: 100%
    var maxFish = Math.floor(config.maxDepth / config.fishSize);
    var maxSharks = Math.floor(config.maxDepth / config.sharkSize);
    colorArray = new Array(maxFish + 1);
    for (var i = 0; i < maxFish + 1; i++) {
        colorArray[i] = new Array(maxSharks + 1);
        var fishPercent = i / maxFish;
        for (var j = 0; i * config.fishSize + j * config.sharkSize <= config.maxDepth; j++) {
            var sharkPercent = j / maxSharks;
            var animalColor = shadeBlendConvert(fishPercent + sharkPercent > 0 ? fishPercent / (fishPercent + sharkPercent) : 0, config.sharkColor, config.fishColor);
            var cellColor = shadeBlendConvert(fishPercent + sharkPercent, config.waterColor, animalColor);
            colorArray[i][j] = cellColor;
        }
    }
}
var pauseFlag = false;
var startCount = 0; // increase after every press on start button to check if the current loop has to be canceled
function gameloop(currentStartCount) {
    setTimeout(function () {
        if (pauseFlag || currentStartCount != startCount) {
            return;
        }
        requestAnimationFrame(gameloop.bind(this, currentStartCount));
        updateField();
        drawClearField();
        drawField();
        // update statistics
        var nFish = 0;
        var nSharks = 0;
        for (var i = 0; i < field.length; i++) {
            for (var j = 0; j < field[i].length; j++) {
                nFish += field[i][j].fish.length;
                nSharks += field[i][j].sharks.length;
            }
        }
        setHtmlInputValue('nFish', nFish);
        setHtmlInputValue('nSharks', nSharks);
    }, 1000 / config.fps);
}
function init() {
    fishCycles = Math.floor(Math.random() * config.fishBreedingRate);
    sharksCycles = Math.floor(Math.random() * config.sharkBreedingRate);
    field = new Array(fieldWidth);
    for (var i = 0; i < fieldWidth; i++) {
        field[i] = new Array(fieldHeight);
        for (var j = 0; j < fieldHeight; j++) {
            field[i][j] = new Cell(i, j);
        }
    }
    randomField = new Array(fieldWidth * fieldHeight);
    for (var i = 0; i < fieldWidth * fieldHeight; i++) {
        randomField[i] = i;
    }
    //     0 1 2
    //     _____
    // 0 | 0 1 2
    // 1 | 3 4 5
    // 2 | 6 7 8
    randomNeighbour = [1, 3, 4, 5, 7];
    canvas = document.getElementById("my-canvas");
    ctx = canvas.getContext("2d");
    canvas.width = fieldWidth * pixelSize;
    canvas.height = fieldHeight * pixelSize;
    initColors();
}
function initRandomValues(field) {
    // check params
    if ((config.fishStartPopulation * config.fishSize) + (config.sharkStartPopulation * config.sharkSize) >= fieldHeight * fieldWidth * config.maxDepth) {
        alert("To many fish/sharks. Check 'fishStartPopulation', 'sharkStartPopulation', 'fishSize' and 'sharkSize'!");
        return;
    }
    for (var i = 0; i < config.fishStartPopulation; i++) {
        var x = Math.floor(Math.random() * fieldWidth);
        var y = Math.floor(Math.random() * fieldHeight);
        if (!field[x][y].addFish(new Fish(Math.round(Math.random() * config.fishBreedingRate)))) {
            i--;
        }
    }
    for (var i = 0; i < config.sharkStartPopulation; i++) {
        var x = Math.floor(Math.random() * fieldWidth);
        var y = Math.floor(Math.random() * fieldHeight);
        if (!field[x][y].addShark(new Shark(config.sharkStartEnergy, Math.round(Math.random() * config.sharkBreedingRate)))) {
            i--;
        }
    }
}
function randomizeArray(field) {
    // Fisher-Yates shuffle https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
    for (var i = 0; i < field.length; i++) {
        var j = Math.round(Math.random() * i);
        var temp = field[i];
        field[i] = field[j];
        field[j] = temp;
    }
    return field;
}
function getCellScoreFish(cell) {
    // consider: c3 * nFish - c4 * nSharks
    // also consider if there is room in that cell
    if (!cell.canAddFish())
        return -1;
    // score = c1 * nFish - c2 * nSharks
    return config.c1 * cell.fish.length - config.c2 * cell.sharks.length;
}
function getCellScoreShark(cell) {
    // consider: c2 * nFish + (probably) c1 * qBlood
    // also consider if there is room in that cell
    // exception: shark can eat fish in a cell so he can also move to a cell if there are a lot of fish there.
    // (also consider sharks that are already in that cell cause they cant be eaten)
    // probability that he eats fish in that cell increases
    if (!cell.canAddShark())
        return -1;
    // score = c0 * nFish = nFish
    return cell.fish.length;
}
// get best neighbouring cell for the animal to move (can also be the cell he is currently in)
function getBestCell(field, x, y, scoreFunction) {
    //     0 1 2
    //     _____
    // 0 | 0 1 2
    // 1 | 3 4 5
    // 2 | 6 7 8
    var neighbourCells = [1, 3, 5, 7]; // top, left, right, bottom
    neighbourCells = randomizeArray(neighbourCells);
    var bestNeighbour = field[x][y];
    var bestScore = scoreFunction(bestNeighbour);
    for (var i = 0; i < neighbourCells.length; i++) {
        var n = neighbourCells[i];
        var nx = Math.floor(n / 3);
        var ny = n % 3;
        var rx = (nx - 1 + x + fieldWidth) % fieldWidth;
        var ry = (ny - 1 + y + fieldHeight) % fieldHeight;
        var cell = field[rx][ry];
        var score = scoreFunction(cell);
        if (score > bestScore || (score === bestScore && Math.random() > 0.5)) {
            bestScore = score;
            bestNeighbour = cell;
        }
    }
    return bestNeighbour;
}
function getBestCellFish(field, x, y) {
    return getBestCell(field, x, y, this.getCellScoreFish);
}
function getBestCellShark(field, x, y) {
    return getBestCell(field, x, y, this.getCellScoreShark);
}
function transition(field, x, y) {
    var cell = field[x][y];
    // =========================
    // Fish
    // =========================
    var fishCount = cell.fish.length;
    for (var i = 0; i < fishCount; i++) {
        var fish = cell.fish[i];
        if (fish.moved === true) {
            continue;
        }
        fish.moved = true;
        fish.age++;
        var bestCell = getBestCellFish(field, x, y);
        if (bestCell != cell) {
            if (bestCell.addFish(fish)) {
                cell.fish.splice(i, 1); // remove from current cell
                i--;
                fishCount--;
            }
        }
        // check for reproduction depending on mode (global or local age)
        var fishReproduction = false;
        if (config.globalReproduction) {
            if (fishCycles >= config.fishBreedingRate)
                fishReproduction = true;
        }
        else {
            if (fish.age >= config.fishBreedingRate)
                fishReproduction = true;
        }
        if (fishReproduction) {
            var childFish = new Fish();
            if (bestCell.addFish(childFish)) {
                fish.age -= config.fishBreedingRate;
            }
            else if (cell.addFish(childFish)) {
                fish.age -= config.fishBreedingRate;
            }
        }
    }
    // =========================
    // Shark
    // =========================
    var sharkCount = cell.sharks.length;
    for (var i = 0; i < sharkCount; i++) {
        var shark = cell.sharks[i];
        if (shark.moved === true) {
            continue;
        }
        shark.moved = true;
        shark.age++;
        shark.energy--;
        var bestCell = getBestCellShark(field, x, y);
        if (bestCell != cell) {
            if (bestCell.addShark(shark)) {
                cell.sharks.splice(i, 1); // remove from current cell
                i--;
                sharkCount--;
            }
        }
        var eatFish = false;
        if (bestCell.fish.length > 0) {
            for (var j = 0; j < bestCell.fish.length; j++) {
                if (eatFish)
                    break;
                if (Math.random() < config.fishEatProbability) {
                    shark.energy += config.fishEnergy;
                    bestCell.fish.splice(j, 1);
                    j--;
                    eatFish = true;
                }
            }
        }
        // check for reproduction depending on mode (global or local age)
        var sharkReproduction = false;
        if (config.globalReproduction) {
            if (sharksCycles >= config.sharkBreedingRate)
                sharkReproduction = true;
        }
        else {
            if (shark.age >= config.sharkBreedingRate)
                sharkReproduction = true;
        }
        if (shark.energy <= 0) {
            bestCell.sharks.splice(i, 1); // remove from current cell
            if (bestCell == cell) {
                i--;
                sharkCount--;
            }
        }
        else if (sharkReproduction) {
            // TODO enhance reproduce
            // only reproduce if there is room or eat fish in cell to make room
            // otherwise wait for next iteration without changing the 
            // probably split energy of shark in half and give the other half to its child
            var childShark = new Shark(shark.energy / 2);
            if (bestCell.addShark(childShark)) {
                shark.age -= config.sharkBreedingRate;
                shark.energy /= 2;
            }
            else if (cell.addShark(childShark)) {
                shark.age -= config.sharkBreedingRate;
                shark.energy /= 2;
            }
        }
    }
}
function updateField() {
    fishCycles++;
    sharksCycles++;
    randomField = randomizeArray(randomField);
    for (var i = 0; i < randomField.length; i++) {
        var n = randomField[i];
        var x = Math.floor(n / fieldWidth);
        var y = n % fieldWidth;
        transition(field, x, y);
    }
    // reset moved flag
    for (var i = 0; i < fieldWidth; i++) {
        for (var j = 0; j < fieldHeight; j++) {
            if (field[i][j] != null) {
                field[i][j].setMoved(false);
            }
        }
    }
    // reset cycles if needed
    if (fishCycles >= config.fishBreedingRate) {
        fishCycles = 0;
    }
    if (sharksCycles >= config.sharkBreedingRate) {
        sharksCycles = 0;
    }
}
function drawClearField() {
    // draw water
    ctx.fillStyle = config.waterColor;
    ctx.fillRect(0, 0, fieldWidth * pixelSize, fieldHeight * pixelSize);
}
function drawField() {
    ctx.fillStyle = config.fishColor;
    for (var i = 0; i < fieldWidth; i++) {
        for (var j = 0; j < fieldHeight; j++) {
            ctx.fillStyle = field[i][j].color;
            ctx.fillRect(i * pixelSize, j * pixelSize, pixelSize, pixelSize);
        }
    }
}
function getValueFromHMTLInput(id) {
    var input = document.getElementById(id);
    if (input == null)
        return null;
    if (input.type == "checkbox")
        return input.checked;
    else if (input.type == "number")
        return input.valueAsNumber;
    else
        return input.value;
}
function setHtmlInputValue(id, val) {
    var input = document.getElementById(id);
    if (input != null) {
        if (input.type == "checkbox")
            input.checked = val == '1' ? true : false;
        else
            input.value = val;
    }
}
// fill the configuration inputs on the html page
function fillHtmlInputs() {
    Object.keys(config).forEach(function (key, index) {
        setHtmlInputValue(key, config[key]);
    });
}
function readConfigurationValues() {
    Object.keys(config).forEach(function (key, index) {
        var val = getValueFromHMTLInput(key);
        if (val != null) {
            config[key] = val;
        }
    });
}
function changeFps() {
    config.fps = getValueFromHMTLInput('fps');
    setHtmlInputValue('fpsNumber', config.fps);
}
function restoreDefaultConfig() {
    config = default_config;
    fillHtmlInputs();
}
function startSimulation() {
    pauseFlag = false;
    readConfigurationValues();
    init();
    initRandomValues(field);
    startCount++;
    gameloop(startCount);
    startButton.value = "Restart simulation";
    pauseButton.style.display = "inline-block";
    resumeButton.style.display = "none";
}
function pauseSimulation() {
    pauseFlag = true;
    pauseButton.style.display = "none";
    resumeButton.style.display = "inline-block";
}
function resumeSimulation() {
    pauseFlag = false;
    pauseButton.style.display = "inline-block";
    resumeButton.style.display = "none";
    requestAnimationFrame(gameloop.bind(this, startCount));
}
var startButton;
var pauseButton;
var resumeButton;
window.onload = function () {
    fillHtmlInputs();
    startButton = document.getElementById("btn-start-simulation");
    pauseButton = document.getElementById("btn-pause-simulation");
    resumeButton = document.getElementById("btn-resume-simulation");
};
//# sourceMappingURL=main.js.map