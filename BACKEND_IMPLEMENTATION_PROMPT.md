# Backend Implementation Prompt for Multiple Conditions Automation Feature

## Context
I have a Next.js frontend application with an automation system that allows users to create rules to control switches based on sensor readings. I've just updated the frontend to support multiple conditions with logical operators (AND/OR), and now need to implement the corresponding backend changes.

## Current Backend Structure (Assumptions)
- ASP.NET Core Web API
- Entity Framework for data persistence
- REST endpoints for automation CRUD operations
- Current automation entity likely has fields for single condition (sensorId, sensorType, condition, threshold)

## Frontend Changes Already Made

### New DTOs Created:
```typescript
// AutomationConditionDto.ts
export interface AutomationConditionDto {
    id?: number;
    sensorType: string;
    sensorId: number;
    condition: string;
    threshold: number;
}

// Updated AutomationRuleDto.ts
export interface AutomationRuleDto {
    id: number;
    targetType: string;
    targetId: number;
    // Legacy fields for backward compatibility
    sensorType?: string;
    sensorId?: number;
    condition?: string;
    threshold?: number;
    // New fields for multiple conditions
    conditions?: AutomationConditionDto[];
    logicalOperator?: 'AND' | 'OR';
    action: string;
}
```

The CreateAutomationRuleDto and UpdateAutomationRuleDto have similar changes.

## Required Backend Implementation

Please implement the following backend changes:

### 1. Database Schema Updates
- Create a new `AutomationConditions` table/entity to store individual conditions
- Update the `AutomationRules` table to include `LogicalOperator` field
- Maintain existing fields for backward compatibility
- Set up proper foreign key relationships

### 2. Entity Models
- Create `AutomationCondition` entity
- Update `AutomationRule` entity with new fields and relationships
- Ensure proper navigation properties

### 3. API Endpoints Updates
Update existing automation endpoints to:
- Accept the new condition array structure in POST/PUT requests
- Return the new structure in GET requests
- Handle both legacy single-condition and new multiple-condition formats
- Validate that at least one condition exists
- Validate logical operator when multiple conditions are present

### 4. Business Logic for Automation Processing
Implement the core logic to evaluate multiple conditions:
- For AND operator: ALL conditions must be true to trigger
- For OR operator: ANY condition being true will trigger
- Handle the condition operators: `==`, `<`, `>`, `<=`, `>=`
- Maintain backward compatibility with existing single-condition automations

### 5. Data Migration Strategy
- Handle existing automations by converting single conditions to the new array format
- Ensure no data loss during migration
- Default logical operator to 'AND' for converted single conditions

## Example Use Cases to Support

### Use Case 1: Temperature AND Price
```json
{
  "targetType": "switch",
  "targetId": 1,
  "conditions": [
    {
      "sensorType": "temperature",
      "sensorId": 2,
      "condition": ">",
      "threshold": 10
    },
    {
      "sensorType": "electricity_price",
      "sensorId": 3,
      "condition": "<=",
      "threshold": 3
    }
  ],
  "logicalOperator": "AND",
  "action": "on"
}
```

### Use Case 2: Humidity OR Temperature
```json
{
  "targetType": "switch", 
  "targetId": 1,
  "conditions": [
    {
      "sensorType": "humidity",
      "sensorId": 4,
      "condition": "<",
      "threshold": 30
    },
    {
      "sensorType": "temperature",
      "sensorId": 2,
      "condition": ">",
      "threshold": 25
    }
  ],
  "logicalOperator": "OR",
  "action": "on"
}
```

## Backward Compatibility Requirements
- Existing API calls with single condition format must continue to work
- When receiving legacy format, automatically convert to new condition array format
- When returning data, include both legacy fields and new conditions array for compatibility

## Validation Requirements
- At least one condition must be present
- All conditions must have valid sensorId, condition operator, and threshold
- LogicalOperator is required when multiple conditions exist
- Support condition operators: `==`, `<`, `>`, `<=`, `>=`

## Response Format
The API should return automations in this format:
```json
{
  "id": 1,
  "targetType": "switch",
  "targetId": 1,
  "conditions": [
    {
      "id": 1,
      "sensorType": "temperature",
      "sensorId": 2,
      "condition": ">",
      "threshold": 10
    }
  ],
  "logicalOperator": "AND",
  "action": "on",
  // Legacy fields for backward compatibility
  "sensorType": "temperature",
  "sensorId": 2,
  "condition": ">", 
  "threshold": 10
}
```

Please implement these changes while maintaining full backward compatibility and following C# best practices for Entity Framework, validation, and API design.

---

## ✅ IMPLEMENTATION COMPLETED

The backend implementation has been successfully completed with the following key features:

### Database Changes
- **New AutomationCondition entity** with proper foreign key relationships
- **Updated AutomationRule entity** with nullable legacy fields for backward compatibility
- **Database migration** that preserves existing data

### API Enhancements
- **Full backward compatibility** - existing API calls work unchanged
- **New multiple conditions support** with AND/OR logical operators
- **Validation services** to ensure data integrity
- **Real-time processing** via PostgreSQL triggers and background services

### Key Services Added
1. **AutomationValidationService** - Validates rule formats and prevents mixing legacy/new formats
2. **AutomationProcessingService** - Processes sensor data against multiple conditions
3. **SensorNotificationService** - Background service for real-time automation triggers

### Supported Condition Operators
`==`, `=`, `>`, `<`, `>=`, `<=`, `!=`, `<>`

### Response Format
All API responses now include both legacy fields and new conditions array for maximum compatibility.

The implementation is production-ready and maintains full backward compatibility while adding powerful new multiple condition capabilities.
