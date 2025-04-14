import * as THREE from 'three';
import { Howl } from 'howler';

// Game variables
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let timeLeft = 60; // 60 seconds game time
let gameOver = false;
let powerUpActive = false;
let powerUpEndTime = 0;
let combo = 0;
let comboMultiplier = 1;
let lastCollectTime = 0;
const COMBO_TIMEOUT = 2000; // 2 seconds to maintain combo
const scoreElement = document.getElementById('score');
const collectibles = [];
const obstacles = [];
const powerUps = [];
const particles = [];
const playerSpeed = 0.1;
const collectibleCount = 15;
const obstacleCount = 8; // Increased obstacle count
const powerUpCount = 3;

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Sound effects
const sounds = {
    collect: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3'] }),
    powerUp: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'] }),
    gameOver: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3'] }),
    background: new Howl({ 
        src: ['https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3'],
        loop: true,
        volume: 0.3
    })
};

// Start background music
sounds.background.play();

// Add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Add directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Player setup
const playerGroup = new THREE.Group();
scene.add(playerGroup);

// Create body (torso)
const bodyGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.4);
const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
body.position.y = 0.6;
playerGroup.add(body);

// Create head
const headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
const headMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
const head = new THREE.Mesh(headGeometry, headMaterial);
head.position.y = 1.2;
playerGroup.add(head);

// Create arms
const armGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
const armMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });

// Left arm
const leftArm = new THREE.Mesh(armGeometry, armMaterial);
leftArm.position.set(-0.5, 0.6, 0);
playerGroup.add(leftArm);

// Right arm
const rightArm = new THREE.Mesh(armGeometry, armMaterial);
rightArm.position.set(0.5, 0.6, 0);
playerGroup.add(rightArm);

// Create legs
const legGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
const legMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });

// Left leg
const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
leftLeg.position.set(-0.3, -0.4, 0);
playerGroup.add(leftLeg);

// Right leg
const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
rightLeg.position.set(0.3, -0.4, 0);
playerGroup.add(rightLeg);

// Set initial position
playerGroup.position.y = 0.5;

// Create collectibles with different colors and values
const collectibleColors = [
    { color: 0xff0000, points: 10 }, // Red
    { color: 0xffff00, points: 20 }, // Yellow
    { color: 0x0000ff, points: 30 }  // Blue
];

for (let i = 0; i < collectibleCount; i++) {
    const colorType = Math.floor(Math.random() * collectibleColors.length);
    const geometry = new THREE.SphereGeometry(0.3, 16, 16);
    const material = new THREE.MeshPhongMaterial({ color: collectibleColors[colorType].color });
    const collectible = new THREE.Mesh(geometry, material);
    
    collectible.position.x = Math.random() * 20 - 10;
    collectible.position.z = Math.random() * 20 - 10;
    collectible.position.y = 0.3;
    collectible.userData.points = collectibleColors[colorType].points;
    collectible.userData.speed = 0.02 + Math.random() * 0.03;
    collectible.userData.direction = Math.random() * Math.PI * 2;
    
    scene.add(collectible);
    collectibles.push(collectible);
}

// Create power-ups with different effects
const powerUpTypes = [
    { color: 0xff00ff, effect: 'invincible', duration: 5000 }, // Pink - Invincibility
    { color: 0x00ffff, effect: 'speed', duration: 3000 },      // Cyan - Speed boost
    { color: 0xffff00, effect: 'multiplier', duration: 4000 }  // Yellow - Score multiplier
];

for (let i = 0; i < powerUpCount; i++) {
    const type = Math.floor(Math.random() * powerUpTypes.length);
    const geometry = new THREE.TorusGeometry(0.3, 0.1, 16, 32);
    const material = new THREE.MeshPhongMaterial({ color: powerUpTypes[type].color });
    const powerUp = new THREE.Mesh(geometry, material);
    
    powerUp.position.x = Math.random() * 20 - 10;
    powerUp.position.z = Math.random() * 20 - 10;
    powerUp.position.y = 0.3;
    powerUp.rotation.x = Math.PI / 2;
    powerUp.userData = { ...powerUpTypes[type] };
    
    scene.add(powerUp);
    powerUps.push(powerUp);
}

// Create different types of obstacles
const obstacleTypes = [
    { geometry: new THREE.CylinderGeometry(0.5, 0.5, 2, 32), color: 0x8B4513, type: 'normal' }, // Brown cylinder
    { geometry: new THREE.BoxGeometry(1, 2, 1), color: 0xFF4500, type: 'bouncy' },              // Orange box
    { geometry: new THREE.ConeGeometry(0.5, 2, 32), color: 0x4B0082, type: 'spinning' }         // Indigo cone
];

