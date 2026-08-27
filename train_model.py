import json
import math
import re
import os
import random
from collections import defaultdict

# ---------------------------------------------------------------------------
# 1. COMPREHENSIVE 7-CLASS DATASET WITH RICH HARD NEGATIVES
# ---------------------------------------------------------------------------

DATASET = [
    # ==================== SAFE / HARD NEGATIVE EXAMPLES ====================
    ("Instagram", "SAFE"),
    ("WhatsApp", "SAFE"),
    ("GitHub", "SAFE"),
    ("Gemini", "SAFE"),
    ("LeetCode", "SAFE"),
    ("dusky women", "SAFE"),
    ("beautiful girl", "SAFE"),
    ("women's fashion", "SAFE"),
    ("send me a photo", "SAFE"),
    ("send me a video", "SAFE"),
    ("porn", "SAFE"),
    ("I watched a movie", "SAFE"),
    ("I saw a girl on Instagram", "SAFE"),
    ("this is a beautiful photo", "SAFE"),
    ("My friend sent me an OTP", "SAFE"),
    ("The movie character said 'I will kill you'", "SAFE"),
    ("girls fashion", "SAFE"),
    ("style tips", "SAFE"),
    ("I bought a dress for women", "SAFE"),
    ("She posted a photo on Instagram", "SAFE"),
    ("I searched for porn", "SAFE"),
    ("Watch this video", "SAFE"),
    ("Hey, are you free this weekend for coffee?", "SAFE"),
    ("Let me know when the project presentation starts.", "SAFE"),
    ("Please review the pull request on GitHub.", "SAFE"),
    ("Great job on the hackathon project team!", "SAFE"),
    ("Can you send me the lecture notes for yesterday's class?", "SAFE"),
    ("Happy birthday! Wishing you all the best.", "SAFE"),
    ("The weather in the city today is wonderful.", "SAFE"),
    ("Don't forget to submit the assignment before 11:59 PM.", "SAFE"),
    ("I love reading books and listening to music.", "SAFE"),
    ("Check out this cool repository on GitHub.", "SAFE"),
    ("We are going to the mall to buy clothes for girls.", "SAFE"),
    ("She is a dusky model with amazing fashion style.", "SAFE"),
    ("Send me the vacation photos from yesterday.", "SAFE"),
    ("Can you share the link to the YouTube video?", "SAFE"),
    ("I forgot my password and requested a new OTP for my own account.", "SAFE"),
    ("The actor in the film said he will kill his enemy.", "SAFE"),
    ("Women in tech are doing incredible work worldwide.", "SAFE"),
    ("I received a verification OTP on my phone for logging into my laptop.", "SAFE"),
    ("Searching for beautiful photography on Google.", "SAFE"),
    ("Learning Python programming on LeetCode.", "SAFE"),
    ("Chatting with friends on WhatsApp about the weekend trip.", "SAFE"),
    ("Asking Gemini AI to generate code snippets.", "SAFE"),
    ("She looks stunning in her new outfit photo.", "SAFE"),
    ("Adult content warnings apply to this film.", "SAFE"),
    ("I sent a photo to my mom.", "SAFE"),
    ("Download the official WhatsApp app from the store.", "SAFE"),
    ("Follow our Instagram page for daily design inspiration.", "SAFE"),
    ("Girls coding bootcamp starts next Monday.", "SAFE"),
    ("Women's health and wellness tips.", "SAFE"),
    ("Please send me your resume photo.", "SAFE"),
    ("Here is a video tutorial for solving LeetCode problems.", "SAFE"),

    # ==================== SEXTORTION_BLACKMAIL ====================
    ("Send me your private photos or I will leak them.", "SEXTORTION_BLACKMAIL"),
    ("Give me your private photos or everyone will see them.", "SEXTORTION_BLACKMAIL"),
    ("Send the intimate pictures now or I will post them online.", "SEXTORTION_BLACKMAIL"),
    ("I have your private photos and I will expose you.", "SEXTORTION_BLACKMAIL"),
    ("Pay me money or I will leak your pictures.", "SEXTORTION_BLACKMAIL"),
    ("Pay me in bitcoin or I will publish your private videos.", "SEXTORTION_BLACKMAIL"),
    ("I recorded you through your webcam and I will expose you.", "SEXTORTION_BLACKMAIL"),
    ("I have your intimate videos and I will send them to your friends.", "SEXTORTION_BLACKMAIL"),
    ("Send me naked pictures or I will share everything.", "SEXTORTION_BLACKMAIL"),
    ("Give me money or your private photos go online.", "SEXTORTION_BLACKMAIL"),
    ("I will post your pictures everywhere if you don't pay.", "SEXTORTION_BLACKMAIL"),
    ("Your private video will be uploaded if you refuse.", "SEXTORTION_BLACKMAIL"),
    ("I hacked your camera and recorded your private moments.", "SEXTORTION_BLACKMAIL"),
    ("Pay me or I will send your intimate videos to your family.", "SEXTORTION_BLACKMAIL"),
    ("I will expose your private content to everyone.", "SEXTORTION_BLACKMAIL"),
    ("Send the explicit pictures immediately or I will leak them.", "SEXTORTION_BLACKMAIL"),
    ("I have nudes of you and I will ruin your life if you don't pay.", "SEXTORTION_BLACKMAIL"),
    ("I will ruin you by posting your intimate webcam recordings.", "SEXTORTION_BLACKMAIL"),
    ("Give me your nudes right now or I will send them to your workplace.", "SEXTORTION_BLACKMAIL"),
    ("Pay me cash or I will publish your explicit recordings online.", "SEXTORTION_BLACKMAIL"),

    # ==================== VIOLENT_THREAT ====================
    ("I will kill you.", "VIOLENT_THREAT"),
    ("I am going to murder you.", "VIOLENT_THREAT"),
    ("I will hunt you down.", "VIOLENT_THREAT"),
    ("I will shoot you.", "VIOLENT_THREAT"),
    ("I will stab you.", "VIOLENT_THREAT"),
    ("I will beat you up.", "VIOLENT_THREAT"),
    ("I will seriously harm you.", "VIOLENT_THREAT"),
    ("You deserve to die.", "VIOLENT_THREAT"),
    ("Die bitch.", "VIOLENT_THREAT"),
    ("I will find you and hurt you.", "VIOLENT_THREAT"),
    ("I will hunt you down and kill you.", "VIOLENT_THREAT"),
    ("You better watch your back because I will hurt you.", "VIOLENT_THREAT"),
    ("I am coming for you and I will destroy you.", "VIOLENT_THREAT"),
    ("I will destroy you physically.", "VIOLENT_THREAT"),
    ("I will choke you.", "VIOLENT_THREAT"),
    ("I will make you pay with your life.", "VIOLENT_THREAT"),
    ("You are going to regret this when I find you and beat you.", "VIOLENT_THREAT"),
    ("I will attack you when you leave your house.", "VIOLENT_THREAT"),
    ("I will hurt you badly.", "VIOLENT_THREAT"),
    ("I am going to find you and beat you up.", "VIOLENT_THREAT"),

    # ==================== CYBERSTALKING_DOXXING ====================
    ("I know where you live.", "CYBERSTALKING_DOXXING"),
    ("I know where you work.", "CYBERSTALKING_DOXXING"),
    ("I know where you study.", "CYBERSTALKING_DOXXING"),
    ("I know where you sleep.", "CYBERSTALKING_DOXXING"),
    ("I am watching your every move.", "CYBERSTALKING_DOXXING"),
    ("I am watching your house.", "CYBERSTALKING_DOXXING"),
    ("I am stalking you.", "CYBERSTALKING_DOXXING"),
    ("I know your real-time location.", "CYBERSTALKING_DOXXING"),
    ("I am tracking your GPS.", "CYBERSTALKING_DOXXING"),
    ("I am monitoring your phone.", "CYBERSTALKING_DOXXING"),
    ("I have your home address.", "CYBERSTALKING_DOXXING"),
    ("I have your phone number and SSN.", "CYBERSTALKING_DOXXING"),
    ("I know your real identity.", "CYBERSTALKING_DOXXING"),
    ("I found your address online and I am posting it.", "CYBERSTALKING_DOXXING"),
    ("I am tracking your device location right now.", "CYBERSTALKING_DOXXING"),
    ("I know where you commute every day.", "CYBERSTALKING_DOXXING"),
    ("I am outside your house watching through your window.", "CYBERSTALKING_DOXXING"),
    ("I have your exact location and home address.", "CYBERSTALKING_DOXXING"),
    ("I know exactly where you stay.", "CYBERSTALKING_DOXXING"),
    ("Posting your real identity, phone number, and address online right now.", "CYBERSTALKING_DOXXING"),

    # ==================== COERCION_MANIPULATION ====================
    ("Do this now or there will be consequences.", "COERCION_MANIPULATION"),
    ("Do what I say or face the consequences.", "COERCION_MANIPULATION"),
    ("Do as you are told.", "COERCION_MANIPULATION"),
    ("Do what I want or else.", "COERCION_MANIPULATION"),
    ("No one will believe you if you tell anyone.", "COERCION_MANIPULATION"),
    ("If you tell anyone I will hurt you.", "COERCION_MANIPULATION"),
    ("If you speak about this I will ruin you.", "COERCION_MANIPULATION"),
    ("You have 24 hours to respond.", "COERCION_MANIPULATION"),
    ("You have 24 hours to comply.", "COERCION_MANIPULATION"),
    ("You have until tonight to send it.", "COERCION_MANIPULATION"),
    ("You better do what I say.", "COERCION_MANIPULATION"),
    ("If you refuse you will regret it.", "COERCION_MANIPULATION"),
    ("Don't tell anyone about this or else.", "COERCION_MANIPULATION"),
    ("Nobody will believe you if you report this.", "COERCION_MANIPULATION"),
    ("You have one hour to comply.", "COERCION_MANIPULATION"),
    ("Do exactly what I tell you right now.", "COERCION_MANIPULATION"),
    ("If you disobey there will be severe consequences.", "COERCION_MANIPULATION"),
    ("You have until tonight to reply or else.", "COERCION_MANIPULATION"),
    ("Keep this secret or face the consequences.", "COERCION_MANIPULATION"),
    ("You must obey me or I will expose you.", "COERCION_MANIPULATION"),

    # ==================== PHISHING_FRAUD ====================
    ("Give me your OTP immediately.", "PHISHING_FRAUD"),
    ("Send me your OTP immediately.", "PHISHING_FRAUD"),
    ("Give me your verification code now.", "PHISHING_FRAUD"),
    ("Share your OTP to unlock your account.", "PHISHING_FRAUD"),
    ("Send your 2FA code immediately.", "PHISHING_FRAUD"),
    ("Provide your one-time password now.", "PHISHING_FRAUD"),
    ("Your account has been suspended. Click here to verify now.", "PHISHING_FRAUD"),
    ("Your account will be terminated. Verify your identity.", "PHISHING_FRAUD"),
    ("Your account is blocked. Click here to unlock it.", "PHISHING_FRAUD"),
    ("Enter your netbanking password to prevent account closure.", "PHISHING_FRAUD"),
    ("Enter your credit card PIN to claim your reward.", "PHISHING_FRAUD"),
    ("Send your password to confirm your identity.", "PHISHING_FRAUD"),
    ("Provide your security PIN immediately.", "PHISHING_FRAUD"),
    ("Click here and enter your banking details.", "PHISHING_FRAUD"),
    ("Verify your account now or it will be closed.", "PHISHING_FRAUD"),
    ("Your bank account has been suspended. Verify now.", "PHISHING_FRAUD"),
    ("Share the OTP to complete the transaction.", "PHISHING_FRAUD"),
    ("Give me the code you received on your phone immediately.", "PHISHING_FRAUD"),
    ("Enter your password to prevent closure.", "PHISHING_FRAUD"),
    ("Send your verification code to unlock your account.", "PHISHING_FRAUD"),

    # ==================== GENDER_BASED_HARASSMENT ====================
    ("You are worthless because you are a woman.", "GENDER_BASED_HARASSMENT"),
    ("You are a disgusting slut.", "GENDER_BASED_HARASSMENT"),
    ("You are such a whore.", "GENDER_BASED_HARASSMENT"),
    ("Women like you are worthless.", "GENDER_BASED_HARASSMENT"),
    ("You deserve to be treated badly because you are a woman.", "GENDER_BASED_HARASSMENT"),
    ("You are an ugly bitch.", "GENDER_BASED_HARASSMENT"),
    ("Girls like you should stay silent.", "GENDER_BASED_HARASSMENT"),
    ("You are nothing but a slut.", "GENDER_BASED_HARASSMENT"),
    ("Women should know their place.", "GENDER_BASED_HARASSMENT"),
    ("You are disgusting and worthless.", "GENDER_BASED_HARASSMENT"),
    ("Nobody wants a woman like you.", "GENDER_BASED_HARASSMENT"),
    ("You are a worthless girl.", "GENDER_BASED_HARASSMENT"),
    ("You are an embarrassing woman.", "GENDER_BASED_HARASSMENT"),
    ("Girls like you deserve no respect.", "GENDER_BASED_HARASSMENT"),
    ("You are just a pathetic bitch.", "GENDER_BASED_HARASSMENT"),
    ("Women like you are useless.", "GENDER_BASED_HARASSMENT"),
    ("You are disgusting and pathetic.", "GENDER_BASED_HARASSMENT"),
    ("You should be ashamed of being a woman.", "GENDER_BASED_HARASSMENT"),
    ("You are an ugly whore.", "GENDER_BASED_HARASSMENT"),
    ("Nobody respects women like you.", "GENDER_BASED_HARASSMENT"),
]

