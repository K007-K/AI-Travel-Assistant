# RPC Contracts

## `match_documents`

**Purpose:** Vector similarity search for RAG retrieval.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `query_embedding` | `float[]` | 768-dim embedding vector from Gemini |
| `match_threshold` | `float` | Minimum cosine similarity (default 0.5) |
| `match_count` | `int` | Max documents to return (default 3) |

### Returns

```json
[
  {
    "id": "uuid",
    "content": "string",
    "metadata": "jsonb",
    "similarity": "float"
  }
]
```

---

## `get_budget_summary` (if exists)

**Purpose:** Pre-computed budget summary for budget-validator edge function input.

### Parameters

| Parameter | Type |
|---|---|
| `p_trip_id` | `uuid` |

### Returns

```json
{
  "total_budget": "number",
  "actual_spent": "number",
  "ai_estimated_total": "number",
  "forecast_total": "number",
  "forecast_percent": "number",
  "remaining_forecast": "number",
  "category_breakdown": [{ "category": "string", "actual": "number", "estimated": "number" }]
}
```
