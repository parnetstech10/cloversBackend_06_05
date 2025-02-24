import mongoose from 'mongoose';

const subAdminSchema = new mongoose.Schema(
  {
    subAdminId: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['Manager', 'Assistant', 'Co-ordinator'],
    },
  },
  { timestamps: true }
);

// Pre-save hook to generate unique subAdminId
subAdminSchema.pre('save', async function (next) {
  if (!this.subAdminId) {
    const lastSubAdmin = await mongoose
      .model('SubAdmin')
      .findOne({}, { subAdminId: 1 })
      .sort({ createdAt: -1 });

    let newId = 'CCLMSUBA001'; // Default first ID

    if (lastSubAdmin && lastSubAdmin.subAdminId) {
      const lastNumber = parseInt(lastSubAdmin.subAdminId.replace('CCLMSUBA', ''), 10);
      newId = `CCLMSUBA${String(lastNumber + 1).padStart(3, '0')}`;
    }

    this.subAdminId = newId;
  }
  next();
});

const SubAdminModel = mongoose.model('SubAdmin', subAdminSchema);

export default SubAdminModel;
