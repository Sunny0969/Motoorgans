const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Role name cannot exceed 50 characters']
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  permissions: [{
    type: String,
    enum: [
      // Sales permissions
      'process_sales', 'void_transactions', 'apply_discounts', 'manage_returns', 'view_sales_history',
      // Inventory permissions
      'view_inventory', 'manage_products', 'update_stock', 'manage_categories', 'view_low_stock',
      // Customer permissions
      'view_customers', 'add_customers', 'edit_customers', 'view_loyalty', 'manage_credits',
      // Reports permissions
      'view_sales_reports', 'view_inventory_reports', 'view_financial_reports', 'export_data', 'view_dashboard',
      // Admin permissions
      'manage_users', 'manage_roles', 'system_settings', 'backup_data', 'view_audit_logs',
      // Supplier permissions
      'view_suppliers', 'manage_suppliers', 'create_purchase_orders', 'receive_stock', 'view_supplier_reports'
    ]
  }],
  isSystemRole: {
    type: Boolean,
    default: false
  },
  userCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt on save
roleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Role', roleSchema);
