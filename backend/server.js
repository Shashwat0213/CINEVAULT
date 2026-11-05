const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors()); // Frontend ko allow karne ke liye

// TMDB Proxy
app.get('/api/tmdb/*', async (req, res) => {
    try {
        const endpoint = req.params[0];
        const queryParams = { ...req.query, api_key: process.env.TMDB_API_KEY };
        const response = await axios.get(`https://api.themoviedb.org/3/${endpoint}`, { params: queryParams });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "TMDB fetch failed" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));