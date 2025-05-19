const rateLimit = require('express-rate-limit');

const rateLimitMiddleware = (maxRequest, inMinutes) => {
  return rateLimit({
    windowMs: inMinutes * 60 * 1000, // Convert minutes to milliseconds
    max: maxRequest, // Limit each IP to maxRequest requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
  });
};

module.exports = { rateLimitMiddleware };
