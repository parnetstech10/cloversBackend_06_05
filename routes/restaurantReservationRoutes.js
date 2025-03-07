import express from 'express'
import { createReservation, createReservationApp, getAllReservations, getAllReservationsbycat, getAllReservationsbymemberid, makechangeStatus } from '../controllers/restaurantReservationController.js';

const restaurantReservationRoutes =  express.Router();

restaurantReservationRoutes.post('/add' , createReservation)
restaurantReservationRoutes.get('/get' , getAllReservations)
restaurantReservationRoutes.get('/bycategory/:cat' , getAllReservationsbycat)
restaurantReservationRoutes.get('/getbymemberid/:memberId' , getAllReservationsbymemberid)
restaurantReservationRoutes.put('/makechangeStatus' , makechangeStatus);

restaurantReservationRoutes.post('/reseraionapp' , createReservationApp)
export default restaurantReservationRoutes;