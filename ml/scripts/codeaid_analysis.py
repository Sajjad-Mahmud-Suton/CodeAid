import os
import pandas as pd
import numpy as np
from datasets import load_dataset
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.svm import LinearSVC
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns
import re

# Ensure directories exist
os.makedirs('../data/raw', exist_ok=True)
os.makedirs('../data/processed', exist_ok=True)
os.makedirs('../ml/results', exist_ok=True)

def clean_text(text):
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'[^\w\s]', '', text)
    return text.strip()

def plot_confusion_matrix(cm, classes, title, filename):
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=classes, yticklabels=classes)
    plt.title(title)
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plt.savefig(f'../ml/results/{filename}')
    plt.close()

def main():
    print("Loading official CodeAid dataset from HuggingFace...")
    try:
        dataset = load_dataset("majeedkazemi/students-coding-questions-from-ai-assistant")
        df = pd.DataFrame(dataset['train'])
        df.to_csv('../data/raw/codeaid_dataset.csv', index=False)
        print(f"Dataset loaded. Total rows: {len(df)}")
    except Exception as e:
        print(f"Error loading dataset: {e}")
        return

    # User explicitly requested input_question and feature_type
    if 'input_question' not in df.columns or 'feature_type' not in df.columns:
        print("Required columns 'input_question' and 'feature_type' not found in dataset.")
        print("Available columns:", df.columns.tolist())
        return

    # Data Leakage Prevention & Correct Target
    # Do not use user_id, time, etc.
    df = df[['input_question', 'feature_type']].copy()
    
    # Drop missing values
    initial_len = len(df)
    df.dropna(subset=['input_question', 'feature_type'], inplace=True)
    
    # Text Cleaning
    df['cleaned_question'] = df['input_question'].apply(clean_text)
    
    # Drop empty strings after cleaning
    df = df[df['cleaned_question'] != '']
    print(f"Rows after cleaning and dropping NAs: {len(df)} (from {initial_len})")
    
    # Class Distribution
    plt.figure(figsize=(10, 6))
    sns.countplot(data=df, y='feature_type', order=df['feature_type'].value_counts().index)
    plt.title('Class Distribution (feature_type)')
    plt.xlabel('Count')
    plt.ylabel('Feature Type')
    plt.tight_layout()
    plt.savefig('../ml/results/class_distribution.png')
    plt.close()
    
    X = df['cleaned_question']
    y = df['feature_type']
    classes = sorted(y.unique())

    print(f"Number of samples: {len(df)}")
    print(f"Number of classes: {len(classes)}")
    print("Class distribution:")
    print(y.value_counts())

    # Stratified Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    print(f"Train size: {len(X_train)}, Test size: {len(X_test)}")

    # TF-IDF Vectorization
    print("Fitting TF-IDF on training data...")
    vectorizer = TfidfVectorizer(stop_words='english', max_features=5000)
    # FIT ONLY ON TRAIN to prevent data leakage
    X_train_tfidf = vectorizer.fit_transform(X_train)
    X_test_tfidf = vectorizer.transform(X_test)

    # Models
    models = {
        'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
        'Naive Bayes': MultinomialNB(),
        'Linear SVM': LinearSVC(random_state=42, max_iter=2000)
    }

    results = []

    with open('../ml/results/classification_report.txt', 'w') as f:
        for name, model in models.items():
            print(f"\nTraining {name}...")
            model.fit(X_train_tfidf, y_train)
            preds = model.predict(X_test_tfidf)
            
            acc = accuracy_score(y_test, preds)
            mac_p = precision_score(y_test, preds, average='macro', zero_division=0)
            mac_r = recall_score(y_test, preds, average='macro', zero_division=0)
            mac_f1 = f1_score(y_test, preds, average='macro', zero_division=0)
            wt_f1 = f1_score(y_test, preds, average='weighted', zero_division=0)
            
            results.append({
                'Model': name,
                'Accuracy': acc,
                'Macro Precision': mac_p,
                'Macro Recall': mac_r,
                'Macro F1': mac_f1,
                'Weighted F1': wt_f1
            })
            
            # Write to report
            f.write(f"=== {name} ===\n")
            f.write(classification_report(y_test, preds, zero_division=0))
            f.write("\n\n")
            
            # Confusion Matrix
            cm = confusion_matrix(y_test, preds, labels=classes)
            plot_confusion_matrix(cm, classes, f'Confusion Matrix - {name}', f'cm_{name.replace(" ", "_").lower()}.png')

    # Convert results to DataFrame and plot
    results_df = pd.DataFrame(results)
    print("\nModel Performance Summary:")
    print(results_df.to_string(index=False))
    results_df.to_csv('../ml/results/model_performance.csv', index=False)

    # Performance Comparison Plot
    results_melted = results_df.melt(id_vars='Model', var_name='Metric', value_name='Score')
    plt.figure(figsize=(12, 6))
    sns.barplot(data=results_melted, x='Metric', y='Score', hue='Model')
    plt.title('Model Performance Comparison')
    plt.ylim(0, 1)
    plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
    plt.tight_layout()
    plt.savefig('../ml/results/performance_comparison.png')
    plt.close()

if __name__ == "__main__":
    main()
