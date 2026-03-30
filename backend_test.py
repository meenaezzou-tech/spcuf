#!/usr/bin/env python3
"""
SPCUF Backend API Comprehensive Test Suite
Tests all backend endpoints for the SPCUF legal case management platform
"""

import requests
import json
import base64
from datetime import datetime, timedelta
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
test_document_id = None
test_contact_id = None
test_deadline_id = None

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

def test_database_seeding():
    """Test database seeding endpoint"""
    print("=" * 60)
    print("TESTING DATABASE SEEDING")
    print("=" * 60)
    
    response = make_request("POST", "/seed-data")
    if response and response.status_code == 200:
        data = response.json()
        log_test("Database Seeding", "PASS", f"Seeded {data.get('legal_topics', 0)} legal topics and {data.get('resources', 0)} resources")
        return True
    else:
        log_test("Database Seeding", "FAIL", "Failed to seed database")
        return False

def test_auth_register():
    """Test user registration"""
    print("=" * 60)
    print("TESTING AUTHENTICATION - REGISTER")
    print("=" * 60)
    
    # First try to register a new user (might fail if already exists)
    test_user_data = {
        "email": "newtestuser@spcuf.com",
        "password": "NewTestUser123!",
        "full_name": "New Test User",
        "phone": "555-0123"
    }
    
    response = make_request("POST", "/auth/register", test_user_data)
    if response:
        if response.status_code == 200:
            data = response.json()
            log_test("User Registration", "PASS", f"Registered user: {data['user']['email']}")
            return True
        elif response.status_code == 400 and "already registered" in response.text:
            log_test("User Registration", "PASS", "User already exists (expected)")
            return True
        else:
            log_test("User Registration", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            return False
    else:
        log_test("User Registration", "FAIL", "No response received")
        return False

def test_auth_login():
    """Test user login"""
    global auth_token, user_id
    
    print("=" * 60)
    print("TESTING AUTHENTICATION - LOGIN")
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
        log_test("User Login", "PASS", f"Logged in user: {data['user']['email']}")
        return True
    else:
        log_test("User Login", "FAIL", "Failed to login with test credentials")
        return False

def test_auth_me():
    """Test getting current user info"""
    print("=" * 60)
    print("TESTING AUTHENTICATION - GET ME")
    print("=" * 60)
    
    response = make_request("GET", "/auth/me")
    if response and response.status_code == 200:
        data = response.json()
        log_test("Get Current User", "PASS", f"Retrieved user: {data['email']}")
        return True
    else:
        log_test("Get Current User", "FAIL", "Failed to get current user info")
        return False

def test_case_creation():
    """Test case creation"""
    global test_case_id
    
    print("=" * 60)
    print("TESTING CASE MANAGEMENT - CREATE CASE")
    print("=" * 60)
    
    case_data = {
        "dfps_region": "Region 6",
        "dfps_unit": "Harris County Unit",
        "investigator_name": "Sarah Johnson",
        "supervisor_name": "Michael Davis",
        "date_opened": datetime.utcnow().isoformat(),
        "investigation_type": "Neglect",
        "current_stage": "Investigation",
        "parties": [
            {
                "name": "Emma Rodriguez",
                "relationship": "Child",
                "dob": "2015-03-15",
                "school": "Lincoln Elementary",
                "grade": "3rd Grade"
            }
        ],
        "allegations": [
            {
                "type": "Neglect - Lack of Supervision",
                "finding": "Reason to Believe",
                "details": "Child left unsupervised for extended periods"
            }
        ],
        "notes": "Initial investigation case for comprehensive testing"
    }
    
    response = make_request("POST", "/cases", case_data)
    if response and response.status_code == 200:
        data = response.json()
        test_case_id = data["id"]
        log_test("Case Creation", "PASS", f"Created case: {data['case_id_display']}")
        return True
    else:
        log_test("Case Creation", "FAIL", "Failed to create case")
        return False

def test_case_list():
    """Test getting list of cases"""
    print("=" * 60)
    print("TESTING CASE MANAGEMENT - GET CASES")
    print("=" * 60)
    
    response = make_request("GET", "/cases")
    if response and response.status_code == 200:
        data = response.json()
        log_test("Get Cases List", "PASS", f"Retrieved {len(data)} cases")
        return True
    else:
        log_test("Get Cases List", "FAIL", "Failed to get cases list")
        return False

def test_case_details():
    """Test getting specific case details"""
    print("=" * 60)
    print("TESTING CASE MANAGEMENT - GET CASE DETAILS")
    print("=" * 60)
    
    if not test_case_id:
        log_test("Get Case Details", "FAIL", "No test case ID available")
        return False
    
    response = make_request("GET", f"/cases/{test_case_id}")
    if response and response.status_code == 200:
        data = response.json()
        log_test("Get Case Details", "PASS", f"Retrieved case: {data['case_id_display']}")
        return True
    else:
        log_test("Get Case Details", "FAIL", "Failed to get case details")
        return False

def test_case_update():
    """Test updating case information"""
    print("=" * 60)
    print("TESTING CASE MANAGEMENT - UPDATE CASE")
    print("=" * 60)
    
    if not test_case_id:
        log_test("Update Case", "FAIL", "No test case ID available")
        return False
    
    update_data = {
        "current_stage": "Ongoing Services",
        "notes": "Case updated during comprehensive testing - moved to services stage"
    }
    
    response = make_request("PUT", f"/cases/{test_case_id}", update_data)
    if response and response.status_code == 200:
        data = response.json()
        log_test("Update Case", "PASS", f"Updated case stage to: {data['current_stage']}")
        return True
    else:
        log_test("Update Case", "FAIL", "Failed to update case")
        return False

def test_timeline_creation():
    """Test adding timeline events"""
    print("=" * 60)
    print("TESTING TIMELINE - CREATE EVENT")
    print("=" * 60)
    
    if not test_case_id:
        log_test("Create Timeline Event", "FAIL", "No test case ID available")
        return False
    
    timeline_data = {
        "event_type": "Investigation Started",
        "event_date": datetime.utcnow().isoformat(),
        "description": "CPS investigation initiated following report of neglect",
        "legal_significance": "Starts 45-day investigation timeline per Texas Family Code §261.301"
    }
    
    response = make_request("POST", f"/cases/{test_case_id}/timeline", timeline_data)
    if response and response.status_code == 200:
        data = response.json()
        log_test("Create Timeline Event", "PASS", f"Created event: {data['event_type']}")
        return True
    else:
        log_test("Create Timeline Event", "FAIL", "Failed to create timeline event")
        return False

def test_timeline_retrieval():
    """Test retrieving case timeline"""
    print("=" * 60)
    print("TESTING TIMELINE - GET TIMELINE")
    print("=" * 60)
    
    if not test_case_id:
        log_test("Get Timeline", "FAIL", "No test case ID available")
        return False
    
    response = make_request("GET", f"/cases/{test_case_id}/timeline")
    if response and response.status_code == 200:
        data = response.json()
        log_test("Get Timeline", "PASS", f"Retrieved {len(data)} timeline events")
        return True
    else:
        log_test("Get Timeline", "FAIL", "Failed to get timeline")
        return False

def test_document_upload():
    """Test document upload"""
    global test_document_id
    
    print("=" * 60)
    print("TESTING DOCUMENT MANAGEMENT - UPLOAD")
    print("=" * 60)
    
    if not test_case_id:
        log_test("Document Upload", "FAIL", "No test case ID available")
        return False
    
    # Create a simple test document (base64 encoded)
    test_content = "This is a test document for SPCUF case management system testing."
    encoded_content = base64.b64encode(test_content.encode()).decode()
    
    doc_data = {
        "case_id": test_case_id,
        "document_type": "Court Order",
        "file_name": "test_court_order.txt",
        "file_data": encoded_content,
        "category": "Legal Documents",
        "tags": ["court", "order", "test"]
    }
    
    response = make_request("POST", "/documents", doc_data)
    if response and response.status_code == 200:
        data = response.json()
        test_document_id = data["id"]
        log_test("Document Upload", "PASS", f"Uploaded document: {data['file_name']}")
        return True
    else:
        log_test("Document Upload", "FAIL", "Failed to upload document")
        return False

def test_document_retrieval():
    """Test retrieving documents for a case"""
    print("=" * 60)
    print("TESTING DOCUMENT MANAGEMENT - GET DOCUMENTS")
    print("=" * 60)
    
    if not test_case_id:
        log_test("Get Documents", "FAIL", "No test case ID available")
        return False
    
    response = make_request("GET", f"/documents/{test_case_id}")
    if response and response.status_code == 200:
        data = response.json()
        log_test("Get Documents", "PASS", f"Retrieved {len(data)} documents")
        return True
    else:
        log_test("Get Documents", "FAIL", "Failed to get documents")
        return False

def test_contact_creation():
    """Test creating contacts"""
    global test_contact_id
    
    print("=" * 60)
    print("TESTING CONTACT MANAGEMENT - CREATE CONTACT")
    print("=" * 60)
    
    if not test_case_id:
        log_test("Create Contact", "FAIL", "No test case ID available")
        return False
    
    contact_data = {
        "case_id": test_case_id,
        "contact_type": "caseworker",
        "name": "Jennifer Martinez",
        "title": "CPS Caseworker",
        "phone": "713-555-0199",
        "email": "j.martinez@dfps.texas.gov",
        "organization": "DFPS Harris County",
        "supervisor_name": "Robert Thompson",
        "notes": "Primary caseworker assigned to this investigation"
    }
    
    response = make_request("POST", "/contacts", contact_data)
    if response and response.status_code == 200:
        data = response.json()
        test_contact_id = data["id"]
        log_test("Create Contact", "PASS", f"Created contact: {data['name']} ({data['contact_type']})")
        return True
    else:
        log_test("Create Contact", "FAIL", "Failed to create contact")
        return False

def test_contact_retrieval():
    """Test retrieving contacts"""
    print("=" * 60)
    print("TESTING CONTACT MANAGEMENT - GET CONTACTS")
    print("=" * 60)
    
    if not test_case_id:
        log_test("Get Contacts", "FAIL", "No test case ID available")
        return False
    
    response = make_request("GET", f"/contacts/{test_case_id}")
    if response and response.status_code == 200:
        data = response.json()
        log_test("Get Contacts", "PASS", f"Retrieved {len(data)} contacts")
        return True
    else:
        log_test("Get Contacts", "FAIL", "Failed to get contacts")
        return False

def test_deadline_calculation():
    """Test statutory deadline calculation"""
    print("=" * 60)
    print("TESTING DEADLINE CALCULATION")
    print("=" * 60)
    
    if not test_case_id:
        log_test("Calculate Deadlines", "FAIL", "No test case ID available")
        return False
    
    # Use a removal date from 30 days ago for realistic testing
    removal_date = (datetime.utcnow() - timedelta(days=30)).isoformat()
    
    response = make_request("POST", f"/deadlines/calculate?removal_date={removal_date}&case_id={test_case_id}")
    if response and response.status_code == 200:
        data = response.json()
        deadlines = data.get("deadlines", [])
        log_test("Calculate Deadlines", "PASS", f"Calculated {len(deadlines)} statutory deadlines")
        
        # Print some deadline details for verification
        for deadline in deadlines[:3]:  # Show first 3 deadlines
            print(f"   - {deadline['deadline_type']}: {deadline['deadline_date'][:10]}")
        
        return True
    else:
        log_test("Calculate Deadlines", "FAIL", "Failed to calculate deadlines")
        return False

def test_deadline_retrieval():
    """Test retrieving deadlines for a case"""
    print("=" * 60)
    print("TESTING DEADLINE RETRIEVAL")
    print("=" * 60)
    
    if not test_case_id:
        log_test("Get Deadlines", "FAIL", "No test case ID available")
        return False
    
    response = make_request("GET", f"/deadlines/{test_case_id}")
    if response and response.status_code == 200:
        data = response.json()
        log_test("Get Deadlines", "PASS", f"Retrieved {len(data)} deadlines")
        return True
    else:
        log_test("Get Deadlines", "FAIL", "Failed to get deadlines")
        return False

def test_ai_chat():
    """Test AI chat integration"""
    print("=" * 60)
    print("TESTING AI CHAT INTEGRATION")
    print("=" * 60)
    
    chat_data = {
        "case_id": test_case_id,
        "message": "What are my rights during a CPS investigation in Texas?",
        "conversation_mode": "ask_spcuf"
    }
    
    response = make_request("POST", "/ai/chat", chat_data)
    if response and response.status_code == 200:
        data = response.json()
        ai_response = data.get("response", "")
        if len(ai_response) > 50:  # Check if we got a substantial response
            log_test("AI Chat Integration", "PASS", f"AI responded with {len(ai_response)} characters")
            print(f"   AI Response Preview: {ai_response[:100]}...")
            return True
        else:
            log_test("AI Chat Integration", "FAIL", "AI response too short or empty")
            return False
    else:
        log_test("AI Chat Integration", "FAIL", "Failed to get AI response")
        return False

def test_resources():
    """Test getting resources"""
    print("=" * 60)
    print("TESTING RESOURCES API")
    print("=" * 60)
    
    response = make_request("GET", "/resources")
    if response and response.status_code == 200:
        data = response.json()
        log_test("Get Resources", "PASS", f"Retrieved {len(data)} resources")
        return True
    else:
        log_test("Get Resources", "FAIL", "Failed to get resources")
        return False

def test_legal_library():
    """Test legal library endpoints"""
    print("=" * 60)
    print("TESTING LEGAL LIBRARY API")
    print("=" * 60)
    
    # Test getting all legal topics
    response = make_request("GET", "/legal-library")
    if response and response.status_code == 200:
        data = response.json()
        log_test("Get Legal Library", "PASS", f"Retrieved {len(data)} legal topics")
        
        # Test getting specific topic if available
        if data:
            topic_id = data[0]["id"]
            response = make_request("GET", f"/legal-library/{topic_id}")
            if response and response.status_code == 200:
                topic_data = response.json()
                log_test("Get Specific Legal Topic", "PASS", f"Retrieved topic: {topic_data['title']}")
                return True
            else:
                log_test("Get Specific Legal Topic", "FAIL", "Failed to get specific topic")
                return False
        return True
    else:
        log_test("Get Legal Library", "FAIL", "Failed to get legal library")
        return False

def test_error_cases():
    """Test error handling"""
    global auth_token
    
    print("=" * 60)
    print("TESTING ERROR CASES")
    print("=" * 60)
    
    # Test unauthorized access (without token)
    temp_token = auth_token
    auth_token = None
    
    response = make_request("GET", "/cases", expect_status=401)
    if response and response.status_code == 401:
        log_test("Unauthorized Access", "PASS", "Correctly rejected unauthorized request")
    else:
        log_test("Unauthorized Access", "FAIL", "Should have rejected unauthorized request")
    
    # Restore token
    auth_token = temp_token
    
    # Test invalid case ID
    response = make_request("GET", "/cases/invalid_id", expect_status=404)
    if response and response.status_code in [400, 404]:
        log_test("Invalid Case ID", "PASS", "Correctly handled invalid case ID")
        return True
    else:
        log_test("Invalid Case ID", "FAIL", "Should have handled invalid case ID")
        return False

def run_all_tests():
    """Run all backend tests"""
    print("🚀 STARTING SPCUF BACKEND API COMPREHENSIVE TEST SUITE")
    print("=" * 80)
    
    test_results = []
    
    # Database seeding (should be done first)
    test_results.append(test_database_seeding())
    
    # Authentication tests
    test_results.append(test_auth_register())
    test_results.append(test_auth_login())
    test_results.append(test_auth_me())
    
    # Case management tests
    test_results.append(test_case_creation())
    test_results.append(test_case_list())
    test_results.append(test_case_details())
    test_results.append(test_case_update())
    
    # Timeline tests
    test_results.append(test_timeline_creation())
    test_results.append(test_timeline_retrieval())
    
    # Document management tests
    test_results.append(test_document_upload())
    test_results.append(test_document_retrieval())
    
    # Contact management tests
    test_results.append(test_contact_creation())
    test_results.append(test_contact_retrieval())
    
    # Deadline calculation tests
    test_results.append(test_deadline_calculation())
    test_results.append(test_deadline_retrieval())
    
    # AI integration test
    test_results.append(test_ai_chat())
    
    # Resource and legal library tests
    test_results.append(test_resources())
    test_results.append(test_legal_library())
    
    # Error handling tests
    test_results.append(test_error_cases())
    
    # Summary
    print("=" * 80)
    print("🏁 TEST SUITE COMPLETE")
    print("=" * 80)
    
    passed = sum(test_results)
    total = len(test_results)
    failed = total - passed
    
    print(f"✅ PASSED: {passed}")
    print(f"❌ FAILED: {failed}")
    print(f"📊 SUCCESS RATE: {(passed/total)*100:.1f}%")
    
    if failed > 0:
        print("\n⚠️  CRITICAL ISSUES FOUND - Review failed tests above")
        return False
    else:
        print("\n🎉 ALL TESTS PASSED - Backend API is working correctly!")
        return True

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)