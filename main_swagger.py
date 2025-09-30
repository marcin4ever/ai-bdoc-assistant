from fastapi import FastAPI
from pydantic import BaseModel
from validator import validate_data
import json

app = FastAPI()


@app.get("/")
def read_root():
    return {"message": "AI Smart Validator is alive and active"}


@app.get("/health")
def health_check():
    return {"status": "OK"}


class InputData(BaseModel):
    record_id: int
    value: str


@app.post("/validate")
def validate():
    try:
        with open("./test_data/mock_data_extended_5.json") as f:
            data = json.load(f)
    except FileNotFoundError:
        return {"error": "mock_data_extended_5.json not found."}

    results, ks = validate_data(data, use_rag=False)   
    return {
        "results": results,
        "key_source": ks
    }
