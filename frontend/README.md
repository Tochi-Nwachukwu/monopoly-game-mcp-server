# Monopoly Game Frontend

A real-time Next.js frontend for the Monopoly game server with WebSocket support and Tailwind CSS styling.

## Features

- 🎨 **Modern UI** - Beautiful, responsive design with glass-morphism effects
- 📡 **Real-time Updates** - WebSocket connection for live game state
- 🎲 **Interactive Board** - Visual game board with player positions
- 📊 **Live Statistics** - Real-time game stats and leaderboards
- 💾 **Session Persistence** - Player name saved to localStorage

## Tech Stack

- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **WebSocket** - Real-time communication

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm
- Backend server running (see `../backend/`)

### Installation

```bash
cd frontend

# Install dependencies
npm install
# or
yarn install
# or
pnpm install
```

### Environment Variables

Create a `.env.local` file (or copy from `.env.example` if available):

```env
# WebSocket URL for the game server
NEXT_PUBLIC_WS_URL=ws://localhost:8001/api/ws

# API URL for REST endpoints
NEXT_PUBLIC_API_URL=http://localhost:8001
```

### Development

```bash
# Start the development server
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── globals.css      # Global styles & Tailwind
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Main game page
│   ├── components/
│   │   ├── ActionsPanel.tsx # Game action buttons
│   │   ├── DiceDisplay.tsx  # Animated dice display
│   │   ├── GameBoard.tsx    # Visual Monopoly board
│   │   ├── GameStats.tsx    # Statistics panel
│   │   ├── GameView.tsx     # Main game view
│   │   ├── Lobby.tsx        # Pre-game lobby
│   │   ├── MessageLog.tsx   # Game message feed
│   │   └── PlayerPanel.tsx  # Player info cards
│   ├── hooks/
│   │   └── useWebSocket.ts  # WebSocket connection hook
│   └── types/
│       └── game.ts          # TypeScript types & constants
├── tailwind.config.ts
├── postcss.config.mjs
└── package.json
```

## Components

### Lobby
- Player registration
- Waiting room for players to join
- Start game button (requires 2+ players)
- Game statistics preview

### GameView
- Main game interface during play
- Responsive layout with board, players, and actions
- Game over overlay with winner display

### GameBoard
- Visual representation of the Monopoly board
- Player token positions
- Property colors and icons
- Hover tooltips with tile info

### PlayerPanel
- Player cards with money, properties, jail status
- Current turn indicator
- Property color indicators

### ActionsPanel
- Context-aware action buttons
- Roll dice, buy property, end turn, etc.
- Jail-specific actions

### DiceDisplay
- Animated dice rolling
- Doubles indicator
- Total value display

### GameStats
- Live game statistics
- Win leaderboard
- Recent games history
- Current game summary

### MessageLog
- Scrollable game event feed
- Recent messages from game engine

## WebSocket Messages

The frontend communicates with the backend via WebSocket:

### Sending
```typescript
// Register a player
{ type: "register_player", player_name: "Alice" }

// Start the game
{ type: "start_game" }

// Perform an action
{ type: "action", player_name: "Alice", action: "roll_dice_and_move" }

// Request current state
{ type: "get_state" }

// Reset game
{ type: "reset_game" }
```

### Receiving
```typescript
// Connection established
{ type: "connected", state: GameState }

// Player joined
{ type: "player_registered", player_name: string, state: GameState }

// Game started
{ type: "game_started", state: GameState }

// Action result
{ type: "action_result", result: ActionResult, state: GameState }
```

## Styling

The app uses a dark theme with:
- Gradient backgrounds
- Glass-morphism cards
- Animated elements
- Monopoly color palette for properties

Custom CSS classes in `globals.css`:
- `.card-glass` - Frosted glass effect
- `.monopoly-title` - Oswald font with letter spacing
- `.action-btn` - Interactive button styles
- `.tile-*` - Property color bands

## Development Notes

### Adding New Actions
1. Add the action to `ActionsPanel.tsx`
2. Update `useWebSocket.ts` if needed
3. Ensure backend supports the action

### Customizing Styles
1. Edit `globals.css` for global styles
2. Edit `tailwind.config.ts` for theme extensions
3. Use Tailwind utilities in components

## License

MIT

