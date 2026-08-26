import joblib

model = joblib.load("aegisher_model.pkl")
print("AegisHer Model Loaded!\n")

while True:

    text = input("Enter a message (or type quit): ")

    if text.lower() == "quit":
        break

    prediction = model.predict([text])[0]
    probability = max(model.predict_proba([text])[0])

    print("\nPrediction:", prediction)
    print("Confidence:", round(probability * 100, 2), "%")
    print("-" * 50)