# Deployment Guide - QR Attendance Tracking System

## 📋 Prerequisites

Before deploying, ensure you have:
- Node.js 18+ installed
- MySQL 8.0+ database
- Domain name (for production)
- SSL certificate (recommended)

---

## 🚀 Deployment Options

### Option 1: Docker Deployment (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/attendance-tracker.git
   cd attendance-tracker
   ```

2. **Create environment file**
   ```bash
   cp .env.production.example .env
   ```

3. **Update environment variables in `.env`**
   ```dotenv
   NODE_ENV=production
   DB_USER=your_db_user
   DB_PASSWORD=your_secure_password
   DB_NAME=attendance_tracker
   JWT_SECRET=your_64_char_random_secret
   FRONTEND_URL=https://yourdomain.com
   VITE_API_BASE_URL=https://api.yourdomain.com/api
   ```

4. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

5. **Check logs**
   ```bash
   docker-compose logs -f
   ```

---

### Option 2: Vercel + Railway/Render

#### Frontend (Vercel)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Create frontend env file**
   ```bash
   cd frontend
   echo "VITE_API_BASE_URL=https://your-backend-url.railway.app/api" > .env.production
   ```

3. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

#### Backend (Railway)

1. **Install Railway CLI**
   ```bash
   npm i -g @railway/cli
   railway login
   ```

2. **Initialize Railway project**
   ```bash
   cd backend
   railway init
   ```

3. **Add MySQL service in Railway dashboard**

4. **Set environment variables in Railway:**
   - `NODE_ENV=production`
   - `PORT=5001`
   - `DB_HOST` (from Railway MySQL)
   - `DB_USER` (from Railway MySQL)
   - `DB_PASSWORD` (from Railway MySQL)
   - `DB_NAME` (from Railway MySQL)
   - `JWT_SECRET=your_secret`
   - `CORS_ORIGIN=https://your-vercel-domain.vercel.app`

5. **Deploy**
   ```bash
   railway up
   ```

---

### Option 3: VPS/Cloud Server (AWS, DigitalOcean, etc.)

1. **SSH into your server**
   ```bash
   ssh user@your-server-ip
   ```

2. **Install dependencies**
   ```bash
   # Node.js
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # MySQL
   sudo apt-get install mysql-server

   # Nginx
   sudo apt-get install nginx

   # PM2 (Process Manager)
   npm install -g pm2
   ```

3. **Clone and setup**
   ```bash
   git clone https://github.com/yourusername/attendance-tracker.git
   cd attendance-tracker
   npm install
   ```

4. **Setup MySQL database**
   ```bash
   mysql -u root -p
   CREATE DATABASE attendance_tracker;
   CREATE USER 'attendance_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON attendance_tracker.* TO 'attendance_user'@'localhost';
   FLUSH PRIVILEGES;
   USE attendance_tracker;
   SOURCE database/schema.sql;
   exit;
   ```

5. **Create backend .env**
   ```bash
   cd backend
   cat > .env << EOF
   NODE_ENV=production
   PORT=5001
   DB_HOST=localhost
   DB_USER=attendance_user
   DB_PASSWORD=your_password
   DB_NAME=attendance_tracker
   JWT_SECRET=$(openssl rand -base64 64)
   CORS_ORIGIN=https://yourdomain.com
   EOF
   ```

6. **Build frontend**
   ```bash
   cd ../frontend
   echo "VITE_API_BASE_URL=https://api.yourdomain.com/api" > .env.production
   npm run build
   ```

7. **Configure Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/attendance
   ```
   
   Add:
   ```nginx
   # Frontend
   server {
       listen 80;
       server_name yourdomain.com;
       root /var/www/attendance-tracker/frontend/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }

   # Backend API
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://localhost:5001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

8. **Enable site and SSL**
   ```bash
   sudo ln -s /etc/nginx/sites-available/attendance /etc/nginx/sites-enabled/
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
   sudo systemctl restart nginx
   ```

9. **Start backend with PM2**
   ```bash
   cd backend
   pm2 start server.js --name "attendance-backend"
   pm2 save
   pm2 startup
   ```

---

## 🔒 Security Checklist

Before going live:

- [ ] Change default JWT_SECRET to a random 64+ character string
- [ ] Use strong database passwords
- [ ] Enable HTTPS/SSL
- [ ] Set proper CORS_ORIGIN (no wildcards in production)
- [ ] Disable debug logging
- [ ] Remove any test/demo users
- [ ] Setup database backups
- [ ] Configure rate limiting
- [ ] Setup monitoring (uptime, errors)

---

## 📊 Monitoring

### Health Check Endpoints

- Backend: `GET /api/health`
- Frontend: `GET /` (should return 200)

### Recommended Tools

- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Error Tracking**: Sentry
- **Logging**: LogRocket, Datadog
- **Performance**: Lighthouse

---

## 🔧 Troubleshooting

### Common Issues

**1. CORS Errors**
- Verify CORS_ORIGIN matches frontend URL exactly
- Check for trailing slashes

**2. Database Connection Failed**
- Verify DB credentials
- Check if MySQL is running
- Ensure database exists

**3. JWT Token Issues**
- Verify JWT_SECRET is the same across restarts
- Check token expiry settings

**4. Build Fails**
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version: `node -v` (should be 18+)

---

## 📝 Environment Variables Reference

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| NODE_ENV | Environment | `production` |
| PORT | Server port | `5001` |
| DB_HOST | Database host | `localhost` |
| DB_PORT | Database port | `3306` |
| DB_USER | Database user | `attendance_user` |
| DB_PASSWORD | Database password | `secure_password` |
| DB_NAME | Database name | `attendance_tracker` |
| JWT_SECRET | JWT signing key | `random_64_chars` |
| JWT_EXPIRY | Token expiry | `24h` |
| CORS_ORIGIN | Frontend URL | `https://yourdomain.com` |

### Frontend (.env.production)

| Variable | Description | Example |
|----------|-------------|---------|
| VITE_API_BASE_URL | Backend API URL | `https://api.yourdomain.com/api` |

---

## 🎉 Post-Deployment

1. **Test all features**
   - User registration/login
   - QR code generation
   - Attendance marking
   - Admin panel

2. **Create admin user**
   - Use the demo seed script or create manually

3. **Setup automated backups**
   ```bash
   # Example cron job for daily backup
   0 2 * * * mysqldump -u root -p attendance_tracker > /backups/db_$(date +\%Y\%m\%d).sql
   ```

4. **Monitor logs**
   ```bash
   pm2 logs attendance-backend
   # or
   docker-compose logs -f backend
   ```
