const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    leadId: {
      type: String,
      unique: true,
      sparse: true,
    },
    formId: String,
    pageId: String,
    name: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    rawFields: {
      type: Object,
      default: {},
    },
    source: {
      type: String,
      enum: ['meta', 'manual'],
      default: 'meta',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Lead', leadSchema);
