import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { checkConnection } from './src/config/db.js';
import createAllTable  from './src/utils/dbUtils.js';
import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';


const app = express();
app.use(cors({
    origin: ["https://roamsphere.vercel.app"],  //["http://localhost:5173"],
    methods: ['GET','POST','PUT','PATCH','DELETE'],
    credentials: true
})) 

app.use(express.json()); // Middleware to parse JSON data
app.use(bodyParser.json());
app.use('/api/auth', authRoutes); 
app.use('/api/users', userRoutes);
app.use('/api/payment', paymentRoutes); 


app.get('/', (req, res) => { res.send('Welcome to the API'); });

app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || 'Internal server error';
    res.status(status).json({ message });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async() => {
    console.log(`Server is running on port ${PORT}`);
    try {
        //Check database connection
        await checkConnection();
        await createAllTable();
    } catch (error) {
        console.error("Failed to initialize database connection",error);
    }
});

 