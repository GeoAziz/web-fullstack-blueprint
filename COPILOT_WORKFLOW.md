# GitHub Copilot Workflow Guide

## 🎯 For Developers Without API Keys

This guide shows how to use **GitHub Copilot in VS Code** to build full-stack features using the same product specifications that power the AI Orchestrator.

**No Claude/GPT API key needed. No server running. Just you, VS Code, and Copilot.**

---

## ⚡ Quick Start (5 Minutes)

### Prerequisites
- ✅ VS Code installed
- ✅ GitHub Copilot subscription (or free trial)
- ✅ This repository cloned locally
- ✅ A feature to build

### The Workflow

```bash
# 1. Open the repository in VS Code
code /path/to/web-fullstack-blueprint

# 2. Update product specifications
# (Edit /product/*.md files)

# 3. Open Copilot Chat
# Cmd+Shift+I (Mac) or Ctrl+Shift+I (Windows/Linux)

# 4. Reference product files and ask
# "@product/prd.md @product/constraints.md build the auth feature"

# 5. Copy generated code to appropriate folders

# 6. Run tests and deploy
npm run test
npm run deploy
```

---

## 📋 Step-by-Step Workflow

### Step 1: Update Product Specifications

Product specifications live in `/product/` folder:

```
/product/
├── prd.md                  ← Feature requirements
├── user_flows.md          ← How users interact
├── constraints.md         ← Performance/security/accessibility gates
├── performance_budget.md  ← Speed requirements
├── seo_requirements.md    ← SEO constraints
├── ui_kit.md             ← Design system & components
└── non_goals.md          ← What NOT to build
```

**Edit the relevant files with your feature requirements:**

```markdown
# Example: Adding a Feature

Edit /product/prd.md and add:

## Feature: Real-Time Notifications

### Requirements
- WebSocket connection for live updates
- Toast notifications on events
- Notification history page
- Email digest option

### Performance Targets
- Initial load: <1.5s
- WebSocket latency: <100ms
- Lighthouse score: >90

### Accessibility
- WCAG 2.1 AA compliant
- Keyboard navigation
- Screen reader tested

### Security
- Verify user permission before sending notifications
- Encrypt notification data
- Rate limit notification API
```

### Step 2: Open Copilot Chat

**Mac:**
```
Cmd+Shift+I
```

**Windows/Linux:**
```
Ctrl+Shift+I
```

Or use the VS Code command palette:
```
Cmd+Shift+P (or Ctrl+Shift+P)
→ Type "Copilot Chat: Open"
→ Press Enter
```

Copilot Chat opens on the right side of VS Code.

### Step 3: Reference Product Files & Request Code

In Copilot Chat, type:

```
@product/prd.md @product/user_flows.md @product/constraints.md @product/performance_budget.md

Based on these specifications, generate complete code for the Real-Time Notifications feature.

Include:
1. Frontend: React components for notifications, toast UI, history page
2. Backend: WebSocket handler, notification API endpoints, email service
3. Database: Prisma schema for notifications table
4. Tests: Unit tests, integration tests, E2E tests for WebSocket flow
5. Types: Full TypeScript types and interfaces
6. Utilities: Helper functions for notifications, WebSocket connection manager

Requirements:
- Lighthouse score >90
- WCAG 2.1 AA compliance
- <100ms WebSocket latency
- 85%+ test coverage
- Zero TypeScript errors
```

### Step 4: Copilot Generates Code

Copilot will generate complete code blocks. You'll see:

```
Frontend Components:
- NotificationContainer.tsx (toasts)
- NotificationHistory.tsx (history page)
- useNotifications.ts (custom hook)

Backend:
- POST /api/notifications (create)
- GET /api/notifications (list)
- PUT /api/notifications/:id/read (mark as read)
- WebSocket handler (socket.io)

Database:
- Notification model
- NotificationPreference model
- Migration file

Tests:
- notification.test.ts (unit)
- notification.integration.test.ts (API)
- notification.e2e.test.ts (WebSocket flow)

Types:
- INotification interface
- NotificationEvent type
- WebSocketMessage type
```

### Step 5: Create Files in Your Repository

For each code block Copilot generates:

**Frontend Components:**
```bash
# Copy to appropriate folder
frontend/src/components/notifications/
├── NotificationContainer.tsx
├── NotificationHistory.tsx
└── __tests__/
    ├── NotificationContainer.test.tsx
    └── NotificationHistory.test.tsx

frontend/src/hooks/
└── useNotifications.ts

frontend/src/types/
└── notification.types.ts
```