for (let i = 0; i < obstacleCount; i++) {
    const type = Math.floor(Math.random() * obstacleTypes.length);
    const material = new THREE.MeshPhongMaterial({ color: obstacleTypes[type].color });
    const obstacle = new THREE.Mesh(obstacleTypes[type].geometry, material);
    
    obstacle.position.x = Math.random() * 20 - 10;
    obstacle.position.z = Math.random() * 20 - 10;
    obstacle.position.y = 1;
    obstacle.userData = { 
        type: obstacleTypes[type].type,
        direction: Math.random() * Math.PI * 2,
        speed: 0.02 + Math.random() * 0.03,
        rotationSpeed: 0.02 + Math.random() * 0.03
    };
    
    scene.add(obstacle);
    obstacles.push(obstacle);
}

// Camera position
camera.position.set(0, 5, 5);
camera.lookAt(0, 0, 0);

// Ground
const groundGeometry = new THREE.PlaneGeometry(20, 20);
const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x808080, side: THREE.DoubleSide });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = Math.PI / 2;
scene.add(ground);

// Controls
const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key.toLowerCase())) {
        keys[e.key.toLowerCase()] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key.toLowerCase())) {
        keys[e.key.toLowerCase()] = false;
    }
});

// UI Elements
const timerElement = document.createElement('div');
timerElement.style.position = 'absolute';
timerElement.style.top = '20px';
timerElement.style.right = '20px';
timerElement.style.color = 'white';
timerElement.style.fontFamily = 'Arial, sans-serif';
timerElement.style.fontSize = '24px';
document.body.appendChild(timerElement);

const highScoreElement = document.createElement('div');
highScoreElement.style.position = 'absolute';
highScoreElement.style.top = '20px';
highScoreElement.style.left = '20px';
highScoreElement.style.color = 'white';
highScoreElement.style.fontFamily = 'Arial, sans-serif';
highScoreElement.style.fontSize = '24px';
highScoreElement.textContent = `High Score: ${highScore}`;
document.body.appendChild(highScoreElement);

const comboElement = document.createElement('div');
comboElement.style.position = 'absolute';
comboElement.style.top = '60px';
comboElement.style.left = '20px';
comboElement.style.color = 'white';
comboElement.style.fontFamily = 'Arial, sans-serif';
comboElement.style.fontSize = '24px';
comboElement.textContent = 'Combo: 0x';
document.body.appendChild(comboElement);

const powerUpElement = document.createElement('div');
powerUpElement.style.position = 'absolute';
powerUpElement.style.top = '100px';
powerUpElement.style.left = '20px';
powerUpElement.style.color = 'white';
powerUpElement.style.fontFamily = 'Arial, sans-serif';
powerUpElement.style.fontSize = '24px';
powerUpElement.textContent = 'Power-up: None';
document.body.appendChild(powerUpElement);

const gameOverElement = document.createElement('div');
gameOverElement.style.position = 'absolute';
gameOverElement.style.top = '50%';
gameOverElement.style.left = '50%';
gameOverElement.style.transform = 'translate(-50%, -50%)';
gameOverElement.style.color = 'white';
gameOverElement.style.fontFamily = 'Arial, sans-serif';
gameOverElement.style.fontSize = '48px';
gameOverElement.style.textAlign = 'center';
gameOverElement.style.display = 'none';
document.body.appendChild(gameOverElement);

const restartButton = document.createElement('button');
restartButton.textContent = 'Restart Game';
restartButton.style.position = 'absolute';
restartButton.style.top = '60%';
restartButton.style.left = '50%';
restartButton.style.transform = 'translate(-50%, -50%)';
restartButton.style.padding = '10px 20px';
restartButton.style.fontSize = '24px';
restartButton.style.display = 'none';
restartButton.addEventListener('click', restartGame);
document.body.appendChild(restartButton);

// Create particle system
function createParticles(position, color, count = 20) {
    for (let i = 0; i < count; i++) {
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: color });
        const particle = new THREE.Mesh(geometry, material);
        
        particle.position.copy(position);
        particle.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            Math.random() * 0.2,
            (Math.random() - 0.5) * 0.2
        );
        particle.userData.lifetime = 1.0;
        
        scene.add(particle);
        particles.push(particle);
    }
}

// Update particles
function updateParticles(deltaTime) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.position.add(particle.userData.velocity);
        particle.userData.lifetime -= deltaTime;
        
        if (particle.userData.lifetime <= 0) {
            scene.remove(particle);
            particles.splice(i, 1);
        }
    }
}

// Update combo
function updateCombo(currentTime) {
    if (currentTime - lastCollectTime > COMBO_TIMEOUT) {
        combo = 0;
        comboMultiplier = 1;
    }
    comboElement.textContent = `Combo: ${combo}x`;
}

// Update timer
function updateTimer() {
    if (!gameOver) {
        timeLeft--;
        timerElement.textContent = `Time: ${timeLeft}s`;
        
        if (timeLeft <= 0) {
            endGame();
        }
    }
}

