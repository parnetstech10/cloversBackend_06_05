import benefitModel from "../models/benefitModel.js";

const addBenefit = async (req, res) => {
    const {name} = req.body;
    try {
       const benefit = new benefitModel({name});
        await benefit.save();
        res.status(201).json({ message: 'Benefit added successfully', benefit });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const getBenefit = async (req, res) => {
    try {
        const benefits = await benefitModel.find({});
        res.status(200).json({ message: 'Benefits fetched successfully', data : benefits });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}   







const editBenefit = async (req, res) => {
    const { id } = req.params;
    const {name} = req.body;
    try {
        const benefit = await benefitModel.findById(id);
        if (!benefit) {
            return res.status(404).json({ error: 'Benefit not found' });
        }
        benefit.name = name;
        await benefit.save();
        res.status(200).json({ message: 'Benefit updated successfully', benefit });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}       

const deleteBenefit = async (req, res) => {     
    const { id } = req.params;
    try {
        const benefit = await benefitModel.findByIdAndDelete(id);
        if (!benefit) {
            return res.status(404).json({ error: 'Benefit not found' });
        }        
        res.status(200).json({ message: 'Benefit deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}   

export {addBenefit, getBenefit, editBenefit, deleteBenefit}