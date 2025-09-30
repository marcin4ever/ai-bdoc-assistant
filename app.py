import streamlit as st
import json
from validator import validate_data, key_source
from pathlib import Path
import io

st.set_page_config(page_title="Smart Validator - Streamlit", layout="wide")


def get_uploaded_file():
    f = uploaded_file or st.session_state.get("uploaded_file")
    if f:
        f.seek(0)
    return f


def toggle_accept(idx):
    state = st.session_state[f"state_{idx}"]
    state["accepted"] = not state["accepted"]
    state["rejected"] = False


st.markdown("<h1 style='text-align:center; color:#1d4ed8;'>Smart Validator via Streamlit</h1>",
            unsafe_allow_html=True)
st.markdown("""
<p style='text-align:center; color:gray; font-size:16px;'>
Upload your data to validate records using LLaMA 3 or Mistral 7B.<br/>
<span style='font-size:14px; color:#999;'>(Standalone mode, no backend connected)</span>
</p>
""", unsafe_allow_html=True)

col1, col2, col3 = st.columns([3, 6, 3])

with col2:
    upload_row_left, upload_row_right = st.columns([7, 2])

    with upload_row_left:
        uploaded_file = st.file_uploader(
            "Upload JSON File", type="json", label_visibility="collapsed"
        )
    with upload_row_right:
        st.markdown("<div style='margin-top: 1.2rem'></div>",
                    unsafe_allow_html=True)
        use_demo = st.button("Use Demo Example")

    if use_demo:
        demo_path = Path(__file__).parent / "test_data" / \
            "demo_example_data.json"
        with open(demo_path, "r") as f:
            st.session_state.uploaded_file = io.StringIO(f.read())
            st.session_state.uploaded_file.name = "demo_example_data.json"
            st.session_state.uploaded_file.seek(0)

uploaded_file = get_uploaded_file()
if uploaded_file:
    try:
        records = json.load(uploaded_file)
        if isinstance(records, list):
            st.success(f"✅ Loaded {len(records)} records.")

            col1, col2, col3, col4 = st.columns([3, 1, 1, 3])
            with col2:
                run_basic = st.button(
                    "Run Validation", use_container_width=True)
            with col3:
                run_rag = st.button("Run with RAG WM Rules",
                                    use_container_width=True)

            if (run_basic or run_rag) or "results" in st.session_state:
                if (run_basic or run_rag):
                    with st.spinner("Validating..."):
                        results, source = validate_data(
                            records, use_rag=(run_rag and not run_basic))
                    st.session_state.results = results
                    st.session_state.source = source
                    st.success("✔️ Validation complete")
                else:
                    results = st.session_state.results
                    source = st.session_state.source
                st.markdown("<hr style='border:1px solid #ccc;'/>",
                            unsafe_allow_html=True)

                ok_count = sum(1 for r in results if r["status"] == "OK")
                err_count = len(results) - ok_count
                scored = [r["score"]
                          for r in results if "score" in r and r["score"] is not None]
                avg_score = round(sum(scored)/len(scored),
                                  1) if scored else None

                st.markdown("### Summary")
                if ok_count > 0:
                    st.markdown(
                        f"<p style='color:green; font-weight:bold;'>✅ {ok_count} OK</p>", unsafe_allow_html=True)
                if err_count > 0:
                    st.markdown(
                        f"<p style='color:red; font-weight:bold;'>❌ {err_count} Errors</p>", unsafe_allow_html=True)
                if avg_score is not None:
                    score_icon = "✅" if avg_score >= 8 else "⚠️" if avg_score >= 5 else "❌"
                    st.markdown(
                        f"<p style='color:gray;'>{score_icon} Avg Score: <strong>{avg_score}/10</strong></p>", unsafe_allow_html=True)

                st.markdown(
                    f"<p style='color:#888;'>API Used: {source}</p>", unsafe_allow_html=True)
                st.markdown("<hr style='border:1px solid #ccc;'/>",
                            unsafe_allow_html=True)

                for idx, result in enumerate(results, start=1):
                    st.markdown(f"<h4>Item {idx}:</h4>",
                                unsafe_allow_html=True)
                    status_color = "green" if result["status"] == "OK" else "red"
                    if "score" in result:
                        score_val = round(result["score"], 1)
                        st.markdown(
                            f"""
                            <div style='display: flex; gap: 2rem; align-items: center;'>
                                <div><b>Status:</b> <span style='color:{status_color}; font-weight:bold;'>{result['status']}</span></div>
                                <div><b>Score:</b> {score_val}/10</div>
                            </div>
                            """,
                            unsafe_allow_html=True
                        )
                    st.markdown(
                        "<div style='margin-bottom: 1rem;'></div>", unsafe_allow_html=True)
                    st.markdown(
                        f"<div style='background:#f9f9f9; padding:10px; border-left:3px solid #ddd;'>{result.get('llm_reasoning', 'No explanation')}</div>", unsafe_allow_html=True)

                    #   Buttons row
                    st.markdown(
                        "<div style='margin-bottom: 1rem;'></div>", unsafe_allow_html=True)
                    if f"state_{idx}" not in st.session_state:
                        st.session_state[f"state_{idx}"] = {
                            "accepted": False,
                            "rejected": False,
                            "retrying": False,
                            "feedback": False,
                            "email": False,
                            "worklisted": False,
                        }

                    state = st.session_state[f"state_{idx}"]

                    col1, col2, col3, col4, col5, col6 = st.columns(
                        [1, 1, 1, 1, 1, 1])

                    with col1:
                        if st.button("✅ Accept" if not state["accepted"] else "✅ Accepted", key=f"accept_{idx}"):
                            state["accepted"] = not state["accepted"]
                            state["rejected"] = False
                            st.rerun()

                    with col2:
                        if st.button("❌ Reject" if not state["rejected"] else "❌ Rejected", key=f"reject_{idx}"):
                            state["rejected"] = not state["rejected"]
                            # optional: reset Accept if Reject is toggled
                            state["accepted"] = False
                            st.rerun()

                    with col3:
                        if st.button("🔁 Retry", key=f"retry_{idx}"):
                            st.info(f"Re-validating Item {idx}...")

                    with col4:
                        if st.button("💬 Feedback", key=f"fb_btn_{idx}"):
                            state["feedback"] = not state["feedback"]

                        if state["feedback"]:
                            feedback = st.text_area(
                                "Your feedback:", key=f"fb_text_{idx}", height=100)
                            if feedback:
                                st.info(
                                    f"Thanks for your feedback: {feedback}")

                    with col5:
                        if st.button("✉️ Email", key=f"email_btn_{idx}"):
                            state["email"] = not state["email"]

                        if state["email"]:
                            email = st.text_input(
                                "Send to:", placeholder="someone@example.com", key=f"email_to_{idx}")
                            body = st.text_area(
                                "Email body:", key=f"email_body_{idx}", height=100)
                            if email and body:
                                st.success(f"📨 Email will be sent to {email}")

                    with col6:
                        if st.button("📋 Worklist" if not state["worklisted"] else "📋 Worklisted", key=f"worklist_{idx}"):
                            state["worklisted"] = not state["worklisted"]
                            st.rerun()

                    st.markdown("---")

        else:
            st.error("❌ The file must contain valid records.")
    except Exception as e:
        st.error(f"❌ Error reading file: {e}")
