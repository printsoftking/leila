# IPTV Profit Manager

A centralized profit management system for IPTV businesses with multi-agent support.

## Features

✅ **Centralized Database** - All data stored on server, visible to all users
✅ **Multi-Agent Support** - Separate logins for Leila and Zahira
✅ **Real-time Sync** - Auto-refresh every 30 seconds
✅ **Transaction Management** - Add, edit, delete customer transactions
✅ **Ad Spend Tracking** - Track Facebook and Google Ads spending
✅ **Daily Reports** - Automatic daily profit/loss summaries
✅ **WhatsApp Integration** - Direct contact buttons for phone numbers
✅ **Beautiful UI** - Modern glassmorphism design with dark mode

## Installation

### 1. Install Dependencies

```bash
npm install
```

This will install:
- Express.js (web server)
- SQLite3 (database)
- CORS (cross-origin support)

### 2. Start the Server

```bash
npm start
```

Or for development with auto-restart:

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Usage

1. **Login**: Select either Leila or Zahira as the agent
2. **Add Transactions**: Fill in customer details, panel type, and prices
3. **Track Ad Spend**: Log your daily advertising expenses
4. **View Reports**: See daily summaries and total profit/loss
5. **Manage Data**: Edit or delete transactions as needed

## Database

The application uses SQLite with the following tables:

### Transactions Table
- `id` - Auto-incrementing primary key
- `date` - Transaction date
- `customerId` - Email or WhatsApp number
- `panel` - Panel type (Strong, Dino, TRX)
- `subPrice` - Subscription price in MAD
- `panelPrice` - Panel cost in MAD
- `agent` - Agent name (Leila/Zahira)

### Ad Spends Table
- `id` - Auto-incrementing primary key
- `date` - Ad spend date
- `platform` - Platform (Facebook/Google)
- `amount` - Amount spent in MAD

## Deployment

### Deploy to a VPS (DigitalOcean, Linode, etc.)

1. **Upload files to your server**
```bash
scp -r * user@your-server-ip:/path/to/app
```

2. **Install Node.js on server**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Install dependencies**
```bash
cd /path/to/app
npm install
```

4. **Install PM2 for process management**
```bash
sudo npm install -g pm2
pm2 start server.js --name iptv-manager
pm2 save
pm2 startup
```

5. **Setup Nginx as reverse proxy** (optional)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Deploy to Heroku

1. **Create Heroku app**
```bash
heroku create your-app-name
```

2. **Deploy**
```bash
git init
git add .
git commit -m "Initial commit"
git push heroku main
```

### Deploy to Render/Railway

1. Connect your GitHub repository
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Deploy!

## API Endpoints

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Add new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Ad Spends
- `GET /api/ad-spends` - Get all ad spends
- `POST /api/ad-spends` - Add new ad spend

### Statistics
- `GET /api/stats` - Get dashboard statistics

## File Structure

```
├── server.js           # Express server & API endpoints
├── app.js             # Frontend JavaScript
├── index.html         # Main HTML page
├── styles.css         # Styling
├── package.json       # Dependencies
├── iptv_manager.db    # SQLite database (auto-created)
└── README.md          # This file
```

## Security Notes

⚠️ **Important**: This is a basic implementation. For production use, consider:

1. **Add Authentication**: Implement proper user authentication (JWT, sessions)
2. **Add Authorization**: Restrict API access to authenticated users only
3. **Use HTTPS**: Always use SSL/TLS in production
4. **Environment Variables**: Store sensitive config in `.env` file
5. **Input Validation**: Add server-side validation for all inputs
6. **Rate Limiting**: Prevent API abuse with rate limiting
7. **Database Backups**: Regularly backup your SQLite database

## Troubleshooting

### Port already in use
```bash
# Find process using port 3000
lsof -i :3000
# Kill the process
kill -9 <PID>
```

### Database locked
```bash
# Stop the server and restart
pm2 restart iptv-manager
```

### Cannot connect to server
- Check firewall settings
- Ensure server is running: `pm2 status`
- Check server logs: `pm2 logs iptv-manager`

## Support

For issues or questions, contact your system administrator.

## License

Private use only.
