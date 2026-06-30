// This tells Phaser how to set up our game window
const config = {
    type: Phaser.AUTO,
    width: 450,
    height: 700,
    parent: 'game-container',
    backgroundColor: '#ecf0f1', // Light grey game board
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// Start the actual game engine
const game = new Phaser.Game(config);

function preload() {
    // This runs once at the very start to load images/sounds
    console.log("Game is loading assets...");
}

function create() {
    // This runs once right after loading finishes to setup objects
    console.log("Game is starting!");
    
    // Let's draw a simple text on the screen to confirm it works
    this.add.text(100, 300, "Let's Fruit Merge!", { 
        fontSize: '32px', 
        fill: '#2c3e50',
        fontFamily: 'Arial'
    });
}

function update() {
    // This runs 60 times a second. It's the heartbeat of our game loop.
}