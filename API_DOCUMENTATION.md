# AI-Driven CRM API Documentation

## Overview

The AI-Driven CRM API is a RESTful service that provides comprehensive customer relationship management capabilities with integrated AI features. The API supports JSON data format and uses JWT-based authentication.

**Base URL**: `http://localhost:5000/api`
**API Version**: v1
**Content-Type**: `application/json`

## Authentication

### JWT Token Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

### Authentication Endpoints

#### POST /auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "email": "user@example.com",
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "company": "Acme Corp",
        "position": "Sales Manager"
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Smith",
  "company": "Tech Corp",
  "position": "Sales Representative"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
      "email": "newuser@example.com",
      "profile": {
        "firstName": "Jane",
        "lastName": "Smith",
        "company": "Tech Corp",
        "position": "Sales Representative"
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /auth/refresh
Refresh JWT token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST /auth/logout
Logout user and invalidate tokens.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Contact Management

### GET /contacts
Retrieve all contacts for the authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `search` (string): Search term for name, company, or position
- `folder` (string): Filter by folder name
- `priority` (number): Filter by priority (1=high, 2=medium, 3=low)
- `industry` (string): Filter by industry
- `limit` (number): Number of results per page (default: 50)
- `offset` (number): Number of results to skip (default: 0)
- `sort` (string): Sort field (default: updatedAt)
- `order` (string): Sort order (asc/desc, default: desc)

**Example Request:**
```http
GET /api/contacts?search=john&priority=1&limit=20&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j3",
        "basicInfo": {
          "name": "John Smith",
          "email": "john.smith@company.com",
          "phone": "+1-555-0123",
          "wechatId": "johnsmith_wx",
          "company": "Tech Solutions Inc",
          "position": "CTO",
          "industry": "Technology",
          "ageGroup": "35-44"
        },
        "photos": [
          {
            "url": "/uploads/photos/john_profile.jpg",
            "type": "profile",
            "source": "upload",
            "uploadedAt": "2023-12-01T10:30:00Z"
          }
        ],
        "tags": [
          {
            "name": "VIP",
            "color": "#ff6b6b",
            "category": "priority"
          },
          {
            "name": "Decision Maker",
            "color": "#4ecdc4",
            "category": "custom"
          }
        ],
        "folder": "prospects",
        "priority": 1,
        "socialProfiles": {
          "linkedin": "https://linkedin.com/in/johnsmith",
          "weibo": "@johnsmith_tech"
        },
        "businessInfo": {
          "companySize": "100-500",
          "revenue": "$10M-50M",
          "decisionMaker": true,
          "budget": "$50K-100K"
        },
        "aiProfile": {
          "personality": "Analytical, detail-oriented, tech-savvy",
          "communicationStyle": "Direct and data-driven",
          "interests": ["AI/ML", "Cloud Computing", "Digital Transformation"],
          "painPoints": ["Legacy system integration", "Scalability challenges"],
          "lastAnalysis": "2023-12-01T15:45:00Z",
          "opportunityScore": 85,
          "relationshipStrength": 7
        },
        "createdAt": "2023-11-15T09:00:00Z",
        "updatedAt": "2023-12-01T15:45:00Z"
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 20,
      "offset": 0,
      "pages": 8,
      "currentPage": 1
    }
  }
}
```

### GET /contacts/:id
Retrieve a specific contact by ID.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "contact": {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j3",
      "basicInfo": {
        "name": "John Smith",
        "email": "john.smith@company.com",
        "phone": "+1-555-0123",
        "company": "Tech Solutions Inc",
        "position": "CTO",
        "industry": "Technology",
        "ageGroup": "35-44"
      },
      "aiProfile": {
        "personality": "Analytical, detail-oriented",
        "opportunityScore": 85,
        "relationshipStrength": 7
      }
    }
  }
}
```

### POST /contacts
Create a new contact.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "basicInfo": {
    "name": "Alice Johnson",
    "email": "alice.johnson@newcompany.com",
    "phone": "+1-555-0456",
    "company": "Innovation Labs",
    "position": "VP of Sales",
    "industry": "Software",
    "ageGroup": "30-39"
  },
  "folder": "leads",
  "priority": 2,
  "tags": [
    {
      "name": "Warm Lead",
      "color": "#feca57",
      "category": "custom"
    }
  ],
  "businessInfo": {
    "companySize": "50-100",
    "decisionMaker": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "contact": {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j4",
      "basicInfo": {
        "name": "Alice Johnson",
        "email": "alice.johnson@newcompany.com",
        "phone": "+1-555-0456",
        "company": "Innovation Labs",
        "position": "VP of Sales",
        "industry": "Software",
        "ageGroup": "30-39"
      },
      "folder": "leads",
      "priority": 2,
      "aiProfile": {
        "interests": [],
        "painPoints": []
      },
      "createdAt": "2023-12-01T16:00:00Z",
      "updatedAt": "2023-12-01T16:00:00Z"
    }
  }
}
```

