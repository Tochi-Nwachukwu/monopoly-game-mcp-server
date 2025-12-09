from dataclasses import dataclass, field
from typing import List

@dataclass
class Player:
    name: str
    money: int = 1500
    position: int = 0
    in_jail: bool = False
    jail_turns: int = 0
    jail_cards: int = 0
    properties: List[int] = field(default_factory=list)
    bankrupt: bool = False
    doubles_count: int = 0