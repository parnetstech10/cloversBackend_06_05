import express from 'express'
import { createReservation, createReservationApp, getAllReservations } from '../controllers/restaurantReservationController.js';

const restaurantReservationRoutes =  express.Router();

restaurantReservationRoutes.post('/add' , createReservation)
restaurantReservationRoutes.get('/get' , getAllReservations)

restaurantReservationRoutes.post('/reseraionapp' , createReservationApp)
export default restaurantReservationRoutes;