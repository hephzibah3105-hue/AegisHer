import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score


print("Loading AegisHer dataset...")

# Load dataset
df = pd.read_csv("dataset/aegisher_dataset.csv")

print("Total samples:", len(df))

# Remove empty values
df = df.dropna(subset=["text", "aegisher_label"])

# Input and output
X = df["text"]
y = df["aegisher_label"]

# Split dataset
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print("Training samples:", len(X_train))
print("Testing samples:", len(X_test))

# Create machine-learning pipeline
model = Pipeline([
    (
        "tfidf",
        TfidfVectorizer(
            lowercase=True,
            ngram_range=(1, 2),
            max_features=50000
        )
    ),
    (
        "classifier",
        LogisticRegression(
            max_iter=1000
        )
    )
])

print("\nTraining model...")

# TRAIN
model.fit(X_train, y_train)

print("Training completed!")

# Test model
predictions = model.predict(X_test)

accuracy = accuracy_score(y_test, predictions)

print("\nModel Accuracy:", round(accuracy * 100, 2), "%")

print("\nClassification Report:")
print(classification_report(y_test, predictions))

# Save trained model
joblib.dump(model, "aegisher_model.pkl")

print("\nModel saved successfully!")
print("File: dataset/dataset/aegisher_model.pkl")