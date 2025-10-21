# Email Queue Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Redis Configuration
- [ ] Obtain correct Redis Cloud credentials
  - [ ] Redis Host
  - [ ] Redis Port  
  - [ ] Redis Password
- [ ] Add to production `.env` or `prod.env`:
  ```env
  REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_HOST:YOUR_PORT
  # OR
  REDIS_HOST=your-host
  REDIS_PORT=your-port
  REDIS_PASSWORD=your-password
  REDIS_TLS=true
  ```
- [ ] Test connection: `npm run test:queue`

### 2. SMTP Configuration
- [ ] Verify SMTP credentials are set:
  ```env
  SMTP_HOST=smtp.hostinger.com
  SMTP_PORT=587
  SMTP_USER=noreply@feedaq.com
  SMTP_PASS=your_password
  ```

### 3. Worker Configuration
- [ ] Enable worker in production:
  ```env
  START_EMAIL_WORKER=true
  ```

### 4. Code Review
- [ ] All dependencies installed: `bullmq`, `ioredis`
- [ ] Routes registered in `server.js`
- [ ] Worker auto-starts on server startup
- [ ] Graceful shutdown handlers in place

## 🧪 Testing Checklist

### Local Testing
- [ ] Run queue test: `npm run test:queue`
- [ ] Start server: `npm run dev`
- [ ] Test health endpoint: `GET /email-queue/health`
- [ ] Check server logs for:
  - [ ] "Redis client connected successfully"
  - [ ] "Email worker started successfully"
  - [ ] "Database connection established"

### Integration Testing
- [ ] Send a test email via API:
  ```bash
  POST /email-queue/test
  {
    "to": "your-email@example.com"
  }
  ```
- [ ] Invite a user to a course
- [ ] Check queue stats: `GET /email-queue/stats`
- [ ] Verify email was received

## 🚀 Deployment Steps

### Step 1: Deploy Code
```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Verify installation
npm list bullmq ioredis
```

### Step 2: Update Environment
```bash
# Add Redis credentials to prod.env
nano prod.env
# or
vim prod.env

# Verify environment variables
cat prod.env | grep REDIS
```

### Step 3: Test Before Starting
```bash
# Test Redis connection
npm run test:queue

# Should see:
# ✅ Redis connection successful!
# ✅ Queue stats retrieved!
```

### Step 4: Start Server
```bash
# Using PM2 (production)
pm2 restart server.js

# Or start fresh
pm2 start server.js --name feedaq-academy

# Check logs
pm2 logs feedaq-academy
```

### Step 5: Verify Deployment
```bash
# Check health
curl https://api.feedaq.com/email-queue/health

# Should return:
# {
#   "success": true,
#   "data": {
#     "redis": { "connected": true },
#     "worker": { "healthy": true }
#   }
# }
```

## 📊 Post-Deployment Monitoring

### First Hour
- [ ] Monitor server logs for errors
- [ ] Check queue stats every 15 minutes
- [ ] Send test email and verify delivery
- [ ] Monitor failed jobs count

### First Day
- [ ] Review queue statistics
- [ ] Check email delivery rate
- [ ] Monitor Redis memory usage
- [ ] Review error logs

### First Week
- [ ] Analyze queue performance metrics
- [ ] Adjust worker concurrency if needed
- [ ] Clean old jobs: `POST /email-queue/clean`
- [ ] Review and optimize retry strategy

## 🔍 Health Checks

### Automated Monitoring
Set up monitoring for:
```bash
# Health endpoint
GET /email-queue/health
# Check every 5 minutes
# Alert if not 200 OK

# Queue stats
GET /email-queue/stats
# Check failed jobs count
# Alert if > 100
```

### Manual Checks
```bash
# Check Redis
redis-cli -h YOUR_HOST -p YOUR_PORT -a YOUR_PASSWORD ping

# Check worker process
pm2 status

# Check logs
pm2 logs --lines 100

# Check queue stats
curl http://localhost:3000/email-queue/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🐛 Troubleshooting Guide

### Issue: Redis connection fails
**Check:**
```bash
# Test connection
npm run test:queue

# Check environment
echo $REDIS_URL
cat prod.env | grep REDIS

# Test Redis directly
redis-cli -h YOUR_HOST -p YOUR_PORT -a YOUR_PASSWORD ping
```

### Issue: Worker not processing jobs
**Check:**
```bash
# Verify worker is running
pm2 logs | grep "Email worker"

# Check queue stats
curl http://localhost:3000/email-queue/stats

# Check environment
cat prod.env | grep START_EMAIL_WORKER
```

### Issue: Emails not being sent
**Check:**
```bash
# Test SMTP
node -e "require('./src/utils/emailService').sendTestEmail('test@example.com')"

# Check failed jobs
curl http://localhost:3000/email-queue/stats | jq '.data.failed'

# Review logs
pm2 logs | grep "Email"
```

## 📈 Performance Tuning

### Adjust Worker Concurrency
Edit `src/workers/emailWorker.js`:
```javascript
concurrency: 10,  // Increase from 5 to 10 for more throughput
```

### Adjust Rate Limiting
```javascript
limiter: {
    max: 20,       // Increase from 10 to 20
    duration: 1000
}
```

### Adjust Job Retention
Edit `src/queues/emailQueue.js`:
```javascript
removeOnComplete: {
    age: 12 * 3600,  // Keep for 12 hours instead of 24
    count: 500       // Keep last 500 instead of 1000
}
```

## 🔄 Rollback Plan

If issues occur:

### Quick Rollback
```bash
# Stop current version
pm2 stop feedaq-academy

# Restore previous version
git checkout previous-commit-hash

# Install dependencies
npm install

# Start server
pm2 start server.js
```

### Emergency Fix
If emails must be sent immediately:
```bash
# Disable worker temporarily
export START_EMAIL_WORKER=false

# Use direct SMTP (create emergency script)
# Or manually process failed jobs
```

## 📞 Support Contacts

**Redis Issues:**
- Redis Cloud Support: https://redis.com/support/
- Redis Cloud Dashboard: https://app.redislabs.com/

**Email Issues:**
- SMTP Provider Support
- Check Hostinger support

**Application Issues:**
- Review logs: `pm2 logs`
- Check documentation: `EMAIL_QUEUE_SETUP.md`
- Test script: `npm run test:queue`

## ✅ Final Sign-Off

- [ ] All tests passing
- [ ] Redis connected
- [ ] Worker running
- [ ] Emails sending
- [ ] Monitoring configured
- [ ] Team notified
- [ ] Documentation reviewed

---

**Deployment Date:** _____________
**Deployed By:** _____________
**Verified By:** _____________
**Status:** ⬜ Ready ⬜ In Progress ⬜ Complete ⬜ Rollback

## 🎉 Success Criteria

Deployment is successful when:
- ✅ `/email-queue/health` returns 200 OK
- ✅ Course invitations send successfully
- ✅ Queue stats show jobs processing
- ✅ No errors in server logs
- ✅ Email delivery confirmed
- ✅ Redis connection stable
