const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const { verifyToken } = require('../utils/auth');

// Performance Management Routes
router.get('/performance', verifyToken, async (req, res) => {
  try {
    const employees = await Employee.find({}, { password_hash: 0 });
    const performanceData = employees.map(emp => ({
      employeeId: emp._id,
      name: emp.full_name,
      position: emp.employee_position,
      ratings: {
        overall: Math.floor(Math.random() * 5) + 1, // Placeholder for demo
        skills: Math.floor(Math.random() * 5) + 1,
        teamwork: Math.floor(Math.random() * 5) + 1
      },
      goals: [
        { description: 'Complete project milestone', status: 'in-progress' },
        { description: 'Improve technical skills', status: 'completed' }
      ],
      reviews: [
        { date: new Date(), rating: 4, comment: 'Good performance' }
      ]
    }));
    res.json(performanceData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/performance/:employeeId', verifyToken, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Placeholder data - replace with actual data from your database
    const performanceData = {
      ratings: {
        overall: Math.floor(Math.random() * 5) + 1,
        skills: Math.floor(Math.random() * 5) + 1,
        teamwork: Math.floor(Math.random() * 5) + 1
      },
      goals: [
        { description: 'Complete project milestone', status: 'in-progress' },
        { description: 'Improve technical skills', status: 'completed' }
      ],
      reviews: [
        { date: new Date(), rating: 4, comment: 'Good performance' }
      ]
    };
    
    res.json(performanceData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Attendance Management Routes
router.get('/attendance', verifyToken, async (req, res) => {
  try {
    const employees = await Employee.find({}, { password_hash: 0 });
    const attendanceData = employees.map(emp => ({
      employeeId: emp._id,
      name: emp.full_name,
      present: Math.floor(Math.random() * 20) + 1,
      absent: Math.floor(Math.random() * 5),
      late: Math.floor(Math.random() * 3)
    }));
    res.json(attendanceData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/attendance/:employeeId', verifyToken, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Placeholder data - replace with actual data from your database
    const attendanceData = {
      present: [
        { date: new Date(), checkIn: '09:00', checkOut: '17:00' }
      ],
      absent: [
        { date: new Date(), reason: 'Sick leave' }
      ],
      late: [
        { date: new Date(), checkIn: '09:30', reason: 'Traffic' }
      ]
    };
    
    res.json(attendanceData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Leave Management Routes
router.get('/leave-requests', verifyToken, async (req, res) => {
  try {
    // Placeholder data - replace with actual data from your database
    const leaveRequests = [
      {
        id: 1,
        employeeId: '123',
        employeeName: 'John Doe',
        type: 'Annual Leave',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'pending',
        reason: 'Family vacation'
      }
    ];
    res.json(leaveRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/leave/:employeeId', verifyToken, async (req, res) => {
  try {
    const { type, startDate, endDate, reason } = req.body;
    const employee = await Employee.findById(req.params.employeeId);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Placeholder response - replace with actual database operation
    const leaveRequest = {
      id: Math.floor(Math.random() * 1000),
      employeeId: req.params.employeeId,
      employeeName: employee.full_name,
      type,
      startDate,
      endDate,
      status: 'pending',
      reason
    };
    
    res.status(201).json(leaveRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Training Management Routes
router.get('/training', verifyToken, async (req, res) => {
  try {
    // Placeholder data - replace with actual data from your database
    const trainingPrograms = [
      {
        id: 1,
        title: 'Technical Skills Workshop',
        description: 'Advanced programming techniques',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        enrolled: [
          { id: '123', name: 'John Doe' },
          { id: '456', name: 'Jane Smith' }
        ]
      }
    ];
    res.json(trainingPrograms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/training', verifyToken, async (req, res) => {
  try {
    const { title, description, startDate, endDate } = req.body;
    
    // Placeholder response - replace with actual database operation
    const trainingProgram = {
      id: Math.floor(Math.random() * 1000),
      title,
      description,
      startDate,
      endDate,
      enrolled: []
    };
    
    res.status(201).json(trainingProgram);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 