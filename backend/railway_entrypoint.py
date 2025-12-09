"""
Railway entry point - runs FastAPI server on the PORT environment variable.
"""
import os
import uvicorn

# Import the FastAPI app and all setup from mcp_server
from mcp_server import app

if __name__ == "__main__":
    # Railway provides PORT env var
    port = int(os.environ.get("PORT", 8001))
    
    print(f"Starting Monopoly Game API on port {port}...")
    print(f"Health check: http://0.0.0.0:{port}/api/state")
    
    # Run FastAPI as the main process
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=port, 
        log_level="info"
    )

