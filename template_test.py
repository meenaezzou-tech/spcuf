#!/usr/bin/env python3
"""
SPCUF Template Document Upload Test
Tests the specific document upload and template save flow for all 9 templates
"""

import requests
import json
import base64
from datetime import datetime
import sys
import time

# Configuration
BASE_URL = "https://reunify-now.preview.emergentagent.com/api"
TEST_EMAIL = "testparent@spcuf.com"
TEST_PASSWORD = "TestParent123!"

# Global variables for test data
auth_token = None
user_id = None
test_case_id = None
uploaded_documents = []

# 9 Template names to test
TEMPLATES = [
    "Request for Supervisor Conference",
    "Written Objection to Service Plan", 
    "Request for Relative Placement",
    "Notice of Attorney Representation",
    "Open Records Request (TPIA)",
    "Affidavit of Compliance",
    "Request for Caseworker Reassignment",
    "Visitation Dispute Letter",
    "Complaint to DFPS Ombudsman"
]

def log_test(test_name, status, details=""):
    """Log test results"""
    status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"{status_symbol} {test_name}: {status}")
    if details:
        print(f"   Details: {details}")
    print()

def make_request(method, endpoint, data=None, headers=None, expect_status=200):
    """Make HTTP request with error handling"""
    url = f"{BASE_URL}{endpoint}"
    
    default_headers = {"Content-Type": "application/json"}
    if auth_token:
        default_headers["Authorization"] = f"Bearer {auth_token}"
    
    if headers:
        default_headers.update(headers)
    
    try:
        if method == "GET":
            response = requests.get(url, headers=default_headers, timeout=30)
        elif method == "POST":
            response = requests.post(url, json=data, headers=default_headers, timeout=30)
        elif method == "PUT":
            response = requests.put(url, json=data, headers=default_headers, timeout=30)
        elif method == "DELETE":
            response = requests.delete(url, headers=default_headers, timeout=30)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        print(f"Request: {method} {url}")
        print(f"Status: {response.status_code}")
        if response.status_code != expect_status:
            print(f"Response: {response.text}")
        
        return response
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None

def test_login():
    """Test user login"""
    global auth_token, user_id
    
    print("=" * 60)
    print("STEP 1: TESTING LOGIN")
    print("=" * 60)
    
    login_data = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    
    response = make_request("POST", "/auth/login", login_data)
    if response and response.status_code == 200:
        data = response.json()
        auth_token = data["access_token"]
        user_id = data["user"]["id"]
        log_test("Login", "PASS", f"Logged in user: {data['user']['email']}")
        return True
    else:
        log_test("Login", "FAIL", "Failed to login with test credentials")
        return False

def test_get_cases():
    """Test getting cases and use first case ID"""
    global test_case_id
    
    print("=" * 60)
    print("STEP 2: GETTING CASES")
    print("=" * 60)
    
    response = make_request("GET", "/cases")
    if response and response.status_code == 200:
        data = response.json()
        if data and len(data) > 0:
            test_case_id = data[0]["id"]
            log_test("Get Cases", "PASS", f"Retrieved {len(data)} cases, using case ID: {test_case_id}")
            return True
        else:
            log_test("Get Cases", "FAIL", "No cases found - need at least one case to test document upload")
            return False
    else:
        log_test("Get Cases", "FAIL", "Failed to get cases list")
        return False

def test_template_document_uploads():
    """Test document upload for all 9 templates"""
    global uploaded_documents
    
    print("=" * 60)
    print("STEP 3: TESTING DOCUMENT UPLOAD FOR ALL 9 TEMPLATES")
    print("=" * 60)
    
    if not test_case_id:
        log_test("Template Document Uploads", "FAIL", "No test case ID available")
        return False
    
    success_count = 0
    
    for i, template_name in enumerate(TEMPLATES, 1):
        print(f"\n--- Testing Template {i}/9: {template_name} ---")
        
        # Create test content for this template
        test_content = f"Test document content for {template_name}. This is a generated legal form template for SPCUF case management system testing."
        encoded_content = base64.b64encode(test_content.encode()).decode()
        
        # Create timestamp for unique filename
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        file_name = f"{template_name.replace(' ', '_').lower()}_{timestamp}.txt"
        
        doc_data = {
            "case_id": test_case_id,
            "document_type": template_name,
            "file_name": file_name,
            "file_data": encoded_content,
            "category": "Legal Forms",
            "tags": ["template", "generated"]
        }
        
        response = make_request("POST", "/documents", doc_data)
        if response and response.status_code == 200:
            data = response.json()
            uploaded_documents.append({
                "id": data["id"],
                "template_name": template_name,
                "file_name": data["file_name"]
            })
            log_test(f"Upload {template_name}", "PASS", f"Uploaded: {data['file_name']}")
            success_count += 1
        else:
            log_test(f"Upload {template_name}", "FAIL", f"Failed to upload template document")
    
    overall_success = success_count == len(TEMPLATES)
    log_test("All Template Uploads", "PASS" if overall_success else "FAIL", 
             f"Successfully uploaded {success_count}/{len(TEMPLATES)} templates")
    
    return overall_success

