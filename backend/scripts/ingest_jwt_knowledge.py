#!/usr/bin/env python3
"""
JWT Knowledge Base Ingestion Script
Run this script to populate the vector database with JWT documentation.

Usage:
    python scripts/ingest_jwt_knowledge.py [--custom-urls url1 url2 ...]
"""

import sys
import os
import asyncio
import argparse

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.vector.ingestion_service import JWTIngestionService
from app.vector.chroma_adapter import ChromaAdapter
from app.core.config import settings


async def main(custom_urls=None):
    """
    Main ingestion function.
    
    Args:
        custom_urls: Optional list of custom URLs to scrape
    """
    print("\n" + "="*70)
    print("JWT KNOWLEDGE BASE INGESTION")
    print("="*70)
    print(f"\nConfiguration:")
    print(f"  RAG Enabled: {settings.ENABLE_RAG}")
    print(f"  QA Learning Enabled: {settings.ENABLE_QA_LEARNING}")
    print(f"  Vector DB Path: {settings.VECTOR_DB_PATH}")
    print(f"  LLM Provider: {settings.LLM_PROVIDER}")
    print("")
    
    if not settings.ENABLE_RAG:
        print("❌ ERROR: RAG is disabled!")
        print("   Set ENABLE_RAG=True in your .env file to use this feature.")
        print("")
        return 1
    
    # Initialize services
    print("🔧 Initializing services...")
    vector_adapter = ChromaAdapter()
    
    if not vector_adapter.embedding_fn:
        print("❌ ERROR: Embedding model failed to load!")
        print("   Make sure sentence-transformers is installed.")
        return 1
    
    ingestion_service = JWTIngestionService(
        vector_adapter=vector_adapter,
        chunk_size=1000,
        chunk_overlap=200,
        batch_size=50
    )
    
    print("✅ Services initialized\n")
    
    # Run ingestion
    print("Starting ingestion process...")
    print("This may take several minutes depending on network speed.\n")
    
    try:
        status = await ingestion_service.ingest_from_web(
            custom_urls=custom_urls
        )
        
        # Display results
        print("\n" + "="*70)
        print("INGESTION RESULTS")
        print("="*70)
        
        success_rate = status.get("success_rate", 0)
        
        if success_rate >= 80:
            print("✅ Ingestion completed successfully!")
        elif success_rate >= 50:
            print("⚠️  Ingestion completed with warnings")
        else:
            print("❌ Ingestion completed with errors")
            
        print(f"\n📊 Statistics:")
        print(f"   Total Documents: {status.get('total_documents', 0)}")
        print(f"   Processed: {status.get('processed_documents', 0)}")
        print(f"   Failed: {status.get('failed_documents', 0)}")
        print(f"   Total Chunks: {status.get('total_chunks', 0)}")
        print(f"   Success Rate: {success_rate:.1f}%")
        
        duration = status.get('duration_seconds', 0)
        if duration:
            print(f"   Duration: {duration:.1f} seconds")
            
        # Display errors if any
        errors = status.get('errors', [])
        if errors:
            print(f"\n⚠️  Errors ({len(errors)}):")
            for idx, error in enumerate(errors[:5], 1):  # Show first 5 errors
                print(f"   {idx}. {error.get('error', 'Unknown error')}")
            if len(errors) > 5:
                print(f"   ... and {len(errors) - 5} more errors")
        
        # Display vector DB stats
        vector_stats = status.get('vector_db_stats', {})
        if vector_stats:
            print(f"\n💾 Vector Database:")
            print(f"   Collection: {vector_stats.get('collection_name', 'N/A')}")
            print(f"   Document Count: {vector_stats.get('document_count', 0)}")
        
        print("\n" + "="*70)
        
        # Verify with a test query
        print("\n🧪 Testing retrieval with a sample query...")
        test_results = await vector_adapter.query(
            query_text="What is JWT and how does it work?",
            top_k=3,
            collection_name="jwt_knowledge"
        )
        
        if test_results:
            print(f"✅ Successfully retrieved {len(test_results)} relevant documents")
            print("\nSample result:")
            first_result = test_results[0]
            print(f"  Source: {first_result.get('source', {}).get('name', 'Unknown')}")
            print(f"  URL: {first_result.get('source', {}).get('url', 'Unknown')}")
            print(f"  Similarity: {first_result.get('similarity_score', 0):.3f}")
            print(f"  Preview: {first_result.get('content_preview', '')[:150]}...")
        else:
            print("⚠️  No results retrieved - ingestion may have failed")
        
        print("\n✨ Ingestion complete! Your JWT knowledge base is ready to use.")
        print("\n💡 Next steps:")
        print("   1. Start the API server: uvicorn app.main:app --reload")
        print("   2. Test the /api/v1/ask endpoint with JWT questions")
        print("   3. Check /api/v1/knowledge/status for detailed statistics")
        print("")
        
        return 0 if success_rate >= 50 else 1
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Ingestion interrupted by user")
        return 1
    except Exception as e:
        print(f"\n❌ CRITICAL ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Ingest JWT documentation into the knowledge base",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Ingest default JWT sources
  python scripts/ingest_jwt_knowledge.py
  
  # Ingest with custom URLs
  python scripts/ingest_jwt_knowledge.py --custom-urls https://example.com/jwt-guide
  
  # Dry run (check configuration only)
  python scripts/ingest_jwt_knowledge.py --dry-run
        """
    )
    
    parser.add_argument(
        '--custom-urls',
        nargs='+',
        help='Additional URLs to scrape'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Check configuration without running ingestion'
    )
    
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    
    if args.dry_run:
        print("\n🔍 DRY RUN MODE - Configuration Check")
        print("="*70)
        print(f"RAG Enabled: {settings.ENABLE_RAG}")
        print(f"QA Learning: {settings.ENABLE_QA_LEARNING}")
        print(f"Vector DB Path: {settings.VECTOR_DB_PATH}")
        print(f"LLM Provider: {settings.LLM_PROVIDER}")
        
        if args.custom_urls:
            print(f"\nCustom URLs ({len(args.custom_urls)}):")
            for url in args.custom_urls:
                print(f"  - {url}")
        
        print("\n✅ Configuration looks good!")
        print("Remove --dry-run to start actual ingestion.")
        sys.exit(0)
    
    # Run ingestion
    exit_code = asyncio.run(main(custom_urls=args.custom_urls))
    sys.exit(exit_code)

