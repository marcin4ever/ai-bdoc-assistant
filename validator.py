import streamlit as st
import requests
from dotenv import load_dotenv
import os
import json
from pathlib import Path

load_dotenv()

# Streamlit secrets, then env variable

key_source = ""


def get_api_key(source: str = ""):
    global key_source

    if source == "react":
        key_source = "➤ React client – using default key"
        return os.getenv("GROQ_API_KEY_REACT") or os.getenv("GROQ_API_KEY")

    # Streamlit secrets block guarded to avoid crashing outside Streamlit
    try:
        if "GROQ_API_KEY" in st.secrets:
            key_source = "➤ Using key from Streamlit secrets"
            return st.secrets["GROQ_API_KEY"]
    except Exception:
        pass  # silently skip if not running in Streamlit

    # OS env fallback
    if os.getenv("GROQ_API_KEY"):
        key_source = "➤ React client – using default key"
        return os.getenv("GROQ_API_KEY")

    # If still not found
    key_source = "❌ GROQ_API_KEY not found in secrets or environment"
    try:
        st.error(key_source)
        st.stop()
    except Exception:
        raise RuntimeError(key_source)


headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {get_api_key()}"
}

# Field label mapping
FIELD_LABELS = {
    "matnr": "Material Number",
    "rstyp": "Reservation Type",
    "diffmg": "Difference Quantity",
    "pick_qty": "Picked Quantity",
    "sernr": "Serial Number",
    "source": "Source Type",
    "lgort": "Storage Location",
    "plnum": "Production Order Number",
    "werks": "Plant"
}


def label_record(record):
    return {
        FIELD_LABELS.get(k, k): v
        for k, v in record.items()
    }


def validate_data(records: list, use_rag: bool = False, source: str = ""):
    extra_rules = None
    if use_rag:
        try:
            extra_rules = Path(
                "rules/validation_rules.md").read_text(encoding="utf-8")
        except Exception as e:
            extra_rules = f"[ERROR: Failed to load rules - {e}]"
    results = []
    for idx, record in enumerate(records):
        labeled = label_record(record)
        if extra_rules:
            prompt = f"""
You are a smart validator of SAP warehouse records.

Use the following additional rules as a reference that you have to take into account:
{extra_rules}

Here is a record:
{json.dumps(labeled, indent=2)}

Your task:
- Identify any inconsistency or invalid value.
- Use logical reasoning to explain if the record is valid or not.
- Do NOT reference rule numbers.
- Give a confidence score from 1 to 10 (decimals allowed, e.g., 8.5) reflecting how confident you are in the record’s validity.

Respond ONLY in **valid JSON**, exactly in this format:
{{
  "record_id": {idx},
  "llm_reasoning": "...",
  "status": "OK" or "Error"
  "score": 8.5
}}
"""
        else:
            prompt = f"""
You are a smart validator of SAP warehouse records.

Here is a record:
{json.dumps(labeled, indent=2)}

Your task:
- Identify any inconsistency or invalid value.
- Use logical reasoning to explain if the record is valid or not.
- Give a confidence score from 1 to 10 (decimals allowed, e.g., 8.5) reflecting how confident you are in the record’s validity.

Respond ONLY in **valid JSON**, exactly in this format:
{{
  "record_id": {idx},
  "llm_reasoning": "...",
  "status": "OK" or "Error"
  "score": 8.5
}}
"""

        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [
                {"role": "system", "content": "You are a helpful SAP validator assistant."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7
        }

        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload
        )

        if response.status_code != 200:
            results.append({
                "record_id": idx,
                "status": f"Error: HTTP {response.status_code}",
                "llm_reasoning": response.text,
                "score": None
            })
            continue

        try:
            llm_output = response.json()["choices"][0]["message"]["content"]
            parsed = json.loads(llm_output)

            status = parsed.get("status", "Error")
            reasoning = parsed.get("llm_reasoning", "No explanation.")
            score = parsed.get("score")

            try:
                score = round(float(score), 1)
            except:
                score = None

            results.append({
                "record_id": idx,
                "status": status,
                "llm_reasoning": reasoning,
                "score": score
            })

        except Exception as e:
            results.append({
                "record_id": idx,
                "status": f"Error: {str(e)}",
                "llm_reasoning": llm_output if 'llm_output' in locals() else None,
                "score": None
            })

    return results, key_source
