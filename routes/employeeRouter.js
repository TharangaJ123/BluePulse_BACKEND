const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const bcrypt = require('bcrypt');

// Utility function to handle errors
const handleError = (res, status, message) => {
  return res.status(status).json({ error: message });
};

router.post('/register', async (req, res) => {
  try {
    const { full_name, email, password, phone_number, employee_position, user_role } = req.body;

    // Check if the email already exists
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return handleError(res, 400, 'Email already exists');
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create a new employee
    const newEmployee = new Employee({
      full_name,
      email,
      password_hash,
      phone_number: phone_number || null,
      employee_position: employee_position || null,
      user_role: user_role || 'employee',
      status: 'active', // Default status
    });

    // Save the employee to the database
    const savedEmployee = await newEmployee.save();

    // Return the employee (excluding the password hash)
    const employeeResponse = savedEmployee.toObject ? savedEmployee.toObject() : savedEmployee;
    delete employeeResponse.password_hash;

    res.status(201).json(employeeResponse);
  } catch (err) {
    handleError(res, 500, 'Server error');
  }
});

// Get all employees
router.get('/employees', async (req, res) => {
  try {
    const employees = await Employee.find({}, { password_hash: 0 });
    res.json(employees);
  } catch (err) {
    handleError(res, 500, 'Server error');
  }
});

// Get a single employee by ID
router.get('/employees/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id, { password_hash: 0 });
    if (!employee) {
      return handleError(res, 404, 'Employee not found');
    }
    res.json(employee);
  } catch (err) {
    handleError(res, 500, 'Server error');
  }
});

// Update an employee by ID
router.put('/employees/:id', async (req, res) => {
  try {
    const { full_name, email, phone_number, position, department, status, password } = req.body;

    // Check if the employee exists
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return handleError(res, 404, 'Employee not found');
    }

    // Update employee fields
    if (full_name) employee.full_name = full_name;
    if (email) employee.email = email;
    if (phone_number) employee.phone_number = phone_number;
    if (position) employee.position = position;
    if (department) employee.department = department;
    if (status) employee.status = status;

    // Hash the new password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      employee.password_hash = await bcrypt.hash(password, salt);
    }

    // Save the updated employee
    const updatedEmployee = await employee.save();

    // Return the updated employee (excluding the password hash)
    const employeeResponse = updatedEmployee.toObject ? updatedEmployee.toObject() : updatedEmployee;
    delete employeeResponse.password_hash;

    res.json(employeeResponse);
  } catch (err) {
    handleError(res, 500, 'Server error');
  }
});

// Delete an employee by ID
router.delete('/employees/:id', async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return handleError(res, 404, 'Employee not found');
    }
    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    handleError(res, 500, 'Server error');
  }
});

// Login an employee using email or phone_number
router.post('/login', async (req, res) => {
  try {
    const { email, phone_number, password } = req.body;

    // Check if either email or phone_number is provided
    if (!email && !phone_number) {
      return handleError(res, 400, 'Email or phone number is required');
    }

    // Find the employee by email or phone_number
    const employee = await Employee.findOne({
      $or: [{ email }, { phone_number }],
    });

    if (!employee) {
      return handleError(res, 400, 'Invalid email, phone number, or password');
    }

    

    // Return the employee (excluding the password hash)
    const employeeResponse = employee.toObject ? employee.toObject() : employee;
    

    res.json(employeeResponse);
  } catch (err) {
    handleError(res, 500, 'Server error');
  }
});

module.exports = router;