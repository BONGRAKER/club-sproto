/*
 * Client‑side logic for Club Sproto.
 *
 * This script handles the login flow, real‑time networking via socket.io,
 * drawing the game world onto a canvas, movement control, chat, avatar uploads,
 * mobile controls, background music, particle effects, emotes, and INTERACTIVE FEATURES!
 */

(() => {
  // Establish Socket.io connection
  const socket = io();

  // DOM elements
  const loginScreen = document.getElementById('login');
  const gameScreen = document.getElementById('game');
  const usernameInput = document.getElementById('username');
  const avatarChoice = document.getElementById('avatar-choice');
  const startBtn = document.getElementById('startBtn');
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const chatContainer = document.getElementById('chatContainer');
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const chatForm = document.getElementById('chatForm');
  const avatarUpload = document.getElementById('avatarUpload');
  const uploadBtn = document.getElementById('uploadBtn');
  const uploadStatus = document.getElementById('uploadStatus');
  const playerCountText = document.getElementById('playerCountText');
  
  // Music elements
  const bgMusic = document.getElementById('bgMusic');
  const musicToggle = document.getElementById('musicToggle');
  const volumeSlider = document.getElementById('volumeSlider');
  
  // Mobile control elements
  const upBtn = document.getElementById('upBtn');
  const downBtn = document.getElementById('downBtn');
  const leftBtn = document.getElementById('leftBtn');
  const rightBtn = document.getElementById('rightBtn');
  
  // Emote elements
  const emoteToggle = document.getElementById('emoteToggle');
  const emotePanel = document.getElementById('emotePanel');
  const waveBtn = document.getElementById('waveBtn');
  const danceBtn = document.getElementById('danceBtn');
  const laughBtn = document.getElementById('laughBtn');
  const heartBtn = document.getElementById('heartBtn');
  const fireBtn = document.getElementById('fireBtn');
  const rainbowBtn = document.getElementById('rainbowBtn');
  const starBtn = document.getElementById('starBtn');
  const rocketBtn = document.getElementById('rocketBtn');
  const poopBtn = document.getElementById('poopBtn');
  const alienBtn = document.getElementById('alienBtn');
  const ghostBtn = document.getElementById('ghostBtn');
  const ninjaBtn = document.getElementById('ninjaBtn');
  
  // Interactive elements
  const weatherToggle = document.getElementById('weatherToggle');
  const miniGameBtn = document.getElementById('miniGameBtn');
  const dancePartyBtn = document.getElementById('dancePartyBtn');
  const confettiBtn = document.getElementById('confettiBtn');
  const miniGameOverlay = document.getElementById('miniGameOverlay');
  const miniGameCanvas = document.getElementById('miniGameCanvas');
  const miniGameScore = document.getElementById('miniGameScore');
  const miniGameTime = document.getElementById('miniGameTime');
  const closeMiniGame = document.getElementById('closeMiniGame');
  
  // Combat elements
  const attackBtn = document.getElementById('attackBtn');
  const currentWeapon = document.getElementById('currentWeapon');

  // Game state
  const avatars = [];
  const background = new Image();
  background.src = 'images/background.png';

  // Players keyed by socket id
  const players = {};
  let myId = null;
  let myPlayer = null;

  // Track the selected avatar index
  let selectedAvatarIndex = 0;

  // Canvas scaling for mobile
  let canvasScale = 1;
  let canvasOffsetX = 0;
  let canvasOffsetY = 0;

  // Mobile detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Interactive features state
  let weatherActive = false;
  let dancePartyMode = false;
  let weatherElements = [];
  let confettiPieces = [];
  let miniGameActive = false;
  let miniGameScoreValue = 0;
  let miniGameTimeLeft = 30;
  let miniGameTargets = [];
  let miniGameBullets = [];
  
  // Combat state
  const weapons = [];
  let myWeapon = 'Fists';
  let myWeaponDamage = 10;
  let myWeaponRange = 50;
  let lastAttackTime = 0;
  let attackCooldown = 1000; // 1 second

  // Particle system for cool effects
  const particles = [];
  const sparkles = [];
  
  // Emote system - INCREASED BY 5X!
  const emotes = {
    '👋': { color: '#4a90e2', particles: 40, duration: 3000 },
    '💃': { color: '#ff69b4', particles: 75, duration: 4000 },
    '😂': { color: '#ffd700', particles: 60, duration: 3000 },
    '❤️': { color: '#ff4444', particles: 50, duration: 3500 },
    '🔥': { color: '#ff6b35', particles: 100, duration: 4000 },
    '🌈': { color: '#ff69b4', particles: 125, duration: 5000 },
    '⭐': { color: '#ffd700', particles: 30, duration: 3000 },
    '🚀': { color: '#ff6b35', particles: 90, duration: 4000 },
    '💩': { color: '#8B4513', particles: 45, duration: 3000 },
    '👽': { color: '#00ff00', particles: 80, duration: 4000 },
    '👻': { color: '#f0f8ff', particles: 70, duration: 3500 },
    '🥷': { color: '#000000', particles: 65, duration: 3000 }
  };
  
  // Sound effects
  const pickupSound = document.getElementById('pickupSound');
  const attackSound = document.getElementById('attackSound');
  const hitSound = document.getElementById('hitSound');
  const deathSound = document.getElementById('deathSound');
  const respawnSound = document.getElementById('respawnSound');

  // Play sound effect
  function playSound(sound) {
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(e => console.log('Sound play failed:', e));
    }
  }
  
  class Particle {
    constructor(x, y, color = '#ff69b4', type = 'normal') {
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * 8; // Increased speed
      this.vy = (Math.random() - 0.5) * 8;
      this.life = 1.0;
      this.decay = 0.01; // Slower decay for longer particles
      this.color = color;
      this.size = Math.random() * 4 + 2; // Bigger particles
      this.type = type;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotationSpeed = (Math.random() - 0.5) * 0.4; // Faster rotation
    }
    
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life -= this.decay;
      this.vy += 0.05; // Reduced gravity
      this.rotation += this.rotationSpeed;
      
      // Special effects for different particle types
      if (this.type === 'fire') {
        this.vx *= 0.99;
        this.vy *= 0.99;
        this.color = `hsl(${Math.random() * 60 + 10}, 100%, 50%)`; // Random fire colors
      } else if (this.type === 'rainbow') {
        this.color = `hsl(${(Date.now() * 0.2) % 360}, 70%, 60%)`;
      } else if (this.type === 'alien') {
        this.color = `hsl(${Math.random() * 60 + 120}, 100%, 50%)`; // Green variations
      } else if (this.type === 'ghost') {
        this.color = `hsl(0, 0%, ${Math.random() * 30 + 70}%)`; // White variations
      }
    }
    
    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = this.life;
      ctx.fillStyle = this.color;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      
      if (this.type === 'star') {
        // Draw star shape
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
          const x = Math.cos(angle) * this.size;
          const y = Math.sin(angle) * this.size;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      } else if (this.type === 'heart') {
        // Draw heart shape
        ctx.beginPath();
        ctx.moveTo(0, this.size);
        ctx.bezierCurveTo(-this.size, -this.size, -this.size * 2, this.size, 0, this.size * 2);
        ctx.bezierCurveTo(this.size * 2, this.size, this.size, -this.size, 0, this.size);
        ctx.fill();
      } else if (this.type === 'poop') {
        // Draw poop emoji shape
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size, this.size * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        // Add eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-this.size * 0.3, -this.size * 0.2, 2, 0, Math.PI * 2);
        ctx.arc(this.size * 0.3, -this.size * 0.2, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Draw circle
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    }
  }

  class Sparkle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.life = 1.0;
      this.decay = 0.02;
      this.size = Math.random() * 3 + 1;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotationSpeed = (Math.random() - 0.5) * 0.3;
    }
    
    update() {
      this.life -= this.decay;
      this.rotation += this.rotationSpeed;
    }
    
    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = this.life;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      
      // Draw sparkle
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        const x = Math.cos(angle) * this.size;
        const y = Math.sin(angle) * this.size;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      
      ctx.restore();
    }
  }

  class ConfettiPiece {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * 10;
      this.vy = (Math.random() - 0.5) * 10;
      this.life = 1.0;
      this.decay = 0.005;
      this.color = `hsl(${Math.random() * 360}, 70%, 60%)`;
      this.size = Math.random() * 8 + 4;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }
    
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.2; // gravity
      this.life -= this.decay;
      this.rotation += this.rotationSpeed;
    }
    
    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = this.life;
      ctx.fillStyle = this.color;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      
      // Draw confetti piece
      ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
      
      ctx.restore();
    }
  }

  // Initialize canvas scaling - FIXED FOR DESKTOP
  function initCanvasScaling() {
    const container = gameScreen;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    if (isMobile) {
      // On mobile, make canvas fill available space
      canvas.style.width = '100%';
      canvas.style.height = '60vh';
      canvasScale = Math.min(containerWidth / 1024, (containerHeight * 0.6) / 600);
    } else {
      // On desktop, maintain aspect ratio and fit properly
      const chatWidth = 300; // Chat container width
      const availableWidth = containerWidth - chatWidth;
      const availableHeight = containerHeight;
      
      canvasScale = Math.min(availableWidth / 1024, availableHeight / 600);
      
      // Set canvas size to maintain aspect ratio
      canvas.style.width = (1024 * canvasScale) + 'px';
      canvas.style.height = (600 * canvasScale) + 'px';
    }
    
    canvasOffsetX = 0;
    canvasOffsetY = 0;
  }

  // Initialize music
  function initMusic() {
    // Set initial volume
    bgMusic.volume = volumeSlider.value / 100;
    
    // Music toggle
    musicToggle.addEventListener('click', () => {
      if (bgMusic.paused) {
        bgMusic.play().catch(e => console.log('Music play failed:', e));
        musicToggle.classList.remove('muted');
      } else {
        bgMusic.pause();
        musicToggle.classList.add('muted');
      }
    });
    
    // Volume control
    volumeSlider.addEventListener('input', (e) => {
      bgMusic.volume = e.target.value / 100;
    });
    
    // Try to start music on first user interaction
    document.addEventListener('click', () => {
      if (bgMusic.paused) {
        bgMusic.play().catch(e => console.log('Music play failed:', e));
      }
    }, { once: true });
  }

  // Initialize mobile controls
  function initMobileControls() {
    if (!isMobile) return;
    
    // Touch controls
    const mobileButtons = [upBtn, downBtn, leftBtn, rightBtn];
    const directions = ['up', 'down', 'left', 'right'];
    
    mobileButtons.forEach((btn, index) => {
      const direction = directions[index];
      
      // Touch start
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys[direction] = true;
      });
      
      // Touch end
      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys[direction] = false;
      });
      
      // Mouse events for testing on desktop
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        keys[direction] = true;
      });
      
      btn.addEventListener('mouseup', (e) => {
        e.preventDefault();
        keys[direction] = false;
      });
    });
  }

  // Initialize emote controls with dropdown
  function initEmoteControls() {
    // Toggle emote panel
    emoteToggle.addEventListener('click', () => {
      emotePanel.classList.toggle('show');
      emoteToggle.classList.toggle('active');
    });
    
    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
      if (!emoteControls.contains(e.target)) {
        emotePanel.classList.remove('show');
        emoteToggle.classList.remove('active');
      }
    });
    
    const emoteButtons = [waveBtn, danceBtn, laughBtn, heartBtn, fireBtn, rainbowBtn, starBtn, rocketBtn, poopBtn, alienBtn, ghostBtn, ninjaBtn];
    const emoteSymbols = ['👋', '💃', '😂', '❤️', '🔥', '🌈', '⭐', '🚀', '💩', '👽', '👻', '🥷'];
    
    emoteButtons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        const emote = emoteSymbols[index];
        const emoteData = emotes[emote];
        
        // Send emote to server
        socket.emit('emote', { emote, x: myPlayer?.x || 512, y: myPlayer?.y || 300 });
        
        // Create local particle effect
        createEmoteParticles(myPlayer?.x || 512, myPlayer?.y || 300, emote);
        
        // Add emote to chat
        addChatMessage({ id: myId, name: myPlayer?.name || 'You', message: emote });
        
        // Close panel after emote
        emotePanel.classList.remove('show');
        emoteToggle.classList.remove('active');
      });
    });
  }

  // Initialize interactive features
  function initInteractiveFeatures() {
    // Weather toggle
    weatherToggle.addEventListener('click', () => {
      weatherActive = !weatherActive;
      weatherToggle.classList.toggle('active');
      
      if (weatherActive) {
        createWeatherEffect();
      } else {
        clearWeatherEffect();
      }
    });
    
    // Mini-game button
    miniGameBtn.addEventListener('click', () => {
      if (!miniGameActive) {
        startMiniGame();
      }
    });
    
    // Dance party button
    dancePartyBtn.addEventListener('click', () => {
      dancePartyMode = !dancePartyMode;
      dancePartyBtn.classList.toggle('active');
      
      if (dancePartyMode) {
        // Make all players dance
        Object.keys(players).forEach(id => {
          if (players[id]) {
            players[id].dancing = true;
          }
        });
        addChatMessage({ id: 'system', name: 'System', message: '🎉 Dance party started!' });
      } else {
        // Stop dancing
        Object.keys(players).forEach(id => {
          if (players[id]) {
            players[id].dancing = false;
          }
        });
        addChatMessage({ id: 'system', name: 'System', message: '💤 Dance party ended!' });
      }
    });
    
    // Confetti button
    confettiBtn.addEventListener('click', () => {
      createConfettiStorm();
    });
    
    // Close mini-game
    closeMiniGame.addEventListener('click', () => {
      stopMiniGame();
    });
    
    // Close mini-game when clicking outside
    miniGameOverlay.addEventListener('click', (e) => {
      if (e.target === miniGameOverlay) {
        stopMiniGame();
      }
    });
    
    // Close mini-game with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && miniGameActive) {
        stopMiniGame();
      }
    });
  }

  // Initialize combat controls
  function initCombatControls() {
    // Attack button
    attackBtn.addEventListener('click', () => {
      performAttack();
    });
    
    // Attack with spacebar
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        performAttack();
      }
    });
    
    // Update weapon display
    updateWeaponDisplay();
  }

  // Perform attack
  function performAttack() {
    const now = Date.now();
    if (now - lastAttackTime < attackCooldown) return;
    
    lastAttackTime = now;
    
    // Find closest player in range
    let closestPlayer = null;
    let closestDistance = Infinity;
    
    Object.keys(players).forEach(id => {
      if (id !== myId && players[id] && !players[id].isDead) {
        const distance = Math.sqrt(
          (myPlayer.x - players[id].x) ** 2 + 
          (myPlayer.y - players[id].y) ** 2
        );
        
        if (distance <= myWeaponRange && distance < closestDistance) {
          closestPlayer = players[id];
          closestDistance = distance;
        }
      }
    });
    
    if (closestPlayer) {
      // Attack the closest player
      socket.emit('attack', Object.keys(players).find(id => players[id] === closestPlayer));
      
      // Visual feedback
      attackBtn.classList.add('attacking');
      setTimeout(() => attackBtn.classList.remove('attacking'), 300);
      
      // Play attack sound
      playSound(attackSound);
      
      // Create attack particles
      createParticleBurst(myPlayer.x + 32, myPlayer.y + 32, 20, '#ff4444');
    }
  }

  // Update weapon display
  function updateWeaponDisplay() {
    currentWeapon.textContent = myWeapon;
  }

  // Handle weapon pickup
  function handleWeaponPickup(weapon) {
    const distance = Math.sqrt(
      (myPlayer.x - weapon.x) ** 2 + 
      (myPlayer.y - weapon.y) ** 2
    );
    
    if (distance < 50) {
      socket.emit('pickupWeapon', weapon.id);
      playSound(pickupSound);
      
      // Create pickup particles
      createParticleBurst(weapon.x, weapon.y, 30, '#ffd700');
    }
  }

  // Handle weapon pickup from server
  function onWeaponPickedUp(data) {
    if (data.playerId === myId) {
      myWeapon = data.weapon.type;
      myWeaponDamage = data.weapon.damage;
      myWeaponRange = data.weapon.range;
      updateWeaponDisplay();
      
      // Remove weapon from local array
      const index = weapons.findIndex(w => w.id === data.weaponId);
      if (index !== -1) {
        weapons.splice(index, 1);
      }
      
      // Add pickup message
      addChatMessage({ 
        id: 'system', 
        name: 'System', 
        message: `You picked up ${data.weapon.type}!` 
      });
    }
  }

  // Handle attack from server
  function onAttack(data) {
    if (data.targetId === myId) {
      // I was attacked
      playSound(hitSound);
      
      // Flash damage effect
      if (myPlayer) {
        myPlayer.damageFlash = Date.now() + 500;
      }
      
      // Create damage particles
      createParticleBurst(myPlayer.x + 32, myPlayer.y + 32, 25, '#ff4444');
      
      if (data.targetDead) {
        playSound(deathSound);
        addChatMessage({ 
          id: 'system', 
          name: 'System', 
          message: `You were killed by ${players[data.attackerId]?.name || 'Unknown'}!` 
        });
      }
    } else if (data.attackerId === myId) {
      // I attacked someone
      const target = players[data.targetId];
      if (target) {
        playSound(hitSound);
        
        // Create hit particles
        createParticleBurst(target.x + 32, target.y + 32, 25, '#ff4444');
        
        if (data.targetDead) {
          addChatMessage({ 
            id: 'system', 
            name: 'System', 
            message: `You killed ${target.name}!` 
          });
        }
      }
    }
  }

  // Handle player respawn
  function onPlayerRespawn(data) {
    if (data.id === myId) {
      playSound(respawnSound);
      addChatMessage({ 
        id: 'system', 
        name: 'System', 
        message: 'You respawned!' 
      });
      
      // Reset weapon
      myWeapon = 'Fists';
      myWeaponDamage = 10;
      myWeaponRange = 50;
      updateWeaponDisplay();
    }
  }

  // Weather effects
  function createWeatherEffect() {
    const weatherType = Math.random() > 0.5 ? 'rain' : 'snow';
    
    for (let i = 0; i < 50; i++) {
      const element = document.createElement('div');
      element.className = weatherType;
      element.style.left = Math.random() * 100 + '%';
      element.style.animationDuration = (Math.random() * 2 + 1) + 's';
      element.style.animationDelay = Math.random() * 2 + 's';
      document.body.appendChild(element);
      weatherElements.push(element);
    }
  }

  function clearWeatherEffect() {
    weatherElements.forEach(element => element.remove());
    weatherElements.length = 0;
  }

  // Mini-game
  function startMiniGame() {
    miniGameActive = true;
    miniGameScoreValue = 0;
    miniGameTimeLeft = 30;
    miniGameTargets.length = 0;
    miniGameBullets.length = 0;
    miniGameOverlay.classList.remove('hidden');
    
    // Reset score and time display
    miniGameScore.textContent = miniGameScoreValue;
    miniGameTime.textContent = miniGameTimeLeft;
    
    // Create mini-game canvas
    const mgCtx = miniGameCanvas.getContext('2d');
    miniGameCanvas.width = 400;
    miniGameCanvas.height = 300;
    
    // Clear canvas
    mgCtx.clearRect(0, 0, miniGameCanvas.width, miniGameCanvas.height);
    
    // Draw background
    mgCtx.fillStyle = '#1b1b3a';
    mgCtx.fillRect(0, 0, miniGameCanvas.width, miniGameCanvas.height);
    
    // Draw border
    mgCtx.strokeStyle = '#ff69b4';
    mgCtx.lineWidth = 2;
    mgCtx.strokeRect(0, 0, miniGameCanvas.width, miniGameCanvas.height);
    
    // Draw instructions
    mgCtx.fillStyle = '#ff69b4';
    mgCtx.font = '16px Trebuchet MS';
    mgCtx.textAlign = 'center';
    mgCtx.fillText('Click to shoot! Hit the targets!', miniGameCanvas.width / 2, 30);
    
    let gameTimer;
    let gameLoop;
    
    // Game loop
    gameLoop = () => {
      if (!miniGameActive) return;
      
      mgCtx.clearRect(0, 0, miniGameCanvas.width, miniGameCanvas.height);
      
      // Draw background
      mgCtx.fillStyle = '#1b1b3a';
      mgCtx.fillRect(0, 0, miniGameCanvas.width, miniGameCanvas.height);
      
      // Draw border
      mgCtx.strokeStyle = '#ff69b4';
      mgCtx.lineWidth = 2;
      mgCtx.strokeRect(0, 0, miniGameCanvas.width, miniGameCanvas.height);
      
      // Update and draw targets
      for (let i = miniGameTargets.length - 1; i >= 0; i--) {
        const target = miniGameTargets[i];
        target.y += target.speed;
        
        // Draw target with glow effect
        mgCtx.shadowColor = target.color;
        mgCtx.shadowBlur = 10;
        mgCtx.fillStyle = target.color;
        mgCtx.beginPath();
        mgCtx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
        mgCtx.fill();
        mgCtx.shadowBlur = 0;
        
        // Remove targets that go off screen
        if (target.y > miniGameCanvas.height + target.radius) {
          miniGameTargets.splice(i, 1);
        }
      }
      
      // Update and draw bullets
      for (let i = miniGameBullets.length - 1; i >= 0; i--) {
        const bullet = miniGameBullets[i];
        bullet.y -= bullet.speed;
        
        // Draw bullet with glow
        mgCtx.shadowColor = '#ff69b4';
        mgCtx.shadowBlur = 5;
        mgCtx.fillStyle = '#ff69b4';
        mgCtx.beginPath();
        mgCtx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
        mgCtx.fill();
        mgCtx.shadowBlur = 0;
        
        // Check collision with targets
        for (let j = miniGameTargets.length - 1; j >= 0; j--) {
          const target = miniGameTargets[j];
          const distance = Math.sqrt((bullet.x - target.x) ** 2 + (bullet.y - target.y) ** 2);
          
          if (distance < target.radius + 4) {
            // Hit! Remove target and bullet
            miniGameTargets.splice(j, 1);
            miniGameBullets.splice(i, 1);
            miniGameScoreValue += 10;
            miniGameScore.textContent = miniGameScoreValue;
            
            // Create explosion effect
            for (let k = 0; k < 8; k++) {
              const angle = (k / 8) * Math.PI * 2;
              const speed = 3;
              miniGameBullets.push({
                x: target.x + Math.cos(angle) * 20,
                y: target.y + Math.sin(angle) * 20,
                speed: speed,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                isExplosion: true
              });
            }
            break;
          }
        }
        
        // Remove bullets that go off screen
        if (bullet.y < -10) {
          miniGameBullets.splice(i, 1);
        }
      }
      
      // Spawn new targets randomly
      if (Math.random() < 0.03) {
        miniGameTargets.push({
          x: Math.random() * (miniGameCanvas.width - 40) + 20,
          y: -30,
          radius: Math.random() * 8 + 12,
          speed: Math.random() * 1.5 + 0.5,
          color: `hsl(${Math.random() * 360}, 70%, 60%)`
        });
      }
      
      requestAnimationFrame(gameLoop);
    };
    
    // Start the game loop
    gameLoop();
    
    // Click to shoot
    const handleClick = (e) => {
      if (!miniGameActive) return;
      
      const rect = miniGameCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Only shoot if clicking within canvas bounds
      if (x >= 0 && x <= miniGameCanvas.width && y >= 0 && y <= miniGameCanvas.height) {
        miniGameBullets.push({
          x: x,
          y: miniGameCanvas.height - 10,
          speed: 8
        });
      }
    };
    
    miniGameCanvas.addEventListener('click', handleClick);
    
    // Timer
    gameTimer = setInterval(() => {
      miniGameTimeLeft--;
      miniGameTime.textContent = miniGameTimeLeft;
      
      if (miniGameTimeLeft <= 0) {
        clearInterval(gameTimer);
        miniGameCanvas.removeEventListener('click', handleClick);
        stopMiniGame();
        
        // Show final score
        setTimeout(() => {
          alert(`🎯 Game Over! Final Score: ${miniGameScoreValue}`);
        }, 100);
      }
    }, 1000);
    
    // Store cleanup function
    miniGameOverlay.gameCleanup = () => {
      clearInterval(gameTimer);
      miniGameCanvas.removeEventListener('click', handleClick);
    };
  }

  function stopMiniGame() {
    miniGameActive = false;
    miniGameOverlay.classList.add('hidden');
    
    // Clean up game resources
    if (miniGameOverlay.gameCleanup) {
      miniGameOverlay.gameCleanup();
    }
    
    // Clear arrays
    miniGameTargets.length = 0;
    miniGameBullets.length = 0;
  }

  // Confetti storm
  function createConfettiStorm() {
    for (let i = 0; i < 200; i++) {
      confettiPieces.push(new ConfettiPiece(
        Math.random() * window.innerWidth,
        Math.random() * window.innerHeight
      ));
    }
    
    addChatMessage({ id: 'system', name: 'System', message: '🎊 Confetti storm!' });
  }

  // Create particle burst - INCREASED BY 5X!
  function createParticleBurst(x, y, count = 50, color = '#ff69b4') {
    for (let i = 0; i < count; i++) {
      particles.push(new Particle(x, y, color));
    }
  }

  // Create emote particles - INCREASED BY 5X!
  function createEmoteParticles(x, y, emote) {
    const emoteData = emotes[emote];
    if (!emoteData) return;
    
    for (let i = 0; i < emoteData.particles; i++) {
      let particleType = 'normal';
      if (emote === '⭐') particleType = 'star';
      else if (emote === '❤️') particleType = 'heart';
      else if (emote === '🔥') particleType = 'fire';
      else if (emote === '🌈') particleType = 'rainbow';
      else if (emote === '💩') particleType = 'poop';
      else if (emote === '👽') particleType = 'alien';
      else if (emote === '👻') particleType = 'ghost';
      
      particles.push(new Particle(x, y, emoteData.color, particleType));
    }
  }

  // Create sparkles
  function createSparkles(x, y, count = 10) {
    for (let i = 0; i < count; i++) {
      sparkles.push(new Sparkle(x + (Math.random() - 0.5) * 100, y + (Math.random() - 0.5) * 100));
    }
  }

  // Update player count display
  function updatePlayerCount() {
    const count = Object.keys(players).length;
    playerCountText.textContent = count;
    
    // Add some particles when players join/leave
    if (count > 0 && count % 5 === 0) {
      createParticleBurst(Math.random() * 1024, Math.random() * 600, 25, '#4a90e2');
    }
  }

  // Random fun events - INCREASED BY 5X!
  function triggerRandomEvent() {
    const events = [
      () => createParticleBurst(Math.random() * 1024, Math.random() * 600, 100, '#ffd700'), // Gold burst
      () => createParticleBurst(Math.random() * 1024, Math.random() * 600, 75, '#ff69b4'), // Pink burst
      () => createParticleBurst(Math.random() * 1024, Math.random() * 600, 60, '#4a90e2'), // Blue burst
      () => createSparkles(Math.random() * 1024, Math.random() * 600, 50), // Sparkle storm
      () => {
        // Multi-color explosion
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            createParticleBurst(Math.random() * 1024, Math.random() * 600, 40, `hsl(${Math.random() * 360}, 70%, 60%)`);
          }, i * 200);
        }
      }
    ];
    
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    randomEvent();
  }

  // Load available avatars from server
  async function loadAvatars() {
    try {
      const response = await fetch('/avatars');
      const avatarList = await response.json();
      
      // Clear existing avatars
      avatars.length = 0;
      avatarChoice.innerHTML = '';
      
      // Add each avatar to the list
      avatarList.forEach((avatar, index) => {
        const avatarObj = {
          file: avatar.filename,
          path: avatar.path,
          img: new Image(),
          isDefault: avatar.isDefault
        };
        
        avatarObj.img.src = avatar.path;
        avatars.push(avatarObj);
        
        // Create avatar option in UI
        const div = document.createElement('div');
        div.classList.add('avatar-option');
        const imgEl = document.createElement('img');
        imgEl.src = avatar.path;
        imgEl.alt = `Avatar ${index + 1}`;
        div.appendChild(imgEl);
        div.dataset.index = index;
        avatarChoice.appendChild(div);
      });
      
      updateAvatarSelection();
    } catch (error) {
      console.error('Error loading avatars:', error);
    }
  }

  function updateAvatarSelection() {
    const options = document.querySelectorAll('.avatar-option');
    options.forEach((opt) => opt.classList.remove('selected'));
    const selectedDiv = options[selectedAvatarIndex];
    if (selectedDiv) selectedDiv.classList.add('selected');
  }

  avatarChoice.addEventListener('click', (e) => {
    const target = e.target.closest('.avatar-option');
    if (!target) return;
    selectedAvatarIndex = parseInt(target.dataset.index, 10);
    updateAvatarSelection();
  });

  // Handle avatar upload
  uploadBtn.addEventListener('click', async () => {
    const file = avatarUpload.files[0];
    if (!file) {
      uploadStatus.textContent = 'Please select a file first';
      uploadStatus.className = 'error';
      return;
    }

    uploadBtn.disabled = true;
    uploadStatus.textContent = 'Uploading...';
    uploadStatus.className = '';

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await fetch('/upload-avatar', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        uploadStatus.textContent = 'Upload successful!';
        uploadStatus.className = 'success';
        
        // Reload avatars to include the new one
        await loadAvatars();
        
        // Select the newly uploaded avatar
        selectedAvatarIndex = avatars.length - 1;
        updateAvatarSelection();
        
        // Clear the file input
        avatarUpload.value = '';
      } else {
        const error = await response.json();
        uploadStatus.textContent = error.error || 'Upload failed';
        uploadStatus.className = 'error';
      }
    } catch (error) {
      uploadStatus.textContent = 'Upload failed: ' + error.message;
      uploadStatus.className = 'error';
    } finally {
      uploadBtn.disabled = false;
    }
  });

  // Handle start button click
  startBtn.addEventListener('click', () => {
    const name = usernameInput.value.trim();
    if (!name) {
      alert('Please enter your name');
      return;
    }
    if (avatars.length === 0) {
      alert('Please wait for avatars to load');
      return;
    }
    
    // Send new player message
    socket.emit('newPlayer', {
      name,
      avatar: avatars[selectedAvatarIndex].file
    });
    
    // Hide the login overlay and reveal the game
    loginScreen.classList.add('hidden');
    loginScreen.style.display = 'none';
    gameScreen.classList.remove('hidden');
    gameScreen.style.display = 'flex';
    
    // Initialize canvas scaling after game starts
    setTimeout(initCanvasScaling, 100);
  });

  // Keyboard input for movement
  const keys = {};
  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
  });
  window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
  });

  function handleMovement() {
    if (!myPlayer) return;
    const directions = [];
    if (keys['ArrowLeft'] || keys['a'] || keys['left']) directions.push('left');
    if (keys['ArrowRight'] || keys['d'] || keys['right']) directions.push('right');
    if (keys['ArrowUp'] || keys['w'] || keys['up']) directions.push('up');
    if (keys['ArrowDown'] || keys['s'] || keys['down']) directions.push('down');
    if (directions.length > 0) {
      socket.emit('move', directions[0]);
    }
    
    // Check for weapon pickups
    weapons.forEach(weapon => {
      const distance = Math.sqrt(
        (myPlayer.x - weapon.x) ** 2 + 
        (myPlayer.y - weapon.y) ** 2
      );
      
      if (distance < 50) {
        handleWeaponPickup(weapon);
      }
    });
  }

  // Chat form submission
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;
    socket.emit('chatMessage', message);
    chatInput.value = '';
  });

  // Update chat UI
  function addChatMessage(data) {
    const div = document.createElement('div');
    const nameSpan = document.createElement('span');
    nameSpan.classList.add('name');
    nameSpan.textContent = data.name + ':';
    div.appendChild(nameSpan);
    const textSpan = document.createElement('span');
    textSpan.textContent = ' ' + data.message;
    div.appendChild(textSpan);
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Show the message as a speech bubble above the sender's head
    if (data.id && players[data.id]) {
      players[data.id].speech = data.message;
      players[data.id].speechExpire = Date.now() + 5000;
      
      // Add particles for chat messages - INCREASED BY 5X!
      createParticleBurst(players[data.id].x + 32, players[data.id].y, 15, '#4caf50');
    } else {
      Object.keys(players).forEach((pid) => {
        const p = players[pid];
        if (p.name === data.name) {
          p.speech = data.message;
          p.speechExpire = Date.now() + 5000;
          createParticleBurst(p.x + 32, p.y, 15, '#4caf50');
        }
      });
    }
  }

  // Socket.io event handlers
  socket.on('currentPlayers', (serverPlayers) => {
    Object.keys(serverPlayers).forEach((id) => {
      players[id] = serverPlayers[id];
    });
    updatePlayerCount();
  });

  socket.on('playerData', (data) => {
    myId = socket.id;
    myPlayer = data;
    players[myId] = data;
    updatePlayerCount();
    
    // Welcome particle burst - INCREASED BY 5X!
    createParticleBurst(data.x + 32, data.y, 75, '#ff69b4');
  });

  socket.on('playerJoined', (data) => {
    players[data.id] = data.player;
    updatePlayerCount();
    
    // Welcome particles for new players - INCREASED BY 5X!
    createParticleBurst(data.player.x + 32, data.player.y, 50, '#4a90e2');
  });

  socket.on('playerLeft', (playerId) => {
    if (players[playerId]) {
      // Farewell particles - INCREASED BY 5X!
      createParticleBurst(players[playerId].x + 32, players[playerId].y, 40, '#f44336');
    }
    delete players[playerId];
    updatePlayerCount();
  });

  socket.on('playerMoved', (data) => {
    if (players[data.id]) {
      players[data.id].x = data.x;
      players[data.id].y = data.y;
    }
  });

  socket.on('chatMessage', (data) => {
    addChatMessage(data);
  });

  socket.on('emote', (data) => {
    if (data.id && players[data.id]) {
      players[data.id].emote = data.emote;
      players[data.id].emoteExpire = Date.now() + 3000;
      createEmoteParticles(data.x, data.y, data.emote);
    }
  });

  // Combat and weapon events
  socket.on('currentWeapons', (serverWeapons) => {
    weapons.length = 0;
    weapons.push(...serverWeapons);
  });

  socket.on('weaponSpawned', (weapon) => {
    weapons.push(weapon);
  });

  socket.on('weaponPickedUp', onWeaponPickedUp);

  socket.on('attack', onAttack);

  socket.on('playerRespawned', onPlayerRespawn);

  socket.on('weaponUpdate', (data) => {
    myWeapon = data.weapon;
    myWeaponDamage = data.damage;
    myWeaponRange = data.range;
    updateWeaponDisplay();
  });

  // Main draw loop
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background (centered to fill canvas)
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    
    // Draw weapons on the map
    weapons.forEach(weapon => {
      ctx.save();
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Draw weapon emoji
      ctx.fillText(weapon.emoji, weapon.x, weapon.y);
      
      // Draw weapon name
      ctx.font = '12px Trebuchet MS';
      ctx.fillStyle = '#ff69b4';
      ctx.fillText(weapon.type, weapon.x, weapon.y + 20);
      
      ctx.restore();
    });
    
    // Update and draw particles - INCREASED BY 5X!
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].draw(ctx);
      
      // Remove dead particles
      if (particles[i].life <= 0) {
        particles.splice(i, 1);
      }
    }
    
    // Update and draw sparkles
    for (let i = sparkles.length - 1; i >= 0; i--) {
      sparkles[i].update();
      sparkles[i].draw(ctx);
      
      // Remove dead sparkles
      if (sparkles[i].life <= 0) {
        sparkles.splice(i, 1);
      }
    }
    
    // Update and draw confetti
    for (let i = confettiPieces.length - 1; i >= 0; i--) {
      confettiPieces[i].update();
      confettiPieces[i].draw(ctx);
      
      // Remove dead confetti
      if (confettiPieces[i].life <= 0) {
        confettiPieces.splice(i, 1);
      }
    }
    
    // Draw all players
    Object.keys(players).forEach((id) => {
      const p = players[id];
      const avatarObj = avatars.find((a) => a.file === p.avatar);
      const img = avatarObj ? avatarObj.img : null;
      if (!img) return;
      
      // Apply damage flash effect
      if (p.damageFlash && Date.now() < p.damageFlash) {
        ctx.filter = 'brightness(1.5) saturate(2)';
      }
      
      // Draw name above head
      ctx.font = '14px Trebuchet MS';
      ctx.fillStyle = p.isDead ? '#666' : '#ff69b4';
      ctx.textAlign = 'center';
      ctx.fillText(p.name, p.x + 32, p.y - 10);
      
      // Draw health bar if player has taken damage or is dead
      if (p.health < p.maxHealth || p.isDead) {
        drawHealthBar(p);
      }
      
      // Draw avatar with dance animation if dancing
      ctx.save();
      if (p.dancing && !p.isDead) {
        ctx.translate(p.x + 32, p.y + 32);
        ctx.rotate(Math.sin(Date.now() * 0.01) * 0.1);
        ctx.translate(-(p.x + 32), -(p.y + 32));
      }
      
      // Draw avatar with death effect
      if (p.isDead) {
        ctx.globalAlpha = 0.5;
        ctx.filter = 'grayscale(1)';
      }
      
      ctx.drawImage(img, p.x, p.y, 64, 64);
      ctx.restore();
      
      // Draw weapon indicator
      if (!p.isDead && p.weapon !== 'Fists') {
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff4444';
        ctx.fillText(p.weapon === 'Sword' ? '⚔️' : 
                    p.weapon === 'Bow' ? '🏹' : 
                    p.weapon === 'Axe' ? '🪓' : 
                    p.weapon === 'Spear' ? '🔱' : 
                    p.weapon === 'Hammer' ? '🔨' : 
                    p.weapon === 'Dagger' ? '🗡️' : 
                    p.weapon === 'Staff' ? '🦯' : 
                    p.weapon === 'Crossbow' ? '🏹' : '⚔️', 
                    p.x + 32, p.y - 35);
      }

      // Draw speech bubble if player has a recent message
      if (p.speech && p.speechExpire && Date.now() < p.speechExpire) {
        drawSpeechBubble(p);
      }
      
      // Draw emote if player has a recent emote
      if (p.emote && p.emoteExpire && Date.now() < p.emoteExpire) {
        drawEmote(p);
      }
      
      // Reset filter
      ctx.filter = 'none';
    });
    
    // Movement is handled via discrete events but we continuously check keys
    handleMovement();
    requestAnimationFrame(draw);
  }

  /**
   * Draw a speech bubble for a player. The bubble appears above the player's
   * name and avatar, centred horizontally. It fades out when the speech
   * expiration time has passed.
   * @param {Object} p Player object with x, y, speech, speechExpire
   */
  function drawSpeechBubble(p) {
    const text = p.speech;
    ctx.font = '12px Trebuchet MS';
    const metrics = ctx.measureText(text);
    const padding = 6;
    const width = metrics.width + padding * 2;
    const height = 20 + padding * 2;
    // Position bubble above name
    const x = p.x + 32 - width / 2;
    const y = p.y - 35 - height;
    // Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    // Draw rounded rectangle
    const radius = 6;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Draw text
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + padding, y + height / 2);
  }

  /**
   * Draw an emote above a player's head
   * @param {Object} p Player object with x, y, emote, emoteExpire
   */
  function drawEmote(p) {
    const emote = p.emote;
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add some animation
    const timeLeft = p.emoteExpire - Date.now();
    const alpha = Math.min(1, timeLeft / 1000);
    ctx.globalAlpha = alpha;
    
    // Draw emote above player
    ctx.fillText(emote, p.x + 32, p.y - 50);
    
    ctx.globalAlpha = 1;
  }

  /**
   * Draw a health bar for a player
   * @param {Object} p Player object with x, y, health, maxHealth
   */
  function drawHealthBar(p) {
    const barWidth = 60;
    const barHeight = 6;
    const x = p.x + 32 - barWidth / 2;
    const y = p.y - 25;
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x, y, barWidth, barHeight);
    
    // Border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);
    
    // Health fill
    const healthPercent = p.health / p.maxHealth;
    const fillWidth = barWidth * healthPercent;
    
    if (healthPercent > 0.5) {
      ctx.fillStyle = '#4caf50'; // Green
    } else if (healthPercent > 0.25) {
      ctx.fillStyle = '#ff9800'; // Orange
    } else {
      ctx.fillStyle = '#f44336'; // Red
    }
    
    ctx.fillRect(x + 1, y + 1, fillWidth - 2, barHeight - 2);
  }

  // Handle window resize
  window.addEventListener('resize', () => {
    if (gameScreen.style.display !== 'none') {
      initCanvasScaling();
    }
  });

  // Random events every 20 seconds - MORE FREQUENT!
  setInterval(triggerRandomEvent, 20000);

  // Initialize the game
  loadAvatars().then(() => {
    // Initialize music, mobile controls, emote controls, and interactive features
    initMusic();
    initMobileControls();
    initEmoteControls();
    initInteractiveFeatures();
    initCombatControls(); // Initialize combat controls
    
    // Start the draw loop
    requestAnimationFrame(draw);
  });
})();