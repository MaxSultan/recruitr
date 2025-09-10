/**
 * Validation middleware for common request patterns
 */

/**
 * Validate that a parameter is a valid integer ID
 */
const validateId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: `Valid ${paramName} is required`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Add parsed ID to request for use in controllers
    req.params[paramName] = parseInt(id);
    next();
  };
};

/**
 * Validate required fields in request body
 */
const validateRequired = (fields) => {
  return (req, res, next) => {
    const missing = fields.filter(field => !req.body[field]);
    
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: `Required fields: ${missing.join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  };
};

/**
 * Validate tournament ID parameter
 */
const validateTournamentId = (req, res, next) => {
  const { tournamentId } = req.params;
  
  if (!tournamentId) {
    return res.status(400).json({
      success: false,
      error: 'Tournament ID is required',
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

module.exports = {
  validateId,
  validateRequired,
  validateTournamentId
};
