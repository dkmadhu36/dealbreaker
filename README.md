# Monopoly Deal - The Card Game

A multiplayer Monopoly Deal card game built with React Native (Expo) and FastAPI.

## Features

- Real-time multiplayer support (2-5 players)
- All 110 official Monopoly Deal cards
- Complete game rules implementation
- Beautiful animated card designs
- WebSocket-based real-time communication

## Getting Started

### Prerequisites

- Node.js 18+ 
- Python 3.9+
- Expo Go app on your mobile device

### Installation

1. **Install frontend dependencies:**
   ```bash
   cd deal-breaker
   npm install
   ```

2. **Set up backend:**
   ```bash
   cd backend
   chmod +x run.sh
   ./run.sh
   ```
   
   Or manually:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Running the App

1. **Start the backend server:**
   ```bash
   cd backend
   ./run.sh
   ```
   Note the IP address displayed (e.g., `192.168.1.xxx`)

2. **Start the Expo app:**
   ```bash
   cd deal-breaker
   npm start
   ```

3. **Connect from Expo Go:**
   - Open Expo Go on your phone
   - Scan the QR code
   - Enter your server IP in the app

### Connecting Multiple Devices

1. Make sure all devices are on the same WiFi network
2. Enter your computer's local IP address in the app
3. Create a room and share the 6-character room code

## How to Play

### Objective
Be the first player to collect **3 complete property sets** of different colors.

### Turn Structure
1. **Draw Phase:** Draw 2 cards (5 if your hand is empty)
2. **Action Phase:** Play up to 3 cards
3. **Discard Phase:** Discard down to 7 cards if needed

### Card Types

| Type | Description |
|------|-------------|
| **Property** | Build your property sets |
| **Money** | Add to your bank |
| **Action** | Special abilities (Rent, Steal, etc.) |
| **Rent** | Charge rent to other players |
| **Wildcard** | Use as any property color |

### Key Rules

- **No change given** - Overpayments are not refunded
- **Pay from table only** - Can't pay from your hand
- **Just Say No** - Cancels any action against you
- **Complete sets are protected** - Can't steal from them (except Deal Breaker)

## Project Structure

```
deal-breaker/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Main tab navigation
│   ├── lobby.tsx          # Game lobby
│   └── game.tsx           # Main game screen
├── backend/               # FastAPI backend
│   ├── main.py           # Server & endpoints
│   ├── game_engine.py    # Game logic
│   ├── models.py         # Data models
│   └── cards.py          # Card definitions
├── components/
│   ├── cards/            # Card components
│   └── game/             # Game UI components
├── constants/            # Game constants & card data
├── services/             # API & WebSocket services
└── stores/               # State management
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rooms` | Create a new room |
| POST | `/api/rooms/join` | Join an existing room |
| POST | `/api/rooms/{id}/ready` | Toggle ready status |
| POST | `/api/rooms/{id}/start` | Start the game |
| POST | `/api/games/{id}/draw` | Draw cards |
| POST | `/api/games/{id}/play` | Play a card |
| POST | `/api/games/{id}/respond` | Respond to action |
| POST | `/api/games/{id}/end-turn` | End your turn |
| WS | `/ws/{roomId}/{playerId}` | Real-time updates |

## Tech Stack

- **Frontend:** React Native (Expo), TypeScript, React Native Reanimated
- **Backend:** FastAPI, Python, WebSockets
- **State:** React Context + Reducer

## License

MIT License - Feel free to use and modify!
