from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any
from validator import validate_data, key_source
from typing import Optional

app = FastAPI()

# Allow requests from React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://ai-smart-validator.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Input model for POST request


class RecordInput(BaseModel):
    records: Any
    use_rag: bool
    source: Optional[str] = "unknown"


@app.post("/validate")
async def validate(input: RecordInput):
    results, ks = validate_data(
        records=input.records,
        use_rag=input.use_rag,
        source=input.source)
    return {
        "results": results,
        "key_source": ks
    }
