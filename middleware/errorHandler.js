/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  
  // Default error
  let error = {
    success: false,
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  };
  
  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    error.error = 'Validation Error';
    error.message = err.errors.map(e => e.message).join(', ');
    return res.status(400).json(error);
  }
  
  // Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    error.error = 'Duplicate Entry';
    error.message = 'A record with this information already exists';
    return res.status(409).json(error);
  }
  
  // Sequelize foreign key constraint errors
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    error.error = 'Reference Error';
    error.message = 'Referenced record does not exist';
    return res.status(400).json(error);
  }
  
  // Custom application errors
  if (err.status) {
    error.error = err.error || 'Application Error';
    error.message = err.message;
    return res.status(err.status).json(error);
  }
  
  // Default to 500 for unhandled errors
  res.status(500).json(error);
};

module.exports = errorHandler;