**Backend:**
```bash
backend/src/api/
├── notifications/
│   ├── controller.ts
│   ├── routes.ts
│   ├── service.ts
│   └── __tests__/
│       ├── controller.test.ts
│       └── service.test.ts
└── websocket/
    ├── handler.ts
    └── __tests__/
        └── handler.test.ts

backend/src/types/
└── notification.types.ts

backend/prisma/migrations/
└── [timestamp]_add_notifications/
    └── migration.sql

backend/src/email/
└── notificationDigest.ts
```

**Update Prisma Schema:**
```bash
# backend/prisma/schema.prisma
# Add new models from Copilot's generated migration
```

### Step 6: Verify Generated Code

Before committing, verify quality gates:

```bash
# Run type checking
npm run type-check

# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Check Lighthouse performance
npm run lighthouse

# Check accessibility
npm run a11y

# Check security
npm run security
```

### Step 7: Commit and Deploy

```bash
git add .
git commit -m "Feature: Real-Time Notifications"
git push origin feature/real-time-notifications

# Create Pull Request
# Let CI/CD validate
# Merge when approved
# Deploy to production
```

---

## 💡 Advanced Techniques

### Technique 1: Breaking Down Large Features

If a feature is too large for one prompt:

**First prompt:** Generate data models and API structure
```
@product/prd.md @product/constraints.md

Generate ONLY the database schema and TypeScript types for notifications.
Output:
1. Prisma models (Notification, NotificationPreference, NotificationChannel)
2. Database migration
3. TypeScript interfaces (INotification, INotificationPreference, etc.)

Do NOT generate frontend or API endpoints yet.
```

**Second prompt:** Generate backend APIs
```
@product/prd.md @product/constraints.md

Using these models (copy previous output here), generate the backend API:

Models:
[paste Prisma schema]
[paste TypeScript types]

Generate:
1. Express routes and controllers
2. Service layer with business logic
3. Error handling and validation
4. Unit tests
5. Integration tests

Endpoints:
- POST /api/notifications (create)
- GET /api/notifications (list with pagination)
- PUT /api/notifications/:id/read (mark as read)
- DELETE /api/notifications/:id (delete)
```

**Third prompt:** Generate frontend
```
@product/prd.md @product/ui_kit.md @product/constraints.md

Generate React components for notifications:

API endpoints (copy from previous):
[paste API definitions]

Generate:
1. NotificationContainer component (for toasts)
2. NotificationHistory page
3. Custom hook (useNotifications)
4. Tests (unit + integration)
5. Accessibility features (ARIA labels, keyboard nav)
```

### Technique 2: Iterating on Generated Code

If generated code needs adjustments:

```
The NotificationContainer component needs changes:

Current behavior: [describe what it does]
New requirement: [what should change]

Update the component to [specific requirement]

Keep:
- All existing tests
- TypeScript types
- Error handling

Change:
- [specific functionality]
- [specific UI]
```

### Technique 3: Adding to Existing Features

If adding to an existing feature:

```
@frontend/src/components/Dashboard.tsx
@product/prd.md
@product/constraints.md

I need to add a notification bell icon to the Dashboard header.

Existing Dashboard component: [pasted above]

Requirements:
1. Show unread notification count
2. Dropdown menu with recent notifications
3. Link to full notification history
4. Mark as read when clicking
5. WebSocket updates

Generate:
- Updated Dashboard.tsx with notification bell
- NotificationBell.tsx component
- Tests for new functionality
```

---

## 🎨 Examples by Feature Type

### Example 1: Building Authentication

```
@product/prd.md @product/constraints.md @product/user_flows.md

Build the complete authentication system:

Flows:
- User signup with email verification
- User login with JWT token
- Refresh token rotation
- Password reset
- Session management

Performance targets:
- Login response: <200ms
- Lighthouse: >90
- Security: OWASP Top 10 compliant

Generate:
1. Frontend: Login, Signup, PasswordReset, EmailVerification pages
2. Backend: Auth endpoints (/auth/register, /auth/login, /auth/refresh, /auth/reset-password)
3. Database: User model, RefreshToken model
4. Tests: Auth flow E2E tests
5. Types: All TypeScript types
```

### Example 2: Building Dashboard

```
@product/prd.md @product/constraints.md @product/ui_kit.md

Build the analytics dashboard:

Requirements from PRD:
- Real-time metrics display
- Filterable by date range
- Export to CSV
- Shareable reports
- Mobile responsive

Performance:
- Initial load: <1.5s
- Real-time updates: <500ms
- Lighthouse: >90

Generate:
1. Frontend: Dashboard layout, MetricsCard, DatePicker, ExportButton
2. Backend: GET /api/metrics, GET /api/metrics/export, POST /api/reports/share
3. Database: Metrics and Reports models
4. Tests: Full E2E dashboard test
5. Types: Metrics, Report, Export types
```

