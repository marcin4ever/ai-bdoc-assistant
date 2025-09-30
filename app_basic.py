import streamlit as st
import json
from validator import validate_data, key_source
from pathlib import Path

st.set_page_config(page_title="Smart Validator", layout="wide")

st.title("🤖 Smart Validator")
st.markdown(
    "Upload your JSON file to validate records using LLaMA 3 or Mistral 7B.")

uploaded_file = st.file_uploader("📁 Upload JSON File", type="json")

if uploaded_file:
    try:
        records = json.load(uploaded_file)
        if isinstance(records, list):
            st.success(f"Loaded {len(records)} records.")
            st.json(records)

            col1, col2, margin = st.columns([1, 1, 5])
            run_basic = col1.button("Run Validation")
            run_rag = col2.button("Run with RAG WM Rules")

            if run_basic or run_rag:

                if run_basic:
                    with st.spinner("Validating..."):
                        results, key_source = validate_data(
                            records, use_rag=None)
                    st.success("✔️ >>> Validation complete <<< ")
                if run_rag:
                    with st.spinner("Validating with RAG rules..."):
                        results, key_source = validate_data(
                            records, use_rag=True)
                    st.success("✔️ >>> RAG Validation complete <<< ")

                st.info(f"{key_source}")  # which API source was used

                ok_count = sum(1 for r in results if r["status"] == "OK")
                error_count = len(results) - ok_count
                st.markdown(
                    f"Summary:  \n✅ {ok_count} OK  \n❌ {error_count} Errors")
                st.markdown("---")

                for idx, result in enumerate(results, start=1):
                    st.markdown(f"### Item #{idx}")
                    st.write("⬛ Status:", result["status"])
                    st.write("⬛ Reason:")
                    st.write(result.get("llm_reasoning", "No response"))
        else:
            st.error("The JSON file must contain a list of records.")
    except Exception as e:
        st.error(f"Error reading JSON: {e}")
