# ⚡ Developer Quick Reference - Dual Path System

**Choose your path. Ship at 13X velocity. No compromises.**

---

## 🚀 Path Decision Tree

### Do you have Claude/GPT API keys?

```
YES
├─ Use: ORCHESTRATOR PATH (automated, headless)
├─ Time: 45 minutes per feature
├─ Cost: $0.01-0.10 per feature
├─ Automation: 100% (no manual integration)
└─ Best for: Production pipelines, CI/CD

NO
├─ Use: COPILOT PATH (interactive, manual)
├─ Time: 30-60 minutes per feature
├─ Cost: Copilot subscription ($10-20/month)
├─ Automation: 0% (you control each step)
└─ Best for: Rapid development, learning, prototyping
```

---

## 📋 Path 1: ORCHESTRATOR (With API Keys)

### Setup (5 minutes)

```bash
# 1. Get Claude API key from https://console.anthropic.com
export CLAUDE_API_KEY="sk-ant-xxxxxxxx"

# 2. Start orchestrator
cd orchestrator
npm install
npm run dev

# 3. Watch /product/ folder for changes
npm run watch
```

### Workflow (For each feature)

```bash
# 1. Write feature spec
echo "# Build Dashboard
## Requirements
- Real-time metrics
- Export to CSV" > /product/dashboard_feature.md

# 2. Commit changes
git add product/
git commit -m "feat: add dashboard requirements"

# 3. Orchestrator automatically:
#    ✓ Reads PRD
#    ✓ Generates full-stack code
#    ✓ Runs tests
#    ✓ Validates constraints
#    ✓ Deploys to staging

# 4. Review in staging, approve deployment
npm run deploy:production
```

### Time Breakdown

| Step | Time |
|------|------|
| Write spec | 10 min |
| Commit | 1 min |
| AI generation | 20 min |
| Tests & validation | 10 min |
| Deploy | 4 min |
| **Total** | **45 min** |

---

## 📋 Path 2: COPILOT (Without API Keys)

### Setup (2 minutes)

```bash
# 1. Install GitHub Copilot in VS Code
#    (Extensions → search "GitHub Copilot" → Install)

# 2. Sign in with GitHub account

# 3. Open project
code /path/to/web-fullstack-blueprint
```

### Workflow (For each feature)

```bash
# Step 1: Write spec in /product/prd.md
# (Update the file with feature requirements)

# Step 2: Open Copilot Chat (Cmd+Shift+I on Mac, Ctrl+Shift+I on Windows)

# Step 3: Type request:
@product/prd.md @product/constraints.md

Build the dashboard feature with:
- Real-time metrics updates
- Export to CSV
- WCAG 2.1 AA accessible
- Lighthouse >90

# Step 4: Copilot generates code in chat

# Step 5: Copy code to files
#    Frontend: src/components/Dashboard.tsx
#    Backend: src/routes/dashboard.ts
#    Tests: tests/dashboard.test.ts

# Step 6: Validate with CopilotValidator
npm run validate:copilot

# Step 7: Run tests
npm test

# Step 8: Deploy
git add .
git commit -m "feat: add dashboard"
git push
npm run deploy
```

### Time Breakdown

| Step | Time |
|------|------|
| Write spec | 10 min |
| Open Copilot | 1 min |
| Generate | 5 min |
| Copy code | 10 min |
| Validate | 5 min |
| Test & fix | 15 min |
| Deploy | 4 min |
| **Total** | **50 min** |

---

## 🎯 Which Path for What?

| Scenario | Path | Why |
|----------|------|-----|
| **Production pipeline** | Orchestrator | Fully automated, no human intervention |
| **Friday deployment** | Orchestrator | Speed critical, reliability required |
| **Learning new feature** | Copilot | See each step, understand architecture |
| **Rapid prototyping** | Copilot | Fast iteration with developer control |
| **Team development** | Orchestrator | Consistent, repeatable process |
| **Experimentation** | Copilot | Try things, see what works |
| **Budget constrained** | Copilot | No API costs, just subscription |
| **Scale to 1000s** | Orchestrator | Cost efficient at volume |

---

## 📝 Both Paths Require

### Same Product Files

```
/product/
├── prd.md                  # Feature requirements
├── user_flows.md          # User journeys
├── constraints.md         # Quality gates
├── performance_budget.md  # Speed targets
├── seo_requirements.md    # SEO needs
├── ui_kit.md             # Design system
└── non_goals.md          # Out of scope
```

### Same Quality Standards

- ✅ TypeScript strict: 0 errors
- ✅ Tests: >85% coverage
- ✅ Lighthouse: >90
- ✅ Accessibility: WCAG 2.1 AA
- ✅ Security: OWASP Top 10
- ✅ Performance: <200ms API

---

## 🔍 Quality Validation

### Both Paths

