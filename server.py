"""
Club Sproto server implemented in Python using aiohttp.

This server hosts the static files that make up the Club Sproto browser
experience and coordinates real‑time state between clients via WebSockets.
Clients communicate with the server using a simple JSON protocol where
messages include a `type` field to describe the action. Supported
message types from clients include:

* newPlayer — sent when a client joins the game. Payload includes
  {name, avatar}.
* move — sent whenever a client moves. Payload contains a direction
  (left, right, up, down).
* chatMessage — sent when a client sends a chat. Payload contains
  {message}.

The server responds with broadcasts of game state updates to all
connected clients using message types such as:

* currentPlayers — sent only to newly joined clients to sync the
  existing player roster.
* playerData — sent only to the client who just joined with its own
  assigned id and initial position.
* playerJoined — broadcast when a new player joins. Includes id and
  player data.
* playerMoved — broadcast when any player moves. Includes id and
  new coordinates.
* playerLeft — broadcast when a player disconnects. Includes id.
* chatMessage — broadcast when a chat is sent. Includes id, name and
  message text.

The game world is a 1024×600 canvas. The server clamps positions so
players cannot leave the canvas. Player speed and spawn positioning
should mirror the values used on the client (see client.js).

To run the server locally, execute:

    python server.py

This will start an HTTP server on port 8000 by default. You can then
open http://localhost:8000 in a browser to join Club Sproto.
"""

import asyncio
import json
import random
import uuid
from aiohttp import web
import os


# In‑memory representation of players. Keys are player ids (strings),
# values are dicts with keys: name, avatar, x, y
players: dict[str, dict] = {}

# Mapping from player id to websocket. Used to send targeted messages.
websockets: dict[str, web.WebSocketResponse] = {}


def get_random_position() -> tuple[int, int]:
    """Return a random spawn position within bounds of the canvas.

    The canvas is 1024×600. We spawn players away from the edges to
    prevent them from immediately colliding or overlapping.
    """
    x = random.randint(200, 800)
    y = random.randint(200, 400)
    return x, y


async def broadcast(message: dict):
    """Send a JSON message to all connected players."""
    data = json.dumps(message)
    to_remove = []
    for pid, ws in websockets.items():
        try:
            await ws.send_str(data)
        except Exception:
            # If sending fails we schedule this websocket for removal
            to_remove.append(pid)
    # Clean up any dead connections
    for pid in to_remove:
        websockets.pop(pid, None)
        players.pop(pid, None)


async def websocket_handler(request: web.Request) -> web.WebSocketResponse:
    """Handle a new WebSocket connection from a client."""
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    player_id: str | None = None

    try:
        async for msg in ws:
            if msg.type == web.WSMsgType.TEXT:
                try:
                    data = json.loads(msg.data)
                except json.JSONDecodeError:
                    continue
                msg_type = data.get('type')
                # Handle new player joining
                if msg_type == 'newPlayer':
                    name = data.get('name', '').strip()
                    avatar = data.get('avatar', '')
                    if not name or not avatar:
                        continue
                    # Assign id and spawn position
                    player_id = str(uuid.uuid4())
                    x, y = get_random_position()
                    player_data = {
                        'name': name,
                        'avatar': avatar,
                        'x': x,
                        'y': y,
                    }
                    players[player_id] = player_data
                    websockets[player_id] = ws
                    # Send current roster to new player
                    await ws.send_str(json.dumps({
                        'type': 'currentPlayers',
                        'players': players,
                    }))
                    # Inform them of their own id and position
                    await ws.send_str(json.dumps({
                        'type': 'playerData',
                        'id': player_id,
                        'player': player_data,
                    }))
                    # Broadcast to others that a new player joined
                    await broadcast({
                        'type': 'playerJoined',
                        'id': player_id,
                        'player': player_data,
                    })
                elif msg_type == 'move' and player_id is not None:
                    direction = data.get('direction')
                    player = players.get(player_id)
                    if player is None:
                        continue
                    speed = 4
                    if direction == 'left':
                        player['x'] = max(0, player['x'] - speed)
                    elif direction == 'right':
                        player['x'] = min(1024 - 64, player['x'] + speed)
                    elif direction == 'up':
                        player['y'] = max(0, player['y'] - speed)
                    elif direction == 'down':
                        player['y'] = min(600 - 64, player['y'] + speed)
                    # Broadcast updated position
                    await broadcast({
                        'type': 'playerMoved',
                        'id': player_id,
                        'x': player['x'],
                        'y': player['y'],
                    })
                elif msg_type == 'chatMessage' and player_id is not None:
                    message = data.get('message', '').strip()
                    if not message:
                        continue
                    player = players.get(player_id)
                    if player is None:
                        continue
                    await broadcast({
                        'type': 'chatMessage',
                        'id': player_id,
                        'name': player['name'],
                        'message': message,
                    })
            elif msg.type == web.WSMsgType.ERROR:
                print(f'websocket connection closed with exception {ws.exception()}')
    finally:
        # On disconnect cleanup
        if player_id is not None and player_id in players:
            players.pop(player_id, None)
            websockets.pop(player_id, None)
            await broadcast({'type': 'playerLeft', 'id': player_id})
    return ws


async def init_app() -> web.Application:
    """Construct the aiohttp application."""
    app = web.Application()
    # Serve static files from the public folder. We explicitly add a handler
    # for the root path to serve index.html and host all other assets under
    # `/static`. This avoids 403 errors that can occur if the client
    # requests the directory root when `show_index=False`.
    current_dir = os.path.dirname(os.path.abspath(__file__))
    public_path = os.path.join(current_dir, 'public')

    async def index(request: web.Request) -> web.Response:
        index_file = os.path.join(public_path, 'index.html')
        return web.FileResponse(index_file)

    app.router.add_get('/', index)
    app.router.add_static('/static', public_path, show_index=False)
    app.router.add_get('/ws', websocket_handler)
    return app


def main():
    port = int(os.getenv('PORT', '8000'))
    app = asyncio.run(init_app())
    web.run_app(app, port=port)


if __name__ == '__main__':
    main()