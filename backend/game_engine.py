import random
import time
from typing import Optional
from models import (
    GameState, PlayerState, PropertySet, TurnState, PendingAction,
    GamePhase, PropertyColor, ActionType, SET_SIZES, RENT_VALUES
)
from cards import CARDS_DATA, get_card_by_id

TURN_TIME_LIMIT = 60  # seconds

class GameEngine:
    def __init__(self, game_state: GameState):
        self.state = game_state
        self.cards_map = {card["id"]: card for card in CARDS_DATA}
    
    def initialize_game(self):
        """Shuffle deck and deal 5 cards to each player"""
        all_card_ids = [card["id"] for card in CARDS_DATA]
        random.shuffle(all_card_ids)
        
        for player in self.state.players:
            player.hand = all_card_ids[:5]
            all_card_ids = all_card_ids[5:]
            player.bank = []
            player.properties = []
        
        self.state.drawPile = all_card_ids
        self.state.discardPile = []
        self.state.phase = GamePhase.DRAW
        self.state.currentPlayerIndex = 0
        self.state.turnNumber = 1
        self.state.currentTurn = TurnState(
            playerId=self.state.players[0].id,
            cardsPlayed=0,
            cardsDrawn=False
        )
        return self.state
    
    def get_current_player(self) -> PlayerState:
        return self.state.players[self.state.currentPlayerIndex]
    
    def draw_cards(self, player_id: str) -> list[str]:
        """Draw 2 cards (or 5 if hand is empty)"""
        player = self._get_player(player_id)
        if not player or self.state.currentTurn.playerId != player_id:
            return []
        
        if self.state.currentTurn.cardsDrawn:
            return []
        
        num_to_draw = 5 if len(player.hand) == 0 else 2
        drawn = self._draw_cards_internal(player, num_to_draw)
        
        self.state.currentTurn.cardsDrawn = True
        self.state.phase = GamePhase.ACTION
        return drawn
    
    def _draw_cards_internal(self, player: PlayerState, count: int) -> list[str]:
        """Internal method to draw cards"""
        drawn = []
        for _ in range(count):
            if self.state.drawPile:
                card_id = self.state.drawPile.pop(0)
                player.hand.append(card_id)
                drawn.append(card_id)
            elif self.state.discardPile:
                random.shuffle(self.state.discardPile)
                self.state.drawPile = self.state.discardPile
                self.state.discardPile = []
                if self.state.drawPile:
                    card_id = self.state.drawPile.pop(0)
                    player.hand.append(card_id)
                    drawn.append(card_id)
        return drawn
    
    def play_card(self, player_id: str, card_id: str, as_bank: bool = False,
                  target_player_id: Optional[str] = None,
                  target_card_id: Optional[str] = None,
                  target_color: Optional[PropertyColor] = None,
                  giver_card_id: Optional[str] = None,
                  double_rent: bool = False,
                  double_rent_card_id: Optional[str] = None) -> dict:
        """Play a card from hand"""
        player = self._get_player(player_id)
        if not player or self.state.currentTurn.playerId != player_id:
            return {"success": False, "error": "Not your turn"}
        
        if self.state.phase in (GamePhase.RESPONSE, GamePhase.PAYMENT):
            return {"success": False, "error": "Cannot play cards while waiting for a response. Wait for all players to respond."}
        
        if not self.state.currentTurn.cardsDrawn:
            return {"success": False, "error": "Must draw cards first before playing. Tap the draw pile to draw 2 cards."}
        
        if self.state.currentTurn.cardsPlayed >= 3:
            return {"success": False, "error": "Already played 3 cards. Your turn has ended."}
        
        if card_id not in player.hand:
            return {"success": False, "error": "Card not in hand"}
        
        card = self.cards_map.get(card_id)
        if not card:
            return {"success": False, "error": "Card not found"}
        
        player.hand.remove(card_id)
        
        if as_bank:
            player.bank.append(card_id)
            self.state.currentTurn.cardsPlayed += 1
            result = {"success": True, "action": "banked", "value": card["value"]}
            self._check_auto_end_turn(player_id)
            return result
        
        card_type = card["type"]
        
        if card_type == "property":
            self._add_property_to_player(player, card_id, card["color"])
            self.state.currentTurn.cardsPlayed += 1
            result = {"success": True, "action": "property_played"}
            self._check_auto_end_turn(player_id)
            return result
        
        elif card_type == "wildcard":
            if not target_color:
                target_color = card["colors"][0]
            self._add_property_to_player(player, card_id, target_color)
            self.state.currentTurn.cardsPlayed += 1
            result = {"success": True, "action": "wildcard_played", "color": target_color}
            self._check_auto_end_turn(player_id)
            return result
        
        elif card_type == "money":
            player.bank.append(card_id)
            self.state.currentTurn.cardsPlayed += 1
            result = {"success": True, "action": "money_banked", "value": card["value"]}
            self._check_auto_end_turn(player_id)
            return result
        
        elif card_type == "action":
            return self._handle_action_card(player, card_id, card, target_player_id, target_card_id, target_color, giver_card_id)
        
        elif card_type == "rent":
            return self._handle_rent_card(player, card_id, card, target_color, target_player_id, double_rent, double_rent_card_id)
        
        return {"success": False, "error": "Unknown card type"}
    
    def _handle_action_card(self, player: PlayerState, card_id: str, card: dict,
                           target_player_id: Optional[str],
                           target_card_id: Optional[str],
                           target_color: Optional[PropertyColor],
                           giver_card_id: Optional[str] = None) -> dict:
        """Handle playing an action card"""
        action_type = card["actionType"]
        
        if action_type == "passGo":
            current_hand_size = len(player.hand)
            cards_played = self.state.currentTurn.cardsPlayed
            remaining_plays_after = 3 - cards_played - 1
            
            hand_after_pass_go = current_hand_size + 2
            final_hand_size = hand_after_pass_go - remaining_plays_after
            
            if final_hand_size > 7:
                player.hand.append(card_id)
                plays_needed = hand_after_pass_go - 7
                return {
                    "success": False, 
                    "error": f"Cannot use Pass Go now. After drawing 2 cards, you would have {hand_after_pass_go} cards. "
                             f"You only have {remaining_plays_after} plays left, so you'd end with {final_hand_size} cards (max 7). "
                             f"Play {plays_needed} more card(s) first, or bank this card for $1M."
                }
            
            self.state.discardPile.append(card_id)
            drawn = self._draw_cards_internal(player, 2)
            self.state.currentTurn.cardsPlayed += 1
            result = {"success": True, "action": "pass_go", "drawn": drawn}
            self._check_auto_end_turn(player.id)
            return result
        
        self.state.discardPile.append(card_id)
        
        if action_type == "birthday":
            players_with_assets = []
            for p in self.state.players:
                if p.id != player.id and self._get_player_table_value(p) > 0:
                    players_with_assets.append(p.id)
            
            if not players_with_assets:
                self.state.currentTurn.cardsPlayed += 1
                result = {"success": True, "action": "birthday", "message": "No players have assets to pay"}
                self._check_auto_end_turn(player.id)
                return result
            
            self.state.pendingAction = PendingAction(
                type=ActionType.BIRTHDAY,
                fromPlayer=player.id,
                targetPlayers=players_with_assets,
                amount=2
            )
            self.state.phase = GamePhase.PAYMENT
            self.state.currentTurn.cardsPlayed += 1
            return {"success": True, "action": "birthday", "waiting_for": players_with_assets, "amount": 2}
        
        elif action_type == "debtCollector":
            if not target_player_id:
                player.hand.append(card_id)
                self.state.discardPile.pop()
                return {"success": False, "error": "Must select a player to collect debt from. Choose an opponent."}
            
            target_player = self._get_player(target_player_id)
            if self._get_player_table_value(target_player) == 0:
                self.state.currentTurn.cardsPlayed += 1
                result = {"success": True, "action": "debt_collector", "message": "Target player has no assets to pay"}
                self._check_auto_end_turn(player.id)
                return result
            
            self.state.pendingAction = PendingAction(
                type=ActionType.DEBT_COLLECTOR,
                fromPlayer=player.id,
                targetPlayers=[target_player_id],
                amount=5
            )
            self.state.phase = GamePhase.PAYMENT
            self.state.currentTurn.cardsPlayed += 1
            return {"success": True, "action": "debt_collector", "target": target_player_id, "amount": 5}
        
        elif action_type == "slyDeal":
            if not target_player_id or not target_card_id:
                player.hand.append(card_id)
                self.state.discardPile.pop()
                return {"success": False, "error": "Must select a player and a property card to steal. Cannot steal from complete sets."}
            
            target_player = self._get_player(target_player_id)
            if not self._can_steal_property(target_player, target_card_id):
                player.hand.append(card_id)
                self.state.discardPile.pop()
                return {"success": False, "error": "Cannot steal from a complete property set. Choose a property from an incomplete set."}
            
            self.state.currentTurn.cardsPlayed += 1
            
            if self._find_just_say_no(target_player):
                self.state.pendingAction = PendingAction(
                    type=ActionType.SLY_DEAL,
                    fromPlayer=player.id,
                    targetPlayers=[target_player_id],
                    targetProperty=target_card_id
                )
                self.state.phase = GamePhase.RESPONSE
                return {"success": True, "action": "sly_deal", "target": target_player_id, "waiting": True}
            else:
                self._steal_property(player, target_player, target_card_id)
                if self._check_and_set_winner():
                    return {"success": True, "action": "sly_deal", "stolen": target_card_id, "winner": self.state.winner}
                self._check_auto_end_turn(player.id)
                return {"success": True, "action": "sly_deal", "target": target_player_id, "stolen": target_card_id}
        
        elif action_type == "forcedDeal":
            if not target_player_id or not target_card_id or not giver_card_id:
                player.hand.append(card_id)
                self.state.discardPile.pop()
                return {"success": False, "error": "Must select your property to give and an opponent's property to take."}
            
            if not any(giver_card_id in ps.cards for ps in player.properties):
                player.hand.append(card_id)
                self.state.discardPile.pop()
                return {"success": False, "error": "You must select a property you own to swap."}
            
            if self._is_property_in_complete_set(player, giver_card_id):
                player.hand.append(card_id)
                self.state.discardPile.pop()
                return {"success": False, "error": "Cannot swap a property from your complete set."}
            
            target_player = self._get_player(target_player_id)
            if not self._can_steal_property(target_player, target_card_id):
                player.hand.append(card_id)
                self.state.discardPile.pop()
                return {"success": False, "error": "Cannot take from a complete property set. Choose a property from an incomplete set."}
            
            self.state.currentTurn.cardsPlayed += 1
            
            if self._find_just_say_no(target_player):
                self.state.pendingAction = PendingAction(
                    type=ActionType.FORCED_DEAL,
                    fromPlayer=player.id,
                    targetPlayers=[target_player_id],
                    targetProperty=target_card_id,
                    giverProperty=giver_card_id
                )
                self.state.phase = GamePhase.RESPONSE
                return {"success": True, "action": "forced_deal", "waiting": True}
            else:
                self._swap_properties(player, target_player, giver_card_id, target_card_id)
                if self._check_and_set_winner():
                    return {"success": True, "action": "forced_deal", "swapped": True, "winner": self.state.winner}
                self._check_auto_end_turn(player.id)
                return {"success": True, "action": "forced_deal", "swapped": True}
        
        elif action_type == "dealBreaker":
            if not target_player_id or not target_color:
                player.hand.append(card_id)
                self.state.discardPile.pop()
                return {"success": False, "error": "Must select a player and a COMPLETE property set to steal. This card only works on complete sets."}
            
            target_player = self._get_player(target_player_id)
            target_set = self._get_property_set(target_player, target_color)
            if not target_set or not self._is_set_complete(target_set, target_color):
                player.hand.append(card_id)
                self.state.discardPile.pop()
                return {"success": False, "error": "Target set is not complete. Deal Breaker can only steal COMPLETE property sets."}
            
            self.state.pendingAction = PendingAction(
                type=ActionType.DEAL_BREAKER,
                fromPlayer=player.id,
                targetPlayers=[target_player_id],
                targetSet=target_color
            )
            self.state.phase = GamePhase.RESPONSE
            self.state.currentTurn.cardsPlayed += 1
            return {"success": True, "action": "deal_breaker"}
        
        elif action_type == "house":
            if not target_color:
                player.hand.append(card_id)
                self.state.discardPile.pop()
                return {"success": False, "error": "Must select a COMPLETE property set to add the house to. Houses add +$3M rent."}
            prop_set = self._get_property_set(player, target_color)
            if not prop_set or not self._is_set_complete(prop_set, target_color):
                player.hand.append(card_id)
                self.state.discardPile.pop()
                return {"success": False, "error": "Can only add a house to a COMPLETE property set."}
            if target_color in [PropertyColor.RAILROAD, PropertyColor.UTILITY]:
                player.hand.append(card_id)
                self.state.discardPile.pop()
                return {"success": False, "error": "Cannot add house to Railroad or Utility sets."}
            if prop_set.house:
                player.hand.append(card_id)
                self.state.discardPile.pop()
                return {"success": False, "error": "This set already has a house. Add a hotel next!"}
            prop_set.house = True
            self.state.currentTurn.cardsPlayed += 1
            result = {"success": True, "action": "house_added"}
            self._check_auto_end_turn(player.id)
            return result
        
        elif action_type == "hotel":
            if not target_color:
                player.hand.append(card_id)
                self.state.discardPile.pop()
                return {"success": False, "error": "Must select a property set WITH A HOUSE to add the hotel to. Hotels add +$4M rent."}
            prop_set = self._get_property_set(player, target_color)
            if not prop_set or not prop_set.house:
                player.hand.append(card_id)
                self.state.discardPile.pop()
                return {"success": False, "error": "Must add a house BEFORE adding a hotel."}
            if prop_set.hotel:
                player.hand.append(card_id)
                self.state.discardPile.pop()
                return {"success": False, "error": "This set already has a hotel."}
            prop_set.hotel = True
            self.state.currentTurn.cardsPlayed += 1
            result = {"success": True, "action": "hotel_added"}
            self._check_auto_end_turn(player.id)
            return result
        
        elif action_type == "doubleRent":
            player.hand.append(card_id)
            self.state.discardPile.pop()
            return {"success": False, "error": "Double Rent must be played WITH a Rent card in the same turn. Play a Rent card first."}
        
        elif action_type == "justSayNo":
            player.hand.append(card_id)
            self.state.discardPile.pop()
            return {"success": False, "error": "Just Say No can only be used to BLOCK an action against you. Wait until someone targets you."}
        
        return {"success": False, "error": "Action not implemented"}
    
    def _handle_rent_card(self, player: PlayerState, card_id: str, card: dict,
                         target_color: Optional[PropertyColor],
                         target_player_id: Optional[str] = None,
                         double_rent: bool = False,
                         double_rent_card_id: Optional[str] = None) -> dict:
        """Handle playing a rent card"""
        card_colors = card.get("colors", [])
        is_wild_rent = len(card_colors) > 2
        
        print(f"Rent card played: {card_id}, colors={card_colors}, is_wild={is_wild_rent}")
        print(f"target_color={target_color}, target_player_id={target_player_id}")
        print(f"double_rent={double_rent}, double_rent_card_id={double_rent_card_id}")
        print(f"Player properties: {[(ps.color, [c for c in ps.cards]) for ps in player.properties]}")
        
        # Validate double rent usage
        if double_rent:
            if not double_rent_card_id:
                player.hand.append(card_id)
                return {"success": False, "error": "Double Rent card ID is required when using double rent"}
            if double_rent_card_id not in player.hand:
                player.hand.append(card_id)
                return {"success": False, "error": "Double Rent card not in hand"}
            # Check if player has enough plays left (need 2 plays for rent + double rent)
            if self.state.currentTurn.cardsPlayed >= 2:
                player.hand.append(card_id)
                return {"success": False, "error": "Cannot use Double Rent - would exceed 3 card limit per turn"}
        
        # Wild rent requires selecting a specific opponent
        if is_wild_rent and not target_player_id:
            player.hand.append(card_id)
            return {"success": False, "error": "Wild Rent requires selecting one opponent to charge"}
        
        # For normal rent (1-2 colors): auto-select color with HIGHER rent value
        if not target_color and len(card_colors) <= 2:
            best_color = None
            best_rent = -1
            for color in card_colors:
                prop_set = self._get_property_set(player, PropertyColor(color))
                if prop_set:
                    rent = self._calculate_rent(prop_set, PropertyColor(color))
                    print(f"Checking color {color}: rent=${rent}M")
                    if rent > best_rent:
                        best_rent = rent
                        best_color = PropertyColor(color)
            target_color = best_color
            if target_color:
                print(f"Auto-selected target_color={target_color.value} with rent=${best_rent}M (highest)")
        
        # For wild rent: use provided target_color or find first matching property
        if not target_color and is_wild_rent:
            for color in card_colors:
                prop_set = self._get_property_set(player, PropertyColor(color))
                if prop_set:
                    target_color = PropertyColor(color)
                    print(f"Wild rent: auto-selected target_color={target_color.value}")
                    break
        
        # No matching properties - bank the card
        if not target_color:
            player.bank.append(card_id)
            self.state.currentTurn.cardsPlayed += 1
            result = {"success": True, "action": "rent_banked", "value": card["value"], 
                      "message": f"No matching properties - Rent card added to bank as ${card['value']}M"}
            print(f"Rent banked: no matching properties")
            self._check_auto_end_turn(player.id)
            return result
        
        prop_set = self._get_property_set(player, target_color)
        if not prop_set:
            player.bank.append(card_id)
            self.state.currentTurn.cardsPlayed += 1
            result = {"success": True, "action": "rent_banked", "value": card["value"],
                      "message": f"No {target_color.value} properties - Rent card added to bank as ${card['value']}M"}
            print(f"Rent banked: no {target_color.value} properties")
            self._check_auto_end_turn(player.id)
            return result
        
        rent_amount = self._calculate_rent(prop_set, target_color)
        print(f"Rent calculated: color={target_color.value}, prop_set.cards={prop_set.cards}, amount=${rent_amount}M")
        
        # Apply double rent multiplier if applicable
        cards_to_play = 1
        if double_rent and double_rent_card_id:
            rent_amount *= 2
            cards_to_play = 2
            player.hand.remove(double_rent_card_id)
            self.state.discardPile.append(double_rent_card_id)
            print(f"Double Rent applied! New amount: ${rent_amount}M")
        
        # Determine target players based on rent type
        if is_wild_rent:
            # Wild rent: charge only the selected opponent
            target_player = self._get_player(target_player_id)
            if not target_player:
                player.hand.append(card_id)
                if double_rent and double_rent_card_id:
                    self.state.discardPile.remove(double_rent_card_id)
                    player.hand.append(double_rent_card_id)
                return {"success": False, "error": "Target player not found"}
            if self._get_player_table_value(target_player) == 0:
                self.state.discardPile.append(card_id)
                self.state.currentTurn.cardsPlayed += cards_to_play
                result = {"success": True, "action": "rent", "amount": rent_amount, 
                          "doubleRent": double_rent,
                          "message": f"{target_player.name} has no assets to pay rent"}
                self._check_auto_end_turn(player.id)
                return result
            players_with_assets = [target_player_id]
            print(f"Wild rent: charging only {target_player.name}")
        else:
            # Normal rent: charge ALL opponents with assets
            players_with_assets = []
            for p in self.state.players:
                if p.id != player.id and self._get_player_table_value(p) > 0:
                    players_with_assets.append(p.id)
            print(f"Normal rent: charging all opponents: {players_with_assets}")
        
        self.state.discardPile.append(card_id)
        
        if not players_with_assets:
            self.state.currentTurn.cardsPlayed += cards_to_play
            result = {"success": True, "action": "rent", "amount": rent_amount, 
                      "doubleRent": double_rent,
                      "message": "No players have assets to pay rent"}
            self._check_auto_end_turn(player.id)
            return result
        
        self.state.pendingAction = PendingAction(
            type=ActionType.RENT,
            fromPlayer=player.id,
            targetPlayers=players_with_assets,
            amount=rent_amount,
            targetSet=target_color
        )
        self.state.phase = GamePhase.PAYMENT
        self.state.currentTurn.cardsPlayed += cards_to_play
        
        return {"success": True, "action": "rent", "amount": rent_amount, "color": target_color, 
                "doubleRent": double_rent, "waiting_for": players_with_assets}
    
    def _get_player_table_value(self, player: PlayerState) -> int:
        """Get total value of cards on table (bank + properties)"""
        total = 0
        for card_id in player.bank:
            card = self.cards_map.get(card_id)
            if card:
                total += card["value"]
        for prop_set in player.properties:
            for card_id in prop_set.cards:
                card = self.cards_map.get(card_id)
                if card:
                    total += card["value"]
        return total
    
    def _get_player_payable_cards(self, player: PlayerState) -> list[dict]:
        """Get list of cards player can use for payment with their values"""
        cards = []
        for card_id in player.bank:
            card = self.cards_map.get(card_id)
            if card:
                cards.append({"id": card_id, "value": card["value"], "source": "bank", "name": card["name"]})
        for prop_set in player.properties:
            for card_id in prop_set.cards:
                card = self.cards_map.get(card_id)
                if card:
                    cards.append({"id": card_id, "value": card["value"], "source": "property", "color": prop_set.color, "name": card["name"]})
        return cards
    
    def respond_to_action(self, player_id: str, response_type: str, card_ids: list[str] = None) -> dict:
        """Handle player response to an action"""
        print(f"respond_to_action called: player={player_id}, type={response_type}")
        print(f"  pendingAction: {self.state.pendingAction}")
        
        if not self.state.pendingAction:
            return {"success": False, "error": "No pending action"}
        
        if player_id not in self.state.pendingAction.targetPlayers:
            return {"success": False, "error": "Not targeted by this action"}
        
        if player_id in self.state.pendingAction.responses:
            return {"success": False, "error": "Already responded to this action"}
        
        player = self._get_player(player_id)
        
        if response_type == "justSayNo":
            jsn_card = self._find_just_say_no(player)
            if not jsn_card:
                return {"success": False, "error": "You don't have a Just Say No card in your hand."}
            player.hand.remove(jsn_card)
            self.state.discardPile.append(jsn_card)
            self.state.pendingAction.responses[player_id] = {"type": "justSayNo"}
            
        elif response_type == "pay":
            payment_cards = card_ids or []
            
            for cid in payment_cards:
                if cid not in player.bank and not any(cid in ps.cards for ps in player.properties):
                    return {"success": False, "error": f"Card {cid} is not on your table. You can only pay with bank or property cards, not cards in hand."}
            
            required_amount = self.state.pendingAction.amount
            player_total = self._get_player_table_value(player)
            
            if player_total == 0:
                self.state.pendingAction.responses[player_id] = {"type": "pay", "amount": 0, "cards": []}
            else:
                payment_value = sum(self.cards_map.get(cid, {}).get("value", 0) for cid in payment_cards)
                
                if payment_value < required_amount and payment_value < player_total:
                    return {
                        "success": False, 
                        "error": f"Payment of ${payment_value}M is less than required ${required_amount}M. "
                                 f"You have ${player_total}M on table. Select more cards or pay with all you have."
                    }
                
                total_paid = self._process_payment(player, payment_cards)
                from_player = self._get_player(self.state.pendingAction.fromPlayer)
                for cid in payment_cards:
                    card = self.cards_map.get(cid)
                    if card and card.get("type") == "property":
                        card_color = card.get("color")
                        if card_color:
                            self._add_property_to_player(from_player, cid, PropertyColor(card_color))
                        else:
                            from_player.bank.append(cid)
                    elif card and card.get("type") == "wildcard":
                        colors = card.get("colors", [])
                        if colors:
                            self._add_property_to_player(from_player, cid, PropertyColor(colors[0]))
                        else:
                            from_player.bank.append(cid)
                    else:
                        from_player.bank.append(cid)
                self.state.pendingAction.responses[player_id] = {"type": "pay", "amount": total_paid, "cards": payment_cards}
                
                if self._check_and_set_winner():
                    return {"success": True, "response": "pay", "winner": self.state.winner}
            
        elif response_type == "accept":
            self.state.pendingAction.responses[player_id] = {"type": "accept"}
        
        all_responded = len(self.state.pendingAction.responses) >= len(self.state.pendingAction.targetPlayers)
        print(f"  responses count: {len(self.state.pendingAction.responses)}, targets: {len(self.state.pendingAction.targetPlayers)}, all_responded: {all_responded}")
        
        if all_responded:
            print(f"  Resolving pending action...")
            self._resolve_pending_action()
            print(f"  Action resolved. Phase now: {self.state.phase}")
        
        return {"success": True, "response": response_type, "all_responded": all_responded}
    
    def get_payment_info(self, player_id: str) -> dict:
        """Get payment information for a player"""
        if not self.state.pendingAction:
            return {"error": "No pending action"}
        
        if player_id not in self.state.pendingAction.targetPlayers:
            return {"error": "Not targeted by this action"}
        
        required_amount = self.state.pendingAction.amount
        if required_amount is None:
            return {"error": "No payment required for this action type"}
        
        player = self._get_player(player_id)
        payable_cards = self._get_player_payable_cards(player)
        total_available = self._get_player_table_value(player)
        
        return {
            "required_amount": required_amount,
            "total_available": total_available,
            "payable_cards": payable_cards,
            "can_pay_full": total_available >= required_amount,
            "must_pay_all": total_available < required_amount
        }
    
    def _resolve_pending_action(self):
        """Resolve the pending action after all responses"""
        action = self.state.pendingAction
        from_player = self._get_player(action.fromPlayer)
        
        if action.type == ActionType.SLY_DEAL:
            for target_id, response in action.responses.items():
                if response["type"] != "justSayNo":
                    target_player = self._get_player(target_id)
                    self._steal_property(from_player, target_player, action.targetProperty)
        
        elif action.type == ActionType.FORCED_DEAL:
            for target_id, response in action.responses.items():
                if response["type"] != "justSayNo":
                    target_player = self._get_player(target_id)
                    self._swap_properties(from_player, target_player, action.giverProperty, action.targetProperty)
        
        elif action.type == ActionType.DEAL_BREAKER:
            for target_id, response in action.responses.items():
                if response["type"] != "justSayNo":
                    target_player = self._get_player(target_id)
                    self._steal_complete_set(from_player, target_player, action.targetSet)
        
        self.state.pendingAction = None
        
        if self._check_and_set_winner():
            return
        
        self.state.phase = GamePhase.ACTION
        
        if self.state.currentTurn.cardsPlayed >= 3:
            player = self._get_player(from_player.id)
            if player and len(player.hand) <= 7:
                self._end_turn_internal()
            elif player and len(player.hand) > 7:
                self.state.phase = GamePhase.DISCARD
    
    def end_turn(self, player_id: str) -> dict:
        """End the current player's turn"""
        if self.state.currentTurn.playerId != player_id:
            return {"success": False, "error": "Not your turn"}
        
        player = self._get_player(player_id)
        
        if len(player.hand) > 7:
            self.state.phase = GamePhase.DISCARD
            return {"success": False, "error": "Must discard to 7 cards", "excess": len(player.hand) - 7}
        
        return self._end_turn_internal()
    
    def _end_turn_internal(self) -> dict:
        """Internal method to end turn"""
        winner = self._check_win_condition()
        if winner:
            self.state.winner = winner
            self.state.phase = GamePhase.FINISHED
            return {"success": True, "winner": winner}
        
        self.state.currentPlayerIndex = (self.state.currentPlayerIndex + 1) % len(self.state.players)
        self.state.turnNumber += 1
        next_player = self.state.players[self.state.currentPlayerIndex]
        self.state.currentTurn = TurnState(
            playerId=next_player.id,
            cardsPlayed=0,
            cardsDrawn=False
        )
        self.state.phase = GamePhase.DRAW
        
        return {"success": True, "nextPlayer": next_player.id}
    
    def handle_timeout(self, player_id: str) -> dict:
        """Handle turn timeout - auto draw and auto play"""
        player = self._get_player(player_id)
        if not player or self.state.currentTurn.playerId != player_id:
            return {"success": False, "error": "Not this player's turn"}
        
        actions_taken = []
        
        if not self.state.currentTurn.cardsDrawn:
            num_to_draw = 5 if len(player.hand) == 0 else 2
            drawn = self._draw_cards_internal(player, num_to_draw)
            self.state.currentTurn.cardsDrawn = True
            self.state.phase = GamePhase.ACTION
            actions_taken.append({"action": "auto_draw", "cards": drawn})
        
        while self.state.currentTurn.cardsPlayed < 3 and len(player.hand) > 0:
            played = False
            for card_id in list(player.hand):
                card = self.cards_map.get(card_id)
                if not card:
                    continue
                
                if card["type"] == "money":
                    player.hand.remove(card_id)
                    player.bank.append(card_id)
                    self.state.currentTurn.cardsPlayed += 1
                    actions_taken.append({"action": "auto_bank_money", "card": card_id})
                    played = True
                    break
                
                elif card["type"] == "property":
                    player.hand.remove(card_id)
                    self._add_property_to_player(player, card_id, card["color"])
                    self.state.currentTurn.cardsPlayed += 1
                    actions_taken.append({"action": "auto_play_property", "card": card_id})
                    played = True
                    break
            
            if not played:
                for card_id in list(player.hand):
                    card = self.cards_map.get(card_id)
                    if card and card["type"] in ["action", "rent", "wildcard"]:
                        player.hand.remove(card_id)
                        player.bank.append(card_id)
                        self.state.currentTurn.cardsPlayed += 1
                        actions_taken.append({"action": "auto_bank_card", "card": card_id})
                        played = True
                        break
            
            if not played:
                break
            
            if len(player.hand) <= 7:
                break
        
        if len(player.hand) > 7:
            excess = len(player.hand) - 7
            to_discard = player.hand[:excess]
            for card_id in to_discard:
                player.hand.remove(card_id)
                self.state.discardPile.append(card_id)
            actions_taken.append({"action": "auto_discard", "cards": to_discard})
        
        result = self._end_turn_internal()
        result["timeout_actions"] = actions_taken
        return result
    
    def discard_cards(self, player_id: str, card_ids: list[str]) -> dict:
        """Discard cards to get down to 7"""
        player = self._get_player(player_id)
        if not player:
            return {"success": False, "error": "Player not found"}
        
        excess = len(player.hand) - 7
        if len(card_ids) < excess:
            return {"success": False, "error": f"Must discard at least {excess} cards"}
        
        for card_id in card_ids:
            if card_id in player.hand:
                player.hand.remove(card_id)
                self.state.discardPile.append(card_id)
        
        if len(player.hand) <= 7:
            return self._end_turn_internal()
        
        return {"success": True, "remaining": len(player.hand)}
    
    def move_wildcard(self, player_id: str, card_id: str, from_color: str, to_color: str) -> dict:
        """Move a wildcard from one property set to another"""
        player = self._get_player(player_id)
        if not player:
            return {"success": False, "error": "Player not found"}
        
        card = self.cards_map.get(card_id)
        if not card:
            return {"success": False, "error": "Card not found"}
        
        if card.get("type") != "wildcard":
            return {"success": False, "error": "Card is not a wildcard"}
        
        card_colors = card.get("colors", [])
        if to_color not in card_colors:
            return {"success": False, "error": f"Wildcard cannot be used as {to_color}"}
        
        from_set = self._get_property_set(player, PropertyColor(from_color))
        if not from_set or card_id not in from_set.cards:
            return {"success": False, "error": "Wildcard not found in the specified property set"}
        
        from_set.cards.remove(card_id)
        if len(from_set.cards) == 0:
            player.properties.remove(from_set)
        
        self._add_property_to_player(player, card_id, PropertyColor(to_color))
        
        return {
            "success": True, 
            "action": "wildcard_moved",
            "from": from_color,
            "to": to_color
        }
    
    def _get_player(self, player_id: str) -> Optional[PlayerState]:
        for player in self.state.players:
            if player.id == player_id:
                return player
        return None
    
    def _add_property_to_player(self, player: PlayerState, card_id: str, color: PropertyColor):
        for prop_set in player.properties:
            if prop_set.color == color:
                prop_set.cards.append(card_id)
                return
        player.properties.append(PropertySet(color=color, cards=[card_id]))
    
    def _get_property_set(self, player: PlayerState, color: PropertyColor) -> Optional[PropertySet]:
        for prop_set in player.properties:
            if prop_set.color == color:
                return prop_set
        return None
    
    def _is_set_complete(self, prop_set: PropertySet, color: PropertyColor) -> bool:
        required = SET_SIZES.get(color, 3)
        return len(prop_set.cards) >= required
    
    def _can_steal_property(self, player: PlayerState, card_id: str) -> bool:
        for prop_set in player.properties:
            if card_id in prop_set.cards:
                if self._is_set_complete(prop_set, prop_set.color):
                    return False
                return True
        return False
    
    def _is_property_in_complete_set(self, player: PlayerState, card_id: str) -> bool:
        """Check if a property card is part of a complete set"""
        for prop_set in player.properties:
            if card_id in prop_set.cards:
                return self._is_set_complete(prop_set, prop_set.color)
        return False
    
    def _calculate_rent(self, prop_set: PropertySet, color: PropertyColor) -> int:
        """Calculate rent based on number of properties using RENT_VALUES table"""
        num_cards = len(prop_set.cards)
        print(f"Calculating rent for {color.value}: {num_cards} cards in set")
        print(f"Cards in set: {prop_set.cards}")
        
        if num_cards == 0:
            print(f"No cards in set, rent = 0")
            return 0
        
        rent_values = RENT_VALUES.get(color, [])
        if not rent_values:
            print(f"No rent values defined for {color.value}, rent = 0")
            return 0
        
        rent_index = min(num_cards - 1, len(rent_values) - 1)
        base_rent = rent_values[rent_index]
        print(f"RENT_VALUES for {color.value}: {rent_values}, index={rent_index}, base_rent=${base_rent}M")
        
        if prop_set.house:
            base_rent += 3
            print(f"  House bonus: +3, total={base_rent}")
        if prop_set.hotel:
            base_rent += 4
            print(f"  Hotel bonus: +4, total={base_rent}")
        
        print(f"Final rent for {color.value}: ${base_rent}M")
        return base_rent
    
    def _find_just_say_no(self, player: PlayerState) -> Optional[str]:
        for card_id in player.hand:
            card = self.cards_map.get(card_id)
            if card and card.get("actionType") == "justSayNo":
                return card_id
        return None
    
    def _process_payment(self, player: PlayerState, card_ids: list[str]) -> int:
        total = 0
        for card_id in card_ids:
            if card_id in player.bank:
                player.bank.remove(card_id)
                card = self.cards_map.get(card_id)
                if card:
                    total += card["value"]
            for prop_set in player.properties:
                if card_id in prop_set.cards:
                    prop_set.cards.remove(card_id)
                    card = self.cards_map.get(card_id)
                    if card:
                        total += card["value"]
        player.properties = [ps for ps in player.properties if ps.cards]
        return total
    
    def _steal_property(self, from_player: PlayerState, target_player: PlayerState, card_id: str):
        card = self.cards_map.get(card_id)
        if not card:
            return
        
        for prop_set in target_player.properties:
            if card_id in prop_set.cards:
                prop_set.cards.remove(card_id)
                break
        
        target_player.properties = [ps for ps in target_player.properties if ps.cards]
        
        color = card.get("color") or (card.get("colors", [None])[0] if card.get("colors") else None)
        if color:
            self._add_property_to_player(from_player, card_id, PropertyColor(color))
    
    def _swap_properties(self, from_player: PlayerState, target_player: PlayerState, giver_card_id: str, target_card_id: str):
        """Swap properties between two players (Forced Deal)"""
        giver_card = self.cards_map.get(giver_card_id)
        target_card = self.cards_map.get(target_card_id)
        if not giver_card or not target_card:
            return
        
        for prop_set in from_player.properties:
            if giver_card_id in prop_set.cards:
                prop_set.cards.remove(giver_card_id)
                break
        from_player.properties = [ps for ps in from_player.properties if ps.cards]
        
        for prop_set in target_player.properties:
            if target_card_id in prop_set.cards:
                prop_set.cards.remove(target_card_id)
                break
        target_player.properties = [ps for ps in target_player.properties if ps.cards]
        
        giver_color = giver_card.get("color") or (giver_card.get("colors", [None])[0] if giver_card.get("colors") else None)
        target_color = target_card.get("color") or (target_card.get("colors", [None])[0] if target_card.get("colors") else None)
        
        if target_color:
            self._add_property_to_player(from_player, target_card_id, PropertyColor(target_color))
        if giver_color:
            self._add_property_to_player(target_player, giver_card_id, PropertyColor(giver_color))
    
    def _steal_complete_set(self, from_player: PlayerState, target_player: PlayerState, color: PropertyColor):
        target_set = None
        for i, prop_set in enumerate(target_player.properties):
            if prop_set.color == color:
                target_set = prop_set
                target_player.properties.pop(i)
                break
        
        if target_set:
            from_player.properties.append(target_set)
    
    def _check_and_set_winner(self) -> bool:
        """Check if any player has won and set game state accordingly. Returns True if game ended."""
        winner = self._check_win_condition()
        if winner:
            self.state.winner = winner
            self.state.phase = GamePhase.FINISHED
            self.state.pendingAction = None
            return True
        return False
    
    def _check_auto_end_turn(self, player_id: str):
        """Automatically end turn after 3 cards played if hand is within limit"""
        if self._check_and_set_winner():
            return
        
        if self.state.currentTurn.cardsPlayed >= 3:
            player = self._get_player(player_id)
            if player and len(player.hand) <= 7:
                self.state.currentPlayerIndex = (self.state.currentPlayerIndex + 1) % len(self.state.players)
                self.state.turnNumber += 1
                next_player = self.state.players[self.state.currentPlayerIndex]
                self.state.currentTurn = TurnState(
                    playerId=next_player.id,
                    cardsPlayed=0,
                    cardsDrawn=False
                )
                self.state.phase = GamePhase.DRAW
            elif player and len(player.hand) > 7:
                self.state.phase = GamePhase.DISCARD
    
    def _check_win_condition(self) -> Optional[str]:
        for player in self.state.players:
            complete_sets = 0
            for prop_set in player.properties:
                if self._is_set_complete(prop_set, prop_set.color):
                    complete_sets += 1
            if complete_sets >= 3:
                return player.id
        return None
    
    def get_public_state(self, for_player_id: str) -> dict:
        """Get game state visible to a specific player"""
        state_dict = self.state.model_dump()
        
        for player in state_dict["players"]:
            if player["id"] != for_player_id:
                player["hand"] = len(player["hand"])
                player["bankCount"] = len(player["bank"])
                player["bank"] = []
        
        if state_dict.get("pendingAction") and for_player_id in (state_dict["pendingAction"].get("targetPlayers") or []):
            pending_type = state_dict["pendingAction"].get("type")
            payment_actions = ["rent", "birthday", "debtCollector"]
            if pending_type in payment_actions:
                state_dict["paymentInfo"] = self.get_payment_info(for_player_id)
        
        state_dict["drawPileCount"] = len(state_dict["drawPile"])
        del state_dict["drawPile"]
        
        return state_dict
