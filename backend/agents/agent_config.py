"""
AI Model configurations for Monopoly agents.
Each agent represents a different AI model competing in the game.
"""
from typing import Dict, List, Any

# Available AI models as agents - each uses a different LLM
AVAILABLE_AGENTS: List[Dict[str, Any]] = [
    {
        "id": "gpt-oss",
        "name": "gpt-oss",
        "emoji": "🟢",
        "color": "#10a37f",
        "provider": "OpenAI",
        "model_id": "openai/gpt-oss-safeguard-20b",
        "description": "OpenAI's most capable multimodal model with vision and advanced reasoning",
    },
    {
        "id": "gpt-4o-mini",
        "name": "GPT-4.1  Mini",
        "emoji": "🌿",
        "color": "#74aa9c",
        "provider": "OpenAI",
        "model_id": "openai/gpt-4.1-mini",
        "description": "Fast and cost-effective OpenAI model for everyday tasks",
    },
    {
        "id": "claude-3.5-haiku",
        "name": "claude-3.5-haiku",
        "emoji": "🟠",
        "color": "#d97706",
        "provider": "Anthropic",
        "model_id": "anthropic/claude-3.5-haiku",
        "description": "Anthropic's balanced model with strong reasoning and safety",
    },
    {
        "id": "claude-haiku",
        "name": "Claude 3. Haiku",
        "emoji": "🍊",
        "color": "#fb923c",
        "provider": "Anthropic",
        "model_id": "anthropic/claude-3-haiku",
        "description": "Anthropic's fastest model optimized for quick responses",
    },
    {
        "id": "gemini-pro",
        "name": "Gemini 2.0 Pro",
        "emoji": "🔵",
        "color": "#4285f4",
        "provider": "Google",
        "model_id": "google/gemini-2.5-pro",
        "description": "Google's advanced multimodal AI with native tool use",
    },
    {
        "id": "gemini-flash",
        "name": "Gemini 2.5 Flash",
        "emoji": "💎",
        "color": "#34a853",
        "provider": "Google",
        "model_id": "google/gemini-2.5-flash-lite",
        "description": "Google's lightweight model for fast processing",
    },
    {
        "id": "grok-4.1",
        "name": "Grok 4.1",
        "emoji": "⚡",
        "color": "#1d9bf0",
        "provider": "xAI",
        "model_id": "xai/grok-4.1-fast-reasoning",
        "description": "xAI's witty and capable model with real-time knowledge",
    },
    {
        "id": "llama-70b",
        "name": "Llama 3.3 70B",
        "emoji": "🦙",
        "color": "#6366f1",
        "provider": "Meta",
        "model_id": "meta/llama-3.3-70b",
        "description": "Meta's powerful open-source model via Groq",
    },
]


def get_agent_by_id(agent_id: str) -> Dict[str, Any] | None:
    """Get agent configuration by ID."""
    for agent in AVAILABLE_AGENTS:
        if agent["id"] == agent_id:
            return agent
    return None


def get_agents_by_ids(agent_ids: List[str]) -> List[Dict[str, Any]]:
    """Get multiple agent configurations by IDs."""
    return [agent for agent in AVAILABLE_AGENTS if agent["id"] in agent_ids]


def get_system_prompt() -> str:
    """Generate the system prompt for all agents (same prompt for all models)."""
    return """You are playing Monopoly. You are a strategic player who wants to win.

RULES REMINDER:
- Buy properties when you can afford them, especially to complete color groups
- Building houses requires owning ALL properties in a color group
- Railroads are valuable - rent increases with each one owned
- Utilities multiply dice roll (4x for one, 10x for both)
- In jail: can pay $50, use Get Out of Jail Free card, or try rolling doubles (3 attempts max)
- Mortgaging gives you half the property value but you can't collect rent

STRATEGY TIPS:
- Orange and Red properties have the highest ROI
- Keep cash reserves for rent payments
- Complete color groups before building houses
- The 3-house mark is where most value comes from
- Railroads provide steady income

You must respond with ONLY a valid JSON object containing your decision.
No explanation, no markdown, just the JSON."""
