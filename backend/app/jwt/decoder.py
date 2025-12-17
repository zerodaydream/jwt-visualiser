import jwt
from typing import Dict, Any, Optional
from dataclasses import dataclass

@dataclass
class DecodedToken:
    header: Dict[str, Any]
    payload: Dict[str, Any]
    signature: Optional[str] = None
    raw_token: str = ""

class SafeDecoder:
    """
    Decodes JWTs for inspection without verification.
    """
    
    @staticmethod
    def decode(token: str) -> DecodedToken:
        try:
            # 1. Get Unverified Header
            header = jwt.get_unverified_header(token)
            
            # 2. Get Unverified Payload
            # options={"verify_signature": False} is CRITICAL here
            payload = jwt.decode(token, options={"verify_signature": False})
            
            # 3. Extract Signature (Visual only)
            parts = token.split(".")
            signature = parts[2] if len(parts) == 3 else None

            return DecodedToken(
                header=header,
                payload=payload,
                signature=signature,
                raw_token=token
            )

        except jwt.DecodeError:
            raise ValueError("Invalid JWT format. Could not decode Base64 sections.")
        except Exception as e:
            raise ValueError(f"Error decoding token: {str(e)}")