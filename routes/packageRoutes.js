const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/create-package', authMiddleware, packageController.createPackage);
router.post('/get-all-package', authMiddleware, packageController.createPackage);

module.exports = router;