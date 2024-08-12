const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const CACHE_DURATION = process.env.CACHE_DURATION || 300; // seconds
const REQUEST_LIMIT = process.env.REQUEST_LIMIT || 5;

// Set up logging
app.use(morgan('combined'));

// Set up rate limiting
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: REQUEST_LIMIT, // limit each IP to REQUEST_LIMIT requests per minute
    handler: (req, res) => {
        res.status(429).json({ error: 'Too many requests, please try again later.' });
    }
});
app.use(limiter);

// Set up cache
const cache = new NodeCache({ stdTTL: CACHE_DURATION });

// Proxy endpoint
app.get('/api/proxy', async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'Please provide a URL to proxy.' });
    }

    // Check if response is in cache
    const cachedResponse = cache.get(url);
    if (cachedResponse) {
        return res.json(cachedResponse);
    }

    try {
        const response = await axios.get(url);
        const data = response.data;

        // Cache the response
        cache.set(url, data);

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from external API.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const basicAuth = require('express-basic-auth');

// Basic Auth
app.use(basicAuth({
    users: { 'admin': 'password123' }, // Replace with real username and password
    challenge: true,
    unauthorizedResponse: (req) => 'Unauthorized'
}));
