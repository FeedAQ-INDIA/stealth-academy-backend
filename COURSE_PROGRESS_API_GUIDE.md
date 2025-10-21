# CourseRoomProgress - Backend API Implementation Guide

## 📋 Overview

This guide provides backend API specifications for the CourseRoomProgress feature. The frontend expects specific data structures to display user progress, enrollment status, and activity logs.

## 🔗 Required API Endpoints

### 1. Get User Progress
**Endpoint**: `GET /user-progress/:courseId/:userId`

**Description**: Returns enrollment details and activity logs for a specific user in a course.

**URL Parameters**:
- `courseId` (integer, required) - The course ID
- `userId` (integer, required) - The user ID

**Response Format**:
```json
{
  "success": true,
  "message": "User progress retrieved successfully",
  "results": {
    "enrollments": {
      "v_created_date": "13-Oct-2025",
      "v_created_time": "23:20:51",
      "v_updated_date": "15-Oct-2025",
      "v_updated_time": "23:16:06",
      "enrollmentId": 3,
      "userId": 1,
      "courseId": 1,
      "enrollmentStatus": "IN_PROGRESS",
      "enrollmentDate": "2025-10-13T17:50:51.683Z",
      "completionDate": null,
      "certificateUrl": null,
      "metadata": {},
      "enrollment_created_at": "2025-10-13T17:50:51.683Z",
      "enrollment_updated_at": "2025-10-15T17:46:06.101Z"
    },
    "activityLogs": [
      {
        "v_created_date": "15-Oct-2025",
        "v_created_time": "23:16:05",
        "v_updated_date": "15-Oct-2025",
        "v_updated_time": "23:16:05",
        "progressId": 2,
        "userId": 1,
        "courseId": 1,
        "courseContentId": 1,
        "progressStatus": "COMPLETED",
        "activityDuration": 0,
        "progressPercent": "0.00",
        "metadata": {},
        "user_course_content_progress_created_at": "2025-10-15T17:46:05.730Z",
        "user_course_content_progress_updated_at": "2025-10-15T17:46:05.730Z"
      }
    ]
  }
}
```

**Status Codes**:
- `200` - Success
- `404` - User or course not found
- `401` - Unauthorized
- `500` - Server error

---

### 2. Get All Users Progress (Optional - for optimization)
**Endpoint**: `GET /user-progress/course/:courseId/all`

**Description**: Returns progress data for all users in a course (instructor/admin only).

**URL Parameters**:
- `courseId` (integer, required) - The course ID

**Query Parameters**:
- `status` (string, optional) - Filter by enrollment status (ENROLLED, IN_PROGRESS, COMPLETED, CERTIFIED)
- `sortBy` (string, optional) - Sort field (progress, enrollmentDate, completionDate)
- `order` (string, optional) - Sort order (asc, desc)

**Response Format**:
```json
{
  "success": true,
  "message": "All users progress retrieved successfully",
  "results": [
    {
      "userId": 1,
      "enrollments": { /* same as above */ },
      "activityLogs": [ /* array of activities */ ]
    },
    {
      "userId": 2,
      "enrollments": { /* same as above */ },
      "activityLogs": [ /* array of activities */ ]
    }
  ]
}
```

---

### 3. Update User Progress
**Endpoint**: `POST /user-progress/update`

**Description**: Updates user progress for a specific content item.

**Request Body**:
```json
{
  "courseId": 1,
  "courseContentId": 5,
  "progressStatus": "COMPLETED",
  "activityDuration": 15,
  "progressPercent": 100,
  "metadata": {}
}
```

**Response Format**:
```json
{
  "success": true,
  "message": "Progress updated successfully",
  "results": {
    "progressId": 10,
    "userId": 1,
    "courseId": 1,
    "courseContentId": 5,
    "progressStatus": "COMPLETED",
    "activityDuration": 15,
    "progressPercent": "100.00",
    "user_course_content_progress_updated_at": "2025-10-21T12:00:00.000Z"
  }
}
```

---

### 4. Get Activity Logs
**Endpoint**: `GET /user-progress/:courseId/:userId/activities`

**Description**: Returns detailed activity logs for a user.

**Query Parameters**:
- `startDate` (string, optional) - Filter from date (ISO 8601)
- `endDate` (string, optional) - Filter to date (ISO 8601)
- `status` (string, optional) - Filter by progress status

**Response Format**:
```json
{
  "success": true,
  "message": "Activity logs retrieved successfully",
  "results": [
    {
      "progressId": 2,
      "courseContentId": 1,
      "progressStatus": "COMPLETED",
      "activityDuration": 15,
      "progressPercent": "100.00",
      "v_created_date": "15-Oct-2025",
      "v_created_time": "23:16:05",
      "v_updated_date": "15-Oct-2025",
      "v_updated_time": "23:16:05"
    }
  ]
}
```

---

### 5. Get Course Analytics
**Endpoint**: `GET /user-progress/course/:courseId/analytics`