### Example 3: Building API Feature

```
@product/prd.md @product/constraints.md

Build the User Profile API:

Endpoints needed:
- GET /api/users/:id (fetch profile)
- PUT /api/users/:id (update profile)
- POST /api/users/:id/avatar (upload avatar)
- DELETE /api/users/:id (delete account)

Constraints:
- Authorization required
- Rate limited (10 req/min)
- File size limit: 5MB for avatar
- Lighthouse: >90
- Security scan: 0 vulnerabilities

Generate:
1. Controllers with validation
2. Service layer with business logic
3. Database schema and migrations
4. Error handling
5. Unit tests
6. Integration tests
7. TypeScript types
```

---

## ✅ Quality Checklist

After Copilot generates code, verify:

### Code Quality
- [ ] TypeScript: 0 errors (`npm run type-check`)
- [ ] Linting: 0 warnings (`npm run lint`)
- [ ] Tests pass: 100% (`npm run test`)
- [ ] Test coverage: >80% (`npm run test:coverage`)

### Frontend
- [ ] Lighthouse: >90 (`npm run lighthouse`)
- [ ] Accessibility: WCAG 2.1 AA (`npm run a11y`)
- [ ] Mobile responsive: Checked in browser
- [ ] All browser tested: Chrome, Firefox, Safari

### Backend
- [ ] API responses: Correct status codes
- [ ] Error handling: Graceful errors
- [ ] Validation: All inputs validated
- [ ] Security: No SQL injection, XSS, CSRF vulnerabilities
- [ ] Performance: <200ms response time

### Database
- [ ] Migration: Can rollback cleanly
- [ ] Indexes: Added on foreign keys
- [ ] Types: Match Prisma schema
- [ ] Seed data: Added if needed

### Integration
- [ ] Frontend ↔ Backend: Wired correctly
- [ ] Environment variables: Configured
- [ ] CORS: Properly configured
- [ ] Authentication: Working end-to-end

---

## 🚨 Troubleshooting

### Copilot generates incomplete code

```
The generated code is incomplete. Specifically:

Missing: [what's missing]
Expected: [what should be there]

Please regenerate with all required parts:
1. [requirement 1]
2. [requirement 2]
3. [requirement 3]
```

### Copilot forgets constraints

```
The generated code doesn't meet performance requirements.

Constraints from /product/constraints.md:
- Lighthouse score: >90
- Response time: <200ms
- Test coverage: >85%

Current code:
- Lighthouse score: 72
- Response time: 450ms
- Test coverage: 45%

Regenerate with:
1. Performance optimizations (code splitting, lazy loading)
2. Efficient database queries
3. Comprehensive tests (unit + integration + E2E)
```

### TypeScript errors after copying

```
I'm getting TypeScript errors after copying your generated code.

Error: "Property 'x' is not defined"
File: src/components/MyComponent.tsx

The issue is: [describe the error]

Can you regenerate the code with:
1. All necessary imports included
2. Proper type definitions
3. All dependencies imported
```

### Tests failing

```
Generated tests are failing.

Test: "should create notification"
Error: "Expected 1, received 0"

The test expects [description].
But the code [what it does instead].

Please fix the test and implementation to [what should happen].
```

---

## 🎯 Success Metrics

You know you're using Copilot effectively when:

- ✅ Features take <1 hour to generate and integrate
- ✅ Generated code passes all tests immediately
- ✅ Code meets all quality gates (Lighthouse, accessibility, etc.)
- ✅ Minimal manual fixes needed
- ✅ You understand the generated code (can explain it to teammates)
- ✅ Code is production-ready without rework

---

## 📚 Related Documentation

- **For API Key Users**: See [`orchestrator/README.md`](orchestrator/README.md) for the headless orchestrator workflow
- **For Both**: See [`COPILOT_INSTRUCTIONS.md`](COPILOT_INSTRUCTIONS.md) for system prompts to improve Copilot responses
- **Architecture**: See [`SYSTEM_ARCHITECTURE.md`](SYSTEM_ARCHITECTURE.md) for folder structure and technical overview

---

## 🤝 Next Steps

1. **Try it now**: Pick a small feature and generate it with Copilot
2. **Join the conversation**: Share what works well and what needs improvement
3. **Contribute patterns**: Add new prompts and examples to this guide
4. **Scale up**: Build bigger features as you get comfortable

**Happy coding! 🚀**
