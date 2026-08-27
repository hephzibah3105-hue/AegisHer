import pandas as pd
import random

print("Building balanced AegisHer 7-class dataset...")

# ---------------------------------------------------------
# 1. Load existing dataset
# ---------------------------------------------------------

df = pd.read_csv("../processed_dataset.csv")

data = []

# ---------------------------------------------------------
# 2. Keep existing SAFE and GENDER examples
# ---------------------------------------------------------

for _, row in df.iterrows():

    text = str(row["text"]).strip()
    label = str(row["label"]).strip()

    if not text:
        continue

    if label == "not_cyberbullying":
        data.append([text, "SAFE"])

    elif label == "gender":
        data.append([text, "GENDER_BASED_HARASSMENT"])


# ---------------------------------------------------------
# 3. Threat examples
# ---------------------------------------------------------

examples = {

"SEXTORTION_BLACKMAIL": [
    "Send me your nudes or I will leak them.",
    "Give me your private photos or everyone will see them.",
    "Send the intimate pictures now or I will post them online.",
    "I have your private photos and I will expose you.",
    "Pay me money or I will leak your pictures.",
    "Pay me in bitcoin or I will publish your private videos.",
    "I recorded you through your webcam and I will expose you.",
    "I have your intimate videos and I will send them to your friends.",
    "Send me naked pictures or I will share everything.",
    "Give me money or your private photos go online.",
    "I will post your pictures everywhere if you don't pay.",
    "Your private video will be uploaded if you refuse.",
    "I hacked your camera and recorded you.",
    "Pay me or I will send your videos to your family.",
    "I will expose your private content to everyone.",
    "Send the pictures immediately or I will leak them.",
    "I have screenshots of your private photos.",
    "I will ruin you by posting your intimate videos.",
    "Give me your nudes right now.",
    "Pay me or I will publish your private recordings."
],

"VIOLENT_THREAT": [
    "I will kill you.",
    "I am going to murder you.",
    "I will hunt you down.",
    "I will shoot you.",
    "I will stab you.",
    "I will beat you up.",
    "I will seriously harm you.",
    "You deserve to die.",
    "Die bitch.",
    "I will find you and hurt you.",
    "I will hunt you down and kill you.",
    "You better watch your back because I will hurt you.",
    "I am coming for you.",
    "I will destroy you physically.",
    "I will choke you.",
    "I will make you pay with your life.",
    "You are going to regret this when I find you.",
    "I will attack you.",
    "I will hurt you badly.",
    "I am going to find you and beat you."
],

"CYBERSTALKING_DOXXING": [
    "I know where you live.",
    "I know where you work.",
    "I know where you study.",
    "I know where you sleep.",
    "I am watching your every move.",
    "I am watching your house.",
    "I am stalking you.",
    "I know your real-time location.",
    "I am tracking your GPS.",
    "I am monitoring your phone.",
    "I have your home address.",
    "I have your phone number.",
    "I know your real identity.",
    "I found your address online.",
    "I am tracking your device.",
    "I know where you commute every day.",
    "I am outside your house watching you.",
    "I have your location.",
    "I know exactly where you are.",
    "I have your personal information."
],

"COERCION_MANIPULATION": [
    "Do what I say or face the consequences.",
    "Do as you are told.",
    "Do what I want or else.",
    "No one will believe you if you tell anyone.",
    "If you tell anyone I will hurt you.",
    "If you speak about this I will ruin you.",
    "You have 24 hours to respond.",
    "You have 24 hours to comply.",
    "You have until tonight to send it.",
    "You better do what I say.",
    "If you refuse you will regret it.",
    "Don't tell anyone about this.",
    "Nobody will believe you.",
    "You have one hour to comply.",
    "Do exactly what I tell you.",
    "If you disobey there will be consequences.",
    "You have until tonight to reply.",
    "Keep this secret or else.",
    "You must obey me.",
    "If you tell anyone I will expose you."
],

"PHISHING_FRAUD": [
    "Send me your OTP immediately.",
    "Give me your verification code now.",
    "Share your OTP to unlock your account.",
    "Send your 2FA code immediately.",
    "Provide your one-time password now.",
    "Your account has been suspended. Click here to verify now.",
    "Your account will be terminated. Verify your identity.",
    "Your account is blocked. Click here to unlock it.",
    "Enter your netbanking password to prevent account closure.",
    "Enter your credit card PIN to claim your reward.",
    "Send your password to confirm your identity.",
    "Provide your security PIN immediately.",
    "Click here and enter your banking details.",
    "Verify your account now or it will be closed.",
    "Your bank account has been suspended. Verify now.",
    "Share the OTP to complete the transaction.",
    "Give me the code you received on your phone.",
    "Enter your password to prevent closure.",
    "Send your verification code to unlock your account.",
    "Click here to confirm your identity."
],

"GENDER_BASED_HARASSMENT": [
    "You are a disgusting slut.",
    "You are such a whore.",
    "Women like you are worthless.",
    "You deserve to be treated badly because you are a woman.",
    "You are an ugly bitch.",
    "Girls like you should stay silent.",
    "You are nothing but a slut.",
    "Women should know their place.",
    "You are disgusting.",
    "Nobody wants a woman like you.",
    "You are a worthless girl.",
    "You are an embarrassing woman.",
    "Girls like you deserve no respect.",
    "You are just a pathetic bitch.",
    "Women like you are useless.",
    "You are disgusting and worthless.",
    "You should be ashamed of being a woman.",
    "You are an ugly whore.",
    "Nobody respects women like you.",
    "You are a pathetic girl."
],

}

