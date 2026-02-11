const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');

router.get('/', teamController.getAllTeams);
router.post('/', teamController.createTeam);
router.post('/:teamId/members', teamController.addTeamMember);

module.exports = router;
