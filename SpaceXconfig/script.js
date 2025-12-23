const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const scoreValue = document.getElementById('scoreValue');
const livesValue = document.getElementById('livesValue');
const levelValue = document.getElementById('levelValue');
const meteorsValue = document.getElementById('meteorsValue');
const finalScore = document.getElementById('finalScore');
const finalLevel = document.getElementById('finalLevel');
const finalMeteors = document.getElementById('finalMeteors');
const levelProgress = document.getElementById('levelProgress');
const progressPercent = document.getElementById('progressPercent');

let gameActive = false;
let score = 0;
let lives = 3;
let level = 1;
let meteorsDestroyed = 0;
let animationId;
let mousePressed = false;

function resizeCanvas() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w;
    canvas.height = h;
}

function debounce(fn, ms = 100) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
    };
}

const player = {
    width: 50,
    height: 70,
    speed: 7,
    bullets: [],
    lastShot: 0,
    shotDelay: 200,
    x: canvas.width / 2 - 25,
    y: canvas.height - 100
};

let meteors = [];
const meteorColors = ['#ff6b6b', '#ffa500', '#ffcc00', '#4ecdc4', '#9d4edd', '#ff5d8f'];

function createStars() {
    const starsContainer = document.getElementById('stars');
    starsContainer.innerHTML = '';
    for (let i = 0; i < 180; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        const size = Math.random() * 2 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        starsContainer.appendChild(star);
    }
}

function drawPlayer() {
    ctx.fillStyle = '#00b7ff';
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#0ef';
    ctx.fillRect(player.x + player.width * 0.35, player.y + player.height * 0.25, player.width * 0.3, 10);
}

function drawBullets() {
    ctx.fillStyle = '#ffd166';
    player.bullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawMeteors() {
    meteors.forEach(meteor => {
        ctx.fillStyle = meteor.color;
        ctx.beginPath();
        ctx.arc(meteor.x, meteor.y, meteor.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

function clearCanvas() {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function update() {
    player.bullets = player.bullets.filter(b => b.y > -10);
    player.bullets.forEach(bullet => (bullet.y -= bullet.speed));

    meteors = meteors.filter(m => m.y < canvas.height + m.radius);
    meteors.forEach(meteor => {
        meteor.y += meteor.speed;
        meteor.x += meteor.vx;
        if (meteor.x < meteor.radius || meteor.x > canvas.width - meteor.radius) {
            meteor.vx = -meteor.vx;
        }
    });

    meteors.forEach((meteor, mi) => {
        const dx = meteor.x - (player.x + player.width / 2);
        const dy = meteor.y - (player.y + player.height / 2);
        const dist = Math.hypot(dx, dy);
        if (dist < meteor.radius + player.width / 2) {
            gameOver();
        }
    });

    meteors.forEach((meteor, mi) => {
        player.bullets.forEach((bullet, bi) => {
            const dist = Math.hypot(meteor.x - bullet.x, meteor.y - bullet.y);
            if (dist < meteor.radius + 5) {
                meteors.splice(mi, 1);
                player.bullets.splice(bi, 1);
                score += Math.max(5, Math.floor(30 - meteor.radius));
                meteorsDestroyed++;
                scoreValue.textContent = score;
                meteorsValue.textContent = meteorsDestroyed;
                checkLevelUp();
            }
        });
    });

    const spawnChance = 0.025 + level * 0.005;
    if (Math.random() < spawnChance) {
        spawnMeteor();
    }

    if (mousePressed) shoot();
}

function draw() {
    clearCanvas();
    drawMeteors();
    drawBullets();
    drawPlayer();
}

function gameLoop() {
    if (!gameActive) return;
    update();
    draw();
    animationId = requestAnimationFrame(gameLoop);
}

function spawnMeteor() {
    const radius = Math.random() * 18 + 12;
    meteors.push({
        x: Math.random() * (canvas.width - radius * 2) + radius,
        y: -radius,
        radius,
        speed: Math.random() * 1 + 1 + level * 0.2,
        vx: (Math.random() - 0.5) * 2,
        color: meteorColors[Math.floor(Math.random() * meteorColors.length)]
    });
}

function shoot() {
    const now = Date.now();
    if (now - player.lastShot < player.shotDelay) return;
    player.lastShot = now;
    player.bullets.push({
        x: player.x + player.width / 2,
        y: player.y,
        speed: 12
    });
}

function checkLevelUp() {
    const newLevel = Math.floor(score / 400) + 1;
    const progress = (score % 400) / 4;
    levelProgress.style.width = `${progress}%`;
    progressPercent.textContent = `${Math.round(progress)}%`;

    if (newLevel !== level) {
        level = newLevel;
        levelValue.textContent = level;
        player.shotDelay = Math.max(90, 200 - level * 10);
    }
}

function loseLife() {
    lives -= 1;
    livesValue.textContent = lives;
    if (lives <= 0) {
        gameOver();
    }
}

function gameOver() {
    gameActive = false;
    finalScore.textContent = score;
    finalLevel.textContent = level;
    finalMeteors.textContent = meteorsDestroyed;
    gameOverScreen.classList.remove('hidden');
    cancelAnimationFrame(animationId);
}

function startGame() {
    resizeCanvas();
    gameActive = true;
    score = 0;
    lives = 1;
    level = 1;
    meteorsDestroyed = 0;
    meteors = [];
    player.bullets = [];
    player.lastShot = 0;
    player.shotDelay = 200;
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 100;

    scoreValue.textContent = score;
    livesValue.textContent = lives;
    levelValue.textContent = level;
    meteorsValue.textContent = meteorsDestroyed;
    levelProgress.style.width = '0%';
    progressPercent.textContent = '0%';

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    gameLoop();
}

const keys = {};

window.addEventListener('keydown', e => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    keys[k] = true;
    if (e.key === ' ') {
        mousePressed = true;
        if (gameActive) shoot();
    }
});

window.addEventListener('keyup', e => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    keys[k] = false;
    if (e.key === ' ') mousePressed = false;
});

canvas.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    mousePressed = true;
    if (gameActive) shoot();
});

canvas.addEventListener('mouseup', e => {
    if (e.button !== 0) return;
    mousePressed = false;
});

canvas.addEventListener('mouseleave', () => {
    mousePressed = false;
});

function handlePlayerMovement() {
    if (keys['w'] && player.y > 0) player.y -= player.speed;
    if (keys['s'] && player.y < canvas.height - player.height) player.y += player.speed;
    if (keys['a'] && player.x > 0) player.x -= player.speed;
    if (keys['d'] && player.x < canvas.width - player.width) player.x += player.speed;
}

setInterval(() => {
    if (gameActive) handlePlayerMovement();
}, 1000 / 60);

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

window.addEventListener('load', () => {
    resizeCanvas();
    createStars();
});

window.addEventListener('resize', debounce(() => {
    const prevCenterX = player.x + player.width / 2;
    resizeCanvas();
    player.x = Math.min(Math.max(prevCenterX - player.width / 2, 0), canvas.width - player.width);
    player.y = canvas.height - 100;
}, 120));