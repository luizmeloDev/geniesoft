const { errorHandler, ValidationError, AuthenticationError, AuthorizationError } = require('./errorHandler');
const { getSetting } = require('./settingsManager');
const { logger } = require('./logger');

const requireCustomerAuth = (req, res, next) => {
  try {
    if (!req.session || !req.session.customer || !req.session.customer.phone) {
      throw new AuthenticationError('Login diperlukan untuk mengakses halaman ini');
    }
    next();
  } catch (error) {
    next(error);
  }
};

const requireAdminAuth = (req, res, next) => {
  try {
    if (!req.session || !req.session.admin || !req.session.admin.username) {
      throw new AuthenticationError('Login admin diperlukan');
    }
    next();
  } catch (error) {
    next(error);
  }
};

const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();
  
  return (req, res, next) => {
    try {
      const key = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      const windowStart = now - windowMs;
      
      for (const [ip, timestamps] of requests.entries()) {
        requests.set(ip, timestamps.filter(time => time > windowStart));
        if (requests.get(ip).length === 0) {
          requests.delete(ip);
        }
      }
      
      const userRequests = requests.get(key) || [];
      if (userRequests.length >= max) {
        const error = new ValidationError('Terlalu banyak permintaan. Silakan coba lagi nanti.');
        error.statusCode = 429;
        throw error;
      }
      
      userRequests.push(now);
      requests.set(key, userRequests);
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

const validateInput = (schema) => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details[0].message, error.details[0].path[0]);
      }
      req.body = value;
      next();
    } catch (err) {
      next(err);
    }
  };
};

const validatePhoneNumber = (req, res, next) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      throw new ValidationError('Nomor telepon harus diisi', 'phone');
    }
    
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (!cleanPhone.match(/^08[0-9]{8,13}$/)) {
      throw new ValidationError('Format nomor telepon tidak valid. Gunakan format: 08xxxxxxxxxx', 'phone');
    }
    
    req.body.phone = cleanPhone;
    next();
  } catch (error) {
    next(error);
  }
};

const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  logger.info('Request started', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.session?.customer?.phone || req.session?.admin?.username || 'anonymous'
  });
  
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.session?.customer?.phone || req.session?.admin?.username || 'anonymous'
    });
    originalSend.call(this, data);
  };
  
  next();
};

const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  if (process.env.NODE_ENV === 'production' && req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  next();
};

const contentSecurityPolicy = (req, res, next) => {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
    "font-src 'self' https://cdn.jsdelivr.net",
    "img-src 'self' data: https:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  
  res.setHeader('Content-Security-Policy', csp);
  next();
};

const standardizeApiResponse = (req, res, next) => {
  res.apiSuccess = (data = null, message = 'Success') => {
    res.json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  };
  
  res.apiError = (message = 'Error', statusCode = 500, code = 'INTERNAL_ERROR') => {
    res.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
        timestamp: new Date().toISOString()
      }
    });
  };
  
  next();
};

const sessionManager = (req, res, next) => {
  if (!req.session) {
    req.session = {};
  }
  
  req.session.setCustomer = (customerData) => {
    req.session.customer = customerData;
  };
  
  req.session.setAdmin = (adminData) => {
    req.session.admin = adminData;
  };
  
  req.session.clearAuth = () => {
    delete req.session.customer;
    delete req.session.admin;
  };
  
  req.session.isCustomer = () => {
    return !!(req.session.customer && req.session.customer.phone);
  };
  
  req.session.isAdmin = () => {
    return !!(req.session.admin && req.session.admin.username);
  };
  
  next();
};

const asyncErrorBoundary = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

const developmentOnly = (middleware) => {
  return (req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
      return middleware(req, res, next);
    }
    next();
  };
};

const productionOnly = (middleware) => {
  return (req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
      return middleware(req, res, next);
    }
    next();
  };
};

const setActivePage = (req, res, next) => {
    const pageMap = {
        'dashboard': 'dashboard',
        'billing/mapping-new': 'mapping-new',
        'cable-network/analytics': 'cable-network-analytics',
        'cable-network/odp': 'cable-network-odp',
        'cable-network/cables': 'cable-network-cables',
        'installations': 'installations',
        'trouble': 'trouble',
        'billing': 'billing',
        'agents': 'agents',
        'agent-registrations': 'agent-registrations',
        'technicians': 'technicians',
        'genieacs': 'genieacs',
        'mikrotik/profiles': 'mikrotik-profiles',
        'mikrotik': 'mikrotik',
        'hotspot/voucher': 'voucher',
        'mikrotik/hotspot-profiles': 'hotspot-profiles',
        'hotspot': 'hotspot',
        'settings': 'setting',
        'cache': 'cache'
    };

    const currentPath = req.path.substring(1);
    res.locals.page = pageMap[currentPath] || null;

    next();
};

module.exports = {
  requireCustomerAuth,
  requireAdminAuth,
  createRateLimit,
  validateInput,
  validatePhoneNumber,
  requestLogger,
  securityHeaders,
  contentSecurityPolicy,
  standardizeApiResponse,
  sessionManager,
  asyncErrorBoundary,
  developmentOnly,
  productionOnly,
  setActivePage,
  
  loginRateLimit: createRateLimit(15 * 60 * 1000, 5),
  apiRateLimit: createRateLimit(15 * 60 * 1000, 100),
  strictRateLimit: createRateLimit(15 * 60 * 1000, 10)
};
