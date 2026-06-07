import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const UserPermission = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [usersData, setUsersData] = useState([]);
  const [rolesData, setRolesData] = useState([]);
  const [permissionsData, setPermissionsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/user-permissions/users');
      setUsersData(response.data);
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', err);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await api.get('/user-permissions/roles');
      setRolesData(response.data);
    } catch (err) {
      setError('Failed to fetch roles');
      console.error('Error fetching roles:', err);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await api.get('/user-permissions/permissions');
      setPermissionsData(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch permissions');
      console.error('Error fetching permissions:', err);
      setLoading(false);
    }
  };

  // Sample user data (fallback)
  const sampleUsersData = [
    {
      id: 1,
      name: 'John Smith',
      email: 'john.smith@store.com',
      role: 'admin',
      status: 'active',
      lastLogin: '2024-01-15 14:30',
      permissions: ['all'],
      department: 'Management'
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      email: 'sarah.j@store.com',
      role: 'manager',
      status: 'active',
      lastLogin: '2024-01-15 12:15',
      permissions: ['sales', 'inventory', 'reports', 'customer_management'],
      department: 'Sales'
    },
    {
      id: 3,
      name: 'Mike Wilson',
      email: 'mike.wilson@store.com',
      role: 'cashier',
      status: 'active',
      lastLogin: '2024-01-15 16:45',
      permissions: ['sales', 'returns'],
      department: 'Sales'
    },
    {
      id: 4,
      name: 'Emily Davis',
      email: 'emily.davis@store.com',
      role: 'inventory_manager',
      status: 'active',
      lastLogin: '2024-01-14 11:20',
      permissions: ['inventory', 'suppliers'],
      department: 'Inventory'
    },
    {
      id: 5,
      name: 'David Brown',
      email: 'david.b@store.com',
      role: 'cashier',
      status: 'inactive',
      lastLogin: '2024-01-10 09:15',
      permissions: ['sales'],
      department: 'Sales'
    },
    {
      id: 6,
      name: 'Lisa Anderson',
      email: 'lisa.a@store.com',
      role: 'report_viewer',
      status: 'active',
      lastLogin: '2024-01-15 10:30',
      permissions: ['reports'],
      department: 'Finance'
    }
  ];

  // Permission categories and their modules
  const permissionModules = {
    sales: {
      name: 'Sales & Transactions',
      permissions: [
        { id: 'process_sales', name: 'Process Sales', description: 'Create and complete sales transactions' },
        { id: 'void_transactions', name: 'Void Transactions', description: 'Cancel or void completed sales' },
        { id: 'apply_discounts', name: 'Apply Discounts', description: 'Apply discounts to sales' },
        { id: 'manage_returns', name: 'Manage Returns', description: 'Process product returns and refunds' },
        { id: 'view_sales_history', name: 'View Sales History', description: 'Access complete sales records' }
      ]
    },
    inventory: {
      name: 'Inventory Management',
      permissions: [
        { id: 'view_inventory', name: 'View Inventory', description: 'View product stock levels' },
        { id: 'manage_products', name: 'Manage Products', description: 'Add, edit, and delete products' },
        { id: 'update_stock', name: 'Update Stock', description: 'Adjust inventory quantities' },
        { id: 'manage_categories', name: 'Manage Categories', description: 'Organize product categories' },
        { id: 'view_low_stock', name: 'View Low Stock Alerts', description: 'Access inventory alerts' }
      ]
    },
    customer_management: {
      name: 'Customer Management',
      permissions: [
        { id: 'view_customers', name: 'View Customers', description: 'Access customer database' },
        { id: 'add_customers', name: 'Add Customers', description: 'Create new customer profiles' },
        { id: 'edit_customers', name: 'Edit Customers', description: 'Modify customer information' },
        { id: 'view_loyalty', name: 'View Loyalty Points', description: 'Check customer loyalty status' },
        { id: 'manage_credits', name: 'Manage Credits', description: 'Handle customer store credits' }
      ]
    },
    reports: {
      name: 'Reports & Analytics',
      permissions: [
        { id: 'view_sales_reports', name: 'View Sales Reports', description: 'Access sales performance reports' },
        { id: 'view_inventory_reports', name: 'View Inventory Reports', description: 'Access stock and inventory reports' },
        { id: 'view_financial_reports', name: 'View Financial Reports', description: 'Access financial statements' },
        { id: 'export_data', name: 'Export Data', description: 'Export reports to various formats' },
        { id: 'view_dashboard', name: 'View Dashboard', description: 'Access main business dashboard' }
      ]
    },
    administration: {
      name: 'System Administration',
      permissions: [
        { id: 'manage_users', name: 'Manage Users', description: 'Add, edit, and delete system users' },
        { id: 'manage_roles', name: 'Manage Roles', description: 'Create and modify user roles' },
        { id: 'system_settings', name: 'System Settings', description: 'Modify system configuration' },
        { id: 'backup_data', name: 'Backup Data', description: 'Perform system data backups' },
        { id: 'view_audit_logs', name: 'View Audit Logs', description: 'Access system activity logs' }
      ]
    },
    suppliers: {
      name: 'Supplier Management',
      permissions: [
        { id: 'view_suppliers', name: 'View Suppliers', description: 'Access supplier information' },
        { id: 'manage_suppliers', name: 'Manage Suppliers', description: 'Add and edit supplier details' },
        { id: 'create_purchase_orders', name: 'Create Purchase Orders', description: 'Generate supplier orders' },
        { id: 'receive_stock', name: 'Receive Stock', description: 'Process incoming inventory' },
        { id: 'view_supplier_reports', name: 'View Supplier Reports', description: 'Access supplier performance data' }
      ]
    }
  };

  // Role templates
  const roleTemplates = {
    admin: {
      name: 'Administrator',
      description: 'Full system access with all permissions',
      permissions: ['all'],
      userCount: 1
    },
    manager: {
      name: 'Store Manager',
      description: 'Management access excluding system administration',
      permissions: ['sales', 'inventory', 'reports', 'customer_management', 'suppliers'],
      userCount: 1
    },
    cashier: {
      name: 'Cashier',
      description: 'Basic sales and transaction processing',
      permissions: ['sales', 'returns'],
      userCount: 2
    },
    inventory_manager: {
      name: 'Inventory Manager',
      description: 'Inventory and stock management',
      permissions: ['inventory', 'suppliers'],
      userCount: 1
    },
    report_viewer: {
      name: 'Report Viewer',
      description: 'Read-only access to reports and analytics',
      permissions: ['reports'],
      userCount: 1
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status) => {
    return status === 'active' ? 'badge bg-success' : 'badge bg-secondary';
  };

  const getRoleBadge = (role) => {
    const colors = {
      admin: 'danger',
      manager: 'warning',
      cashier: 'primary',
      inventory_manager: 'info',
      report_viewer: 'success'
    };
    return `badge bg-${colors[role]}`;
  };

  const getRoleDisplayName = (role) => {
    return roleTemplates[role]?.name || role;
  };

  const currentUsersData = usersData.length > 0 ? usersData : sampleUsersData;

  const filteredUsers = currentUsersData.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const roles = [...new Set(currentUsersData.map(user => user.role))];

  const PermissionMatrix = () => (
    <div className="card">
      <div className="card-header">
        <h5 className="card-title mb-0">Permission Matrix by Role</h5>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Permission Module</th>
                {Object.keys(roleTemplates).map(role => (
                  <th key={role} className="text-center">
                    <div className="fw-bold">{roleTemplates[role].name}</div>
                    <small className="text-muted">{roleTemplates[role].userCount} users</small>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(permissionModules).map(([moduleKey, module]) => (
                <tr key={moduleKey}>
                  <td>
                    <div className="fw-medium">{module.name}</div>
                    <small className="text-muted">{module.permissions.length} permissions</small>
                  </td>
                  {Object.keys(roleTemplates).map(role => (
                    <td key={role} className="text-center align-middle">
                      {roleTemplates[role].permissions.includes('all') || 
                       roleTemplates[role].permissions.includes(moduleKey) ? (
                        <i className="fas fa-check-circle text-success fa-lg"></i>
                      ) : (
                        <i className="fas fa-times-circle text-muted fa-lg"></i>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const UserManagement = () => (
    <div className="card">
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">User Management</h5>
          <button className="btn btn-primary">
            <i className="fas fa-plus me-1"></i> Add New User
          </button>
        </div>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Department</th>
                <th>Permissions</th>
                <th>Last Login</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <div className="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                           style={{ width: '40px', height: '40px' }}>
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="fw-bold">{user.name}</div>
                        <small className="text-muted">{user.email}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={getRoleBadge(user.role)}>
                      {getRoleDisplayName(user.role)}
                    </span>
                  </td>
                  <td>{user.department}</td>
                  <td>
                    <div className="d-flex flex-wrap gap-1">
                      {user.permissions.includes('all') ? (
                        <span className="badge bg-success">All Permissions</span>
                      ) : (
                        user.permissions.slice(0, 3).map(perm => (
                          <span key={perm} className="badge bg-light text-dark">
                            {perm.replace('_', ' ')}
                          </span>
                        ))
                      )}
                      {user.permissions.length > 3 && !user.permissions.includes('all') && (
                        <span className="badge bg-secondary">
                          +{user.permissions.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <small className="text-muted">{formatDate(user.lastLogin)}</small>
                  </td>
                  <td>
                    <span className={getStatusBadge(user.status)}>
                      {user.status}
                    </span>
                  </td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <button className="btn btn-outline-primary" title="Edit User">
                        <i className="fas fa-edit"></i>
                      </button>
                      <button className="btn btn-outline-success" title="Manage Permissions">
                        <i className="fas fa-key"></i>
                      </button>
                      <button className="btn btn-outline-warning" title="Reset Password">
                        <i className="fas fa-lock"></i>
                      </button>
                      <button className={`btn ${user.status === 'active' ? 'btn-outline-danger' : 'btn-outline-success'}`}
                              title={user.status === 'active' ? 'Deactivate' : 'Activate'}>
                        <i className={`fas ${user.status === 'active' ? 'fa-user-slash' : 'fa-user-check'}`}></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const RoleManagement = () => (
    <div className="row">
      <div className="col-12">
        <div className="card mb-4">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Role Templates</h5>
              <button className="btn btn-primary">
                <i className="fas fa-plus me-1"></i> Create New Role
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="row">
              {Object.entries(roleTemplates).map(([roleKey, role]) => (
                <div key={roleKey} className="col-lg-4 col-md-6 mb-3">
                  <div className="card h-100">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h6 className="card-title">{role.name}</h6>
                        <span className="badge bg-primary">{role.userCount} users</span>
                      </div>
                      <p className="card-text small text-muted">{role.description}</p>
                      <div className="mb-3">
                        <small className="text-muted d-block mb-1">Permissions:</small>
                        <div className="d-flex flex-wrap gap-1">
                          {role.permissions.includes('all') ? (
                            <span className="badge bg-success">All Modules</span>
                          ) : (
                            role.permissions.slice(0, 3).map(perm => (
                              <span key={perm} className="badge bg-light text-dark">
                                {perm.replace('_', ' ')}
                              </span>
                            ))
                          )}
                          {role.permissions.length > 3 && !role.permissions.includes('all') && (
                            <span className="badge bg-secondary">
                              +{role.permissions.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="card-footer bg-transparent">
                      <div className="btn-group w-100">
                        <button className="btn btn-outline-primary btn-sm">
                          <i className="fas fa-edit me-1"></i> Edit
                        </button>
                        <button className="btn btn-outline-success btn-sm">
                          <i className="fas fa-copy me-1"></i> Duplicate
                        </button>
                        <button className="btn btn-outline-danger btn-sm">
                          <i className="fas fa-trash me-1"></i> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container-fluid py-3">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <div>
              <h2 className="text-primary">
                <i className="fas fa-user-shield me-2"></i>
                User Permissions & Access Control
              </h2>
              <p className="text-muted mb-0">Manage user roles, permissions, and system access</p>
            </div>
            <div className="d-flex gap-2 mt-2 mt-md-0">
              <button className="btn btn-outline-primary">
                <i className="fas fa-sync-alt me-1"></i> Refresh
              </button>
              <button className="btn btn-primary">
                <i className="fas fa-download me-1"></i> Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-xl-2 col-md-4 col-6 mb-3">
          <div className="card border-primary">
            <div className="card-body text-center p-3">
              <div className="text-primary mb-2">
                <i className="fas fa-users fa-2x"></i>
              </div>
              <h5 className="card-title text-muted mb-1">Total Users</h5>
              <h3 className="text-primary">{currentUsersData.length}</h3>
            </div>
          </div>
        </div>

        <div className="col-xl-2 col-md-4 col-6 mb-3">
          <div className="card border-success">
            <div className="card-body text-center p-3">
              <div className="text-success mb-2">
                <i className="fas fa-user-check fa-2x"></i>
              </div>
              <h5 className="card-title text-muted mb-1">Active Users</h5>
              <h3 className="text-success">{currentUsersData.filter(u => u.status === 'active').length}</h3>
            </div>
          </div>
        </div>

        <div className="col-xl-2 col-md-4 col-6 mb-3">
          <div className="card border-info">
            <div className="card-body text-center p-3">
              <div className="text-info mb-2">
                <i className="fas fa-user-tag fa-2x"></i>
              </div>
              <h5 className="card-title text-muted mb-1">Roles</h5>
              <h3 className="text-info">{Object.keys(roleTemplates).length}</h3>
            </div>
          </div>
        </div>

        <div className="col-xl-2 col-md-4 col-6 mb-3">
          <div className="card border-warning">
            <div className="card-body text-center p-3">
              <div className="text-warning mb-2">
                <i className="fas fa-key fa-2x"></i>
              </div>
              <h5 className="card-title text-muted mb-1">Permission Modules</h5>
              <h3 className="text-warning">{Object.keys(permissionModules).length}</h3>
            </div>
          </div>
        </div>

        <div className="col-xl-2 col-md-4 col-6 mb-3">
          <div className="card border-danger">
            <div className="card-body text-center p-3">
              <div className="text-danger mb-2">
                <i className="fas fa-shield-alt fa-2x"></i>
              </div>
              <h5 className="card-title text-muted mb-1">Admin Users</h5>
              <h3 className="text-danger">{currentUsersData.filter(u => u.role === 'admin').length}</h3>
            </div>
          </div>
        </div>

        <div className="col-xl-2 col-md-4 col-6 mb-3">
          <div className="card border-secondary">
            <div className="card-body text-center p-3">
              <div className="text-secondary mb-2">
                <i className="fas fa-clock fa-2x"></i>
              </div>
              <h5 className="card-title text-muted mb-1">Today's Logins</h5>
              <h3 className="text-secondary">{currentUsersData.filter(u => u.lastLogin.includes('2024-01-15')).length}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body py-2">
              <ul className="nav nav-pills">
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                  >
                    <i className="fas fa-users me-1"></i>
                    User Management
                    <span className="badge bg-primary ms-1">{currentUsersData.length}</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'roles' ? 'active' : ''}`}
                    onClick={() => setActiveTab('roles')}
                  >
                    <i className="fas fa-user-tag me-1"></i>
                    Role Management
                    <span className="badge bg-info ms-1">{Object.keys(roleTemplates).length}</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'permissions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('permissions')}
                  >
                    <i className="fas fa-key me-1"></i>
                    Permission Matrix
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      {activeTab === 'users' && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="fas fa-search"></i>
                      </span>
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="Search users by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <select 
                      className="form-select"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                    >
                      <option value="all">All Roles</option>
                      {roles.map(role => (
                        <option key={role} value={role}>{getRoleDisplayName(role)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <select className="form-select">
                      <option>All Status</option>
                      <option>Active</option>
                      <option>Inactive</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <button className="btn btn-outline-secondary w-100">
                      <i className="fas fa-filter me-1"></i> Filter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="row">
        <div className="col-12">
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'roles' && <RoleManagement />}
          {activeTab === 'permissions' && <PermissionMatrix />}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h6 className="card-title">Quick Security Actions</h6>
              <div className="d-flex flex-wrap gap-2">
                <button className="btn btn-outline-primary">
                  <i className="fas fa-user-plus me-1"></i> Add New User
                </button>
                <button className="btn btn-outline-success">
                  <i className="fas fa-user-tag me-1"></i> Create Role Template
                </button>
                <button className="btn btn-outline-warning">
                  <i className="fas fa-key me-1"></i> Bulk Permission Update
                </button>
                <button className="btn btn-outline-info">
                  <i className="fas fa-file-export me-1"></i> Export User List
                </button>
                <button className="btn btn-outline-danger">
                  <i className="fas fa-shield-alt me-1"></i> Security Audit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPermission;