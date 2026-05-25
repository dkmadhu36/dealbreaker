import uuid
import random
import string
from typing import Dict, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import json

from models import (
    RoomState, GameState, PlayerState, CreateRoomRequest, 
    JoinRoomRequest, PlayCardRequest, ResponseRequest, GamePhase,
    MoveWildcardRequest
)
from game_engine import GameEngine
from cards import CARDS_DATA, get_card_by_id

rooms: Dict[str, RoomState] = {}
games: Dict[str, GameEngine] = {}
connections: Dict[str, Dict[str, WebSocket]] = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Monopoly Deal Server Starting...")
    yield
    print("Monopoly Deal Server Shutting Down...")

app = FastAPI(title="Monopoly Deal API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def generate_room_code() -> str:
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

async def broadcast_to_room(room_id: str, message: dict, exclude: str = None):
    if room_id in connections:
        for player_id, ws in connections[room_id].items():
            if player_id != exclude:
                try:
                    await ws.send_json(message)
                except:
                    pass

async def send_game_state_to_all(room_id: str):
    if room_id not in games or room_id not in connections:
        return
    
    engine = games[room_id]
    disconnected = []
    for player_id, ws in list(connections[room_id].items()):
        try:
            state = engine.get_public_state(player_id)
            await ws.send_json({"type": "gameState", "data": state})
        except Exception as e:
            print(f"Failed to send game state to {player_id}: {e}")
            disconnected.append(player_id)
    
    for player_id in disconnected:
        if player_id in connections.get(room_id, {}):
            del connections[room_id][player_id]
            print(f"Removed disconnected player {player_id} from room {room_id}")


@app.get("/")
async def root():
    return {"message": "Monopoly Deal API", "status": "running"}

@app.get("/api/cards")
async def get_cards():
    return {"cards": CARDS_DATA}

@app.get("/api/cards/{card_id}")
async def get_card(card_id: str):
    card = get_card_by_id(card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card

@app.post("/api/rooms")
async def create_room(request: CreateRoomRequest):
    room_id = str(uuid.uuid4())
    room_code = generate_room_code()
    player_id = str(uuid.uuid4())
    
    player = PlayerState(
        id=player_id,
        name=request.playerName,
        isReady=False
    )
    
    room = RoomState(
        id=room_id,
        code=room_code,
        host=player_id,
        players=[player],
        maxPlayers=request.maxPlayers,
        status="waiting"
    )
    
    rooms[room_id] = room
    connections[room_id] = {}
    
    return {
        "roomId": room_id,
        "roomCode": room_code,
        "playerId": player_id,
        "room": room.model_dump()
    }

@app.post("/api/rooms/join")
async def join_room(request: JoinRoomRequest):
    room = None
    for r in rooms.values():
        if r.code == request.roomCode.upper():
            room = r
            break
    
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    if room.status != "waiting":
        raise HTTPException(status_code=400, detail="Game already started")
    
    if len(room.players) >= room.maxPlayers:
        raise HTTPException(status_code=400, detail="Room is full")
    
    player_id = str(uuid.uuid4())
    player = PlayerState(
        id=player_id,
        name=request.playerName,
        isReady=False
    )
    
    room.players.append(player)
    
    return {
        "roomId": room.id,
        "playerId": player_id,
        "room": room.model_dump()
    }

@app.get("/api/rooms/{room_id}")
async def get_room(room_id: str):
    if room_id not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    return rooms[room_id].model_dump()

@app.post("/api/rooms/{room_id}/ready")
async def toggle_ready(room_id: str, player_id: str):
    if room_id not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    
    room = rooms[room_id]
    for player in room.players:
        if player.id == player_id:
            player.isReady = not player.isReady
            break
    
    await broadcast_to_room(room_id, {
        "type": "playerReady",
        "playerId": player_id,
        "isReady": next((p.isReady for p in room.players if p.id == player_id), False),
        "room": room.model_dump()
    })
    
    return {"success": True, "room": room.model_dump()}

@app.post("/api/rooms/{room_id}/start")
async def start_game(room_id: str, player_id: str):
    if room_id not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    
    room = rooms[room_id]
    
    if room.host != player_id:
        raise HTTPException(status_code=403, detail="Only host can start the game")
    
    if len(room.players) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 players")
    
    if not all(p.isReady for p in room.players):
        raise HTTPException(status_code=400, detail="All players must be ready")
    
    game_state = GameState(
        id=str(uuid.uuid4()),
        roomId=room_id,
        players=[PlayerState(id=p.id, name=p.name) for p in room.players]
    )
    
    engine = GameEngine(game_state)
    engine.initialize_game()
    
    games[room_id] = engine
    room.status = "playing"
    room.gameState = game_state
    
    print(f"Game started! Room ID: {room_id}")
    print(f"Active games after start: {list(games.keys())}")
    
    await send_game_state_to_all(room_id)
    await broadcast_to_room(room_id, {"type": "gameStarted"})
    
    return {"success": True, "gameId": game_state.id}

@app.post("/api/games/{room_id}/draw")
async def draw_cards(room_id: str, player_id: str):
    if room_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    engine = games[room_id]
    drawn = engine.draw_cards(player_id)
    
    if not drawn:
        raise HTTPException(status_code=400, detail="Cannot draw cards")
    
    await send_game_state_to_all(room_id)
    
    return {"success": True, "drawn": drawn}

@app.post("/api/games/{room_id}/play")
async def play_card(room_id: str, player_id: str, request: PlayCardRequest):
    if room_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    engine = games[room_id]
    result = engine.play_card(
        player_id=player_id,
        card_id=request.cardId,
        as_bank=request.asBank,
        target_player_id=request.targetPlayerId,
        target_card_id=request.targetCardId,
        target_color=request.targetColor,
        giver_card_id=request.giverCardId,
        double_rent=request.doubleRent,
        double_rent_card_id=request.doubleRentCardId
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to play card"))
    
    await send_game_state_to_all(room_id)
    await broadcast_to_room(room_id, {
        "type": "cardPlayed",
        "playerId": player_id,
        "cardId": request.cardId,
        "result": result
    })
    
    return result

@app.post("/api/games/{room_id}/respond")
async def respond_to_action(room_id: str, player_id: str, request: ResponseRequest):
    if room_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    engine = games[room_id]
    result = engine.respond_to_action(
        player_id=player_id,
        response_type=request.type,
        card_ids=request.cardIds
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to respond"))
    
    await send_game_state_to_all(room_id)
    
    return result

@app.post("/api/games/{room_id}/end-turn")
async def end_turn(room_id: str, player_id: str):
    if room_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    engine = games[room_id]
    result = engine.end_turn(player_id)
    
    if not result.get("success") and "excess" not in result:
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to end turn"))
    
    await send_game_state_to_all(room_id)
    
    if result.get("winner"):
        await broadcast_to_room(room_id, {
            "type": "gameOver",
            "winner": result["winner"]
        })
    
    return result

@app.post("/api/games/{room_id}/discard")
async def discard_cards(room_id: str, player_id: str, card_ids: List[str]):
    if room_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    engine = games[room_id]
    result = engine.discard_cards(player_id, card_ids)
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to discard"))
    
    await send_game_state_to_all(room_id)
    
    return result

@app.post("/api/games/{room_id}/move-wildcard")
async def move_wildcard(room_id: str, player_id: str, request: MoveWildcardRequest):
    if room_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    engine = games[room_id]
    result = engine.move_wildcard(
        player_id=player_id,
        card_id=request.cardId,
        from_color=request.fromColor,
        to_color=request.toColor
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to move wildcard"))
    
    await send_game_state_to_all(room_id)
    
    return result

@app.get("/api/games/{room_id}/payment-info")
async def get_payment_info(room_id: str, player_id: str):
    if room_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    engine = games[room_id]
    result = engine.get_payment_info(player_id)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result

@app.post("/api/games/{room_id}/timeout")
async def handle_timeout(room_id: str, player_id: str):
    print(f"Timeout requested for room: {room_id}, player: {player_id}")
    print(f"Active games: {list(games.keys())}")
    
    if room_id not in games:
        raise HTTPException(status_code=404, detail=f"Game not found. Room ID: {room_id}")
    
    engine = games[room_id]
    result = engine.handle_timeout(player_id)
    
    await send_game_state_to_all(room_id)
    await broadcast_to_room(room_id, {
        "type": "turnTimeout",
        "playerId": player_id,
        "actions": result.get("timeout_actions", [])
    })
    
    if result.get("winner"):
        await broadcast_to_room(room_id, {
            "type": "gameOver",
            "winner": result["winner"]
        })
    
    return result


@app.websocket("/ws/{room_id}/{player_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, player_id: str):
    await websocket.accept()
    
    if room_id not in connections:
        connections[room_id] = {}
    connections[room_id][player_id] = websocket
    
    if room_id in rooms:
        for player in rooms[room_id].players:
            if player.id == player_id:
                player.isConnected = True
                break
    
    await broadcast_to_room(room_id, {
        "type": "playerConnected",
        "playerId": player_id
    }, exclude=player_id)
    
    if room_id in rooms:
        await websocket.send_json({
            "type": "roomState",
            "data": rooms[room_id].model_dump()
        })
    
    if room_id in games:
        state = games[room_id].get_public_state(player_id)
        await websocket.send_json({
            "type": "gameState",
            "data": state
        })
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
            
            elif message.get("type") == "chat":
                await broadcast_to_room(room_id, {
                    "type": "chat",
                    "playerId": player_id,
                    "message": message.get("message", "")
                })
    
    except WebSocketDisconnect:
        if room_id in connections and player_id in connections[room_id]:
            del connections[room_id][player_id]
        
        if room_id in rooms:
            for player in rooms[room_id].players:
                if player.id == player_id:
                    player.isConnected = False
                    break
        
        await broadcast_to_room(room_id, {
            "type": "playerDisconnected",
            "playerId": player_id
        })


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