# ---------------------------------------------------------
# 4. Add threat examples with variations
# ---------------------------------------------------------

prefixes = [
    "",
    "Listen, ",
    "Hey, ",
    "Warning: ",
    "I am serious. ",
    "You need to understand. ",
    "This is a warning. ",
    "Please understand: ",
    "I'm telling you, ",
    "Right now, "
]

suffixes = [
    "",
    " Do it now.",
    " You better comply.",
    " Don't ignore me.",
    " I am serious.",
    " Act immediately.",
    " You have no choice.",
    " Think carefully.",
    " Don't tell anyone.",
    " This is your final warning."
]

for label, texts in examples.items():

    for text in texts:

        # Original
        data.append([text, label])

        # Lowercase
        data.append([text.lower(), label])

        # Variations
        for i in range(15):
            prefix = random.choice(prefixes)
            suffix = random.choice(suffixes)

            variation = prefix + text + suffix

            data.append([variation, label])


# ---------------------------------------------------------
# 5. Create dataframe
# ---------------------------------------------------------

new_df = pd.DataFrame(
    data,
    columns=["text", "aegisher_label"]
)

new_df = new_df.drop_duplicates()


# ---------------------------------------------------------
# 6. BALANCE ALL 7 CLASSES
# ---------------------------------------------------------

TARGET = 1000

balanced_data = []

for label in new_df["aegisher_label"].unique():

    class_df = new_df[
        new_df["aegisher_label"] == label
    ]

    print(
        "Before balancing:",
        label,
        len(class_df)
    )

    # If more than TARGET -> reduce
    if len(class_df) > TARGET:

        class_df = class_df.sample(
            n=TARGET,
            random_state=42
        )

    # If less than TARGET -> sample with replacement
    else:

        class_df = class_df.sample(
            n=TARGET,
            replace=True,
            random_state=42
        )

    balanced_data.append(class_df)


# Combine
new_df = pd.concat(
    balanced_data,
    ignore_index=True
)


# ---------------------------------------------------------
# 7. Shuffle
# ---------------------------------------------------------

new_df = new_df.sample(
    frac=1,
    random_state=42
).reset_index(drop=True)


# ---------------------------------------------------------
# 8. Show distribution
# ---------------------------------------------------------

print("\n==============================")
print("AEGISher 7-CLASS DATASET")
print("==============================")

print("\nTotal samples:", len(new_df))

print("\nClass distribution:")
print(
    new_df["aegisher_label"].value_counts()
)


# ---------------------------------------------------------
# 9. Save
# ---------------------------------------------------------

new_df.to_csv(
    "../aegisher_7class_dataset.csv",
    index=False
)

print("\nDataset created successfully!")
print("File: ../aegisher_7class_dataset.csv")