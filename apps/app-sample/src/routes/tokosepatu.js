import express from 'express';
import tokosepatuController from '../controllers/tokosepatu.js';

export default express
  .Router()
  .post('/orders', tokosepatuController.create)
  .patch('/orders/:order_number/status', tokosepatuController.updateStatus)
  .get('/orders/:order_number', tokosepatuController.findOne)
  .get('/products', tokosepatuController.findProducts);