### PUT /contacts/:id
Update an existing contact.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "basicInfo": {
    "position": "Senior VP of Sales"
  },
  "priority": 1,
  "tags": [
    {
      "name": "Hot Lead",
      "color": "#ff6b6b",
      "category": "priority"
    }
  ]
}
```

### DELETE /contacts/:id
Delete a contact.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Contact deleted successfully"
}
```

## Interaction Management

### GET /interactions
Retrieve interactions for a specific contact or all interactions.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `contactId` (string): Filter by contact ID
- `type` (string): Filter by interaction type (call, wechat, email, meeting, social)
- `startDate` (string): Filter by start date (ISO format)
- `endDate` (string): Filter by end date (ISO format)
- `sentiment` (string): Filter by sentiment (positive, neutral, negative)
- `limit` (number): Number of results per page
- `offset` (number): Number of results to skip

**Response:**
```json
{
  "success": true,
  "data": {
    "interactions": [
      {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j5",
        "contactId": "64f1a2b3c4d5e6f7g8h9i0j3",
        "type": "call",
        "content": "Discussed their current CRM challenges and potential solutions. Very interested in AI features.",
        "topics": ["CRM", "AI Integration", "Budget Discussion"],
        "sentiment": "positive",
        "attachments": [],
        "metadata": {
          "duration": 45
        },
        "aiAnalysis": {
          "keyInsights": [
            "Strong interest in AI-powered features",
            "Budget approved for Q1 implementation",
            "Decision timeline: 2-3 weeks"
          ],
          "nextSteps": [
            "Send detailed proposal",
            "Schedule demo with technical team",
            "Follow up in 3 days"
          ],
          "salesStage": "consideration",
          "opportunityScore": 78,
          "sentiment": "positive",
          "confidence": 0.92
        },
        "createdAt": "2023-12-01T14:30:00Z"
      }
    ],
    "pagination": {
      "total": 25,
      "limit": 10,
      "offset": 0,
      "pages": 3,
      "currentPage": 1
    }
  }
}
```

