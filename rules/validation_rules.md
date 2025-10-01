# BDOC Validation Rules (RAG Reference)

These rules guide the AI Middleware Assistant in classifying BDOC-like error records.  
The assistant must always provide **exactly one result** from:  
**Reprocess, Delete, Fix, Escalate, Undefined**

---

## General Guidance
- Always process BDOCs in the expected business object sequence: **BUPA → BUAG → PRODUCT_INDOBJ**.  
- If a newer successful BDOC exists for the same queue, the errored one can be **deleted**.  
- If root cause is unclear or requires customizing/config changes, **escalate** to SAP/PSCD support.  
- If error is data-quality related (missing mapping, wrong reference), classify as **Fix**.  
- If error is retryable (e.g., locks, transient DB issue), classify as **Reprocess**.  

---

## Categories & Examples

### **Reprocess**
- Transient locks (e.g., *“currently being processed”*, SM12 lock entries).  
- Temporary inconsistencies (e.g., address added later, contract object later aligned).  
- Queue processing interrupted but can succeed on retry.  

### **Delete**
- Duplicate BDOCs for the same object/transaction.  
- Already corrected and a newer successful BDOC exists.  
- Test data or obsolete transactions that should not be processed further.  

### **Fix**
- Missing or incorrect mapping (e.g., product GUID not linked, contract object mismatch).  
- Data inconsistency between CRM and S/4 (e.g., business partner missing, reference not found).  
- Mandatory attributes missing in BDOC payload (dates, GUIDs, external references).  

### **Escalate**
- Root cause requires system configuration (e.g., middleware customizing, mapping tables).  
- Interface object not aligned across CRM ↔ ERP.  
- Issue repeats across multiple BDOCs → requires functional/technical team.  

### **Undefined**
- Insufficient information in BDOC to classify.  
- Unexpected structure or corrupted payload.  
- AI unable to determine category confidently.  

---

## Decision Rule
When multiple issues exist:
1. If retry alone can solve → **Reprocess**.  
2. If a new successful BDOC already exists → **Delete**.  
3. If mapping/data correction required → **Fix**.  
4. If config/system escalation needed → **Escalate**.  
5. Otherwise → **Undefined**.  

## Example BDOC Messages & Expected Classification

### Example 1
**Message:** `Business partner 12345 currently locked by user XYZ (SM12)`  
**Result:** Reprocess

---

### Example 2
**Message:** `Contract Object not found for GUID 00505692DA651FD0A69B0FC3969FF4D5`  
**Result:** Fix

---

### Example 3
**Message:** `BDOC already processed successfully in later queue (object_id=4711)`  
**Result:** Delete

---

### Example 4
**Message:** `Mapping entry missing in table CRMC_PRDTY for product type 'ZUTIL'`  
**Result:** Fix

---

### Example 5
**Message:** `Interface object PRODUCT_INDOBJ cannot be processed — customizing missing`  
**Result:** Escalate