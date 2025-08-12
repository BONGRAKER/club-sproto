const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');

/*
 * Club Sproto server
 *
 * This Node.js application spins up an HTTP server using Express and a
 * WebSocket server powered by socket.io. It serves static assets from the
 * `public` directory and coordinates real‑time player state and chat
 * messages between all connected clients. When a new user connects they
 * supply a username and choose an avatar or upload their own. The server
 * assigns a random starting position within the game world and keeps track
 * of all active players.
 */

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Enable CORS for cross-origin requests
app.use(cors());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Serve static files (HTML, CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// Avatar upload endpoint
app.post('/upload-avatar', upload.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  // Return the filename for the client to use
  res.json({ 
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`
  });
});

// Get list of available avatars (including uploaded ones)
app.get('/avatars', (req, res) => {
  const avatars = [];
  
  // Add default avatars
  const defaultAvatars = ['gremlin1.png', 'gremlin2.png', 'gremlin3.png'];
  defaultAvatars.forEach(avatar => {
    avatars.push({
      filename: avatar,
      path: `/avatars/${avatar}`,
      isDefault: true
    });
  });
  
  // Add uploaded avatars
  try {
    const files = fs.readdirSync(uploadsDir);
    files.forEach(file => {
      if (file.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        avatars.push({
          filename: file,
          path: `/uploads/${file}`,
          isDefault: false
        });
      }
    });
  } catch (error) {
    console.error('Error reading uploads directory:', error);
  }
  
  res.json(avatars);
});

// In memory store of connected players. Each entry is keyed by socket.id and
// contains the player's name, avatar filename, and position (x, y).
const players = {};

// Generate a random spawn position within the game world
function getRandomPosition() {
  // The canvas size on the client is 1024x600. Spawn near the centre but
  // allow some variation so players don't pile up on top of each other.
  const x = Math.floor(200 + Math.random() * 600);
  const y = Math.floor(200 + Math.random() * 200);
  return { x, y };
}

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);

  // When a new player joins send them the current roster
  socket.emit('currentPlayers', players);

  // Handle new player joining. Data should include { name, avatar }
  socket.on('newPlayer', (data) => {
    const { name, avatar } = data;
    const position = getRandomPosition();
    players[socket.id] = { name, avatar, x: position.x, y: position.y };
    // Inform the new player of their own position
    socket.emit('playerData', players[socket.id]);
    // Broadcast to all other clients that a new player has joined
    socket.broadcast.emit('playerJoined', {
      id: socket.id,
      player: players[socket.id],
    });
  });

  // Handle movement events from a client. The client sends a direction and
  // the server updates the corresponding player's position. Positions are
  // clamped to stay within the bounds of the canvas (0–1024 horizontally,
  // 0–600 vertically).
  socket.on('move', (dir) => {
    const player = players[socket.id];
    if (!player) return;
    const speed = 4;
    switch (dir) {
      case 'left':
        player.x = Math.max(0, player.x - speed);
        break;
      case 'right':
        player.x = Math.min(1024 - 64, player.x + speed);
        break;
      case 'up':
        player.y = Math.max(0, player.y - speed);
        break;
      case 'down':
        player.y = Math.min(600 - 64, player.y + speed);
        break;
    }
    // Broadcast the updated position to all clients
    io.emit('playerMoved', { id: socket.id, x: player.x, y: player.y });
  });

  // Handle chat messages. Broadcast to everyone including sender.
  socket.on('chatMessage', (msg) => {
    const player = players[socket.id];
    if (!player) return;
    io.emit('chatMessage', {
      id: socket.id,
      name: player.name,
      message: msg,
    });
  });

  // Handle disconnects. Remove the player and notify others.
  socket.on('disconnect', () => {
    console.log('user disconnected', socket.id);
    if (players[socket.id]) {
      io.emit('playerLeft', socket.id);
      delete players[socket.id];
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Club Sproto server listening on port ${PORT}`);
});