const express = require('express');
const router = express.Router();
const Equipment = require('../model/equipment');

// GET all equipment
router.get('/', async (req, res) => {
  try {
    const { category, type, available, providerId, minPrice, maxPrice } = req.query;
    
    // Build filter object
    let filter = { isActive: true };
    
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (available !== undefined) filter.available = available === 'true';
    if (providerId) filter.providerId = providerId;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    
    const equipment = await Equipment.find(filter)
      .populate('providerId', 'name businessName rating')
      .sort({ createdAt: -1 });
    
    res.json(equipment);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching equipment', 
      error: error.message 
    });
  }
});

// GET equipment by ID
router.get('/:id', async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id)
      .populate('providerId', 'name businessName phone email rating reviewCount');
    
    if (!equipment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Equipment not found' 
      });
    }
    
    res.json(equipment);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching equipment', 
      error: error.message 
    });
  }
});

// POST create new equipment
router.post('/', async (req, res) => {
  try {
    const { 
      name, category, type, description, price, address,
      providerId, providerEmail, providerName,
      specifications, images, available 
    } = req.body;
    
    // Validate required fields
    if (!name || !category || !type || !price || !address || !providerId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }
    
    // Create new equipment
    const newEquipment = new Equipment({
      name,
      category,
      type,
      description,
      price: parseFloat(price),
      address,
      providerId,
      providerEmail,
      providerName,
      specifications: specifications || {},
      images: images || [],
      available: available !== undefined ? available : true
    });
    
    const savedEquipment = await newEquipment.save();
    
    // Update provider's equipment count
    const Provider = require('../model/provider');
    await Provider.findByIdAndUpdate(
      providerId,
      { $inc: { totalEquipment: 1 } }
    );
    
    res.status(201).json({
      success: true,
      message: 'Equipment created successfully',
      data: savedEquipment
    });
  } catch (error) {
    console.error('Error creating equipment:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Error creating equipment', 
      error: error.message 
    });
  }
});

// PUT update equipment
router.put('/:id', async (req, res) => {
  try {
    const { 
      name, category, type, description, price, address,
      specifications, images, available, condition 
    } = req.body;
    
    const updatedEquipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      { 
        name, category, type, description, 
        price: price ? parseFloat(price) : undefined,
        address, specifications, images, available, condition
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedEquipment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Equipment not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Equipment updated successfully',
      data: updatedEquipment
    });
  } catch (error) {
    console.error('Error updating equipment:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Error updating equipment', 
      error: error.message 
    });
  }
});

// PATCH update equipment (partial update)
router.patch('/:id', async (req, res) => {
  try {
    const updates = req.body;
    
    // Convert price to number if present
    if (updates.price) {
      updates.price = parseFloat(updates.price);
    }
    
    const updatedEquipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!updatedEquipment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Equipment not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Equipment updated successfully',
      data: updatedEquipment
    });
  } catch (error) {
    console.error('Error updating equipment:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Error updating equipment', 
      error: error.message 
    });
  }
});

// DELETE equipment (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      { isActive: false, available: false },
      { new: true }
    );
    
    if (!equipment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Equipment not found' 
      });
    }
    
    // Update provider's equipment count
    const Provider = require('../model/provider');
    await Provider.findByIdAndUpdate(
      equipment.providerId,
      { $inc: { totalEquipment: -1 } }
    );
    
    res.json({
      success: true,
      message: 'Equipment deleted successfully',
      data: equipment
    });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting equipment', 
      error: error.message 
    });
  }
});

// GET equipment by category
router.get('/category/:category', async (req, res) => {
  try {
    const equipment = await Equipment.find({ 
      category: req.params.category,
      isActive: true,
      available: true 
    }).populate('providerId', 'name businessName rating');
    
    res.json({
      success: true,
      data: equipment
    });
  } catch (error) {
    console.error('Error fetching equipment by category:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching equipment by category', 
      error: error.message 
    });
  }
});

// GET equipment search
router.get('/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    const equipment = await Equipment.find({
      $and: [
        { isActive: true },
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { category: { $regex: query, $options: 'i' } },
            { type: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    }).populate('providerId', 'name businessName rating');
    
    res.json({
      success: true,
      data: equipment
    });
  } catch (error) {
    console.error('Error searching equipment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error searching equipment', 
      error: error.message 
    });
  }
});

module.exports = router;
