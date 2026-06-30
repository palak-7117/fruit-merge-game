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
            debug: true // Keeps the bounding boxes visible for now
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

// Global variables to track game objects
let ground;
let currentFruit = null; 
let fruitsGroup; // A group to hold all dropped fruits

function preload() {
    // Assets loading placeholder
}

function create() {
    console.log("Controls setup started.");

    // 1. Create the floor platform
    ground = this.add.rectangle(225, 680, 450, 40, 0x2c3e50);
    this.physics.add.existing(ground, true);

    // 2. Create a physics group to hold all the dropped fruits.
    // This makes it easy to handle collisions for all fruits at once.
    fruitsGroup = this.physics.add.group();

    // Tell Phaser that any fruit inside the fruitsGroup should bump into the ground
    this.physics.add.collider(fruitsGroup, ground);
    
    // Tell Phaser that fruits inside the fruitsGroup should bump into EACH OTHER
    this.physics.add.collider(fruitsGroup, fruitsGroup);

    // 3. Spawn our very first controllable fruit
    spawnNewFruit.call(this);

    // 4. Listen for mouse/touch clicks anywhere on the screen
    this.input.on('pointerdown', (pointer) => {
        if (currentFruit) {
            // Drop the fruit by turning gravity back on!
            currentFruit.body.setAllowGravity(true);
            
            // Add it to our group so it can collide with other objects
            fruitsGroup.add(currentFruit);
            
            // Disconnect it from our controls variable so it stays on the ground
            currentFruit = null;

            // Wait 1 second, then spawn the next fruit at the top
            this.time.delayedCall(1000, spawnNewFruit, [], this);
        }
    });
}

function update() {
    // 5. Every frame, if a player is holding a fruit, make it follow the mouse pointer
    if (currentFruit) {
        let pointerX = this.input.activePointer.x;
        
        // Keep the fruit inside the walls (boundaries) of our 450px wide board
        if (pointerX < 20) pointerX = 20;
        if (pointerX > 430) pointerX = 430;

        currentFruit.x = pointerX;
    }
}

// Custom function to create a new fruit at the top of the screen
function spawnNewFruit() {
    // Spawn a red circle at y=50 (near the top)
    let newFruit = this.add.circle(225, 50, 20, 0xe74c3c);
    
    // Give it physics
    this.physics.add.existing(newFruit);
    
    // CRUCIAL: Turn off gravity temporarily so it floats at the top while aiming
    newFruit.body.setAllowGravity(false);
    
    newFruit.body.setBounce(0.2);
    newFruit.body.setCollideWorldBounds(true);

    // Set this new circle as our active, controllable fruit
    currentFruit = newFruit;
}