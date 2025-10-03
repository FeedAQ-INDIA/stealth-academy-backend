# PublishCourse API - Updated Implementation

## Overview
The PublishCourse API has been completely refactored to accept a `courseBuilderId` and fetch the course builder data directly from the `CourseBuilder` entity table, rather than accepting the full payload.

## API Endpoint
```
POST /api/publishCourse
```

## Authentication
Requires Bearer token authentication. The authenticated user must be the owner of the CourseBuilder record.

## Request Payload
```json
{
  "courseBuilderId": 123
}
```

### Parameters
- `courseBuilderId` (required): The ID of the CourseBuilder record to publish

## Response

### Success Response (201 Created)
```json
{
  "success": true,
  "message": "Course published successfully from CourseBuilder",
  "data": {
    "courseBuilderId": 123,
    "course": {
      "courseId": 456,
      "userId": 1,
      "orgId": null,
      "courseTitle": "Sample Course",
      "courseDescription": "Course description",
      "courseImageUrl": null,
      "courseDuration": 3600,
      "courseType": "BYOC",
      "deliveryMode": "ONLINE",
      "status": "PUBLISHED",
      "metadata": {
        "source": "CourseBuilderPublish",
        "publishedAt": "2025-10-03T10:00:00.000Z"
      }
    },
    "courseContentItems": [
      {
        "courseContentId": 789,
        "type": "CourseVideo",
        "detailId": 101
      }
    ],
    "counts": {
      "total": 1,
      "video": 1,
      "written": 0
    }
  }
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "message": "courseBuilderId is required"
}
```

```json
{
  "success": false,
  "message": "CourseBuilder not found with ID: 123"
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "message": "User mismatch: cannot publish course for another user"
}
```

#### 409 Conflict
```json
{
  "success": false,
  "message": "Course has already been published"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Database error or other internal issue"
}
```

## Implementation Details

### Database Operations
1. Fetches the CourseBuilder record by `courseBuilderId`
2. Validates user authorization
3. Checks if course is already published
4. Extracts course data from `courseBuilderData.courseDetail`
5. Creates Course record with status "PUBLISHED"
6. Creates CourseContent records for each content item
7. Creates CourseVideo/CourseWritten records based on content type
8. Creates CourseAccess record for owner
9. Updates CourseBuilder status to "PUBLISHED"

### Transaction Safety
All database operations are wrapped in a transaction to ensure atomicity. If any operation fails, all changes are rolled back.

### Data Flow
```
Request { courseBuilderId } 
  ↓
Fetch CourseBuilder from DB
  ↓
Validate user & status
  ↓
Extract courseDetail from courseBuilderData
  ↓
Create Course + CourseContent + Detail records
  ↓
Update CourseBuilder status
  ↓
Return success response
```

### Expected CourseBuilder Data Structure
The `courseBuilderData` field should contain the course data directly at the root level:
```json
{
  "orgId": null,
  "status": "DRAFT",
  "userId": 1,
  "courseId": "temp_course_id",
  "isActive": true,
  "isPublic": false,
  "metadata": { "isPublic": false },
  "courseType": "BYOC",
  "courseTitle": "Python Language Full Course (2025-26)",
  "deliveryMode": "ONLINE",
  "courseDuration": 32191,
  "courseImageUrl": "https://example.com/image.jpg",
  "courseDescription": "Complete Python programming course",
  "courseSourceChannel": "Shradha Khapra",
  "courseContent": [
    {
      "status": "PUBLISHED", // or "DRAFT" - DRAFT items will be skipped
      "courseContentId": "temp_content_1",
      "courseContentType": "CourseVideo",
      "courseContentTitle": "Python Full Course | Variables & Data Types",
      "courseContentCategory": "Video Content",
      "courseContentSequence": 1,
      "courseContentDuration": 4939,
      "coursecontentIsLicensed": false,
      "metadata": {
        "videoId": "t2_Q2BRzeEE",
        "sequence": 1,
        "contentType": "YOUTUBE_VIDEO"
      },
      "courseContentTypeDetail": {
        "courseVideoUrl": "https://www.youtube.com/watch?v=t2_Q2BRzeEE",
        "courseVideoTitle": "Python Full Course | Variables & Data Types",
        "courseVideoDescription": "This lecture covers Python basics",
        "duration": 4939,
        "thumbnailUrl": "https://i.ytimg.com/vi/t2_Q2BRzeEE/maxresdefault.jpg",
        "metadata": {
          "videoId": "t2_Q2BRzeEE",
          "publishedAt": "2024-01-26T15:31:21Z",
          "channelTitle": "Shradha Khapra",
          "sourcePlatform": "YOUTUBE"
        }
      }
    },
    {
      "courseContentType": "CourseWritten",
      "courseContentTitle": "OCP J 21",
      "courseContentCategory": "Written Content",
      "courseContentSequence": 2,
      "courseContentDuration": 300,
      "coursecontentIsLicensed": false,
      "courseContentTypeDetail": {
        "courseWrittenTitle": "OCP J 21",
        "courseWrittenContent": "Course content here...",
        "courseWrittenEmbedUrl": "https://ocpj21.javastudyguide.com/",
        "courseWrittenUrlIsEmbeddable": true
      }
    },
    {
      "courseContentType": "CourseQuiz",
      "courseContentTitle": "MID SEM QUIZ",
      "courseContentCategory": "Practice",
      "courseContentSequence": 3,
      "courseContentDuration": 600,
      "coursecontentIsLicensed": false,
      "courseContentTypeDetail": {
        "courseQuizDescription": "Mid semester quiz for Python course",
        "courseQuizType": "QUIZ",
        "courseQuizTimer": 600,
        "isQuizTimed": true,
        "courseQuizPassPercent": 70,
        "metadata": {
          "maxAttempts": 3,
          "instructions": "Answer all questions carefully"
        }
      }
    },
    {
      "courseContentType": "CourseFlashcard",
      "courseContentTitle": "Python Basics Flashcards",
      "courseContentCategory": "Interactive Content",
      "courseContentSequence": 4,
      "courseContentDuration": 4,
      "coursecontentIsLicensed": false,
      "courseContentTypeDetail": {
        "setTitle": "Python Basics Flashcards",
        "setDescription": "Basic flashcards for Python programming",
        "setDifficulty": "EASY",
        "estimatedDuration": 4,
        "setTags": ["python", "basics"],
        "cards": [
          {
            "question": "What is Python?",
            "answer": "A programming language",
            "hints": ["It's a programming language"],
            "difficulty": "EASY",
            "orderIndex": 1,
            "explanation": "Python is a high-level programming language"
          }
        ]
      }
    }
  ]
}
```

### Content Status Handling
- Content items with `status: "DRAFT"` will be skipped during publishing
- Content items with `status: "PUBLISHED"` or without a status field will be included
- Content items with `isActive: true` (and no status field) will be included