// End game
function endGame() {
    gameOver = true;
    sounds.background.stop();
    sounds.gameOver.play();
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreElement.textContent = `High Score: ${highScore}`;
    }
    
    gameOverElement.textContent = `Game Over!\nFinal Score: ${score}\nHigh Score: ${highScore}`;
    gameOverElement.style.display = 'block';
    restartButton.style.display = 'block';
}

// Restart game
function restartGame() {
    // Reset game state
    score = 0;
    timeLeft = 60;
    gameOver = false;
    powerUpActive = false;
    combo = 0;
    comboMultiplier = 1;
    
    // Reset UI
    scoreElement.textContent = `Score: ${score}`;
    timerElement.textContent = `Time: ${timeLeft}s`;
    comboElement.textContent = 'Combo: 0x';
    powerUpElement.textContent = 'Power-up: None';
    gameOverElement.style.display = 'none';
    restartButton.style.display = 'none';
    
    // Clear scene
    collectibles.forEach(collectible => scene.remove(collectible));
    obstacles.forEach(obstacle => scene.remove(obstacle));
    powerUps.forEach(powerUp => scene.remove(powerUp));
    particles.forEach(particle => scene.remove(particle));
    
    collectibles.length = 0;
    obstacles.length = 0;
    powerUps.length = 0;
    particles.length = 0;
    
    // Reset player position
    playerGroup.position.set(0, 0.5, 0);
    
    // Recreate game objects
    createGameObjects();
    
    // Restart background music
    sounds.background.play();
}

// Create game objects
function createGameObjects() {
    // Recreate collectibles
    for (let i = 0; i < collectibleCount; i++) {
        const colorType = Math.floor(Math.random() * collectibleColors.length);
        const geometry = new THREE.SphereGeometry(0.3, 16, 16);
        const material = new THREE.MeshPhongMaterial({ color: collectibleColors[colorType].color });
        const collectible = new THREE.Mesh(geometry, material);
        
        collectible.position.x = Math.random() * 20 - 10;
        collectible.position.z = Math.random() * 20 - 10;
        collectible.position.y = 0.3;
        collectible.userData = {
            points: collectibleColors[colorType].points,
            speed: 0.02 + Math.random() * 0.03,
            direction: Math.random() * Math.PI * 2
        };
        
        scene.add(collectible);
        collectibles.push(collectible);
    }
    
    // Recreate power-ups
    for (let i = 0; i < powerUpCount; i++) {
        const type = Math.floor(Math.random() * powerUpTypes.length);
        const geometry = new THREE.TorusGeometry(0.3, 0.1, 16, 32);
        const material = new THREE.MeshPhongMaterial({ color: powerUpTypes[type].color });
        const powerUp = new THREE.Mesh(geometry, material);
        
        powerUp.position.x = Math.random() * 20 - 10;
        powerUp.position.z = Math.random() * 20 - 10;
        powerUp.position.y = 0.3;
        powerUp.rotation.x = Math.PI / 2;
        powerUp.userData = { ...powerUpTypes[type] };
        
        scene.add(powerUp);
        powerUps.push(powerUp);
    }
    
    // Recreate obstacles
    for (let i = 0; i < obstacleCount; i++) {
        const type = Math.floor(Math.random() * obstacleTypes.length);
        const material = new THREE.MeshPhongMaterial({ color: obstacleTypes[type].color });
        const obstacle = new THREE.Mesh(obstacleTypes[type].geometry, material);
        
        obstacle.position.x = Math.random() * 20 - 10;
        obstacle.position.z = Math.random() * 20 - 10;
        obstacle.position.y = 1;
        obstacle.userData = {
            type: obstacleTypes[type].type,
            direction: Math.random() * Math.PI * 2,
            speed: 0.02 + Math.random() * 0.03,
            rotationSpeed: 0.02 + Math.random() * 0.03
        };
        
        scene.add(obstacle);
        obstacles.push(obstacle);
    }
}

// Start timer
setInterval(updateTimer, 1000);

