const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');

// Get all users with role and permission details
const getUsers = async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 10 } = req.query;

    let query = {};

    // Search filter
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    // Role filter
    if (role && role !== 'all') {
      query.role = role;
    }

    // Status filter
    if (status && status !== 'all') {
      query.isActive = status === 'active';
    }

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .populate('role', 'name description permissions')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('role', 'name description permissions')
      .select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// Create new user
const createUser = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role, department, permissions } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Verify role exists
    const roleDoc = await Role.findById(role);
    if (!roleDoc) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      role,
      department,
      permissions: permissions || roleDoc.permissions
    });

    await user.save();

    // Update role user count
    await Role.findByIdAndUpdate(role, { $inc: { userCount: 1 } });

    const userResponse = await User.findById(user._id)
      .populate('role', 'name description permissions')
      .select('-password');

    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { username, email, firstName, lastName, role, department, permissions, isActive } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check for duplicate username/email
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
      _id: { $ne: userId }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Handle role change
    if (role && role !== user.role.toString()) {
      const oldRole = await Role.findById(user.role);
      const newRole = await Role.findById(role);

      if (!newRole) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      // Update user counts
      if (oldRole) {
        await Role.findByIdAndUpdate(oldRole._id, { $inc: { userCount: -1 } });
      }
      await Role.findByIdAndUpdate(newRole._id, { $inc: { userCount: 1 } });
    }

    // Update user
    const updateData = {
      username,
      email,
      firstName,
      lastName,
      role,
      department,
      permissions,
      isActive,
      updatedAt: Date.now()
    };

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true })
      .populate('role', 'name description permissions')
      .select('-password');

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update role user count
    if (user.role) {
      await Role.findByIdAndUpdate(user.role, { $inc: { userCount: -1 } });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Get all roles
const getRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort({ name: 1 });
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
};

// Get role by ID
const getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.json(role);
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({ error: 'Failed to fetch role' });
  }
};

// Create new role
const createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    const role = new Role({
      name,
      description,
      permissions
    });

    await role.save();
    res.status(201).json(role);
  } catch (error) {
    console.error('Error creating role:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Role name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create role' });
    }
  }
};

// Update role
const updateRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    const role = await Role.findByIdAndUpdate(
      req.params.id,
      { name, description, permissions, updatedAt: Date.now() },
      { new: true }
    );

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.json(role);
  } catch (error) {
    console.error('Error updating role:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Role name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update role' });
    }
  }
};

// Delete role
const deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Check if role is being used
    const usersCount = await User.countDocuments({ role: req.params.id });
    if (usersCount > 0) {
      return res.status(400).json({ error: 'Cannot delete role that is assigned to users' });
    }

    await Role.findByIdAndDelete(req.params.id);
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
};

// Get all permissions
const getPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find().sort({ module: 1, name: 1 });
    res.json(permissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
};

// Get permission matrix (roles vs permissions)
const getPermissionMatrix = async (req, res) => {
  try {
    const roles = await Role.find().sort({ name: 1 });
    const permissions = await Permission.find().sort({ module: 1, name: 1 });

    const matrix = roles.map(role => ({
      roleId: role._id,
      roleName: role.name,
      permissions: role.permissions
    }));

    res.json({
      roles,
      permissions,
      matrix
    });
  } catch (error) {
    console.error('Error fetching permission matrix:', error);
    res.status(500).json({ error: 'Failed to fetch permission matrix' });
  }
};

// Reset user password
const resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

// Toggle user status
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: user.isActive
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ error: 'Failed to toggle user status' });
  }
};

// Get user statistics
const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    const adminUsers = await User.countDocuments({ role: 'admin' });

    const roles = await Role.find();
    const roleStats = await Promise.all(
      roles.map(async (role) => ({
        roleId: role._id,
        roleName: role.name,
        userCount: role.userCount
      }))
    );

    res.json({
      totalUsers,
      activeUsers,
      inactiveUsers,
      adminUsers,
      roleStats
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
  getPermissionMatrix,
  resetUserPassword,
  toggleUserStatus,
  getUserStats
};
