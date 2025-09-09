const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Timer
let startTime = Date.now();
let elapsedTime = 0;
let seconds = 0;

// Game states: "Starting", "Playing", "Paused", "Dead"
let gameState = "Starting";

// Player
let x = 100;
let y = 100;
const size = 20;
let speedX = 7;
let speedY = 7;

// Deaths
let deathCount = 0;

// Enemies
let initialEnemies = [
  // Crosses
  { x: 200, y: 100, size: 50, speedX: 5, speedY: 5 },
  { x: 300, y: 100, size: 50, speedX: 5, speedY: 5 },
  { x: 100, y: 200, size: 50, speedX: 5, speedY: 5 },
  { x: 100, y: 300, size: 50, speedX: 5, speedY: 5 },
  { x: 100, y: 400, size: 50, speedX: 5, speedY: 5 },
  { x: 400, y: 100, size: 50, speedX: 5, speedY: 5 },
  // Speedy ones
  { x: 500, y: 500, size: 30, speedX: 10, speedY: 10 },
  { x: 600, y: 600, size: 30, speedX: 10, speedY: 10 },
  { x: 700, y: 700, size: 30, speedX: 10, speedY: 10 },
  { x: 500, y: 500, size: 30, speedX: -10, speedY: -10 },
  { x: 600, y: 600, size: 30, speedX: -10, speedY: -10 },
  { x: 700, y: 700, size: 30, speedX: -10, speedY: -10 },
  // Slow ones
  { x: 500, y: 500, size: 100, speedX: 0, speedY: 2 },
  { x: 500, y: 500, size: 100, speedX: 2, speedY: 0 },
  { x: 500, y: 600, size: 100, speedX: 0, speedY: 2 },
  { x: 600, y: 500, size: 100, speedX: 2, speedY: 0 },
  { x: 900, y: 500, size: 100, speedX: 0, speedY: 2 },
  { x: 900, y: 600, size: 100, speedX: 0, speedY: 2 },
  { x: 500, y: 100, size: 100, speedX: 2, speedY: 0 },
  { x: 600, y: 100, size: 100, speedX: 2, speedY: 0 },
];
let enemies = JSON.parse(JSON.stringify(initialEnemies));

// Coins
const coinSize = 10;
let collectedCoins = 0;
let coinX = getRandomInt(canvas.width - coinSize);
let coinY = getRandomInt(canvas.height - coinSize);

//Activity detection
window.addEventListener("blur", (event) => {
    gameState = "Paused";
  }, true);
// Score
let currentScore = 0;
let highscore = localStorage.getItem("highscore") || 0;

// Keys
const keys = {};
let enterPressedLastFrame = false;

document.addEventListener("keydown", (e) => keys[e.code] = true);
document.addEventListener("keyup", (e) => keys[e.code] = false);

// Random
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

// Resize canvas
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Keep player inside screen
  if (x + size > canvas.width) x = canvas.width - size;
  if (y + size > canvas.height) y = canvas.height - size;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Handle pause toggle
function handlePause() {
  if (keys["Enter"] && !enterPressedLastFrame) {
    if (gameState === "Playing") gameState = "Paused";
    else if (gameState === "Paused") gameState = "Playing";
  }
  enterPressedLastFrame = keys["Enter"];
}

//Particle code
let pParticles = [];
function spawnParticles(x, y, count = 20) {
  pParticles = [];
  for (let i = 0; i < count; i++) {
    const maxLife = 60
    pParticles.push({
      parX: x,
      parY: y,
      size: getRandomInt(10) + 5,
      speedX: (Math.random() - 0.5) * 10,  // random spread
      speedY: (Math.random() - 0.5) * 10,
      life: maxLife, // frames to live
      maxLife: maxLife
    });
  }
}


// Reset / start
function resetGame() {
  if ((keys["KeyR"] && gameState === "Dead") || (keys["Space"] && gameState === "Starting")) {
    x = 100;
    y = 100;
    enemies = JSON.parse(JSON.stringify(initialEnemies));
    startTime = Date.now();
    elapsedTime = 0;
    collectedCoins = 0;
    coinX = getRandomInt(canvas.width - coinSize);
    coinY = getRandomInt(canvas.height - coinSize);
    gameState = "Playing";
  }
}

