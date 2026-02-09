import { pool } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

// Calculate trip cost based on distance, duration, and vehicle type
export const calculateTripCost = async (req, res) => {
    try {
        const { origin, destination, vehicleType, passengerCount, category } = req.body;

        // Base fares for different trip categories (in LKR)
        const categoryBaseFares = {
            'Luxury': 5000,      // Premium base fare
            'Safari': 3500,      // Wildlife/nature trips
            'Tour': 2000,        // Standard sightseeing
            'Adventure': 3000,   // Hiking/outdoor activities
            'Casual': 1500       // Simple transfers
        };

        // Per km rates for different categories (in LKR)
        const categoryDistanceRates = {
            'Luxury': 100,       // Premium per km rate
            'Safari': 80,        // Higher rate for remote areas
            'Tour': 60,          // Standard sightseeing rate
            'Adventure': 70,     // Outdoor activity rate
            'Casual': 40         // Basic transfer rate
        };

        // Per hour rates for different categories (in LKR)
        const categoryTimeRates = {
            'Luxury': 800,       // Premium hourly rate
            'Safari': 600,       // Wildlife viewing time
            'Tour': 400,         // Standard tour rate
            'Adventure': 500,    // Outdoor activity time
            'Casual': 300        // Basic hourly rate
        };
        
        // Vehicle type multipliers
        const vehicleMultipliers = {
            'economy': 1.0,
            'luxury': 1.5,
            'van': 1.3,
            'minibus': 1.4,
            'bus': 1.2,
            'any': 1.0
        };
        
        // Mock distance calculation (replace with real distance API)
        // For now, using a simple estimation based on origin/destination
        const estimatedDistance = calculateEstimatedDistance(origin, destination);
        const estimatedDuration = calculateEstimatedDuration(estimatedDistance, category);
        
        // Get rates for the selected category
        const baseFare = categoryBaseFares[category] || categoryBaseFares['Casual'];
        const distanceRate = categoryDistanceRates[category] || categoryDistanceRates['Casual'];
        const timeRate = categoryTimeRates[category] || categoryTimeRates['Casual'];
        
        const vehicleMultiplier = vehicleMultipliers[vehicleType] || 1.0;
        
        // Calculate individual components
        const distanceFare = estimatedDistance * distanceRate;
        const timeFare = estimatedDuration * timeRate;
        
        // Calculate subtotal before vehicle multiplier
        const subtotal = baseFare + distanceFare + timeFare;
        
        // Apply vehicle multiplier
        const vehicleAdjustedAmount = subtotal * vehicleMultiplier;
        
        // Add passenger surcharge for more than 4 passengers
        const passengerSurcharge = passengerCount > 4 ? (passengerCount - 4) * 200 : 0;
        
        const totalAmount = vehicleAdjustedAmount + passengerSurcharge;

        res.json({
            success: true,
            data: {
                baseAmount: baseFare,
                distance: estimatedDistance,
                duration: estimatedDuration,
                totalAmount: Math.round(totalAmount),
                breakdown: {
                    baseFare: Math.round(baseFare),
                    distanceFare: Math.round(distanceFare),
                    timeFare: Math.round(timeFare),
                    vehicleMultiplier,
                    vehicleAdjustedAmount: Math.round(vehicleAdjustedAmount),
                    passengerSurcharge,
                    rates: {
                        distanceRate,
                        timeRate
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error calculating trip cost:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to calculate trip cost'
        });
    }
};

// Helper function to estimate distance (replace with real distance API)
function calculateEstimatedDistance(origin, destination) {
    // Simple mock calculation - in real implementation, use Google Maps API or similar
    const commonDistances = {
        'Colombo to Galle': 120,
        'Colombo to Kandy': 120,
        'Colombo to Negombo': 40,
        'Colombo to Airport': 35,
        'Kandy to Nuwara Eliya': 80,
        'Galle to Matara': 40,
        'Colombo to Anuradhapura': 200,
        'Colombo to Trincomalee': 250
    };
    
    const route = `${origin} to ${destination}`;
    const reverseRoute = `${destination} to ${origin}`;
    
    return commonDistances[route] || commonDistances[reverseRoute] || 50; // Default 50km
}

// Helper function to estimate duration based on distance and category
function calculateEstimatedDuration(distance, category) {
    // Base speed varies by category
    const categorySpeeds = {
        'Luxury': 60,      // km/h - comfortable pace
        'Safari': 30,      // km/h - slow for wildlife viewing
        'Tour': 50,        // km/h - moderate pace for sightseeing
        'Adventure': 40,   // km/h - slower for outdoor activities
        'Casual': 55       // km/h - normal driving speed
    };
    
    const speed = categorySpeeds[category] || 50;
    const baseHours = distance / speed;
    
    // Add extra time for stops based on category
    const stopMultipliers = {
        'Luxury': 1.5,     // More stops for luxury experience
        'Safari': 2.0,     // Many stops for wildlife viewing
        'Tour': 1.8,       // Frequent stops for sightseeing
        'Adventure': 1.3,  // Some stops for activities
        'Casual': 1.1      // Minimal stops
    };
    
    const multiplier = stopMultipliers[category] || 1.1;
    return Math.round(baseHours * multiplier * 10) / 10; // Round to 1 decimal
}

// Create payment intent
export const createPaymentIntent = async (req, res) => {
    try {
        const { tripData, amount, method, paymentDetails } = req.body;
        const customerId = req.user?.customer_id;

        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const paymentId = uuidv4();
        const paymentIntentId = `pi_${Date.now()}_${paymentId.substring(0, 8)}`;

        // Store payment intent in database
        const query = `
            INSERT INTO PaymentIntents (
                payment_id, customer_id, trip_data, amount, currency, 
                payment_method, payment_details, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        await pool.execute(query, [
            paymentId,
            customerId,
            JSON.stringify(tripData),
            amount,
            'LKR',
            method,
            JSON.stringify(paymentDetails),
            'pending'
        ]);

        // Simulate payment processing (replace with real payment gateway)
        setTimeout(() => {
            // In real implementation, this would be handled by webhook from payment gateway
            console.log(`Payment intent ${paymentId} created for amount ${amount} LKR`);
        }, 100);

        res.json({
            success: true,
            data: {
                paymentId,
                paymentIntentId,
                amount,
                currency: 'LKR',
                status: 'pending',
                message: 'Payment intent created successfully'
            }
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create payment intent'
        });
    }
};

// Confirm payment
export const confirmPayment = async (req, res) => {
    try {
        const { paymentIntentId, tripId } = req.body;
        const customerId = req.user?.customer_id;

        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Update payment status to completed
        const updateQuery = `
            UPDATE PaymentIntents 
            SET status = 'completed', trip_id = ?, completed_at = NOW()
            WHERE payment_id = ? AND customer_id = ?
        `;

        const [result] = await pool.execute(updateQuery, [tripId, paymentIntentId, customerId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Payment intent not found'
            });
        }

        res.json({
            success: true,
            data: {
                paymentId: paymentIntentId,
                tripId,
                status: 'completed',
                message: 'Payment confirmed successfully'
            }
        });
    } catch (error) {
        console.error('Error confirming payment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to confirm payment'
        });
    }
};

// Get payment methods
export const getPaymentMethods = async (req, res) => {
    try {
        const methods = [
            {
                id: 'card',
                name: 'Credit/Debit Card',
                description: 'Visa, Mastercard, American Express',
                enabled: true
            },
            {
                id: 'bank',
                name: 'Bank Transfer',
                description: 'Direct bank transfer',
                enabled: true
            },
            {
                id: 'mobile',
                name: 'Mobile Payment',
                description: 'Dialog, Mobitel, Hutch',
                enabled: true
            }
        ];

        res.json({
            success: true,
            data: methods
        });
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment methods'
        });
    }
};

// Get payment history
export const getPaymentHistory = async (req, res) => {
    try {
        const customerId = req.user?.customer_id;

        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const query = `
            SELECT 
                payment_id,
                amount,
                currency,
                payment_method,
                status,
                created_at,
                completed_at,
                trip_id
            FROM PaymentIntents 
            WHERE customer_id = ?
            ORDER BY created_at DESC
        `;

        const [payments] = await pool.execute(query, [customerId]);

        res.json({
            success: true,
            data: payments
        });
    } catch (error) {
        console.error('Error fetching payment history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment history'
        });
    }
};
