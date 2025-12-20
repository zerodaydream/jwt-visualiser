"""
Rate Limiting Middleware for JWT Visualizer
Implements IP-based and session-based rate limiting to protect free-tier API quotas.
"""

from datetime import datetime, timedelta
from typing import Dict, Optional
from fastapi import Request, HTTPException, status
from collections import defaultdict
import asyncio


class RateLimiter:
    """
    Rate limiter with IP-based and session-based tracking.
    Resets daily at midnight UTC.
    """
    
    def __init__(
        self,
        requests_per_ip_per_day: int = 10,
        requests_per_session_per_day: int = 15,
        global_requests_per_day: int = 45,  # Leave buffer of 5 for safety
    ):
        """
        Initialize rate limiter.
        
        Args:
            requests_per_ip_per_day: Max requests per IP address per day
            requests_per_session_per_day: Max requests per session per day
            global_requests_per_day: Max total requests across all users per day
        """
        self.ip_limit = requests_per_ip_per_day
        self.session_limit = requests_per_session_per_day
        self.global_limit = global_requests_per_day
        
        # Storage for rate limit tracking
        self.ip_requests: Dict[str, list] = defaultdict(list)
        self.session_requests: Dict[str, list] = defaultdict(list)
        self.global_requests: list = []
        
        # Track when we last cleaned up old data
        self.last_cleanup = datetime.utcnow()
        
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request, handling proxies."""
        # Check common proxy headers
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            # X-Forwarded-For can contain multiple IPs, take the first one
            return forwarded.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to direct client
        if request.client:
            return request.client.host
        
        return "unknown"
    
    def _cleanup_old_requests(self):
        """Remove requests older than 24 hours to free memory."""
        now = datetime.utcnow()
        cutoff = now - timedelta(days=1)
        
        # Clean IP requests
        for ip in list(self.ip_requests.keys()):
            self.ip_requests[ip] = [
                ts for ts in self.ip_requests[ip] if ts > cutoff
            ]
            if not self.ip_requests[ip]:
                del self.ip_requests[ip]
        
        # Clean session requests
        for session in list(self.session_requests.keys()):
            self.session_requests[session] = [
                ts for ts in self.session_requests[session] if ts > cutoff
            ]
            if not self.session_requests[session]:
                del self.session_requests[session]
        
        # Clean global requests
        self.global_requests = [ts for ts in self.global_requests if ts > cutoff]
        
        self.last_cleanup = now
    
    def _count_requests_in_window(self, timestamps: list) -> int:
        """Count requests within the last 24 hours."""
        now = datetime.utcnow()
        cutoff = now - timedelta(days=1)
        return sum(1 for ts in timestamps if ts > cutoff)
    
    async def check_rate_limit(
        self, 
        request: Request, 
        session_id: Optional[str] = None
    ) -> Dict[str, any]:
        """
        Check if request should be rate limited.
        
        Args:
            request: FastAPI request object
            session_id: Optional session ID for session-based limiting
            
        Returns:
            Dict with rate limit info
            
        Raises:
            HTTPException: If rate limit is exceeded
        """
        # Cleanup old data every hour
        if datetime.utcnow() - self.last_cleanup > timedelta(hours=1):
            self._cleanup_old_requests()
        
        now = datetime.utcnow()
        client_ip = self._get_client_ip(request)
        
        # Check global limit first (most critical)
        global_count = self._count_requests_in_window(self.global_requests)
        if global_count >= self.global_limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "Daily API quota exceeded",
                    "message": "The service has reached its daily request limit. Please try again tomorrow.",
                    "retry_after": self._seconds_until_reset(),
                    "limit_type": "global"
                }
            )
        
        # Check IP-based limit
        ip_count = self._count_requests_in_window(self.ip_requests[client_ip])
        if ip_count >= self.ip_limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "Rate limit exceeded",
                    "message": f"You have reached your daily limit of {self.ip_limit} requests. Please try again tomorrow.",
                    "requests_made": ip_count,
                    "requests_limit": self.ip_limit,
                    "retry_after": self._seconds_until_reset(),
                    "limit_type": "ip"
                }
            )
        
        # Check session-based limit (if session provided)
        if session_id:
            session_count = self._count_requests_in_window(self.session_requests[session_id])
            if session_count >= self.session_limit:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "error": "Session rate limit exceeded",
                        "message": f"This session has reached its daily limit of {self.session_limit} requests.",
                        "requests_made": session_count,
                        "requests_limit": self.session_limit,
                        "retry_after": self._seconds_until_reset(),
                        "limit_type": "session"
                    }
                )
        
        # Record this request
        self.ip_requests[client_ip].append(now)
        if session_id:
            self.session_requests[session_id].append(now)
        self.global_requests.append(now)
        
        # Return rate limit info
        return {
            "ip": client_ip,
            "ip_requests_remaining": self.ip_limit - ip_count - 1,
            "ip_requests_limit": self.ip_limit,
            "session_requests_remaining": self.session_limit - session_count - 1 if session_id else None,
            "global_requests_used": global_count + 1,
            "global_requests_limit": self.global_limit,
            "reset_time": self._get_reset_time().isoformat()
        }
    
    def _seconds_until_reset(self) -> int:
        """Calculate seconds until next midnight UTC."""
        now = datetime.utcnow()
        tomorrow = (now + timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        return int((tomorrow - now).total_seconds())
    
    def _get_reset_time(self) -> datetime:
        """Get the next reset time (midnight UTC)."""
        now = datetime.utcnow()
        return (now + timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
    
    def get_stats(self) -> Dict:
        """Get current rate limiter statistics."""
        return {
            "total_ips_tracked": len(self.ip_requests),
            "total_sessions_tracked": len(self.session_requests),
            "global_requests_today": self._count_requests_in_window(self.global_requests),
            "global_limit": self.global_limit,
            "reset_in_seconds": self._seconds_until_reset(),
            "ip_limit": self.ip_limit,
            "session_limit": self.session_limit
        }


# Global rate limiter instance
rate_limiter = RateLimiter(
    requests_per_ip_per_day=10,
    requests_per_session_per_day=15,
    global_requests_per_day=45
)


def get_rate_limiter() -> RateLimiter:
    """Get the global rate limiter instance."""
    return rate_limiter

