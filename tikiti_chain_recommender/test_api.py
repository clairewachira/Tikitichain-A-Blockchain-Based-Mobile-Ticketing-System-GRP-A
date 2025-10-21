import requests
import json
from datetime import datetime

# API endpoint
API_URL = "http://localhost:8000"

def test_prediction():
    """Test the prediction endpoint"""
    
    # Sample request data
    request_data = {
        "user_id": 3044012,
        "event_id": 1918771225,
        "invited": 0,
        "timestamp": "2012-10-02T15:53:05.754000+00:00"
    }
    
    try:
        # Make the request
        response = requests.post(f"{API_URL}/predict", json=request_data)
        
        if response.status_code == 200:
            result = response.json()
            print("Prediction successful!")
            print(f"User ID: {result['user_id']}")
            print(f"Event ID: {result['event_id']}")
            print(f"Prediction Score: {result['prediction']:.4f}")
            print(f"Interested: {result['interested']}")
            print(f"Confidence: {result['confidence']}")
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the API. Make sure the server is running.")
    except Exception as e:
        print(f"Error: {e}")

def test_health():
    """Test the health endpoint"""
    try:
        response = requests.get(f"{API_URL}/health")
        if response.status_code == 200:
            result = response.json()
            print("Health check successful!")
            print(f"Status: {result['status']}")
            print(f"Model loaded: {result['model_loaded']}")
        else:
            print(f"Health check failed: {response.status_code}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("Testing Event Recommendation API")
    print("=" * 40)
    
    print("\n1. Testing health endpoint...")
    test_health()
    
    print("\n2. Testing prediction endpoint...")
    test_prediction()
