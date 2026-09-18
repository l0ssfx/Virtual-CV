# High-Dimensional Classification & Statistical Inference Engine

## Overview
- **Project Domain**: Statistical Machine Learning & Predictive Modeling (Personal End-to-End Production System)
- **Engineering Role**: Statistical Machine Learning Engineer
- **Core Technology Stack**: Python, Scikit-learn, XGBoost, LightGBM, Polars, SHAP, Optuna, FastAPI, Docker

## Mission & Problem Statement
In real-world classification scenarios (such as customer attrition, default risk, or medical triage), datasets exhibit extreme class imbalance, missingness, and non-linear interactions across high-dimensional feature spaces. The objective was to engineer an end-to-end classification system incorporating rigorous statistical validation, hyperparameter optimization, probability calibration, and explainability.

## Architecture & System Design
The system architecture implements an end-to-end machine learning lifecycle:
1. **Feature Engineering & Vectorized ETL**: Polars columnar engine executing rapid feature transformations, non-linear interaction terms, target encoding with cross-validation smoothing, and missing data imputation.
2. **Model Training & Ensembling**: Gradient Boosted Decision Trees (XGBoost & LightGBM) trained with Bayesian hyperparameter optimization via Optuna over stratified K-fold partitions.
3. **Probability Calibration (Isotonic / Platt Scaling)**: Applied isotonic regression and sigmoid calibration to ensure predicted probabilities match true empirical event frequencies, essential for threshold-based decision making.
4. **Explainability & SHAP Telemetry**: Integrated TreeSHAP algorithms calculating exact Shapley values for global feature importance and local instance-level decision explanations.
5. **Microservice Serving & Monitoring**: Asynchronous FastAPI service delivering low-latency inference endpoints with schema validation via Pydantic v2 and automated Kolmogorov-Smirnov drift monitoring.

## Key Engineering Challenges & Solutions
- **Challenge**: Extreme class imbalance (positive minority class under 3%).
  - *Solution*: Optimized Focal Loss and custom objective functions combined with Stratified Repeated K-Fold cross-validation, prioritizing Precision-Recall AUC (PR-AUC) over misleading accuracy.
- **Challenge**: Overconfident probability estimates from gradient boosted trees.
  - *Solution*: Calibrated posterior probabilities using Isotonic Regression, reducing Brier score from 0.142 to 0.081.
- **Challenge**: Translating "black box" ensemble decisions into interpretable explanations for stakeholders.
  - *Solution*: Auto-generated localized waterfall SHAP plots accompanying each inference payload, highlighting top-5 contributing factors.

## Verifiable Impact & Metrics
- **Predictive Performance**: Achieved 0.896 Holdout ROC-AUC and 0.742 PR-AUC on highly skewed validation distributions.
- **Serving Latency**: 14.8ms average P95 request latency under concurrent load testing.
- **Calibration Quality**: Expected Calibration Error (ECE) minimized below 2.4%, ensuring statistically sound probability estimates.
