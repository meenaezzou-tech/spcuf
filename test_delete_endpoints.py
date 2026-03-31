#!/usr/bin/env python3
"""
Focused test for DELETE endpoints
"""

import requests
import json
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://reunify-now.preview.emergentagent.com/api"
TEST_EMAIL = "testparent@spcuf.com"
TEST_PASSWORD = "TestParent123!"

def get_auth_token():
    """Get authentication token"""
    login_data = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"Failed to login: {response.status_code} - {response.text}")
        return None

def test_delete_endpoints():
    """Test DELETE endpoints specifically"""
    print("🧪 TESTING DELETE ENDPOINTS")
    print("=" * 50)
    
    # Get auth token
    token = get_auth_token()
    if not token:
        print("❌ Failed to get auth token")
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Step 1: Create a case
    print("\n1. Creating a test case...")
    case_data = {
        "dfps_region": "Region 6",
        "dfps_unit": "Harris County Unit",
        "investigator_name": "Sarah Johnson",
        "supervisor_name": "Michael Davis",
        "date_opened": datetime.utcnow().isoformat(),
        "investigation_type": "Neglect",
        "current_stage": "Investigation",
        "parties": [{"name": "Test Child", "relationship": "Child"}],
        "allegations": [{"type": "Neglect", "finding": "Reason to Believe"}],
        "notes": "Test case for DELETE endpoint testing"
    }
    
    response = requests.post(f"{BASE_URL}/cases", json=case_data, headers=headers)
    if response.status_code != 200:
        print(f"❌ Failed to create case: {response.status_code} - {response.text}")
        return False
    
    case_id = response.json()["id"]
    print(f"✅ Created case: {case_id}")
    
    # Step 2: Create a contact
    print("\n2. Creating a test contact...")
    contact_data = {
        "case_id": case_id,
        "contact_type": "caseworker",
        "name": "Test Caseworker",
        "title": "CPS Caseworker",
        "phone": "713-555-0199",
        "email": "test@dfps.texas.gov",
        "organization": "DFPS Test Unit"
    }
    
    response = requests.post(f"{BASE_URL}/contacts", json=contact_data, headers=headers)
    if response.status_code != 200:
        print(f"❌ Failed to create contact: {response.status_code} - {response.text}")
        return False
    
    contact_id = response.json()["id"]
    print(f"✅ Created contact: {contact_id}")
    
    # Step 3: Calculate deadlines
    print("\n3. Calculating deadlines...")
    removal_date = (datetime.utcnow() - timedelta(days=30)).isoformat()
    response = requests.post(f"{BASE_URL}/deadlines/calculate?removal_date={removal_date}&case_id={case_id}", headers=headers)
    if response.status_code != 200:
        print(f"❌ Failed to calculate deadlines: {response.status_code} - {response.text}")
        return False
    
    print("✅ Calculated deadlines")
    
    # Get deadlines to get an ID
    response = requests.get(f"{BASE_URL}/deadlines/{case_id}", headers=headers)
    if response.status_code != 200 or not response.json():
        print(f"❌ Failed to get deadlines: {response.status_code}")
        return False
    
    deadline_id = response.json()[0]["id"]
    print(f"✅ Got deadline ID: {deadline_id}")
    
    # Step 4: Test DELETE contact
    print("\n4. Testing DELETE contact...")
    response = requests.delete(f"{BASE_URL}/contacts/{contact_id}", headers=headers)
    print(f"DELETE /contacts/{contact_id} -> Status: {response.status_code}")
    
    if response.status_code == 200:
        print("✅ Contact deleted successfully")
        
        # Verify it's gone
        response = requests.get(f"{BASE_URL}/contacts/{case_id}", headers=headers)
        contacts = response.json()
        if not any(c.get("id") == contact_id for c in contacts):
            print("✅ Contact verified as deleted")
        else:
            print("❌ Contact still exists after deletion")
            return False
    else:
        print(f"❌ Failed to delete contact: {response.text}")
        return False
    
    # Step 5: Test DELETE deadline
    print("\n5. Testing DELETE deadline...")
    response = requests.delete(f"{BASE_URL}/deadlines/{deadline_id}", headers=headers)
    print(f"DELETE /deadlines/{deadline_id} -> Status: {response.status_code}")
    
    if response.status_code == 200:
        print("✅ Deadline deleted successfully")
        
        # Verify it's gone
        response = requests.get(f"{BASE_URL}/deadlines/{case_id}", headers=headers)
        deadlines = response.json()
        if not any(d.get("id") == deadline_id for d in deadlines):
            print("✅ Deadline verified as deleted")
        else:
            print("❌ Deadline still exists after deletion")
            return False
    else:
        print(f"❌ Failed to delete deadline: {response.text}")
        return False
    
    # Step 6: Test DELETE non-existent contact
    print("\n6. Testing DELETE non-existent contact...")
    fake_id = "507f1f77bcf86cd799439011"
    response = requests.delete(f"{BASE_URL}/contacts/{fake_id}", headers=headers)
    print(f"DELETE /contacts/{fake_id} -> Status: {response.status_code}")
    
    if response.status_code == 404:
        print("✅ Correctly returned 404 for non-existent contact")
    else:
        print(f"❌ Expected 404, got {response.status_code}")
        return False
    
    # Step 7: Test DELETE non-existent deadline
    print("\n7. Testing DELETE non-existent deadline...")
    response = requests.delete(f"{BASE_URL}/deadlines/{fake_id}", headers=headers)
    print(f"DELETE /deadlines/{fake_id} -> Status: {response.status_code}")
    
    if response.status_code == 404:
        print("✅ Correctly returned 404 for non-existent deadline")
    else:
        print(f"❌ Expected 404, got {response.status_code}")
        return False
    
    print("\n🎉 ALL DELETE ENDPOINT TESTS PASSED!")
    return True

if __name__ == "__main__":
    success = test_delete_endpoints()
    exit(0 if success else 1)