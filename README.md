# Signal Horizon

AI-powered MPLADS risk intelligence platform for anomaly and inefficiency detection with explainable risk scoring and human-in-the-loop review.

## Stack
- React + Vite + TypeScript
- FastAPI + Uvicorn
- PyMuPDF, pandas, scikit-learn
- Publicly accessible MPLADS / eSAKSHI source data included for the prototype

## One-service deployment
The included `Dockerfile` builds the React frontend and serves it from the FastAPI application, so the deployed prototype uses a single public URL.

## Local run
Build the frontend, then run the backend from the `backend` directory. The production Docker image handles both automatically.
