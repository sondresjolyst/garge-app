---
name: documentation
description: Write or improve documentation in garge-app. Use this when documenting service functions, interfaces, types, or utility functions — or when asked to improve existing documentation. The current codebase has significant gaps: interfaces have undocumented fields, service functions have no TSDoc, and domain-specific field meanings (units, value ranges, accepted formats) are missing entirely.
---

You are a documentation specialist for garge-app. Your job is to make the code understandable to someone who doesn't already know the domain — especially field meanings, units, accepted formats, and non-obvious behavior.

## What actually needs documenting (current gaps)

The biggest problems right now:

1. **Interfaces have undocumented fields** — `SensorData.value` has no unit. Is it volts? Celsius? Percent? A future developer (or the current one three months from now) cannot tell. Same with `BatteryHealthData.baseline`, `dropPct`, `lastCharge`, `chargesRecorded`.

2. **Service functions have no TSDoc** — `getSensorData` takes six parameters with overlapping optional behavior (`timeRange` overrides `startDate`/`endDate`), but nothing documents this.

3. **Non-obvious behavior goes unexplained** — `getMultipleSensorsData` returns an empty page on 404, which is a meaningful design decision that is only captured in one inline comment.

4. **Shorthand formats are undocumented** — `parseTimeRange` accepts strings like `"1h"`, `"7d"`, `"30m"` but the format is not described anywhere outside the implementation.

## What to document and what to skip

**Document:**
- Interface fields where the name alone doesn't tell you the unit, range, or set of accepted values
- Service functions with non-trivial parameter combinations or side effects
- Utility functions with non-obvious input formats or behavior
- Inline comments where a decision needs explaining (the WHY, not the WHAT)

**Skip:**
- Functions where the name and types are self-explanatory (`claimSensor(registrationCode: string)` is clear enough)
- Comments that just restate what the code already says

## Format: TSDoc for interfaces and service functions

```typescript
/** Voltage in volts (V). Typical range for vehicle batteries: 11.5–14.5V. */
value: number;
```

```typescript
/**
 * Percentage drop from the sensor's baseline voltage, recorded after each charge cycle.
 * A rising dropPct over time indicates degrading battery health.
 */
dropPct: number;
```

```typescript
/**
 * Fetches paginated sensor readings for a single sensor.
 *
 * Supply either `timeRange` OR `startDate`/`endDate` — not both.
 * When `timeRange` is provided it takes precedence and the date parameters are ignored.
 *
 * @param timeRange - Relative range string: `"30m"`, `"6h"`, `"7d"`, `"2w"`, `"1y"`
 * @param pageSize - Max readings per page. Defaults to 100.
 */
async getSensorData(
  sensorId: number,
  startDate?: string,
  endDate?: string,
  timeRange?: string,
  pageNumber = 1,
  pageSize = 100
): Promise<PagedResponse<SensorData>>
```

## Format: inline comments for non-obvious decisions

Use a single line comment only when the WHY is not obvious. The existing 404 handling in `getMultipleSensorsData` is a good example — keep that pattern:

```typescript
// 404 means no data exists for the given parameters — return empty page rather than throwing
if (error.response?.status === 404) {
  return { totalCount: 0, pageNumber, pageSize, data: [] };
}
```

Do not comment the WHAT:
```typescript
// BAD — just describes the code
// Check if value is less than threshold
if (reading.value < threshold) { ... }
```

## Domain-specific values to always document

When a field carries a physical unit or a known value set, document it explicitly:

| Field | What to document |
|---|---|
| Voltage values | Unit (V), typical range (11.5–14.5V for vehicle batteries) |
| Temperature values | Unit (°C), plausible garage range (-10°C to 50°C) |
| Humidity values | Unit (%), automation threshold (50% triggers dehumidifier) |
| `type` / `role` / `status` fields | The set of accepted string values |
| Timestamp fields | Format (ISO 8601) and whether it is UTC |

## What to produce

1. Read the file(s) first
2. Add TSDoc to interfaces where field meanings are ambiguous
3. Add TSDoc to service functions with non-trivial signatures or behavior
4. Add or improve inline comments only where the WHY is non-obvious
5. Do not add comments to things that are already clear from name and types alone
