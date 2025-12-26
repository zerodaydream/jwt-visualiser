"""
Web Scraper for JWT Information
Fetches JWT documentation, articles, and best practices from authoritative sources.
"""

import httpx
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
from bs4 import BeautifulSoup
import hashlib
from urllib.parse import urljoin, urlparse
import re


class JWTWebScraper:
    """
    Scrapes JWT information from authoritative sources.
    Extracts content with proper source attribution.
    """
    
    # Authoritative JWT sources
    JWT_SOURCES = [
        # Official Specifications
        {
            "url": "https://datatracker.ietf.org/doc/html/rfc7519",
            "type": "specification",
            "source_name": "RFC 7519 - JSON Web Token (JWT)",
            "priority": "critical"
        },
        {
            "url": "https://datatracker.ietf.org/doc/html/rfc7515",
            "type": "specification",
            "source_name": "RFC 7515 - JSON Web Signature (JWS)",
            "priority": "critical"
        },
        {
            "url": "https://datatracker.ietf.org/doc/html/rfc7516",
            "type": "specification",
            "source_name": "RFC 7516 - JSON Web Encryption (JWE)",
            "priority": "critical"
        },
        {
            "url": "https://datatracker.ietf.org/doc/html/rfc7517",
            "type": "specification",
            "source_name": "RFC 7517 - JSON Web Key (JWK)",
            "priority": "critical"
        },
        {
            "url": "https://datatracker.ietf.org/doc/html/rfc7518",
            "type": "specification",
            "source_name": "RFC 7518 - JSON Web Algorithms (JWA)",
            "priority": "critical"
        },
        # JWT.io
        {
            "url": "https://jwt.io/introduction",
            "type": "documentation",
            "source_name": "JWT.io - Introduction",
            "priority": "high"
        },
        # OWASP
        {
            "url": "https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html",
            "type": "security",
            "source_name": "OWASP - JWT Cheat Sheet",
            "priority": "high"
        },
        # JWT.io
        {
            "url": "https://datatracker.ietf.org/doc/html/rfc7519#section-4.1",
            "type": "documentation",
            "source_name": "JWT.io - Introduction",
            "priority": "critical"
        },
    ]
    
    def __init__(self, timeout: int = 30, max_retries: int = 3):
        """
        Initialize the scraper.
        
        Args:
            timeout: Request timeout in seconds
            max_retries: Maximum number of retry attempts
        """
        self.timeout = timeout
        self.max_retries = max_retries
        self.scraped_urls = set()
        
    async def scrape_all_sources(self) -> List[Dict[str, Any]]:
        """
        Scrape all JWT sources concurrently.
        
        Returns:
            List of scraped documents with metadata
        """
        print(f"Starting to scrape {len(self.JWT_SOURCES)} JWT sources...")
        
        async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
            tasks = [
                self._scrape_source(client, source)
                for source in self.JWT_SOURCES
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
        # Flatten and filter results
        documents = []
        for result in results:
            if isinstance(result, list):
                documents.extend(result)
            elif isinstance(result, Exception):
                print(f"Error during scraping: {result}")
                
        print(f"Successfully scraped {len(documents)} documents")
        return documents
    
    async def _scrape_source(
        self, 
        client: httpx.AsyncClient, 
        source: Dict[str, str]
    ) -> List[Dict[str, Any]]:
        """
        Scrape a single source with retries.
        
        Args:
            client: HTTP client
            source: Source configuration
            
        Returns:
            List of document chunks with metadata
        """
        url = source["url"]
        
        if url in self.scraped_urls:
            return []
            
        print(f"Scraping: {source['source_name']}")
        
        for attempt in range(self.max_retries):
            try:
                response = await client.get(url, headers={
                    "User-Agent": "Mozilla/5.0 (JWT Documentation Aggregator)"
                })
                response.raise_for_status()
                
                self.scraped_urls.add(url)
                
                # Parse HTML
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Extract content based on source type
                if source["type"] == "specification":
                    documents = self._parse_rfc_document(soup, source)
                else:
                    documents = self._parse_general_document(soup, source)
                    
                print(f"  ✓ Extracted {len(documents)} chunks from {source['source_name']}")
                return documents
                
            except httpx.HTTPStatusError as e:
                print(f"  ✗ HTTP error {e.response.status_code} for {url}")
                if attempt == self.max_retries - 1:
                    return []
                await asyncio.sleep(2 ** attempt)
                
            except Exception as e:
                print(f"  ✗ Error scraping {url}: {str(e)}")
                if attempt == self.max_retries - 1:
                    return []
                await asyncio.sleep(2 ** attempt)
                
        return []
    
    def _parse_rfc_document(
        self, 
        soup: BeautifulSoup, 
        source: Dict[str, str]
    ) -> List[Dict[str, Any]]:
        """
        Parse RFC specification documents.
        
        Args:
            soup: BeautifulSoup object
            source: Source metadata
            
        Returns:
            List of document chunks
        """
        documents = []
        
        # Find main content
        content_div = soup.find('div', {'id': 'content'}) or soup.find('main') or soup.body
        
        if not content_div:
            return documents
            
        # Extract sections
        sections = content_div.find_all(['section', 'div'], class_=re.compile(r'section|chapter'))
        
        if not sections:
            # Fallback: split by headers
            sections = self._split_by_headers(content_div)
            
        for i, section in enumerate(sections):
            # Get section title
            title_tag = section.find(['h1', 'h2', 'h3', 'h4'])
            title = title_tag.get_text(strip=True) if title_tag else f"Section {i+1}"
            
            # Get section text
            text = section.get_text(separator='\n', strip=True)
            
            # Skip if too short
            if len(text) < 100:
                continue
                
            # Create section ID for precise sourcing
            section_id = section.get('id', f'section-{i+1}')
            section_url = f"{source['url']}#{section_id}"
            
            documents.append({
                "content": text,
                "metadata": {
                    "source_url": section_url,
                    "source_name": source["source_name"],
                    "source_type": source["type"],
                    "priority": source["priority"],
                    "section_title": title,
                    "section_id": section_id,
                    "scraped_at": datetime.utcnow().isoformat(),
                    "document_type": "jwt_knowledge",
                    "content_hash": self._generate_hash(text)
                }
            })
            
        return documents
    
    def _parse_general_document(
        self, 
        soup: BeautifulSoup, 
        source: Dict[str, str]
    ) -> List[Dict[str, Any]]:
        """
        Parse general documentation pages.
        
        Args:
            soup: BeautifulSoup object
            source: Source metadata
            
        Returns:
            List of document chunks
        """
        documents = []
        
        # Remove script and style elements
        for element in soup(['script', 'style', 'nav', 'footer', 'header']):
            element.decompose()
            
        # Find main content area
        main_content = (
            soup.find('main') or 
            soup.find('article') or 
            soup.find('div', class_=re.compile(r'content|main|article')) or
            soup.body
        )
        
        if not main_content:
            return documents
            
        # Extract text chunks based on structure
        current_chunk = []
        current_title = ""
        chunk_id = 0
        
        for element in main_content.find_all(['h1', 'h2', 'h3', 'h4', 'p', 'li', 'pre', 'code']):
            if element.name in ['h1', 'h2', 'h3', 'h4']:
                # Save previous chunk
                if current_chunk:
                    chunk_text = '\n'.join(current_chunk)
                    if len(chunk_text) >= 100:
                        documents.append({
                            "content": chunk_text,
                            "metadata": {
                                "source_url": source["url"],
                                "source_name": source["source_name"],
                                "source_type": source["type"],
                                "priority": source["priority"],
                                "section_title": current_title,
                                "section_id": f"chunk-{chunk_id}",
                                "scraped_at": datetime.utcnow().isoformat(),
                                "document_type": "jwt_knowledge",
                                "content_hash": self._generate_hash(chunk_text)
                            }
                        })
                        chunk_id += 1
                        
                # Start new chunk
                current_title = element.get_text(strip=True)
                current_chunk = [f"## {current_title}"]
                
            else:
                text = element.get_text(strip=True)
                if text:
                    current_chunk.append(text)
                    
        # Save last chunk
        if current_chunk:
            chunk_text = '\n'.join(current_chunk)
            if len(chunk_text) >= 100:
                documents.append({
                    "content": chunk_text,
                    "metadata": {
                        "source_url": source["url"],
                        "source_name": source["source_name"],
                        "source_type": source["type"],
                        "priority": source["priority"],
                        "section_title": current_title,
                        "section_id": f"chunk-{chunk_id}",
                        "scraped_at": datetime.utcnow().isoformat(),
                        "document_type": "jwt_knowledge",
                        "content_hash": self._generate_hash(chunk_text)
                    }
                })
                
        return documents
    
    def _split_by_headers(self, content) -> List:
        """Split content by header tags."""
        sections = []
        current_section = []
        
        for element in content.find_all(['h1', 'h2', 'h3', 'h4', 'p', 'div']):
            if element.name in ['h1', 'h2', 'h3', 'h4']:
                if current_section:
                    sections.append(BeautifulSoup(
                        ''.join(str(e) for e in current_section),
                        'html.parser'
                    ))
                current_section = [element]
            else:
                current_section.append(element)
                
        if current_section:
            sections.append(BeautifulSoup(
                ''.join(str(e) for e in current_section),
                'html.parser'
            ))
            
        return sections
    
    def _generate_hash(self, text: str) -> str:
        """Generate a hash for deduplication."""
        return hashlib.sha256(text.encode('utf-8')).hexdigest()[:16]
    
    async def scrape_custom_urls(self, urls: List[str]) -> List[Dict[str, Any]]:
        """
        Scrape custom URLs provided by user.
        
        Args:
            urls: List of URLs to scrape
            
        Returns:
            List of scraped documents
        """
        documents = []
        
        async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
            for url in urls:
                source = {
                    "url": url,
                    "type": "custom",
                    "source_name": urlparse(url).netloc,
                    "priority": "medium"
                }
                
                result = await self._scrape_source(client, source)
                documents.extend(result)
                
        return documents

