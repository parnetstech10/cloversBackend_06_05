import Feature from '../models/facilityModel.js';

// Create a new feature
export const createFeature = async (req, res) => {
  try {
    const { name, status, type, capacity,price } = req.body;

    const newFeature = new Feature({
      name,
      status,
      type,
      capacity,
      price
    });

    await newFeature.save();
    res.status(201).json({ message: "Feature created successfully", feature: newFeature });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all features
export const getFeatures = async (req, res) => {
  try {
    const features = await Feature.find().sort({_id:-1});
   return res.status(200).json({success:features});
  } catch (error) {
  return  res.status(500).json({ error: error.message });
  }
};

// Update a feature
export const updateFeature = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedFeature = await Feature.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    if (!updatedFeature) {
      return res.status(404).json({ message: "Feature not found" });
    }

    res.status(200).json({ message: "Feature updated successfully", feature: updatedFeature });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a feature
export const deleteFeature = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedFeature = await Feature.findByIdAndDelete(id);

    if (!deletedFeature) {
      return res.status(404).json({ message: "Feature not found" });
    }

    res.status(200).json({ message: "Feature deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

