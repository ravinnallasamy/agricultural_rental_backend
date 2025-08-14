const express = require('express');
const router = express.Router();
const User = require('../model/user');

// GET all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// GET user by ID
router.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    // Check for undefined or invalid ID
    if (!userId || userId === 'undefined' || userId === 'null') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID provided'
      });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
});

// POST create new user
router.post('/', async (req, res) => {
  try {
    const { name, email, password, phone, address, userType } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      password, // In production, hash this password
      phone,
      address,
      userType: userType || 'user'
    });

    const savedUser = await newUser.save();

    // Return user without password
    const userResponse = savedUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
});

// PUT update user
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, address, email } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { name, phone, address, email },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

// PATCH update user (partial update)
router.patch('/:id', async (req, res) => {
  try {
    const updates = req.body;

    // Remove password from updates if present (handle separately)
    if (updates.password) {
      delete updates.password;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

// DELETE user (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: user
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
});

module.exports = router;