let lastTime = 0;
// Game loop
function animate(currentTime) {
    if (!gameOver) {
        requestAnimationFrame(animate);
        
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;
        
        // Update particles
        updateParticles(deltaTime);
        
        // Update combo
        updateCombo(currentTime);
        
        // Player movement and rotation
        let moved = false;
        if (keys.w) {
            playerGroup.position.z -= playerSpeed * (powerUpActive && powerUpElement.textContent.includes('speed') ? 2 : 1);
            playerGroup.rotation.y = 0;
            moved = true;
        }
        if (keys.s) {
            playerGroup.position.z += playerSpeed * (powerUpActive && powerUpElement.textContent.includes('speed') ? 2 : 1);
            playerGroup.rotation.y = Math.PI;
            moved = true;
        }
        if (keys.a) {
            playerGroup.position.x -= playerSpeed * (powerUpActive && powerUpElement.textContent.includes('speed') ? 2 : 1);
            playerGroup.rotation.y = -Math.PI / 2;
            moved = true;
        }
        if (keys.d) {
            playerGroup.position.x += playerSpeed * (powerUpActive && powerUpElement.textContent.includes('speed') ? 2 : 1);
            playerGroup.rotation.y = Math.PI / 2;
            moved = true;
        }
        
        // Keep player within bounds
        playerGroup.position.x = Math.max(-9, Math.min(9, playerGroup.position.x));
        playerGroup.position.z = Math.max(-9, Math.min(9, playerGroup.position.z));
        
        // Add walking animation
        if (moved) {
            const time = performance.now() * 0.01;
            leftLeg.rotation.x = Math.sin(time * 5) * 0.5;
            rightLeg.rotation.x = Math.sin(time * 5 + Math.PI) * 0.5;
            leftArm.rotation.x = Math.sin(time * 5 + Math.PI) * 0.5;
            rightArm.rotation.x = Math.sin(time * 5) * 0.5;
        } else {
            leftLeg.rotation.x = 0;
            rightLeg.rotation.x = 0;
            leftArm.rotation.x = 0;
            rightArm.rotation.x = 0;
        }
        
        // Move collectibles
        collectibles.forEach(collectible => {
            collectible.position.x += Math.cos(collectible.userData.direction) * collectible.userData.speed;
            collectible.position.z += Math.sin(collectible.userData.direction) * collectible.userData.speed;
            
            // Bounce off walls
            if (collectible.position.x < -9 || collectible.position.x > 9) {
                collectible.userData.direction = Math.PI - collectible.userData.direction;
            }
            if (collectible.position.z < -9 || collectible.position.z > 9) {
                collectible.userData.direction = -collectible.userData.direction;
            }
        });
        
        // Move obstacles
        obstacles.forEach(obstacle => {
            if (obstacle.userData.type === 'normal') {
                obstacle.position.x += Math.cos(obstacle.userData.direction) * obstacle.userData.speed;
                obstacle.position.z += Math.sin(obstacle.userData.direction) * obstacle.userData.speed;
            } else if (obstacle.userData.type === 'spinning') {
                obstacle.rotation.y += obstacle.userData.rotationSpeed;
            }
            
            // Bounce off walls
            if (obstacle.position.x < -9 || obstacle.position.x > 9) {
                obstacle.userData.direction = Math.PI - obstacle.userData.direction;
            }
            if (obstacle.position.z < -9 || obstacle.position.z > 9) {
                obstacle.userData.direction = -obstacle.userData.direction;
            }
        });
        
        // Collectible collision detection
        collectibles.forEach((collectible, index) => {
            const distance = playerGroup.position.distanceTo(collectible.position);
            if (distance < 1) {
                scene.remove(collectible);
                collectibles.splice(index, 1);
                
                // Update combo
                const currentTime = performance.now();
                if (currentTime - lastCollectTime <= COMBO_TIMEOUT) {
                    combo++;
                    comboMultiplier = Math.min(5, 1 + combo * 0.2);
                } else {
                    combo = 1;
                    comboMultiplier = 1;
                }
                lastCollectTime = currentTime;
                
                // Calculate score with multiplier
                const baseScore = collectible.userData.points;
                const finalScore = Math.floor(baseScore * comboMultiplier);
                score += finalScore;
                
                scoreElement.textContent = `Score: ${score}`;
                createParticles(collectible.position, collectibleColors[0].color);
            }
        });
        
        // Power-up collision detection
        powerUps.forEach((powerUp, index) => {
            const distance = playerGroup.position.distanceTo(powerUp.position);
            if (distance < 1) {
                scene.remove(powerUp);
                powerUps.splice(index, 1);
                powerUpActive = true;
                powerUpEndTime = currentTime + powerUp.userData.duration;
                powerUpElement.textContent = `Power-up: ${powerUp.userData.effect}`;
                createParticles(powerUp.position, powerUp.userData.color, 30);
            }
        });
        
        // Check power-up duration
        if (powerUpActive && currentTime > powerUpEndTime) {
            powerUpActive = false;
            powerUpElement.textContent = 'Power-up: None';
        }
        
        // Obstacle collision detection
        obstacles.forEach(obstacle => {
            const distance = playerGroup.position.distanceTo(obstacle.position);
            if (distance < 1 && !(powerUpActive && powerUpElement.textContent.includes('invincible'))) {
                endGame();
            }
        });
        
        // Camera follow player
        camera.position.x = playerGroup.position.x;
        camera.position.z = playerGroup.position.z + 5;
        camera.lookAt(playerGroup.position);
        
        renderer.render(scene, camera);
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate(0); 