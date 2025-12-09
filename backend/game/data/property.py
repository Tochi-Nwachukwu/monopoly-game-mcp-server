from dataclasses import dataclass, field
from typing import List, Optional
from game.data.tiles import TileType


@dataclass
class Property:
    position: int
    position: int
    name: str
    tile_type: TileType
    price: int = 0
    mortgage_value: int = 0
    color_group: str = ""
    house_cost: int = 0
    rent: List[int] = field(default_factory=list)
    owner: Optional[str] = None
    houses: int = 0
    is_mortgaged: bool = False

    def get_rent(
        self, dice_roll: int = 0, railroads_owned: int = 1, utilities_owned: int = 1
    ) -> int:
        if self.is_mortgaged:
            return 0
        if self.tile_type == TileType.PROPERTY:
            return self.rent[min(self.houses, 5)]
        elif self.tile_type == TileType.RAILROAD:
            rr_rent = {1: 25, 2: 50, 3: 100, 4: 200}
            return rr_rent.get(railroads_owned, 25)
        elif self.tile_type == TileType.UTILITY:
            multiplier = 10 if utilities_owned == 2 else 4
            return dice_roll * multiplier
        return 0


COLOR_GROUPS = {
    "brown": [1, 3],
    "light_blue": [6, 8, 9],
    "pink": [11, 13, 14],
    "orange": [16, 18, 19],
    "red": [21, 23, 24],
    "yellow": [26, 27, 29],
    "green": [31, 32, 34],
    "dark_blue": [37, 39],
}
