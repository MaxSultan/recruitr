/**
 * Request logging middleware
 */
const logger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const ip = req.ip || req.connection.remoteAddress || 'Unknown';
  
  console.log(`${timestamp} - ${method} ${path} - IP: ${ip} - User-Agent: ${userAgent}`);
  
  next();
};

module.exports = logger;
