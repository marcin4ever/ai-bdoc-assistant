import streamlit as st
import requests
from dotenv import load_dotenv
import os
import json
import re
from pathlib import Path
from typing import Dict, Any

load_dotenv()

# -------------------------------------------------------------------
# Key handling (unchanged behavior, but we can pass "source" per call)
# -------------------------------------------------------------------
key_source = ""


def get_api_key(source: str = ""):
    """
    Determines which API key to use and sets a human-readable key_source string.
    """
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


# -------------------------------------------------------------------
# Labels / helpers
# -------------------------------------------------------------------
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

ALLOWED_RESULTS = {"Reprocess", "Delete", "Fix", "Escalate", "Undefined"}


def label_record(record: Dict[str, Any]) -> Dict[str, Any]:
    return {FIELD_LABELS.get(k, k): v for k, v in record.items()}


def _coerce_result(value: str) -> str:
    """
    Normalize whatever the model returns to one of ALLOWED_RESULTS.
    """
    if not value:
        return "Undefined"
    v = value.strip().lower()
    mapping = {
        "reprocess": "Reprocess",
        "re-process": "Reprocess",
        "retry": "Reprocess",
        "delete": "Delete",
        "fix": "Fix",
        "escalate": "Escalate",
        "undefined": "Undefined",
        "unknown": "Undefined",
        "ok": "Undefined",   # legacy: OK ≈ nothing to do
        "nok": "Fix",        # legacy: NOK ≈ needs fixing
        "error": "Undefined"
    }
    if v in (s.lower() for s in ALLOWED_RESULTS):
        return value.capitalize()
    return mapping.get(v, "Undefined")


def _build_prompt(idx: int, labeled_record: Dict[str, Any], extra_rules: str | None) -> str:
    base_rules = """
You are an SAP Middleware Assistant validating BDOC-like warehouse records.

Choose EXACTLY ONE result for the record from:
- "Reprocess"  (temporary/retryable condition, e.g., lock, timeout, transient connectivity)
- "Delete"     (duplicate/obsolete/unwanted)
- "Fix"        (data quality or mapping issue that must be corrected)
- "Escalate"   (blocking issue requiring senior/operator attention)
- "Undefined"  (insufficient information)

Respond ONLY in valid minified JSON with exactly:
{"record_id": IDX, "llm_reasoning": "...", "result": "Reprocess|Delete|Fix|Escalate|Undefined"}
""".strip()

    rules_block = ""
    if extra_rules:
        rules_block = f"\nAdditional reference rules to consider:\n{extra_rules}\n"

    return f"""
{base_rules}
{rules_block}

Record (human-labeled fields):
{json.dumps(labeled_record, ensure_ascii=False, indent=2)}

Return strictly this JSON (one line, no extra text):
{{"record_id": {idx}, "llm_reasoning": "...", "result": "<one of the five>"}}
""".strip()


def _extract_json_block(text: str) -> dict:
    """
    Robustly extract JSON from an LLM reply.
    """
    try:
        return json.loads(text)
    except Exception:
        m = re.search(r"\{.*\}", text, re.DOTALL)
        if m:
            return json.loads(m.group(0))
        return {}


# -------------------------------------------------------------------
# Main entry used by FastAPI
# -------------------------------------------------------------------
def validate_data(records: list, use_rag: bool = False, source: str = ""):
    """
    Returns: (results, key_source)
    results is a list of dicts like:
      {
        "record_id": <int>,
        "result": "Reprocess|Delete|Fix|Escalate|Undefined",
        "llm_reasoning": "<string>"
      }
    """
    # Pick key dynamically per call so "source" affects key_source label
    token = get_api_key(source=source)
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}",
    }

    extra_rules = None
    if use_rag:
        try:
            extra_rules = Path("rules/validation_rules.md").read_text(encoding="utf-8")
        except Exception as e:
            extra_rules = f"[ERROR: Failed to load rules - {e}]"

    results = []
    for idx, record in enumerate(records):
        labeled = label_record(record)
        prompt = _build_prompt(idx, labeled, extra_rules)

        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [
                {"role": "system", "content": "You are a helpful SAP validator assistant."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7
        }

        try:
            response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=60
            )
        except Exception as req_err:
            results.append({
                "record_id": idx,
                "result": "Undefined",
                "llm_reasoning": f"HTTP request error: {req_err}"
            })
            continue

        if response.status_code != 200:
            results.append({
                "record_id": idx,
                "result": "Undefined",
                "llm_reasoning": f"Error: HTTP {response.status_code} – {response.text}"
            })
            continue

        try:
            llm_output = response.json()["choices"][0]["message"]["content"].strip()
        except Exception as e:
            results.append({
                "record_id": idx,
                "result": "Undefined",
                "llm_reasoning": f"Invalid LLM response structure: {e}"
            })
            continue

        try:
            parsed = _extract_json_block(llm_output)
            result = _coerce_result(parsed.get("result", "Undefined"))
            reasoning = parsed.get("llm_reasoning", "").strip() or "No explanation provided."

            results.append({
                "record_id": idx,
                "result": result,
                "llm_reasoning": reasoning
            })

        except Exception as e:
            results.append({
                "record_id": idx,
                "result": "Undefined",
                "llm_reasoning": f"Parsing error: {e}. Raw: {llm_output}"
            })

    return results, key_source
