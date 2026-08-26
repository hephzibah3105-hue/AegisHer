import json
import math
from collections import defaultdict

# 1. EXPANDED TRAINING DATASET
TRAINING_DATA = [
    # Category 0: SAFE / BENIGN
    ("Hey, are you free this weekend for coffee?", "SAFE"),
    ("Let me know when the project presentation starts.", "SAFE"),
    ("Please review the pull request on GitHub.", "SAFE"),
    ("Great job on the hackathon project team!", "SAFE"),
    ("Can you send me the lecture notes for yesterday's class?", "SAFE"),
    ("Happy birthday! Wishing you all the best.", "SAFE"),
    ("The weather in the city today is wonderful.", "SAFE"),
    ("Don't forget to submit the assignment before 11:59 PM.", "SAFE"),
    
    # Category 1: SEXTORTION & BLACKMAIL
    ("Send me your private photos or I will expose you online", "SEXTORTION_BLACKMAIL"),
    ("I have recorded your webcam, send money or I leak the video", "SEXTORTION_BLACKMAIL"),
    ("Give me your nudes or I will share your messages with everyone", "SEXTORTION_BLACKMAIL"),
    ("Pay 500 dollars in bitcoin or your intimate pictures will be posted", "SEXTORTION_BLACKMAIL"),
    ("I will ruin your life and send these screenshots to your family", "SEXTORTION_BLACKMAIL"),
    ("Upload your nudes right now or face the consequences", "SEXTORTION_BLACKMAIL"),
    ("I hacked your camera and captured your private moments", "SEXTORTION_BLACKMAIL"),
    ("Send explicit photos or I will expose you to your college and workplace", "SEXTORTION_BLACKMAIL"),
    
    # Category 2: CYBERSTALKING & VIOLENCE
    ("I know where you live and I am watching your house", "CYBERSTALKING_VIOLENCE"),
    ("I will track your location and hunt you down", "CYBERSTALKING_VIOLENCE"),
    ("Watch your back when you walk home tonight", "CYBERSTALKING_VIOLENCE"),
    ("I am going to find you and kill you", "CYBERSTALKING_VIOLENCE"),
    ("Posting your real address and phone number online right now", "CYBERSTALKING_VIOLENCE"),
    ("I have been following your every step outside your window", "CYBERSTALKING_VIOLENCE"),
    
    # Category 3: GENDER-BASED HARASSMENT & ABUSE
    ("You are a disgusting slut and deserve to be attacked", "GENDER_HARASSMENT"),
    ("Nobody cares about you, go end your life bitch", "GENDER_HARASSMENT"),
    ("I will assault and violate you if I catch you alone", "GENDER_HARASSMENT"),
    ("Worthless whore should know her place", "GENDER_HARASSMENT"),
    
    # Category 4: PHISHING & FINANCIAL COERCION
    ("Your bank account is suspended, share your OTP immediately to verify", "PHISHING_COERCION"),
    ("Send me your verification code right now to unlock your account", "PHISHING_COERCION"),
    ("Urgent: Confirm your netbanking credentials or card will be blocked", "PHISHING_COERCION"),
    ("Claim your 1000 prize by logging in with your password here", "PHISHING_COERCION"),

    # Category 5: AUTOMATED BOT / HONEYPOT DETECTION
    ("unauthorized automated interaction detected on decoy inputs", "AUTOMATED_BOT"),
    ("decoy credential parameter accessed by automated crawler script", "AUTOMATED_BOT"),
    ("bot trying to submit hidden decoy form fields", "AUTOMATED_BOT"),
    ("malicious scraper harvesting web form values", "AUTOMATED_BOT"),
    ("stealth scraper traversing hidden decoy links", "AUTOMATED_BOT"),
    ("automated tool reading secret window config attributes", "AUTOMATED_BOT"),
    ("crawler hovering hidden link decoy trap", "AUTOMATED_BOT"),
    ("decoy key token altered by scraper", "AUTOMATED_BOT")
]

# 2. TOKENIZATION & NAIVE BAYES TRAINING
def tokenize(text):
    import re
    return re.findall(r'\b\w+\b', text.lower())

def train_and_export():
    class_counts = defaultdict(int)
    word_counts = defaultdict(lambda: defaultdict(int))
    vocab = set()
    total_docs = len(TRAINING_DATA)

    for text, label in TRAINING_DATA:
        class_counts[label] += 1
        words = set(tokenize(text))
        for w in words:
            word_counts[label][w] += 1
            vocab.add(w)

    # Calculate log priors and log likelihoods
    model_export = {
        "classes": list(class_counts.keys()),
        "priors": {},
        "likelihoods": {},
        "vocab": list(vocab),
        "threatWeights": {
            "SAFE": 0,
            "PHISHING_COERCION": 80,
            "GENDER_HARASSMENT": 88,
            "CYBERSTALKING_VIOLENCE": 92,
            "SEXTORTION_BLACKMAIL": 96,
            "AUTOMATED_BOT": 95
        }
    }

    for label, count in class_counts.items():
        model_export["priors"][label] = math.log(count / total_docs)
        model_export["likelihoods"][label] = {}
        total_class_words = sum(word_counts[label].values()) + len(vocab)
        
        for w in vocab:
            # Laplace smoothing
            prob = (word_counts[label][w] + 1) / total_class_words
            model_export["likelihoods"][label][w] = math.log(prob)

    # 3. SAVE THE MODEL FOR THE EXTENSION
    # Save the model directly in the same directory as this script
    import os
    output_path = os.path.join(os.path.dirname(__file__), "threat_model.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(model_export, f, indent=2)
    print(f"Model trained on {len(TRAINING_DATA)} samples and exported to '{output_path}' successfully.")

if __name__ == "__main__":
    train_and_export()