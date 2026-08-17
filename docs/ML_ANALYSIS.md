# ML Analysis: Predicting CodeAid Feature Selection from Student Queries

## Overview
This document details the machine learning NLP experiment conducted on the official CodeAid dataset (`majeedkazemi/students-coding-questions-from-ai-assistant`).

## Methodology Correction
In a prior iteration of this experiment, the dataset loading script incorrectly fell back to using `user_id` as the primary text feature to predict `feature_type`. This was a severe methodological flaw:
- `user_id` is merely a student identifier. It contains zero semantic information about the content or intent of the query. Any predictive power it had was pure data leakage (e.g., if a specific student happened to use "General Question" frequently, the model learned to associate the ID with the label, rather than learning the language patterns of general questions).
- The corrected pipeline uses `input_question`, which represents the actual natural language query typed by the student. This is a meaningful NLP feature because the vocabulary, phrasing, and structure of the question strongly correlate with the type of assistance the student is seeking.

## Experiment Goal
The goal of this experiment is to predict the `feature_type` (the specific CodeAid UI feature the student selected, such as "General Question" or "Help Fix Code") based solely on the text of their `input_question`.

> [!NOTE]
> **Important Distinction:** This experiment predicts the *user-selected UI feature*, which is explicitly present in the dataset. It does **not** reproduce the paper's deep thematic analysis (which involved researchers manually coding interactions into complex pedagogical categories), as those manual thematic labels are not provided as ground-truth columns in this public dataset.

## Pipeline Architecture
1. **Data Loading:** Fetched from HuggingFace.
2. **Filtering:** Kept only rows with valid `input_question` and `feature_type`. Dropped NAs.
3. **Text Cleaning:** Converted text to lowercase, removed punctuation, and stripped whitespace.
4. **Data Splitting:** Applied a **stratified** 80/20 train/test split. Stratification is crucial here because the classes are imbalanced (e.g., "General Question" is much more common than "Help Fix Code").
5. **Vectorization:** TF-IDF Vectorizer (max 5000 features, English stop words removed). 
   - *Data Leakage Prevention:* The TF-IDF vectorizer was `fit` **only** on the training set, and then used to `transform` both the train and test sets.
6. **Modeling:** Trained Logistic Regression, Multinomial Naive Bayes, and Linear SVM.

## Dataset Statistics
- **Total valid samples after cleaning:** 4,760
- **Number of classes:** 3
- **Class Distribution:**
  - General Question: 2,544
  - Question from Code: 1,954
  - Help Fix Code: 262
- **Train size:** 3,808
- **Test size:** 952

## Results

The corrected NLP pipeline using `input_question` yields significantly better and conceptually valid results compared to the flawed `user_id` experiment (which scored ~60%). 

| Model | Accuracy | Macro Precision | Macro Recall | Macro F1 | Weighted F1 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Logistic Regression** | 80.46% | 79.86% | 60.02% | 62.19% | 78.96% |
| **Naive Bayes** | 80.88% | 87.88% | 57.94% | 58.58% | 78.84% |
| **Linear SVM** | **82.45%** | **80.78%** | **71.32%** | **74.70%** | **82.11%** |

### Analysis of Results
- **Linear SVM** performed the best overall, achieving ~82.5% accuracy and the highest Macro F1 score (~74.7%). SVMs are notoriously effective for high-dimensional sparse data like TF-IDF vectors.
- The **Macro Recall** for Logistic Regression and Naive Bayes is notably lower than their accuracy. This indicates they struggled with the minority class ("Help Fix Code", which only has 262 samples). Linear SVM handled the class imbalance much better.
- **Conclusion:** These results prove that the natural language in a student's question is highly predictive of the type of coding assistance they require. Linear SVM should be the model highlighted in the final university report.
