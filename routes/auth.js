const express = require('express');
const router = express.Router();
const User = require('../model/user');
const Provider = require('../model/provider');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const config = require('../config/config');

// Validate configuration on startup
config.validate();

// Email transporter configuration from centralized config
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.user,
    pass: config.email.pass
  }
});

// USER AUTHENTICATION ROUTES

// User Sign In
router.post('/user/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json("Email and password are required");
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json("User not found");
    }

    if (!user.isActivated) {
      return res.status(400).json("Account not activated. Please check your email.");
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json("Invalid password");
    }

    const token = jwt.sign({
      email: user.email,
      id: user._id,
      userType: 'user'
    }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

    // Return user data for frontend
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      userType: 'user'
    };

    res.status(200).json({
      token,
      user: userData,
      message: "Login successful"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json("Internal Server Error");
  }
});

// User Sign Up
router.post('/user/signup', async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;
    
    console.log('User signup attempt:', email);
    
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json("User email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const activationToken = jwt.sign({ email }, config.jwt.activationSecret);
    
    console.log('Activation token generated:', activationToken);
    
    const mail = {
      from: config.email.from,
      to: email,
      subject: "Welcome to Rental App - Activate Your Account",
      html: `
        <h1>Welcome ${name}!</h1>
        <p>Thank you for joining our Agricultural Equipment Rental Platform.</p>
        <p>Click the link below to activate your account:</p>
        <a href='${config.urls.frontend}/?activate=${activationToken}'>Activate Account</a>
        <p>If the link doesn't work, copy and paste this URL into your browser:</p>
        <p>${config.urls.frontend}/?activate=${activationToken}</p>
      `
    };

    transporter.sendMail(mail, async (err, success) => {
      if (err) {
        console.error('Email sending failed:', err);
        res.status(400).json({ "message": "Failed to send activation email. Please verify your email address." });
      } else {
        const user = new User({
          name,
          email,
          password: hashedPassword,
          phone,
          address,
          userType: 'user',
          token: activationToken
        });

        await user.save();
        res.status(201).json({ 
          "message": "Account created successfully! Please check your email to activate your account.",
          "email": email
        });
      }
    });

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ "message": "Internal server error" });
  }
});

// User Account Activation
router.get('/user/activate/:token', async (req, res) => {
  try {
    const token = req.params.token;
    const decoded = jwt.verify(token, config.jwt.activationSecret);
    
    const user = await User.findOneAndUpdate(
      { email: decoded.email, token: token },
      { 
        $set: {
          isActivated: true,
          token: null
        }
      },
      { new: true }
    );

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired activation link" });
    }

    // Return JSON response for frontend to handle
    res.status(200).json({
      message: "Account activated successfully!",
      email: user.email,
      userType: "user",
      id: user._id
    });

  } catch (err) {
    console.error('Activation error:', err);
    res.status(400).json({ message: "Invalid or expired activation link" });
  }
});

// PROVIDER AUTHENTICATION ROUTES

// Provider Sign In
router.post('/provider/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json("Email and password are required");
    }

    const provider = await Provider.findOne({ email });

    if (!provider) {
      return res.status(400).json("Provider not found");
    }

    if (!provider.isActivated) {
      return res.status(400).json("Account not activated. Please check your email.");
    }

    const valid = await bcrypt.compare(password, provider.password);
    if (!valid) {
      return res.status(400).json("Invalid password");
    }

    const token = jwt.sign({
      email: provider.email,
      id: provider._id,
      userType: 'provider'
    }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

    // Return provider data for frontend
    const providerData = {
      id: provider._id,
      name: provider.name,
      email: provider.email,
      phone: provider.phone,
      address: provider.address,
      businessName: provider.businessName,
      businessType: provider.businessType,
      userType: 'provider'
    };

    res.status(200).json({
      token,
      user: providerData,
      message: "Login successful"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json("Internal Server Error");
  }
});

// Provider Sign Up
router.post('/provider/signup', async (req, res) => {
  try {
    const { 
      name, email, password, phone, address,
      businessName, businessType, licenseNumber 
    } = req.body;
    
    console.log('Provider signup attempt:', email);
    
    const providerExist = await Provider.findOne({ email });
    if (providerExist) {
      return res.status(400).json("Provider email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const activationToken = jwt.sign({ email }, config.jwt.activationSecret);
    
    console.log('Provider activation token generated:', activationToken);
    
    const mail = {
      from: config.email.from,
      to: email,
      subject: "Welcome to Rental App - Provider Account Activation",
      html: `
        <h1>Welcome ${name}!</h1>
        <p>Thank you for joining our Agricultural Equipment Rental Platform as a Provider.</p>
        <p>Business: ${businessName || 'Not specified'}</p>
        <p>Click the link below to activate your provider account:</p>
        <a href='${config.urls.frontend}/?activate=${activationToken}'>Activate Provider Account</a>
        <p>If the link doesn't work, copy and paste this URL into your browser:</p>
        <p>${config.urls.frontend}/?activate=${activationToken}</p>
      `
    };

    transporter.sendMail(mail, async (err, success) => {
      if (err) {
        console.error('Email sending failed:', err);
        res.status(400).json({ "message": "Failed to send activation email. Please verify your email address." });
      } else {
        // Prepare provider data with proper defaults
        const providerData = {
          name,
          email,
          password: hashedPassword,
          phone,
          address,
          businessName: businessName || '',
          licenseNumber: licenseNumber || '',
          userType: 'provider',
          token: activationToken
        };

        // Only set businessType if it's not empty, let the model handle the default
        if (businessType && businessType.trim() !== '') {
          providerData.businessType = businessType;
        }

        const provider = new Provider(providerData);

        await provider.save();
        res.status(201).json({ 
          "message": "Provider account created successfully! Please check your email to activate your account.",
          "email": email
        });
      }
    });

  } catch (err) {
    console.error('Provider signup error:', err);
    res.status(500).json({ "message": "Internal server error" });
  }
});

// Provider Account Activation
router.get('/provider/activate/:token', async (req, res) => {
  try {
    const token = req.params.token;
    const decoded = jwt.verify(token, config.jwt.activationSecret);
    
    const provider = await Provider.findOneAndUpdate(
      { email: decoded.email, token: token },
      { 
        $set: {
          isActivated: true,
          token: null
        }
      },
      { new: true }
    );

    if (!provider) {
      return res.status(400).json({ message: "Invalid or expired activation link" });
    }

    // Return JSON response for frontend to handle
    res.status(200).json({
      message: "Provider account activated successfully!",
      email: provider.email,
      userType: "provider",
      id: provider._id
    });

  } catch (err) {
    console.error('Provider activation error:', err);
    res.status(400).json({ message: "Invalid or expired activation link" });
  }
});

// Password verification endpoint for profile updates
router.post('/verify-password', async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    console.log('Password verification request:', { email, userType, hasPassword: !!password });

    if (!email || !password || !userType) {
      console.log('Missing required fields:', { email: !!email, password: !!password, userType: !!userType });
      return res.status(400).json({
        success: false,
        message: "Email, password, and userType are required",
        received: { email: !!email, password: !!password, userType: !!userType }
      });
    }

    let user;
    if (userType === 'provider') {
      user = await Provider.findOne({ email });
    } else {
      user = await User.findOne({ email });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    res.json({
      success: true,
      isValid: isValidPassword
    });

  } catch (err) {
    console.error('Password verification error:', err);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

module.exports = router;
