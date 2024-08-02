const express = require('express');
const cors = require('cors');
const knex = require('knex');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL, // Ensure this is correctly set in your .env file
});

app.get('/songs', async (req, res) => {
  try {
    const { term, unit, availableInEn, commission, minLevel, maxLevel, sortBy } = req.query;
    let query = db('songs');

    if (term) {
      query = query.where(function() {
        this.where('title', 'ilike', `%${term}%`)
          .orWhere('japanese_title', 'ilike', `%${term}%`)
          .orWhere('artist', 'ilike', `%${term}%`);
      });
    }

    if (unit && unit !== 'all') {
      query = query.where('unit', unit);
    }

    if (availableInEn === 'true') {
      query = query.where('available_in_en', true);
    }

    if (commission === 'true') {
      query = query.where('commission', true);
    }

    if (minLevel) {
      query = query.where('level', '>=', minLevel);
    }

    if (maxLevel) {
      query = query.where('level', '<=', maxLevel);
    }

    // Add sorting functionality based on the sortBy parameter
    if (sortBy) {
      query = query.orderBy(sortBy, 'asc'); // Sorting in ascending order by default
    } else {
      query = query.orderBy('title', 'asc'); // Default sorting by title if sortBy is not specified
    }

    const results = await query.select();
    res.json(results);
  } catch (error) {
    console.error('Error fetching songs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/songs', async (req, res) => {
  const { title, japanese_title, artist, level, bpm, duration, unit, note_count, available_in_en, difficulty, commission } = req.body;
  try {
    const result = await db('songs').insert({
      title: title,
      japanese_title: japanese_title,
      artist: artist,
      level: level,
      bpm: bpm,
      duration: duration,
      unit: unit,
      note_count: note_count,
      available_in_en: available_in_en,
      difficulty: difficulty,
      commission: commission
    }).returning('*');
    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Failed to add song:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