### POST /interactions
Create a new interaction.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "contactId": "64f1a2b3c4d5e6f7g8h9i0j3",
  "type": "email",
  "content": "Sent follow-up email with pricing information and case studies.",
  "topics": ["Pricing", "Case Studies", "Implementation Timeline"],
  "metadata": {
    "platform": "Gmail"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "interaction": {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j6",
      "contactId": "64f1a2b3c4d5e6f7g8h9i0j3",
      "type": "email",
      "content": "Sent follow-up email with pricing information and case studies.",
      "topics": ["Pricing", "Case Studies", "Implementation Timeline"],
      "sentiment": "neutral",
      "aiAnalysis": {
        "keyInsights": ["Information sharing phase"],
        "nextSteps": ["Wait for response", "Follow up in 2 days if no response"],
        "salesStage": "consideration",
        "opportunityScore": 75
      },
      "createdAt": "2023-12-01T16:15:00Z"
    }
  }
}
```

## AI Services

### POST /ai/analyze-profile
Generate AI analysis for a contact's profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "contactId": "64f1a2b3c4d5e6f7g8h9i0j3",
  "includeInteractions": true,
  "analysisType": "comprehensive"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis": {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j7",
      "contactId": "64f1a2b3c4d5e6f7g8h9i0j3",
      "analysisType": "profile",
      "output": {
        "personality": {
          "type": "D - Dominant",
          "traits": ["Results-oriented", "Direct communicator", "Decision maker"],
          "communicationStyle": "Prefers concise, data-driven presentations"
        },
        "businessProfile": {
          "decisionAuthority": "high",
          "influenceLevel": "high",
          "budgetAuthority": "high",
          "painPoints": ["Legacy system limitations", "Integration challenges"],
          "priorities": ["Digital transformation", "Operational efficiency"]
        },
        "relationshipInsights": {
          "rapportLevel": 7,
          "trustIndicators": ["Shares internal challenges", "Asks detailed questions"],
          "engagementLevel": "high",
          "preferredTopics": ["Technology trends", "ROI metrics"]
        },
        "salesStrategy": {
          "currentStage": "consideration",
          "nextBestActions": [
            "Provide detailed ROI analysis",
            "Schedule technical demo",
            "Introduce implementation team"
          ],
          "timingRecommendations": "Follow up within 2-3 days",
          "approachStrategy": "Focus on business outcomes and measurable results"
        },
        "opportunityAssessment": {
          "score": 85,
          "likelihood": "high",
          "timeline": "2-4 weeks",
          "potentialValue": "$75K-150K"
        }
      },
      "confidence": 0.89,
      "model": "gpt-4",
      "tokens": 1250,
      "processingTime": 3.2,
      "createdAt": "2023-12-01T16:30:00Z"
    }
  }
}
```

### POST /ai/generate-script
Generate personalized sales script.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "contactId": "64f1a2b3c4d5e6f7g8h9i0j3",
  "scenario": "follow-up-call",
  "methodology": "straight-line",
  "objective": "Schedule product demo",
  "currentSituation": "Sent pricing information, waiting for response"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "script": {
      "opening": "Hi John, I hope you had a chance to review the pricing information I sent over. I wanted to follow up and see if you have any questions about our AI-powered CRM solution.",
      "talkingPoints": [
        "ROI potential based on your company size",
        "Integration capabilities with existing systems",
        "AI features that address your specific pain points"
      ],
      "questions": [
        "What aspects of the proposal are most interesting to your team?",
        "How does this align with your digital transformation timeline?",
        "What would need to happen for you to move forward?"
      ],
      "objectionHandling": {
        "price_concern": "I understand budget is important. Let's focus on the ROI - based on your current processes, you could see a 300% return within the first year.",
        "timing_concern": "I appreciate that timing is crucial. Our implementation team can work around your schedule, and we offer phased rollouts to minimize disruption."
      },
      "closing": "Based on our conversation, it sounds like there's a strong fit. Would you be available for a 30-minute demo next Tuesday so your technical team can see the platform in action?",
      "personalizationNotes": [
        "References his role as CTO",
        "Addresses integration concerns mentioned in previous call",
        "Focuses on technical benefits and ROI"
      ]
    },
    "metadata": {
      "methodology": "straight-line",
      "scenario": "follow-up-call",
      "generatedAt": "2023-12-01T16:45:00Z",
      "model": "gpt-4",
      "confidence": 0.91
    }
  }
}
```

### GET /ai/scripts
Retrieve saved sales scripts.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `category` (string): Filter by category (opening, discovery, presentation, objection, closing)
- `methodology` (string): Filter by methodology (straight-line, sandler, challenger)
- `limit` (number): Number of results per page
- `offset` (number): Number of results to skip

**Response:**
```json
{
  "success": true,
  "data": {
    "scripts": [
      {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j8",
        "category": "opening",
        "scenario": "cold-call",
        "methodology": "straight-line",
        "script": {
          "title": "Technology Executive Cold Call",
          "content": "Hi {name}, this is {your_name} from {company}. I know you're busy, so I'll be brief. We help {industry} companies like {contact_company} reduce operational costs by 30% through AI automation. Do you have 30 seconds for me to explain how?",
          "variables": ["name", "your_name", "company", "industry", "contact_company"],
          "effectiveness": 78
        },
        "usage": {
          "timesUsed": 15,
          "successRate": 0.73,
          "lastUsed": "2023-11-30T14:20:00Z"
        },
        "isTemplate": true,
        "createdAt": "2023-11-01T10:00:00Z"
      }
    ]
  }
}
```

## File Management

### POST /files/upload
Upload files (images, documents, etc.).

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body (Form Data):**
- `file`: File to upload
- `type`: File type (profile_photo, document, business_card)
- `contactId`: Associated contact ID (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "file": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j9",
      "filename": "business_card.jpg",
      "originalName": "john_smith_card.jpg",
      "url": "/uploads/files/64f1a2b3c4d5e6f7g8h9i0j9.jpg",
      "type": "business_card",
      "size": 245760,
      "mimeType": "image/jpeg",
      "uploadedAt": "2023-12-01T17:00:00Z"
    }
  }
}
```

