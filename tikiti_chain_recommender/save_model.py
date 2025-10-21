import pandas as pd
import numpy as np
import tensorflow as tf
from sklearn.preprocessing import LabelEncoder
import joblib
import os
from datetime import datetime
import re

# Load the data
print("Loading data...")
users = pd.read_csv("./data/users.csv")
train_df = pd.read_csv("./data/train.csv")
test_df = pd.read_csv("./data/test.csv")
events_attendees = pd.read_csv("./data/event_attendees.csv.gz")
events = pd.read_csv('./data/events.csv.gz')

# Process event attendees data
print("Processing event attendees data...")
events_attendees['num_yes'] = events_attendees['yes'].apply(lambda x: len(str(x).split()) if pd.notnull(x) else 0)
events_attendees['num_maybe'] = events_attendees['maybe'].apply(lambda x: len(str(x).split()) if pd.notnull(x) else 0)
events_attendees['num_no'] = events_attendees['no'].apply(lambda x: len(str(x).split()) if pd.notnull(x) else 0)
events_attendees['num_invited'] = events_attendees['invited'].apply(lambda x: len(str(x).split()) if pd.notnull(x) else 0)

event_attendees_df = events_attendees[['event', 'num_yes', 'num_maybe', 'num_no', 'num_invited']]
event_attendees_df.rename(columns={'event': 'event_id'}, inplace=True)

# Preprocessing pipeline class
class PreprocessingPipeline:
    def __init__(self, train=True):
        self.train = train

    def fit(self, X, y=None):
        return self

    def fit_transform(self, data):
        return self.transform(data)

    def transform(self, data):
        # Merge the datasets
        data.rename(columns={'user': 'user_id'}, inplace=True)
        data = pd.merge(data, users[['user_id', 'location', 'birthyear']], on='user_id', how='left')
        data.rename(columns={'event': 'event_id'}, inplace=True)
        data = pd.merge(data, events[['event_id', 'start_time', 'city', 'country']], on='event_id', how='left')
        data = pd.merge(data, event_attendees_df, on='event_id', how='left')

        # Fill the missing values
        data.dropna(subset=['location'], inplace=True)
        data['city'].fillna('Unknown', inplace=True)
        data['country'].fillna('Unknown', inplace=True)

        # Extract user_city and user_country from location
        data[['user_city', 'user_country']] = data['location'].apply(self.extract_city_country)

        # Convert the timestamps to datetime
        data['timestamp'] = pd.to_datetime(data['timestamp'], errors='coerce')
        data['start_time'] = pd.to_datetime(data['start_time'], errors='coerce')
        data['user_time'] = data['timestamp'].dt.strftime('%Y/%m/%d %H:%M:%S')
        data['event_time'] = data['start_time'].dt.strftime('%Y/%m/%d %H:%M:%S')

        # Drop the location column
        data.drop(columns=['location', 'timestamp', 'start_time'], inplace=True)

        # Convert to datetime
        data['user_time'] = pd.to_datetime(data['user_time'], errors='coerce')
        data['event_time'] = pd.to_datetime(data['event_time'], errors='coerce')

        # Calculate the age of the user
        data['birthyear'] = pd.to_datetime(data['birthyear'], errors='coerce')
        current_year = datetime.now().year
        data['user_old'] = current_year - data['birthyear'].dt.year

        # Drop the birthyear column
        data.drop(columns=['birthyear'], inplace=True)

        # Calculate the time difference between the event and the interaction
        data['delai'] = data['event_time'] - data['user_time']

        # Drop the missing values
        data.dropna(subset=['user_time', 'user_old', 'delai'], inplace=True)

        return data

    @staticmethod
    def extract_city_country(location):
        """ Function to extract user_city and user_country """
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

# Apply preprocessing
print("Applying preprocessing...")
preprocessor = PreprocessingPipeline()
train_cleaned = preprocessor.fit_transform(train_df)

