// ---------------------------------------------------------
// FRUIT MERGE GAME (9-TIER DIFF PROFILE WITH BLUEBERRY)
// Built with Phaser 3 + Matter.js physics
// ---------------------------------------------------------

// Added Blueberry at Tier 0. Shifted all other fruits up by 1 tier.
const FRUITS = [
  { tier: 0, name: "Blueberry",  radius: 11, color: 0x1a237e, score: 1 },  // New Tier 0
  { tier: 1, name: "Cherry",     radius: 16, color: 0xe53935, score: 2 },  
  { tier: 2, name: "Strawberry", radius: 20, color: 0xff5c8a, score: 4 }, 
  { tier: 3, name: "Grape",      radius: 29, color: 0x8e24aa, score: 7 }, 
  { tier: 4, name: "Orange",     radius: 40, color: 0xfb8c00, score: 11 }, 
  { tier: 5, name: "Peach",      radius: 65, color: 0xffab91, score: 16 }, 
  { tier: 6, name: "Coconut",    radius: 95, color: 0x5d4037, score: 26 }, 
  { tier: 7, name: "Pineapple",  radius: 124, color: 0xfbc02d, score: 41 }, 
  { tier: 8, name: "Watermelon", radius: 150, color: 0x2e7d32, score: 65 }, 
];

const GAME_WIDTH = 480;
const GAME_HEIGHT = 640;
const WALL_THICKNESS = 20;
const DROP_Y = 70;              
const GAME_OVER_LINE_Y = 110;   
const GAME_OVER_GRACE_MS = 1500; 

let score = 0;
let nextFruitTier = randomDropTier();
let canDrop = true;
let gameOver = false;
let aboveLineSince = null;

function randomDropTier() {
  // Players can drop the first 4 fruits: Blueberry, Cherry, Strawberry, or Grape.
  return Phaser.Math.Between(0, 3);
}

