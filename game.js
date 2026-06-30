const config = {
    type: Phaser.AUTO,
    width: 450,
    height: 700,
    parent: 'game-container',
    backgroundColor: '#ecf0f1',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 600 },
            debug: true // Change to false later to hide outlines
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let ground;
let currentFruit = null; 
let fruitsGroup;
let score = 0;
let scoreText;

// Define our fruit tier list (sizes, colors, and upgrade paths)
const FRUIT_TYPES = [
    { id: 0, radius: 15, color: 0xe74c3c }, // 0: Cherry (Small Red)
    { id: 1, radius: 25, color: 0xff7675 }, // 1: Strawberry (Medium Pink)
    { id: 2, radius: 40, color: 0x9b59b6 }, // 2: Grape (Large Purple)
    { id: 3, radius: 60, color: 0xf1c40f }  // 3: Lemon (Giant Yellow)
];

function preload() {}

function create() {
    console.log("Merge systems active.");

    // 1. Score display
    scoreText = this.add.text(20, 20, 'Score: 0', { fontSize: '24px', fill: '#2c3e50', fontFamily: 'Arial' });

    ground = this.add.rectangle(225, 680, 450, 40, 0x2c3e50);
    this.physics.add.existing(ground, true);

    fruitsGroup = this.physics.add.group();

    this.physics.add.collider(fruitsGroup, ground);
    
    // 2. This is where the magic happens. When two fruits touch, run 'handleMerge'
    this.physics.add.collider(fruitsGroup, fruitsGroup, handleMerge, null, this);

    spawnNewFruit.call(this);

    this.input.on('pointerdown', (pointer) => {
        if (currentFruit) {
            currentFruit.body.setAllowGravity(true);
            fruitsGroup.add(currentFruit);
            currentFruit = null;
            this.time.delayedCall(800, spawnNewFruit, [], this);
        }
    });
}

function update() {
    if (currentFruit) {
        let pointerX = this.input.activePointer.x;
        let radius = currentFruit.displayOriginX; // dynamic boundary check based on fruit size
        if (pointerX < radius) pointerX = radius;
        if (pointerX > 450 - radius) pointerX = 450 - radius;
        currentFruit.x = pointerX;
    }
}

function spawnNewFruit() {
    // Drop only small fruits (ID 0 or ID 1) to keep the game fair
    let randomType = FRUIT_TYPES[Math.floor(Math.random() * 2)];
    
    currentFruit = createFruitObject.call(this, 225, 50, randomType);
    currentFruit.body.setAllowGravity(false);
}

// Helper function to build a fruit object with its specific properties
function createFruitObject(x, y, typeData) {
    let fruit = this.add.circle(x, y, typeData.radius, typeData.color);
    this.physics.add.existing(fruit);
    
    fruit.body.setBounce(0.2);
    fruit.body.setCollideWorldBounds(true);
    
    // Save custom properties inside the object so we can read them later
    fruit.fruitId = typeData.id;
    
    return fruit;
}

// The core algorithm of your game
function handleMerge(fruit1, fruit2) {
    // Rule 1: Check if they are the exact same type of fruit
    // Rule 2: Check to ensure they haven't already been marked for deletion
    if (fruit1.fruitId === fruit2.fruitId && fruit1.active && fruit2.active) {
        
        let currentId = fruit1.fruitId;
        let nextId = currentId + 1;

        // Calculate mid-point position between the two fruits to spawn the upgraded one
        let newX = (fruit1.x + fruit2.x) / 2;
        let newY = (fruit1.y + fruit2.y) / 2;

        // Destroy both old fruits safely
        fruit1.destroy();
        fruit2.destroy();

        // Update score
        score += (currentId + 1) * 10;
        scoreText.setText('Score: ' + score);

        // If there's a bigger fruit available in our tier list, spawn it!
        if (nextId < FRUIT_TYPES.length) {
            let nextFruitType = FRUIT_TYPES[nextId];
            let upgradedFruit = createFruitObject.call(this, newX, newY, nextFruitType);
            
            // Add the new fruit immediately to our physics group
            fruitsGroup.add(upgradedFruit);
        }
    }
}