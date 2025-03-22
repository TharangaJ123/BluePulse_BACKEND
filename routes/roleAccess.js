// routes/roleAccess.js
const express = require('express');
const RoleAccess = require('../models/RoleAccess');
const router = express.Router();
const Employee = require('../models/Employee'); 

// Create a new role access entry
router.post('/', async (req, res) => {
  try {
    const { role_id, role_name, accessible_sections } = req.body;
    const newRoleAccess = new RoleAccess({ role_id, role_name, accessible_sections });
    await newRoleAccess.save();
    res.status(201).json(newRoleAccess);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all role access entries
router.get('/', async (req, res) => {
  try {
    const roleAccessList = await RoleAccess.find();
    res.json(roleAccessList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific role access entry by role_id
router.get('/:role_id', async (req, res) => {
  try {
    const roleAccess = await RoleAccess.findOne({ role_id: req.params.role_id });
    if (!roleAccess) {
      return res.status(404).json({ message: 'Role access not found' });
    }
    res.json(roleAccess);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a role access entry by role_id
router.put('/:role_id', async (req, res) => {
  try {
    const { role_name, accessible_sections } = req.body;
    const updatedRoleAccess = await RoleAccess.findOneAndUpdate(
      { role_id: req.params.role_id },
      { role_name, accessible_sections },
      { new: true }
    );
    if (!updatedRoleAccess) {
      return res.status(404).json({ message: 'Role access not found' });
    }
    res.json(updatedRoleAccess);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a role access entry by role_id
router.delete('/:role_id', async (req, res) => {
  try {
    const deletedRoleAccess = await RoleAccess.findOneAndDelete({ role_id: req.params.role_id });
    if (!deletedRoleAccess) {
      return res.status(404).json({ message: 'Role access not found' });
    }
    res.json({ message: 'Role access deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



// Route to find accessible_sections by role name
router.get('/employees/by-role/:roleName', async (req, res) => {
  try {
    const { roleName } = req.params; // Extract role name from URL parameters

    // Find the role access document with the specified role name
    const roleAccess = await RoleAccess.findOne({ role_name: roleName });

    if (!roleAccess) {
      return res.status(404).json({ error: `No role found with the name: ${roleName}` });
    }

    // Return the accessible_sections for the role
    res.json({
      role: roleAccess.role_name,
      accessible_sections: roleAccess.accessible_sections,
    });
  } catch (err) {
    console.error("Error fetching accessible sections by role:", err);
    res.status(500).json({ error: "Server error" });
  }
});


module.exports = router;