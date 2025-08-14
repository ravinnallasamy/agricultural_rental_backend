var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.json({
    message: 'Rental App Backend API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      providers: '/api/providers',
      equipments: '/api/equipments',
      requests: '/api/requests'
    }
  });
});

module.exports = router;
