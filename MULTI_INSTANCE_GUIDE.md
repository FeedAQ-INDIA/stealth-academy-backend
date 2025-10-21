# Multi-Instance Deployment Guide

## Current Status ✅

Your BullMQ and Redis configuration is **READY for multiple instances** out of the box!

## How It Works

### Architecture
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Instance 1  │  │ Instance 2  │  │ Instance 3  │
│             │  │             │  │             │
│ API + Queue │  │ API + Queue │  │ API + Worker│
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┴────────────────┘
                        │
                ┌───────▼────────┐
                │  Redis Cloud   │
                │  (Shared Queue)│
                └────────────────┘
```

### Job Flow
1. **Any instance** can add jobs to the queue
2. Jobs are stored in **Redis** (centralized)
3. **Workers from any instance** can process jobs
4. BullMQ ensures **no duplicate processing**

## Configuration Options

### Option 1: All Instances with Workers (Current Setup)
**Best for:** Load balancing and high availability

```bash
# All instances run both API and workers
START_EMAIL_WORKER=true  # (default)
```

**Pros:**
- Automatic load distribution
- High availability (if one fails, others continue)
- Simple configuration

**Cons:**
- All instances need SMTP credentials
- Higher resource usage per instance

### Option 2: Dedicated Worker Instances
**Best for:** Separating concerns and scaling independently

```bash
# API instances (no workers)
START_EMAIL_WORKER=false

# Worker instances (dedicated)
START_EMAIL_WORKER=true
```

**Pros:**
- Scale API and workers independently
- Centralize SMTP credentials
- Better resource allocation

**Cons:**
- More complex deployment
- Need to manage different instance types

### Option 3: Hybrid Approach
**Best for:** Flexibility and cost optimization

```bash
# 2-3 API instances (no workers)
START_EMAIL_WORKER=false

# 1-2 dedicated worker instances
START_EMAIL_WORKER=true
```

## Deployment Configurations

### Docker Compose Example

```yaml
version: '3.8'

services:
  # API instances (no workers)
  api-1:
    build: .
    environment:
      - START_EMAIL_WORKER=false
      - REDIS_URL=${REDIS_URL}
    ports:
      - "3001:3000"

  api-2:
    build: .
    environment:
      - START_EMAIL_WORKER=false
      - REDIS_URL=${REDIS_URL}
    ports:
      - "3002:3000"

  # Dedicated worker instance
  worker-1:
    build: .
    environment:
      - START_EMAIL_WORKER=true
      - REDIS_URL=${REDIS_URL}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
    # No port mapping needed for workers
    command: node workers/standalone-worker.js
```

### Kubernetes Example

```yaml
# API Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: feedaq-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api
        env:
        - name: START_EMAIL_WORKER
          value: "false"
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url

---
# Worker Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: feedaq-worker
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: worker
        env:
        - name: START_EMAIL_WORKER
          value: "true"
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
```

## Performance Tuning

### Worker Concurrency
Adjust based on your instance resources:

```javascript
// In emailWorker.js
emailWorker = new Worker('email-queue', processEmailJob, {
    connection,
    concurrency: 5,  // Increase to 10-20 for powerful instances
    limiter: {
        max: 10,      // Jobs per second per worker
        duration: 1000
    }
});
```

**Recommendations:**
- **Small instance** (1 CPU, 512MB RAM): `concurrency: 2-3`
- **Medium instance** (2 CPU, 2GB RAM): `concurrency: 5-10`
- **Large instance** (4+ CPU, 4GB+ RAM): `concurrency: 10-20`

### Global Rate Limiting

For strict rate limits across all instances, implement Redis-based rate limiting:

```javascript
// Add to emailWorker.js
const { RateLimiterRedis } = require('rate-limiter-flexible');

const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'email_rate_limit',
    points: 100,      // Total emails
    duration: 60,     // Per 60 seconds (globally)
});

// Use in processEmailJob before sending
await rateLimiter.consume('global', 1);
```

## Monitoring

### Key Metrics to Track

1. **Queue Metrics** (per instance or centralized)
```javascript
// GET /api/email-queue/stats
{
    "waiting": 15,
    "active": 8,
    "completed": 1250,
    "failed": 3,
    "delayed": 0
}
```

2. **Worker Metrics**
- Jobs processed per instance
- Average processing time
- Failure rate
- Stalled jobs

3. **SMTP Metrics**
- Connection success rate
- Send success rate
- Rate limit hits

### Health Checks

```javascript
// Add to emailWorker.js
const getWorkerHealth = () => {
    return {
        isRunning: emailWorker?.isRunning() || false,
        isPaused: emailWorker?.isPaused() || false,
        isClosing: emailWorker?.closing || false,
        instanceId: process.env.INSTANCE_ID || 'unknown'
    };
};
```

## Best Practices

### 1. Instance Identification
Add instance IDs for tracking:

```javascript
// In server.js
process.env.INSTANCE_ID = process.env.HOSTNAME || 
                          `instance-${Date.now()}`;
