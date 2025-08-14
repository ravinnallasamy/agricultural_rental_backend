const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Equipment name is required'],
    trim: true,
    maxlength: [200, 'Equipment name cannot exceed 200 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Tractors',
      'Harvesters',
      'Planters',
      'Tillage Equipment',
      'Irrigation Equipment',
      'Hay Equipment',
      'Tools',
      'Spraying Equipment',
      'Fertilizer Equipment',
      'Livestock Equipment',
      'Other'
    ]
  },
  type: {
    type: String,
    required: [true, 'Equipment type is required'],
    enum: [
      // Tractor Types
      'Utility Tractor',
      'Compact Tractor',
      'Row Crop Tractor',
      'Garden Tractor',

      // Harvesting Equipment
      'Combine Harvester',
      'Forage Harvester',
      'Potato Harvester',
      'Sugar Beet Harvester',

      // Planting Equipment
      'Seed Drill',
      'Planter',
      'Transplanter',
      'Broadcasting Equipment',

      // Tillage Equipment
      'Plow',
      'Cultivator',
      'Harrow',
      'Rotary Tiller',
      'Subsoiler',

      // Irrigation Equipment
      'Irrigation Systems',
      'Sprinkler Systems',
      'Drip Irrigation',
      'Center Pivot',

      // Hay Equipment
      'Mower',
      'Rake',
      'Baler',
      'Tedder',

      // General Categories
      'Heavy Equipment',
      'Light Equipment',
      'Hand Tools',
      'Power Tools',
      'Other'
    ]
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  priceUnit: {
    type: String,
    enum: ['hour', 'day', 'week', 'month'],
    default: 'hour'
  },
  address: {
    type: String,
    required: [true, 'Location/Address is required'],
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  available: {
    type: Boolean,
    default: true
  },
  
  // Provider Information
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: [true, 'Provider ID is required']
  },
  providerEmail: {
    type: String,
    required: [true, 'Provider email is required']
  },
  providerName: {
    type: String,
    required: [true, 'Provider name is required']
  },
  
  // Technical Specifications
  specifications: {
    workingWidth: String,
    powerRequirement: String,
    weight: String,
    numberOfRows: String,
    seedBoxCapacity: String,
    fuelType: String,
    enginePower: String,
    operatingWeight: String,
    maxSpeed: String,
    other: mongoose.Schema.Types.Mixed
  },
  
  // Media
  images: [{
    url: String,
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  
  // Rental Information
  minimumRentalPeriod: {
    type: Number,
    default: 1 // in hours
  },
  maximumRentalPeriod: {
    type: Number,
    default: 720 // in hours (30 days)
  },
  
  // Condition and Maintenance
  condition: {
    type: String,
    enum: ['Excellent', 'Good', 'Fair', 'Needs Repair'],
    default: 'Good'
  },
  lastMaintenanceDate: {
    type: Date
  },
  nextMaintenanceDate: {
    type: Date
  },
  
  // Statistics
  totalRentals: {
    type: Number,
    default: 0
  },
  totalRentalHours: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Dates
  addedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for faster queries
equipmentSchema.index({ providerId: 1 });
equipmentSchema.index({ category: 1 });
equipmentSchema.index({ type: 1 });
equipmentSchema.index({ available: 1 });
equipmentSchema.index({ price: 1 });
equipmentSchema.index({ address: 1 });
equipmentSchema.index({ isActive: 1, isVerified: 1 });
equipmentSchema.index({ averageRating: -1 });

// Virtual for equipment's public info
equipmentSchema.virtual('publicInfo').get(function() {
  return {
    id: this._id,
    name: this.name,
    category: this.category,
    type: this.type,
    description: this.description,
    price: this.price,
    priceUnit: this.priceUnit,
    address: this.address,
    available: this.available,
    providerName: this.providerName,
    specifications: this.specifications,
    images: this.images,
    condition: this.condition,
    averageRating: this.averageRating,
    reviewCount: this.reviewCount,
    createdAt: this.createdAt
  };
});

// Pre-save middleware to update lastUpdated
equipmentSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// This model stores equipment information
module.exports = mongoose.model('Equipment', equipmentSchema, 'equipments');
