import joblib
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

# Load trained model
model = joblib.load("aegisher_model.pkl")

# Load dataset
data = pd.read_csv("dataset/aegisher_dataset.csv")

# Separate text and labels
X = data["text"]
y = data["aegisher_label"]

# Predict
predictions = model.predict(X)

# Accuracy
accuracy = accuracy_score(y, predictions)

print("\n==============================")
print("AEGISher MODEL EVALUATION")
print("==============================")

print("\nAccuracy:", round(accuracy * 100, 2), "%")

print("\nClassification Report:")
print(classification_report(y, predictions))

print("\nConfusion Matrix:")
print(confusion_matrix(y, predictions))