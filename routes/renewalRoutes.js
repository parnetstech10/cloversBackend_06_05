// routes/renewalRoutes.js
import express from 'express';
import Renewal from '../models/Renewal.js';
import User from '../models/User.js';
import FCMtoken from '../models/FCMtoken.js';
import MembershipType from '../models/MembershipType.js';
import mongoose from 'mongoose';
import { triggerMembershipExpiryCheck } from '../utils/membershipExpiryScheduler.js';

const router = express.Router();

// Update FCM token for user
router.post('/users/update-fcm-token', async (req, res) => {
  try {
    const { userId, fcmToken, platform } = req.body;
    
    if (!userId || !fcmToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID and FCM token are required' 
      });
    }

    // Update user's FCM token
    const user = await User.findByIdAndUpdate(
      userId, 
      { fcmToken, platform: platform || 'android' },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'FCM token updated successfully' 
    });
  } catch (error) {
    console.error('Error updating FCM token:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get membership expiry info
router.get('/users/:userId/membership', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const renewal = await Renewal.findOne({ membershipId: userId })
      .sort({ createdAt: -1 });

    if (!renewal) {
      return res.status(404).json({ 
        success: false, 
        error: 'Membership not found' 
      });
    }

    res.json({ 
      success: true, 
      membershipInfo: {
        membershipType: renewal.membershipName,
        amount: renewal.amount,
        expiryDate: renewal.membershipExpairy,
        status: renewal.status,
        autoRenewal: renewal.autoRenewal || false,
        fcmToken: renewal.fcmToken
      }
    });
  } catch (error) {
    console.error('Error getting membership info:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get active memberships for expiry check
router.get('/memberships/active', async (req, res) => {
  try {
    const activeMemberships = await Renewal.find({ 
      status: 'Approved',
      membershipExpairy: { $gte: new Date() } // Not expired yet
    }).populate('membershipId', 'Member_Name Mobile_Number email');

    res.json(activeMemberships);
  } catch (error) {
    console.error('Error getting active memberships:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Update notification sent status
router.put('/memberships/:id/notification-sent', async (req, res) => {
  try {
    const { id } = req.params;
    const { daysBeforeExpiry, sentDate, notificationType } = req.body;

    const renewal = await Renewal.findById(id);
    if (!renewal) {
      return res.status(404).json({ 
        success: false, 
        error: 'Membership not found' 
      });
    }

    // Add notification record
    if (!renewal.expiryNotifications) {
      renewal.expiryNotifications = [];
    }

    renewal.expiryNotifications.push({
      sentDate: sentDate || new Date(),
      daysBeforeExpiry,
      notificationType: notificationType || 'expiry_reminder'
    });

    renewal.lastNotificationDate = new Date();
    renewal.notificationSent = true;

    await renewal.save();

    res.json({ 
      success: true, 
      message: 'Notification status updated' 
    });
  } catch (error) {
    console.error('Error updating notification status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Update payment success
router.put('/memberships/:id/payment-success', async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionId, paymentId, amount, paymentMethod, renewedAt } = req.body;

    const renewal = await Renewal.findById(id);
    if (!renewal) {
      return res.status(404).json({ 
        success: false, 
        error: 'Membership not found' 
      });
    }

    renewal.payId = paymentId;
    renewal.transactionId = transactionId;
    renewal.paymentStatus = 'success';
    renewal.status = 'Approved';
    renewal.amount = amount;
    renewal.updatedAt = new Date();

    // Extend membership expiry by 1 year
    const newExpiryDate = new Date();
    newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);
    renewal.membershipExpairy = newExpiryDate;

    await renewal.save();

    res.json({ 
      success: true, 
      message: 'Payment status updated successfully',
      newExpiryDate: newExpiryDate
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Extend membership expiry
router.put('/memberships/:id/extend-expiry', async (req, res) => {
  try {
    const { id } = req.params;
    const { newExpiryDate, transactionId, renewalType } = req.body;

    const renewal = await Renewal.findById(id);
    if (!renewal) {
      return res.status(404).json({ 
        success: false, 
        error: 'Membership not found' 
      });
    }

    renewal.membershipExpairy = new Date(newExpiryDate);
    renewal.transactionId = transactionId;
    renewal.renewalType = renewalType || 'manual';
    renewal.status = 'Approved';
    renewal.updatedAt = new Date();

    await renewal.save();

    res.json({ 
      success: true, 
      message: 'Membership expiry extended successfully',
      newExpiryDate: renewal.membershipExpairy
    });
  } catch (error) {
    console.error('Error extending membership:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Update payment status
router.put('/memberships/:id/payment-status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, transactionId, updatedAt } = req.body;

    const renewal = await Renewal.findById(id);
    if (!renewal) {
      return res.status(404).json({ 
        success: false, 
        error: 'Membership not found' 
      });
    }

    renewal.paymentStatus = status;
    renewal.transactionId = transactionId;
    renewal.updatedAt = new Date(updatedAt);

    await renewal.save();

    res.json({ 
      success: true, 
      message: 'Payment status updated successfully' 
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Update renewal status
router.put('/memberships/:id/renewal-status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, transactionId, updatedAt } = req.body;

    const renewal = await Renewal.findById(id);
    if (!renewal) {
      return res.status(404).json({ 
        success: false, 
        error: 'Membership not found' 
      });
    }

    renewal.status = status;
    renewal.transactionId = transactionId;
    renewal.updatedAt = new Date(updatedAt);

    await renewal.save();

    res.json({ 
      success: true, 
      message: 'Renewal status updated successfully' 
    });
  } catch (error) {
    console.error('Error updating renewal status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Create new renewal
router.post('/renewals', async (req, res) => {
  try {
    const renewalData = req.body;
    
    // Add default expiry date if not provided (1 year from now)
    if (!renewalData.membershipExpairy) {
      const defaultExpiry = new Date();
      defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);
      renewalData.membershipExpairy = defaultExpiry;
    }
    
    // Ensure status is set to Pending if not provided
    if (!renewalData.status) {
      renewalData.status = 'Pending';
    }
    
    const renewal = new Renewal(renewalData);
    await renewal.save();

    res.json({ 
      success: true, 
      renewalId: renewal._id,
      message: 'Renewal created successfully',
      _id: renewal._id,
      id: renewal._id
    });
  } catch (error) {
    console.error('Error creating renewal:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Update renewal
router.put('/renewals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const renewal = await Renewal.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true }
    );

    if (!renewal) {
      return res.status(404).json({ 
        success: false, 
        error: 'Renewal not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Renewal updated successfully' 
    });
  } catch (error) {
    console.error('Error updating renewal:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Setup automatic renewal
router.post('/renewals/auto-renewal', async (req, res) => {
  try {
    const { userId, membershipId, paymentMethodId } = req.body;

    const renewal = await Renewal.findOne({ membershipId });
    if (!renewal) {
      return res.status(404).json({ 
        success: false, 
        error: 'Membership not found' 
      });
    }

    renewal.autoRenewal = true;
    renewal.paymentMethodId = paymentMethodId;
    renewal.updatedAt = new Date();

    await renewal.save();

    res.json({ 
      success: true, 
      message: 'Automatic renewal set up successfully' 
    });
  } catch (error) {
    console.error('Error setting up automatic renewal:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Cancel automatic renewal
router.delete('/renewals/auto-renewal/:userId/:membershipId', async (req, res) => {
  try {
    const { userId, membershipId } = req.params;

    const renewal = await Renewal.findOne({ membershipId });
    if (!renewal) {
      return res.status(404).json({ 
        success: false, 
        error: 'Membership not found' 
      });
    }

    renewal.autoRenewal = false;
    renewal.paymentMethodId = null;
    renewal.updatedAt = new Date();

    await renewal.save();

    res.json({ 
      success: true, 
      message: 'Automatic renewal cancelled successfully' 
    });
  } catch (error) {
    console.error('Error cancelling automatic renewal:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get renewal history for user
router.get('/renewals/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const renewals = await Renewal.find({ membershipId: userId })
      .sort({ createdAt: -1 });

    res.json({ 
      success: true, 
      renewals 
    });
  } catch (error) {
    console.error('Error getting renewal history:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Payment method routes
router.post('/users/payment-methods', async (req, res) => {
  try {
    const { userId, paymentMethod, cardDetails, upiId } = req.body;

    // In a real implementation, you would save this to a PaymentMethod model
    // For now, we'll just return a success response
    const paymentMethodId = `PM_${Date.now()}`;

    res.json({ 
      success: true, 
      paymentMethodId,
      message: 'Payment method saved successfully' 
    });
  } catch (error) {
    console.error('Error saving payment method:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

router.get('/users/:userId/payment-methods', async (req, res) => {
  try {
    const { userId } = req.params;

    // In a real implementation, you would fetch from PaymentMethod model
    // For now, we'll return mock data
    const paymentMethods = [
      {
        id: 'PM_123456',
        type: 'card',
        lastFour: '1234',
        expiryMonth: '12',
        expiryYear: '2025',
        cardHolderName: 'John Doe'
      }
    ];

    res.json({ 
      success: true, 
      paymentMethods 
    });
  } catch (error) {
    console.error('Error getting payment methods:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

router.delete('/users/:userId/payment-methods/:methodId', async (req, res) => {
  try {
    const { userId, methodId } = req.params;

    // In a real implementation, you would delete from PaymentMethod model
    res.json({ 
      success: true, 
      message: 'Payment method deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Test notification endpoint
router.post('/test-notification', async (req, res) => {
  try {
    const { fcmToken, title, body } = req.body;

    // This would typically call your Firebase Cloud Function
    // For testing purposes, we'll just return success
    res.json({ 
      success: true, 
      message: 'Test notification sent successfully' 
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Test expiry notifications (for development/testing)
router.post('/test-expiry-notifications', async (req, res) => {
  try {
    console.log('🧪 Testing expiry notifications...');
    const result = await triggerMembershipExpiryCheck();
    
    res.json({ 
      success: true, 
      message: 'Expiry notification test completed',
      result: result
    });
  } catch (error) {
    console.error('Error testing expiry notifications:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get membership statistics
router.get('/statistics', async (req, res) => {
  try {
    const today = new Date();
    
    // Get all memberships
    const allMemberships = await Renewal.find({
      membershipExpairy: { $exists: true, $ne: null }
    });

    // Calculate statistics
    const stats = {
      total: allMemberships.length,
      active: allMemberships.filter(m => m.status === 'Approved').length,
      pending: allMemberships.filter(m => m.status === 'Pending').length,
      expired: allMemberships.filter(m => {
        const expiryDate = new Date(m.membershipExpairy);
        return expiryDate < today;
      }).length,
      expiringIn30Days: allMemberships.filter(m => {
        const expiryDate = new Date(m.membershipExpairy);
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
      }).length,
      expiringIn7Days: allMemberships.filter(m => {
        const expiryDate = new Date(m.membershipExpairy);
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
      }).length
    };

    res.json({ 
      success: true, 
      statistics: stats
    });
  } catch (error) {
    console.error('Error getting membership statistics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Enhanced membership info endpoint with expiry details
router.get('/users/:userId/membership-enhanced', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const renewal = await Renewal.findOne({ membershipId: userId })
      .sort({ createdAt: -1 });

    if (!renewal) {
      return res.status(404).json({ 
        success: false, 
        error: 'Membership not found' 
      });
    }

    // Calculate days until expiry
    const today = new Date();
    const expiryDate = new Date(renewal.membershipExpairy);
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

    res.json({ 
      success: true, 
      membershipInfo: {
        membershipType: renewal.membershipName,
        amount: renewal.amount,
        expiryDate: renewal.membershipExpairy,
        status: renewal.status,
        autoRenewal: renewal.autoRenewal || false,
        fcmToken: renewal.fcmToken,
        daysUntilExpiry: daysUntilExpiry,
        isExpired: daysUntilExpiry <= 0,
        isExpiringSoon: daysUntilExpiry <= 30 && daysUntilExpiry > 0,
        expiryNotifications: renewal.expiryNotifications || [],
        renewalId: renewal._id,
        benefits: renewal.benefit || [],
        creditLimit: renewal.creditLimit || 0,
        discount: renewal.discount || 0
      }
    });
  } catch (error) {
    console.error('Error getting enhanced membership info:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Free renewal endpoint (no payment required)
router.post('/memberships/:id/free-renewal', async (req, res) => {
  try {
    const { id } = req.params;
    const { renewalReason, renewalPeriod = 365 } = req.body; // Default 1 year

    const renewal = await Renewal.findById(id);
    if (!renewal) {
      return res.status(404).json({ 
        success: false, 
        error: 'Membership not found' 
      });
    }

    const oldExpiryDate = renewal.membershipExpairy;
    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + renewalPeriod); // Add renewal period in days

    renewal.membershipExpairy = newExpiryDate;
    renewal.transactionId = `FREE_RENEWAL_${Date.now()}`;
    renewal.renewalType = 'manual';
    renewal.status = 'Approved';
    renewal.paymentStatus = 'success';
    renewal.updatedAt = new Date();

    // Clear previous expiry notifications for new membership period
    renewal.expiryNotifications = [];
    renewal.lastNotificationDate = null;

    await renewal.save();

    res.json({ 
      success: true, 
      message: 'Free renewal completed successfully',
      oldExpiryDate: oldExpiryDate,
      newExpiryDate: renewal.membershipExpairy,
      renewalReason: renewalReason || 'Manual free renewal',
      renewalPeriod: renewalPeriod
    });
  } catch (error) {
    console.error('Error processing free renewal:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get all available membership types with pricing
router.get('/membership-types', async (req, res) => {
  try {
    const membershipTypes = await MembershipType.find({ isActive: true })
      .sort({ priority: 1 });

    res.json({
      success: true,
      membershipTypes: membershipTypes.map(type => ({
        id: type._id,
        name: type.name,
        description: type.description,
        basePrice: type.basePrice,
        renewalPeriods: type.renewalPeriods,
        benefits: type.benefits,
        creditLimit: type.creditLimit,
        discount: type.discount
      }))
    });
  } catch (error) {
    console.error('Error getting membership types:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get user's current membership with renewal options
router.get('/users/:userId/renewal-options', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user's current membership
    const currentMembership = await Renewal.findOne({ membershipId: userId })
      .populate('membershipType')
      .sort({ createdAt: -1 });

    if (!currentMembership) {
      return res.status(404).json({
        success: false,
        error: 'No membership found for this user'
      });
    }

    // Get all available membership types
    const allMembershipTypes = await MembershipType.find({ isActive: true })
      .sort({ priority: 1 });

    // Calculate renewal options
    const renewalOptions = allMembershipTypes.map(type => {
      const isCurrentType = type._id.toString() === currentMembership.membershipType._id.toString();
      
      return {
        id: type._id,
        name: type.name,
        description: type.description,
        isCurrentType: isCurrentType,
        renewalPeriods: type.renewalPeriods.map(period => ({
          label: period.label,
          days: period.days,
          price: period.price,
          discount: period.discount,
          finalPrice: period.price - (period.price * period.discount / 100)
        })),
        benefits: type.benefits,
        creditLimit: type.creditLimit,
        discount: type.discount,
        renewalType: isCurrentType ? 'same_type' : 
                    (type.priority > currentMembership.membershipType.priority ? 'upgrade' : 'downgrade')
      };
    });

    // Calculate days until expiry
    const today = new Date();
    const expiryDate = new Date(currentMembership.membershipExpairy);
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

    res.json({
      success: true,
      currentMembership: {
        id: currentMembership._id,
        membershipType: currentMembership.membershipTypeName,
        expiryDate: currentMembership.membershipExpairy,
        daysUntilExpiry: daysUntilExpiry,
        isExpired: daysUntilExpiry <= 0,
        isExpiringSoon: daysUntilExpiry <= 30 && daysUntilExpiry > 0,
        status: currentMembership.status,
        benefits: currentMembership.benefit || [],
        creditLimit: currentMembership.creditLimit || 0,
        discount: currentMembership.discount || 0
      },
      renewalOptions: renewalOptions
    });

  } catch (error) {
    console.error('Error getting renewal options:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Process flexible membership renewal
router.post('/users/:userId/renew-membership', async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      membershipTypeId, 
      renewalPeriod, 
      paymentMethod = 'free', // 'free', 'card', 'upi', etc.
      transactionId,
      renewalReason = 'manual_renewal'
    } = req.body;

    if (!membershipTypeId || !renewalPeriod) {
      return res.status(400).json({
        success: false,
        error: 'Membership type and renewal period are required'
      });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get membership type details
    const membershipType = await MembershipType.findById(membershipTypeId);
    if (!membershipType) {
      return res.status(404).json({
        success: false,
        error: 'Membership type not found'
      });
    }

    // Validate renewal period
    const selectedPeriod = membershipType.renewalPeriods.find(
      period => period.days === renewalPeriod.days
    );
    
    if (!selectedPeriod) {
      return res.status(400).json({
        success: false,
        error: 'Invalid renewal period selected'
      });
    }

    // Get current membership
    const currentMembership = await Renewal.findOne({ membershipId: userId })
      .populate('membershipType')
      .sort({ createdAt: -1 });

    // Calculate new expiry date
    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + renewalPeriod.days);

    // Determine renewal type
    let renewalType = 'same_type';
    let isUpgrade = false;
    let isDowngrade = false;

    if (currentMembership) {
      if (currentMembership.membershipType._id.toString() !== membershipTypeId) {
        if (membershipType.priority > currentMembership.membershipType.priority) {
          renewalType = 'upgrade';
          isUpgrade = true;
        } else {
          renewalType = 'downgrade';
          isDowngrade = true;
        }
      }
    }

    // Create new renewal record
    const newRenewal = new Renewal({
      userName: user.Member_Name,
      membershipId: userId,
      membershipName: membershipType.name,
      membershipType: membershipTypeId,
      membershipTypeName: membershipType.name,
      amount: selectedPeriod.price,
      renewalPeriod: {
        label: selectedPeriod.label,
        days: selectedPeriod.days,
        price: selectedPeriod.price
      },
      membershipExpairy: newExpiryDate,
      benefit: membershipType.benefits,
      creditLimit: membershipType.creditLimit,
      discount: membershipType.discount,
      status: paymentMethod === 'free' ? 'Approved' : 'Pending',
      transactionId: transactionId || `RENEWAL_${Date.now()}`,
      paymentStatus: paymentMethod === 'free' ? 'success' : 'pending',
      renewalType: 'manual',
      previousMembershipType: currentMembership?.membershipType?._id,
      renewalReason: renewalReason,
      isUpgrade: isUpgrade,
      isDowngrade: isDowngrade,
      // Clear previous expiry notifications for new membership period
      expiryNotifications: [],
      lastNotificationDate: null
    });

    await newRenewal.save();

    // Update user's FCM token if provided
    if (req.body.fcmToken) {
      await FCMtoken.findOneAndUpdate(
        { userId: userId },
        { 
          fcmToken: req.body.fcmToken,
          platform: req.body.platform || 'android',
          isActive: true,
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      );
    }

    // Send confirmation notification
    try {
      const fcmRecord = await FCMtoken.findOne({ userId: userId, isActive: true });
      if (fcmRecord) {
        const notificationTitle = `🎉 Membership ${renewalType === 'same_type' ? 'Renewed' : renewalType === 'upgrade' ? 'Upgraded' : 'Changed'} Successfully!`;
        const notificationBody = `Your ${membershipType.name} membership is now active until ${newExpiryDate.toLocaleDateString()}`;
        
        // This would typically call your notification service
        console.log('📱 Sending renewal confirmation notification:', {
          userId,
          title: notificationTitle,
          body: notificationBody
        });
      }
    } catch (notificationError) {
      console.log('⚠️ Failed to send renewal notification:', notificationError.message);
    }

    res.json({
      success: true,
      message: `Membership ${renewalType === 'same_type' ? 'renewed' : renewalType === 'upgrade' ? 'upgraded' : 'changed'} successfully`,
      renewal: {
        id: newRenewal._id,
        membershipType: membershipType.name,
        renewalPeriod: selectedPeriod.label,
        amount: selectedPeriod.price,
        expiryDate: newExpiryDate,
        status: newRenewal.status,
        renewalType: renewalType,
        isUpgrade: isUpgrade,
        isDowngrade: isDowngrade,
        benefits: membershipType.benefits,
        creditLimit: membershipType.creditLimit,
        discount: membershipType.discount
      }
    });

  } catch (error) {
    console.error('Error processing membership renewal:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get membership renewal history for user
router.get('/users/:userId/renewal-history', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const renewals = await Renewal.find({ membershipId: userId })
      .populate('membershipType')
      .populate('previousMembershipType')
      .sort({ createdAt: -1 });

    const renewalHistory = renewals.map(renewal => ({
      id: renewal._id,
      membershipType: renewal.membershipTypeName,
      renewalPeriod: renewal.renewalPeriod?.label || 'N/A',
      amount: renewal.amount,
      expiryDate: renewal.membershipExpairy,
      status: renewal.status,
      renewalType: renewal.renewalType,
      renewalReason: renewal.renewalReason,
      isUpgrade: renewal.isUpgrade,
      isDowngrade: renewal.isDowngrade,
      createdAt: renewal.createdAt,
      benefits: renewal.benefit || [],
      creditLimit: renewal.creditLimit || 0,
      discount: renewal.discount || 0
    }));

    res.json({
      success: true,
      renewalHistory: renewalHistory
    });

  } catch (error) {
    console.error('Error getting renewal history:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create membership type (Admin only)
router.post('/admin/membership-types', async (req, res) => {
  try {
    const {
      name,
      description,
      basePrice,
      renewalPeriods,
      benefits,
      creditLimit,
      discount,
      priority
    } = req.body;

    const membershipType = new MembershipType({
      name,
      description,
      basePrice,
      renewalPeriods,
      benefits,
      creditLimit,
      discount,
      priority: priority || 0
    });

    await membershipType.save();

    res.json({
      success: true,
      message: 'Membership type created successfully',
      membershipType: membershipType
    });

  } catch (error) {
    console.error('Error creating membership type:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update membership type (Admin only)
router.put('/admin/membership-types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const membershipType = await MembershipType.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!membershipType) {
      return res.status(404).json({
        success: false,
        error: 'Membership type not found'
      });
    }

    res.json({
      success: true,
      message: 'Membership type updated successfully',
      membershipType: membershipType
    });

  } catch (error) {
    console.error('Error updating membership type:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete membership type (Admin only)
router.delete('/admin/membership-types/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if any active renewals use this membership type
    const activeRenewals = await Renewal.countDocuments({
      membershipType: id,
      status: { $in: ['Active', 'Approved'] }
    });

    if (activeRenewals > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete membership type with active memberships'
      });
    }

    const membershipType = await MembershipType.findByIdAndDelete(id);

    if (!membershipType) {
      return res.status(404).json({
        success: false,
        error: 'Membership type not found'
      });
    }

    res.json({
      success: true,
      message: 'Membership type deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting membership type:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;

