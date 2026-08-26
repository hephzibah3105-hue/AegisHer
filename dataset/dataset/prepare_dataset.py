from datasets import load_dataset
import pandas as pd

print("Loading dataset...")

dataset = load_dataset("Washii/Cyberbullying-Detection-CB1")

df = dataset["train"].to_pandas()

print("Original dataset size:", len(df))

df = df[["tweet_text", "cyberbullying_type"]]

df = df.rename(columns={
    "tweet_text": "text",
    "cyberbullying_type": "label"
})

df = df.dropna()

df.to_csv("dataset/processed_dataset.csv", index=False)

print("Dataset prepared successfully!")
print("Total samples:", len(df))

print("\nCategories:")
print(df["label"].value_counts())

print("\nSaved as dataset/processed_dataset.csv")
