from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
import numpy as np
import tensorflow as tf
from datetime import datetime
import re
from sklearn.preprocessing import LabelEncoder
import joblib
import os

app = FastAPI(title="Event Recommendation API", version="1.0.0")

# Global variables to store the model and encoders
model = None
label_encoders = None
event_attendees_df = None

class UserEventRequest(BaseModel):
    user_id: int
    event_id: int
    invited: int = 0
    timestamp: str  # ISO format timestamp

class PredictionResponse(BaseModel):
    user_id: int
    event_id: int
    prediction: float
    interested: bool
    confidence: str

def load_model_and_encoders():
    """Load the trained model and encoders"""
    global model, label_encoders, event_attendees_df
    
    try:
        # Load the model
        model = tf.keras.models.load_model('model.h5')
        
        # Load the encoders
        label_encoders = joblib.load('label_encoders.pkl')
        
        # Load event attendees data
        event_attendees_df = pd.read_csv('data/event_attendees.csv.gz')
        event_attendees_df['num_yes'] = event_attendees_df['yes'].apply(lambda x: len(str(x).split()) if pd.notnull(x) else 0)
        event_attendees_df['num_maybe'] = event_attendees_df['maybe'].apply(lambda x: len(str(x).split()) if pd.notnull(x) else 0)
        event_attendees_df['num_no'] = event_attendees_df['no'].apply(lambda x: len(str(x).split()) if pd.notnull(x) else 0)
        event_attendees_df['num_invited'] = event_attendees_df['invited'].apply(lambda x: len(str(x).split()) if pd.notnull(x) else 0)
        event_attendees_df = event_attendees_df[['event', 'num_yes', 'num_maybe', 'num_no', 'num_invited']]
        event_attendees_df.rename(columns={'event': 'event_id'}, inplace=True)
        
        print("Model and encoders loaded successfully!")
        
    except Exception as e:
        print(f"Error loading model: {e}")
        raise e

def extract_city_country(location):
    """Function to extract user_city and user_country from location string"""
    cleaned_location = re.sub(r'\d+', '', location)
    words = cleaned_location.split()
    if len(words) > 2:
        user_city = ' '.join(words[:2])
        user_country = ' '.join(words[2:])
    elif len(words) == 2:
        user_city = words[0]
        user_country = words[1]
    else:
        user_city = words[0] if words else 'Unknown'
        user_country = 'Unknown'
    return pd.Series([user_city, user_country])

def preprocess_single_prediction(user_id: int, event_id: int, invited: int, timestamp: str):
    """Preprocess a single prediction request"""
    global label_encoders, event_attendees_df
    
    # Load necessary data
    users = pd.read_csv('data/users.csv')
    events = pd.read_csv('data/events.csv.gz')
    
    # Create a single row DataFrame
    data = pd.DataFrame({
        'user_id': [user_id],
        'event_id': [event_id],
        'invited': [invited],
        'timestamp': [timestamp]
    })
    
    # Merge with users data
    data = pd.merge(data, users[['user_id', 'location', 'birthyear']], on='user_id', how='left')
    
    # Merge with events data
    data = pd.merge(data, events[['event_id', 'start_time', 'city', 'country']], on='event_id', how='left')
    
    # Merge with event attendees data
    data = pd.merge(data, event_attendees_df, on='event_id', how='left')
    
    # Fill missing values
    data['city'].fillna('Unknown', inplace=True)
    data['country'].fillna('Unknown', inplace=True)
    data['num_yes'].fillna(0, inplace=True)
    data['num_maybe'].fillna(0, inplace=True)
    data['num_no'].fillna(0, inplace=True)
    data['num_invited'].fillna(0, inplace=True)
    
    # Extract user_city and user_country from location
    if pd.notnull(data['location'].iloc[0]):
        data[['user_city', 'user_country']] = data['location'].apply(extract_city_country)
    else:
        data['user_city'] = 'Unknown'
        data['user_country'] = 'Unknown'
    
    # Convert timestamps
    data['timestamp'] = pd.to_datetime(data['timestamp'], errors='coerce')
    data['start_time'] = pd.to_datetime(data['start_time'], errors='coerce')
    data['user_time'] = data['timestamp'].dt.strftime('%Y/%m/%d %H:%M:%S')
    data['event_time'] = data['start_time'].dt.strftime('%Y/%m/%d %H:%M:%S')
    
    # Convert to datetime
    data['user_time'] = pd.to_datetime(data['user_time'], errors='coerce')
    data['event_time'] = pd.to_datetime(data['event_time'], errors='coerce')
    
    # Calculate user age
    data['birthyear'] = pd.to_datetime(data['birthyear'], errors='coerce')
    current_year = datetime.now().year
    data['user_old'] = current_year - data['birthyear'].dt.year
    
    # Calculate time difference
    data['delai'] = data['event_time'] - data['user_time']
    
    # Handle missing values
    data['user_old'].fillna(30, inplace=True)  # Default age
    data['delai'] = data['delai'].dt.total_seconds()
    data['delai'].fillna(0, inplace=True)
    
    # Encode categorical variables
    for col in ['city', 'country', 'user_city', 'user_country']:
        # Handle unknown values
        if col in label_encoders:
            data[col] = data[col].apply(lambda x: x if x in label_encoders[col].classes_ else 'unknown')
            le_classes = np.append(label_encoders[col].classes_, 'unknown')
            label_encoders[col].classes_ = le_classes
            data[col] = label_encoders[col].transform(data[col])
    
    # Prepare numeric features
    X_num = data[['user_id', 'event_id', 'invited', 'num_yes', 'num_maybe', 'num_no', 
                  'num_invited', 'user_old']].copy()
    
    X_num['user_time'] = data['user_time'].astype('int64') // 10**9
    X_num['event_time'] = data['event_time'].astype('int64') // 10**9
    X_num['delai'] = data['delai']
    
    X_cat = data[['city', 'country', 'user_city', 'user_country']]
    
    return X_cat, X_num

@app.on_event("startup")
async def startup_event():
    """Load model and encoders on startup"""
    load_model_and_encoders()

@app.get("/")
async def root():
    return {"message": "Event Recommendation API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": model is not None}

@app.post("/predict", response_model=PredictionResponse)
async def predict_interest(request: UserEventRequest):
    """
    Predict if a user will be interested in an event
    """
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    try:
        # Preprocess the input data
        X_cat, X_num = preprocess_single_prediction(
            request.user_id, 
            request.event_id, 
            request.invited, 
            request.timestamp
        )
        
        # Make prediction
        prediction = model.predict([
            X_cat['city'].values.reshape(-1, 1),
            X_cat['country'].values.reshape(-1, 1),
            X_cat['user_city'].values.reshape(-1, 1),
            X_cat['user_country'].values.reshape(-1, 1),
            X_num.values
        ])
        
        prediction_value = float(prediction[0][0])
        interested = prediction_value > 0.5
        
        # Determine confidence level
        if prediction_value > 0.8 or prediction_value < 0.2:
            confidence = "high"
        elif prediction_value > 0.6 or prediction_value < 0.4:
            confidence = "medium"
        else:
            confidence = "low"
        
        return PredictionResponse(
            user_id=request.user_id,
            event_id=request.event_id,
            prediction=prediction_value,
            interested=interested,
            confidence=confidence
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
