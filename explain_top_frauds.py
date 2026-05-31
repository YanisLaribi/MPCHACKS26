import sys
import os
import pandas as pd
import numpy as np
import warnings

# Suppress deprecation and user warnings
warnings.filterwarnings('ignore')

# Add backend directory to sys.path to allow imports from app
backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
if backend_path not in sys.path:
    sys.path.append(backend_path)

import google.generativeai as genai
from app.services import ml_pipeline

# 1. Configure the Gemini API client
api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
    print("Gemini API configured using environment key.")
else:
    # Default fallback placeholder
    print("WARNING: Neither GEMINI_API_KEY nor GOOGLE_API_KEY environment variable was found.")
    genai.configure(api_key="YOUR_GEMINI_API_KEY")

def explain_fraud_case(row_idx, shap_vals, df, X_scaled_df, model_features, top_n=5):
    # get top N features driving this prediction
    feat_importance = sorted(
        zip(model_features, shap_vals[row_idx]),
        key=lambda x: abs(x[1]),
        reverse=True
    )[:top_n]
    
    # get actual feature values for this row
    row_data = df.iloc[row_idx]
    
    # build context for LLM
    feature_context = "\n".join([
        f"- {feat}: value={X_scaled_df.iloc[row_idx][feat]:.2f}, "
        f"SHAP contribution={contrib:+.4f} ({'increases' if contrib > 0 else 'decreases'} fraud score)"
        for feat, contrib in feat_importance
    ])
    
    prompt = f"""
A transaction has been flagged as high-confidence fraud by 4 independent anomaly detection models. Here are the top features driving this decision:

{feature_context}

Transaction details:

Amount: {row_data.get('amount', 'N/A')}
Hour of day: {row_data.get('hour_of_day', 'N/A')}
Confidence level: {row_data.get('fraud_confidence', 'N/A')}
Anomaly score: {row_data.get('anomaly_score', 'N/A'):.1f}/1000

In 2-3 sentences, explain why this transaction is suspicious in plain English for a fraud analyst. Be specific about which signals are most concerning.
"""
    
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"Error calling Gemini API: {e}"

def main():
    # Load transactions database
    db_path = 'transactions.csv'
    if not os.path.exists(db_path):
        db_path = os.path.join('backend', 'transactions.csv')
        
    if not os.path.exists(db_path):
        print(f"Error: Transaction database not found at '{db_path}'")
        return
        
    print("Loading database and running ML pipeline...")
    df_orig = pd.read_csv(db_path)
    
    # Run full pipeline to calculate features, scaler and models
    df_scored = ml_pipeline.run_full_pipeline(df_orig)
    
    # Prepare scaled feature matrix for SHAP explanation
    model_features = ml_pipeline.FEATURES_USED
    X = df_scored[model_features].copy()
    for col in X.select_dtypes(include=['bool']).columns:
        X[col] = X[col].astype(int)
    X = X.fillna(X.median())
    
    X_scaled = ml_pipeline.SCALER.transform(X)
    X_scaled_df = pd.DataFrame(X_scaled, columns=model_features, index=df_scored.index)
    
    # Calculate SHAP values using the globally fitted TreeExplainer
    shap_values = ml_pipeline.EXPLAINER.shap_values(X_scaled)
    if isinstance(shap_values, list):
        shap_values = shap_values[1]
        
    # Get top 5 highest confidence cases
    # We map 'high' from user request to 'high confidence' from the pipeline mapping
    top_5_idx = (
        df_scored[df_scored['fraud_confidence'] == 'high confidence']
        .sort_values('anomaly_score', ascending=False)
        .head(5)
        .index
    )
    
    print(f"\nFound {len(top_5_idx)} high-confidence fraud cases. Explaining top 5 using gemini-2.5-flash:")
    print("=" * 60)
    
    for idx in top_5_idx:
        print(f"\nTransaction {df_scored.loc[idx, 'transaction_id']} (score: {df_scored.loc[idx, 'anomaly_score']:.1f})")
        explanation = explain_fraud_case(idx, shap_values, df_scored, X_scaled_df, model_features)
        print(explanation)
        print("-" * 60)

if __name__ == "__main__":
    main()