**Description**: Returns aggregated analytics for the course.

**Response Format**:
```json
{
  "success": true,
  "message": "Course analytics retrieved successfully",
  "results": {
    "totalEnrollments": 45,
    "activeUsers": 32,
    "completedUsers": 12,
    "averageProgress": 67.5,
    "completionRate": 26.67,
    "averageCompletionTime": 14,
    "totalActivities": 340,
    "contentEngagement": {
      "contentId": 1,
      "completionCount": 30,
      "avgDuration": 12
    }
  }
}
```

---

## 📊 Database Schema Recommendations

### Table: `enrollments` (or `user_course_enrollments`)
```sql
CREATE TABLE enrollments (
  enrollmentId SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL,
  courseId INTEGER NOT NULL,
  enrollmentStatus VARCHAR(50) DEFAULT 'ENROLLED',
  enrollmentDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completionDate TIMESTAMP NULL,
  certificateUrl VARCHAR(500) NULL,
  metadata JSONB DEFAULT '{}',
  enrollment_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  enrollment_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(userId, courseId)
);

-- Add indexes
CREATE INDEX idx_enrollments_user ON enrollments(userId);
CREATE INDEX idx_enrollments_course ON enrollments(courseId);
CREATE INDEX idx_enrollments_status ON enrollments(enrollmentStatus);
```

### Table: `user_course_content_progress` (or `activity_logs`)
```sql
CREATE TABLE user_course_content_progress (
  progressId SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL,
  courseId INTEGER NOT NULL,
  courseContentId INTEGER NOT NULL,
  progressStatus VARCHAR(50) DEFAULT 'NOT_STARTED',
  activityDuration INTEGER DEFAULT 0,
  progressPercent DECIMAL(5,2) DEFAULT 0.00,
  metadata JSONB DEFAULT '{}',
  user_course_content_progress_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_course_content_progress_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(userId, courseId, courseContentId)
);

-- Add indexes
CREATE INDEX idx_progress_user_course ON user_course_content_progress(userId, courseId);
CREATE INDEX idx_progress_content ON user_course_content_progress(courseContentId);
CREATE INDEX idx_progress_status ON user_course_content_progress(progressStatus);
```

### Virtual Fields (v_created_date, v_created_time)
These should be computed fields in your query:

```sql
SELECT 
  *,
  TO_CHAR(enrollment_created_at, 'DD-Mon-YYYY') as v_created_date,
  TO_CHAR(enrollment_created_at, 'HH24:MI:SS') as v_created_time,
  TO_CHAR(enrollment_updated_at, 'DD-Mon-YYYY') as v_updated_date,
  TO_CHAR(enrollment_updated_at, 'HH24:MI:SS') as v_updated_time
FROM enrollments
WHERE courseId = ? AND userId = ?;
```

---

## 🔐 Authorization & Permissions

### Access Control Rules

1. **User Progress (Own)**
   - Users can view their own progress
   - No special permissions needed

2. **All Users Progress**
   - Requires INSTRUCTOR, ADMIN, or course OWNER role
   - Check user permissions before returning data

3. **Update Progress**
   - Users can only update their own progress
   - System can update any user's progress

4. **Analytics**
   - Course instructors and admins only
   - Aggregated data, no individual user details exposed

### Middleware Example (Node.js/Express)
```javascript
const checkCourseAccess = async (req, res, next) => {
  const { courseId, userId } = req.params;
  const requestingUserId = req.user.userId;

  // Allow viewing own progress
  if (userId && parseInt(userId) === requestingUserId) {
    return next();
  }

  // Check if requesting user is instructor/admin
  const isInstructor = await checkIfInstructor(courseId, requestingUserId);
  if (isInstructor) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Access denied"
  });
};

router.get('/user-progress/:courseId/:userId', 
  authenticate, 
  checkCourseAccess, 
  getUserProgress
);
```

---

## 🎯 Enrollment Status Values

The `enrollmentStatus` field should use these exact values:

| Status | Description | Next Status |
|--------|-------------|-------------|
| `ENROLLED` | User enrolled but hasn't started | `IN_PROGRESS` |
| `IN_PROGRESS` | User actively learning | `COMPLETED` |
| `COMPLETED` | User finished all content | `CERTIFIED` |
| `CERTIFIED` | User received certificate | N/A |
| `DROPPED` | User dropped the course | N/A |
| `EXPIRED` | Enrollment expired | N/A |

---

## 📈 Progress Status Values

The `progressStatus` field should use these exact values:

| Status | Description | UI Color |
|--------|-------------|----------|
| `NOT_STARTED` | Content not accessed | Gray |
| `IN_PROGRESS` | Content partially completed | Yellow |
| `COMPLETED` | Content fully completed | Green |
| `LOCKED` | Content not yet accessible | Red |

---

## 🚀 Performance Optimization Tips

