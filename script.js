// Wait for DOM to be ready
let canvas, ctx, startBtn, pauseBtn, restartBtn;

document.addEventListener('DOMContentLoaded', function() {
    // Game Canvas Setup
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    startBtn = document.getElementById('startBtn');
    pauseBtn = document.getElementById('pauseBtn');
    restartBtn = document.getElementById('restartBtn');
    
    // Initialize event listeners
    initializeGame();
});

// Game State (defined outside function so all functions can access)
let gameState = 'waiting'; // waiting, playing, paused, gameOver
let score = 0;
let coins = 0;
let lives = 3;
let cameraX = 0;
let gameLoopRunning = false;
let invincible = false;
let invincibleTimer = 0;

// Player (Black Woman Character)
const player = {
    x: 100,
    y: 300,
    width: 40,
    height: 40,
    velocityX: 0,
    velocityY: 0,
    speed: 5,
    jumpPower: 15,
    onGround: false,
    facing: 'right',
    skinColor: '#8B4513', // Brown skin tone
    hairColor: '#1a1a1a', // Black hair
    shirtColor: '#FF6B6B' // Red/pink shirt
};

// Platforms
const platforms = [
    { x: 0, y: 450, width: 200, height: 50 },
    { x: 250, y: 400, width: 150, height: 50 },
    { x: 450, y: 350, width: 150, height: 50 },
    { x: 650, y: 300, width: 150, height: 50 },
    { x: 850, y: 250, width: 150, height: 50 },
    { x: 1050, y: 200, width: 150, height: 50 },
    { x: 1250, y: 150, width: 200, height: 50 },
    { x: 1500, y: 450, width: 200, height: 50 },
    { x: 1750, y: 400, width: 150, height: 50 },
    { x: 2000, y: 350, width: 150, height: 50 },
    { x: 2200, y: 450, width: 300, height: 50 }, // Final platform
];

// Enemies
const enemies = [
    { x: 300, y: 380, width: 30, height: 30, velocityX: -2, color: '#8B4513' },
    { x: 700, y: 330, width: 30, height: 30, velocityX: -2, color: '#8B4513' },
    { x: 1100, y: 180, width: 30, height: 30, velocityX: -2, color: '#8B4513' },
    { x: 1600, y: 380, width: 30, height: 30, velocityX: -2, color: '#8B4513' },
    { x: 2100, y: 430, width: 30, height: 30, velocityX: -2, color: '#8B4513' },
];

// Coin Objects (array of coin positions)
const coinObjects = [
    { x: 320, y: 360, width: 25, height: 25, collected: false },
    { x: 500, y: 310, width: 25, height: 25, collected: false },
    { x: 700, y: 260, width: 25, height: 25, collected: false },
    { x: 900, y: 210, width: 25, height: 25, collected: false },
    { x: 1100, y: 110, width: 25, height: 25, collected: false },
    { x: 1300, y: 110, width: 25, height: 25, collected: false },
    { x: 1600, y: 360, width: 25, height: 25, collected: false },
    { x: 1800, y: 360, width: 25, height: 25, collected: false },
    { x: 2100, y: 310, width: 25, height: 25, collected: false },
    { x: 2300, y: 410, width: 25, height: 25, collected: false },
];

// Key States
const keys = {};

function initializeGame() {
    if (!canvas || !ctx) {
        console.error('Canvas not found!');
        return;
    }

    // Event Listeners
    if (startBtn) {
        startBtn.addEventListener('click', startGame);
    } else {
        console.error('Start button not found!');
    }

    if (pauseBtn) {
        pauseBtn.addEventListener('click', togglePause);
    }

    if (restartBtn) {
        restartBtn.addEventListener('click', restartGame);
    }
    
    // Setup mobile controls
    setupMobileControls();
    
    // Start the game loop immediately so we always see the game
    if (!gameLoopRunning) {
        gameLoopRunning = true;
        gameLoop();
    }
}

document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    keys[e.code] = true;
    
    if (gameState === 'playing') {
        if (e.key === ' ' || e.key === 'w' || e.key === 'W' || e.code === 'ArrowUp') {
            e.preventDefault();
            jump();
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    keys[e.code] = false;
});

