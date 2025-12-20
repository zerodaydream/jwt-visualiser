"""
Ollama Setup and Health Check Module

Automatically ensures Ollama is running and the required model is downloaded.
"""

import subprocess
import sys
import time
from typing import Tuple, Optional
import httpx


def check_ollama_service() -> Tuple[bool, str]:
    """
    Check if Ollama service is running.
    
    Returns:
        Tuple of (is_running, message)
    """
    try:
        response = httpx.get("http://localhost:11434/api/tags", timeout=5.0)
        if response.status_code == 200:
            return True, "Ollama service is running"
        return False, f"Ollama service returned status code: {response.status_code}"
    except httpx.ConnectError:
        return False, "Ollama service is not running. Please start it with: ollama serve"
    except Exception as e:
        return False, f"Error checking Ollama service: {str(e)}"


def check_model_exists(model_name: str) -> Tuple[bool, str]:
    """
    Check if the specified model is already downloaded.
    
    Args:
        model_name: Name of the Ollama model (e.g., "phi3:3.8b")
        
    Returns:
        Tuple of (exists, message)
    """
    try:
        response = httpx.get("http://localhost:11434/api/tags", timeout=5.0)
        if response.status_code == 200:
            data = response.json()
            models = data.get("models", [])
            model_names = [m.get("name", "").replace(":latest", "") for m in models]
            
            # Check both with and without :latest suffix
            model_base = model_name.replace(":latest", "")
            
            for existing_model in model_names:
                if existing_model == model_base or existing_model == model_name:
                    return True, f"Model '{model_name}' is already downloaded"
            
            return False, f"Model '{model_name}' not found. Available models: {', '.join(model_names) if model_names else 'none'}"
        return False, "Could not retrieve model list from Ollama"
    except Exception as e:
        return False, f"Error checking model: {str(e)}"


def download_model(model_name: str, silent: bool = False) -> Tuple[bool, str]:
    """
    Download the specified Ollama model (BLOCKING).
    
    This function BLOCKS until the download completes.
    Shows real-time progress to the user.
    
    Args:
        model_name: Name of the Ollama model to download
        silent: If True, suppress progress output
        
    Returns:
        Tuple of (success, message)
    """
    if not silent:
        print(f"\n🔄 Downloading Ollama model: {model_name}")
        print("⏳ This will take 2-5 minutes depending on your internet speed...")
        print("📦 Model size: ~2.3GB (phi3:3.8b)")
        print("\n🚨 Please wait - the server will NOT start until download completes!")
        print("=" * 60 + "\n")
    
    try:
        # Use subprocess to call ollama pull
        process = subprocess.Popen(
            ["ollama", "pull", model_name],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1  # Line buffered for real-time output
        )
        
        # Stream output in real-time
        if not silent and process.stdout:
            print("📥 Download Progress:\n")
            for line in process.stdout:
                # Clean up the line and print with timestamp
                clean_line = line.rstrip()
                if clean_line:
                    print(f"   {clean_line}", flush=True)
        
        # Wait for completion (BLOCKING)
        return_code = process.wait()
        
        if return_code == 0:
            message = f"✅ Model '{model_name}' is ready!"
            if not silent:
                print("\n" + "=" * 60)
                print(f"🎉 {message}")
                print("=" * 60)
            return True, message
        else:
            stderr_output = process.stderr.read() if process.stderr else ""
            return False, f"Failed to download model: {stderr_output}"
            
    except FileNotFoundError:
        return False, "Ollama CLI not found. Please install Ollama from https://ollama.ai/download"
    except KeyboardInterrupt:
        print("\n\n⚠️  Download cancelled by user.")
        return False, "Download cancelled"
    except Exception as e:
        return False, f"Error downloading model: {str(e)}"


def ensure_model_ready(model_name: str, auto_download: bool = True) -> Tuple[bool, str]:
    """
    Ensure Ollama service is running and the model is downloaded.
    
    Args:
        model_name: Name of the Ollama model
        auto_download: If True, automatically download missing model
        
    Returns:
        Tuple of (ready, message)
    """
    # Check if Ollama service is running
    service_running, service_msg = check_ollama_service()
    if not service_running:
        return False, service_msg
    
    # Check if model exists
    model_exists, model_msg = check_model_exists(model_name)
    if model_exists:
        return True, model_msg
    
    # Model doesn't exist
    if not auto_download:
        return False, f"{model_msg}. Set auto_download=True to download automatically."
    
    # Download the model (BLOCKING - this will pause startup until complete)
    print(f"\n⚠️  Model '{model_name}' not found locally.")
    print("📥 Starting automatic download (server will start after download)...")
    success, download_msg = download_model(model_name)
    
    if success:
        print(f"\n🎊 Download complete! Model is ready for use.")
    
    return success, download_msg


def get_gpu_info() -> Optional[str]:
    """
    Get GPU information for Ollama (Metal for Apple Silicon).
    
    Returns:
        GPU info string or None
    """
    try:
        import platform
        if platform.system() == "Darwin":  # macOS
            # Check if Apple Silicon
            result = subprocess.run(
                ["sysctl", "-n", "machdep.cpu.brand_string"],
                capture_output=True,
                text=True,
                timeout=5
            )
            cpu_brand = result.stdout.strip()
            if "Apple" in cpu_brand:
                return f"Apple Silicon ({cpu_brand}) - Metal GPU acceleration enabled"
        return "GPU info not available"
    except Exception:
        return None


def startup_check(model_name: str, auto_download: bool = True) -> bool:
    """
    Perform startup health check for Ollama (BLOCKING).
    
    This function BLOCKS until the model is ready or fails.
    The application will not start serving requests until this completes.
    
    Args:
        model_name: Name of the Ollama model to use
        auto_download: If True, automatically download missing model
        
    Returns:
        True if ready, False otherwise
    """
    print("\n" + "=" * 60)
    print("🔍 Ollama Pre-flight Check")
    print("=" * 60)
    
    # Get GPU info
    gpu_info = get_gpu_info()
    if gpu_info:
        print(f"💻 {gpu_info}")
    
    print(f"🎯 Target Model: {model_name}")
    print("=" * 60)
    
    # Ensure model is ready (BLOCKS until downloaded or fails)
    ready, message = ensure_model_ready(model_name, auto_download)
    
    if ready:
        print(f"\n✅ {message}")
        print("=" * 60)
        return True
    else:
        print(f"\n❌ {message}")
        print("=" * 60)
        return False


if __name__ == "__main__":
    # Test the setup
    from app.core.config import settings
    
    print("Testing Ollama setup...")
    success = startup_check(settings.OLLAMA_MODEL, auto_download=True)
    
    if success:
        print("\n✅ All checks passed! Ollama is ready to use.")
        sys.exit(0)
    else:
        print("\n❌ Setup failed. Please check the errors above.")
        sys.exit(1)