def test_verify_documents_saved():
    """Test that all 9 documents are saved and retrievable"""
    print("=" * 60)
    print("STEP 4: VERIFYING ALL DOCUMENTS ARE SAVED")
    print("=" * 60)
    
    if not test_case_id:
        log_test("Verify Documents Saved", "FAIL", "No test case ID available")
        return False
    
    response = make_request("GET", f"/documents/{test_case_id}")
    if response and response.status_code == 200:
        data = response.json()
        
        # Filter documents to only include our uploaded templates
        template_documents = [doc for doc in data if doc["category"] == "Legal Forms" and "template" in doc.get("tags", [])]
        
        log_test("Get Documents List", "PASS", f"Retrieved {len(data)} total documents, {len(template_documents)} template documents")
        
        # Verify we have all 9 templates
        if len(template_documents) >= len(TEMPLATES):
            # Check if all template names are present
            found_templates = [doc["document_type"] for doc in template_documents]
            missing_templates = [template for template in TEMPLATES if template not in found_templates]
            
            if not missing_templates:
                log_test("All Templates Saved", "PASS", "All 9 template documents found in database")
                
                # Print details of saved templates
                print("   Saved Templates:")
                for doc in template_documents:
                    if doc["document_type"] in TEMPLATES:
                        print(f"   - {doc['document_type']}: {doc['file_name']}")
                
                return True
            else:
                log_test("All Templates Saved", "FAIL", f"Missing templates: {missing_templates}")
                return False
        else:
            log_test("All Templates Saved", "FAIL", f"Expected {len(TEMPLATES)} templates, found {len(template_documents)}")
            return False
    else:
        log_test("Verify Documents Saved", "FAIL", "Failed to get documents list")
        return False

def test_document_retrieval():
    """Test document retrieval for at least one document"""
    print("=" * 60)
    print("STEP 5: TESTING DOCUMENT RETRIEVAL")
    print("=" * 60)
    
    if not test_case_id or not uploaded_documents:
        log_test("Document Retrieval", "FAIL", "No test case ID or uploaded documents available")
        return False
    
    # Test retrieving the first uploaded document
    test_doc = uploaded_documents[0]
    document_id = test_doc["id"]
    template_name = test_doc["template_name"]
    
    response = make_request("GET", f"/documents/{test_case_id}/{document_id}")
    if response and response.status_code == 200:
        data = response.json()
        
        # Verify the document data
        if (data.get("id") == document_id and 
            data.get("document_type") == template_name and
            data.get("file_data")):
            
            # Decode and verify content
            try:
                decoded_content = base64.b64decode(data["file_data"]).decode()
                if template_name in decoded_content:
                    log_test("Document Retrieval", "PASS", f"Successfully retrieved and verified: {template_name}")
                    print(f"   Content preview: {decoded_content[:100]}...")
                    return True
                else:
                    log_test("Document Retrieval", "FAIL", "Document content doesn't match expected template")
                    return False
            except Exception as e:
                log_test("Document Retrieval", "FAIL", f"Failed to decode document content: {e}")
                return False
        else:
            log_test("Document Retrieval", "FAIL", "Document data incomplete or incorrect")
            return False
    else:
        log_test("Document Retrieval", "FAIL", "Failed to retrieve document")
        return False

def run_template_tests():
    """Run all template document tests"""
    print("🚀 STARTING SPCUF TEMPLATE DOCUMENT UPLOAD TEST SUITE")
    print("=" * 80)
    print("Testing document upload and template save flow for all 9 templates")
    print("=" * 80)
    
    test_results = []
    
    # Step 1: Login
    test_results.append(test_login())
    
    # Step 2: Get cases
    test_results.append(test_get_cases())
    
    # Step 3: Upload all 9 template documents
    test_results.append(test_template_document_uploads())
    
    # Step 4: Verify documents are saved
    test_results.append(test_verify_documents_saved())
    
    # Step 5: Test document retrieval
    test_results.append(test_document_retrieval())
    
    # Summary
    print("=" * 80)
    print("🏁 TEMPLATE TEST SUITE COMPLETE")
    print("=" * 80)
    
    passed = sum(test_results)
    total = len(test_results)
    failed = total - passed
    
    print(f"✅ PASSED: {passed}")
    print(f"❌ FAILED: {failed}")
    print(f"📊 SUCCESS RATE: {(passed/total)*100:.1f}%")
    
    if failed > 0:
        print("\n⚠️  CRITICAL ISSUES FOUND - Review failed tests above")
        print("\nFailed test steps:")
        step_names = ["Login", "Get Cases", "Template Document Uploads", "Verify Documents Saved", "Document Retrieval"]
        for i, result in enumerate(test_results):
            if not result:
                print(f"   - {step_names[i]}")
        return False
    else:
        print("\n🎉 ALL TEMPLATE TESTS PASSED - Document upload and template save flow working correctly!")
        print(f"\n📋 SUMMARY:")
        print(f"   - Successfully logged in with test credentials")
        print(f"   - Retrieved cases and used case ID: {test_case_id}")
        print(f"   - Uploaded {len(TEMPLATES)} template documents")
        print(f"   - Verified all documents are saved in database")
        print(f"   - Successfully retrieved and verified document content")
        return True

if __name__ == "__main__":
    success = run_template_tests()
    sys.exit(0 if success else 1)