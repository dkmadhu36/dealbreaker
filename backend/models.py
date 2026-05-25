from pydantic import BaseModel
from typing import Optional, Literal
from enum import Enum

class PropertyColor(str, Enum):
    BROWN = "brown"
    LIGHT_BLUE = "lightBlue"
    PINK = "pink"
    ORANGE = "orange"
    RED = "red"
    YELLOW = "yellow"
    GREEN = "green"
    DARK_BLUE = "darkBlue"
    RAILROAD = "railroad"
    UTILITY = "utility"

class CardType(str, Enum):
    PROPERTY = "property"
    ACTION = "action"
    MONEY = "money"
    RENT = "rent"
    WILDCARD = "wildcard"

class ActionType(str, Enum):
    DEAL_BREAKER = "dealBreaker"
    SLY_DEAL = "slyDeal"
    FORCED_DEAL = "forcedDeal"
    JUST_SAY_NO = "justSayNo"
    DEBT_COLLECTOR = "debtCollector"
    BIRTHDAY = "birthday"
    PASS_GO = "passGo"
    HOUSE = "house"
    HOTEL = "hotel"
    DOUBLE_RENT = "doubleRent"
    RENT = "rent"

class Card(BaseModel):
    id: str
    type: CardType
    name: str
    value: int

class PropertyCard(Card):
    color: PropertyColor
    rentValues: list[int]

class ActionCard(Card):
    actionType: ActionType

class WildCard(Card):
    colors: list[PropertyColor]
    currentColor: Optional[PropertyColor] = None

class RentCard(Card):
    colors: list[PropertyColor]

class MoneyCard(Card):
    pass

class PropertySet(BaseModel):
    color: PropertyColor
    cards: list[str]
    house: bool = False
    hotel: bool = False

    @property
    def isComplete(self) -> bool:
        required = SET_SIZES.get(self.color, 3)
        return len(self.cards) >= required

class PlayerState(BaseModel):
    id: str
    name: str
    hand: list[str] = []
    bank: list[str] = []
    properties: list[PropertySet] = []
    isConnected: bool = True
    isReady: bool = False

class GamePhase(str, Enum):
    WAITING = "waiting"
    DRAW = "draw"
    ACTION = "action"
    RESPONSE = "response"
    PAYMENT = "payment"
    DISCARD = "discard"
    FINISHED = "finished"

class TurnState(BaseModel):
    playerId: str
    cardsPlayed: int = 0
    cardsDrawn: bool = False

class PendingAction(BaseModel):
    type: ActionType
    fromPlayer: str
    targetPlayers: list[str]
    amount: Optional[int] = None
    targetProperty: Optional[str] = None
    giverProperty: Optional[str] = None
    targetSet: Optional[PropertyColor] = None
    responses: dict[str, dict] = {}

class GameState(BaseModel):
    id: str
    roomId: str
    players: list[PlayerState] = []
    currentPlayerIndex: int = 0
    turnNumber: int = 1
    phase: GamePhase = GamePhase.WAITING
    drawPile: list[str] = []
    discardPile: list[str] = []
    currentTurn: Optional[TurnState] = None
    pendingAction: Optional[PendingAction] = None
    winner: Optional[str] = None

class RoomState(BaseModel):
    id: str
    code: str
    host: str
    players: list[PlayerState] = []
    maxPlayers: int = 4
    status: Literal["waiting", "playing", "finished"] = "waiting"
    gameState: Optional[GameState] = None

class CreateRoomRequest(BaseModel):
    playerName: str
    maxPlayers: int = 4

class JoinRoomRequest(BaseModel):
    playerName: str
    roomCode: str

class PlayCardRequest(BaseModel):
    cardId: str
    targetPlayerId: Optional[str] = None
    targetCardId: Optional[str] = None
    targetColor: Optional[PropertyColor] = None
    giverCardId: Optional[str] = None
    asBank: bool = False
    doubleRent: bool = False
    doubleRentCardId: Optional[str] = None

class ResponseRequest(BaseModel):
    type: Literal["pay", "justSayNo", "accept"]
    cardIds: list[str] = []

SET_SIZES = {
    PropertyColor.BROWN: 2,
    PropertyColor.DARK_BLUE: 2,
    PropertyColor.UTILITY: 2,
    PropertyColor.LIGHT_BLUE: 3,
    PropertyColor.PINK: 3,
    PropertyColor.ORANGE: 3,
    PropertyColor.RED: 3,
    PropertyColor.YELLOW: 3,
    PropertyColor.GREEN: 3,
    PropertyColor.RAILROAD: 4,
}

RENT_VALUES = {
    PropertyColor.BROWN: [1, 2],
    PropertyColor.LIGHT_BLUE: [1, 2, 3],
    PropertyColor.PINK: [1, 2, 4],
    PropertyColor.ORANGE: [1, 3, 5],
    PropertyColor.RED: [2, 3, 6],
    PropertyColor.YELLOW: [2, 4, 6],
    PropertyColor.GREEN: [2, 4, 7],
    PropertyColor.DARK_BLUE: [3, 8],
    PropertyColor.RAILROAD: [1, 2, 3, 4],
    PropertyColor.UTILITY: [1, 2],
}

class MoveWildcardRequest(BaseModel):
    cardId: str
    fromColor: str
    toColor: str
