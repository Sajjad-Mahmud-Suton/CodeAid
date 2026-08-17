# ML/NLP Analysis

This directory contains the machine learning pipeline used to classify student queries from the official CodeAid dataset.

## Corrected NLP Pipeline
The initial iteration of this pipeline contained a critical data leakage error: it used `user_id` to predict `feature_type`. `user_id` has no semantic meaning.
The current, corrected pipeline uses `input_question`, the actual natural language query submitted by the student, ensuring a valid and realistic NLP experiment.

## How to run
1. Ensure your python virtual environment is activated.
   ```bash
   # Windows
   .\venv\Scripts\activate
   ```
2. Install requirements if you haven't already:
   ```bash
   pip install pandas scikit-learn matplotlib seaborn datasets
   ```
3. Run the analysis script:
   ```bash
   cd scripts
   python codeaid_analysis.py
   ```

## Results Overview
The script will output performance metrics to the terminal and save plots and text reports in `ml/results/`. 
Linear SVM demonstrates the best performance (~82.5% accuracy) on this dataset, outperforming Logistic Regression (~80.5%) and Naive Bayes (~80.9%).

For a detailed explanation of the methodology, please refer to the `docs/ML_ANALYSIS.md` file in the project root.
