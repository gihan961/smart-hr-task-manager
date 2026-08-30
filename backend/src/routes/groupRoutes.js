const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const groupController = require('../controllers/groupController');

router.use(authenticateToken);

router.post('/', groupController.createGroup);
router.get('/', groupController.getGroups);
router.get('/my-groups', groupController.getMyGroups);
router.get('/:groupId', groupController.getGroupDetails);

router.post('/:groupId/members', groupController.addMember);
router.delete('/:groupId/members/:userId', groupController.removeMember);

router.post('/:groupId/allocate-task', groupController.allocateTask);
router.post('/:groupId/reallocate-task', groupController.reallocateTask);

router.post('/:groupId/upload-employees-csv', groupController.bulkUploadEmployeesCSV);
router.post('/:groupId/upload-tasks-csv', groupController.bulkUploadTasksCSV);
router.post('/:groupId/auto-balance', groupController.autoBalanceGroupWorkload);
router.post('/:groupId/announcements', groupController.postGroupAnnouncement);

module.exports = router;
