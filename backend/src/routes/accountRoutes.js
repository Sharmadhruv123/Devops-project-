const express = require('express');
const { getAccounts, createAccount, toggleAccountStatus } = require('../controllers/accountController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getAccounts)
  .post(createAccount);

router.put('/:id/toggle', toggleAccountStatus);

module.exports = router;
