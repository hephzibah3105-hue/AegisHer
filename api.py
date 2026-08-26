from flask import Flask, request, jsonify
import joblib

app = Flask(__name__)

model = joblib.load("aegisher_model.pkl")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    text = data["text"]

    prediction = model.predict([text])[0]
    probability = max(model.predict_proba([text])[0])

    return jsonify({
        "prediction": prediction,
        "confidence": round(float(probability) * 100, 2)
    })

if __name__ == "__main__":
    app.run(port=5000)