```bash
# TypeScript Check
npx tsc --noEmit

# ESLint Check
npx eslint src/

# Tests
npm test

# Coverage
npm run test:coverage

# Lighthouse (Frontend)
npm run build
npx lighthouse http://localhost:3000

# CopilotValidator (Copilot path only)
npm run validate:copilot
```

---

## 🚀 Real Examples

### Example 1: Authentication (Path 1 - Orchestrator)

```bash
# Write spec
cat > /product/auth.md << 'EOF'
# Authentication

## Requirements
- JWT tokens
- Email verification
- Password reset
- Rate limiting

## Targets
- <200ms login
- WCAG 2.1 AA
- Lighthouse >90
EOF

# Commit
git add product/auth.md
git commit -m "spec: authentication"

# ✅ Done! Orchestrator handles everything
```

### Example 2: Dashboard (Path 2 - Copilot)

```
# In Copilot Chat:

@product/prd.md @product/ui_kit.md

Build dashboard with:
- Real-time metrics (<150ms updates)
- WebSocket integration
- Dark/light mode
- Mobile responsive

Ensure:
- Lighthouse >90
- WCAG 2.1 AA
- Follows ui_kit.md design

# ✅ Copilot generates code
# ✅ You review and integrate
```

---

## 🔄 Switching Between Paths

### Start with Copilot

```
Day 1: Prototype with Copilot
↓
Learn architecture while building
↓
See each file created
↓
Understand constraints
↓
Ready for production
↓
Day 5: Migrate to Orchestrator for deployment pipeline
```

### Or Jump to Orchestrator

```
Add Claude API key
↓
Deploy orchestrator
↓
All future features automated
↓
Keep Copilot for local development if you want
```

---

## 💡 Pro Tips

### Copilot Users

```bash
# Always reference product files
@product/prd.md @product/constraints.md @product/ui_kit.md

# Be specific about what you want
# Good: "Build React login form with validation, tests, TypeScript"
# Bad: "Build login"

# Ask for refinements incrementally
# "Add error handling"
# "Add accessibility"
# "Add tests"
# "Optimize performance"

# Copy outputs carefully
# Each language/component is separate code block
```

### Orchestrator Users

```bash
# Write detailed specs
# More detail = better generation

# Use constraints file extensively
# Constraints drive quality

# Watch the logs
# Understand what's happening
# Learn from the process

# Test locally before production
# Always verify staging first
```

---

## ⚠️ Common Issues

### Copilot: Generated code doesn't compile

**Solution:** Ask Copilot again with more specific requirements
```
Can you regenerate this with:
- Strict TypeScript
- Proper error handling
- No any types
- Full test coverage
```

### Copilot: Tests not passing

**Solution:** Ask for test improvements
```
The tests are failing. Can you:
- Mock external dependencies
- Add proper assertions
- Test error cases
- Reach >85% coverage
```

### Orchestrator: Deployment fails

**Solution:** Check logs
```bash
npm run logs
# Review what went wrong
# Update spec for clarity
# Try again
```

---

## 📊 Metrics to Track

### Path 1 (Orchestrator)

- ✅ Time from spec to production: Should be 45 min
- ✅ Quality gate pass rate: Should be 100%
- ✅ API costs per feature: Should be <$0.20
- ✅ Deployment success rate: Should be >99%

### Path 2 (Copilot)

- ✅ Time from spec to code: Should be 30-50 min
- ✅ Code review time: Should be <10 min
- ✅ Test pass rate: Should be >95%
- ✅ Developer satisfaction: Should be high

---

## 🎯 Next Steps

**Today:**
```bash
# Pick one path
# Read the workflow guide
# Generate your first feature
```

**This Week:**
```bash
# Generate 3-5 features
# Measure time & quality
# Optimize your process
```

**This Month:**
```bash
# Generate 20+ features
# Switch between paths
# Find your rhythm
```

---

## 📚 Documentation

| Need | File |
|------|------|
| **Copilot detailed guide** | `/COPILOT_WORKFLOW.md` |
| **System prompts for Copilot** | `/COPILOT_INSTRUCTIONS.md` |
| **Validation implementation** | `/orchestrator/src/adapters/copilot-validator.ts` |
| **Architecture overview** | `/SYSTEM_ARCHITECTURE.md` |
| **Path comparison** | `/COPILOT_VS_ORCHESTRATOR_GUIDE.md` |
| **Specifications** | `/product/prd.md` |

---

## 🚀 Ready to Build?

**Pick your path. Start today. Ship at 13X velocity.**

### Path 1: Orchestrator
→ Go to `/orchestrator/README.md`

### Path 2: Copilot
→ Go to `/COPILOT_WORKFLOW.md`

### Need Help?
→ Go to `/COPILOT_DUAL_PATH_IMPLEMENTATION.md`

---

**13X Velocity Achieved. Choose your speed. 🚀**
