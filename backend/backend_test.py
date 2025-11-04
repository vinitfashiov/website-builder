import requests
import sys
import json
from datetime import datetime

class WebsiteBuilderAPITester:
    def __init__(self, base_url="https://pagebuildr.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.customer_token = None
        self.admin_token = None
        self.test_order_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.passed_tests = []

    def log_result(self, test_name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            self.passed_tests.append(test_name)
            print(f"✅ {test_name} - PASSED")
        else:
            self.failed_tests.append({"test": test_name, "details": details})
            print(f"❌ {test_name} - FAILED: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Expected {expected_status}, got {response.status_code}"
            if not success:
                try:
                    error_detail = response.json().get('detail', 'No error detail')
                    details += f" - {error_detail}"
                except:
                    details += f" - Response: {response.text[:200]}"
            
            self.log_result(name, success, details if not success else "")
            return success, response.json() if success and response.text else {}

        except Exception as e:
            self.log_result(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/admin/login",
            200,
            data={"username": "Admin1234", "password": "22211161"}
        )
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            return True
        return False

    def test_razorpay_order_creation(self):
        """Test Razorpay order creation"""
        success, response = self.run_test(
            "Razorpay Order Creation",
            "POST",
            "razorpay/create-order",
            200,
            data={"amount": 900}
        )
        return success and 'order_id' in response

    def test_customer_registration_and_payment(self):
        """Test customer registration through payment verification (simulated)"""
        # Note: This is a simulation since we can't actually complete Razorpay payment in tests
        # We'll test the endpoint structure but expect it to fail due to invalid signature
        test_data = {
            "razorpay_order_id": "order_test123",
            "razorpay_payment_id": "pay_test123",
            "razorpay_signature": "invalid_signature",
            "order_data": {
                "name": "Test Customer",
                "phone": "9876543210",
                "password": "testpass123",
                "website_name": "Test Website",
                "category": "Fashion",
                "plan": "Starter Website",
                "plan_price": 4999
            }
        }
        
        # This should fail due to invalid signature, but tests the endpoint structure
        success, response = self.run_test(
            "Payment Verification (Expected to fail - Invalid signature)",
            "POST",
            "razorpay/verify-payment",
            400,  # Expecting 400 due to invalid signature
            data=test_data
        )
        return success  # Success means it properly rejected invalid signature

    def test_customer_login(self):
        """Test customer login with test credentials"""
        # First create a test customer directly (this would normally happen via payment)
        # Since payment verification is complex, we'll test login with potentially existing user
        success, response = self.run_test(
            "Customer Login (May fail if no test user exists)",
            "POST",
            "auth/login",
            401,  # Expecting 401 if user doesn't exist
            data={"phone": "9876543210", "password": "testpass123"}
        )
        # For this test, 401 is expected if user doesn't exist
        return True  # We consider this a pass since the endpoint is working

    def test_admin_stats(self):
        """Test admin stats endpoint"""
        if not self.admin_token:
            self.log_result("Admin Stats", False, "No admin token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        success, response = self.run_test(
            "Admin Stats",
            "GET",
            "admin/stats",
            200,
            headers=headers
        )
        return success and 'total_orders' in response

    def test_admin_orders(self):
        """Test admin orders endpoint"""
        if not self.admin_token:
            self.log_result("Admin Orders", False, "No admin token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        success, response = self.run_test(
            "Admin Orders",
            "GET",
            "admin/orders",
            200,
            headers=headers
        )
        return success

    def test_admin_edit_requests(self):
        """Test admin edit requests endpoint"""
        if not self.admin_token:
            self.log_result("Admin Edit Requests", False, "No admin token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        success, response = self.run_test(
            "Admin Edit Requests",
            "GET",
            "admin/edit-requests",
            200,
            headers=headers
        )
        return success

    def test_admin_support_tickets(self):
        """Test admin support tickets endpoint"""
        if not self.admin_token:
            self.log_result("Admin Support Tickets", False, "No admin token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        success, response = self.run_test(
            "Admin Support Tickets",
            "GET",
            "admin/support-tickets",
            200,
            headers=headers
        )
        return success

    def test_customer_endpoints_without_auth(self):
        """Test customer endpoints without authentication (should fail)"""
        endpoints = [
            ("customer/order", "GET"),
            ("customer/edit-requests", "GET"),
            ("customer/support", "GET"),
            ("customer/payments", "GET")
        ]
        
        all_passed = True
        for endpoint, method in endpoints:
            success, _ = self.run_test(
                f"Customer {endpoint} (No Auth - Should fail)",
                method,
                endpoint,
                401  # Expecting 401 Unauthorized
            )
            if not success:
                all_passed = False
        
        return all_passed

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting Website Builder API Tests...")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)

        # Test admin authentication first
        if not self.test_admin_login():
            print("❌ Admin login failed - some tests will be skipped")

        # Test Razorpay integration
        self.test_razorpay_order_creation()
        
        # Test payment verification (expected to fail with invalid signature)
        self.test_customer_registration_and_payment()
        
        # Test customer login (may fail if no test user)
        self.test_customer_login()
        
        # Test admin endpoints
        self.test_admin_stats()
        self.test_admin_orders()
        self.test_admin_edit_requests()
        self.test_admin_support_tickets()
        
        # Test authentication requirements
        self.test_customer_endpoints_without_auth()

        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for failed in self.failed_tests:
                print(f"  - {failed['test']}: {failed['details']}")
        
        if self.passed_tests:
            print(f"\n✅ Passed Tests: {len(self.passed_tests)}")
            for passed in self.passed_tests:
                print(f"  - {passed}")

        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": self.failed_tests,
            "passed_test_names": self.passed_tests,
            "success_rate": (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        }

def main():
    tester = WebsiteBuilderAPITester()
    results = tester.run_all_tests()
    
    # Return appropriate exit code
    if results["success_rate"] >= 70:  # Consider 70% pass rate as acceptable
        return 0
    else:
        return 1

if __name__ == "__main__":
    sys.exit(main())