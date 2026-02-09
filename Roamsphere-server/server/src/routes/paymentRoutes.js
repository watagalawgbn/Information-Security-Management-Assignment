import express from 'express';
import {
    calculateTripCost,
    createPaymentIntent,
    confirmPayment,
    getPaymentMethods,
    getPaymentHistory
} from '../controllers/paymentController.js';
import { Auth } from '../middlewares/verifyToken.js';

const router = express.Router();

// Public routes
router.post('/calculate-cost', calculateTripCost);

// Protected routes (require authentication)
router.post('/create-intent', Auth, createPaymentIntent);
router.post('/confirm', Auth, confirmPayment);
router.get('/methods', Auth, getPaymentMethods);
router.get('/history', Auth, getPaymentHistory);

export default router;
