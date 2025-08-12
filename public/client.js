/*
 * Client‑side logic for Club Sproto.
 *
 * This script handles the login flow, real‑time networking via socket.io,
 * drawing the game world onto a canvas, movement control, chat, avatar uploads,
 * mobile controls, and background music.
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
  
  // Music elements
  const bgMusic = document.getElementById('bgMusic');
  const musicToggle = document.getElementById('musicToggle');
  const volumeSlider = document.getElementById('volumeSlider');
  
  // Mobile control elements
  const upBtn = document.getElementById('upBtn');
  const downBtn = document.getElementById('downBtn');
  const leftBtn = document.getElementById('leftBtn');
  const rightBtn = document.getElementById('rightBtn');

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

  // Initialize canvas scaling
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
      // On desktop, maintain aspect ratio
      canvasScale = Math.min(containerWidth / 1024, containerHeight / 600);
    }
    
    canvasOffsetX = (containerWidth - 1024 * canvasScale) / 2;
    canvasOffsetY = (containerHeight - 600 * canvasScale) / 2;
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
    } else {
      Object.keys(players).forEach((pid) => {
        const p = players[pid];
        if (p.name === data.name) {
          p.speech = data.message;
          p.speechExpire = Date.now() + 5000;
        }
      });
    }
  }

  // Socket.io event handlers
  socket.on('currentPlayers', (serverPlayers) => {
    Object.keys(serverPlayers).forEach((id) => {
      players[id] = serverPlayers[id];
    });
  });

  socket.on('playerData', (data) => {
    myId = socket.id;
    myPlayer = data;
    players[myId] = data;
  });

  socket.on('playerJoined', (data) => {
    players[data.id] = data.player;
  });

  socket.on('playerLeft', (playerId) => {
    delete players[playerId];
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

  // Main draw loop
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply canvas scaling
    ctx.save();
    ctx.scale(canvasScale, canvasScale);
    ctx.translate(canvasOffsetX / canvasScale, canvasOffsetY / canvasScale);
    
    // Draw background (centered to fill canvas)
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    
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
    });
    
    ctx.restore();
    
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

  // Handle window resize
  window.addEventListener('resize', () => {
    if (gameScreen.style.display !== 'none') {
      initCanvasScaling();
    }
  });

  // Initialize the game
  loadAvatars().then(() => {
    // Initialize music and mobile controls
    initMusic();
    initMobileControls();
    
    // Start the draw loop
    requestAnimationFrame(draw);
  });
})();