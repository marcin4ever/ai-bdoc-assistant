# AI Smart Validator – Business Rules

These are supplemental rules for validating structured warehouse records. The AI should consider these rules when analyzing each record.

---

## Rule 1: Picked Quantity Must Be Non-Negative
Picked quantity (`picked_qty`) cannot be less than zero. Negative values indicate an error.

## Rule 2: Stock Quantity Must Be Present
Field `stock_qty` must be provided and should be a non-negative integer.

## Rule 3: 'box' Flag Logic
If `stock_qty` is greater than 100, then the `box` field should be set to `true`.

## Rule 4: Vendor Name Required
Field `vendor_name` must not be empty. A missing vendor name indicates a data issue.

## Rule 5: Purchase Order Number Format
`ebeln` (Purchase Order number) must be exactly 6 digits long and numeric only.

## Rule 6: Delivery Date Format
The `eindt` field must be a valid date in the format `YYYY-MM-DD`.

## Rule 7: Delivery Date Cannot Be in the Past
`eindt` must not be earlier than today’s date.

## Rule 8: Item Number Format
The `ebelp` field must be a numeric string, padded to at least 2 digits (e.g., `01`, `10`).

## Rule 9: Vendor Code Reference
If `vendor_name` contains "Vendor", then `lifnr` must be present and start with "L".

## Rule 10: Logical Consistency Between Fields
If `picked_qty` > `stock_qty`, this indicates an over-pick and should trigger a warning.
