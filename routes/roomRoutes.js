import express from 'express';
import { addRoom, getRooms, getRoomById, updateRoom, deleteRoom, updateStatus } from '../controllers/roomController.js';
const router = express.Router();

router.post('/add', addRoom);
router.get('/', getRooms);
router.get('/:id', getRoomById);
router.put('/:id', updateRoom);
router.put('/status/:id', updateStatus);
router.delete('/:id', deleteRoom);

export default router;