// Mobile Touch Controls
function setupMobileControls() {
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const jumpBtn = document.getElementById('jumpBtn');

    if (leftBtn) {
        leftBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            keys['a'] = true;
            keys['arrowleft'] = true;
        });
        leftBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            keys['a'] = false;
            keys['arrowleft'] = false;
        });
        leftBtn.addEventListener('mousedown', () => {
            keys['a'] = true;
            keys['arrowleft'] = true;
        });
        leftBtn.addEventListener('mouseup', () => {
            keys['a'] = false;
            keys['arrowleft'] = false;
        });
    }

    if (rightBtn) {
        rightBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            keys['d'] = true;
            keys['arrowright'] = true;
        });
        rightBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            keys['d'] = false;
            keys['arrowright'] = false;
        });
        rightBtn.addEventListener('mousedown', () => {
            keys['d'] = true;
            keys['arrowright'] = true;
        });
        rightBtn.addEventListener('mouseup', () => {
            keys['d'] = false;
            keys['arrowright'] = false;
        });
    }

    if (jumpBtn) {
        jumpBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (gameState === 'playing') {
                jump();
            }
        });
        jumpBtn.addEventListener('mousedown', () => {
            if (gameState === 'playing') {
                jump();
            }
        });
    }
}

// Setup mobile controls when DOM is ready
document.addEventListener('DOMContentLoaded', setupMobileControls);

// Game Functions
function startGame() {
    console.log('Start game clicked!');
    if (gameState === 'waiting' || gameState === 'gameOver') {
        gameState = 'playing';
        if (startBtn) startBtn.disabled = true;
        if (pauseBtn) pauseBtn.disabled = false;
        const gameOverEl = document.getElementById('gameOver');
        if (gameOverEl) gameOverEl.classList.add('hidden');
        resetGame();
    }
}

function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        pauseBtn.textContent = 'Resume';
    } else if (gameState === 'paused') {
        gameState = 'playing';
        pauseBtn.textContent = 'Pause';
        gameLoop();
    }
}

function restartGame() {
    resetGame();
    startGame();
}

function takeDamage() {
    if (invincible) return;
    
    lives--;
    invincible = true;
    invincibleTimer = 120; // 2 seconds of invincibility (60fps * 2)
    
    // Respawn player at safe position
    player.x = 100;
    player.y = 300;
    player.velocityX = 0;
    player.velocityY = 0;
    cameraX = 0;
    
    if (lives <= 0) {
        gameState = 'gameOver';
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('finalScore').textContent = score;
        if (startBtn) startBtn.disabled = false;
        if (pauseBtn) pauseBtn.disabled = true;
    }
}

function resetGame() {
    player.x = 100;
    player.y = 300;
    player.velocityX = 0;
    player.velocityY = 0;
    score = 0;
    coins = 0;
    lives = 3;
    cameraX = 0;
    invincible = false;
    invincibleTimer = 0;
    
    // Reset coins
    coinObjects.forEach(coin => coin.collected = false);
    
    // Reset enemies
    enemies.forEach((enemy, i) => {
        enemy.x = [300, 700, 1100, 1600, 2100][i] || 300;
        enemy.velocityX = -2;
    });
    
    updateUI();
}

function jump() {
    if (player.onGround) {
        player.velocityY = -player.jumpPower;
        player.onGround = false;
    }
}

function updatePlayer() {
    // Horizontal movement
    if (keys['a'] || keys['arrowleft']) {
        player.velocityX = -player.speed;
        player.facing = 'left';
    } else if (keys['d'] || keys['arrowright']) {
        player.velocityX = player.speed;
        player.facing = 'right';
    } else {
        player.velocityX *= 0.8; // Friction
    }
    
    // Apply gravity
    player.velocityY += 0.8;
    
    // Update position
    player.x += player.velocityX;
    player.y += player.velocityY;
    
    // Check platform collisions
    player.onGround = false;
    platforms.forEach(platform => {
        if (player.x + player.width > platform.x &&
            player.x < platform.x + platform.width &&
            player.y + player.height > platform.y &&
            player.y + player.height < platform.y + platform.height + 10 &&
            player.velocityY > 0) {
            player.y = platform.y - player.height;
            player.velocityY = 0;
            player.onGround = true;
        }
    });
    
    // Ground collision
    if (player.y + player.height > canvas.height - 50) {
        player.y = canvas.height - 50 - player.height;
        player.velocityY = 0;
        player.onGround = true;
    }
    
    // Boundary checks
    if (player.x < 0) player.x = 0;
    if (player.x > 2500) {
        // Win condition
        gameState = 'gameOver';
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('finalScore').textContent = score;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    }
    
    // Update camera
    if (player.x > cameraX + canvas.width / 2) {
        cameraX = player.x - canvas.width / 2;
    }
    if (cameraX < 0) cameraX = 0;
}

