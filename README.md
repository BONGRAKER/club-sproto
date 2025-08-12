# Club Sproto

A Club Penguin-style multiplayer game built with Node.js, Socket.io, and HTML5 Canvas.

## Features

- 🎮 Real-time multiplayer gameplay
- 👤 Custom avatar uploads
- 💬 Live chat system
- 🎨 Beautiful retro-style graphics
- 🌐 Web-based - no downloads required

## Local Development

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd club-sproto
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Deployment

### Option 1: Heroku (Recommended)

1. Create a Heroku account and install the Heroku CLI
2. Login to Heroku:
```bash
heroku login
```

3. Create a new Heroku app:
```bash
heroku create your-club-sproto-app
```

4. Deploy to Heroku:
```bash
git add .
git commit -m "Initial deployment"
git push heroku main
```

5. Open your app:
```bash
heroku open
```

### Option 2: Railway

1. Go to [Railway.app](https://railway.app)
2. Connect your GitHub repository
3. Deploy automatically

### Option 3: Render

1. Go to [Render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Set build command: `npm install`
5. Set start command: `npm start`

### Option 4: Vercel

1. Go to [Vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Deploy automatically

## Environment Variables

The following environment variables can be configured:

- `PORT`: The port to run the server on (default: 3000)

## Game Controls

- **Movement**: Arrow keys or WASD
- **Chat**: Type in the chat box and press Enter
- **Avatar Upload**: Click "Choose File" and select an image, then click "Upload Avatar"

## File Structure

```
club-sproto/
├── public/
│   ├── avatars/          # Default avatar images
│   ├── images/           # Game background and assets
│   ├── uploads/          # User-uploaded avatars
│   ├── index.html        # Main game page
│   ├── client.js         # Client-side game logic
│   └── style.css         # Game styling
├── server.js             # Node.js server with Socket.io
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Credits

- Inspired by Club Penguin
- Built with modern web technologies
- Avatar upload functionality for personalization 