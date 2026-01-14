# Quick Start: Get Running in 30 Minutes

This guide will take you from zero to a working full-stack application with AI-assisted development in under 30 minutes.

## Prerequisites (5 minutes)

Before you begin, ensure you have:

### Required Software

- **Node.js 18+** - [Download](https://nodejs.org/)
  ```bash
  node --version  # Should be v18.0.0 or higher
  npm --version   # Should be v8.0.0 or higher
  ```

- **Git** - [Download](https://git-scm.com/)
  ```bash
  git --version
  git config --global user.name "Your Name"
  git config --global user.email "your@email.com"
  ```

- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop)
  ```bash
  docker --version
  docker run hello-world  # Test Docker works
  ```

- **VS Code** - [Download](https://code.visualstudio.com/)
  - Extension: Claude Code (search in Extensions marketplace)

### Recommended Configuration

```bash
# Configure Git SSH (for GitHub access)
ssh-keygen -t ed25519 -C "your@email.com"
# Add the public key to GitHub: https://github.com/settings/keys

# Or use GitHub CLI
gh auth login
```

## Step 1: Clone and Setup (5 minutes)

### 1.1 Clone the Repository

```bash
# Clone the blueprint
git clone https://github.com/your-org/ai-web-fullstack-blueprint.git
cd ai-web-fullstack-blueprint

# Navigate to the web fullstack blueprint
cd web-fullstack-blueprint

# Verify structure
ls -la  # Should see: product/, frontend/, backend/, infra/, ai/, README.md, etc.
```

### 1.2 Install Dependencies

```bash
# Install all dependencies
npm install

# This installs:
# - Frontend dependencies (React, Next.js, TypeScript, etc.)
# - Backend dependencies (Express, Prisma, etc.)
# - Testing tools (Jest, Playwright, etc.)
# - Build tools (ESLint, Prettier, etc.)
```

### 1.3 Configure Environment

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your settings
nano .env.local  # or open in your editor

# Key variables to check:
# - DATABASE_URL=postgresql://user:pass@localhost:5432/blueprint
# - NODE_ENV=development
# - JWT_SECRET=your-secret-key
```

### 1.4 Initialize Database

```bash
# Start PostgreSQL container
docker-compose up -d postgres

# Wait for database to be ready
sleep 5

# Run migrations
npm run db:migrate

# Seed with sample data (optional)
npm run db:seed

# Verify database
npm run db:check
```

**Expected Output**:
```
✓ Database connected
✓ Migrations applied
✓ Sample data loaded
✓ Ready for development
```

## Step 2: Start Development Servers (5 minutes)

### 2.1 Start Backend

Open Terminal 1:

```bash
npm run backend:dev
```

**Expected Output**:
```
[backend] Server running on http://localhost:3001
[backend] Database connected
[backend] Ready to accept requests
```

### 2.2 Start Frontend

Open Terminal 2:

```bash
npm run frontend:dev
```

**Expected Output**:
```
  ▲ Next.js 14.0.0
  - Ready in 2.1s

 ○ Listening on http://localhost:3000
   - Local:        http://localhost:3000
   - Environments: .env.local
```

### 2.3 Verify Everything Works

Open Terminal 3:

```bash
# Test backend API
curl http://localhost:3001/api/health

# Expected: {"status":"ok"}

# Test frontend
open http://localhost:3000  # macOS
# or
xdg-open http://localhost:3000  # Linux
# or
start http://localhost:3000  # Windows
```

**Expected**: Homepage loads with "Welcome to AI Web Blueprint"

## Step 3: Explore the Project Structure (5 minutes)

### 3.1 Understand the Human Domain

```bash
# Open the Product Requirements Document
cat product/prd.md

# Key sections:
# - Executive Summary: What this app does
# - Target Audience: Who uses it
# - Core Features: What gets built
# - Success Metrics: How we measure success
```

### 3.2 Explore Key Folders

```bash
# Frontend code structure
ls -la frontend/src/

# Backend code structure
ls -la backend/

# Infrastructure configuration
ls -la infra/

# AI orchestration system
ls -la ai/
```

### 3.3 Review the Tech Stack

```bash
# Frontend: React/Next.js
cat frontend/package.json | grep -A 10 '"dependencies"'

# Backend: Express/Prisma
cat backend/package.json | grep -A 10 '"dependencies"'

# Infrastructure: Terraform
cat infra/terraform/main.tf | head -20
```

## Step 4: Make Your First Product Change (10 minutes)

### 4.1 Update the PRD

```bash
# Open the product requirements document
code product/prd.md
```

Make a small change to document a new feature:

```markdown
## New Feature: Contact Form

### Priority: P1

### User Story
As a website visitor, I want to submit my contact information
so that I can request more information about the product.

### Acceptance Criteria
- Form has Name, Email, Message fields
- Form validates email format
- Submission sends confirmation email
- Form shows success message

### Performance Requirements
- Page load: <2s
- Form submission: <500ms

### Accessibility Requirements
- WCAG 2.1 AA compliance
- Keyboard navigation complete
- Screen reader compatible

### SEO Requirements
- Page title: "Contact Us | Company Name"
- Meta description: "Get in touch with our team"
```

### 4.2 Commit Your Changes

```bash
# Stage the change
git add product/prd.md

# Commit with descriptive message
git commit -m "feat(product): add contact form feature"

# Verify
git log --oneline -5
```

## Step 5: Trigger AI Build (5 minutes)

### 5.1 Open Claude Code

```bash
# In VS Code
Cmd+Shift+P (macOS) or Ctrl+Shift+P (Windows/Linux)

# Type: "Claude Code: Open"
# Or: Use the Claude icon in the left sidebar
```

### 5.2 Submit Build Request

In Claude Code, paste:

```
I've added a contact form feature to product/prd.md.
Please implement it according to the specifications:

1. Frontend:
   - Create contact form component with Name, Email, Message fields
   - Form validation (required fields, email format)
   - Success message on submission
   - Responsive design

2. Backend:
   - Create POST /api/contact endpoint
   - Validate and sanitize inputs
   - Store submissions in database
   - Send confirmation email

3. Infrastructure:
   - Ensure email service is configured

Follow the performance budgets and ensure WCAG 2.1 AA compliance.
```

### 5.3 Watch the Orchestration

Claude Code will:

1. **Analyze** the PRD and identify requirements
2. **Create Plan** for frontend, backend, and infrastructure changes
3. **Delegate** to specialized agents:
   - Frontend Engineer: builds form component
   - Backend Engineer: creates API endpoint
   - Security Reviewer: checks authentication
   - Test Engineer: generates tests
4. **Validate** against quality gates:
   - TypeScript compilation
   - Linting and formatting
   - Test execution
   - Performance budgets
   - Security scan
   - Accessibility audit
5. **Summarize** the results

**Expected time**: 2-5 minutes

### 5.4 Review Generated Code

Claude will show:

```markdown
## Contact Form Implementation Summary

### Frontend Changes
✅ Components Created:
  - ContactForm.tsx - Main form component
  - ContactFormField.tsx - Reusable field component
  - ContactFormSuccess.tsx - Success message

✅ Features:
  - Email validation using Zod
  - Accessible form with ARIA labels
  - Loading state while submitting
  - Error messages and handling

### Backend Changes
✅ Endpoints Created:
  - POST /api/contact - Submit contact form

✅ Features:
  - Input validation and sanitization
  - Rate limiting (5 submissions per minute per IP)
  - Email sending via SendGrid
  - Database storage of submissions

### Quality Gates
✅ All passed:
  - TypeScript: Compilation successful
  - Linting: 0 errors, 0 warnings
  - Tests: 34 new tests, all passing
  - Coverage: 87% (target: 80%)
  - Performance: Lighthouse 92 (target: 90)
  - Security: 0 vulnerabilities
  - Accessibility: WCAG 2.1 AA
```

## Step 6: Review and Test Locally (5 minutes)

### 6.1 View Generated Changes

```bash
# See what files were created/modified
git status

# Review the diff
git diff frontend/src/
git diff backend/api/

# Or in VS Code:
# File Explorer: Look for new files with the contact form feature
# Source Control: Review changes before committing
```

### 6.2 Run Tests Locally

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- frontend/src/features/contact/ContactForm.test.tsx
```

### 6.3 Test in Browser

```bash
# Frontend should still be running at http://localhost:3000
# Backend should still be running at http://localhost:3001

# Test the form:
# 1. Navigate to /contact
# 2. Fill in the form
# 3. Click submit
# 4. Should see success message
# 5. Check database for stored submission

# Check backend endpoint:
curl -X POST http://localhost:3001/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Hello, I am interested in your product."
  }'

# Expected response:
# {"success": true, "message": "Thank you for contacting us!"}
```

### 6.4 Check Performance

```bash
# Run Lighthouse audit
npm run lighthouse

# Check bundle size
npm run bundle:analyze

# Verify build time
npm run build

# All should meet performance budgets!
```

## Step 7: Commit and Deploy (5 minutes)

### 7.1 Commit Generated Code

```bash
# Stage all changes
git add .

# Commit with feature branch
git commit -m "feat: implement contact form feature

- Add contact form component with validation
- Create POST /api/contact endpoint
- Implement email notification
- Add comprehensive tests
- All quality gates passing"

# Create feature branch if not already there
git checkout -b feature/contact-form
```

### 7.2 Create Pull Request

```bash
# Push to GitHub
git push origin feature/contact-form

# Then create PR at https://github.com/your-org/ai-web-fullstack-blueprint/pulls
```

### 7.3 Review and Merge

```bash
# After review is approved
git checkout main
git pull origin main
git merge feature/contact-form
git push origin main
```

### 7.4 Watch Deployment

Push to main triggers CI/CD:

```bash
# GitHub Actions runs:
# ✅ Tests (all passing)
# ✅ Build (frontend + backend)
# ✅ Deploy to staging
# ✅ Health checks
# ✅ Blue-green deploy to production

# Your feature is now live!
```

## Troubleshooting Common Issues

### Issue: Port Conflicts

```bash
# If port 3000 or 3001 is already in use

# Check what's using the port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or use different ports
npm run frontend:dev -- -p 3002
npm run backend:dev -- -p 3002
```

### Issue: Database Connection Errors

```bash
# Verify PostgreSQL container is running
docker ps | grep postgres

# If not running, start it
docker-compose up -d postgres

# Check connection
npm run db:check

# Reset database if corrupted
docker-compose down -v postgres
docker-compose up -d postgres
npm run db:migrate
```

### Issue: Node Version Mismatch

```bash
# Check your Node version
node --version

# Should be 18.0.0 or higher

# If too old, update Node
# Using nvm (Node Version Manager):
nvm install 18
nvm use 18

# Or download latest from https://nodejs.org
```

### Issue: npm Install Fails

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and lock file
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: Claude Code Not Responding

```bash
# Restart VS Code
# Cmd+K Cmd+Q (macOS) or Ctrl+K Ctrl+Q (Windows/Linux)

# Or manually:
# 1. Close VS Code completely
# 2. Open it again
# 3. Re-open Claude Code
```

## Next Steps

### Learn More

- **[CONCEPT.md](./CONCEPT.md)**: Understand the philosophy and architecture
- **[HOW_IT_WORKS.md](./HOW_IT_WORKS.md)**: Deep dive into the technical system
- **[product/prd.md](./product/prd.md)**: See the full example PRD structure

### Build Your Own Features

1. **Update `product/prd.md`** with your feature requirements
2. **Use Claude Code** to submit the implementation request
3. **Review the generated code** and tests
4. **Commit and deploy** via Git

### Explore the Codebase

```bash
# Frontend structure
ls -la frontend/src/

# Backend structure
ls -la backend/api/
ls -la backend/domain/

# Infrastructure
ls -la infra/terraform/

# AI system
ls -la ai/hooks/
ls -la ai/agents/
```

### Configure Your Project

1. Update `product/prd.md` with your actual product vision
2. Update `product/ui_kit.md` with your design system
3. Update `product/constraints.md` with your requirements
4. Configure environment variables in `.env.local`
5. Update GitHub repository settings

### Deploy to Production

```bash
# When ready to deploy
git push origin main

# This triggers:
# 1. GitHub Actions CI/CD pipeline
# 2. Automated tests and builds
# 3. Deployment to staging environment
# 4. Smoke tests
# 5. Blue-green deployment to production
# 6. Health checks and monitoring

# Monitor the deployment
# - GitHub Actions: https://github.com/your-org/repo/actions
# - Application logs: Via cloud provider or monitoring tool
# - Performance: Lighthouse CI results
```

## Pro Tips

### Development Workflow

```bash
# Keep terminals running during development
# Terminal 1: Backend
npm run backend:dev

# Terminal 2: Frontend
npm run frontend:dev

# Terminal 3: Tests (watch mode)
npm test -- --watch

# Terminal 4: Available for commands
```

### Save Time with Scripts

```bash
# All available scripts in package.json
npm run  # Lists all scripts

# Common ones:
npm run lint       # Check code style
npm run format     # Auto-format code
npm test          # Run all tests
npm run build     # Production build
npm run db:seed   # Seed database with test data
```

### Use Git Effectively

```bash
# Always create feature branches
git checkout -b feature/my-feature

# Make small, logical commits
git commit -m "type: brief description"

# Review changes before committing
git diff  # See unstaged changes
git diff --staged  # See staged changes

# Types: feat, fix, docs, style, refactor, test, chore
```

### Debugging

```bash
# Add breakpoints in VS Code (Ctrl+F5 or Cmd+F5)
# or use console.log for quick debugging

// Frontend debugging
console.log('value:', someValue);

// Backend debugging
console.log('request:', req.body);

// Watch mode tests
npm test -- --watch --verbose
```

## Success Criteria

You've successfully completed the quick start when:

- ✅ Backend running on localhost:3001
- ✅ Frontend running on localhost:3000
- ✅ Homepage loads without errors
- ✅ Database connected and seeded
- ✅ All tests passing
- ✅ You've submitted a feature request to Claude Code
- ✅ Generated code created and tested locally
- ✅ Committed changes to feature branch

**Congratulations! You're ready to start building full-stack web applications with AI assistance.**

---

## Getting Help

- **[GitHub Issues](https://github.com/your-org/ai-web-fullstack-blueprint/issues)**: Report bugs
- **[Discussions](https://github.com/your-org/ai-web-fullstack-blueprint/discussions)**: Ask questions
- **[Documentation](./README.md)**: Full docs and links

---

**Ready to build your next feature?** Go to [CONCEPT.md](./CONCEPT.md) to understand the vision, or jump straight to using Claude Code to build!

**Need more details?** Read [HOW_IT_WORKS.md](./HOW_IT_WORKS.md) for technical deep dives.
