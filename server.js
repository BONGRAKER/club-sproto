const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Enable CORS for all routes
app.use(cors());

// Serve static files from the public directory
app.use(express.static('public'));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Store players and their data
const players = {};

// Store weapons on the map
const weapons = [];

// Weapon types and their properties
const weaponTypes = [
  { name: 'Sword', emoji: '⚔️', damage: 25, range: 80 },
  { name: 'Bow', emoji: '🏹', damage: 20, range: 150 },
  { name: 'Axe', emoji: '🪓', damage: 35, range: 60 },
  { name: 'Spear', emoji: '🔱', damage: 30, range: 100 },
  { name: 'Hammer', emoji: '🔨', damage: 40, range: 50 },
  { name: 'Dagger', emoji: '🗡️', damage: 15, range: 40 },
  { name: 'Staff', emoji: '🦯', damage: 20, range: 90 },
  { name: 'Crossbow', emoji: '🏹', damage: 30, range: 120 }
];

// Spawn weapons randomly on the map
function spawnWeapon() {
  if (weapons.length < 10) { // Max 10 weapons on map
    const weaponType = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
    const weapon = {
      id: Date.now() + Math.random(),
      x: Math.random() * 900 + 50,
      y: Math.random() * 500 + 50,
      type: weaponType.name,
      emoji: weaponType.emoji,
      damage: weaponType.damage,
      range: weaponType.range
    };
    weapons.push(weapon);
    io.emit('weaponSpawned', weapon);
  }
}

// Spawn weapons periodically
setInterval(spawnWeapon, 10000); // Spawn weapon every 10 seconds

// Get random position for new players
function getRandomPosition() {
  return {
    x: Math.random() * 900 + 50,
    y: Math.random() * 500 + 50
  };
}

// Handle file upload
app.post('/upload-avatar', upload.single('avatar'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const filename = req.file.filename;
    const filepath = `/uploads/${filename}`;
    
    res.json({
      success: true,
      filename: filename,
      path: filepath
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get list of available avatars
app.get('/avatars', (req, res) => {
  try {
    const avatars = [];
    
    // Add default avatars
    const defaultAvatars = ['gremlin1.png', 'gremlin2.png', 'gremlin3.png'];
    defaultAvatars.forEach(filename => {
      avatars.push({
        filename: filename,
        path: `/avatars/${filename}`,
        isDefault: true
      });
    });
    
    // Add uploaded avatars
    const uploadsDir = path.join(__dirname, 'public', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      files.forEach(filename => {
        if (filename.match(/\.(jpg|jpeg|png|gif)$/i)) {
          avatars.push({
            filename: filename,
            path: `/uploads/${filename}`,
            isDefault: false
          });
        }
      });
    }
    
    res.json(avatars);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('a user connected', socket.id);

  // Handle new player joining
  socket.on('newPlayer', (data) => {
    const position = getRandomPosition();
    const player = {
      id: socket.id,
      name: data.name,
      avatar: data.avatar,
      x: position.x,
      y: position.y,
      health: 100,
      maxHealth: 100,
      weapon: 'Fists',
      weaponDamage: 10,
      weaponRange: 50,
      isDead: false,
      lastAttack: 0
    };
    
    players[socket.id] = player;
    
    // Send current player data to the new player
    socket.emit('playerData', player);
    
    // Send current players to the new player
    socket.emit('currentPlayers', players);
    
    // Send current weapons to the new player
    socket.emit('currentWeapons', weapons);
    
    // Broadcast new player to all other players
    socket.broadcast.emit('playerJoined', {
      id: socket.id,
      player: player
    });
  });

  // Handle player movement
  socket.on('move', (direction) => {
    const player = players[socket.id];
    if (!player || player.isDead) return;
    
    const speed = 5;
    switch (direction) {
      case 'up':
        player.y = Math.max(0, player.y - speed);
        break;
      case 'down':
        player.y = Math.min(600, player.y + speed);
        break;
      case 'left':
        player.x = Math.max(0, player.x - speed);
        break;
      case 'right':
        player.x = Math.min(1024, player.x + speed);
        break;
    }
    
    // Broadcast movement to ALL players including the one who moved
    io.emit('playerMoved', {
      id: socket.id,
      x: player.x,
      y: player.y
    });
  });

  // Handle chat messages
  socket.on('chatMessage', (message) => {
    const player = players[socket.id];
    if (!player) return;
    
    io.emit('chatMessage', {
      id: socket.id,
      name: player.name,
      message: message
    });
  });

  // Handle emote events. Broadcast to everyone including sender.
  socket.on('emote', (data) => {
    const player = players[socket.id];
    if (!player) return;
    io.emit('emote', {
      id: socket.id,
      emote: data.emote,
      x: data.x,
      y: data.y,
    });
  });

  // Handle weapon pickup
  socket.on('pickupWeapon', (weaponId) => {
    const player = players[socket.id];
    if (!player || player.isDead) return;
    
    const weaponIndex = weapons.findIndex(w => w.id === weaponId);
    if (weaponIndex !== -1) {
      const weapon = weapons[weaponIndex];
      const distance = Math.sqrt((player.x - weapon.x) ** 2 + (player.y - weapon.y) ** 2);
      
      if (distance < 50) { // Pickup range
        player.weapon = weapon.type;
        player.weaponDamage = weapon.damage;
        player.weaponRange = weapon.range;
        
        // Remove weapon from map
        weapons.splice(weaponIndex, 1);
        
        // Broadcast weapon pickup
        io.emit('weaponPickedUp', {
          playerId: socket.id,
          weaponId: weaponId,
          weapon: weapon
        });
        
        // Update player's weapon
        socket.emit('weaponUpdate', {
          weapon: weapon.type,
          damage: weapon.damage,
          range: weapon.range
        });
      }
    }
  });

  // Handle attack
  socket.on('attack', (targetId) => {
    const attacker = players[socket.id];
    const target = players[targetId];
    
    if (!attacker || !target || attacker.isDead || target.isDead) return;
    
    const now = Date.now();
    if (now - attacker.lastAttack < 1000) return; // Attack cooldown
    
    const distance = Math.sqrt((attacker.x - target.x) ** 2 + (attacker.y - target.y) ** 2);
    
    if (distance <= attacker.weaponRange) {
      // Attack hits
      attacker.lastAttack = now;
      target.health -= attacker.weaponDamage;
      
      if (target.health <= 0) {
        target.health = 0;
        target.isDead = true;
        
        // Respawn after 3 seconds
        setTimeout(() => {
          const position = getRandomPosition();
          target.x = position.x;
          target.y = position.y;
          target.health = target.maxHealth;
          target.isDead = false;
          target.weapon = 'Fists';
          target.weaponDamage = 10;
          target.weaponRange = 50;
          
          io.emit('playerRespawned', {
            id: targetId,
            player: target
          });
        }, 3000);
      }
      
      // Broadcast attack and damage
      io.emit('attack', {
        attackerId: socket.id,
        targetId: targetId,
        damage: attacker.weaponDamage,
        targetHealth: target.health,
        targetDead: target.isDead
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('user disconnected', socket.id);
    delete players[socket.id];
    io.emit('playerLeft', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Club Sproto server listening on port ${PORT}`);
});