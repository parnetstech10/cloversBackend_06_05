# 🔄 Flexible Membership Renewal System - Complete Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Database Models](#database-models)
4. [API Endpoints](#api-endpoints)
5. [Frontend Integration](#frontend-integration)
6. [Testing & Examples](#testing--examples)
7. [Admin Management](#admin-management)
8. [Best Practices](#best-practices)

---

## Overview

The Flexible Membership Renewal System allows users to:

✅ **Continue with their current membership type** (same card type)  
✅ **Upgrade to a higher-tier membership** (better benefits, higher price)  
✅ **Downgrade to a lower-tier membership** (basic benefits, lower price)  
✅ **Choose different renewal periods** (6 months, 1 year, 2 years, 3 years)  
✅ **Get automatic pricing** based on membership type and period  
✅ **Track renewal history** and membership changes  

### Key Features:
- **Multiple Membership Types**: Basic, Premium, VIP, Student, Senior
- **Flexible Pricing**: Different prices for different periods with discounts
- **Renewal Options**: Same type, upgrade, or downgrade
- **Automatic Calculations**: Pricing, discounts, and expiry dates
- **History Tracking**: Complete renewal history with change reasons
- **Notification System**: Automated expiry notifications

---

## System Architecture

### Database Structure

```
MembershipType (New Model)
├── name: String (e.g., "Premium Membership")
├── description: String
├── basePrice: Number
├── renewalPeriods: Array
│   ├── label: String (e.g., "1 Year")
│   ├── days: Number (e.g., 365)
│   ├── price: Number (e.g., 2000)
│   └── discount: Number (e.g., 10)
├── benefits: Array
├── creditLimit: Number
├── discount: Number
└── priority: Number (for upgrade/downgrade logic)

Renewal (Enhanced Model)
├── membershipType: ObjectId (ref to MembershipType)
├── membershipTypeName: String (for easy access)
├── renewalPeriod: Object
│   ├── label: String
│   ├── days: Number
│   └── price: Number
├── previousMembershipType: ObjectId
├── renewalReason: String
├── isUpgrade: Boolean
├── isDowngrade: Boolean
└── ... (existing fields)
```

---

## Database Models

### 1. MembershipType Model

```javascript
// models/MembershipType.js
import mongoose from 'mongoose';

const MembershipTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  basePrice: {
    type: Number,
    required: true
  },
  renewalPeriods: [{
    label: {
      type: String,
      required: true
    },
    days: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    discount: {
      type: Number,
      default: 0
    }
  }],
  benefits: [{
    name: String,
    description: String,
    value: String
  }],
  creditLimit: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better performance
MembershipTypeSchema.index({ name: 1 });
MembershipTypeSchema.index({ isActive: 1 });

const MembershipType = mongoose.model('MembershipType', MembershipTypeSchema);

export default MembershipType;
```

### 2. Enhanced Renewal Model

```javascript
// models/Renewal.js
import mongoose from 'mongoose';
const ObjectId = mongoose.Schema.Types.ObjectId;

const RenewalSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  membershipId: { type: ObjectId, required: true, ref: "User" },
  membershipName: { type: String, required: true },
  membershipType: { 
    type: ObjectId, 
    ref: "MembershipType",
    required: true 
  },
  membershipTypeName: { type: String, required: true },
  qrCode: { type: String },
  amount: { type: Number, default: 0 },
  renewalPeriod: {
    label: { type: String },
    days: { type: Number },
    price: { type: Number }
  },
  membershipExpairy: { type: Date },
  benefit: [],
  payId: { type: String },
  creditLimit: { type: Number },
  discount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Active', 'Expired', 'Cancelled'],
    default: "Pending"
  },
  // Firebase-specific fields
  fcmToken: { type: String },
  autoRenewal: { type: Boolean, default: false },
  paymentMethodId: { type: String },
  notificationSent: { type: Boolean, default: false },
  lastNotificationDate: { type: Date },
  notificationDays: [{ type: Number }],
  transactionId: { type: String },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'success', 'failed', 'cancelled'],
    default: 'pending'
  },
  renewalType: {
    type: String,
    enum: ['manual', 'automatic'],
    default: 'manual'
  },
  expiryNotifications: [{
    sentDate: { type: Date },
    daysBeforeExpiry: { type: Number },
    notificationType: { type: String },
    messageId: { type: String }
  }],
  // Renewal history tracking
  previousMembershipType: { type: ObjectId, ref: "MembershipType" },
  renewalReason: { type: String },
  isUpgrade: { type: Boolean, default: false },
  isDowngrade: { type: Boolean, default: false }
}, { timestamps: true });

// Indexes for better performance
RenewalSchema.index({ membershipId: 1 });
RenewalSchema.index({ status: 1 });
RenewalSchema.index({ membershipExpairy: 1 });
RenewalSchema.index({ membershipType: 1 });

export default mongoose.model('Renewal', RenewalSchema);
```

---

## API Endpoints

### 1. Get All Membership Types

```http
GET /api/renewals/membership-types
```

**Response:**
```json
{
  "success": true,
  "membershipTypes": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "Basic Membership",
      "description": "Essential membership with basic benefits",
      "basePrice": 500,
      "renewalPeriods": [
        {
          "label": "6 Months",
          "days": 180,
          "price": 500,
          "discount": 0
        },
        {
          "label": "1 Year",
          "days": 365,
          "price": 1000,
          "discount": 0
        },
        {
          "label": "2 Years",
          "days": 730,
          "price": 1800,
          "discount": 10
        },
        {
          "label": "3 Years",
          "days": 1095,
          "price": 2500,
          "discount": 15
        }
      ],
      "benefits": [
        {
          "name": "Gym Access",
          "description": "Access to gym facilities",
          "value": "Daily"
        }
      ],
      "creditLimit": 1000,
      "discount": 5
    }
  ]
}
```

### 2. Get User's Renewal Options

```http
GET /api/renewals/users/:userId/renewal-options
```

**Response:**
```json
{
  "success": true,
  "currentMembership": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "membershipType": "Basic Membership",
    "expiryDate": "2024-12-31T00:00:00.000Z",
    "daysUntilExpiry": 45,
    "isExpired": false,
    "isExpiringSoon": true,
    "status": "Active",
    "benefits": [...],
    "creditLimit": 1000,
    "discount": 5
  },
  "renewalOptions": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "Basic Membership",
      "description": "Essential membership with basic benefits",
      "isCurrentType": true,
      "renewalPeriods": [
        {
          "label": "6 Months",
          "days": 180,
          "price": 500,
          "discount": 0,
          "finalPrice": 500
        },
        {
          "label": "1 Year",
          "days": 365,
          "price": 1000,
          "discount": 0,
          "finalPrice": 1000
        }
      ],
      "benefits": [...],
      "creditLimit": 1000,
      "discount": 5,
      "renewalType": "same_type"
    },
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "name": "Premium Membership",
      "description": "Enhanced membership with premium benefits",
      "isCurrentType": false,
      "renewalPeriods": [...],
      "benefits": [...],
      "creditLimit": 2500,
      "discount": 10,
      "renewalType": "upgrade"
    }
  ]
}
```

### 3. Process Flexible Renewal

```http
POST /api/renewals/users/:userId/renew-membership
```

**Request Body:**
```json
{
  "membershipTypeId": "64f8a1b2c3d4e5f6a7b8c9d2",
  "renewalPeriod": {
    "label": "1 Year",
    "days": 365,
    "price": 2000
  },
  "paymentMethod": "free",
  "transactionId": "TXN_123456789",
  "renewalReason": "upgrade_to_premium"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Membership upgraded successfully",
  "renewal": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d3",
    "membershipType": "Premium Membership",
    "renewalPeriod": "1 Year",
    "amount": 2000,
    "expiryDate": "2025-12-31T00:00:00.000Z",
    "status": "Approved",
    "renewalType": "upgrade",
    "isUpgrade": true,
    "isDowngrade": false,
    "benefits": [...],
    "creditLimit": 2500,
    "discount": 10
  }
}
```

### 4. Get Renewal History

```http
GET /api/renewals/users/:userId/renewal-history
```

**Response:**
```json
{
  "success": true,
  "renewalHistory": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d3",
      "membershipType": "Premium Membership",
      "renewalPeriod": "1 Year",
      "amount": 2000,
      "expiryDate": "2025-12-31T00:00:00.000Z",
      "status": "Active",
      "renewalType": "manual",
      "renewalReason": "upgrade_to_premium",
      "isUpgrade": true,
      "isDowngrade": false,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "benefits": [...],
      "creditLimit": 2500,
      "discount": 10
    }
  ]
}
```

---

## Frontend Integration

### 1. React Native Component Example

```javascript
// components/MembershipRenewalScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import API_CONFIG from '../config/apiConfig';

const MembershipRenewalScreen = ({ userId }) => {
  const [renewalOptions, setRenewalOptions] = useState(null);
  const [selectedMembershipType, setSelectedMembershipType] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRenewalOptions();
  }, []);

  const fetchRenewalOptions = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/renewals/users/${userId}/renewal-options`);
      const data = await response.json();
      
      if (data.success) {
        setRenewalOptions(data);
        // Pre-select current membership type
        const currentType = data.renewalOptions.find(option => option.isCurrentType);
        if (currentType) {
          setSelectedMembershipType(currentType);
        }
      }
    } catch (error) {
      console.error('Error fetching renewal options:', error);
      Alert.alert('Error', 'Failed to load renewal options');
    }
  };

  const handleRenewal = async () => {
    if (!selectedMembershipType || !selectedPeriod) {
      Alert.alert('Error', 'Please select membership type and renewal period');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/renewals/users/${userId}/renew-membership`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          membershipTypeId: selectedMembershipType.id,
          renewalPeriod: selectedPeriod,
          paymentMethod: 'free', // For now, using free renewal
          renewalReason: selectedMembershipType.renewalType
        })
      });

      const data = await response.json();
      
      if (data.success) {
        Alert.alert(
          'Success!', 
          `${data.message}\n\nNew expiry date: ${new Date(data.renewal.expiryDate).toLocaleDateString()}`,
          [{ text: 'OK', onPress: () => fetchRenewalOptions() }]
        );
      } else {
        Alert.alert('Error', data.error || 'Renewal failed');
      }
    } catch (error) {
      console.error('Error processing renewal:', error);
      Alert.alert('Error', 'Failed to process renewal');
    } finally {
      setLoading(false);
    }
  };

  const renderMembershipType = (membershipType) => {
    const isSelected = selectedMembershipType?.id === membershipType.id;
    const isCurrent = membershipType.isCurrentType;
    
    return (
      <TouchableOpacity
        key={membershipType.id}
        style={[
          styles.membershipCard,
          isSelected && styles.selectedCard,
          isCurrent && styles.currentCard
        ]}
        onPress={() => setSelectedMembershipType(membershipType)}
      >
        <View style={styles.membershipHeader}>
          <Text style={styles.membershipName}>{membershipType.name}</Text>
          {isCurrent && <Text style={styles.currentBadge}>CURRENT</Text>}
          <Text style={styles.renewalType}>
            {membershipType.renewalType === 'same_type' ? '🔄 Same Type' :
             membershipType.renewalType === 'upgrade' ? '⬆️ Upgrade' : '⬇️ Downgrade'}
          </Text>
        </View>
        
        <Text style={styles.membershipDescription}>{membershipType.description}</Text>
        
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>Benefits:</Text>
          {membershipType.benefits.slice(0, 3).map((benefit, index) => (
            <Text key={index} style={styles.benefitItem}>• {benefit.name}</Text>
          ))}
          {membershipType.benefits.length > 3 && (
            <Text style={styles.benefitItem}>• +{membershipType.benefits.length - 3} more</Text>
          )}
        </View>

        <View style={styles.pricingContainer}>
          <Text style={styles.creditLimit}>Credit Limit: ₹{membershipType.creditLimit}</Text>
          <Text style={styles.discount}>Discount: {membershipType.discount}%</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderRenewalPeriods = () => {
    if (!selectedMembershipType) return null;

    return (
      <View style={styles.periodsContainer}>
        <Text style={styles.periodsTitle}>Select Renewal Period:</Text>
        {selectedMembershipType.renewalPeriods.map((period) => {
          const isSelected = selectedPeriod?.days === period.days;
          const finalPrice = period.price - (period.price * period.discount / 100);
          
          return (
            <TouchableOpacity
              key={period.days}
              style={[styles.periodCard, isSelected && styles.selectedPeriodCard]}
              onPress={() => setSelectedPeriod(period)}
            >
              <View style={styles.periodHeader}>
                <Text style={styles.periodLabel}>{period.label}</Text>
                {period.discount > 0 && (
                  <Text style={styles.discountBadge}>{period.discount}% OFF</Text>
                )}
              </View>
              
              <View style={styles.priceContainer}>
                <Text style={styles.originalPrice}>₹{period.price}</Text>
                <Text style={styles.finalPrice}>₹{finalPrice}</Text>
                {period.discount > 0 && (
                  <Text style={styles.savings}>Save ₹{period.price - finalPrice}</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  if (!renewalOptions) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading renewal options...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Renew Your Membership</Text>
        <Text style={styles.subtitle}>
          Current membership expires in {renewalOptions.currentMembership.daysUntilExpiry} days
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Choose Membership Type:</Text>
        {renewalOptions.renewalOptions.map(renderMembershipType)}
      </View>

      {renderRenewalPeriods()}

      {selectedMembershipType && selectedPeriod && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Renewal Summary:</Text>
          <Text style={styles.summaryItem}>
            Membership: {selectedMembershipType.name}
          </Text>
          <Text style={styles.summaryItem}>
            Period: {selectedPeriod.label}
          </Text>
          <Text style={styles.summaryItem}>
            Type: {selectedMembershipType.renewalType === 'same_type' ? 'Same Type' :
                   selectedMembershipType.renewalType === 'upgrade' ? 'Upgrade' : 'Downgrade'}
          </Text>
          <Text style={styles.summaryPrice}>
            Total: ₹{selectedPeriod.price - (selectedPeriod.price * selectedPeriod.discount / 100)}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.renewButton,
          (!selectedMembershipType || !selectedPeriod || loading) && styles.disabledButton
        ]}
        onPress={handleRenewal}
        disabled={!selectedMembershipType || !selectedPeriod || loading}
      >
        <Text style={styles.renewButtonText}>
          {loading ? 'Processing...' : 'Renew Membership'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  membershipCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  selectedCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#f8fff8',
  },
  currentCard: {
    borderColor: '#2196F3',
    backgroundColor: '#f3f8ff',
  },
  membershipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  membershipName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  currentBadge: {
    backgroundColor: '#2196F3',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 'bold',
  },
  renewalType: {
    fontSize: 14,
    color: '#666',
  },
  membershipDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  benefitsContainer: {
    marginBottom: 12,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  benefitItem: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  pricingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  creditLimit: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  discount: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: 'bold',
  },
  periodsContainer: {
    marginBottom: 24,
  },
  periodsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  periodCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedPeriodCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#f8fff8',
  },
  periodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  periodLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  discountBadge: {
    backgroundColor: '#FF9800',
    color: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  finalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginRight: 8,
  },
  savings: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: 'bold',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  renewButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  renewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
};

export default MembershipRenewalScreen;
```

---

## Testing & Examples

### 1. Initialize Membership Types

```bash
# Run the initialization script
cd CloversBackend/cloversBackend_06_05
node scripts/initializeMembershipTypes.js
```

### 2. Test API Endpoints

```bash
# Get all membership types
curl -X GET http://localhost:5001/api/renewals/membership-types

# Get user's renewal options
curl -X GET http://localhost:5001/api/renewals/users/USER_ID/renewal-options

# Process renewal (same type)
curl -X POST http://localhost:5001/api/renewals/users/USER_ID/renew-membership \
  -H "Content-Type: application/json" \
  -d '{
    "membershipTypeId": "MEMBERSHIP_TYPE_ID",
    "renewalPeriod": {
      "label": "1 Year",
      "days": 365,
      "price": 1000
    },
    "paymentMethod": "free",
    "renewalReason": "same_type_renewal"
  }'

# Process upgrade
curl -X POST http://localhost:5001/api/renewals/users/USER_ID/renew-membership \
  -H "Content-Type: application/json" \
  -d '{
    "membershipTypeId": "PREMIUM_MEMBERSHIP_TYPE_ID",
    "renewalPeriod": {
      "label": "1 Year",
      "days": 365,
      "price": 2000
    },
    "paymentMethod": "free",
    "renewalReason": "upgrade_to_premium"
  }'
```

### 3. Example Usage Scenarios

#### Scenario 1: Same Type Renewal
```javascript
// User wants to renew their Basic Membership for 1 year
const renewalData = {
  membershipTypeId: "basic_membership_id",
  renewalPeriod: {
    label: "1 Year",
    days: 365,
    price: 1000
  },
  paymentMethod: "free",
  renewalReason: "same_type_renewal"
};
```

#### Scenario 2: Upgrade to Premium
```javascript
// User wants to upgrade from Basic to Premium for 2 years
const renewalData = {
  membershipTypeId: "premium_membership_id",
  renewalPeriod: {
    label: "2 Years",
    days: 730,
    price: 3600
  },
  paymentMethod: "free",
  renewalReason: "upgrade_to_premium"
};
```

#### Scenario 3: Downgrade to Student
```javascript
// User wants to downgrade to Student membership for 6 months
const renewalData = {
  membershipTypeId: "student_membership_id",
  renewalPeriod: {
    label: "6 Months",
    days: 180,
    price: 300
  },
  paymentMethod: "free",
  renewalReason: "downgrade_to_student"
};
```

---

## Admin Management

### 1. Create New Membership Type

```http
POST /api/renewals/admin/membership-types
```

**Request Body:**
```json
{
  "name": "Corporate Membership",
  "description": "Special membership for corporate employees",
  "basePrice": 1500,
  "renewalPeriods": [
    {
      "label": "6 Months",
      "days": 180,
      "price": 1500,
      "discount": 0
    },
    {
      "label": "1 Year",
      "days": 365,
      "price": 3000,
      "discount": 0
    },
    {
      "label": "2 Years",
      "days": 730,
      "price": 5400,
      "discount": 10
    }
  ],
  "benefits": [
    {
      "name": "All Facilities",
      "description": "Access to all facilities",
      "value": "Unlimited"
    },
    {
      "name": "Corporate Events",
      "description": "Access to corporate events",
      "value": "Monthly"
    }
  ],
  "creditLimit": 3000,
  "discount": 12,
  "priority": 2
}
```

### 2. Update Membership Type

```http
PUT /api/renewals/admin/membership-types/:id
```

### 3. Delete Membership Type

```http
DELETE /api/renewals/admin/membership-types/:id
```

---

## Best Practices

### 1. Data Validation

```javascript
// Validate renewal period
const validateRenewalPeriod = (membershipType, renewalPeriod) => {
  const validPeriod = membershipType.renewalPeriods.find(
    period => period.days === renewalPeriod.days
  );
  
  if (!validPeriod) {
    throw new Error('Invalid renewal period selected');
  }
  
  return validPeriod;
};
```

### 2. Error Handling

```javascript
// Comprehensive error handling
const processRenewal = async (req, res) => {
  try {
    // Validation
    if (!req.body.membershipTypeId || !req.body.renewalPeriod) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Process renewal
    const result = await createRenewal(req.body);
    
    res.json({
      success: true,
      message: 'Renewal processed successfully',
      renewal: result
    });

  } catch (error) {
    console.error('Renewal processing error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};
```

### 3. Notification Integration

```javascript
// Send renewal confirmation notification
const sendRenewalNotification = async (userId, renewalData) => {
  try {
    const fcmRecord = await FCMtoken.findOne({ userId, isActive: true });
    
    if (fcmRecord) {
      const title = `🎉 Membership ${renewalData.renewalType} Successfully!`;
      const body = `Your ${renewalData.membershipType} membership is now active until ${renewalData.expiryDate}`;
      
      await sendNotificationToUser({
        userId,
        title,
        body,
        data: {
          type: 'renewal_confirmation',
          renewalId: renewalData.id,
          membershipType: renewalData.membershipType
        }
      });
    }
  } catch (error) {
    console.error('Failed to send renewal notification:', error);
  }
};
```

### 4. Database Optimization

```javascript
// Use aggregation for complex queries
const getMembershipStats = async () => {
  return await Renewal.aggregate([
    {
      $group: {
        _id: '$membershipType',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' }
      }
    },
    {
      $lookup: {
        from: 'membershiptypes',
        localField: '_id',
        foreignField: '_id',
        as: 'membershipType'
      }
    }
  ]);
};
```

---

## Summary

The Flexible Membership Renewal System provides:

✅ **Complete flexibility** in membership type selection  
✅ **Multiple renewal periods** with automatic pricing  
✅ **Upgrade/downgrade** functionality with history tracking  
✅ **Admin management** for membership types  
✅ **Comprehensive API** for frontend integration  
✅ **Notification system** integration  
✅ **Database optimization** with proper indexing  
✅ **Error handling** and validation  

This system allows users to make informed decisions about their membership renewal while providing administrators with full control over membership types and pricing structures.

---

**📝 Note:** This implementation is specifically designed for your CloversClub application and includes all the necessary components for a production-ready flexible membership renewal system.








