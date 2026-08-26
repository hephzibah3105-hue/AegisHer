import pandas as pd

print("Loading prepared dataset...")

df = pd.read_csv("dataset/processed_dataset.csv")

print("Original samples:", len(df))

# Convert the original labels into AegisHer labels
def convert_label(label):

    if label == "not_cyberbullying":
        return "SAFE"

    elif label in ["religion", "age", "gender", "ethnicity"]:
        return "HARASSMENT"

    elif label == "other_cyberbullying":
        return "CYBERBULLYING"

    else:
        return "UNKNOWN"


df["aegisher_label"] = df["label"].apply(convert_label)

# Keep only the columns we need
df = df[["text", "aegisher_label"]]

# Remove unknown entries
df = df[df["aegisher_label"] != "UNKNOWN"]

# Remove empty text
df = df.dropna()
df = df[df["text"].str.strip() != ""]

# Save the new dataset
df.to_csv("dataset/aegisher_dataset.csv", index=False)

print("\nAegisHer dataset created successfully!")
print("Total samples:", len(df))

print("\nAegisHer categories:")
print(df["aegisher_label"].value_counts())

print("\nSaved as:")
print("dataset/aegisher_dataset.csv")