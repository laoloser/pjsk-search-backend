const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();  // Load environment variables

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
        const { query, minBpm, maxBpm, minLevel, maxLevel, minDuration, maxDuration, minNoteCount, maxNoteCount, unit, availableInEn, commission, difficulty } = req.query;
        
        let sql = 'SELECT * FROM songs WHERE 1=1';
        const params = [];

        if (query) {
            sql += ' AND (title ILIKE $1 OR japanese_title ILIKE $1 OR artist ILIKE $1)';
            params.push(`%${query}%`);
        }
        if (minBpm) {
            sql += ' AND bpm >= $' + (params.length + 1);
            params.push(minBpm);
        }
        if (maxBpm) {
            sql += ' AND bpm <= $' + (params.length + 1);
            params.push(maxBpm);
        }
        if (minLevel) {
            sql += ' AND level >= $' + (params.length + 1);
            params.push(minLevel);
        }
        if (maxLevel) {
            sql += ' AND level <= $' + (params.length + 1);
            params.push(maxLevel);
        }
        if (minDuration) {
            sql += ' AND duration >= $' + (params.length + 1);
            params.push(minDuration);
        }
        if (maxDuration) {
            sql += ' AND duration <= $' + (params.length + 1);
            params.push(maxDuration);
        }
        if (minNoteCount) {
            sql += ' AND note_count >= $' + (params.length + 1);
            params.push(minNoteCount);
        }
        if (maxNoteCount) {
            sql += ' AND note_count <= $' + (params.length + 1);
            params.push(maxNoteCount);
        }
        if (unit && unit !== 'all') {
            sql += ' AND unit = $' + (params.length + 1);
            params.push(unit);
        }
        if (availableInEn) {
            sql += ' AND available_in_en = true';
        }
        if (commission) {
            sql += ' AND commission = true';
        }
        if (difficulty) {
            const difficulties = difficulty.split(',');
            sql += ' AND difficulty = ANY($' + (params.length + 1) + ')';
            params.push(difficulties);
        }

        const result = await pool.query(sql, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

app.post('/songs', async (req, res) => {
    const { title, japanese_title, artist, level, bpm, genre, duration, unit, note_count, available_in_en, commission, difficulty } = req.body;
    const query = `
        INSERT INTO songs (title, japanese_title, artist, level, bpm, genre, duration, unit, note_count, available_in_en, commission, difficulty)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *;
    `;
    const values = [title, japanese_title, artist, level, bpm, genre, duration, unit, note_count, available_in_en, commission, difficulty];
    try {
        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
