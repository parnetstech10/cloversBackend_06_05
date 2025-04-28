import FacilityCategory from '../models/FacilityCategory.js';

// Get all facility categories
export const getAllCategories = async (req, res) => {
    try {
        const categories = await FacilityCategory.find().sort({ facilityname: 1 });
        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// Create a new facility category
export const createCategory = async (req, res) => {
    try {
        // Check if a category with the same name already exists
        const existingCategory = await FacilityCategory.findOne({
            facilityname: req.body.facilityname
        });

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                error: 'A facility with this name already exists'
            });
        }

        const category = new FacilityCategory({
            facilityname: req.body.facilityname
        });

        const newCategory = await category.save();
        
        res.status(201).json({
            success: true,
            data: newCategory
        });
    } catch (error) {
        console.error('Error creating facility:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                error: messages
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// Update a facility category
export const updateCategory = async (req, res) => {
    try {
        // Check if another category with the same name already exists
        if (req.body.facilityname) {
            const existingCategory = await FacilityCategory.findOne({
                _id: { $ne: req.params.id }, // Exclude the current category
                facilityname: req.body.facilityname
            });

            if (existingCategory) {
                return res.status(400).json({
                    success: false,
                    error: 'Another facility with this name already exists'
                });
            }
        }

        const category = await FacilityCategory.findById(req.params.id);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Facility not found'
            });
        }
        
        const updatedCategory = await FacilityCategory.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        res.status(200).json({
            success: true,
            data: updatedCategory
        });
    } catch (error) {
        console.error('Error updating facility:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                error: messages
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// Delete a facility category
export const deleteCategory = async (req, res) => {
    try {
        const category = await FacilityCategory.findById(req.params.id);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Facility not found'
            });
        }
        
        await FacilityCategory.findByIdAndDelete(req.params.id);
        
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Error deleting facility:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};