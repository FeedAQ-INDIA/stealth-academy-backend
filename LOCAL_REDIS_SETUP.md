# Local Redis Setup for Development

## Quick Start - Test Locally Without Redis Cloud

If you want to test the email queue system locally without connecting to Redis Cloud, follow these steps:

### Option 1: Use Docker (Recommended - Easiest)

```powershell
# Pull Redis image
docker pull redis:latest

# Run Redis container
docker run --name redis-local -p 6379:6379 -d redis:latest

# Verify it's running
docker ps
```

Then in your `.env` file, **comment out or remove** all Redis Cloud variables:
```env
# REDIS_HOST=redis-13773.c330.asia-south1-1.gce.redns.redis-cloud.com
# REDIS_PASSWORD=mAjRZZgLTxX0b0qXmcFlmPj9f5a3kBX9
```

The system will automatically connect to `localhost:6379`.

### Option 2: Install Redis on Windows

#### Using WSL2 (Windows Subsystem for Linux)

```powershell
# In PowerShell, start WSL
wsl

# In WSL terminal
sudo apt-get update
sudo apt-get install redis-server

# Start Redis
sudo service redis-server start

# Test Redis
redis-cli ping
# Should return: PONG
```

Then comment out Redis Cloud variables in `.env`:
```env
# REDIS_HOST=...
# REDIS_PASSWORD=...
```

#### Using Chocolatey

```powershell
# Install Chocolatey if you don't have it
# See: https://chocolatey.org/install

# Install Redis
choco install redis-64

# Redis will start automatically as a Windows service
```

#### Using Memurai (Redis for Windows)

Download from: https://www.memurai.com/get-memurai

### Option 3: Use Redis Cloud (Production)

To connect to your existing Redis Cloud instance, you need the correct port number.

#### Find Your Redis Cloud Port:

1. Go to https://app.redislabs.com/
2. Click on your database
3. Look for "Public endpoint" - it will show something like:
   ```
   redis-13773.c330.asia-south1-1.gce.redns.redis-cloud.com:13773
   ```
   The number after the `:` is your port (e.g., `13773`)

#### Update your `.env`:

```env
REDIS_HOST=redis-13773.c330.asia-south1-1.gce.redns.redis-cloud.com
REDIS_PORT=13773
REDIS_PASSWORD=mAjRZZgLTxX0b0qXmcFlmPj9f5a3kBX9
REDIS_TLS=true
```

OR use the URL format:

```env
REDIS_URL=redis://default:mAjRZZgLTxX0b0qXmcFlmPj9f5a3kBX9@redis-13773.c330.asia-south1-1.gce.redns.redis-cloud.com:13773
```

## Testing Your Setup

After setting up Redis, run:

```powershell
npm run test:queue
```

You should see:
```
✅ Redis connection successful!
✅ Queue stats retrieved!
✅ All tests passed!
```

## Common Issues

### Issue: "Connection timeout"

**For Local Redis:**
- Check if Redis is running: `redis-cli ping` (or `docker ps` if using Docker)
- Make sure no firewall is blocking port 6379

**For Redis Cloud:**
- Verify you have the correct port number
- Check if `REDIS_TLS=true` is set
- Verify network connectivity to Redis Cloud

### Issue: "ECONNREFUSED"

**Solution:**
- Redis is not running locally
- Start Redis: `docker start redis-local` or `sudo service redis-server start` (WSL)
- Or configure Redis Cloud properly

### Issue: "WRONGPASS"

**Solution:**
- Wrong password for Redis Cloud
- For local Redis, remove the `REDIS_PASSWORD` variable

## Recommendation

For **development**: Use Docker or local Redis (no password needed, simple setup)

For **production**: Use Redis Cloud with proper credentials

## Quick Docker Commands

```powershell
# Start Redis
docker start redis-local

# Stop Redis
docker stop redis-local

# Check logs
docker logs redis-local

# Connect to Redis CLI
docker exec -it redis-local redis-cli

# Remove Redis container
docker rm -f redis-local
```

## Verify Everything Works

1. **Start Redis** (Docker or local)
2. **Comment out Redis Cloud variables** in `.env` (for local testing)
3. **Run test**: `npm run test:queue`
4. **Start server**: `npm run dev`
5. **Check health**: `http://localhost:3000/email-queue/health`

You should see:
```json
{
  "success": true,
  "data": {
    "redis": { "connected": true, "ping": "PONG" },
    "queue": { "waiting": 0, "active": 0, ... },
    "worker": { "healthy": true, "status": "idle" }
  }
}
```

## Next Steps

Once local testing works, you can configure Redis Cloud for production deployment.

---

**Quick Commands Summary:**

```powershell
# Using Docker (easiest)
docker run --name redis-local -p 6379:6379 -d redis:latest
# Comment out REDIS_* in .env
npm run test:queue
npm run dev

# Check health
curl http://localhost:3000/email-queue/health
```
