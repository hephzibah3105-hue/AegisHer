import json
import math
import re
import os
from flask import Flask, request, jsonify

app = Flask(__name__)

# Native CORS support header injector
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response

# Handle preflight options requests
@app.route("/api/analyze", methods=["OPTIONS"])
@app.route("/api/telemetry", methods=["OPTIONS"])
def handle_options():
    return jsonify({"success": True}), 200

@app.route("/", methods=["GET"])
def health_check():
    return jsonify({
        "status": "online",
        "message": "AegisHer local backend server is active. Send POST requests with payload to analyze."
    }), 200

# Load threat model
MODEL_PATH = os.path.join(os.path.dirname(__file__), "threat_model.json")
model = None

try:
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, "r", encoding="utf-8") as f:
            model = json.load(f)
        print(f"[AegisHer Backend] Loaded threat model from: {MODEL_PATH}")
    else:
        print(f"[AegisHer Backend] Warning: {MODEL_PATH} not found. Classification will fall back to safe state.")
except Exception as e:
    print(f"[AegisHer Backend] Error loading threat model: {e}")

def tokenize(text):
    if not text:
        return []
    return re.findall(r'\b\w+\b', text.lower())

def predict_naive_bayes(text):
    if not model or "classes" not in model or "priors" not in model or "likelihoods" not in model:
        return {"bestClass": "SAFE", "threatScore": 0, "scores": {}}

    tokens = tokenize(text)
    best_class = None
    max_score = -float("inf")
    scores = {}

    for cls in model["classes"]:
        score = model["priors"][cls]
        for token in tokens:
            if token in model["likelihoods"][cls]:
                score += model["likelihoods"][cls][token]
        scores[cls] = score
        if score > max_score:
            max_score = score
            best_class = cls

    threat_score = model["threatWeights"].get(best_class, 0)
    return {
        "bestClass": best_class,
        "threatScore": threat_score,
        "scores": scores
    }

@app.route("/api/analyze", methods=["GET", "POST"])
def analyze_threats():
    if request.method == "GET":
        return jsonify({
            "status": "online",
            "message": "Endpoint active. Send POST requests with payload to analyze."
        }), 200
    try:
        data = request.get_json() or {}
        text = data.get("text", "")
        url = data.get("url", "")

        # 1. Text Classification
        if text:
            result = predict_naive_bayes(text)
            print(f"[AegisHer Backend] Analyzed Text: \"{text[:60]}...\" -> {result['bestClass']} ({result['threatScore']}/100)")
            return jsonify({
                "success": True,
                "classification": result["bestClass"],
                "score": result["threatScore"],
                "factors": [f"Bayesian classifier match: {result['bestClass']} (score: {result['threatScore']})"]
            })

        # 2. Heuristic URL Scoring (Local Offline Logic)
        if url:
            # Replicate the regex and score verification locally
            score = 0
            factors = []
            
            # Simple hostname checks
            if re.search(r'\b(xyz|top|phishing|cc|work|click|country|kim|zip|mov)\b', url):
                score += 30
                factors.append("Domain uses high-risk top-level domain (+30)")
                
            # Suspicious keywords
            keywords = ['login', 'verify', 'account', 'security', 'update', 'banking', 'paypal', 'crypto', 'nude', 'leak', 'threat', 'blackmail', 'extort']
            matched = [kw for kw in keywords if kw in url.lower()]
            if matched:
                kw_score = min(30, len(matched) * 15)
                score += kw_score
                factors.append(f"Contains security/threat keywords: {matched} (+{kw_score})")

            # Length obfuscation
            if len(url) > 130:
                score += 10
                factors.append("Excessively long URL path (+10)")

            score = min(100, score)
            risk_level = "LOW"
            if score >= 75:
                risk_level = "CRITICAL"
            elif score >= 60:
                risk_level = "HIGH"
            elif score >= 35:
                risk_level = "MEDIUM"

            print(f"[AegisHer Backend] Analyzed URL: \"{url}\" -> {risk_level} ({score}/100)")
            return jsonify({
                "success": True,
                "score": score,
                "riskLevel": risk_level,
                "factors": factors
            })

        return jsonify({"success": False, "error": "No input text or URL provided"}), 400

    except Exception as err:
        print(f"[AegisHer Backend] Analysis server error: {err}")
        return jsonify({"success": False, "error": str(err)}), 500

@app.route("/api/telemetry", methods=["GET", "POST"])
def ingest_telemetry():
    if request.method == "GET":
        return jsonify({
            "status": "online",
            "message": "Endpoint active. Send POST requests with payload to analyze."
        }), 200
    try:
        data = request.get_json() or {}
        print("\n" + "="*60)
        print("                 [AegisHer Backend Telemetry Log] ")
        print(f"Time         : {data.get('timestamp', 'N/A')}")
        print(f"Event Action : {data.get('event', 'N/A')}")
        print(f"Threat Type  : {data.get('threatType', 'N/A')}")
        print(f"Threat Score : {data.get('score', 0)} / 100")
        print(f"Trap Type    : {data.get('trapType', 'N/A')}")
        print(f"Target URL   : {data.get('url', 'N/A')}")
        print(f"Detail/Text  : \"{data.get('details', '')}\"")
        print("="*60 + "\n")

        return jsonify({"success": True, "status": "Logged"})
    except Exception as err:
        print(f"[AegisHer Backend] Telemetry ingest error: {err}")
        return jsonify({"success": False, "error": str(err)}), 500

if __name__ == "__main__":
    print("[AegisHer Backend] Running local server on http://localhost:5000")
    app.run(host="127.0.0.1", port=5000)