logger.info(`Instance ID: ${process.env.INSTANCE_ID}`);
```

### 2. Graceful Shutdown
Your current setup already handles this well:

```javascript
// In server.js (ensure this exists)
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    
    // Stop accepting new requests
    server.close();
    
    // Stop worker (waits for active jobs)
    await stopEmailWorker();
    
    // Close Redis connections
    await closeRedisConnection();
    
    process.exit(0);
});
```

### 3. Job Idempotency
Ensure jobs can be retried safely:

```javascript
// When adding jobs, use job IDs
await queue.add('course-invite', emailData, {
    jobId: `invite-${inviteId}`,  // Prevents duplicates
    priority: 1,
    removeOnComplete: true
});
```

### 4. Dead Letter Queue
Handle permanently failed jobs:

```javascript
// In emailQueue.js
defaultJobOptions: {
    attempts: 3,
    backoff: {
        type: 'exponential',
        delay: 2000
    },
    removeOnComplete: {
        age: 24 * 3600,
        count: 1000
    },
    removeOnFail: false  // Keep failed jobs for analysis
}
```

## Scaling Strategy

### Horizontal Scaling (Recommended)

**When to scale up:**
- Queue waiting count > 100
- Active jobs = max concurrency
- API response time > 200ms
- CPU usage > 70%

**How to scale:**
1. Add more API instances (START_EMAIL_WORKER=false)
2. Add more worker instances (START_EMAIL_WORKER=true)
3. Monitor queue metrics
4. Adjust concurrency per instance

### Vertical Scaling

**When to scale up:**
- High memory usage per instance
- CPU bottlenecks
- SMTP connection issues

**How to scale:**
1. Increase instance size
2. Increase worker concurrency
3. Increase rate limits

## Testing Multi-Instance Setup

### Local Testing with Docker Compose

```bash
# 1. Start multiple instances
docker-compose up --scale api=3 --scale worker=2

# 2. Send test emails through different instances
curl http://localhost:3001/api/email-queue/test -X POST -d '{"to":"test@example.com"}'
curl http://localhost:3002/api/email-queue/test -X POST -d '{"to":"test@example.com"}'

# 3. Check queue stats
curl http://localhost:3001/api/email-queue/stats

# 4. Monitor logs from all instances
docker-compose logs -f
```

### Load Testing

```bash
# Install Artillery
npm install -g artillery

# Create load test config (load-test.yml)
artillery run load-test.yml

# Monitor queue during load test
watch -n 1 'curl -s http://localhost:3000/api/email-queue/stats'
```

## Common Issues and Solutions

### Issue 1: Job Duplication
**Symptom:** Same email sent multiple times

**Solution:** Use job IDs
```javascript
await queue.add('course-invite', data, {
    jobId: `unique-id-${inviteId}`,  // Prevents duplicates
});
```

### Issue 2: Uneven Load Distribution
**Symptom:** One worker processes all jobs

**Solution:** Check Redis connection, ensure all workers are connected

### Issue 3: SMTP Connection Limits
**Symptom:** "Too many connections" errors

**Solution:** 
- Reduce number of worker instances
- Reduce concurrency per worker
- Use connection pooling

### Issue 4: Stalled Jobs
**Symptom:** Jobs stuck in "active" state

**Solution:** Add stall detection
```javascript
emailWorker.on('stalled', (jobId) => {
    logger.warn(`Job ${jobId} stalled, will be retried`);
});
```

## Current Setup Assessment

✅ **What's Already Good:**
- Shared Redis connection across instances
- Automatic worker distribution
- Retry mechanism with exponential backoff
- Graceful shutdown handling
- Job cleanup (completed/failed)

⚠️ **What Could Be Improved:**
- Add instance identification
- Implement global rate limiting
- Add job idempotency (jobId)
- Add monitoring dashboard
- Implement dead letter queue handling

## Next Steps

1. **Immediate:** Test with 2-3 instances locally
2. **Short-term:** Add instance identification and monitoring
3. **Medium-term:** Implement global rate limiting
4. **Long-term:** Set up monitoring dashboard (Bull Board)

## Resources

- [BullMQ Multi-Instance Guide](https://docs.bullmq.io/)
- [Redis Connection Best Practices](https://redis.io/docs/manual/patterns/)
- Your project docs: `EMAIL_QUEUE_SETUP.md`
