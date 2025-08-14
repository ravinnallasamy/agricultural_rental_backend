const express = require('express');
const router = express.Router();
const Request = require('../model/request');

// GET all requests
router.get('/', async (req, res) => {
  try {
    const { status, customerId, providerId, equipmentId } = req.query;
    
    // Build filter object
    let filter = { isActive: true };
    
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    if (providerId) filter.providerId = providerId;
    if (equipmentId) filter.equipmentId = equipmentId;
    
    const requests = await Request.find(filter)
      .sort({ requestDate: -1 });

    // Don't populate by default to avoid ObjectId issues in frontend
    // Frontend will handle ObjectId comparison properly
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching requests', 
      error: error.message 
    });
  }
});

// GET request by ID
router.get('/:id', async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('customerId', 'name email phone address')
      .populate('providerId', 'name businessName email phone address')
      .populate('equipmentId', 'name category type price specifications');
    
    if (!request) {
      return res.status(404).json({ 
        success: false, 
        message: 'Request not found' 
      });
    }
    
    res.json(request);
  } catch (error) {
    console.error('Error fetching request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching request', 
      error: error.message 
    });
  }
});

// POST create new request
router.post('/', async (req, res) => {
  try {
    console.log('Request creation attempt:', req.body);

    const {
      customerId, customerEmail, customerName, customerMobile,
      equipmentId, equipmentName,
      providerId, providerEmail, providerName,
      startDate, endDate, totalDays, totalHours,
      pricePerDay, pricePerHour, totalAmount,
      message, urgency, deliveryAddress, deliveryRequired,
      specialRequirements, operatorRequired
    } = req.body;

    // Validate required fields
    const requiredFields = { customerId, equipmentId, providerId, startDate, endDate, message };
    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        received: req.body
      });
    }
    
    // Calculate total days if not provided
    let calculatedTotalDays = totalDays;
    if (!calculatedTotalDays && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      calculatedTotalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    }
    
    // Create new request
    const newRequest = new Request({
      customerId,
      customerEmail,
      customerName,
      customerMobile,
      equipmentId,
      equipmentName,
      providerId,
      providerEmail,
      providerName,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalDays: calculatedTotalDays,
      totalHours,
      pricePerDay: pricePerDay ? parseFloat(pricePerDay) : 0,
      pricePerHour: pricePerHour ? parseFloat(pricePerHour) : 0,
      totalAmount: totalAmount ? parseFloat(totalAmount) : 0,
      message,
      urgency: urgency || 'Medium',
      deliveryAddress,
      deliveryRequired: deliveryRequired || false,
      specialRequirements,
      operatorRequired: operatorRequired || false,
      status: 'pending'
    });
    
    const savedRequest = await newRequest.save();
    
    res.status(201).json({
      success: true,
      message: 'Request created successfully',
      data: savedRequest
    });
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Error creating request', 
      error: error.message 
    });
  }
});

// PUT update request
router.put('/:id', async (req, res) => {
  try {
    const { 
      startDate, endDate, totalDays, totalHours,
      pricePerDay, pricePerHour, totalAmount,
      message, urgency, deliveryAddress, deliveryRequired,
      specialRequirements, operatorRequired, status
    } = req.body;
    
    const updateData = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      totalDays,
      totalHours,
      pricePerDay: pricePerDay ? parseFloat(pricePerDay) : undefined,
      pricePerHour: pricePerHour ? parseFloat(pricePerHour) : undefined,
      totalAmount: totalAmount ? parseFloat(totalAmount) : undefined,
      message,
      urgency,
      deliveryAddress,
      deliveryRequired,
      specialRequirements,
      operatorRequired,
      status
    };
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );
    
    const updatedRequest = await Request.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedRequest) {
      return res.status(404).json({ 
        success: false, 
        message: 'Request not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Request updated successfully',
      data: updatedRequest
    });
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Error updating request', 
      error: error.message 
    });
  }
});

// PATCH update request status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, responseMessage, rejectionReason } = req.body;
    
    if (!status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Status is required' 
      });
    }
    
    const updateData = {
      status,
      responseMessage,
      rejectionReason,
      responseDate: new Date()
    };
    
    // Set specific dates based on status
    if (status === 'approved') {
      updateData.approvedDate = new Date();
    } else if (status === 'completed') {
      updateData.completedDate = new Date();
    } else if (status === 'cancelled') {
      updateData.cancelledDate = new Date();
    }
    
    const updatedRequest = await Request.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedRequest) {
      return res.status(404).json({ 
        success: false, 
        message: 'Request not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Request status updated successfully',
      data: updatedRequest
    });
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Error updating request status', 
      error: error.message 
    });
  }
});

// PATCH add feedback
router.patch('/:id/feedback', async (req, res) => {
  try {
    const { customerRating, customerFeedback, providerRating, providerFeedback } = req.body;
    
    const updateData = {};
    if (customerRating) updateData.customerRating = customerRating;
    if (customerFeedback) updateData.customerFeedback = customerFeedback;
    if (providerRating) updateData.providerRating = providerRating;
    if (providerFeedback) updateData.providerFeedback = providerFeedback;
    
    const updatedRequest = await Request.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedRequest) {
      return res.status(404).json({ 
        success: false, 
        message: 'Request not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Feedback added successfully',
      data: updatedRequest
    });
  } catch (error) {
    console.error('Error adding feedback:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Error adding feedback', 
      error: error.message 
    });
  }
});

// DELETE request (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const request = await Request.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!request) {
      return res.status(404).json({ 
        success: false, 
        message: 'Request not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Request deleted successfully',
      data: request
    });
  } catch (error) {
    console.error('Error deleting request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting request', 
      error: error.message 
    });
  }
});

module.exports = router;