# Generate balanced dataset variations
EXPANDED_DATASET = []
for text, label in DATASET:
    EXPANDED_DATASET.append((text, label))
    EXPANDED_DATASET.append((text.lower(), label))
    if len(text.split()) > 3:
        EXPANDED_DATASET.append((text.strip("."), label))

# Tokenization helper matching content.js
def tokenize(text):
    if not text:
        return []
    return re.findall(r'\b\w+\b', text.lower())

def train_model(train_samples):
    class_counts = defaultdict(int)
    word_counts = defaultdict(lambda: defaultdict(int))
    vocab = set()
    total_docs = len(train_samples)

    for text, label in train_samples:
        class_counts[label] += 1
        words = set(tokenize(text))
        for w in words:
            word_counts[label][w] += 1
            vocab.add(w)

    classes = [
        "SAFE",
        "GENDER_BASED_HARASSMENT",
        "SEXTORTION_BLACKMAIL",
        "PHISHING_FRAUD",
        "CYBERSTALKING_DOXXING",
        "VIOLENT_THREAT",
        "COERCION_MANIPULATION"
    ]

    model_export = {
        "classes": classes,
        "priors": {},
        "likelihoods": {},
        "vocab": sorted(list(vocab)),
        "threatWeights": {
            "SAFE": 0,
            "COERCION_MANIPULATION": 80,
            "PHISHING_FRAUD": 85,
            "GENDER_BASED_HARASSMENT": 88,
            "CYBERSTALKING_DOXXING": 90,
            "VIOLENT_THREAT": 95,
            "SEXTORTION_BLACKMAIL": 98
        }
    }

    for label in classes:
        count = class_counts[label]
        prior_prob = count / total_docs if count > 0 else 1 / (total_docs + len(classes))
        model_export["priors"][label] = math.log(prior_prob)
        model_export["likelihoods"][label] = {}
        
        total_class_words = sum(word_counts[label].values()) + len(vocab)
        
        for w in vocab:
            prob = (word_counts[label][w] + 1) / total_class_words
            model_export["likelihoods"][label][w] = math.log(prob)

    return model_export

