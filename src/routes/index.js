'use strict';

const express = require('express');

const router = express.Router();

router.use('/tournaments', require('./tournaments'));
router.use('/teams',       require('./teams'));
router.use('/matches',     require('./matches'));
router.use('/live',        require('./live'));
router.use('/standings',   require('./standings'));
router.use('/groups',      require('./groups'));
router.use('/search',      require('./search'));
router.use('/admin',       require('./admin'));

module.exports = router;
