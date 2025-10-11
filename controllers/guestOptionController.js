import GuestOption from '../models/GuestOption.js';

// Get all options by type
export const getOptionsByType = async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['area', 'activity', 'service'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid option type. Must be area, activity, or service'
      });
    }

    const options = await GuestOption.find({ 
      type: type, 
      status: 'active' 
    }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: options
    });
  } catch (error) {
    console.error('Error fetching options:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch options'
    });
  }
};

// Get all options
export const getAllOptions = async (req, res) => {
  try {
    const { includeInactive = false } = req.query;
    const query = includeInactive ? {} : { status: 'active' };
    
    const options = await GuestOption.find(query).sort({ type: 1, name: 1 });
    
    // Group by type
    const groupedOptions = {
      areas: options.filter(option => option.type === 'area'),
      activities: options.filter(option => option.type === 'activity'),
      services: options.filter(option => option.type === 'service')
    };

    res.status(200).json({
      success: true,
      data: groupedOptions
    });
  } catch (error) {
    console.error('Error fetching all options:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch options'
    });
  }
};

// Create new option
export const createOption = async (req, res) => {
  try {
    const { type, name, description, price, capacity, duration, availability } = req.body;

    // Validate required fields
    if (!type || !name) {
      return res.status(400).json({
        success: false,
        message: 'Type and name are required'
      });
    }

    // Check if option already exists
    const existingOption = await GuestOption.findOne({ type, name });
    if (existingOption) {
      return res.status(400).json({
        success: false,
        message: 'Option with this name already exists for this type'
      });
    }

    const newOption = new GuestOption({
      type,
      name,
      description,
      price: price || 0,
      capacity,
      duration,
      availability: availability || 'available'
    });

    await newOption.save();

    res.status(201).json({
      success: true,
      message: 'Option created successfully',
      data: newOption
    });
  } catch (error) {
    console.error('Error creating option:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create option'
    });
  }
};

// Update option
export const updateOption = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const option = await GuestOption.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!option) {
      return res.status(404).json({
        success: false,
        message: 'Option not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Option updated successfully',
      data: option
    });
  } catch (error) {
    console.error('Error updating option:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update option'
    });
  }
};

// Delete option (soft delete)
export const deleteOption = async (req, res) => {
  try {
    const { id } = req.params;

    const option = await GuestOption.findByIdAndUpdate(
      id,
      { status: 'inactive' },
      { new: true }
    );

    if (!option) {
      return res.status(404).json({
        success: false,
        message: 'Option not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Option deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting option:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete option'
    });
  }
};

// Initialize default options
export const initializeDefaultOptions = async (req, res) => {
  try {
    const defaultOptions = [
      // Areas
      { type: 'area', name: 'Gym', description: 'Fitness center and gymnasium' },
      { type: 'area', name: 'Pool', description: 'Swimming pool area' },
      { type: 'area', name: 'Restaurant', description: 'Main dining restaurant' },
      { type: 'area', name: 'Bar', description: 'Bar and lounge area' },
      { type: 'area', name: 'Lounge', description: 'General lounge area' },
      { type: 'area', name: 'Spa', description: 'Spa and wellness center' },
      { type: 'area', name: 'Tennis Court', description: 'Tennis court facility' },
      { type: 'area', name: 'Squash Court', description: 'Squash court facility' },
      
      // Activities
      { type: 'activity', name: 'Tennis', description: 'Tennis playing activity' },
      { type: 'activity', name: 'Squash', description: 'Squash playing activity' },
      { type: 'activity', name: 'Yoga', description: 'Yoga classes and sessions' },
      { type: 'activity', name: 'Swimming', description: 'Swimming activity' },
      { type: 'activity', name: 'Gym Workout', description: 'Gym workout sessions' },
      { type: 'activity', name: 'Pilates', description: 'Pilates classes' },
      
      // Services
      { type: 'service', name: 'Locker', description: 'Locker rental service' },
      { type: 'service', name: 'Towel', description: 'Towel service' },
      { type: 'service', name: 'Spa Treatment', description: 'Spa treatment services' },
      { type: 'service', name: 'Personal Trainer', description: 'Personal training service' },
      { type: 'service', name: 'Equipment Rental', description: 'Sports equipment rental' },
      { type: 'service', name: 'Valet Parking', description: 'Valet parking service' },
    ];

    // Check if options already exist for each type
    const existingAreas = await GuestOption.countDocuments({ type: 'area' });
    const existingActivities = await GuestOption.countDocuments({ type: 'activity' });
    const existingServices = await GuestOption.countDocuments({ type: 'service' });
    
    if (existingAreas > 0 || existingActivities > 0 || existingServices > 0) {
      return res.status(400).json({
        success: false,
        message: 'Options already exist. Use individual creation instead.'
      });
    }

    await GuestOption.insertMany(defaultOptions);

    res.status(201).json({
      success: true,
      message: 'Default options initialized successfully',
      count: defaultOptions.length
    });
  } catch (error) {
    console.error('Error initializing default options:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize default options'
    });
  }
};
