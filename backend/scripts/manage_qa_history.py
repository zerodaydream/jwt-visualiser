#!/usr/bin/env python3
"""
Q&A History Management Script
Delete and view Q&A pairs in the learning system.

Usage:
    python scripts/manage_qa_history.py --status    # View statistics
    python scripts/manage_qa_history.py --clear     # Delete all Q&A pairs
"""

import sys
import os
import asyncio
import argparse

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.vector.chroma_adapter import ChromaAdapter
from app.vector.qa_store import QAStore
from app.core.config import settings


async def view_statistics():
    """View Q&A statistics."""
    print("\n" + "="*70)
    print("Q&A LEARNING STATISTICS")
    print("="*70 + "\n")
    
    if not settings.ENABLE_RAG or not settings.ENABLE_QA_LEARNING:
        print("❌ Q&A Learning is disabled!")
        print(f"   ENABLE_RAG: {settings.ENABLE_RAG}")
        print(f"   ENABLE_QA_LEARNING: {settings.ENABLE_QA_LEARNING}")
        print("\nEnable both in your .env file to use this feature.\n")
        return
    
    # Initialize services
    vector_adapter = ChromaAdapter()
    qa_store = QAStore(vector_adapter=vector_adapter)
    
    # Get statistics
    stats = await qa_store.get_qa_statistics()
    
    print(f"📊 Q&A Collection Status:")
    print(f"   Enabled: {stats.get('enabled', False)}")
    print(f"   Collection: {stats.get('collection', 'N/A')}")
    print(f"   Total Q&A Pairs: {stats.get('total_pairs', 0)}")
    
    if stats.get('error'):
        print(f"   ⚠️  Error: {stats.get('error')}")
    
    # Get insights
    insights = await qa_store.get_learning_insights()
    print(f"\n💡 Learning Status:")
    print(f"   Can Reference Past Answers: {insights.get('insights', {}).get('can_reference_past_answers', False)}")
    print(f"   Recommendation: {insights.get('insights', {}).get('recommendation', 'N/A')}")
    
    print("\n" + "="*70 + "\n")


async def clear_qa_history():
    """Clear all Q&A pairs."""
    print("\n" + "="*70)
    print("CLEAR Q&A HISTORY")
    print("="*70 + "\n")
    
    if not settings.ENABLE_RAG:
        print("❌ RAG is disabled! Cannot clear Q&A history.")
        return
    
    # Confirm deletion
    print("⚠️  WARNING: This will delete ALL Q&A pairs from the learning system!")
    response = input("\nType 'yes' to confirm deletion: ")
    
    if response.lower() != 'yes':
        print("\n❌ Deletion cancelled.\n")
        return
    
    print("\n🗑️  Deleting Q&A history...")
    
    try:
        # Initialize ChromaDB
        vector_adapter = ChromaAdapter()
        
        # Delete the collection
        if vector_adapter.client:
            try:
                vector_adapter.client.delete_collection(name="jwt_qa_history")
                print("✅ Successfully deleted jwt_qa_history collection")
                
                # Recreate empty collection
                vector_adapter.client.get_or_create_collection(
                    name="jwt_qa_history",
                    metadata={"description": "User Q&A pairs for learning"}
                )
                print("✅ Created fresh jwt_qa_history collection")
                
            except Exception as e:
                print(f"⚠️  Error: {e}")
                print("   (Collection might not exist yet)")
        else:
            print("❌ Vector adapter not initialized")
        
        print("\n✨ Q&A history cleared successfully!\n")
        
    except Exception as e:
        print(f"\n❌ Error clearing Q&A history: {str(e)}\n")


async def list_recent_qa(limit: int = 10):
    """List recent Q&A pairs (requires additional implementation)."""
    print("\n" + "="*70)
    print(f"RECENT Q&A PAIRS (Last {limit})")
    print("="*70 + "\n")
    
    if not settings.ENABLE_RAG or not settings.ENABLE_QA_LEARNING:
        print("❌ Q&A Learning is disabled!\n")
        return
    
    vector_adapter = ChromaAdapter()
    
    try:
        # Get collection
        collection = vector_adapter.get_collection("jwt_qa_history")
        
        if collection:
            count = collection.count()
            print(f"Total Q&A Pairs: {count}")
            
            if count > 0:
                # Get all items (ChromaDB doesn't have built-in ordering by time)
                results = collection.get(
                    limit=min(limit, count),
                    include=["documents", "metadatas"]
                )
                
                print("\nRecent Q&A Pairs:")
                print("-" * 70)
                
                for i, (doc, metadata) in enumerate(zip(results['documents'], results['metadatas']), 1):
                    print(f"\n{i}. Question: {metadata.get('question', 'N/A')[:100]}...")
                    print(f"   Timestamp: {metadata.get('timestamp', 'N/A')}")
                    print(f"   Sources Used: {metadata.get('sources_count', 0)}")
            else:
                print("\nNo Q&A pairs stored yet.")
        else:
            print("❌ Q&A collection not found")
            
    except Exception as e:
        print(f"❌ Error listing Q&A pairs: {e}")
    
    print("\n" + "="*70 + "\n")


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Manage Q&A learning history",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # View statistics
  python scripts/manage_qa_history.py --status
  
  # Clear all Q&A pairs
  python scripts/manage_qa_history.py --clear
  
  # List recent Q&A pairs
  python scripts/manage_qa_history.py --list
  python scripts/manage_qa_history.py --list --limit 20
        """
    )
    
    parser.add_argument(
        '--status',
        action='store_true',
        help='View Q&A statistics'
    )
    
    parser.add_argument(
        '--clear',
        action='store_true',
        help='Delete all Q&A pairs'
    )
    
    parser.add_argument(
        '--list',
        action='store_true',
        help='List recent Q&A pairs'
    )
    
    parser.add_argument(
        '--limit',
        type=int,
        default=10,
        help='Number of Q&A pairs to list (default: 10)'
    )
    
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    
    # Default to status if no action specified
    if not any([args.status, args.clear, args.list]):
        args.status = True
    
    # Run appropriate action
    if args.status:
        asyncio.run(view_statistics())
    
    if args.clear:
        asyncio.run(clear_qa_history())
    
    if args.list:
        asyncio.run(list_recent_qa(limit=args.limit))

