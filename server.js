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

app.post('/csvote', async (req, res) => {
  const { vote } = req.body;
  try {
      const result = await db('csvote').insert({
          vote
      }).returning('*');
      res.status(201).json(result[0]);
  } catch (error) {
      console.error('Failed to record vote:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/csvote', async (req, res) => {
  try {
      const results = await db('csvote')
          .select('vote')
          .count('* as count')
          .groupBy('vote')
          .orderBy('vote', 'asc');
      res.json(results);
  } catch (error) {
      console.error('Error fetching vote counts:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
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

    // Add custom sorting by difficulty using a CASE statement
    query = query.orderByRaw(`
      ${sortBy ? '?? asc,' : ''} CASE difficulty
        WHEN 'Easy' THEN 1
        WHEN 'Normal' THEN 2
        WHEN 'Hard' THEN 3
        WHEN 'Expert' THEN 4
        WHEN 'Master' THEN 5
        WHEN 'Append' THEN 6
        ELSE 7
      END ASC
    `, sortBy ? [sortBy] : []);

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

app.post('/reset-csvote', async (req, res) => {
  // Check for a specific key in the request header or body
  if (req.headers['x-custom-auth'] !== 'muku') {
      return res.status(403).json({ error: 'Unauthorized access' });
  }

  try {
      await db('csvote').del();  // Delete all records from the csvote table
      res.status(200).json({ message: 'All votes have been deleted successfully.' });
  } catch (error) {
      console.error('Error deleting votes:', error);
      res.status(500).json({ error: 'Failed to delete votes due to an internal error.' });
  }
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
