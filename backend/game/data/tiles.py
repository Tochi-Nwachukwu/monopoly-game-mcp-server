from enum import StrEnum


class TileType(StrEnum):
    GO = "go"
    PROPERTY = "property"
    RAILROAD = "railroad"
    UTILITY = "utility"
    TAX = "tax"
    CHANCE = "chance"
    COMMUNITY_CHEST = "community_chest"
    JAIL = "jail"
    FREE_PARKING = "free_parking"
    GO_TO_JAIL = "go_to_jail"


TILE_DATA = {
    0: {"name": "GO", "type": TileType.GO},
    1: {"name": "Mediterranean Avenue", "type": TileType.PROPERTY, "price": 60, "mortgage": 30, "color": "brown", "house_cost": 50, "rent": [2, 10, 30, 90, 160, 250]},
    2: {"name": "Community Chest", "type": TileType.COMMUNITY_CHEST},
    3: {"name": "Baltic Avenue", "type": TileType.PROPERTY, "price": 60, "mortgage": 30, "color": "brown", "house_cost": 50, "rent": [4, 20, 60, 180, 320, 450]},
    4: {"name": "Income Tax", "type": TileType.TAX, "amount": 200},
    5: {"name": "Reading Railroad", "type": TileType.RAILROAD, "price": 200, "mortgage": 100},
    6: {"name": "Oriental Avenue", "type": TileType.PROPERTY, "price": 100, "mortgage": 50, "color": "light_blue", "house_cost": 50, "rent": [6, 30, 90, 270, 400, 550]},
    7: {"name": "Chance", "type": TileType.CHANCE},
    8: {"name": "Vermont Avenue", "type": TileType.PROPERTY, "price": 100, "mortgage": 50, "color": "light_blue", "house_cost": 50, "rent": [6, 30, 90, 270, 400, 550]},
    9: {"name": "Connecticut Avenue", "type": TileType.PROPERTY, "price": 120, "mortgage": 60, "color": "light_blue", "house_cost": 50, "rent": [8, 40, 100, 300, 450, 600]},
    10: {"name": "Jail / Just Visiting", "type": TileType.JAIL},
    11: {"name": "St. Charles Place", "type": TileType.PROPERTY, "price": 140, "mortgage": 70, "color": "pink", "house_cost": 100, "rent": [10, 50, 150, 450, 625, 750]},
    12: {"name": "Electric Company", "type": TileType.UTILITY, "price": 150, "mortgage": 75},
    13: {"name": "States Avenue", "type": TileType.PROPERTY, "price": 140, "mortgage": 70, "color": "pink", "house_cost": 100, "rent": [10, 50, 150, 450, 625, 750]},
    14: {"name": "Virginia Avenue", "type": TileType.PROPERTY, "price": 160, "mortgage": 80, "color": "pink", "house_cost": 100, "rent": [12, 60, 180, 500, 700, 900]},
    15: {"name": "Pennsylvania Railroad", "type": TileType.RAILROAD, "price": 200, "mortgage": 100},
    16: {"name": "St. James Place", "type": TileType.PROPERTY, "price": 180, "mortgage": 90, "color": "orange", "house_cost": 100, "rent": [14, 70, 200, 550, 750, 950]},
    17: {"name": "Community Chest", "type": TileType.COMMUNITY_CHEST},
    18: {"name": "Tennessee Avenue", "type": TileType.PROPERTY, "price": 180, "mortgage": 90, "color": "orange", "house_cost": 100, "rent": [14, 70, 200, 550, 750, 950]},
    19: {"name": "New York Avenue", "type": TileType.PROPERTY, "price": 200, "mortgage": 100, "color": "orange", "house_cost": 100, "rent": [16, 80, 220, 600, 800, 1000]},
    20: {"name": "Free Parking", "type": TileType.FREE_PARKING},
    21: {"name": "Kentucky Avenue", "type": TileType.PROPERTY, "price": 220, "mortgage": 110, "color": "red", "house_cost": 150, "rent": [18, 90, 250, 700, 875, 1050]},
    22: {"name": "Chance", "type": TileType.CHANCE},
    23: {"name": "Indiana Avenue", "type": TileType.PROPERTY, "price": 220, "mortgage": 110, "color": "red", "house_cost": 150, "rent": [18, 90, 250, 700, 875, 1050]},
    24: {"name": "Illinois Avenue", "type": TileType.PROPERTY, "price": 240, "mortgage": 120, "color": "red", "house_cost": 150, "rent": [20, 100, 300, 750, 925, 1100]},
    25: {"name": "B&O Railroad", "type": TileType.RAILROAD, "price": 200, "mortgage": 100},
    26: {"name": "Atlantic Avenue", "type": TileType.PROPERTY, "price": 260, "mortgage": 130, "color": "yellow", "house_cost": 150, "rent": [22, 110, 330, 800, 975, 1150]},
    27: {"name": "Ventnor Avenue", "type": TileType.PROPERTY, "price": 260, "mortgage": 130, "color": "yellow", "house_cost": 150, "rent": [22, 110, 330, 800, 975, 1150]},
    28: {"name": "Water Works", "type": TileType.UTILITY, "price": 150, "mortgage": 75},
    29: {"name": "Marvin Gardens", "type": TileType.PROPERTY, "price": 280, "mortgage": 140, "color": "yellow", "house_cost": 150, "rent": [24, 120, 360, 850, 1025, 1200]},
    30: {"name": "Go To Jail", "type": TileType.GO_TO_JAIL},
    31: {"name": "Pacific Avenue", "type": TileType.PROPERTY, "price": 300, "mortgage": 150, "color": "green", "house_cost": 200, "rent": [26, 130, 390, 900, 1100, 1275]},
    32: {"name": "North Carolina Avenue", "type": TileType.PROPERTY, "price": 300, "mortgage": 150, "color": "green", "house_cost": 200, "rent": [26, 130, 390, 900, 1100, 1275]},
    33: {"name": "Community Chest", "type": TileType.COMMUNITY_CHEST},
    34: {"name": "Pennsylvania Avenue", "type": TileType.PROPERTY, "price": 320, "mortgage": 160, "color": "green", "house_cost": 200, "rent": [28, 150, 450, 1000, 1200, 1400]},
    35: {"name": "Short Line Railroad", "type": TileType.RAILROAD, "price": 200, "mortgage": 100},
    36: {"name": "Chance", "type": TileType.CHANCE},
    37: {"name": "Park Place", "type": TileType.PROPERTY, "price": 350, "mortgage": 175, "color": "dark_blue", "house_cost": 200, "rent": [35, 175, 500, 1100, 1300, 1500]},
    38: {"name": "Luxury Tax", "type": TileType.TAX, "amount": 100},
    39: {"name": "Boardwalk", "type": TileType.PROPERTY, "price": 400, "mortgage": 200, "color": "dark_blue", "house_cost": 200, "rent": [50, 200, 600, 1400, 1700, 2000]},
}