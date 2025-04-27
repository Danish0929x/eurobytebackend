const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/create-package', authMiddleware, packageController.createPackage);
router.get('/get-allPackage/:userId',authMiddleware, packageController.getPackagesByUserId);

module.exports = router;