import cors from 'cors';

const corsOptions = {
  origin: 'http://localhost:5173', // Replace with your frontend URL
  methods: ['GET', 'POST'], // Adjust methods as needed
  allowedHeaders: ['Content-Type']
};

export default cors(corsOptions);
