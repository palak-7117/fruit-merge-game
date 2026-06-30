// This tells Phaser how to set up our game window and systems
const config = {
    type: Phaser.AUTO,
    width: 450,
    height: 700,
    parent: 'game-container',
    backgroundColor: '#ecf0f1', // Light grey game board
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 600 }, // Forces objects to fall downward
            debug: true         // Draws outlines around objects so we can see collision shapes
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// Start the game engine
const game = new Phaser.Game(config);

function preload() {
    // We will load images here later
}

function create() {
    console.log("Game started with physics!");

    // 1. Create a static ground so things don't fall off the screen forever
    // Parameters: (x, y, width, height, color)
    let ground = this.add.rectangle(225, 680, 450, 40, 0x2c3e50);
    
    // Tell Phaser this ground should have physics, but it shouldn't move when hit (static)
    this.physics.add.existing(ground, true);

    // 2. Create a test "fruit" (just a placeholder circle for now)
    // Parameters: (x, y, radius, color)
    let testFruit = this.add.circle(225, 100, 20, 0xe74c3c);
    
    // Tell Phaser this fruit has dynamic physics (it responds to gravity)
    this.physics.add.existing(testFruit);

    // 3. Make the fruit bounce a little bit when it hits the ground
    testFruit.body.setBounce(0.3);
    
    // 4. Make the fruit collide with the screen boundaries (left, right, top)
    testFruit.body.setCollideWorldBounds(true);

    // 5. Tell the physics engine to make the fruit and the ground bump into each other
    this.physics.add.collider(testFruit, ground);
}

function update() {
    // Smooth frame updates go here
}