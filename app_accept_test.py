import streamlit as st

st.title("Smart Validator — Toggle Test with Callback")

idx = 1  # Example item ID

# Initialize session state
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

# --- Callback to toggle accepted ---


def toggle_accept():
    state["accepted"] = not state["accepted"]
    state["rejected"] = False  # Reset reject if needed


# --- Dynamic label ---
label = "✅ Accepted" if state["accepted"] else "✅ Accept"

# --- Button with callback ---
st.button(label, key=f"accept_btn_{idx}", on_click=toggle_accept)

# Debug display
st.write(f"Accepted = {state['accepted']}")