### POST /files/ocr
Extract text from uploaded images using OCR.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "fileId": "64f1a2b3c4d5e6f7g8h9i0j9",
  "language": "en"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "extractedText": "John Smith\nChief Technology Officer\nTech Solutions Inc\nPhone: +1-555-0123\nEmail: john.smith@techsolutions.com\nLinkedIn: linkedin.com/in/johnsmith",
    "confidence": 0.94,
    "detectedFields": {
      "name": "John Smith",
      "title": "Chief Technology Officer",
      "company": "Tech Solutions Inc",
      "phone": "+1-555-0123",
      "email": "john.smith@techsolutions.com",
      "linkedin": "linkedin.com/in/johnsmith"
    },
    "processingTime": 2.1
  }
}
```

## External Data Integration

### POST /external/search-company
Search for company information using external APIs.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "companyName": "Tech Solutions Inc",
  "source": "tianyancha"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "company": {
      "name": "Tech Solutions Inc",
      "industry": "Software Development",
      "size": "100-500 employees",
      "revenue": "$10M-50M",
      "founded": "2015",
      "location": "San Francisco, CA",
      "website": "https://techsolutions.com",
      "description": "Leading provider of enterprise software solutions",
      "keyPeople": [
        {
          "name": "John Smith",
          "position": "CTO",
          "linkedin": "linkedin.com/in/johnsmith"
        }
      ],
      "financials": {
        "revenue": "$25M",
        "employees": 250,
        "growthRate": "15%"
      }
    },
    "source": "tianyancha",
    "lastUpdated": "2023-12-01T17:15:00Z"
  }
}
```

### POST /external/search-person
Search for person information using external APIs.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Smith",
  "company": "Tech Solutions Inc",
  "source": "linkedin"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "person": {
      "name": "John Smith",
      "currentPosition": "CTO at Tech Solutions Inc",
      "location": "San Francisco Bay Area",
      "industry": "Technology",
      "experience": [
        {
          "company": "Tech Solutions Inc",
          "position": "Chief Technology Officer",
          "duration": "2020 - Present"
        },
        {
          "company": "Innovation Corp",
          "position": "Senior Software Engineer",
          "duration": "2018 - 2020"
        }
      ],
      "education": [
        {
          "school": "Stanford University",
          "degree": "MS Computer Science",
          "year": "2018"
        }
      ],
      "skills": ["AI/ML", "Cloud Computing", "Software Architecture"],
      "socialProfiles": {
        "linkedin": "https://linkedin.com/in/johnsmith",
        "twitter": "@johnsmith_tech"
      }
    },
    "source": "linkedin",
    "lastUpdated": "2023-12-01T17:20:00Z"
  }
}
```

## Analytics and Reporting

### GET /analytics/dashboard
Retrieve dashboard analytics data.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `period` (string): Time period (day, week, month, quarter, year)
- `startDate` (string): Start date (ISO format)
- `endDate` (string): End date (ISO format)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalContacts": 150,
      "newContactsThisMonth": 25,
      "totalInteractions": 450,
      "averageOpportunityScore": 72,
      "conversionRate": 0.18
    },
    "contactsByIndustry": [
      { "industry": "Technology", "count": 45 },
      { "industry": "Healthcare", "count": 32 },
      { "industry": "Finance", "count": 28 }
    ],
    "interactionsByType": [
      { "type": "email", "count": 180 },
      { "type": "call", "count": 120 },
      { "type": "meeting", "count": 85 }
    ],
    "opportunityPipeline": [
      { "stage": "awareness", "count": 60, "value": "$450K" },
      { "stage": "interest", "count": 45, "value": "$675K" },
      { "stage": "consideration", "count": 30, "value": "$900K" },
      { "stage": "decision", "count": 15, "value": "$1.2M" }
    ],
    "aiUsageStats": {
      "profileAnalyses": 85,
      "scriptsGenerated": 120,
      "averageConfidence": 0.87
    }
  }
}
```

