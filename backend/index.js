import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs/promises';

const app = express();
const PORT = 8000;
let userStatus = {}; // is { username: 'working' | 'idle' }

app.use(express.static('frontend'));

// Serve /status
app.get('/status', (req, res) => {
    res.json(userStatus);
})

// Load user config
const users = JSON.parse(
    await fs.readFile('./config/users.json', 'utf-8')
)

// Is user working
const isUserWorking = async (dbPath) => {
    try {
        const db = await open({ filename: dbPath, driver: sqlite3.Database });
        // Querying only t1 and t2 for the check
        const rows = await db.all(`SELECT t1, t2 FROM records`);
        await db.close();

        // Check if any record has t1 equal to t2.
        return rows.some(r => parseFloat(r.t1) === parseFloat(r.t2));

    } catch (err) {
        console.error(`❌ Error reading ` + dbPath, err.message); // Log the error when reading the db
        return false; // Return false if there's an error when accessing the db
    }
}

// GEMINI
// update data every 10 seconds
setInterval(async () => {
    for (const u of users) {
        const working = await isUserWorking(u.dbPath);
        userStatus[u.username] = working ? 'working' : 'idle'; // Set user status
    }
    // Optional: Keep this log for basic confirmation of status updates
    console.log('✅ Refreshed status', userStatus);
}, 10_000);

app.listen(PORT, () => {
    console.log(`🚀 Status app listening at http://localhost:${PORT}`);
})