# Multiple Conditions Feature for Automations

## Overview

The automation system now supports multiple conditions with logical operators (AND/OR). This allows you to create more complex automation rules like:

- Turn on switch when temperature is higher than 10 degrees AND electricity price is not higher than 3kr
- Turn off switch when humidity is less than 30% OR temperature is greater than 25 degrees

## Data Structure Changes

### New DTO: AutomationConditionDto
```typescript
export interface AutomationConditionDto {
    id?: number;
    sensorType: string;
    sensorId: number;
    condition: string;
    threshold: number;
}
```

### Updated DTOs
All automation DTOs now support:
- `conditions?: AutomationConditionDto[]` - Array of conditions to check
- `logicalOperator?: 'AND' | 'OR'` - How to combine multiple conditions
- Legacy fields maintained for backward compatibility

## User Interface Changes

### Create/Edit Forms
- **Add Condition Button**: Users can add multiple conditions to a single automation rule
- **Remove Condition Button**: Remove individual conditions (minimum of 1 condition required)
- **Logic Operator Selector**: Choose between AND/OR when multiple conditions exist
- **Condition Cards**: Each condition is displayed in its own card with sensor, condition, and threshold fields

### Rule Display
- Shows all conditions for each automation rule
- Displays the logical operator between conditions
- Maintains backward compatibility with single-condition rules

## Usage Examples

### Example 1: Temperature AND Price Control
```
Target: Living Room Light
Conditions:
  1. Temperature Sensor > 10°C
  2. Electricity Price Sensor <= 3kr
Logic: AND
Action: On
```

### Example 2: Humidity OR Temperature Control  
```
Target: Ventilation Fan
Conditions:
  1. Humidity Sensor < 30%
  2. Temperature Sensor > 25°C
Logic: OR
Action: On
```

## Implementation Notes

### Backward Compatibility
- Existing single-condition automations continue to work
- Legacy API fields are still supported
- UI automatically converts between legacy and new formats

### Validation
- At least one condition is required
- All conditions must have a valid sensor selected
- Logical operator is required when multiple conditions exist

### Backend Considerations
The backend API needs to be updated to:
1. Accept the new condition array structure
2. Handle logical operators (AND/OR)
3. Maintain backward compatibility with existing single-condition rules
4. Evaluate multiple conditions when processing automation triggers

## Testing Scenarios

1. **Create single condition** - Ensure backward compatibility
2. **Create multiple conditions with AND** - All conditions must be true
3. **Create multiple conditions with OR** - Any condition can trigger
4. **Edit existing single condition** - Should convert to new format
5. **Edit multiple conditions** - Add/remove conditions, change operators
6. **Delete conditions** - Ensure minimum of 1 condition remains

This feature significantly enhances the flexibility of the automation system while maintaining full backward compatibility with existing automations.
