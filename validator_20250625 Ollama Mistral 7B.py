import ollama

def validate_data(records: list):
    results = []

    for record in records:
        prompt = f"""
You are a smart SAP validator.

Below is a record of a material movement. Only respond if you notice something suspicious, such as inconsistencies or potential errors. If everything looks fine, do not reply.

- Material: {record.get('matnr')}
- Description: {record.get('maktx')}
- Movement Type: {record.get('rstyp')}
- Picked Quantity: {record.get('picked_qty')}
- Stock Quantity: {record.get('stock_qty')}
- Account Assignment: {record.get('accou')}
- Project Number: {record.get('project')}
- Storage Type: {record.get('storage')}
- Date: {record.get('date')}

Carefully analyze and give your reasoning ONLY IF you find anything that needs attention.
""".strip()

        try:
            response = ollama.chat(model="mistral", messages=[
                {"role": "user", "content": prompt}
            ])
            reasoning = response.get("message", {}).get("content", "").strip()
            results.append({
                "record_id": record.get("id", None),
                "llm_reasoning": reasoning if reasoning else None,
                "status": "Flagged" if reasoning else "No issues"
            })
        except Exception as e:
            results.append({
                "record_id": record.get("id", None),
                "llm_reasoning": None,
                "status": f"Error: {str(e)}"
            })

    return results
