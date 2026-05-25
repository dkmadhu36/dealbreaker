from models import PropertyColor, CardType, ActionType

CARDS_DATA = [
    # Brown Properties (2 cards)
    {"id": "prop_brown_1", "type": "property", "name": "Mediterranean Avenue", "value": 1, "color": "brown", "rentValues": [1, 2]},
    {"id": "prop_brown_2", "type": "property", "name": "Baltic Avenue", "value": 1, "color": "brown", "rentValues": [1, 2]},
    
    # Light Blue Properties (3 cards)
    {"id": "prop_lightblue_1", "type": "property", "name": "Oriental Avenue", "value": 1, "color": "lightBlue", "rentValues": [1, 2, 3]},
    {"id": "prop_lightblue_2", "type": "property", "name": "Vermont Avenue", "value": 1, "color": "lightBlue", "rentValues": [1, 2, 3]},
    {"id": "prop_lightblue_3", "type": "property", "name": "Connecticut Avenue", "value": 1, "color": "lightBlue", "rentValues": [1, 2, 3]},
    
    # Pink Properties (3 cards)
    {"id": "prop_pink_1", "type": "property", "name": "St. Charles Place", "value": 2, "color": "pink", "rentValues": [1, 2, 4]},
    {"id": "prop_pink_2", "type": "property", "name": "States Avenue", "value": 2, "color": "pink", "rentValues": [1, 2, 4]},
    {"id": "prop_pink_3", "type": "property", "name": "Virginia Avenue", "value": 2, "color": "pink", "rentValues": [1, 2, 4]},
    
    # Orange Properties (3 cards)
    {"id": "prop_orange_1", "type": "property", "name": "St. James Place", "value": 2, "color": "orange", "rentValues": [1, 3, 5]},
    {"id": "prop_orange_2", "type": "property", "name": "Tennessee Avenue", "value": 2, "color": "orange", "rentValues": [1, 3, 5]},
    {"id": "prop_orange_3", "type": "property", "name": "New York Avenue", "value": 2, "color": "orange", "rentValues": [1, 3, 5]},
    
    # Red Properties (3 cards)
    {"id": "prop_red_1", "type": "property", "name": "Kentucky Avenue", "value": 3, "color": "red", "rentValues": [2, 3, 6]},
    {"id": "prop_red_2", "type": "property", "name": "Indiana Avenue", "value": 3, "color": "red", "rentValues": [2, 3, 6]},
    {"id": "prop_red_3", "type": "property", "name": "Illinois Avenue", "value": 3, "color": "red", "rentValues": [2, 3, 6]},
    
    # Yellow Properties (3 cards)
    {"id": "prop_yellow_1", "type": "property", "name": "Atlantic Avenue", "value": 3, "color": "yellow", "rentValues": [2, 4, 6]},
    {"id": "prop_yellow_2", "type": "property", "name": "Ventnor Avenue", "value": 3, "color": "yellow", "rentValues": [2, 4, 6]},
    {"id": "prop_yellow_3", "type": "property", "name": "Marvin Gardens", "value": 3, "color": "yellow", "rentValues": [2, 4, 6]},
    
    # Green Properties (3 cards)
    {"id": "prop_green_1", "type": "property", "name": "Pacific Avenue", "value": 4, "color": "green", "rentValues": [2, 4, 7]},
    {"id": "prop_green_2", "type": "property", "name": "North Carolina Avenue", "value": 4, "color": "green", "rentValues": [2, 4, 7]},
    {"id": "prop_green_3", "type": "property", "name": "Pennsylvania Avenue", "value": 4, "color": "green", "rentValues": [2, 4, 7]},
    
    # Dark Blue Properties (2 cards)
    {"id": "prop_darkblue_1", "type": "property", "name": "Park Place", "value": 4, "color": "darkBlue", "rentValues": [3, 8]},
    {"id": "prop_darkblue_2", "type": "property", "name": "Boardwalk", "value": 4, "color": "darkBlue", "rentValues": [3, 8]},
    
    # Railroad Properties (4 cards)
    {"id": "prop_railroad_1", "type": "property", "name": "Reading Railroad", "value": 2, "color": "railroad", "rentValues": [1, 2, 3, 4]},
    {"id": "prop_railroad_2", "type": "property", "name": "Pennsylvania Railroad", "value": 2, "color": "railroad", "rentValues": [1, 2, 3, 4]},
    {"id": "prop_railroad_3", "type": "property", "name": "B&O Railroad", "value": 2, "color": "railroad", "rentValues": [1, 2, 3, 4]},
    {"id": "prop_railroad_4", "type": "property", "name": "Short Line Railroad", "value": 2, "color": "railroad", "rentValues": [1, 2, 3, 4]},
    
    # Utility Properties (2 cards)
    {"id": "prop_utility_1", "type": "property", "name": "Electric Company", "value": 2, "color": "utility", "rentValues": [1, 2]},
    {"id": "prop_utility_2", "type": "property", "name": "Water Works", "value": 2, "color": "utility", "rentValues": [1, 2]},
    
    # Multi-color Wildcards (2 cards)
    {"id": "wild_all_1", "type": "wildcard", "name": "Property Wild Card", "value": 0, "colors": ["brown", "lightBlue", "pink", "orange", "red", "yellow", "green", "darkBlue", "railroad", "utility"]},
    {"id": "wild_all_2", "type": "wildcard", "name": "Property Wild Card", "value": 0, "colors": ["brown", "lightBlue", "pink", "orange", "red", "yellow", "green", "darkBlue", "railroad", "utility"]},
    
    # Two-color Wildcards (9 cards)
    {"id": "wild_green_railroad", "type": "wildcard", "name": "Green/Railroad Wild", "value": 4, "colors": ["green", "railroad"]},
    {"id": "wild_lightblue_railroad", "type": "wildcard", "name": "Light Blue/Railroad Wild", "value": 4, "colors": ["lightBlue", "railroad"]},
    {"id": "wild_utility_railroad", "type": "wildcard", "name": "Utility/Railroad Wild", "value": 2, "colors": ["utility", "railroad"]},
    {"id": "wild_pink_orange", "type": "wildcard", "name": "Pink/Orange Wild", "value": 2, "colors": ["pink", "orange"]},
    {"id": "wild_red_yellow", "type": "wildcard", "name": "Red/Yellow Wild", "value": 3, "colors": ["red", "yellow"]},
    {"id": "wild_green_darkblue", "type": "wildcard", "name": "Green/Dark Blue Wild", "value": 4, "colors": ["green", "darkBlue"]},
    {"id": "wild_lightblue_brown", "type": "wildcard", "name": "Light Blue/Brown Wild", "value": 1, "colors": ["lightBlue", "brown"]},
    {"id": "wild_railroad_utility", "type": "wildcard", "name": "Railroad/Utility Wild", "value": 2, "colors": ["railroad", "utility"]},
    {"id": "wild_orange_pink", "type": "wildcard", "name": "Orange/Pink Wild", "value": 2, "colors": ["orange", "pink"]},
    
    # Action Cards - Deal Breaker (2 cards)
    {"id": "action_dealbreaker_1", "type": "action", "name": "Deal Breaker", "value": 5, "actionType": "dealBreaker"},
    {"id": "action_dealbreaker_2", "type": "action", "name": "Deal Breaker", "value": 5, "actionType": "dealBreaker"},
    
    # Action Cards - Just Say No (3 cards)
    {"id": "action_justsayno_1", "type": "action", "name": "Just Say No", "value": 4, "actionType": "justSayNo"},
    {"id": "action_justsayno_2", "type": "action", "name": "Just Say No", "value": 4, "actionType": "justSayNo"},
    {"id": "action_justsayno_3", "type": "action", "name": "Just Say No", "value": 4, "actionType": "justSayNo"},
    
    # Action Cards - Sly Deal (3 cards)
    {"id": "action_slydeal_1", "type": "action", "name": "Sly Deal", "value": 3, "actionType": "slyDeal"},
    {"id": "action_slydeal_2", "type": "action", "name": "Sly Deal", "value": 3, "actionType": "slyDeal"},
    {"id": "action_slydeal_3", "type": "action", "name": "Sly Deal", "value": 3, "actionType": "slyDeal"},
    
    # Action Cards - Forced Deal (4 cards)
    {"id": "action_forceddeal_1", "type": "action", "name": "Forced Deal", "value": 3, "actionType": "forcedDeal"},
    {"id": "action_forceddeal_2", "type": "action", "name": "Forced Deal", "value": 3, "actionType": "forcedDeal"},
    {"id": "action_forceddeal_3", "type": "action", "name": "Forced Deal", "value": 3, "actionType": "forcedDeal"},
    {"id": "action_forceddeal_4", "type": "action", "name": "Forced Deal", "value": 3, "actionType": "forcedDeal"},
    
    # Action Cards - Debt Collector (3 cards)
    {"id": "action_debtcollector_1", "type": "action", "name": "Debt Collector", "value": 3, "actionType": "debtCollector"},
    {"id": "action_debtcollector_2", "type": "action", "name": "Debt Collector", "value": 3, "actionType": "debtCollector"},
    {"id": "action_debtcollector_3", "type": "action", "name": "Debt Collector", "value": 3, "actionType": "debtCollector"},
    
    # Action Cards - It's My Birthday (3 cards)
    {"id": "action_birthday_1", "type": "action", "name": "It's My Birthday", "value": 2, "actionType": "birthday"},
    {"id": "action_birthday_2", "type": "action", "name": "It's My Birthday", "value": 2, "actionType": "birthday"},
    {"id": "action_birthday_3", "type": "action", "name": "It's My Birthday", "value": 2, "actionType": "birthday"},
    
    # Action Cards - Pass Go (10 cards)
    {"id": "action_passgo_1", "type": "action", "name": "Pass Go", "value": 1, "actionType": "passGo"},
    {"id": "action_passgo_2", "type": "action", "name": "Pass Go", "value": 1, "actionType": "passGo"},
    {"id": "action_passgo_3", "type": "action", "name": "Pass Go", "value": 1, "actionType": "passGo"},
    {"id": "action_passgo_4", "type": "action", "name": "Pass Go", "value": 1, "actionType": "passGo"},
    {"id": "action_passgo_5", "type": "action", "name": "Pass Go", "value": 1, "actionType": "passGo"},
    {"id": "action_passgo_6", "type": "action", "name": "Pass Go", "value": 1, "actionType": "passGo"},
    {"id": "action_passgo_7", "type": "action", "name": "Pass Go", "value": 1, "actionType": "passGo"},
    {"id": "action_passgo_8", "type": "action", "name": "Pass Go", "value": 1, "actionType": "passGo"},
    {"id": "action_passgo_9", "type": "action", "name": "Pass Go", "value": 1, "actionType": "passGo"},
    {"id": "action_passgo_10", "type": "action", "name": "Pass Go", "value": 1, "actionType": "passGo"},
    
    # Action Cards - House (3 cards)
    {"id": "action_house_1", "type": "action", "name": "House", "value": 3, "actionType": "house"},
    {"id": "action_house_2", "type": "action", "name": "House", "value": 3, "actionType": "house"},
    {"id": "action_house_3", "type": "action", "name": "House", "value": 3, "actionType": "house"},
    
    # Action Cards - Hotel (3 cards)
    {"id": "action_hotel_1", "type": "action", "name": "Hotel", "value": 4, "actionType": "hotel"},
    {"id": "action_hotel_2", "type": "action", "name": "Hotel", "value": 4, "actionType": "hotel"},
    {"id": "action_hotel_3", "type": "action", "name": "Hotel", "value": 4, "actionType": "hotel"},
    
    # Action Cards - Double The Rent (2 cards)
    {"id": "action_doublerent_1", "type": "action", "name": "Double The Rent", "value": 1, "actionType": "doubleRent"},
    {"id": "action_doublerent_2", "type": "action", "name": "Double The Rent", "value": 1, "actionType": "doubleRent"},
    
    # Rent Cards (13 cards)
    {"id": "rent_brown_lightblue_1", "type": "rent", "name": "Rent", "value": 1, "colors": ["brown", "lightBlue"]},
    {"id": "rent_brown_lightblue_2", "type": "rent", "name": "Rent", "value": 1, "colors": ["brown", "lightBlue"]},
    {"id": "rent_pink_orange_1", "type": "rent", "name": "Rent", "value": 1, "colors": ["pink", "orange"]},
    {"id": "rent_pink_orange_2", "type": "rent", "name": "Rent", "value": 1, "colors": ["pink", "orange"]},
    {"id": "rent_red_yellow_1", "type": "rent", "name": "Rent", "value": 1, "colors": ["red", "yellow"]},
    {"id": "rent_red_yellow_2", "type": "rent", "name": "Rent", "value": 1, "colors": ["red", "yellow"]},
    {"id": "rent_green_darkblue_1", "type": "rent", "name": "Rent", "value": 1, "colors": ["green", "darkBlue"]},
    {"id": "rent_green_darkblue_2", "type": "rent", "name": "Rent", "value": 1, "colors": ["green", "darkBlue"]},
    {"id": "rent_railroad_utility_1", "type": "rent", "name": "Rent", "value": 1, "colors": ["railroad", "utility"]},
    {"id": "rent_railroad_utility_2", "type": "rent", "name": "Rent", "value": 1, "colors": ["railroad", "utility"]},
    {"id": "rent_wild_1", "type": "rent", "name": "Wild Rent", "value": 3, "colors": ["brown", "lightBlue", "pink", "orange", "red", "yellow", "green", "darkBlue", "railroad", "utility"]},
    {"id": "rent_wild_2", "type": "rent", "name": "Wild Rent", "value": 3, "colors": ["brown", "lightBlue", "pink", "orange", "red", "yellow", "green", "darkBlue", "railroad", "utility"]},
    {"id": "rent_wild_3", "type": "rent", "name": "Wild Rent", "value": 3, "colors": ["brown", "lightBlue", "pink", "orange", "red", "yellow", "green", "darkBlue", "railroad", "utility"]},
    
    # Money Cards (20 cards)
    {"id": "money_10m_1", "type": "money", "name": "$10M", "value": 10},
    {"id": "money_5m_1", "type": "money", "name": "$5M", "value": 5},
    {"id": "money_5m_2", "type": "money", "name": "$5M", "value": 5},
    {"id": "money_4m_1", "type": "money", "name": "$4M", "value": 4},
    {"id": "money_4m_2", "type": "money", "name": "$4M", "value": 4},
    {"id": "money_4m_3", "type": "money", "name": "$4M", "value": 4},
    {"id": "money_3m_1", "type": "money", "name": "$3M", "value": 3},
    {"id": "money_3m_2", "type": "money", "name": "$3M", "value": 3},
    {"id": "money_3m_3", "type": "money", "name": "$3M", "value": 3},
    {"id": "money_2m_1", "type": "money", "name": "$2M", "value": 2},
    {"id": "money_2m_2", "type": "money", "name": "$2M", "value": 2},
    {"id": "money_2m_3", "type": "money", "name": "$2M", "value": 2},
    {"id": "money_2m_4", "type": "money", "name": "$2M", "value": 2},
    {"id": "money_2m_5", "type": "money", "name": "$2M", "value": 2},
    {"id": "money_1m_1", "type": "money", "name": "$1M", "value": 1},
    {"id": "money_1m_2", "type": "money", "name": "$1M", "value": 1},
    {"id": "money_1m_3", "type": "money", "name": "$1M", "value": 1},
    {"id": "money_1m_4", "type": "money", "name": "$1M", "value": 1},
    {"id": "money_1m_5", "type": "money", "name": "$1M", "value": 1},
    {"id": "money_1m_6", "type": "money", "name": "$1M", "value": 1},
]

def get_card_by_id(card_id: str) -> dict | None:
    for card in CARDS_DATA:
        if card["id"] == card_id:
            return card
    return None

def get_all_cards() -> list[dict]:
    return CARDS_DATA.copy()
