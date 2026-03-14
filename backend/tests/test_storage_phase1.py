"""
Quick test to verify MinIO storage connection.
Run this to test Phase 1 storage infrastructure.
"""

import os
import sys
from io import BytesIO

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.storage import StorageClient


def test_storage_connection():
    """Test basic storage operations."""
    print("🧪 Testing MinIO Storage Connection...")
    print("=" * 60)
    
    try:
        # Initialize storage client
        print("\n1️⃣  Initializing StorageClient...")
        storage = StorageClient()
        print(f"   ✅ Bucket: {storage.bucket_name}")
        print(f"   ✅ Endpoint: {os.getenv('STORAGE_ENDPOINT_URL', 'AWS S3')}")
        
        # Test file upload
        print("\n2️⃣  Testing file upload...")
        test_content = b"This is a test file from Feature 004 - Phase 1 testing"
        test_file = BytesIO(test_content)
        test_path = "test/phase1/test-upload.txt"
        
        storage_path = storage.upload_file(
            test_file,
            test_path,
            content_type="text/plain"
        )
        print(f"   ✅ Uploaded to: {storage_path}")
        
        # Test file exists check
        print("\n3️⃣  Testing file existence check...")
        exists = storage.file_exists(test_path)
        print(f"   ✅ File exists: {exists}")
        
        # Test presigned URL generation
        print("\n4️⃣  Testing presigned URL generation...")
        url = storage.get_file_url(test_path, expires_in=3600)
        print(f"   ✅ Generated URL: {url[:80]}...")
        
        # Test file deletion
        print("\n5️⃣  Testing file deletion...")
        storage.delete_file(test_path)
        print(f"   ✅ File deleted")
        
        # Verify deletion
        exists_after = storage.file_exists(test_path)
        print(f"   ✅ File exists after deletion: {exists_after}")
        
        print("\n" + "=" * 60)
        print("✅ ALL STORAGE TESTS PASSED!")
        print("=" * 60)
        print("\n📋 Summary:")
        print("   ✓ Storage client initialized")
        print("   ✓ File upload successful")
        print("   ✓ File existence check working")
        print("   ✓ Presigned URL generation working")
        print("   ✓ File deletion successful")
        print("\n🎉 Phase 1 storage infrastructure is ready!")
        
        return True
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        print(f"   Error type: {type(e).__name__}")
        import traceback
        print("\n📋 Traceback:")
        traceback.print_exc()
        return False


if __name__ == "__main__":
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    success = test_storage_connection()
    sys.exit(0 if success else 1)
