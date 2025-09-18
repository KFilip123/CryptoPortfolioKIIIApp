const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const DATABASE_URL = process.env.DATABASE_URL ||
    `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@postgres:5432/${process.env.POSTGRES_DB}`;

const pool = new Pool({ connectionString: DATABASE_URL });

// Меморија за последниот total (за пресметка на пораст)
let previousTotal = 0;

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Get all holdings
app.get('/api/holdings', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM holdings ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'db error' });
    }
});

// Add holding
app.post('/api/holdings', async (req, res) => {
    const { symbol, amount_usd } = req.body;
    if (!symbol || amount_usd == null) return res.status(400).json({ error: 'missing fields' });

    try {
        const { rows } = await pool.query(
            'INSERT INTO holdings (symbol, amount_usd) VALUES ($1, $2) RETURNING *',
            [symbol.toUpperCase(), amount_usd]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'db error' });
    }
});

// Update holding
app.put('/api/holdings/:id', async (req, res) => {
    const { id } = req.params;
    const { amount_usd } = req.body;

    if (amount_usd == null) return res.status(400).json({ error: 'missing amount_usd' });

    try {
        const { rows } = await pool.query(
            'UPDATE holdings SET amount_usd = $1 WHERE id = $2 RETURNING *',
            [amount_usd, id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'db error' });
    }
});

// Delete holding
app.delete('/api/holdings/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM holdings WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'db error' });
    }
});

// Get total USD + growth %
app.get('/api/total', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT COALESCE(SUM(amount_usd),0)::numeric(20,2) AS total FROM holdings');
        const total = parseFloat(rows[0].total) || 0;

        // Пресметка на пораст според последниот total
        let growth = 0;
        if (previousTotal > 0) {
            growth = ((total - previousTotal)/previousTotal)*100;
        }

        // Зачувај current total за следната пресметка
        previousTotal = total;

        res.json({
            total: total.toFixed(2),
            growth: growth.toFixed(2)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'db error' });
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
