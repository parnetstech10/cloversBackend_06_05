// scripts/initializeMembershipTypes.js
import mongoose from 'mongoose';
import MembershipType from '../models/MembershipType.js';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cloversclub');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Initialize membership types with flexible pricing
const initializeMembershipTypes = async () => {
  try {
    console.log('🔄 Initializing membership types...');

    // Clear existing membership types
    await MembershipType.deleteMany({});
    console.log('🗑️ Cleared existing membership types');

    // Define membership types with flexible renewal periods
    const membershipTypes = [
      {
        name: 'Basic Membership',
        description: 'Essential membership with basic benefits and facilities access',
        basePrice: 500,
        renewalPeriods: [
          { label: '6 Months', days: 180, price: 500, discount: 0 },
          { label: '1 Year', days: 365, price: 1000, discount: 0 },
          { label: '2 Years', days: 730, price: 1800, discount: 10 },
          { label: '3 Years', days: 1095, price: 2500, discount: 15 }
        ],
        benefits: [
          { name: 'Gym Access', description: 'Access to gym facilities', value: 'Daily' },
          { name: 'Swimming Pool', description: 'Access to swimming pool', value: 'Daily' },
          { name: 'Basic Classes', description: 'Access to basic fitness classes', value: 'Weekly' },
          { name: 'Locker Facility', description: 'Personal locker access', value: 'Daily' }
        ],
        creditLimit: 1000,
        discount: 5,
        priority: 1
      },
      {
        name: 'Premium Membership',
        description: 'Enhanced membership with premium benefits and priority access',
        basePrice: 1000,
        renewalPeriods: [
          { label: '6 Months', days: 180, price: 1000, discount: 0 },
          { label: '1 Year', days: 365, price: 2000, discount: 0 },
          { label: '2 Years', days: 730, price: 3600, discount: 10 },
          { label: '3 Years', days: 1095, price: 5000, discount: 15 }
        ],
        benefits: [
          { name: 'Gym Access', description: 'Access to gym facilities', value: 'Daily' },
          { name: 'Swimming Pool', description: 'Access to swimming pool', value: 'Daily' },
          { name: 'All Classes', description: 'Access to all fitness classes', value: 'Unlimited' },
          { name: 'Personal Trainer', description: '2 sessions per month', value: 'Monthly' },
          { name: 'Spa Access', description: 'Access to spa facilities', value: 'Weekly' },
          { name: 'Priority Booking', description: 'Priority booking for facilities', value: 'Always' }
        ],
        creditLimit: 2500,
        discount: 10,
        priority: 2
      },
      {
        name: 'VIP Membership',
        description: 'Exclusive VIP membership with all premium benefits and exclusive access',
        basePrice: 2000,
        renewalPeriods: [
          { label: '6 Months', days: 180, price: 2000, discount: 0 },
          { label: '1 Year', days: 365, price: 4000, discount: 0 },
          { label: '2 Years', days: 730, price: 7200, discount: 10 },
          { label: '3 Years', days: 1095, price: 10000, discount: 15 }
        ],
        benefits: [
          { name: 'All Facilities', description: 'Access to all facilities', value: 'Unlimited' },
          { name: 'Personal Trainer', description: '4 sessions per month', value: 'Monthly' },
          { name: 'Nutritionist Consultation', description: 'Monthly nutrition consultation', value: 'Monthly' },
          { name: 'Spa & Wellness', description: 'Unlimited spa access', value: 'Unlimited' },
          { name: 'Guest Access', description: 'Bring 2 guests per month', value: 'Monthly' },
          { name: 'Exclusive Events', description: 'Access to VIP events', value: 'Monthly' },
          { name: 'Priority Everything', description: 'Priority booking and service', value: 'Always' }
        ],
        creditLimit: 5000,
        discount: 15,
        priority: 3
      },
      {
        name: 'Student Membership',
        description: 'Special discounted membership for students with valid ID',
        basePrice: 300,
        renewalPeriods: [
          { label: '6 Months', days: 180, price: 300, discount: 0 },
          { label: '1 Year', days: 365, price: 600, discount: 0 },
          { label: '2 Years', days: 730, price: 1080, discount: 10 },
          { label: '3 Years', days: 1095, price: 1500, discount: 15 }
        ],
        benefits: [
          { name: 'Gym Access', description: 'Access to gym facilities', value: 'Daily' },
          { name: 'Swimming Pool', description: 'Access to swimming pool', value: 'Daily' },
          { name: 'Student Classes', description: 'Access to student fitness classes', value: 'Weekly' },
          { name: 'Study Area', description: 'Access to quiet study area', value: 'Daily' }
        ],
        creditLimit: 500,
        discount: 20,
        priority: 0
      },
      {
        name: 'Senior Membership',
        description: 'Special membership for senior citizens (60+ years) with additional health benefits',
        basePrice: 400,
        renewalPeriods: [
          { label: '6 Months', days: 180, price: 400, discount: 0 },
          { label: '1 Year', days: 365, price: 800, discount: 0 },
          { label: '2 Years', days: 730, price: 1440, discount: 10 },
          { label: '3 Years', days: 1095, price: 2000, discount: 15 }
        ],
        benefits: [
          { name: 'Gym Access', description: 'Access to gym facilities', value: 'Daily' },
          { name: 'Swimming Pool', description: 'Access to swimming pool', value: 'Daily' },
          { name: 'Senior Classes', description: 'Access to senior-friendly classes', value: 'Weekly' },
          { name: 'Health Monitoring', description: 'Monthly health check-up', value: 'Monthly' },
          { name: 'Gentle Exercise', description: 'Access to low-impact exercise programs', value: 'Daily' }
        ],
        creditLimit: 800,
        discount: 25,
        priority: 0
      }
    ];

    // Create membership types
    for (const membershipData of membershipTypes) {
      const membershipType = new MembershipType(membershipData);
      await membershipType.save();
      console.log(`✅ Created ${membershipType.name} membership type`);
    }

    console.log('🎉 All membership types initialized successfully!');
    
    // Display summary
    const allTypes = await MembershipType.find({}).sort({ priority: 1 });
    console.log('\n📊 Membership Types Summary:');
    allTypes.forEach(type => {
      console.log(`\n🏷️ ${type.name} (Priority: ${type.priority})`);
      console.log(`   Description: ${type.description}`);
      console.log(`   Base Price: ₹${type.basePrice}`);
      console.log(`   Credit Limit: ₹${type.creditLimit}`);
      console.log(`   Discount: ${type.discount}%`);
      console.log(`   Renewal Periods:`);
      type.renewalPeriods.forEach(period => {
        const finalPrice = period.price - (period.price * period.discount / 100);
        console.log(`     - ${period.label}: ₹${period.price} (${period.days} days)${period.discount > 0 ? ` → ₹${finalPrice} (${period.discount}% off)` : ''}`);
      });
    });

  } catch (error) {
    console.error('❌ Error initializing membership types:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await initializeMembershipTypes();
  
  console.log('\n✅ Initialization completed!');
  process.exit(0);
};

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});








