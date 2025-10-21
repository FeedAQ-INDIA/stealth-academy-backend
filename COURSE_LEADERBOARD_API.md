# Course Leaderboard API Documentation

## Overview
The `getCourseLeaderboard` API provides a ranked list of users based on their performance and progress in a specific course. It analyzes user activity, quiz results, and completion statistics to generate a comprehensive leaderboard.

## Endpoint
**POST** `/getCourseLeaderboard`

## Authentication
Requires authentication via `authMiddleware`

## Request Body

```json
{
  "courseId": "string (required)",
  "limit": "number (optional, default: 50)",
  "sortBy": "string (optional, default: 'score')"
}
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| courseId | string | Yes | - | The unique identifier of the course |
| limit | number | No | 50 | Maximum number of users to return in leaderboard (0 for all) |
| sortBy | string | No | 'score' | Sorting criteria: 'score', 'progress', 'quiz', 'time' |

### Sort Options

- **score** (default): Ranks by overall leaderboard score (weighted calculation)
- **progress**: Ranks by course completion percentage
- **quiz**: Ranks by average quiz score
- **time**: Ranks by total learning hours

## Leaderboard Score Formula

The overall leaderboard score is calculated using the following formula:

```
Score = (progressPercent × 0.4) + (averageQuizScore × 0.4) + (passedQuizzes × 5) + (completedContent × 2)
```

### Weighting:
- **Progress**: 40% weight (0-100 points)
- **Quiz Performance**: 40% weight (0-100 points)
- **Passed Quizzes**: 5 points each
- **Completed Content**: 2 points each

## Response Structure

### Success Response (200)

```json
{
  "success": true,
  "message": "Course leaderboard fetched successfully",
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "userId": "string",
        "firstName": "string",
        "lastName": "string",
        "email": "string",
        "profilePic": "string",
        "leaderboardScore": 125.5,
        "progressPercent": 85.50,
        "completedContent": 15,
        "totalContent": 20,
        "averageQuizScore": 92.30,
        "passedQuizzes": 8,
        "totalQuizzes": 10,
        "totalActivityHours": 12.50,
        "status": "IN_PROGRESS",
        "enrollmentDate": "2024-01-15T10:30:00.000Z",
        "lastActivityDate": "2024-10-21T15:45:00.000Z"
      }
    ],
    "total": 25,
    "limit": 50,
    "sortBy": "score",
    "statistics": {
      "totalUsers": 25,
      "completedUsers": 5,
      "inProgressUsers": 18,
      "averageProgress": 68.45,
      "averageQuizScore": 78.20,
      "totalActivityHours": 450.75
    },
    "courseInfo": {
      "courseId": "course-123",
      "totalContent": 20
    }
  },
  "meta": {
    "courseId": "course-123",
    "limit": 50,
    "sortBy": "score",
    "totalUsers": 25
  }
}
```

### Leaderboard Entry Fields

| Field | Type | Description |
|-------|------|-------------|
| rank | number | User's position in the leaderboard (1-based) |
| userId | string | Unique user identifier |
| firstName | string | User's first name |
| lastName | string | User's last name |
| email | string | User's email address |
| profilePic | string | URL to user's profile picture |
| leaderboardScore | number | Overall calculated score |
| progressPercent | number | Course completion percentage (0-100) |
| completedContent | number | Number of completed content items |
| totalContent | number | Total content items in course |
| averageQuizScore | number | Average quiz score percentage (0-100) |
| passedQuizzes | number | Number of quizzes passed |
| totalQuizzes | number | Total quizzes attempted |
| totalActivityHours | number | Total learning hours (rounded to 2 decimals) |
| status | string | User's enrollment status |
| enrollmentDate | string (ISO) | Date when user enrolled |
| lastActivityDate | string (ISO) | Date of last activity |

### User Status Values

- **NOT_STARTED**: User enrolled but no progress
- **ENROLLED**: User enrolled but no completed content
- **IN_PROGRESS**: User has completed some content
- **COMPLETED**: User has completed all course content

### Statistics Object

Provides aggregate statistics for all users in the course:

| Field | Type | Description |
|-------|------|-------------|
| totalUsers | number | Total users with course access |
| completedUsers | number | Users who completed the course |
| inProgressUsers | number | Users currently in progress |
| averageProgress | number | Average completion percentage across all users |
| averageQuizScore | number | Average quiz score across all users |
| totalActivityHours | number | Total learning hours across all users |

### Error Response (400)

```json
{
  "success": false,
  "message": "courseId is required",
  "error": {
    "message": "courseId is required",
    "code": "MISSING_FIELD",
    "source": "getCourseLeaderboard"
  }
}
```

### Error Response (500)

```json
{
  "success": false,
  "message": "Failed to fetch course leaderboard",
  "error": {
    "message": "Database connection failed",
    "code": "GET_COURSE_LEADERBOARD_ERROR",
    "source": "getCourseLeaderboard"
  },
  "meta": {
    "courseId": "course-123"
  }
}
```

## Usage Examples

### Example 1: Get Top 10 by Overall Score

```javascript
const response = await fetch('/getCourseLeaderboard', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    courseId: 'course-123',
    limit: 10,
    sortBy: 'score'
  })
});

const data = await response.json();
console.log(data.data.leaderboard);
```

### Example 2: Get Top Performers by Progress

```javascript
const response = await fetch('/getCourseLeaderboard', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    courseId: 'course-123',
    limit: 20,
    sortBy: 'progress'
  })
});

const data = await response.json();
console.log(`Average Progress: ${data.data.statistics.averageProgress}%`);
```

### Example 3: Get All Users (No Limit)

```javascript
const response = await fetch('/getCourseLeaderboard', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    courseId: 'course-123',
    limit: 0, // Returns all users
    sortBy: 'score'
  })
});
```

## Key Features

1. **Flexible Ranking**: Multiple sorting options (score, progress, quiz, time)
2. **Comprehensive Metrics**: Tracks progress, quizzes, and learning time
3. **Aggregate Statistics**: Course-wide performance metrics
4. **User Privacy**: Only displays essential user information
5. **Performance Optimized**: Single query with efficient joins
6. **Weighted Scoring**: Balanced calculation considering multiple factors

## Related APIs

- **getCourseProgress**: Get detailed progress for all users in a course
- **saveUserCourseContentProgress**: Update user progress
- **submitQuiz**: Submit quiz results that affect leaderboard ranking

## Notes

- Only users with `CourseAccess` are included in the leaderboard
- Leaderboard score is recalculated in real-time based on current data
- Users with no activity receive a score of 0
- Ranking ties are broken by secondary metrics (progress percentage)
- All percentages are rounded to 2 decimal places
- Activity hours are calculated from content duration tracking

## Implementation Details

### Database Models Used
- **User**: User information and profile
- **CourseContent**: Course structure and content
- **UserCourseContentProgress**: User activity logs
- **UserCourseEnrollment**: Enrollment status
- **CourseAccess**: Access permissions
- **QuizResultLog**: Quiz results and scores

### Performance Considerations
- Uses eager loading with specific includes
- No pagination on the database query (handled in-memory)
- Calculates all users' scores before sorting
- Consider adding caching for large courses (1000+ users)

## Version History

- **v1.0** (2024-10-21): Initial implementation with score-based ranking
