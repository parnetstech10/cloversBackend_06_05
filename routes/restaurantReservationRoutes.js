import express from 'express'
import { createReservation, getAllReservations } from '../controllers/restaurantReservationController.js';

const restaurantReservationRoutes =  express.Router();

restaurantReservationRoutes.post('/add' , createReservation)
restaurantReservationRoutes.get('/get' , getAllReservations)

export default restaurantReservationRoutes;