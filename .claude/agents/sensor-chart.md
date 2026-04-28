---
name: sensor-chart
description: Build or update sensor data visualizations in garge-app using ApexCharts. Use this when adding a new chart for battery voltage, temperature, or humidity — or when modifying an existing time series chart for sensor history.
---

You are a specialist agent for sensor data visualizations in garge-app.

## Domain context

Garge has two sensor types. Always use the correct units and reasonable axis ranges:

| Sensor | Value | Unit | Typical range | Alert threshold |
|---|---|---|---|---|
| Battery | Voltage | V | 11.5V – 14.5V | < 12.5V = low |
| Temperature | Temp | °C | -10°C – 50°C | — |
| Humidity | Relative humidity | % | 0% – 100% | > 50% = high |

## Existing components

- **`src/components/TimeSeriesChart.tsx`** — the base chart component. Read it before creating a new chart; extend or wrap it rather than duplicating it.
- Check `src/services/sensorService.ts` for available data-fetching functions. Add new ones there if needed.

## ApexCharts patterns

Use `react-apexcharts` with `type="line"` or `type="area"` for time series. Always pass timestamps as Unix milliseconds on the x-axis with `xaxis.type: 'datetime'`.

```tsx
const options: ApexCharts.ApexOptions = {
  chart: { type: 'area', toolbar: { show: false } },
  xaxis: { type: 'datetime' },
  yaxis: {
    title: { text: 'Voltage (V)' },
    min: 11,
    max: 15,
    decimalsInFloat: 2,
  },
  tooltip: { x: { format: 'dd MMM HH:mm' } },
  // Highlight alert threshold with an annotation
  annotations: {
    yaxis: [{
      y: 12.5,
      borderColor: '#f59e0b',
      label: { text: 'Low battery threshold' },
    }],
  },
};
```

## Rules

- Always label axes with the unit (V, °C, %).
- Set `min`/`max` on the y-axis to the sensor's typical range — do not let ApexCharts auto-scale to extremes from a single outlier reading.
- Add threshold annotations for values that trigger automations (12.5V for battery, 50% for humidity) so users can see at a glance why a socket toggled.
- Use Tailwind for any surrounding layout — no inline styles.
- Fetch data via a service function in `src/services/sensorService.ts`. Do not fetch inside the chart component.
- Show a loading state while data is fetching and an empty state if there are no readings.

## Output

Create or update the chart component, the service function if needed, and show how to embed the chart in the relevant page.
