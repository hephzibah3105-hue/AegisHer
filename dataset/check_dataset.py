from datasets import load_dataset

dataset = load_dataset("Washii/Cyberbullying-Detection-CB1")

print("\nDATASET LABELS:")
print(dataset["train"].unique("cyberbullying_type"))

print("\nFIRST 10 EXAMPLES:")

for i in range(10):
    print("TEXT:", dataset["train"][i]["tweet_text"])
    print("LABEL:", dataset["train"][i]["cyberbullying_type"])
    print("-" * 50)