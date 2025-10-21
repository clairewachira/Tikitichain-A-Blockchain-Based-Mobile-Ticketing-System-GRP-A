# Event Recommendation API

A FastAPI-based recommendation system that predicts whether a user will be interested in an event.

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Train and save the model:**
   ```bash
   python save_model.py
   ```
   This will create `model.h5` and `label_encoders.pkl` files.

3. **Start the API server:**
   ```bash
   python main.py
   ```
   The API will be available at `http://localhost:8000`

## API Endpoints

### Health Check
- **GET** `/health`
- Returns the health status and whether the model is loaded

### Prediction
- **POST** `/predict`
- Predicts if a user will be interested in an event

#### Request Body:
```json
{
    "user_id": 3044012,
    "event_id": 1918771225,
    "invited": 0,
    "timestamp": "2012-10-02T15:53:05.754000+00:00"
}
```

#### Response:
```json
{
    "user_id": 3044012,
    "event_id": 1918771225,
    "prediction": 0.2345,
    "interested": false,
    "confidence": "medium"
}
```

## Testing

Run the test script to verify the API is working:
```bash
python test_api.py
```

## API Documentation

Once the server is running, visit:
- Interactive API docs: `http://localhost:8000/docs`
- Alternative docs: `http://localhost:8000/redoc`

## Model Details

The model uses:
- **Neural Network**: Deep learning model with embedding layers for categorical features
- **Features**: User demographics, event details, location data, and temporal information
- **Output**: Probability score (0-1) indicating interest level
- **Threshold**: 0.5 for binary classification

## Error Handling

The API includes comprehensive error handling for:
- Missing model files
- Invalid input data
- Data preprocessing errors
- Prediction failures
