from datetime import datetime, timezone
from typing import Dict, Any, List

class JwtAnalyzer:
    """
    Analyzes JWT content to provide human-readable context and security hints.
    """

    CLAIM_DESCRIPTIONS = {
        "iss": "Issuer: The entity that issued this token.",
        "sub": "Subject: The specific user or entity this token refers to.",
        "aud": "Audience: The intended recipient of this token.",
        "exp": "Expiration Time: When this token stops being valid.",
        "nbf": "Not Before: The token is not valid before this time.",
        "iat": "Issued At: When this token was created.",
        "jti": "JWT ID: A unique identifier for this token.",
        "azp": "Authorized Party: The party authorized to use the token.",
        "scope": "Scope: Permissions granted to this token."
    }

    ALGORITHM_RISKS = {
        "none": "CRITICAL: 'none' algorithm means this token is unsecured.",
        "HS256": "Symmetric Key: Requires the secret to be shared. If the secret is weak, it can be brute-forced.",
        "RS256": "Asymmetric Key: Uses a public/private key pair. Generally secure.",
    }

    @staticmethod
    def analyze(header: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        analysis = {
            "header_explanation": "",
            "claims_explanation": [],
            "status": "VALID", # Default, will change if expired
            "risk_warnings": []
        }

        # 1. Header Analysis
        alg = header.get("alg", "unknown")
        typ = header.get("typ", "JWT")
        analysis["header_explanation"] = (
            f"This is a {typ} token using the {alg} algorithm. "
            f"{JwtAnalyzer.ALGORITHM_RISKS.get(alg, '')}"
        )

        # 2. Payload Analysis (Iterate over all keys)
        current_time = datetime.now(timezone.utc).timestamp()

        for key, value in payload.items():
            desc = JwtAnalyzer.CLAIM_DESCRIPTIONS.get(key, "Custom Claim")
            
            # Handle Time Claims
            if key in ['exp', 'iat', 'nbf'] and isinstance(value, (int, float)):
                dt_object = datetime.fromtimestamp(value, tz=timezone.utc)
                readable_date = dt_object.strftime('%Y-%m-%d %H:%M:%S UTC')
                
                # Check Expiration specifically
                if key == 'exp':
                    if value < current_time:
                        desc = f"{desc} (EXPIRED at {readable_date})"
                        analysis["status"] = "EXPIRED"
                    else:
                        remaining_mins = int((value - current_time) / 60)
                        # Format time remaining
                        if remaining_mins >= 60:
                            hours = remaining_mins // 60
                            mins = remaining_mins % 60
                            if mins == 0:
                                time_str = f"{hours}h"
                            else:
                                time_str = f"{hours}h {mins}m"
                        else:
                            time_str = f"{remaining_mins}m"
                        desc = f"{desc} (Valid until {readable_date}, ~{time_str} left)"
                else:
                    desc = f"{desc} ({readable_date})"
            
            analysis["claims_explanation"].append({
                "key": key,
                "value": value,
                "description": desc
            })

        return analysis