const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');

// Daftar Rute API Backend
router.get('/home', movieController.getHome);
router.get('/trending', movieController.getTrending);
router.get('/search', movieController.getSearch);
router.get('/detail', movieController.getDetail);
router.get('/stream', movieController.getStream);
router.get('/subtitle', movieController.getSubtitle);

module.exports = router;
