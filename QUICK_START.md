# 🚀 Email Queue Quick Start

## ⚡ Super Quick Setup (Local Development)

```powershell
# 1. Start Redis with Docker
docker run --name redis-local -p 6379:6379 -d redis:latest

# 2. Remove/Comment Redis Cloud config in .env
# REDIS_HOST=...
# REDIS_PASSWORD=...

# 3. Test
npm run test:queue

# 4. Start server
npm run dev

# 5. Test endpoint
curl http://localhost:3000/email-queue/health
```

Expected output:
```
✅ Redis connection successful!
✅ Queue stats retrieved!
✅ All tests passed!
```

---

## 📋 Package Info

### Installed ✅
- `redis@5.8.3` - Official Redis client
- `bullmq@5.61.0` - Queue system

### Removed ❌
- `ioredis@5.8.1` - Old Redis client

---

## 🔧 Configuration Options

### Option 1: Local Redis (Dev) 👈 EASIEST
```env
# No config needed! Just don't set REDIS_* variables
# System auto-connects to localhost:6379
```

### Option 2: Redis Cloud (Production)
```env
REDIS_URL=redis://default:PASSWORD@HOST:PORT
# OR
REDIS_HOST=your-host.cloud.redislabs.com
REDIS_PORT=13773  # Get this from Redis Cloud dashboard
REDIS_PASSWORD=your-password
REDIS_TLS=true
```

---

## 🎯 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/email-queue/health` | GET | Health check (public) |
| `/email-queue/stats` | GET | Queue statistics (auth) |
| `/email-queue/test` | POST | Send test email (auth) |

---

## 📚 Documentation Files

1. **LOCAL_REDIS_SETUP.md** 👈 START HERE for local dev
2. **REDIS_SETUP.md** - Redis Cloud setup
3. **EMAIL_QUEUE_SETUP.md** - Complete usage guide
4. **MIGRATION_REDIS_PACKAGE.md** - Migration details
5. **IMPLEMENTATION_SUMMARY.md** - Full technical docs

---

## 🐛 Troubleshooting

### "Connection timeout"
```powershell
# Check Redis is running
docker ps
# or
redis-cli ping
```

### "ECONNREFUSED"
```powershell
# Start Redis
docker start redis-local
```

### "Can't find port"
Go to https://app.redislabs.com/ → Your Database → Check "Public endpoint"

---

## ✅ Verification

```powershell
# 1. Test queue
npm run test:queue

# 2. Start server
npm run dev

# 3. Check health
curl http://localhost:3000/email-queue/health

# 4. Send test email (with auth token)
curl -X POST http://localhost:3000/email-queue/test `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -d '{"to": "test@example.com"}'
```

---

## 📞 Need Help?

1. Read `LOCAL_REDIS_SETUP.md` for detailed local setup
2. Check server logs for connection errors
3. Verify environment variables in `.env`
4. Test with `npm run test:queue`

---

## 🎉 You're Ready!

The email queue system is now implemented with the official `redis` package. Just start Redis (local or cloud) and you're good to go!

**Files Changed**: 7 files updated  
**New Files**: 6 documentation files created  
**Status**: ✅ Complete and Ready  
**Next Step**: Choose local or cloud Redis and test! 🚀
