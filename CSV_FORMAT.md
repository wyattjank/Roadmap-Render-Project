# Roadmap CSV format

`render.py` reads **roadmap.csv** and **releases.csv**. Edit these in any spreadsheet app or text editor, then run `python render.py` to regenerate the Excel and draw.io outputs.

---

## roadmap.csv

**One row per task.** Same **Domain** + **Feature** = one row in the chart with multiple bars (tasks can overlap in time).

| Column      | Required | Description |
|------------|----------|-------------|
| domain     | Yes      | Domain (e.g. Core Services, DEV C2S Core). Groups into the left-hand blocks. |
| feature    | Yes      | Feature or area (e.g. Kubernetes, CICD). The row label; multiple tasks can share the same feature. |
| task       | Yes      | Specific work item (e.g. EKS v1 support, Golden pipeline templates). One timeline bar per task. |
| start_date | Yes      | Start date. Use `YYYY-MM-DD` (e.g. 2026-01-15). |
| end_date   | Yes      | End date. Use `YYYY-MM-DD`. |
| notes      | No       | Free text. |
| flag       | No       | `baseline` = primary offering (e.g. EKS); `optional` = optional offering (e.g. Rancher); empty = no flag. Drives a visual accent on the task bar. |

**Examples**

- **One task per feature:**  
  `Core Services,CICD,Golden pipeline templates,2026-01-01,2026-04-30`

- **Multiple tasks under one feature (bars can overlap):**  
  `Core Services,Kubernetes (EKS),EKS v1 support,2025-12-01,2026-05-31,,baseline`  
  `Core Services,Kubernetes (Rancher),Rancher RKE1 support,2025-12-01,2026-05-31,,optional`

- **Flag:** Use `baseline` for the primary path (e.g. EKS) and `optional` for alternative/optional work (e.g. Rancher). Leave empty for no accent.

- **New domain:** Add a new domain name in the **domain** column and use it for all rows that belong to that domain.

- **New feature:** Add a new value in **feature** (and the same **domain**). Add one or more **task** rows with start/end dates.

---

## releases.csv

**One row per release.** Defines the release bands on the timeline.

| Column     | Required | Description |
|-----------|----------|-------------|
| release   | Yes      | Release name (e.g. R22, R1, R2). |
| start_date | Yes     | Start of release window. `YYYY-MM-DD`. |
| end_date  | Yes      | End of release window. `YYYY-MM-DD`. |

**Example**

```csv
release,start_date,end_date
R22,2025-12-01,2026-02-28
R1,2026-03-01,2026-05-31
R2,2026-06-01,2026-08-31
```

To add a release: add a new row with **release**, **start_date**, and **end_date**.

---

## Tips

- **Dates:** Use `YYYY-MM-DD` (e.g. `2026-02-01`). Month/year only is also supported in the script.
- **Column names:** Case doesn’t matter; spaces become underscores (e.g. `start_date` or `Start Date`).
- **Encoding:** Save CSVs as UTF-8 so special characters display correctly.
- **Order:** Domain order and feature order follow **first appearance in the CSV**. Put the first row of each domain in the order you want domains to appear; within a domain, the first row of each feature sets that feature’s order. Tasks within each feature are sorted by start date.
- **Commas in notes:** If a cell contains a comma, wrap the whole value in double quotes (e.g. `"Standardized pipelines, devops tools"`).
