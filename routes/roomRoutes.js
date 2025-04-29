import express from 'express';
import { 
    addRoom, getRooms, getRoomById, updateRoom, deleteRoom, updateStatus,
    getRoomTypes, createRoomType
} from '../controllers/roomController.js';

const router = express.Router();

// Room type routes - MUST BE BEFORE /:id routes
router.get('/types', getRoomTypes);
router.post('/types', createRoomType);

// Room routes
router.post('/add', addRoom);
router.get('/', getRooms);
router.get('/:id', getRoomById);
router.put('/:id', updateRoom);
router.put('/status/:id', updateStatus);
router.delete('/:id', deleteRoom);

export default router;