class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
  }

  preload() {
    FRUITS.forEach((fruit) => {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      const d = fruit.radius * 2;
      g.fillStyle(fruit.color, 1);
      g.fillCircle(fruit.radius, fruit.radius, fruit.radius);
      g.lineStyle(3, 0x000000, 0.15);
      g.strokeCircle(fruit.radius, fruit.radius, fruit.radius);
      g.generateTexture(`fruit-${fruit.tier}`, d, d);
      g.destroy();
    });
  }

  create() {
    this.matter.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.matter.add.rectangle(-WALL_THICKNESS / 2, GAME_HEIGHT / 2, WALL_THICKNESS, GAME_HEIGHT, { isStatic: true });
    this.matter.add.rectangle(GAME_WIDTH + WALL_THICKNESS / 2, GAME_HEIGHT / 2, WALL_THICKNESS, GAME_HEIGHT, { isStatic: true });
    this.matter.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT + WALL_THICKNESS / 2, GAME_WIDTH, WALL_THICKNESS, { isStatic: true });

    this.lineGraphic = this.add.graphics();
    this.lineGraphic.lineStyle(2, 0xff5252, 0.6);
    this.lineGraphic.lineBetween(0, GAME_OVER_LINE_Y, GAME_WIDTH, GAME_OVER_LINE_Y);

    this.previewX = GAME_WIDTH / 2;
    this.previewSprite = this.add.image(this.previewX, DROP_Y, `fruit-${nextFruitTier}`);
    this.updateNextFruitUI();

    this.input.on("pointermove", (pointer) => {
      if (gameOver) return;
      const fruit = FRUITS[nextFruitTier];
      const minX = fruit.radius + 4;
      const maxX = GAME_WIDTH - fruit.radius - 4;
      this.previewX = Phaser.Math.Clamp(pointer.x, minX, maxX);
      this.previewSprite.x = this.previewX;
    });

    this.input.on("pointerdown", () => {
      if (gameOver) return;
      this.dropFruit();
    });

    this.pendingMerges = [];
    this.matter.world.on("collisionstart", (event) => {
      event.pairs.forEach((pair) => this.queueMerge(pair));
    });

    document.getElementById("restart-btn").addEventListener("click", () => {
      this.restartGame();
    });
  }

  dropFruit() {
    if (!canDrop) return;
    canDrop = false;

    const tier = nextFruitTier;
    const fruit = FRUITS[tier];
    const body = this.matter.add.image(this.previewX, DROP_Y, `fruit-${tier}`);
    body.setCircle(fruit.radius);
    body.setBounce(0.12); 
    body.setFriction(0.3);
    body.setFrictionAir(0.001);
    body.setData("tier", tier);
    body.setData("merging", false);
    body.setData("droppedAt", this.time.now);

    nextFruitTier = randomDropTier();
    this.previewSprite.setTexture(`fruit-${nextFruitTier}`);
    this.updateNextFruitUI();

    this.time.delayedCall(450, () => {
      canDrop = true;
    });
  }

  queueMerge(pair) {
    const a = pair.bodyA.gameObject;
    const b = pair.bodyB.gameObject;
    if (!a || !b) return;
    if (!a.getData || !b.getData) return;
    if (!a.active || !b.active) return; 

    const tierA = a.getData("tier");
    const tierB = b.getData("tier");
    if (tierA === undefined || tierB === undefined) return;
    if (tierA !== tierB) return;
    if (a.getData("merging") || b.getData("merging")) return;

    a.setData("merging", true);
    b.setData("merging", true);

    this.pendingMerges.push({ a, b, tier: tierA });
  }

  processPendingMerges() {
    if (!this.pendingMerges || this.pendingMerges.length === 0) return;

    const merges = this.pendingMerges;
    this.pendingMerges = [];

    merges.forEach(({ a, b, tier }) => {
      if (!a.active || !b.active) return;

      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      const fruitData = FRUITS[tier];

      score += fruitData.score;

      a.destroy();
      b.destroy();

      // Automatically adapts to checking the last index dynamically
      const isMaxTier = (tier === FRUITS.length - 1);

      if (!isMaxTier) {
        const newTier = tier + 1;
        const newFruit = FRUITS[newTier];
        const merged = this.matter.add.image(midX, midY, `fruit-${newTier}`);
        merged.setCircle(newFruit.radius);
        merged.setBounce(0.12);
        merged.setFriction(0.3);
        merged.setFrictionAir(0.001);
        merged.setData("tier", newTier);
        merged.setData("merging", false);
        merged.setData("droppedAt", this.time.now);
        merged.setScale(1);
        merged.setVelocity(0, 0);
        merged.setAngularVelocity(0);
      } else {
        score += 150; 
        console.log("Two giant Watermelons popped!");
      }
    });

    this.updateScoreUI();
  }

  updateScoreUI() {
    document.getElementById("score-value").textContent = score;
  }

  updateNextFruitUI() {
    document.getElementById("next-fruit-label").textContent = FRUITS[nextFruitTier].name;
  }

  checkGameOver() {
    if (gameOver) return;

    const bodies = this.matter.world.localWorld.bodies;
    let someoneAboveLine = false;

    bodies.forEach((body) => {
      if (body.isStatic || !body.gameObject) return;
      const go = body.gameObject;
      const age = this.time.now - (go.getData("droppedAt") || 0);
      if (age < 700) return;

      const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
      if (speed > 0.3) return;

      if (go.y - go.getData("tier") >= 0 && go.y < GAME_OVER_LINE_Y) {
        someoneAboveLine = true;
      }
    });

    if (someoneAboveLine) {
      if (aboveLineSince === null) {
        aboveLineSince = this.time.now;
      } else if (this.time.now - aboveLineSince > GAME_OVER_GRACE_MS) {
        this.triggerGameOver();
      }
    } else {
      aboveLineSince = null;
    }
  }

  triggerGameOver() {
    gameOver = true;
    document.getElementById("final-score").textContent = score;
    document.getElementById("game-over-screen").classList.remove("hidden");
  }

  restartGame() {
    score = 0;
    nextFruitTier = randomDropTier();
    canDrop = true;
    gameOver = false;
    aboveLineSince = null;
    this.updateScoreUI();
    document.getElementById("game-over-screen").classList.add("hidden");
    this.scene.restart();
  }

  update() {
    this.processPendingMerges();
    if (!gameOver) {
      this.checkGameOver();
    }
  }
}

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: "phaser-game",
  backgroundColor: "#fff3df",
  physics: {
    default: "matter",
    matter: {
      gravity: { y: 1 },
      debug: false,
    },
  },
  scene: [MainScene],
};

new Phaser.Game(config);