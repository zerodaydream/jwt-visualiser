import jwt
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
from cryptography.hazmat.primitives.asymmetric import rsa, ec, ed25519
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

class JwtGenerator:
    """
    Handles the creation of production-ready JWTs with automatic key generation.
    """
    
    @staticmethod
    def _generate_rsa_key() -> str:
        """Generate an RSA private key for RS256/RS384/RS512/PS256/PS384/PS512"""
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        return pem.decode('utf-8')
    
    @staticmethod
    def _generate_ec_key(curve_name: str) -> str:
        """Generate an EC private key for ES256/ES384/ES512"""
        curve_map = {
            'ES256': ec.SECP256R1(),
            'ES384': ec.SECP384R1(),
            'ES512': ec.SECP521R1()
        }
        curve = curve_map.get(curve_name, ec.SECP256R1())
        
        private_key = ec.generate_private_key(curve, default_backend())
        pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        return pem.decode('utf-8')
    
    @staticmethod
    def _generate_ed25519_key() -> str:
        """Generate an Ed25519 private key for EdDSA"""
        private_key = ed25519.Ed25519PrivateKey.generate()
        pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        return pem.decode('utf-8')
    
    @staticmethod
    def _get_key_for_algorithm(secret: str, algorithm: str) -> str:
        """
        Auto-generate appropriate keys for asymmetric algorithms if needed.
        """
        # If secret is AUTO_GENERATE_KEY or empty for asymmetric algorithms, generate key
        if secret == "AUTO_GENERATE_KEY" or (not secret and algorithm not in ['HS256', 'HS384', 'HS512', 'none']):
            if algorithm in ['RS256', 'RS384', 'RS512', 'PS256', 'PS384', 'PS512']:
                return JwtGenerator._generate_rsa_key()
            elif algorithm in ['ES256', 'ES384', 'ES512']:
                return JwtGenerator._generate_ec_key(algorithm)
            elif algorithm == 'EdDSA':
                return JwtGenerator._generate_ed25519_key()
        
        return secret
    
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
            
            # 5. Get appropriate key (auto-generate if needed)
            key = JwtGenerator._get_key_for_algorithm(secret, algorithm)
            
            # 6. Encode the Token
            token = jwt.encode(
                claims,
                key=key,
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