function updateEnemies() {
    enemies.forEach(enemy => {
        enemy.x += enemy.velocityX;
        
        // Check if enemy is on a platform
        let onPlatform = false;
        platforms.forEach(platform => {
            if (enemy.x + enemy.width > platform.x &&
                enemy.x < platform.x + platform.width &&
                enemy.y + enemy.height >= platform.y &&
                enemy.y + enemy.height <= platform.y + 5) {
                enemy.y = platform.y - enemy.height;
                onPlatform = true;
            }
        });
        
        // Reverse direction at edges
        if (!onPlatform || enemy.x < 0) {
            enemy.velocityX *= -1;
        }
        
        // Enemy collision with player
        if (!invincible && player.x + player.width > enemy.x &&
            player.x < enemy.x + enemy.width &&
            player.y + player.height > enemy.y &&
            player.y < enemy.y + enemy.height) {
            // Player hit enemy from above
            if (player.velocityY > 0 && player.y < enemy.y) {
                // Enemy defeated
                enemy.x = -100;
                score += 100;
                player.velocityY = -8; // Bounce
            } else {
                // Player hit - respawn with invincibility
                takeDamage();
            }
            updateUI();
        }
    });
}

function updateCoins() {
    coinObjects.forEach(coin => {
        if (!coin.collected &&
            player.x + player.width > coin.x &&
            player.x < coin.x + coin.width &&
            player.y + player.height > coin.y &&
            player.y < coin.y + coin.height) {
            coin.collected = true;
            coins++;
            score += 50;
            updateUI();
        }
    });
}

function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('coins').textContent = coins;
    document.getElementById('lives').textContent = lives;
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw clouds
    drawClouds();
    
    // Save context for camera transform
    ctx.save();
    ctx.translate(-cameraX, 0);
    
    // Draw ground
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, canvas.height - 50, 2500, 50);
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, canvas.height - 50, 2500, 10);
    
    // Draw platforms
    platforms.forEach(platform => {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // Platform top (grass)
        ctx.fillStyle = '#228B22';
        ctx.fillRect(platform.x, platform.y, platform.width, 10);
    });
    
    // Draw coins
    coinObjects.forEach(coin => {
        if (!coin.collected) {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FFA500';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });
    
    // Draw enemies
    enemies.forEach(enemy => {
        if (enemy.x > cameraX - 50 && enemy.x < cameraX + canvas.width + 50) {
            ctx.fillStyle = enemy.color;
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            // Eyes
            ctx.fillStyle = 'white';
            ctx.fillRect(enemy.x + 5, enemy.y + 5, 8, 8);
            ctx.fillRect(enemy.x + 17, enemy.y + 5, 8, 8);
            ctx.fillStyle = 'black';
            ctx.fillRect(enemy.x + 7, enemy.y + 7, 4, 4);
            ctx.fillRect(enemy.x + 19, enemy.y + 7, 4, 4);
        }
    });
    
    // Draw player (Black Woman Character)
    // Only draw if not in invincibility flash (blinking effect)
    if (!invincible || Math.floor(invincibleTimer / 5) % 2 === 0) {
        // Hair (black)
        ctx.fillStyle = player.hairColor;
        ctx.fillRect(player.x + 5, player.y, player.width - 10, 15);
        // Hair poof on top
        ctx.beginPath();
        ctx.arc(player.x + player.width/2, player.y + 5, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Face (brown skin)
        ctx.fillStyle = player.skinColor;
        ctx.fillRect(player.x + 8, player.y + 15, 24, 20);
        
        // Eyes (white)
        ctx.fillStyle = 'white';
        ctx.fillRect(player.x + 12, player.y + 18, 6, 6);
        ctx.fillRect(player.x + 22, player.y + 18, 6, 6);
        
        // Eye pupils (black)
        ctx.fillStyle = 'black';
        ctx.fillRect(player.x + 13, player.y + 19, 4, 4);
        ctx.fillRect(player.x + 23, player.y + 19, 4, 4);
        
        // Body/Shirt (red/pink)
        ctx.fillStyle = player.shirtColor;
        ctx.fillRect(player.x + 6, player.y + 35, player.width - 12, 5);
    }
    
    // Restore context before UI overlay
    ctx.restore();
    
    // Draw UI overlay
    if (gameState === 'paused') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    } else if (gameState === 'waiting') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Click "Start Game" to Begin!', canvas.width / 2, canvas.height / 2);
    }
}

function drawClouds() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    const cloudPositions = [
        { x: 100, y: 50 },
        { x: 300, y: 80 },
        { x: 600, y: 60 },
        { x: 900, y: 70 },
    ];
    
    cloudPositions.forEach(cloud => {
        drawCloud(cloud.x, cloud.y);
    });
}

function drawCloud(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.arc(x + 25, y, 30, 0, Math.PI * 2);
    ctx.arc(x + 50, y, 20, 0, Math.PI * 2);
    ctx.fill();
}

function gameLoop() {
    if (!canvas || !ctx) return;
    
    if (gameState === 'playing') {
        updatePlayer();
        updateEnemies();
        updateCoins();
    }
    draw();
    requestAnimationFrame(gameLoop);
}