### GET /analytics/contacts/:id/insights
Get detailed analytics for a specific contact.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "contactInsights": {
      "interactionHistory": {
        "totalInteractions": 12,
        "lastInteraction": "2023-12-01T14:30:00Z",
        "averageResponseTime": "4.2 hours",
        "preferredCommunication": "email"
      },
      "engagementTrends": [
        { "date": "2023-11-01", "score": 65 },
        { "date": "2023-11-15", "score": 72 },
        { "date": "2023-12-01", "score": 85 }
      ],
      "sentimentAnalysis": {
        "overall": "positive",
        "trend": "improving",
        "breakdown": {
          "positive": 8,
          "neutral": 3,
          "negative": 1
        }
      },
      "predictiveInsights": {
        "nextBestAction": "Schedule product demo",
        "optimalContactTime": "Tuesday-Thursday, 2-4 PM",
        "conversionProbability": 0.78,
        "estimatedCloseDate": "2023-12-15"
      }
    }
  }
}
```

## Error Handling

### Error Response Format

All API errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    },
    "timestamp": "2023-12-01T18:00:00Z",
    "requestId": "req_64f1a2b3c4d5e6f7g8h9i0j0"
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `429` - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable

### Common Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_REQUIRED` - Valid JWT token required
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `DUPLICATE_RESOURCE` - Resource already exists
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `AI_SERVICE_UNAVAILABLE` - AI service temporarily unavailable
- `EXTERNAL_API_ERROR` - External service error

## Rate Limiting

API requests are rate-limited to ensure fair usage:

- **General endpoints**: 100 requests per 15 minutes per IP
- **AI endpoints**: 20 requests per hour per user
- **File upload**: 10 uploads per hour per user

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1701453600
```

## Webhooks

### Webhook Events

The API supports webhooks for real-time notifications:

- `contact.created` - New contact added
- `contact.updated` - Contact information changed
- `interaction.created` - New interaction logged
- `ai.analysis.completed` - AI analysis finished
- `opportunity.stage.changed` - Sales stage updated

### Webhook Payload Example

```json
{
  "event": "contact.created",
  "timestamp": "2023-12-01T18:30:00Z",
  "data": {
    "contactId": "64f1a2b3c4d5e6f7g8h9i0j4",
    "userId": "64f1a2b3c4d5e6f7g8h9i0j1",
    "contact": {
      "basicInfo": {
        "name": "Alice Johnson",
        "company": "Innovation Labs"
      }
    }
  },
  "signature": "sha256=..."
}
```

## SDK and Libraries

### JavaScript/Node.js SDK

```javascript
const CRMClient = require('@ai-crm/sdk');

const client = new CRMClient({
  apiKey: 'your-api-key',
  baseURL: 'http://localhost:5000/api'
});

// Create a contact
const contact = await client.contacts.create({
  basicInfo: {
    name: 'John Doe',
    email: 'john@example.com',
    company: 'Example Corp'
  }
});

// Generate AI analysis
const analysis = await client.ai.analyzeProfile(contact.id);
```

### Python SDK

```python
from ai_crm import CRMClient

client = CRMClient(
    api_key='your-api-key',
    base_url='http://localhost:5000/api'
)

# Create a contact
contact = client.contacts.create({
    'basicInfo': {
        'name': 'John Doe',
        'email': 'john@example.com',
        'company': 'Example Corp'
    }
})

# Generate AI analysis
analysis = client.ai.analyze_profile(contact['id'])
```

This comprehensive API documentation provides all the necessary information for developers to integrate with the AI-driven CRM system effectively.