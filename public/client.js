/*
 * Client‑side logic for Club Sproto.
 *
 * This script handles the login flow, real‑time networking via socket.io,
 * drawing the game world onto a canvas, movement control, chat, avatar uploads,
 * mobile controls, background music, particle effects, and EMOTES!
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
      const emoteControls = emotePanel.querySelectorAll('button');
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

  // Main draw loop
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background (centered to fill canvas)
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    
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
    
    // Draw all players
    Object.keys(players).forEach((id) => {
      const p = players[id];
      const avatarObj = avatars.find((a) => a.file === p.avatar);
      const img = avatarObj ? avatarObj.img : null;
      if (!img) return;
      
      // Draw name above head
      ctx.font = '14px Trebuchet MS';
      ctx.fillStyle = '#ff69b4';
      ctx.textAlign = 'center';
      ctx.fillText(p.name, p.x + 32, p.y - 10);
      
      // Draw avatar; scale to 64x64
      ctx.drawImage(img, p.x, p.y, 64, 64);

      // Draw speech bubble if player has a recent message
      if (p.speech && p.speechExpire && Date.now() < p.speechExpire) {
        drawSpeechBubble(p);
      }
      
      // Draw emote if player has a recent emote
      if (p.emote && p.emoteExpire && Date.now() < p.emoteExpire) {
        drawEmote(p);
      }
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
    // Initialize music, mobile controls, and emote controls
    initMusic();
    initMobileControls();
    initEmoteControls();
    
    // Start the draw loop
    requestAnimationFrame(draw);
  });
})();