# Preprocess data for model training
def preprocess_data(df, label_encoders=None, is_train=True):
    df = df.copy()
    
    if is_train:
        label_encoders = {}
        for col in ['city', 'country', 'user_city', 'user_country']:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col])
            label_encoders[col] = le
    else:
        for col in ['city', 'country', 'user_city', 'user_country']:
            # Check if the column contains unknown values
            df[col] = df[col].apply(lambda x: x if x in label_encoders[col].classes_ else 'unknown')
            le_classes = np.append(label_encoders[col].classes_, 'unknown')
            label_encoders[col].classes_ = le_classes
            df[col] = label_encoders[col].transform(df[col])
    
    X_num = df[['user_id', 'event_id', 'invited', 'num_yes', 'num_maybe', 'num_no', 
                'num_invited', 'user_old']].copy()

    X_num['user_time'] = df['user_time'].astype('int64') // 10**9
    X_num['event_time'] = df['event_time'].astype('int64') // 10**9

    X_num['delai'] = df['delai'].dt.total_seconds()

    X_cat = df[['city', 'country', 'user_city', 'user_country']]
    
    y = df['interested'] if is_train else None

    return X_cat, X_num, y, label_encoders if is_train else None

# Preprocessing on train_cleaned
print("Preprocessing training data...")
X_cat_train, X_num_train, y_train, label_encoders = preprocess_data(train_cleaned, is_train=True)

# Build and train the model
print("Building model...")
embedding_dim = 40

# Define the inputs
input_city = tf.keras.layers.Input(shape=(1,), name='input_city')
input_country = tf.keras.layers.Input(shape=(1,), name='input_country')
input_user_city = tf.keras.layers.Input(shape=(1,), name='input_user_city')
input_user_country = tf.keras.layers.Input(shape=(1,), name='input_user_country')

# Embedding layers
embedding_city = tf.keras.layers.Embedding(input_dim=len(label_encoders['city'].classes_), output_dim=embedding_dim, name='embedding_city')(input_city)
embedding_country = tf.keras.layers.Embedding(input_dim=len(label_encoders['country'].classes_), output_dim=embedding_dim, name='embedding_country')(input_country)
embedding_user_city = tf.keras.layers.Embedding(input_dim=len(label_encoders['user_city'].classes_), output_dim=embedding_dim, name='embedding_user_city')(input_user_city)
embedding_user_country = tf.keras.layers.Embedding(input_dim=len(label_encoders['user_country'].classes_), output_dim=embedding_dim, name='embedding_user_country')(input_user_country)

# Flatten the embeddings
flatten_city = tf.keras.layers.Flatten()(embedding_city)
flatten_country = tf.keras.layers.Flatten()(embedding_country)
flatten_user_city = tf.keras.layers.Flatten()(embedding_user_city)
flatten_user_country = tf.keras.layers.Flatten()(embedding_user_country)

# Input for the numeric features
input_numeric = tf.keras.layers.Input(shape=(X_num_train.shape[1],), name='input_numeric')

# Concatenation of the embeddings and the numeric features
merged = tf.keras.layers.Concatenate()([flatten_city, flatten_country, flatten_user_city, flatten_user_country, input_numeric])

# Hidden layers of the model
x = tf.keras.layers.Dense(128, activation='relu')(merged)
x = tf.keras.layers.Dense(64, activation='relu')(x)
output = tf.keras.layers.Dense(1, activation='sigmoid')(x)  # Binary prediction

# Define the model
model = tf.keras.models.Model(inputs=[input_city, input_country, input_user_city, input_user_country, input_numeric], outputs=output)
model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])

# Train the model
print("Training model...")
from sklearn.model_selection import train_test_split

X_cat_train, X_cat_valid, X_num_train, X_num_valid, y_train, y_valid = train_test_split(
    X_cat_train, X_num_train, y_train, test_size=0.2, random_state=42
)

early_stopping = tf.keras.callbacks.EarlyStopping(
    monitor='val_loss',
    patience=6,
    restore_best_weights=True,
    verbose=1
)

# Training the model
history = model.fit(
    x=[X_cat_train['city'], X_cat_train['country'], X_cat_train['user_city'], X_cat_train['user_country'], X_num_train],
    y=y_train,
    epochs=100,
    batch_size=64,
    validation_data=(
        [X_cat_valid['city'], X_cat_valid['country'], X_cat_valid['user_city'], X_cat_valid['user_country'], X_num_valid], 
        y_valid
    ),
    callbacks=[early_stopping],
    verbose=1
)

# Save the model and encoders
print("Saving model and encoders...")
model.save('model.h5')
joblib.dump(label_encoders, 'label_encoders.pkl')

print("Model and encoders saved successfully!")
print(f"Model saved as: model.h5")
print(f"Label encoders saved as: label_encoders.pkl")
