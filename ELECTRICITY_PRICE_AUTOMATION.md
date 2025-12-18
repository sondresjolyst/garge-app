# Electricity Price Automation Feature

## Overview
You can now use **Electricity Price** as a sensor in your automation rules! This allows you to create smart automations that respond to electricity price changes.

## ✅ **What's New**
- **Electricity Price Sensor**: Available in the sensor dropdown as "Electricity Price (NOK/kWh)"
- **Real-time Price Data**: Uses current electricity prices from your electricity service
- **Smart Thresholds**: Set price thresholds in NOK per kWh (e.g., 3.0 NOK/kWh)

## 🎯 **Your Use Case: Price-Based Socket Control**

### Example 1: Turn Off High-Power Devices When Prices Are High
```
Target: High Power Socket
Conditions:
  - Electricity Price > 3.0 NOK/kWh
Logic: -
Action: Off
```

### Example 2: Smart Heating Control
```
Target: Heater Socket
Conditions:
  1. Temperature < 18°C
  2. Electricity Price <= 2.5 NOK/kWh
Logic: AND
Action: On
```

### Example 3: Car Charging Optimization
```
Target: Car Charger Socket
Conditions:
  1. Time >= 22:00 (if you have time sensors)
  2. Electricity Price <= 1.5 NOK/kWh
Logic: AND
Action: On
```

## 🔧 **How to Use**

### Creating a New Automation:
1. Go to **Automations** page
2. Select your target socket/switch
3. Click **"Add Condition"** 
4. In the **Sensor** dropdown, select **"Electricity Price (NOK/kWh)"**
5. Choose condition: `>`, `<`, `>=`, `<=`, `==`
6. Set threshold (e.g., `3.0` for 3 NOK per kWh)
7. Set action: **On** or **Off**
8. Click **Create**

### Combining with Other Sensors:
- Use **AND** logic: All conditions must be true
- Use **OR** logic: Any condition can trigger
- Mix electricity price with temperature, humidity, etc.

## 💡 **Smart Automation Ideas**

### Cost-Saving Automations:
- **Turn off non-essential devices** when price > 4.0 NOK/kWh
- **Disable electric heating** when price > 3.5 NOK/kWh
- **Stop car charging** when price > 2.0 NOK/kWh

### Optimization Automations:
- **Start dishwasher** when price < 1.0 NOK/kWh
- **Enable electric heating** when price < 2.0 NOK/kWh AND temp < 20°C
- **Charge devices** when price < 1.5 NOK/kWh

## 🔍 **Technical Details**

### Price Data:
- **Source**: Your existing electricity service API
- **Update Frequency**: Real-time hourly prices
- **Currency**: NOK (Norwegian Krone) per kWh
- **Area**: Uses your configured area (e.g., NO2)

### Backend Integration:
- **Sensor ID**: Uses special ID `-1` for electricity price
- **Sensor Type**: `electricity_price`
- **Current Price**: Fetched from `ElectricityService.getCurrentPrice()`

## 🚀 **Ready to Save Money!**

Your automation system can now help you:
- ✅ **Reduce electricity costs** by avoiding high-price periods
- ✅ **Optimize device usage** based on real-time pricing
- ✅ **Combine price conditions** with other sensor data
- ✅ **Create complex rules** with multiple conditions

Start creating electricity price-based automations and let your smart home save you money automatically! 💰⚡️
