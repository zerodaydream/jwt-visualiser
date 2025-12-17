import jwt
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional

class JwtGenerator:
    """
    Handles the creation of production-ready JWTs.
    """
    
    @staticmethod
    def generate_token(
        payload: Dict[str, Any],
        secret: str,
        algorithm: str = "HS256",
        expires_in_minutes: Optional[int] = None
    ) -> str:
        try:
            # 1. Prepare claims (Create a copy to ensure we don't mutate the original input)
            claims = payload.copy()

            # 2. Add 'iat' (Issued At) if not present
            # This is a standard practice for production tokens.
            if "iat" not in claims:
                claims["iat"] = datetime.now(timezone.utc)

            # 3. Add 'jti' (Unique Identifier) if not present
            # Useful for revocation lists and tracking.
            if "jti" not in claims:
                claims["jti"] = str(uuid.uuid4())

            # 4. Handle Expiration
            # If the user provides an expiry time, we calculate the 'exp' claim.
            if expires_in_minutes is not None:
                # Ensure we don't overwrite an explicit 'exp' if the user manually put it in the payload
                if "exp" not in claims:
                    exp_time = datetime.now(timezone.utc) + timedelta(minutes=expires_in_minutes)
                    claims["exp"] = exp_time
            
            # 5. Encode the Token
            # Note: If algorithm is Asymmetric (e.g., RS256), the 'secret' must be the Private Key string.
            token = jwt.encode(
                claims,
                key=secret,
                algorithm=algorithm
            )
            
            # PyJWT returns a string in v2.0+, but older versions returned bytes.
            # We ensure it is a string for the API response.
            if isinstance(token, bytes):
                token = token.decode('utf-8')
                
            return token

        except Exception as e:
            # Catch errors like Invalid Key or Unsupported Algorithm
            raise ValueError(f"Generation failed: {str(e)}")