#!/usr/bin/env python3
"""
Standalone script to setup Ollama before running the application.

Usage:
    python scripts/setup_ollama.py
    
Or with custom model:
    python scripts/setup_ollama.py --model llama3.2:3b
"""

import sys
import argparse
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.llm.ollama_setup import startup_check
from app.core.config import settings


def main():
    parser = argparse.ArgumentParser(description="Setup Ollama for JWT Visualiser")
    parser.add_argument(
        "--model",
        type=str,
        default=settings.OLLAMA_MODEL,
        help=f"Model to download (default: {settings.OLLAMA_MODEL})"
    )
    parser.add_argument(
        "--no-download",
        action="store_true",
        help="Check only, don't auto-download missing model"
    )
    
    args = parser.parse_args()
    
    print("╔" + "═" * 58 + "╗")
    print("║" + " " * 15 + "JWT Visualiser - Ollama Setup" + " " * 14 + "║")
    print("╚" + "═" * 58 + "╝")
    
    success = startup_check(
        model_name=args.model,
        auto_download=not args.no_download
    )
    
    if success:
        print("\n" + "🎉 " * 20)
        print("   ✅ Ollama is ready! You can now start the backend server.")
        print("   " + "🎉 " * 20 + "\n")
        print("   Start the server with:")
        print("   cd backend && poetry run uvicorn app.main:app --reload\n")
        return 0
    else:
        print("\n" + "❌ " * 20)
        print("   Setup failed. Please fix the errors above.")
        print("   " + "❌ " * 20 + "\n")
        print("\n📖 Troubleshooting:")
        print("   1. Install Ollama: https://ollama.ai/download")
        print("   2. Start Ollama: ollama serve")
        print("   3. Pull model manually: ollama pull", args.model)
        print("   4. Or use paid APIs: set USE_PAID_LLM=true in .env\n")
        return 1


if __name__ == "__main__":
    sys.exit(main())

