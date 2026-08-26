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
    ("Are you coming to class tomorrow?", "SAFE"),
    ("Can you send me the assignment when you get a chance?", "SAFE"),
    ("I will call you after the meeting.", "SAFE"),
    ("Did you finish the project?", "SAFE"),
    ("Let's meet at the library at 4 PM.", "SAFE"),
    ("Can you remind me about the presentation?", "SAFE"),
    ("Thanks for helping me with the project.", "SAFE"),
    ("I'll send you the notes tonight.", "SAFE"),
    ("What time does the workshop start?", "SAFE"),
    ("Can you check my code?", "SAFE"),
    ("Good luck for your exam tomorrow!", "SAFE"),
    ("Are we still going for coffee this evening?", "SAFE"),
    ("Please share the document with the team.", "SAFE"),
    ("I enjoyed talking to you today.", "SAFE"),
    ("Can you help me understand this question?", "SAFE"),
    
    # Category 1: SEXTORTION & BLACKMAIL
    ("Send me your private photos or I will expose you online", "SEXTORTION_BLACKMAIL"),
    ("I have recorded your webcam, send money or I leak the video", "SEXTORTION_BLACKMAIL"),
    ("Give me your nudes or I will share your messages with everyone", "SEXTORTION_BLACKMAIL"),
    ("Pay 500 dollars in bitcoin or your intimate pictures will be posted", "SEXTORTION_BLACKMAIL"),
    ("I will ruin your life and send these screenshots to your family", "SEXTORTION_BLACKMAIL"),
    ("Upload your nudes right now or face the consequences", "SEXTORTION_BLACKMAIL"),
    ("I hacked your camera and captured your private moments", "SEXTORTION_BLACKMAIL"),
    ("Send me your private photos or I will expose you online.", "SEXTORTION_BLACKMAIL"),
    ("I have recorded your webcam, send money or I will leak the video.", "SEXTORTION_BLACKMAIL"),
    ("Give me your nudes or I will share your messages with everyone.", "SEXTORTION_BLACKMAIL"),
    ("Pay 500 dollars in bitcoin or your intimate pictures will be posted.", "SEXTORTION_BLACKMAIL"),
    ("I will ruin your life and send these screenshots to your family.", "SEXTORTION_BLACKMAIL"),
    ("Upload your nudes right now or face the consequences.", "SEXTORTION_BLACKMAIL"),
    ("I hacked your camera and captured your private moments.", "SEXTORTION_BLACKMAIL"),
    ("Send explicit photos or I will expose you to your college and workplace.", "SEXTORTION_BLACKMAIL"),
    ("Give me another private picture or everyone will see the ones I have.", "SEXTORTION_BLACKMAIL"),
    ("Pay me today or I am uploading your private videos.", "SEXTORTION_BLACKMAIL"),
    ("I saved your intimate pictures and I can send them to your friends.", "SEXTORTION_BLACKMAIL"),
    ("Send me money or I will post your private photos publicly.", "SEXTORTION_BLACKMAIL"),
    ("You have until tonight to pay me or your pictures go online.", "SEXTORTION_BLACKMAIL"),
    ("I will forward your private video to your family if you don't pay.", "SEXTORTION_BLACKMAIL"),
    ("Send another intimate picture or I will leak everything.", "SEXTORTION_BLACKMAIL"),
    ("Your private photos are in my possession and I will expose you.", "SEXTORTION_BLACKMAIL"),
    ("Pay the money and I will delete the private recordings.", "SEXTORTION_BLACKMAIL"),
    ("I know you don't want your private pictures shared, so pay me now.", "SEXTORTION_BLACKMAIL"),
    ("I will publish your personal photos unless you do what I say.", "SEXTORTION_BLACKMAIL"),
    ("Transfer the money now or your private content will be released.", "SEXTORTION_BLACKMAIL"),
    ("Send explicit photos or I will expose you to your college and workplace", "SEXTORTION_BLACKMAIL"),
    
    # Category 2: CYBERSTALKING & VIOLENCE
    ("I know where you live and I am watching your house", "CYBERSTALKING_VIOLENCE"),
    ("I will track your location and hunt you down", "CYBERSTALKING_VIOLENCE"),
    ("Watch your back when you walk home tonight", "CYBERSTALKING_VIOLENCE"),
    ("I am going to find you and kill you", "CYBERSTALKING_VIOLENCE"),
    ("Posting your real address and phone number online right now", "CYBERSTALKING_VIOLENCE"),
    ("I have been following your every step outside your window", "CYBERSTALKING_VIOLENCE"),
    ("I know where you live and I am watching your house.", "CYBERSTALKING_VIOLENCE"),
    ("I will track your location and hunt you down.", "CYBERSTALKING_VIOLENCE"),
    ("Watch your back when you walk home tonight.", "CYBERSTALKING_VIOLENCE"),
    ("I am going to find you and kill you.", "CYBERSTALKING_VIOLENCE"),
    ("Posting your real address and phone number online right now.", "CYBERSTALKING_VIOLENCE"),
    ("I have been following your every step outside your window.", "CYBERSTALKING_VIOLENCE"),
    ("I know which route you take home every day.", "CYBERSTALKING_VIOLENCE"),
    ("I have been watching your house from across the street.", "CYBERSTALKING_VIOLENCE"),
    ("I know where you work and what time you leave.", "CYBERSTALKING_VIOLENCE"),
    ("I am tracking your phone and I know your location.", "CYBERSTALKING_VIOLENCE"),
    ("I will find you wherever you go.", "CYBERSTALKING_VIOLENCE"),
    ("You cannot hide from me because I know where you stay.", "CYBERSTALKING_VIOLENCE"),
    ("I have your home address and I am coming there.", "CYBERSTALKING_VIOLENCE"),
    ("I have been following you for weeks.", "CYBERSTALKING_VIOLENCE"),
    ("I know your daily routine and where you go after class.", "CYBERSTALKING_VIOLENCE"),
    ("I will come after you if you ignore me.", "CYBERSTALKING_VIOLENCE"),
    ("I know exactly where you are right now.", "CYBERSTALKING_VIOLENCE"),
    ("I have your location and you should be scared.", "CYBERSTALKING_VIOLENCE"),
    ("I am watching your movements every day.", "CYBERSTALKING_VIOLENCE"),
    ("I know your address, your workplace, and your routine.", "CYBERSTALKING_VIOLENCE"),
    
    # Category 3: GENDER-BASED HARASSMENT & ABUSE
    ("You are a disgusting slut and deserve to be attacked", "GENDER_HARASSMENT"),
    ("Nobody cares about you, go end your life bitch", "GENDER_HARASSMENT"),
    ("I will assault and violate you if I catch you alone", "GENDER_HARASSMENT"),
    ("Worthless whore should know her place", "GENDER_HARASSMENT"),
    ("You are a disgusting slut and deserve to be attacked.", "GENDER_HARASSMENT"),
    ("Nobody cares about you, go end your life bitch.", "GENDER_HARASSMENT"),
    ("I will assault and violate you if I catch you alone.", "GENDER_HARASSMENT"),
    ("Worthless whore should know her place.", "GENDER_HARASSMENT"),
    ("You are nothing but a pathetic bitch.", "GENDER_HARASSMENT"),
    ("Women like you deserve to be treated badly.", "GENDER_HARASSMENT"),
    ("Shut up and know your place.", "GENDER_HARASSMENT"),
    ("You are disgusting and nobody wants you.", "GENDER_HARASSMENT"),
    ("You are an ugly worthless woman.", "GENDER_HARASSMENT"),
    ("Nobody will ever respect someone like you.", "GENDER_HARASSMENT"),
    ("You are a pathetic excuse for a woman.", "GENDER_HARASSMENT"),
    ("You should be ashamed of yourself.", "GENDER_HARASSMENT"),
    ("Women like you should stay silent.", "GENDER_HARASSMENT"),
    ("You are completely worthless and disgusting.", "GENDER_HARASSMENT"),
    ("I hate women like you.", "GENDER_HARASSMENT"),
    ("You deserve everything bad that happens to you.", "GENDER_HARASSMENT"),
    ("You are nothing but a useless girl.", "GENDER_HARASSMENT"),
    ("Nobody wants a woman like you around.", "GENDER_HARASSMENT"),
    ("You should never speak again.", "GENDER_HARASSMENT"),
    ("You are disgusting and deserve to suffer.", "GENDER_HARASSMENT")

    
    # Category 4: PHISHING & FINANCIAL COERCION
    ("Your bank account is suspended, share your OTP immediately to verify", "PHISHING_COERCION"),
    ("Send me your verification code right now to unlock your account", "PHISHING_COERCION"),
    ("Urgent: Confirm your netbanking credentials or card will be blocked", "PHISHING_COERCION"),
    ("Claim your 1000 prize by logging in with your password here", "PHISHING_COERCION"),
    ("Your bank account is suspended, share your OTP immediately to verify.", "PHISHING_COERCION"),
    ("Send me your verification code right now to unlock your account.", "PHISHING_COERCION"),
    ("Urgent: Confirm your netbanking credentials or card will be blocked.", "PHISHING_COERCION"),
    ("Claim your 1000 prize by logging in with your password here.", "PHISHING_COERCION"),
    ("Your account will be permanently closed unless you verify now.", "PHISHING_COERCION"),
    ("Send your OTP so we can complete your bank verification.", "PHISHING_COERCION"),
    ("Click this link and enter your banking password immediately.", "PHISHING_COERCION"),
    ("Your card has been blocked, verify your PIN to reactivate it.", "PHISHING_COERCION"),
    ("Congratulations, you won a prize. Enter your bank details to claim it.", "PHISHING_COERCION"),
    ("Your payment failed. Confirm your card information using this link.", "PHISHING_COERCION"),
    ("We detected suspicious activity. Send your verification code now.", "PHISHING_COERCION"),
    ("Your account is at risk. Login immediately to prevent suspension.", "PHISHING_COERCION"),
    ("Provide your credit card number to receive your refund.", "PHISHING_COERCION"),
    ("Enter your password and OTP to confirm your identity.", "PHISHING_COERCION"),
    ("Your bank account requires urgent verification.", "PHISHING_COERCION"),
    ("Click here to prevent your account from being blocked.", "PHISHING_COERCION"),
    ("Send your one-time password to complete the transaction.", "PHISHING_COERCION"),
    ("Your refund is waiting. Provide your banking details to receive it.", "PHISHING_COERCION"),
    ("Verify your account credentials immediately or access will be revoked.", "PHISHING_COERCION"),
    ("Enter your netbanking password to claim your reward.", "PHISHING_COERCION")
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
            "SEXTORTION_BLACKMAIL": 96
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