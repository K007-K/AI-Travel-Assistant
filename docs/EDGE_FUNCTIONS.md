# Edge Functions Reference

## `itinerary-generator`

**Purpose:** Generates AI-powered day-by-day itinerary activities via Groq LLM.

### Request

```json
{
  "destination": "string",
  "days": "number",
  "budget": "number",
  "travelers": "number",
  "currency": "string (ISO 4217)",
  "budgetTier": "'budget' | 'mid-range' | 'luxury'",
  "tripDays": [{ "dayNumber": 1, "location": "string" }],
  "activityBudget": "number (from orchestrator)",
  "travelStyle": "string",
  "pace": "'relaxed' | 'moderate' | 'packed'",
  "excludeTransport": "boolean",
  "excludeAccommodation": "boolean"
}
```

### Response

Groq completion shape:
```json
{
  "choices": [{
    "message": {
      "content": "{\"days\":[{\"dayNumber\":1,\"activities\":[{\"title\":\"...\",\"time\":\"09:00\",\"location\":\"...\",\"type\":\"sightseeing\",\"estimated_cost\":500,\"safety_warning\":null,\"notes\":\"...\"}]}]}"
    }
  }]
}
```

---

## `budget-validator`

**Purpose:** Financial analysis of trip budget via AI.

### Request

```json
{
  "destination": "string",
  "days": "number",
  "travelers": "number",
  "budget": "number",
  "currency": "string",
  "total_budget": "number",
  "actual_spent": "number",
  "ai_estimated_total": "number",
  "forecast_total": "number",
  "forecast_percent": "number (0-100+)",
  "remaining_forecast": "number",
  "category_breakdown": [{ "category": "string", "actual": "number", "estimated": "number" }]
}
```

### Response

```json
{
  "insights": {
    "summary": "string",
    "risk_analysis": "string",
    "category_insights": ["string"],
    "recommendations": ["string (max 5)"]
  }
}
```

Risk thresholds: <60% LOW, 60-80% MODERATE, 80-100% HIGH, ≥100% CRITICAL.

---

## `chat-completion`

**Purpose:** General-purpose travel chat via Groq.

### Request

```json
{
  "messages": [
    { "role": "'system' | 'user' | 'assistant'", "content": "string" }
  ]
}
```

### Response

Standard Groq chat completion shape.

---

## `wiki-seeder`

**Purpose:** Seeds knowledge base with Wikipedia-sourced travel data for RAG.

> Not called by frontend — internal admin function.
