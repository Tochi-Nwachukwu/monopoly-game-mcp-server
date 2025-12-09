export interface Player {
  name: string;
  money: number;
  position: number;
  tile_name: string;
  in_jail: boolean;
  jail_turns: number;
  jail_cards: number;
  properties: string[];
  property_positions: number[];
  bankrupt: boolean;
}

export interface AIAgent {
  id: string;
  name: string;
  emoji: string;
  color: string;
  provider: string;
  model_id: string;
  description: string;
}
// used for AI reasoning panel
export interface AgentThought {
  agent_id: string;
  agent_name: string;
  timestamp: string;
  thought_type: "reasoning" | "decision" | "action_result" | "error";
  content: string;
  action?: string;
  params?: Record<string, unknown>;
}

export interface GameState {
  status?: string;
  phase?: string;
  current_player?: string;
  turn_number?: number;
  players?: Record<string, Player> | string[];
  last_dice?: [number, number];
  recent_messages?: string[];
}

export interface ActionResult {
  success?: boolean;
  error?: string;
  dice?: [number, number];
  doubles?: boolean;
  new_position?: number;
  tile?: string;
  money?: number;
  result?: string;
  roll_again?: boolean;
  game_over?: boolean;
  winner?: string;
  next_player?: string;
  turn?: number;
  warning?: string;
}

export interface WebSocketMessage {
  type: string;
  state?: GameState;
  message?: string;
  player_name?: string;
  action?: string;
  result?: ActionResult;
  thought?: AgentThought;
  thoughts?: AgentThought[];
  agent_ids?: string[];
}

export interface TileData {
  position: number;
  name: string;
  type: string;
  price?: number;
  color?: string;
  owner?: string;
  houses?: number;
}

export const TILE_DATA: Record<number, TileData> = {
  0: { position: 0, name: "GO", type: "go" },
  1: { position: 1, name: "Mediterranean Avenue", type: "property", price: 60, color: "brown" },
  2: { position: 2, name: "Community Chest", type: "community_chest" },
  3: { position: 3, name: "Baltic Avenue", type: "property", price: 60, color: "brown" },
  4: { position: 4, name: "Income Tax", type: "tax" },
  5: { position: 5, name: "Reading Railroad", type: "railroad", price: 200 },
  6: { position: 6, name: "Oriental Avenue", type: "property", price: 100, color: "light_blue" },
  7: { position: 7, name: "Chance", type: "chance" },
  8: { position: 8, name: "Vermont Avenue", type: "property", price: 100, color: "light_blue" },
  9: { position: 9, name: "Connecticut Avenue", type: "property", price: 120, color: "light_blue" },
  10: { position: 10, name: "Jail", type: "jail" },
  11: { position: 11, name: "St. Charles Place", type: "property", price: 140, color: "pink" },
  12: { position: 12, name: "Electric Company", type: "utility", price: 150 },
  13: { position: 13, name: "States Avenue", type: "property", price: 140, color: "pink" },
  14: { position: 14, name: "Virginia Avenue", type: "property", price: 160, color: "pink" },
  15: { position: 15, name: "Pennsylvania Railroad", type: "railroad", price: 200 },
  16: { position: 16, name: "St. James Place", type: "property", price: 180, color: "orange" },
  17: { position: 17, name: "Community Chest", type: "community_chest" },
  18: { position: 18, name: "Tennessee Avenue", type: "property", price: 180, color: "orange" },
  19: { position: 19, name: "New York Avenue", type: "property", price: 200, color: "orange" },
  20: { position: 20, name: "Free Parking", type: "free_parking" },
  21: { position: 21, name: "Kentucky Avenue", type: "property", price: 220, color: "red" },
  22: { position: 22, name: "Chance", type: "chance" },
  23: { position: 23, name: "Indiana Avenue", type: "property", price: 220, color: "red" },
  24: { position: 24, name: "Illinois Avenue", type: "property", price: 240, color: "red" },
  25: { position: 25, name: "B&O Railroad", type: "railroad", price: 200 },
  26: { position: 26, name: "Atlantic Avenue", type: "property", price: 260, color: "yellow" },
  27: { position: 27, name: "Ventnor Avenue", type: "property", price: 260, color: "yellow" },
  28: { position: 28, name: "Water Works", type: "utility", price: 150 },
  29: { position: 29, name: "Marvin Gardens", type: "property", price: 280, color: "yellow" },
  30: { position: 30, name: "Go To Jail", type: "go_to_jail" },
  31: { position: 31, name: "Pacific Avenue", type: "property", price: 300, color: "green" },
  32: { position: 32, name: "North Carolina Avenue", type: "property", price: 300, color: "green" },
  33: { position: 33, name: "Community Chest", type: "community_chest" },
  34: { position: 34, name: "Pennsylvania Avenue", type: "property", price: 320, color: "green" },
  35: { position: 35, name: "Short Line Railroad", type: "railroad", price: 200 },
  36: { position: 36, name: "Chance", type: "chance" },
  37: { position: 37, name: "Park Place", type: "property", price: 350, color: "dark_blue" },
  38: { position: 38, name: "Luxury Tax", type: "tax" },
  39: { position: 39, name: "Boardwalk", type: "property", price: 400, color: "dark_blue" },
};

export const PLAYER_COLORS = [
  "#ef4444", // red
  "#3b82f6", // blue
  "#22c55e", // green
  "#eab308", // yellow
  "#a855f7", // purple
  "#f97316", // orange
  "#ec4899", // pink
  "#14b8a6", // teal
];

export const COLOR_MAP: Record<string, string> = {
  brown: "#955436",
  light_blue: "#aae0fa",
  pink: "#d93a96",
  orange: "#f7941d",
  red: "#ed1b24",
  yellow: "#fef200",
  green: "#1fb25a",
  dark_blue: "#0072bb",
};

