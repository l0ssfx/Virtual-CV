# Telco Customer Churn Prediction: End-to-End MLOps Pipeline with Bayesian Optimization & Cloud Serving

## Overview
- **Project Domain**: Subscription Economics & Telecommunications Retention Engineering
- **Engineering Role**: Lead MLOps & Machine Learning Engineer (Author: Renaldo Arapi · `l0ssfx`)
- **Open-Source Repository**: [https://github.com/l0ssfx/Telco-Costumer-Churn-ML](https://github.com/l0ssfx/Telco-Costumer-Churn-ML)
- **Live Deployment**: AWS ECS Fargate serverless container behind Application Load Balancer (ALB)
- **Core Technology Stack**: Python 3.11, XGBoost 2.0+, Optuna, Great Expectations 0.18+, MLflow 2.14+, FastAPI 0.115+, Gradio 4.44+, Docker, AWS ECS Fargate, AWS ALB, GitHub Actions CI/CD

## Mission & Problem Statement
Customer attrition in subscription-based recurring services poses a structural risk to enterprise profitability. In telecom subscription economics, customer acquisition costs ($\text{CAC}$) typically exceed retention intervention costs ($\text{CRC}$) by a factor of 5 to 20 ($\text{CAC} \gg \text{CRC}$). 

A False Negative (failing to detect an impending churner, losing Customer Lifetime Value) is economically far more damaging than a False Positive (offering a minor retention discount to an already loyal subscriber). Under the Neyman-Pearson criterion, the operational machine learning objective is to **maximize statistical Recall on the minority churn class**, constrained to an economically viable lower bound on Precision.

## Architecture & System Design
The system establishes a robust, auditable production MLOps pipeline bridging exploratory statistical modeling and scalable cloud deployment:

```
                            END-TO-END MLOPS LIFECYCLE
                            
  [ Raw Data (7,043) ] ──► [ Great Expectations ] ──► [ Feature Pipeline & Alignment ]
                                (Data Contracts)          (30-Dim Vector / Zero Skew)
                                                                    │
                                                                    ▼
  [ MLflow Registry ] ◄── [ Optuna Bayesian HPO ] ◄── [ XGBoost + Asymmetric Loss ]
   (Models/Metrics)           (TPE / tau = 0.35)              (scale_pos_weight = 2.76)
                                      │
                                      ▼
                        [ Dual-Serving Container ]
                        ┌─────────────┴─────────────┐
                        ▼                           ▼
                 FastAPI (/predict)            Gradio (/ui)
                        │
                        ▼
             [ GitHub Actions CI/CD ]
                        │
                        ▼
      [ AWS ECS Fargate + Application Load Balancer ]
```

1. **Automated Data Contracts (Great Expectations)**: Automated validation gates (`src/utils/validate_data.py`) assert structural integrity, schema compliance, unique identity constraints, range bounds on numerical features (e.g. `tenure` between 0-120, `MonthlyCharges` between 0-200), and logical consistency pairs (`TotalCharges >= MonthlyCharges`). Ingestion is aborted automatically on contract breach.
2. **Deterministic Feature Engineering & Skew Prevention**: Eliminates train-serving skew by sharing identical transformation components between batch training (`build_features`) and single-row real-time inference (`_serve_transformation`):
   - Deterministic binary encoding on cardinality $k = 2$ attributes (`gender`, `Partner`, `Dependents`, `PhoneService`, `PaperlessBilling`) using fixed dictionary mappings.
   - One-hot encoding with `drop_first=True` on $k > 2$ attributes to eliminate the dummy variable trap.
   - Dynamic schema alignment enforcing `df.reindex(columns=FEATURE_COLS, fill_value=0)` using serialized `feature_columns.txt`, generating exact 30-dimensional feature representations.
3. **Class Imbalance Loss Reweighting**: The empirical distribution shows 5,174 retained customers (73.4%) and 1,869 churners (26.6%). Without synthetic sampling distortions (like SMOTE which can distort continuous manifold boundaries), the objective function applies a scale factor to positive gradient updates:
   $$w_{\text{pos}} = \frac{N_{\text{negative}}}{N_{\text{positive}}} = \frac{5,174}{1,869} \approx 2.76$$
4. **Bayesian Hyperparameter Optimization (Optuna)**: 30 trials using Tree-structured Parzen Estimators (TPE) tuning 9 tree parameters (`n_estimators`, `learning_rate`, `max_depth`, `subsample`, `colsample_bytree`, `min_child_weight`, `gamma`, `reg_alpha`, `reg_lambda`) combined with decision threshold calibration ($\tau = 0.35$).
5. **Experiment Lineage & Governance (MLflow)**: Full parameter, metric, and artifact tracking (`preprocessing.pkl`, `feature_columns.txt`, serialized booster bundle).
6. **Dual-Serving Pattern (FastAPI + Gradio)**: Encapsulated in `src/app/main.py`:
   - Programmatic REST API (`POST /predict`) with strict Pydantic v2 `CustomerData` schema.
   - Interactive Graphical Workspace (`GET /ui`) with feature sliders, dropdowns, and instant churn probability output.
7. **Production Containerization & CI/CD**: Debian `python:3.11-slim` Docker image with layer caching optimization and automated GitHub Actions delivery publishing to Docker Hub (`l0ssfx/telco-churn:latest`).
8. **Serverless Cloud Deployment (AWS ECS Fargate)**: Deployed in AWS Region `us-east-1` behind an Application Load Balancer (`alb-telco-churn`) routing port 80 to ECS Fargate tasks (0.5 vCPU, 1 GB RAM).

## Key Engineering Challenges & Solutions

- **Challenge**: Multicollinearity across service indicators and financial charges (VIF up to 10.82 on `TotalCharges` and 8.74 on `MonthlyCharges`).
  - *Solution*: Selected Tree-Based Gradient Boosting (XGBoost). Tree split criteria greedily evaluate impurity reduction $\mathcal{L}_{\text{split}}$ independently without inverting a feature covariance matrix $(X^T X)^{-1}$, preserving interaction terms without linear degradation.
- **Challenge**: Critical operational cost of False Negatives (missed churners).
  - *Solution*: Optimized decision boundary threshold to $\tau = 0.35$ and loss weighting $w_{\text{pos}} = 2.76$, constraining False Negatives to just 26 across 1,409 holdout test cases while capturing 348 actual churners.
- **Challenge**: Train-Serving Skew during online API inference.
  - *Solution*: Designed fixed dictionary maps and an automated schema alignment matrix (`reindex(columns=FEATURE_COLS, fill_value=0)`), guaranteeing exact 30-dimensional tensor compatibility between Pandas batch pipelines and single-row JSON payloads.
- **Challenge**: Cloud hosting costs during idle development cycles.
  - *Solution*: Engineered a serverless operational lifecycle: scaling desired tasks to 0 via AWS CLI (`--desired-count 0`) for $0.00 compute expense, and scaling up to 1 task on demand within seconds.

## Empirical Benchmark & Holdout Evaluation

Evaluated on an 80/20 stratified holdout test split ($N = 1,409$):

| Estimator | Training Time (s) | Inference Latency | Recall (Minority Class 1) | Precision (Class 1) | F1-Score |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **RandomForestClassifier** | 1.82s | 45.0 ms | 0.812 | 0.510 | 0.626 |
| **LGBMClassifier** | 0.93s | 22.6 ms | 0.818 | 0.498 | 0.619 |
| **XGBClassifier (Default)** | 3.40s | 22.1 ms | 0.821 | 0.487 | 0.611 |
| **XGBoost (Optuna Tuned + $\tau = 0.35$)** | **0.37s** | **5.9 ms** | **0.930 (93.0%)** | **0.433** | **0.591** |

### Confusion Matrix Analysis (Holdout $N = 1,409$)
```
                      Predicted: Retained (0)    Predicted: Churn (1)
Actual: Retained (0)            579                        456 (FP)
Actual: Churn (1)                26 (FN)                   348 (TP)
```
- **Sensitivity / Recall ($93.0\%$):** 348 out of 374 actual at-risk churners detected.
- **Critical Error Minimization:** Only 26 missed churn events out of 1,409 customers.
- **Serving Throughput:** 5.9ms per inference request on standard vCPU.

## Verifiable Impact & Metrics
- **Minority Class Recall**: **93.0%** verified on unobserved holdout test population.
- **Inference Latency**: **5.9 ms** per prediction request.
- **Data Quality Guarantee**: 100% automated contract pass rate across Great Expectations assertions.
- **Cloud Operational State**: Serverless AWS ECS Fargate task with 0-to-1 dynamic elasticity.
