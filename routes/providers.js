const express = require('express');
const router = express.Router();
const Provider = require('../model/provider');

// GET all providers
router.get('/', async (req, res) => {
  try {
    const providers = await Provider.find({ isActive: true }).select('-password');
    res.json(providers);
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching providers', 
      error: error.message 
    });
  }
});

// GET provider by ID
router.get('/:id', async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id).select('-password');
    if (!provider) {
      return res.status(404).json({ 
        success: false, 
        message: 'Provider not found' 
      });
    }
    res.json(provider);
  } catch (error) {
    console.error('Error fetching provider:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching provider', 
      error: error.message 
    });
  }
});

// POST create new provider
router.post('/', async (req, res) => {
  try {
    const { 
      name, email, password, phone, address, 
      businessName, businessType, licenseNumber,
      serviceArea, experience, certifications 
    } = req.body;
    
    // Check if provider already exists
    const existingProvider = await Provider.findOne({ email });
    if (existingProvider) {
      return res.status(400).json({ 
        success: false, 
        message: 'Provider with this email already exists' 
      });
    }
    
    // Create new provider
    const newProvider = new Provider({
      name,
      email,
      password, // In production, hash this password
      phone,
      address,
      businessName,
      businessType,
      licenseNumber,
      serviceArea,
      experience,
      certifications,
      userType: 'provider'
    });
    
    const savedProvider = await newProvider.save();
    
    // Return provider without password
    const providerResponse = savedProvider.toObject();
    delete providerResponse.password;
    
    res.status(201).json({
      success: true,
      message: 'Provider created successfully',
      data: providerResponse
    });
  } catch (error) {
    console.error('Error creating provider:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Error creating provider', 
      error: error.message 
    });
  }
});

// PUT update provider
router.put('/:id', async (req, res) => {
  try {
    const { 
      name, phone, address, email,
      businessName, businessType, licenseNumber,
      serviceArea, experience, certifications 
    } = req.body;
    
    const updatedProvider = await Provider.findByIdAndUpdate(
      req.params.id,
      { 
        name, phone, address, email,
        businessName, businessType, licenseNumber,
        serviceArea, experience, certifications 
      },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedProvider) {
      return res.status(404).json({ 
        success: false, 
        message: 'Provider not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Provider updated successfully',
      data: updatedProvider
    });
  } catch (error) {
    console.error('Error updating provider:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Error updating provider', 
      error: error.message 
    });
  }
});

// PATCH update provider (partial update)
router.patch('/:id', async (req, res) => {
  try {
    const updates = req.body;
    
    // Remove password from updates if present (handle separately)
    if (updates.password) {
      delete updates.password;
    }
    
    const updatedProvider = await Provider.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedProvider) {
      return res.status(404).json({ 
        success: false, 
        message: 'Provider not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Provider updated successfully',
      data: updatedProvider
    });
  } catch (error) {
    console.error('Error updating provider:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Error updating provider', 
      error: error.message 
    });
  }
});

// DELETE provider (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const provider = await Provider.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');
    
    if (!provider) {
      return res.status(404).json({ 
        success: false, 
        message: 'Provider not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Provider deleted successfully',
      data: provider
    });
  } catch (error) {
    console.error('Error deleting provider:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting provider', 
      error: error.message 
    });
  }
});

// GET provider's equipment
router.get('/:id/equipment', async (req, res) => {
  try {
    const Equipment = require('../model/equipment');
    const mongoose = require('mongoose');
    const providerId = req.params.id;

    // Handle both ObjectId and string comparisons
    const equipment = await Equipment.find({
      $or: [
        { providerId: providerId },
        { providerId: mongoose.Types.ObjectId.isValid(providerId) ? new mongoose.Types.ObjectId(providerId) : null },
        { providerEmail: { $exists: true } } // Fallback for email-based matching
      ],
      isActive: true
    });

    // Additional filtering for cases where providerId is stored as string
    const filteredEquipment = equipment.filter(item =>
      item.providerId?.toString() === providerId.toString()
    );

    res.json({
      success: true,
      data: filteredEquipment,
      count: filteredEquipment.length
    });
  } catch (error) {
    console.error('Error fetching provider equipment:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching provider equipment',
      error: error.message
    });
  }
});

// GET provider's requests
router.get('/:id/requests', async (req, res) => {
  try {
    const Request = require('../model/request');
    const requests = await Request.find({ 
      providerId: req.params.id, 
      isActive: true 
    }).sort({ requestDate: -1 });
    
    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching provider requests:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching provider requests', 
      error: error.message 
    });
  }
});

module.exports = router;
