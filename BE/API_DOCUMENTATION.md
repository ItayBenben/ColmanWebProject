# API Documentation - Comments and Likes

## Authentication
All endpoints require authentication. Include the JWT token in the request header:
```
jsonwebtoken: <your_jwt_token>
```

## Comments API

### 1. Add Comment
**POST** `/api/posts/:postId/comments`

Add a new comment to a post.

**Request Body:**
```json
{
  "text": "This is a great post!"
}
```

**Response:**
```json
{
  "_id": "comment_id",
  "user": {
    "_id": "user_id",
    "username": "john_doe",
    "avatar": "avatar_url"
  },
  "text": "This is a great post!",
  "createdAt": "2024-01-01T12:00:00.000Z"
}
```

**Authorization Rules:**
- For group posts: User must be a member of the group
- For public posts: User must be friends with the post author or be the post author

---

### 2. Edit Comment
**PUT** `/api/posts/:postId/comments/:commentId`

Edit an existing comment.

**Request Body:**
```json
{
  "text": "Updated comment text"
}
```

**Response:**
```json
{
  "_id": "comment_id",
  "user": {
    "_id": "user_id",
    "username": "john_doe",
    "avatar": "avatar_url"
  },
  "text": "Updated comment text",
  "createdAt": "2024-01-01T12:00:00.000Z",
  "updatedAt": "2024-01-01T13:00:00.000Z"
}
```

**Authorization:** Only the comment author can edit their comment

---

### 3. Delete Comment
**DELETE** `/api/posts/:postId/comments/:commentId`

Delete a comment.

**Response:**
```json
{
  "message": "Comment deleted successfully"
}
```

**Authorization:** Comment author or post author can delete the comment

---

### 4. Get Comments
**GET** `/api/posts/:postId/comments?page=1&limit=10`

Get all comments for a post with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Comments per page (default: 10)

**Response:**
```json
{
  "comments": [
    {
      "_id": "comment_id",
      "user": {
        "_id": "user_id",
        "username": "john_doe",
        "avatar": "avatar_url"
      },
      "text": "Great post!",
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalComments": 25,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## Likes API

### 1. Like Post
**POST** `/api/posts/:postId/like`

Like a post.

**Response:**
```json
{
  "message": "Post liked successfully",
  "likesCount": 15,
  "isLiked": true
}
```

**Authorization Rules:**
- For group posts: User must be a member of the group
- For public posts: User must be friends with the post author or be the post author

---

### 2. Unlike Post
**DELETE** `/api/posts/:postId/like`

Unlike a post.

**Response:**
```json
{
  "message": "Post unliked successfully",
  "likesCount": 14,
  "isLiked": false
}
```

---

### 3. Toggle Like
**PATCH** `/api/posts/:postId/like`

Toggle like status (like if not liked, unlike if liked).

**Response:**
```json
{
  "message": "Post liked successfully",
  "likesCount": 15,
  "isLiked": true
}
```

---

### 4. Get Likes
**GET** `/api/posts/:postId/likes?page=1&limit=20`

Get all users who liked a post with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Likes per page (default: 20)

**Response:**
```json
{
  "likes": [
    {
      "_id": "user_id",
      "username": "john_doe",
      "avatar": "avatar_url"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalLikes": 35,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### 5. Check Like Status
**GET** `/api/posts/:postId/like/status`

Check if the current user has liked a post.

**Response:**
```json
{
  "isLiked": true,
  "likesCount": 15
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Comment text is required"
}
```

### 401 Unauthorized
```json
{
  "message": "No token provided"
}
```

### 403 Forbidden
```json
{
  "message": "Not authorized to comment on this post"
}
```

### 404 Not Found
```json
{
  "message": "Post not found"
}
```

---

## Usage Examples

### Frontend Integration

**Like a post:**
```javascript
const likePost = async (postId) => {
  const response = await fetch(`/api/posts/${postId}/like`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'jsonwebtoken': token
    }
  });
  const data = await response.json();
  return data;
};
```

**Add a comment:**
```javascript
const addComment = async (postId, text) => {
  const response = await fetch(`/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'jsonwebtoken': token
    },
    body: JSON.stringify({ text })
  });
  const data = await response.json();
  return data;
};
```

**Get comments with pagination:**
```javascript
const getComments = async (postId, page = 1, limit = 10) => {
  const response = await fetch(`/api/posts/${postId}/comments?page=${page}&limit=${limit}`, {
    headers: {
      'jsonwebtoken': token
    }
  });
  const data = await response.json();
  return data;
};
```

---

## Authorization Summary

### Comments
- **Add/View**: Group members for group posts, friends/author for public posts
- **Edit**: Only comment author
- **Delete**: Comment author or post author

### Likes
- **Like/Unlike/View**: Group members for group posts, friends/author for public posts
- **Toggle**: Same authorization as like/unlike

All endpoints require valid JWT authentication and follow the same authorization patterns as the existing post system. 