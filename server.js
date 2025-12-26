const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Initialize SQLite Database
const db = new sqlite3.Database('./iptv_manager.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Create tables if they don't exist
function initializeDatabase() {
    db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            customerId TEXT NOT NULL,
            panel TEXT NOT NULL,
            subPrice REAL NOT NULL,
            panelPrice REAL NOT NULL,
            agent TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS ad_spends (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            platform TEXT NOT NULL,
            amount REAL NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log('Database tables initialized');
}

// ==================== TRANSACTION ENDPOINTS ====================

// Get all transactions
app.get('/api/transactions', (req, res) => {
    db.all('SELECT * FROM transactions ORDER BY date DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Add new transaction
app.post('/api/transactions', (req, res) => {
    const { date, customerId, panel, subPrice, panelPrice, agent } = req.body;
    
    if (!customerId || !panel || !subPrice || !panelPrice || !agent) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }

    const sql = `INSERT INTO transactions (date, customerId, panel, subPrice, panelPrice, agent) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [date, customerId, panel, subPrice, panelPrice, agent], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ 
            id: this.lastID,
            date,
            customerId,
            panel,
            subPrice,
            panelPrice,
            agent
        });
    });
});

// Update transaction
app.put('/api/transactions/:id', (req, res) => {
    const { id } = req.params;
    const { customerId, panel, subPrice, panelPrice, agent } = req.body;
    
    const sql = `UPDATE transactions 
                 SET customerId = ?, panel = ?, subPrice = ?, panelPrice = ?, agent = ?
                 WHERE id = ?`;
    
    db.run(sql, [customerId, panel, subPrice, panelPrice, agent, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Transaction not found' });
            return;
        }
        res.json({ message: 'Transaction updated successfully' });
    });
});

// Delete transaction
app.delete('/api/transactions/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM transactions WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Transaction not found' });
            return;
        }
        res.json({ message: 'Transaction deleted successfully' });
    });
});

// ==================== AD SPEND ENDPOINTS ====================

// Get all ad spends
app.get('/api/ad-spends', (req, res) => {
    db.all('SELECT * FROM ad_spends ORDER BY date DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Add new ad spend
app.post('/api/ad-spends', (req, res) => {
    const { date, platform, amount } = req.body;
    
    if (!platform || !amount) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }

    const sql = `INSERT INTO ad_spends (date, platform, amount) VALUES (?, ?, ?)`;
    
    db.run(sql, [date, platform, amount], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ 
            id: this.lastID,
            date,
            platform,
            amount
        });
    });
});

// ==================== STATS ENDPOINT ====================

// Get dashboard statistics
app.get('/api/stats', (req, res) => {
    const stats = {};
    
    // Get transaction totals
    db.get(`SELECT 
                SUM(subPrice) as totalRevenue,
                SUM(panelPrice) as totalPanelCosts
            FROM transactions`, [], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        stats.totalRevenue = row.totalRevenue || 0;
        stats.totalPanelCosts = row.totalPanelCosts || 0;
        
        // Get ad spend total
        db.get('SELECT SUM(amount) as totalAdSpends FROM ad_spends', [], (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            stats.totalAdSpends = row.totalAdSpends || 0;
            stats.netProfit = stats.totalRevenue - stats.totalPanelCosts - stats.totalAdSpends;
            
            res.json(stats);
        });
    });
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 IPTV Profit Manager is ready!`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});