// Collision check
function isColliding(x, y, size, objX, objY, objSize) {
  return x < objX + objSize && x + size > objX && y < objY + objSize && y + size > objY;
}

// Update game
function update() {
  //particles update even when dead
  if (gameState === "Dead") {
  for (let particle of pParticles) {
    particle.parX += particle.speedX;
    particle.parY += particle.speedY;
    particle.life--;
  }
  // remove dead particles
  pParticles = pParticles.filter(p => p.life > 0);
  }

  handlePause();
  resetGame();

  if (gameState !== "Playing") return;

  // Timer
  elapsedTime = Date.now() - startTime;
  seconds = Math.floor(elapsedTime / 1000);

  // Player movement
  if (keys["ArrowUp"]) y -= speedY;
  if (keys["ArrowDown"]) y += speedY;
  if (keys["ArrowLeft"]) x -= speedX;
  if (keys["ArrowRight"]) x += speedX;
  for  (let particle of pParticles) {
  particle.parX = x
  particle.parY = y 
  }
  // Keep player inside canvas
  if (x < 0) x = 0;
  if (x + size > canvas.width) x = canvas.width - size;
  if (y < 0) y = 0;
  if (y + size > canvas.height) y = canvas.height - size;

  // Enemy movement and collision
  for (let enemy of enemies) {
    enemy.x += enemy.speedX;
    enemy.y += enemy.speedY;

    // Bounce
    if (enemy.x < 0 || enemy.x + enemy.size > canvas.width) enemy.speedX *= -1;
    if (enemy.y < 0 || enemy.y + enemy.size > canvas.height) enemy.speedY *= -1;

    if (isColliding(x, y, size, enemy.x, enemy.y, enemy.size)) {
      deathCount++;
      gameState = "Dead";
      spawnParticles(x, y); //particles explode
      if (currentScore > highscore) {
        highscore = currentScore;
        localStorage.setItem("highscore", highscore);
      }
    }
  }

  // Coin collection
  if (isColliding(x, y, size, coinX, coinY, coinSize)) {
    collectedCoins++;
    coinX = getRandomInt(canvas.width - coinSize);
    coinY = getRandomInt(canvas.height - coinSize);
  }

  // Score
  currentScore = collectedCoins * seconds * 1000;
}

// Draw everything
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Player
  if (gameState !== "Dead"){
  ctx.fillStyle = "red";
  ctx.fillRect(x, y, size, size);
  }
  // Enemies
  ctx.fillStyle = "green";
  for (let enemy of enemies) ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);

  // Coin
  ctx.fillStyle = "gold";
  ctx.beginPath();
  ctx.arc(coinX + coinSize / 2, coinY + coinSize / 2, coinSize / 2, 0, Math.PI * 2);
  ctx.fill();

  // UI
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText("Deaths: " + deathCount, 20, 30);
  ctx.fillText("Time: " + seconds + "s", 20, 60);
  ctx.fillText("Score: " + currentScore, 20, 90);
  ctx.fillText("Highscore: " + highscore, 20, 120);

  // Screens
  ctx.textAlign = "center";
  if (gameState === "Starting") {
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "60px Arial";
    ctx.fillText("GAMICON", canvas.width / 2, canvas.height / 2);
    ctx.font = "30px Arial";
    ctx.fillText("Press Space to Start", canvas.width / 2, canvas.height / 2 + 50);
  } else if (gameState === "Dead") {
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "60px Arial";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
    ctx.font = "30px Arial";
    ctx.fillText("Press R to Restart", canvas.width / 2, canvas.height / 2 + 50);
    //Particle appearances
    for (let particle of pParticles) {
    ctx.fillStyle = "red";
    ctx.globalAlpha = particle.life / particle.maxLife; // fade out
    ctx.fillRect(particle.parX, particle.parY, particle.size, particle.size);
    }
    ctx.globalAlpha = 1;
  } else if (gameState === "Paused") {
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "60px Arial";
    ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
    ctx.font = "30px Arial";
    ctx.fillText("Press Enter to Resume", canvas.width / 2, canvas.height / 2 + 50);
  }
  ctx.textAlign = "left";


}

// Game loop
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
