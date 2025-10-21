# Redis Cloud Setup Guide

## Getting Your Redis Cloud Credentials

You mentioned an API key: `S98jxhf0t3j8nwwt1jfl8i24kvc9df5lzzl1iurekil5d7wojk`

This appears to be a Redis password. To complete the setup, you need to get the full connection details from Redis Cloud.

### Step 1: Log into Redis Cloud

1. Go to [Redis Cloud Console](https://app.redislabs.com/)
2. Log in with your credentials

### Step 2: Find Your Database

1. Navigate to **Databases** in the left sidebar
2. Click on your database

### Step 3: Get Connection Details

You should see connection information like:

```
Public endpoint: redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com:12345
Default user password: S98jxhf0t3j8nwwt1jfl8i24kvc9df5lzzl1iurekil5d7wojk
```

### Step 4: Configure Your Application

#### Option A: Using Redis URL (Recommended)

Create or update your `.env` file:

```env
# Format: redis://[username]:[password]@[host]:[port]
REDIS_URL=redis://default:S98jxhf0t3j8nwwt1jfl8i24kvc9df5lzzl1iurekil5d7wojk@redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com:12345
```

Replace:
- `S98jxhf0t3j8nwwt1jfl8i24kvc9df5lzzl1iurekil5d7wojk` - Your actual password (keep this if correct)
- `redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com` - Your actual Redis host
- `12345` - Your actual Redis port

#### Option B: Using Individual Parameters

```env
REDIS_HOST=redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com
REDIS_PORT=12345
REDIS_PASSWORD=S98jxhf0t3j8nwwt1jfl8i24kvc9df5lzzl1iurekil5d7wojk
REDIS_TLS=true  # Usually true for Redis Cloud
```

## Testing Local Development

If you don't have Redis Cloud set up yet, you can test locally:

### Install Redis Locally

#### Windows (using Chocolatey):
```powershell
choco install redis-64
redis-server
```

#### Windows (using WSL):
```bash
wsl
sudo apt-get install redis-server
redis-server
```

#### macOS:
```bash
brew install redis
brew services start redis
```

#### Linux:
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

### Use Local Redis

Simply don't set any Redis environment variables, and the system will use `localhost:6379`:

```env
# No REDIS_URL or REDIS_* variables = use local Redis
START_EMAIL_WORKER=true
```

## Verify Connection

Run the test script:

```bash
npm run test:queue
```

You should see:

```
✅ Redis connection successful!
```

## Common Issues

### Issue: "getaddrinfo ENOTFOUND"

**Problem**: Can't resolve the Redis hostname

**Solution**:
1. Double-check your `REDIS_HOST` or `REDIS_URL`
2. Make sure you copied the full hostname from Redis Cloud
3. Check if your network can reach Redis Cloud (firewall/VPN issues)

### Issue: "WRONGPASS invalid username-password pair"

**Problem**: Incorrect password

**Solution**:
1. Verify the password in Redis Cloud dashboard
2. Make sure you're using the "Default user password"
3. Check for extra spaces in your `.env` file

### Issue: "Connection timeout"

**Problem**: Can't connect to Redis

**Solution**:
1. Check if `REDIS_TLS=true` (Redis Cloud usually requires TLS)
2. Verify the port number
3. Check your firewall settings

### Issue: "ECONNREFUSED localhost:6379"

**Problem**: Local Redis not running

**Solution**:
1. Install Redis locally (see above)
2. Start Redis: `redis-server`
3. Or configure Redis Cloud instead

## Example: Complete .env File

```env
# Database
DB_HOST=your-db-host
DB_USER=postgres
DB_PASSWORD=your-password
DB_DB=feedaq_academy
DB_DIALECT=postgres
DB_PORT=5432

# JWT
ACCESS_TOKEN_SECRET=your_secret
TEMP_ACCESS_TOKEN_SECRET=temp_secret
REFRESH_TOKEN_SECRET=refresh_secret

# Redis Cloud (Option 1: URL format)
REDIS_URL=redis://default:S98jxhf0t3j8nwwt1jfl8i24kvc9df5lzzl1iurekil5d7wojk@redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com:12345

# OR Redis Cloud (Option 2: Individual params)
# REDIS_HOST=redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com
# REDIS_PORT=12345
# REDIS_PASSWORD=S98jxhf0t3j8nwwt1jfl8i24kvc9df5lzzl1iurekil5d7wojk
# REDIS_TLS=true

# SMTP
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=noreply@feedaq.com
SMTP_PASS=your_smtp_password

# Worker
START_EMAIL_WORKER=true

# Other configs...
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## Next Steps

1. ✅ Get correct Redis Cloud credentials
2. ✅ Update your `.env` file
3. ✅ Run `npm run test:queue` to verify
4. ✅ Start your server: `npm run dev`
5. ✅ Test with `/email-queue/health` endpoint

## Need Help?

Contact your Redis Cloud administrator or check:
- Redis Cloud Dashboard: https://app.redislabs.com/
- Redis Cloud Docs: https://docs.redis.com/latest/rc/
