# Engine Public API

## Transport Engine (`src/utils/transportEngine.js`)

### Public Exports

| Function | Arguments | Returns | Description |
|---|---|---|---|
| `buildOutboundSegment` | `(trip, allocation, currencyRate)` | `object \| null` | Phase 2: outbound travel segment |
| `buildIntercitySegments` | `(trip, allocation, currencyRate)` | `object[]` | Phase 2b: inter-city segments |
| `buildReturnSegment` | `(trip, allocation, currencyRate, totalDays)` | `object \| null` | Phase 6: return travel segment |
| `buildAccommodationSegments` | `(trip, allocation, currencyRate, dayLocations)` | `object[]` | Phase 3: nightly accommodation |
| `insertPairwiseLocalTransport` | `(trip, segments, allocation)` | `object[]` | Phase 5: local commute (Rule 9) |
| `getSegmentLabel` | `(type)` | `string` | Human-readable label for segment type |
| `isLogisticsSegment` | `(type)` | `boolean` | Check if segment is logistics vs activity |
| `CURRENCY_MULTIPLIERS` | — | `object` | Currency conversion rates vs USD |

### Test-Only Exports (prefixed with `_`)

`_decideTransportMode`, `_estimateDistanceTier`, `_calculateTransportCost`, `_calculateAccommodationCost`, `_KM_ESTIMATES`, `_estimateDrivingTime`

---

## Budget Allocator (`src/engine/budgetAllocator.js`)

| Function | Arguments | Returns | Description |
|---|---|---|---|
| `allocateBudget` | `(totalBudget, options)` | `BudgetAllocation` | Phase 1: split budget into envelopes |
| `deductFromEnvelope` | `(allocation, category, cost)` | `BudgetAllocation` | Deduct cost from category remaining |
| `reconcileBudget` | `(allocation, segments)` | `ReconcileResult` | Phase 7: verify budget compliance |
| `checkStrictBudget` | `(tripId, newCost)` | `{ allowed, message? }` | Rule 5: strict budget guard (async) |

### BudgetAllocation Shape

```js
{
  total_budget, intercity, accommodation, local_transport, activity, buffer,
  upgrade_pool?,  // luxury only
  activity_per_day, accommodation_per_night,
  intercity_remaining, accommodation_remaining, local_transport_remaining, activity_remaining,
  _meta: { ratios, travelStyle, budgetTier, totalDays, totalNights, travelers, hasOwnVehicle }
}
```

---

## Trip Orchestrator (`src/engine/tripOrchestrator.js`)

| Function | Arguments | Returns | Description |
|---|---|---|---|
| `orchestrateTrip` | `(trip, callbacks?)` | `Promise<OrchestrationResult>` | Full trip generation pipeline |

### Phase Order

1. Budget Allocation → 2. Outbound Travel → 3. Accommodation → 4. AI Activities → 5. Local Transport → 6. Return Travel → 7. Reconciliation → 8. Daily Summary

---

## City Coordinates (`src/data/cityCoordinates.js`)

| Function | Arguments | Returns | Description |
|---|---|---|---|
| `getCityCoords` | `(location)` | `{ lat, lng } \| null` | Compact coordinate format |
| `getCityCoordsLong` | `(location)` | `{ latitude, longitude } \| null` | Full coordinate format |
| `CITY_COORDINATES` | — | `object` | Raw city data for iteration |