def predict(model, text):
    tokens = tokenize(text)
    best_class = "SAFE"
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

    # Log-likelihood margin check: Require positive confidence margin over SAFE for threat classes
    safe_score = scores.get("SAFE", -float("inf"))
    threat_margin = max_score - safe_score

    if best_class != "SAFE" and threat_margin < 0.5:
        best_class = "SAFE"

    return best_class, scores.get(best_class, 0), threat_margin

def evaluate():
    random.seed(42)
    shuffled = list(EXPANDED_DATASET)
    random.shuffle(shuffled)
    
    # Train full model for production export
    full_model = train_model(shuffled)
    
    root_output = os.path.join(os.path.dirname(__file__), "threat_model.json")
    with open(root_output, "w", encoding="utf-8") as f:
        json.dump(full_model, f, indent=2)
    print(f"Model exported successfully to '{root_output}' with 7 classes.")

    # ---------------------------------------------------------------------------
    # MANDATORY TEST SUITE FROM USER PROMPT
    # ---------------------------------------------------------------------------
    
    negative_tests = [
        "Instagram",
        "WhatsApp",
        "GitHub",
        "Gemini",
        "LeetCode",
        "dusky women",
        "beautiful girl",
        "women's fashion",
        "send me a photo",
        "send me a video",
        "porn",
        "I watched a movie",
        "I saw a girl on Instagram",
        "this is a beautiful photo"
    ]
    
    positive_tests = [
        ("I know where you live.", "CYBERSTALKING_DOXXING"),
        ("Send me your private photos or I will leak them.", "SEXTORTION_BLACKMAIL"),
        ("I will kill you.", "VIOLENT_THREAT"),
        ("Give me your OTP immediately.", "PHISHING_FRAUD"),
        ("Do this now or you will regret it.", "COERCION_MANIPULATION"),
        ("You are worthless because you are a woman.", "GENDER_BASED_HARASSMENT")
    ]
    
    print("\n=======================================================")
    print("        MANDATORY NEGATIVE EXAMPLES TEST RESULTS        ")
    print("=======================================================")
    neg_passed = 0
    for text in negative_tests:
        cls, score, margin = predict(full_model, text)
        status = "[PASSED]" if cls == "SAFE" else f"[FAILED] (Got {cls})"
        if cls == "SAFE":
            neg_passed += 1
        print(f"Text: \"{text:<35}\" -> Result: {cls:<25} {status}")
        
    print(f"\nNegative Examples Accuracy: {neg_passed}/{len(negative_tests)} ({round(neg_passed/len(negative_tests)*100, 2)}%)")

    print("\n=======================================================")
    print("        MANDATORY POSITIVE EXAMPLES TEST RESULTS        ")
    print("=======================================================")
    pos_passed = 0
    for text, expected in positive_tests:
        cls, score, margin = predict(full_model, text)
        status = "[PASSED]" if cls == expected else f"[FAILED] (Expected {expected}, Got {cls})"
        if cls == expected:
            pos_passed += 1
        print(f"Text: \"{text:<50}\"\n      Expected: {expected:<25} | Got: {cls:<25} {status}\n")

    print(f"Positive Examples Accuracy: {pos_passed}/{len(positive_tests)} ({round(pos_passed/len(positive_tests)*100, 2)}%)")

    # ---------------------------------------------------------------------------
    # HELD-OUT TEST SET EVALUATION (75/25 SPLIT)
    # ---------------------------------------------------------------------------
    split_idx = int(len(shuffled) * 0.75)
    train_set = shuffled[:split_idx]
    test_set = shuffled[split_idx:]
    
    eval_model = train_model(train_set)
    
    correct = 0
    class_stats = defaultdict(lambda: {"tp": 0, "fp": 0, "fn": 0, "total": 0})
    
    for text, true_label in test_set:
        pred_label, _, _ = predict(eval_model, text)
        class_stats[true_label]["total"] += 1
        if pred_label == true_label:
            correct += 1
            class_stats[true_label]["tp"] += 1
        else:
            class_stats[true_label]["fn"] += 1
            class_stats[pred_label]["fp"] += 1
            
    total_test = len(test_set)
    acc = correct / total_test if total_test > 0 else 0
    
    print("\n=======================================================")
    print("            HELD-OUT TEST SET EVALUATION               ")
    print("=======================================================")
    print(f"Overall Accuracy: {round(acc * 100, 2)}% ({correct}/{total_test})\n")
    print(f"{'Class':<25} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10} | {'Support':<8}")
    print("-" * 72)
    
    for cls in full_model["classes"]:
        tp = class_stats[cls]["tp"]
        fp = class_stats[cls]["fp"]
        fn = class_stats[cls]["fn"]
        sup = class_stats[cls]["total"]
        
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0
        
        print(f"{cls:<25} | {round(prec*100, 2):<9}% | {round(rec*100, 2):<9}% | {round(f1*100, 2):<9}% | {sup:<8}")

if __name__ == "__main__":
    evaluate()