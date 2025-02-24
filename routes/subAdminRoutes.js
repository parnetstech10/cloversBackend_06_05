import express from 'express'
import { createSubAdmin, getSubAdmins } from '../controllers/subAdminController.js'

const subAdminRoutes =  express.Router()

subAdminRoutes.post('/add', createSubAdmin)
subAdminRoutes.get('/get', getSubAdmins)

export default subAdminRoutes