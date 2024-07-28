const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

app.get('/songs', async (req, res) => {
    try {
        const { term, unit, availableInEn, commission, minLevel, maxLevel } = req.query;
        let query = 'SELECT * FROM songs WHERE 1=1';
        let values = [];

        if (term) {
            query += ' AND (title ILIKE $1 OR japanese_title ILIKE $1 OR artist ILIKE $1)';
            values.push(`%${term}%`);
        }

        if (unit && unit !== 'all') {
            query += ' AND unit = $' + (values.length + 1);
            values.push(unit);
        }

        if (availableInEn) {
            query += ' AND available_in_en = $' + (values.length + 1);
            values.push(availableInEn === 'true');
        }

        if (commission) {
            query += ' AND commission = $' + (values.length + 1);
            values.push(commission === 'true');
        }

        if (minLevel) {
            query += ' AND level >= $' + (values.length + 1);
            values.push(parseInt(minLevel, 10));
        }

        if (maxLevel) {
            query += ' AND level <= $' + (values.length + 1);
            values.push(parseInt(maxLevel, 10));
        }

        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