### 1. Database Queries
```sql
-- Use joins instead of separate queries
SELECT 
  e.*,
  p.*
FROM enrollments e
LEFT JOIN user_course_content_progress p 
  ON e.userId = p.userId AND e.courseId = p.courseId
WHERE e.courseId = ? AND e.userId = ?;
```

### 2. Caching Strategy
- Cache enrollment data (5-15 minutes)
- Cache course analytics (15-30 minutes)
- Invalidate cache on progress update

```javascript
const cacheKey = `user-progress:${courseId}:${userId}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const data = await fetchFromDatabase();
await redis.setex(cacheKey, 300, JSON.stringify(data)); // 5 min cache
return data;
```

### 3. Pagination for Large Datasets
```javascript
// For courses with many members
GET /user-progress/course/:courseId/all?page=1&limit=20
```

### 4. Bulk Operations
Allow fetching multiple users' progress in one request:
```javascript
POST /user-progress/bulk
Body: {
  "courseId": 1,
  "userIds": [1, 2, 3, 4, 5]
}
```

---

## 🧪 Sample Backend Implementation (Node.js)

### Controller: `getUserProgress`
```javascript
const getUserProgress = async (req, res) => {
  try {
    const { courseId, userId } = req.params;

    // Validate inputs
    if (!courseId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Course ID and User ID are required"
      });
    }

    // Fetch enrollment
    const enrollment = await db.query(`
      SELECT 
        *,
        TO_CHAR(enrollment_created_at, 'DD-Mon-YYYY') as v_created_date,
        TO_CHAR(enrollment_created_at, 'HH24:MI:SS') as v_created_time,
        TO_CHAR(enrollment_updated_at, 'DD-Mon-YYYY') as v_updated_date,
        TO_CHAR(enrollment_updated_at, 'HH24:MI:SS') as v_updated_time
      FROM enrollments
      WHERE courseId = $1 AND userId = $2
    `, [courseId, userId]);

    // Fetch activity logs
    const activities = await db.query(`
      SELECT 
        *,
        TO_CHAR(user_course_content_progress_created_at, 'DD-Mon-YYYY') as v_created_date,
        TO_CHAR(user_course_content_progress_created_at, 'HH24:MI:SS') as v_created_time,
        TO_CHAR(user_course_content_progress_updated_at, 'DD-Mon-YYYY') as v_updated_date,
        TO_CHAR(user_course_content_progress_updated_at, 'HH24:MI:SS') as v_updated_time
      FROM user_course_content_progress
      WHERE courseId = $1 AND userId = $2
      ORDER BY user_course_content_progress_updated_at DESC
    `, [courseId, userId]);

    return res.status(200).json({
      success: true,
      message: "User progress retrieved successfully",
      results: {
        enrollments: enrollment.rows[0] || null,
        activityLogs: activities.rows || []
      }
    });
  } catch (error) {
    console.error("Error fetching user progress:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user progress",
      error: error.message
    });
  }
};
```

---

## 📝 Testing Checklist

### Unit Tests
- [ ] Test enrollment creation
- [ ] Test progress update
- [ ] Test activity log retrieval
- [ ] Test analytics calculation
- [ ] Test permission checks

### Integration Tests
- [ ] Test complete user journey
- [ ] Test concurrent progress updates
- [ ] Test data consistency
- [ ] Test cache invalidation

### Load Tests
- [ ] Test with 100+ concurrent users
- [ ] Test with 1000+ enrollments
- [ ] Test query performance
- [ ] Test cache hit rates

---

## 🐛 Common Issues & Solutions

### Issue 1: Inconsistent Progress Data
**Problem**: Activity logs don't match enrollment status

**Solution**: Implement triggers to auto-update enrollment status
```sql
CREATE OR REPLACE FUNCTION update_enrollment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update enrollment to IN_PROGRESS on first activity
  UPDATE enrollments
  SET 
    enrollmentStatus = 'IN_PROGRESS',
    enrollment_updated_at = CURRENT_TIMESTAMP
  WHERE 
    userId = NEW.userId 
    AND courseId = NEW.courseId 
    AND enrollmentStatus = 'ENROLLED';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_enrollment_on_progress
AFTER INSERT OR UPDATE ON user_course_content_progress
FOR EACH ROW
EXECUTE FUNCTION update_enrollment_status();
```

### Issue 2: Slow Queries
**Problem**: Fetching all users' progress is slow

**Solution**: Add database indexes and implement pagination

### Issue 3: Stale Data
**Problem**: Frontend shows outdated progress

**Solution**: Implement WebSocket updates or shorter cache TTL

---

## 📚 Additional Resources

- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [PostgreSQL Performance Tips](https://www.postgresql.org/docs/current/performance-tips.html)
- [Redis Caching Strategies](https://redis.io/docs/manual/patterns/)

---

**Last Updated**: October 2025  
**API Version**: 1.0.0  
**Backend Framework**: Node.js/Express (adaptable to other frameworks)
