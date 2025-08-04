# AI-Driven CRM Development Guide

## Table of Contents

1. [Project Overview](#project-overview)
2. [Development Environment Setup](#development-environment-setup)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Code Standards](#code-standards)
6. [Testing Strategy](#testing-strategy)
7. [Database Management](#database-management)
8. [API Development](#api-development)
9. [Frontend Development](#frontend-development)
10. [AI Integration](#ai-integration)
11. [Security Guidelines](#security-guidelines)
12. [Performance Optimization](#performance-optimization)
13. [Debugging and Troubleshooting](#debugging-and-troubleshooting)
14. [Deployment Process](#deployment-process)
15. [Contributing Guidelines](#contributing-guidelines)

## Project Overview

The AI-Driven CRM is a modern customer relationship management system that leverages artificial intelligence to enhance sales processes, customer insights, and business intelligence.

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Material-UI (MUI) for components
- Redux Toolkit for state management
- React Router for navigation
- Axios for API communication

**Backend:**
- Node.js with Express.js
- TypeScript for type safety
- MongoDB with Mongoose ODM
- Redis for caching
- Socket.io for real-time features

**AI/ML Services:**
- OpenAI GPT-4 for text analysis
- Google Vision API for OCR
- Custom AI models for sales insights

**Infrastructure:**
- Docker for containerization
- Docker Compose for local development
- Kubernetes for production deployment
- Nginx for reverse proxy

## Development Environment Setup

### Prerequisites

- Node.js 18+ and npm/yarn
- Docker and Docker Compose
- MongoDB (local or cloud)
- Redis (local or cloud)
- Git

### Initial Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd CRM3
   ```

2. **Environment Configuration:**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your configuration
   nano .env
   ```

3. **Install Dependencies:**
   ```bash
   # Backend dependencies
   cd backend
   npm install
   
   # Frontend dependencies
   cd ../frontend
   npm install
   ```

4. **Start Development Environment:**
   ```bash
   # Using Docker Compose (recommended)
   docker-compose up -d
   
   # Or start services individually
   # Backend
   cd backend
   npm run dev
   
   # Frontend (in another terminal)
   cd frontend
   npm start
   ```

### Development Tools Setup

1. **VS Code Extensions:**
   - TypeScript and JavaScript Language Features
   - ESLint
   - Prettier
   - Docker
   - MongoDB for VS Code
   - Thunder Client (API testing)

2. **Git Hooks:**
   ```bash
   # Install husky for git hooks
   npm install -g husky
   npx husky install
   
   # Add pre-commit hook
   npx husky add .husky/pre-commit "npm run lint && npm run test"
   ```

## Project Structure

```
CRM3/
├── frontend/                 # React frontend application
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── store/          # Redux store and slices
│   │   ├── services/       # API service functions
│   │   ├── types/          # TypeScript type definitions
│   │   ├── utils/          # Utility functions
│   │   └── styles/         # Global styles and themes
│   ├── package.json
│   └── Dockerfile
├── backend/                 # Node.js backend application
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── services/       # Business logic services
│   │   ├── utils/          # Utility functions
│   │   ├── config/         # Configuration files
│   │   └── types/          # TypeScript type definitions
│   ├── tests/              # Test files
│   ├── package.json
│   └── Dockerfile
├── docs/                   # Documentation
├── scripts/                # Build and deployment scripts
├── docker-compose.yml      # Docker Compose configuration
├── .env.example           # Environment variables template
└── README.md
```

## Development Workflow

### Git Workflow

1. **Branch Naming Convention:**
   - `feature/feature-name` - New features
   - `bugfix/bug-description` - Bug fixes
   - `hotfix/critical-fix` - Critical production fixes
   - `refactor/component-name` - Code refactoring
   - `docs/documentation-update` - Documentation updates

2. **Commit Message Format:**
   ```
   type(scope): description
   
   [optional body]
   
   [optional footer]
   ```
   
   Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
   
   Examples:
   ```
   feat(contacts): add AI profile analysis
   fix(auth): resolve token expiration issue
   docs(api): update authentication endpoints
   ```

3. **Pull Request Process:**
   - Create feature branch from `develop`
   - Implement changes with tests
   - Run linting and tests locally
   - Create PR with descriptive title and description
   - Request code review
   - Address review feedback
   - Merge after approval

### Development Process

1. **Feature Development:**
   ```bash
   # Create and switch to feature branch
   git checkout -b feature/contact-ai-analysis
   
   # Make changes
   # ...
   
   # Run tests
   npm test
   
   # Commit changes
   git add .
   git commit -m "feat(contacts): add AI profile analysis"
   
   # Push to remote
   git push origin feature/contact-ai-analysis
   ```

2. **Code Review Checklist:**
   - [ ] Code follows style guidelines
   - [ ] Tests are included and passing
   - [ ] Documentation is updated
   - [ ] No security vulnerabilities
   - [ ] Performance considerations addressed
   - [ ] Error handling implemented
   - [ ] Logging added where appropriate

## Code Standards

### TypeScript Guidelines

1. **Type Definitions:**
   ```typescript
   // Use interfaces for object shapes
   interface Contact {
     id: string;
     name: string;
     email: string;
     company?: string;
   }
   
   // Use types for unions and primitives
   type ContactStatus = 'active' | 'inactive' | 'prospect';
   
   // Use enums for constants
   enum InteractionType {
     CALL = 'call',
     EMAIL = 'email',
     MEETING = 'meeting'
   }
   ```

2. **Function Signatures:**
   ```typescript
   // Always specify return types
   async function createContact(data: CreateContactRequest): Promise<Contact> {
     // Implementation
   }
   
   // Use generic types when appropriate
   function apiRequest<T>(endpoint: string): Promise<ApiResponse<T>> {
     // Implementation
   }
   ```

### React Guidelines

1. **Component Structure:**
   ```typescript
   // Functional components with TypeScript
   interface ContactCardProps {
     contact: Contact;
     onEdit: (id: string) => void;
     onDelete: (id: string) => void;
   }
   
   const ContactCard: React.FC<ContactCardProps> = ({ 
     contact, 
     onEdit, 
     onDelete 
   }) => {
     // Component logic
     return (
       <Card>
         {/* JSX */}
       </Card>
     );
   };
   
   export default ContactCard;
   ```

2. **Custom Hooks:**
   ```typescript
   // Custom hook for API calls
   function useContacts() {
     const [contacts, setContacts] = useState<Contact[]>([]);
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState<string | null>(null);
   
     const fetchContacts = useCallback(async () => {
       setLoading(true);
       try {
         const response = await contactsApi.getAll();
         setContacts(response.data);
       } catch (err) {
         setError(err.message);
       } finally {
         setLoading(false);
       }
     }, []);
   
     return { contacts, loading, error, fetchContacts };
   }
   ```

### Backend Guidelines

1. **Controller Pattern:**
   ```typescript
   // Controller with proper error handling
   export const contactController = {
     async getContacts(req: Request, res: Response, next: NextFunction) {
       try {
         const { page = 1, limit = 50, search } = req.query;
         const contacts = await contactService.getContacts({
           page: Number(page),
           limit: Number(limit),
           search: search as string,
           userId: req.user.id
         });
         
         res.json({
           success: true,
           data: contacts
         });
       } catch (error) {
         next(error);
       }
     }
   };
   ```

2. **Service Layer:**
   ```typescript
   // Business logic in service layer
   export class ContactService {
     async createContact(data: CreateContactData, userId: string): Promise<Contact> {
       // Validation
       const validatedData = await this.validateContactData(data);
       
       // Business logic
       const contact = new Contact({
         ...validatedData,
         userId,
         createdAt: new Date()
       });
       
       // Save to database
       await contact.save();
       
       // Trigger AI analysis
       await this.aiService.analyzeContact(contact.id);
       
       return contact;
     }
   }
   ```

### ESLint Configuration

```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

## Testing Strategy

### Frontend Testing

1. **Unit Tests with Jest and React Testing Library:**
   ```typescript
   // Component test
   import { render, screen, fireEvent } from '@testing-library/react';
   import ContactCard from './ContactCard';
   
   describe('ContactCard', () => {
     const mockContact = {
       id: '1',
       name: 'John Doe',
       email: 'john@example.com'
     };
   
     it('renders contact information', () => {
       render(<ContactCard contact={mockContact} onEdit={jest.fn()} onDelete={jest.fn()} />);
       
       expect(screen.getByText('John Doe')).toBeInTheDocument();
       expect(screen.getByText('john@example.com')).toBeInTheDocument();
     });
   
     it('calls onEdit when edit button is clicked', () => {
       const onEdit = jest.fn();
       render(<ContactCard contact={mockContact} onEdit={onEdit} onDelete={jest.fn()} />);
       
       fireEvent.click(screen.getByRole('button', { name: /edit/i }));
       expect(onEdit).toHaveBeenCalledWith('1');
     });
   });
   ```

2. **Integration Tests:**
   ```typescript
   // API integration test
   import { renderWithProviders } from '../test-utils';
   import ContactList from './ContactList';
   
   describe('ContactList Integration', () => {
     it('loads and displays contacts', async () => {
       const { store } = renderWithProviders(<ContactList />);
       
       await waitFor(() => {
         expect(screen.getByText('John Doe')).toBeInTheDocument();
       });
       
       expect(store.getState().contacts.items).toHaveLength(1);
     });
   });
   ```

### Backend Testing

1. **Unit Tests:**
   ```typescript
   // Service test
   import { ContactService } from '../services/ContactService';
   import { Contact } from '../models/Contact';
   
   describe('ContactService', () => {
     let contactService: ContactService;
   
     beforeEach(() => {
       contactService = new ContactService();
     });
   
     describe('createContact', () => {
       it('creates a new contact with valid data', async () => {
         const contactData = {
           name: 'John Doe',
           email: 'john@example.com',
           company: 'Acme Corp'
         };
   
         const contact = await contactService.createContact(contactData, 'user123');
   
         expect(contact.name).toBe('John Doe');
         expect(contact.userId).toBe('user123');
       });
   
       it('throws error for invalid email', async () => {
         const contactData = {
           name: 'John Doe',
           email: 'invalid-email',
           company: 'Acme Corp'
         };
   
         await expect(
           contactService.createContact(contactData, 'user123')
         ).rejects.toThrow('Invalid email format');
       });
     });
   });
   ```

2. **API Tests:**
   ```typescript
   // API endpoint test
   import request from 'supertest';
   import app from '../app';
   
   describe('POST /api/contacts', () => {
     it('creates a new contact', async () => {
       const contactData = {
         name: 'John Doe',
         email: 'john@example.com',
         company: 'Acme Corp'
       };
   
       const response = await request(app)
         .post('/api/contacts')
         .set('Authorization', `Bearer ${authToken}`)
         .send(contactData)
         .expect(201);
   
       expect(response.body.success).toBe(true);
       expect(response.body.data.contact.name).toBe('John Doe');
     });
   });
   ```

### Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test ContactCard.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should create contact"
```

## Database Management

### MongoDB Schema Design

1. **Contact Schema:**
   ```typescript
   const contactSchema = new Schema({
     basicInfo: {
       name: { type: String, required: true, index: true },
       email: { type: String, required: true, unique: true },
       phone: String,
       company: { type: String, index: true },
       position: String,
       industry: { type: String, index: true }
     },
     aiProfile: {
       personality: String,
       communicationStyle: String,
       interests: [String],
       painPoints: [String],
       opportunityScore: { type: Number, min: 0, max: 100 },
       lastAnalysis: Date
     },
     userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
     createdAt: { type: Date, default: Date.now },
     updatedAt: { type: Date, default: Date.now }
   });
   
   // Compound indexes for efficient queries
   contactSchema.index({ userId: 1, 'basicInfo.company': 1 });
   contactSchema.index({ userId: 1, 'basicInfo.industry': 1 });
   contactSchema.index({ userId: 1, priority: 1 });
   ```

2. **Database Migrations:**
   ```typescript
   // Migration script example
   export async function addAIProfileToContacts() {
     const contacts = await Contact.find({ aiProfile: { $exists: false } });
     
     for (const contact of contacts) {
       contact.aiProfile = {
         interests: [],
         painPoints: [],
         opportunityScore: 50
       };
       await contact.save();
     }
     
     console.log(`Updated ${contacts.length} contacts`);
   }
   ```

### Redis Caching Strategy

```typescript
// Cache service
export class CacheService {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }
  
  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }
  
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
  
  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// Usage in service
export class ContactService {
  private cache = new CacheService();
  
  async getContact(id: string, userId: string): Promise<Contact> {
    const cacheKey = `contact:${userId}:${id}`;
    
    // Try cache first
    let contact = await this.cache.get<Contact>(cacheKey);
    
    if (!contact) {
      // Fetch from database
      contact = await Contact.findOne({ _id: id, userId });
      
      if (contact) {
        // Cache for 1 hour
        await this.cache.set(cacheKey, contact, 3600);
      }
    }
    
    return contact;
  }
}
```

## API Development

### Request Validation

```typescript
// Validation middleware using Joi
import Joi from 'joi';

const createContactSchema = Joi.object({
  basicInfo: Joi.object({
    name: Joi.string().required().min(2).max(100),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
    company: Joi.string().max(100),
    position: Joi.string().max(100),
    industry: Joi.string().max(50)
  }).required(),
  priority: Joi.number().integer().min(1).max(3),
  folder: Joi.string().max(50)
});

export const validateCreateContact = (req: Request, res: Response, next: NextFunction) => {
  const { error } = createContactSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.details[0].message,
        details: error.details
      }
    });
  }
  
  next();
};
```

### Error Handling

```typescript
// Custom error classes
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;
  
  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'RESOURCE_NOT_FOUND');
  }
}

// Global error handler
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  let error = err;
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    error = new ValidationError(err.message);
  }
  
  // Mongoose duplicate key error
  if (err.name === 'MongoError' && (err as any).code === 11000) {
    error = new AppError('Duplicate resource', 409, 'DUPLICATE_RESOURCE');
  }
  
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        timestamp: new Date().toISOString(),
        requestId: req.id
      }
    });
  }
  
  // Log unexpected errors
  console.error('Unexpected error:', error);
  
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong',
      timestamp: new Date().toISOString(),
      requestId: req.id
    }
  });
};
```

### API Documentation with Swagger

```typescript
// Swagger configuration
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI-Driven CRM API',
      version: '1.0.0',
      description: 'API documentation for AI-Driven CRM system'
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.ts']
};

const specs = swaggerJsdoc(options);

// Route documentation
/**
 * @swagger
 * /contacts:
 *   post:
 *     summary: Create a new contact
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateContactRequest'
 *     responses:
 *       201:
 *         description: Contact created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContactResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
```

## Frontend Development

### State Management with Redux Toolkit

```typescript
// Contact slice
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { contactsApi } from '../services/api';

export const fetchContacts = createAsyncThunk(
  'contacts/fetchContacts',
  async (params: FetchContactsParams, { rejectWithValue }) => {
    try {
      const response = await contactsApi.getAll(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const contactsSlice = createSlice({
  name: 'contacts',
  initialState: {
    items: [],
    loading: false,
    error: null,
    pagination: {
      total: 0,
      page: 1,
      limit: 50
    }
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateContact: (state, action) => {
      const index = state.items.findIndex(contact => contact.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchContacts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.contacts;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, updateContact } = contactsSlice.actions;
export default contactsSlice.reducer;
```

### Component Patterns

```typescript
// Container component pattern
const ContactListContainer: React.FC = () => {
  const dispatch = useAppDispatch();
  const { contacts, loading, error } = useAppSelector(state => state.contacts);
  const [filters, setFilters] = useState<ContactFilters>({});
  
  useEffect(() => {
    dispatch(fetchContacts(filters));
  }, [dispatch, filters]);
  
  const handleFilterChange = useCallback((newFilters: ContactFilters) => {
    setFilters(newFilters);
  }, []);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <ContactList 
      contacts={contacts}
      onFilterChange={handleFilterChange}
    />
  );
};

// Presentation component
interface ContactListProps {
  contacts: Contact[];
  onFilterChange: (filters: ContactFilters) => void;
}

const ContactList: React.FC<ContactListProps> = ({ contacts, onFilterChange }) => {
  return (
    <Box>
      <ContactFilters onChange={onFilterChange} />
      <Grid container spacing={2}>
        {contacts.map(contact => (
          <Grid item xs={12} md={6} lg={4} key={contact.id}>
            <ContactCard contact={contact} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
```

### Performance Optimization

```typescript
// Memoization
const ContactCard = React.memo<ContactCardProps>(({ contact, onEdit, onDelete }) => {
  const handleEdit = useCallback(() => {
    onEdit(contact.id);
  }, [contact.id, onEdit]);
  
  const handleDelete = useCallback(() => {
    onDelete(contact.id);
  }, [contact.id, onDelete]);
  
  return (
    <Card>
      {/* Card content */}
    </Card>
  );
});

// Virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';

const VirtualContactList: React.FC<{ contacts: Contact[] }> = ({ contacts }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <ContactCard contact={contacts[index]} />
    </div>
  );
  
  return (
    <List
      height={600}
      itemCount={contacts.length}
      itemSize={120}
    >
      {Row}
    </List>
  );
};
```

## AI Integration

### OpenAI Service

```typescript
// AI service for contact analysis
import OpenAI from 'openai';

export class AIService {
  private openai: OpenAI;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  
  async analyzeContactProfile(contact: Contact, interactions: Interaction[]): Promise<AIAnalysis> {
    const prompt = this.buildAnalysisPrompt(contact, interactions);
    
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert sales analyst. Analyze the contact profile and interaction history to provide insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      });
      
      const analysis = this.parseAnalysisResponse(response.choices[0].message.content);
      
      return {
        contactId: contact._id,
        analysisType: 'profile',
        output: analysis,
        confidence: 0.85,
        model: 'gpt-4',
        tokens: response.usage?.total_tokens || 0,
        processingTime: Date.now() - startTime,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('AI analysis failed:', error);
      throw new Error('Failed to analyze contact profile');
    }
  }
  
  private buildAnalysisPrompt(contact: Contact, interactions: Interaction[]): string {
    return `
      Analyze the following contact profile and interaction history:
      
      Contact Information:
      - Name: ${contact.basicInfo.name}
      - Company: ${contact.basicInfo.company}
      - Position: ${contact.basicInfo.position}
      - Industry: ${contact.basicInfo.industry}
      
      Recent Interactions:
      ${interactions.map(i => `
        - ${i.type}: ${i.content}
        - Sentiment: ${i.sentiment}
        - Date: ${i.createdAt}
      `).join('')}
      
      Please provide:
      1. Personality assessment (DISC profile)
      2. Communication preferences
      3. Business priorities and pain points
      4. Relationship strength (1-10)
      5. Opportunity score (1-100)
      6. Next best actions
      7. Optimal timing for follow-up
      
      Format the response as JSON.
    `;
  }
}
```

### AI Prompt Templates

```typescript
// Prompt template system
export class PromptTemplateService {
  private templates = new Map<string, string>();
  
  constructor() {
    this.loadTemplates();
  }
  
  private loadTemplates(): void {
    this.templates.set('contact_analysis', `
      You are an expert sales analyst. Analyze the contact profile and provide insights.
      
      Contact: {{contact_info}}
      Interactions: {{interactions}}
      
      Provide analysis in the following format:
      {
        "personality": {
          "type": "DISC type",
          "traits": ["trait1", "trait2"],
          "communicationStyle": "description"
        },
        "businessProfile": {
          "decisionAuthority": "high|medium|low",
          "painPoints": ["pain1", "pain2"],
          "priorities": ["priority1", "priority2"]
        },
        "opportunityAssessment": {
          "score": 85,
          "likelihood": "high|medium|low",
          "timeline": "estimated timeline"
        }
      }
    `);
    
    this.templates.set('sales_script', `
      Generate a personalized sales script for the following scenario:
      
      Contact: {{contact_info}}
      Scenario: {{scenario}}
      Objective: {{objective}}
      Methodology: {{methodology}}
      
      Include:
      - Opening statement
      - Key talking points
      - Discovery questions
      - Objection handling
      - Closing approach
    `);
  }
  
  getTemplate(name: string, variables: Record<string, any>): string {
    let template = this.templates.get(name);
    if (!template) {
      throw new Error(`Template '${name}' not found`);
    }
    
    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      template = template!.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    });
    
    return template;
  }
}
```

## Security Guidelines

### Authentication & Authorization

```typescript
// JWT middleware
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Access token required'
      }
    });
  }
  
  jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token'
        }
      });
    }
    
    req.user = user;
    next();
  });
};

// Role-based access control
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions'
        }
      });
    }
    next();
  };
};
```

### Data Validation & Sanitization

```typescript
// Input sanitization
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss';

// Sanitize MongoDB queries
app.use(mongoSanitize());

// XSS protection
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
};

function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return xss(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    Object.keys(obj).forEach(key => {
      sanitized[key] = sanitizeObject(obj[key]);
    });
    return sanitized;
  }
  
  return obj;
}
```

### Environment Variables Security

```typescript
// Environment validation
import Joi from 'joi';

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
  PORT: Joi.number().default(5000),
  MONGODB_URI: Joi.string().required(),
  REDIS_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  OPENAI_API_KEY: Joi.string().required(),
  ENCRYPTION_KEY: Joi.string().length(32).required()
}).unknown();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongodb: {
    uri: envVars.MONGODB_URI
  },
  redis: {
    url: envVars.REDIS_URL
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    refreshSecret: envVars.JWT_REFRESH_SECRET,
    expiresIn: '15m',
    refreshExpiresIn: '7d'
  },
  openai: {
    apiKey: envVars.OPENAI_API_KEY
  },
  encryption: {
    key: envVars.ENCRYPTION_KEY
  }
};
```

## Performance Optimization

### Database Optimization

```typescript
// Efficient queries with aggregation
export class ContactService {
  async getContactsWithStats(userId: string, filters: ContactFilters) {
    const pipeline = [
      { $match: { userId: new ObjectId(userId) } },
      
      // Apply filters
      ...(filters.search ? [{
        $match: {
          $or: [
            { 'basicInfo.name': { $regex: filters.search, $options: 'i' } },
            { 'basicInfo.company': { $regex: filters.search, $options: 'i' } }
          ]
        }
      }] : []),
      
      // Lookup interactions count
      {
        $lookup: {
          from: 'interactions',
          localField: '_id',
          foreignField: 'contactId',
          as: 'interactions'
        }
      },
      
      // Add computed fields
      {
        $addFields: {
          interactionCount: { $size: '$interactions' },
          lastInteraction: { $max: '$interactions.createdAt' }
        }
      },
      
      // Remove interactions array to reduce payload
      { $unset: 'interactions' },
      
      // Sort and paginate
      { $sort: { [filters.sort || 'updatedAt']: filters.order === 'asc' ? 1 : -1 } },
      { $skip: filters.offset || 0 },
      { $limit: filters.limit || 50 }
    ];
    
    const [contacts, totalCount] = await Promise.all([
      Contact.aggregate(pipeline),
      Contact.countDocuments({ userId })
    ]);
    
    return {
      contacts,
      pagination: {
        total: totalCount,
        limit: filters.limit || 50,
        offset: filters.offset || 0
      }
    };
  }
}
```

### Caching Strategies

```typescript
// Multi-level caching
export class CacheManager {
  private memoryCache = new Map<string, { data: any; expires: number }>();
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }
  
  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first (fastest)
    const memoryResult = this.memoryCache.get(key);
    if (memoryResult && memoryResult.expires > Date.now()) {
      return memoryResult.data;
    }
    
    // Check Redis cache
    const redisResult = await this.redis.get(key);
    if (redisResult) {
      const data = JSON.parse(redisResult);
      
      // Store in memory cache for faster access
      this.memoryCache.set(key, {
        data,
        expires: Date.now() + 60000 // 1 minute
      });
      
      return data;
    }
    
    return null;
  }
  
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    // Store in both caches
    this.memoryCache.set(key, {
      data: value,
      expires: Date.now() + Math.min(ttl * 1000, 300000) // Max 5 minutes in memory
    });
    
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
  
  async invalidate(pattern: string): Promise<void> {
    // Clear memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }
    
    // Clear Redis cache
    const keys = await this.redis.keys(`*${pattern}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

## Debugging and Troubleshooting

### Logging Strategy

```typescript
// Structured logging with Winston
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'ai-crm-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id
    });
  });
  
  next();
};

// Usage in services
export class ContactService {
  async createContact(data: CreateContactData, userId: string): Promise<Contact> {
    logger.info('Creating contact', { userId, contactName: data.name });
    
    try {
      const contact = await this.performCreate(data, userId);
      
      logger.info('Contact created successfully', {
        contactId: contact.id,
        userId
      });
      
      return contact;
    } catch (error) {
      logger.error('Failed to create contact', {
        error: error.message,
        stack: error.stack,
        userId,
        contactData: data
      });
      
      throw error;
    }
  }
}
```

### Debug Configuration

```typescript
// Debug utilities
export class DebugUtils {
  static logPerformance<T>(name: string, fn: () => Promise<T>): Promise<T> {
    return new Promise(async (resolve, reject) => {
      const start = process.hrtime.bigint();
      
      try {
        const result = await fn();
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1000000; // Convert to milliseconds
        
        logger.debug(`Performance: ${name}`, { duration });
        resolve(result);
      } catch (error) {
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1000000;
        
        logger.error(`Performance: ${name} (failed)`, { duration, error: error.message });
        reject(error);
      }
    });
  }
  
  static async profileMemory(name: string): Promise<void> {
    const usage = process.memoryUsage();
    
    logger.debug(`Memory usage: ${name}`, {
      rss: `${Math.round(usage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(usage.external / 1024 / 1024)} MB`
    });
  }
}

// Usage
const contacts = await DebugUtils.logPerformance(
  'fetchContacts',
  () => contactService.getContacts(filters)
);
```

## Deployment Process

### CI/CD Pipeline

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:5.0
        ports:
          - 27017:27017
      redis:
        image: redis:6.2
        ports:
          - 6379:6379
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: |
        cd backend && npm ci
        cd ../frontend && npm ci
    
    - name: Run linting
      run: |
        cd backend && npm run lint
        cd ../frontend && npm run lint
    
    - name: Run tests
      run: |
        cd backend && npm test
        cd ../frontend && npm test -- --coverage --watchAll=false
      env:
        MONGODB_URI: mongodb://localhost:27017/crm_test
        REDIS_URL: redis://localhost:6379
        JWT_SECRET: test_secret_key_32_characters_long
    
    - name: Build applications
      run: |
        cd backend && npm run build
        cd ../frontend && npm run build
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to production
      run: |
        # Deployment script
        echo "Deploying to production..."
```

### Docker Production Build

```dockerfile
# Multi-stage production Dockerfile
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS production
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built application
COPY --from=base /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package*.json ./

# Set ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

CMD ["node", "dist/server.js"]
```

## Contributing Guidelines

### Code Review Process

1. **Before Creating PR:**
   - Ensure all tests pass
   - Run linting and fix issues
   - Update documentation if needed
   - Add/update tests for new features

2. **PR Description Template:**
   ```markdown
   ## Description
   Brief description of changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
   
   ## Testing
   - [ ] Unit tests added/updated
   - [ ] Integration tests added/updated
   - [ ] Manual testing completed
   
   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Documentation updated
   - [ ] No breaking changes (or documented)
   ```

3. **Review Criteria:**
   - Code quality and readability
   - Test coverage
   - Performance impact
   - Security considerations
   - Documentation completeness

### Release Process

1. **Version Numbering:**
   - Follow Semantic Versioning (SemVer)
   - MAJOR.MINOR.PATCH format
   - Use conventional commits for automatic versioning

2. **Release Checklist:**
   - [ ] All tests passing
   - [ ] Documentation updated
   - [ ] Changelog updated
   - [ ] Version bumped
   - [ ] Release notes prepared
   - [ ] Deployment tested in staging

This development guide provides comprehensive information for developers working on the AI-Driven CRM project. It covers all aspects from initial setup to deployment and maintenance.