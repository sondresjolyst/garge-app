# Multiple Conditions Automation Feature - Deployment Guide

## 🚀 Ready to Deploy!

Both your frontend and backend now support multiple conditions with logical operators. Here's everything you need to know for deployment and testing.

## ✅ What's Been Implemented

### Frontend (Already Done)
- ✅ Multiple condition UI with add/remove buttons
- ✅ AND/OR logical operator selection
- ✅ Backward compatibility with existing single conditions
- ✅ Enhanced validation and error handling
- ✅ Responsive design for mobile devices

### Backend (Just Completed)
- ✅ Database schema with AutomationCondition entity
- ✅ Updated AutomationRule entity with new fields
- ✅ Full API backward compatibility
- ✅ Real-time processing via PostgreSQL triggers
- ✅ Comprehensive validation services
- ✅ Background services for automation execution

## 📋 Deployment Checklist

### 1. Database Migration
The backend includes database migrations that will:
- Create the new `AutomationConditions` table
- Add `LogicalOperator` field to `AutomationRules`
- Make legacy fields nullable for backward compatibility
- Preserve all existing automation data

### 2. Backend Services
New services automatically registered:
- `IAutomationProcessingService` - Processes multiple conditions
- `IAutomationValidationService` - Validates rule formats
- `SensorNotificationService` - Real-time background processing

### 3. Database Triggers
PostgreSQL triggers added for real-time processing:
- Listens to `sensordata_channel`
- Automatically triggers automation evaluation

## 🧪 Testing Your Use Case

### Your Example: Temperature + Electricity Price
Create an automation with these conditions:

**Via API:**
```bash
POST /api/automation
Content-Type: application/json

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

**Via Frontend:**
1. Go to `/automations` page
2. Select your target switch
3. Click "Add Condition" to create multiple conditions
4. Set first condition: Temperature Sensor > 10
5. Set second condition: Electricity Price Sensor <= 3
6. Select "AND (All conditions must be true)"
7. Set action to "On"
8. Click "Create"

## 🔄 Backward Compatibility Testing

### Test Existing Automations
1. Verify existing single-condition automations still work
2. Check that they display correctly in the new UI
3. Confirm they can be edited and saved

### Test Legacy API Calls
```bash
# This old format should still work
POST /api/automation
{
  "targetType": "switch",
  "targetId": 1,
  "sensorType": "temperature",
  "sensorId": 2,
  "condition": ">",
  "threshold": 25,
  "action": "on"
}
```

## 🎯 Use Case Examples

### 1. Smart Climate Control
**Turn on heater when:**
- Temperature < 18°C AND Electricity price <= 2 NOK/kWh
- *Saves money by only heating when electricity is cheap*

### 2. Ventilation Control  
**Turn on fan when:**
- Humidity > 70% OR Temperature > 26°C
- *Improves air quality based on either condition*

### 3. Security Lighting
**Turn on outdoor lights when:**
- Motion detected AND (Time > 20:00 OR Time < 06:00)
- *Smart security lighting for nighttime only*

## 📊 Expected Behavior

### AND Logic
- **ALL conditions must be true** to trigger the action
- Example: Temp > 10°C AND Price <= 3kr
- Action only triggers when BOTH conditions are satisfied

### OR Logic  
- **ANY condition can trigger** the action
- Example: Humidity < 30% OR Temp > 25°C
- Action triggers when EITHER condition is satisfied

## 🚨 Error Handling

The system now includes comprehensive validation:
- ❌ Empty conditions array
- ❌ Missing logical operator with multiple conditions
- ❌ Invalid sensor IDs or condition operators
- ❌ Mixing legacy and new formats in same request

## 🔧 Configuration

### Environment Variables
Ensure these are set for real-time processing:
- Database connection string with notification support
- Background service configuration

### Database Permissions
The application needs:
- `LISTEN/NOTIFY` permissions for real-time triggers
- Standard CRUD permissions for automation tables

## 📈 Performance Notes

- **Real-time processing** via PostgreSQL triggers
- **Efficient queries** with proper indexing
- **Background services** don't block API requests
- **Graceful error handling** prevents system crashes

## 🎉 Ready to Use!

Your automation system now supports complex conditional logic while maintaining full backward compatibility. Users can create sophisticated automation rules like your temperature + electricity price example, making your smart home system much more powerful and cost-effective!

The system will automatically:
1. ✅ Process new sensor data in real-time
2. ✅ Evaluate multiple conditions with AND/OR logic  
3. ✅ Execute switch actions when conditions are met
4. ✅ Maintain compatibility with existing automations
