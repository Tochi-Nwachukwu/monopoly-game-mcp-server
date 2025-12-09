from enum import StrEnum
from typing import Dict, List, Any
import random

from game.data.card_decks import CHANCE_CARDS, COMMUNITY_CARDS
from game.data.player import Player
from game.data.property import COLOR_GROUPS, Property
from game.data.tiles import TILE_DATA, TileType


class GamePhase(StrEnum):
    WAITING_FOR_ROLL = "waiting_for_roll"
    WAITING_FOR_BUY_DECISION = "waiting_for_buy_decision"
    IN_JAIL = "in_jail"
    TURN_COMPLETE = "turn_complete"
    GAME_OVER = "game_over"


class MonopolyGameEngine:
    def __init__(self, player_names: List[str]) -> None:
        self.players: Dict[str, Player] = {}
        self.player_order: List[str] = player_names
        self.current_player_idx: int = 0
        self.phase: GamePhase = GamePhase.WAITING_FOR_ROLL
        self.tiles: Dict[int, Property] = {}
        self.last_dice: tuple = (0, 0)
        self.turn_number: int = 0
        self.messages: List[str] = []

        self.chance_deck = CHANCE_CARDS.copy()
        self.community_deck = COMMUNITY_CARDS.copy()
        random.shuffle(self.chance_deck)
        random.shuffle(self.community_deck)

    def initialize(self) -> Dict[str, Any]:
        # creating the players
        for name in self.player_order:
            self.players[name] = Player(name=name)

        # creating the game tiles
        for pos, data in TILE_DATA.items():
            prop = Property(
                position=pos,
                name=data["name"],
                tile_type=data["type"],
                price=data.get("price", 0),
                mortgage_value=data.get("mortgage", 0),
                color_group=data.get("color", ""),
                house_cost=data.get("house_cost", 0),
                rent=data.get("rent", []),
            )

            self.tiles[pos] = prop

            # At this point, I want to save the game initialization, register the players in the database. save the game stats [WIP]

            self.messages.append(
                f"Game started with players: {', '.join(self.player_order)}"
            )
        return {
            "status": "success",
            "message": f"Game initialized with {len(self.players)} players",
            "players": self.player_order,
        }

    @property
    def current_player(self) -> Player:
        return self.players[self.player_order[self.current_player_idx]]

    @property
    def current_tile(self) -> Property:
        return self.tiles[self.current_player.position]

    def _log(self, msg: str):
        self.messages.append(msg)
        if len(self.messages) > 50:
            self.messages = self.messages[-50:]

    def get_full_state(self) -> Dict[str, Any]:
        return {
            "phase": self.phase.value,
            "current_player": self.current_player.name,
            "turn_number": self.turn_number,
            "players": {
                name: self._player_to_dict(p) for name, p in self.players.items()
            },
            "last_dice": self.last_dice,
            "recent_messages": self.messages[-10:],
        }

    def _player_to_dict(self, p: Player) -> Dict:
        return {
            "money": p.money,
            "position": p.position,
            "tile_name": self.tiles[p.position].name,
            "in_jail": p.in_jail,
            "jail_turns": p.jail_turns,
            "jail_cards": p.jail_cards,
            "properties": [self.tiles[pos].name for pos in p.properties],
            "property_positions": p.properties,
            "bankrupt": p.bankrupt,
        }

    def get_player_status(self, name: str) -> Dict[str, Any]:
        if name not in self.players:
            return {"error": f"Player {name} not found"}
        p = self.players[name]
        return {
            "name": name,
            "is_current_player": name == self.current_player.name,
            "phase": self.phase.value,
            **self._player_to_dict(p),
            "available_actions": (
                self.get_available_actions() if name == self.current_player.name else []
            ),
        }

    def get_available_actions(self) -> Dict[str, Any]:
        actions = []
        p = self.current_player

        if self.phase == GamePhase.WAITING_FOR_ROLL:
            actions.append("roll_dice_and_move")
        elif self.phase == GamePhase.IN_JAIL:
            actions.extend(["roll_for_doubles", "pay_jail_bail"])
            if p.jail_cards > 0:
                actions.append("use_jail_card")
        elif self.phase == GamePhase.WAITING_FOR_BUY_DECISION:
            actions.extend(["buy_property", "decline_purchase"])

        elif self.phase == GamePhase.TURN_COMPLETE:
            actions.append("end_turn")

        # Building actions (can do anytime on your turn)
        if self.phase not in [GamePhase.GAME_OVER]:
            buildable = self._get_buildable_properties(p)
            if buildable:
                actions.append(f"build_house (on positions: {buildable})")

        return {"current_player": p.name, "phase": self.phase.value, "actions": actions}

    def roll_and_move(self) -> Dict[str, Any]:
        if self.phase == GamePhase.IN_JAIL:
            return {"error": "You are in jail. Use jail actions instead."}
        if self.phase != GamePhase.WAITING_FOR_ROLL:
            return {"error": f"Cannot roll now. Current phase: {self.phase.value}"}

        p = self.current_player
        d1, d2 = random.randint(1, 6), random.randint(1, 6)
        self.last_dice = (d1, d2)
        total = d1 + d2
        is_doubles = d1 == d2

        self._log(
            f"{p.name} rolled [{d1}][{d2}] = {total}"
            + (" DOUBLES!" if is_doubles else "")
        )

        if is_doubles:
            p.doubles_count += 1
            if p.doubles_count >= 3:
                self._send_to_jail(p, "three doubles")
                return {
                    "dice": [d1, d2],
                    "doubles": True,
                    "result": "Sent to jail for 3 doubles!",
                }
        else:
            p.doubles_count = 0

        old_pos = p.position
        p.position = (p.position + total) % 40

        if p.position < old_pos and p.position != 10:
            p.money += 200
            self._log(f"{p.name} passed GO and collected $200")

        tile = self.current_tile
        self._log(f"{p.name} landed on {tile.name}")

        result = self._handle_landing(p, tile, total)
        result["dice"] = [d1, d2]
        result["doubles"] = is_doubles
        result["new_position"] = p.position
        result["tile"] = tile.name
        result["money"] = p.money

        if is_doubles and self.phase == GamePhase.TURN_COMPLETE:
            self.phase = GamePhase.WAITING_FOR_ROLL
            result["roll_again"] = True

        return result

    def _handle_landing(self, p: Player, tile: Property, dice_total: int) -> Dict:
        if tile.tile_type == TileType.GO_TO_JAIL:
            self._send_to_jail(p, "landed on Go To Jail")
            return {"result": "Go to Jail!"}

        if tile.tile_type == TileType.TAX:
            amount = TILE_DATA[tile.position].get("amount", 0)
            p.money -= amount
            self._log(f"{p.name} paid ${amount} tax")
            self.phase = GamePhase.TURN_COMPLETE
            return {"result": f"Paid ${amount} tax"}

        if tile.tile_type in [TileType.CHANCE, TileType.COMMUNITY_CHEST]:
            return self._draw_card(p, tile.tile_type)

        if tile.tile_type in [TileType.PROPERTY, TileType.RAILROAD, TileType.UTILITY]:
            if tile.owner is None:
                self.phase = GamePhase.WAITING_FOR_BUY_DECISION
                return {
                    "result": "unowned_property",
                    "price": tile.price,
                    "can_afford": p.money >= tile.price,
                }
            elif tile.owner != p.name:
                rent = self._calculate_rent(tile, dice_total)
                p.money -= rent
                self.players[tile.owner].money += rent
                self._log(f"{p.name} paid ${rent} rent to {tile.owner}")
                self.phase = GamePhase.TURN_COMPLETE
                return {"result": f"Paid ${rent} rent to {tile.owner}"}
            else:
                self.phase = GamePhase.TURN_COMPLETE
                return {"result": "Landed on own property"}

        self.phase = GamePhase.TURN_COMPLETE
        return {"result": "Nothing happens"}

    def _calculate_rent(self, tile: Property, dice: int) -> int:
        owner = self.players[tile.owner]
        if tile.tile_type == TileType.RAILROAD:
            count = sum(
                1
                for pos in owner.properties
                if self.tiles[pos].tile_type == TileType.RAILROAD
            )
            return tile.get_rent(railroads_owned=count)
        elif tile.tile_type == TileType.UTILITY:
            count = sum(
                1
                for pos in owner.properties
                if self.tiles[pos].tile_type == TileType.UTILITY
            )
            return tile.get_rent(dice_roll=dice, utilities_owned=count)
        return tile.get_rent()

    def _draw_card(self, p: Player, card_type: TileType) -> Dict:
        deck = self.chance_deck if card_type == TileType.CHANCE else self.community_deck
        if not deck:
            deck = (
                CHANCE_CARDS if card_type == TileType.CHANCE else COMMUNITY_CARDS
            ).copy()
            random.shuffle(deck)

        card = deck.pop(0)
        self._log(f"{p.name} drew: {card['text']}")

        if card["type"] == "money":
            p.money += card["amount"]
            self.phase = GamePhase.TURN_COMPLETE
            return {"result": card["text"], "money_change": card["amount"]}
        elif card["type"] == "move":
            old = p.position
            p.position = card["to"]
            if card["to"] < old:
                p.money += 200
            self.phase = GamePhase.TURN_COMPLETE
            return self._handle_landing(p, self.tiles[p.position], sum(self.last_dice))
        elif card["type"] == "move_back":
            p.position = (p.position - card["spaces"]) % 40
            self.phase = GamePhase.TURN_COMPLETE
            return self._handle_landing(p, self.tiles[p.position], sum(self.last_dice))
        elif card["type"] == "jail_card":
            p.jail_cards += 1
            self.phase = GamePhase.TURN_COMPLETE
            return {"result": "Received Get Out of Jail Free card"}
        elif card["type"] == "go_to_jail":
            self._send_to_jail(p, "card")
            return {"result": "Go to Jail!"}

        self.phase = GamePhase.TURN_COMPLETE
        return {"result": card["text"]}

    def _send_to_jail(self, p: Player, reason: str):
        p.position = 10
        p.in_jail = True
        p.jail_turns = 0
        p.doubles_count = 0
        self.phase = GamePhase.TURN_COMPLETE
        self._log(f"{p.name} sent to jail ({reason})")

    def buy_current_property(self) -> Dict[str, Any]:
        if self.phase != GamePhase.WAITING_FOR_BUY_DECISION:
            return {"error": "No property available to buy"}

        p = self.current_player
        tile = self.current_tile

        if p.money < tile.price:
            return {"error": f"Not enough money. Need ${tile.price}, have ${p.money}"}

        p.money -= tile.price
        tile.owner = p.name
        p.properties.append(tile.position)
        self._log(f"{p.name} bought {tile.name} for ${tile.price}")
        self.phase = GamePhase.TURN_COMPLETE

        return {
            "success": True,
            "property": tile.name,
            "price": tile.price,
            "remaining_money": p.money,
        }

    def decline_purchase(self) -> Dict[str, Any]:
        if self.phase != GamePhase.WAITING_FOR_BUY_DECISION:
            return {"error": "No property to decline"}
        tile = self.current_tile

        self.phase = GamePhase.TURN_COMPLETE
        self._log(f"Declined property purchase  for {tile.name}")

        return {
            "success": True,
            "successfully declined purchase of property": True,
            "property": tile.name,
        }

    def pay_bail(self) -> Dict[str, Any]:
        p = self.current_player
        if not p.in_jail:
            return {"error": "Not in jail"}
        if p.money < 50:
            return {"error": "Not enough money for bail"}

        p.money -= 50
        p.in_jail = False
        p.jail_turns = 0
        self.phase = GamePhase.WAITING_FOR_ROLL
        self._log(f"{p.name} paid $50 bail")
        return {"success": True, "remaining_money": p.money}

    def use_jail_card(self) -> Dict[str, Any]:
        p = self.current_player
        if not p.in_jail:
            return {"error": "Not in jail"}
        if p.jail_cards < 1:
            return {"error": "No jail cards"}

        p.jail_cards -= 1
        p.in_jail = False
        p.jail_turns = 0
        self.phase = GamePhase.WAITING_FOR_ROLL
        self._log(f"{p.name} used Get Out of Jail Free card")
        return {"success": True}

    def roll_for_doubles(self) -> Dict[str, Any]:
        p = self.current_player
        if not p.in_jail:
            return {"error": "Not in jail"}

        d1, d2 = random.randint(1, 6), random.randint(1, 6)
        self.last_dice = (d1, d2)
        self._log(f"{p.name} rolled [{d1}][{d2}] trying for doubles")

        if d1 == d2:
            p.in_jail = False
            p.jail_turns = 0
            self.phase = GamePhase.WAITING_FOR_ROLL
            self._log(f"{p.name} rolled doubles and escaped jail!")
            return {"success": True, "dice": [d1, d2], "escaped": True}

        p.jail_turns += 1
        if p.jail_turns >= 3:
            p.money -= 50
            p.in_jail = False
            p.jail_turns = 0
            self.phase = GamePhase.WAITING_FOR_ROLL
            self._log(f"{p.name} forced to pay $50 after 3 turns")
            return {"dice": [d1, d2], "escaped": False, "forced_bail": True}

        self.phase = GamePhase.TURN_COMPLETE
        return {"dice": [d1, d2], "escaped": False, "turns_remaining": 3 - p.jail_turns}

    def _get_buildable_properties(self, p: Player) -> List[int]:
        buildable = []
        for pos in p.properties:
            tile = self.tiles[pos]
            if (
                tile.tile_type != TileType.PROPERTY
                or tile.houses >= 5
                or tile.is_mortgaged
            ):
                continue
            group = COLOR_GROUPS.get(tile.color_group, [])
            if all(g in p.properties for g in group):
                min_houses = min(self.tiles[g].houses for g in group)
                if tile.houses <= min_houses and p.money >= tile.house_cost:
                    buildable.append(pos)
        return buildable

    def build_house(self, position: int) -> Dict[str, Any]:
        p = self.current_player
        if position not in p.properties:
            return {"error": "You don't own this property"}

        tile = self.tiles[position]
        if position not in self._get_buildable_properties(p):
            return {
                "error": "Cannot build here. Check monopoly ownership and even building rules."
            }

        p.money -= tile.house_cost
        tile.houses += 1
        building = "hotel" if tile.houses == 5 else f"{tile.houses} house(s)"
        self._log(f"{p.name} built on {tile.name} - now has {building}")

        return {
            "success": True,
            "property": tile.name,
            "houses": tile.houses,
            "cost": tile.house_cost,
        }

    def mortgage_property(self, position: int) -> Dict[str, Any]:
        p = self.current_player
        if position not in p.properties:
            return {"error": "You don't own this property"}

        tile = self.tiles[position]
        if tile.is_mortgaged:
            return {"error": "Already mortgaged"}
        if tile.houses > 0:
            return {"error": "Sell houses first"}

        tile.is_mortgaged = True
        p.money += tile.mortgage_value
        self._log(f"{p.name} mortgaged {tile.name} for ${tile.mortgage_value}")

        return {"success": True, "property": tile.name, "received": tile.mortgage_value}

    def unmortgage_property(self, position: int) -> Dict[str, Any]:
        p = self.current_player
        if position not in p.properties:
            return {"error": "You don't own this property"}

        tile = self.tiles[position]
        if not tile.is_mortgaged:
            return {"error": "Not mortgaged"}

        cost = int(tile.mortgage_value * 1.1)
        if p.money < cost:
            return {"error": f"Need ${cost} to unmortgage"}

        p.money -= cost
        tile.is_mortgaged = False
        self._log(f"{p.name} unmortgaged {tile.name} for ${cost}")

        return {"success": True, "property": tile.name, "cost": cost}

    def end_turn(self) -> Dict[str, Any]:
        if self.phase not in [GamePhase.TURN_COMPLETE]:
            return {"error": f"Cannot end turn in phase: {self.phase.value}"}

        p = self.current_player
        p.doubles_count = 0

        # Check bankruptcy
        if p.money < 0:
            p.bankrupt = True
            self._log(f"{p.name} is BANKRUPT!")

        # Move to next player
        active = [n for n in self.player_order if not self.players[n].bankrupt]
        if len(active) <= 1:
            self.phase = GamePhase.GAME_OVER
            winner = active[0] if active else None
            return {"game_over": True, "winner": winner}

        self.current_player_idx = (self.current_player_idx + 1) % len(self.player_order)
        while self.players[self.player_order[self.current_player_idx]].bankrupt:
            self.current_player_idx = (self.current_player_idx + 1) % len(
                self.player_order
            )

        self.turn_number += 1
        new_player = self.current_player
        self.phase = (
            GamePhase.IN_JAIL if new_player.in_jail else GamePhase.WAITING_FOR_ROLL
        )

        return {
            "success": True,
            "next_player": new_player.name,
            "turn": self.turn_number,
            "phase": self.phase.value,
        }

    def get_property_info(self, position: int) -> Dict[str, Any]:
        if position not in self.tiles:
            return {"error": "Invalid position"}
        t = self.tiles[position]
        return {
            "position": position,
            "name": t.name,
            "type": t.tile_type.value,
            "price": t.price,
            "owner": t.owner,
            "houses": t.houses,
            "mortgage_value": t.mortgage_value,
            "is_mortgaged": t.is_mortgaged,
            "color_group": t.color_group,
            "rent": t.rent,
            "house_cost": t.house_cost,
        }
