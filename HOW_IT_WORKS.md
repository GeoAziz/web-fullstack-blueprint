# How It Works: Technical System Architecture

## Complete Workflow: PRD Update to Production Deployment

### Phase 1: Human Defines Requirements

#### Step 1.1: Update Product Files

Developer updates files in `product/` folder:

```bash
product/
├── prd.md                    # Add feature requirements
├── user_flows.md             # Document user journey
├── ui_kit.md                 # Define visual design
├── performance_budget.md     # Set performance targets
├── seo_requirements.md       # SEO requirements
└── constraints.md            # Technical constraints
```

**Example PRD Update**:
```markdown
## Feature: Real-Time Dashboard

### Priority: P0

### User Story
As a product manager, I want to see real-time metrics
so that I can make data-driven decisions instantly.

### Acceptance Criteria
- Dashboard loads in <2 seconds
- Updates appear within 500ms of data change
- Works on mobile and desktop
- SEO: Dashboard is private (no indexing needed)

### Performance Requirements
- Lighthouse score >90
- Core Web Vitals: LCP <2s, FID <100ms, CLS <0.1
- Real-time updates: <500ms latency

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation complete
- Screen reader compatible
```

#### Step 1.2: Commit Changes

```bash
git commit -m "feat(product): add real-time dashboard feature"
git push origin feature/dashboard
```

### Phase 2: Validation Hooks Fire

#### Hook 1: user_prompt_submit.py

**When**: Immediately when developer submits prompt to Claude Code

**Validates**:
```python
# Pseudo-code
def validate_prompt():
    # 1. Check PRD has been updated
    if not prd_updated():
        raise ValidationError("Update product/prd.md first")
    
    # 2. Scan for secrets (API keys, tokens)
    if contains_secrets(prompt):
        raise SecurityError("Remove secrets from prompt")
    
    # 3. Inject context
    context = {
        "current_bundle_size": "182KB",
        "latest_lighthouse_score": 92,
        "recent_commits": get_last_commits(5),
        "performance_budget": get_budget("dashboard"),
        "seo_requirements": get_seo_requirements("dashboard"),
    }
    
    # 4. Generate session
    session = create_session(prompt, context)
    
    return session
```

**Blocking Conditions**:
- ❌ Secrets detected in prompt
- ❌ PRD not updated
- ❌ Performance budget not defined for new pages
- ❌ SEO requirements missing for new pages

#### Hook 2: prd_validator.py

**When**: Triggered by user_prompt_submit.py

**Validates PRD Completeness**:
```python
# Pseudo-code
def validate_prd():
    prd = load_prd()
    
    # Check required sections
    required_sections = [
        "executive_summary",
        "problem_statement",
        "target_audience",
        "success_metrics",
        "core_features",
        "user_flows",
        "design_system",
        "constraints",
        "non_goals",
        "seo_requirements",
        "performance_budget",
    ]
    
    for section in required_sections:
        if not prd.has_section(section):
            raise ValidationError(f"Missing required section: {section}")
    
    # Validate each feature has required attributes
    for feature in prd.features:
        assert feature.acceptance_criteria, "Feature needs acceptance criteria"
        assert feature.performance_requirements, "Feature needs performance targets"
        assert feature.accessibility_requirements, "Feature needs a11y spec"
    
    # Cross-reference validation
    for page in prd.pages:
        assert prd.has_seo_requirements(page), f"Missing SEO requirements for {page}"
        assert prd.has_performance_budget(page), f"Missing performance budget for {page}"
    
    return True
```

**Output**:
- ✅ PRD validation report
- ❌ Missing items list
- 💡 Recommendations

### Phase 3: Developer Submits to Claude Code

Developer opens Claude Code and submits:

```
"Implement the real-time dashboard feature from the PRD.
Use WebSockets for real-time updates, ensure SEO compliance,
and maintain 90+ Lighthouse score."
```

### Phase 4: Orchestrator Analyzes and Plans

#### Orchestrator Logic

```python
# Pseudo-code
class Orchestrator:
    def create_plan(self, prompt, context):
        # 1. Parse requirements
        requirements = parse_prompt(prompt)
        prd = load_prd()
        
        # 2. Identify work items
        tasks = {
            "frontend": [
                Task(name="Dashboard page component",
                     priority=P0, complexity=high),
                Task(name="Real-time metrics widget",
                     priority=P0, complexity=medium),
                Task(name="WebSocket client",
                     priority=P0, complexity=high),
            ],
            "backend": [
                Task(name="Metrics aggregation API",
                     priority=P0, complexity=high),
                Task(name="WebSocket server",
                     priority=P0, complexity=high),
                Task(name="Database optimization",
                     priority=P0, complexity=medium),
            ],
            "infra": [
                Task(name="WebSocket load balancing",
                     priority=P1, complexity=high),
                Task(name="Monitoring for real-time",
                     priority=P1, complexity=medium),
            ],
            "security": [
                Task(name="WebSocket authentication",
                     priority=P0, complexity=medium),
                Task(name="Rate limiting for metrics API",
                     priority=P0, complexity=medium),
            ],
            "testing": [
                Task(name="E2E test for dashboard flow",
                     priority=P0, complexity=medium),
                Task(name="Load test WebSocket",
                     priority=P1, complexity=high),
            ],
        }
        
        # 3. Create execution plan
        plan = ExecutionPlan(
            tasks=tasks,
            parallelization={
                "frontend": ["backend", "infra"],  # Frontend waits for backend contract
                "backend": [],                     # Backend can start immediately
                "infra": ["backend"],              # Infra waits for backend requirements
                "security": [],                    # Security reviews in parallel
                "testing": ["backend"],            # Testing waits for backend
            },
            dependencies={
                "OpenAPI contract": ["backend → frontend"],
                "Database schema": ["backend → infra optimization"],
                "Authentication": ["backend → frontend WebSocket"],
            }
        )
        
        return plan
```

**Execution Plan Output**:

```markdown
# Execution Plan: Real-Time Dashboard

## Parallel Task Delegation

### 1. Backend Engineer (Start immediately)
- [ ] Create `/api/metrics` endpoints
- [ ] Implement WebSocket server
- [ ] Database query optimization
- [ ] Authentication for WebSocket

**Estimated time**: 45 minutes

### 2. Frontend Engineer (Wait for OpenAPI contract)
- [ ] Dashboard page component
- [ ] Real-time metrics widget
- [ ] WebSocket client
- [ ] SEO metadata

**Estimated time**: 40 minutes
**Blocker**: OpenAPI contract from Backend

### 3. Infra Guardian (Wait for backend requirements)
- [ ] WebSocket load balancing
- [ ] Monitoring and alerting
- [ ] Auto-scaling for real-time

**Estimated time**: 30 minutes
**Blocker**: Backend WebSocket details

### 4. Security Reviewer (Parallel to others)
- [ ] Review WebSocket authentication
- [ ] Validate rate limiting
- [ ] Check for common vulnerabilities

**Estimated time**: 20 minutes

### 5. Test Engineer (Wait for backend)
- [ ] E2E test: Dashboard real-time updates
- [ ] Load test: WebSocket connections
- [ ] Performance test: Lighthouse

**Estimated time**: 30 minutes
**Blocker**: Backend implementation

## Total Estimated Time: 45 minutes (vs. 2-4 hours manual)

## Quality Gates Applied

1. **Pre-Tool Use**: Block dangerous operations
2. **Post-Tool Use**: Validate after each change
3. **Web Performance Guard**: Enforce Lighthouse >90
4. **Web Security Scanner**: Check for vulnerabilities
5. **SEO Validator**: Ensure private pages not indexed
6. **Accessibility Validator**: Check WCAG compliance
7. **Test Enforcer**: Ensure 80%+ coverage
8. **Lighthouse CI**: Continuous monitoring
9. **Stop Validator**: Final quality check
```

### Phase 5: Parallel Agent Execution

#### Agent 1: Backend Engineer (Starts immediately)

```typescript
// Pseudo-code: What Backend Engineer creates

// 1. OpenAPI Contract (contracts/metrics.openapi.yaml)
paths:
  /api/metrics:
    get:
      summary: Get current metrics
      parameters:
        - name: dashboard
          in: query
          required: true
      responses:
        200:
          description: Metrics data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Metrics'
  
  /api/metrics/subscribe:
    post:
      summary: WebSocket connection for real-time updates
      security:
        - bearerAuth: []

// 2. Backend Implementation (api/metrics.controller.ts)
@Controller('/api/metrics')
export class MetricsController {
  constructor(private metricsService: MetricsService) {}
  
  @Get()
  @UseGuards(AuthGuard, RateLimitGuard)
  async getMetrics(@Query('dashboard') dashboardId: string) {
    const metrics = await this.metricsService.getMetrics(dashboardId);
    return MetricsSerializer.serialize(metrics);
  }
  
  @WebSocketGateway('/api/metrics/subscribe')
  @UseGuards(WebSocketAuthGuard)
  handleConnection(client: Socket) {
    // Implement real-time updates
    const interval = setInterval(() => {
      const metrics = this.metricsService.getLatestMetrics();
      client.emit('metrics-update', metrics);
    }, 500);
  }
}

// 3. Database Query Optimization (persistence/metrics.repository.ts)
export class MetricsRepository {
  async getMetrics(dashboardId: string) {
    return this.db.query(
      `SELECT * FROM metrics 
       WHERE dashboard_id = $1 AND created_at > NOW() - INTERVAL '24 hours'
       ORDER BY created_at DESC LIMIT 100`,
      [dashboardId]
    ).index('metrics_dashboard_created');
  }
}

// 4. Business Logic (domain/metrics.service.ts)
export class MetricsService {
  async getMetrics(dashboardId: string): Promise<Metrics> {
    // Business logic for aggregation, filtering, calculation
  }
}

// 5. Tests (tests/integration/metrics.test.ts)
describe('Metrics API', () => {
  it('should return metrics for dashboard', async () => {
    const res = await request(app)
      .get('/api/metrics?dashboard=123')
      .set('Authorization', 'Bearer token');
    
    expect(res.status).toBe(200);
    expect(res.body.metrics).toBeDefined();
  });
  
  it('should reject unauthenticated requests', async () => {
    const res = await request(app)
      .get('/api/metrics?dashboard=123');
    
    expect(res.status).toBe(401);
  });
  
  it('should rate limit excessive requests', async () => {
    // Make 100+ requests in rapid succession
    for (let i = 0; i < 101; i++) {
      const res = await request(app)
        .get('/api/metrics?dashboard=123')
        .set('Authorization', 'Bearer token');
      
      if (i < 100) expect(res.status).toBe(200);
      else expect(res.status).toBe(429); // Too Many Requests
    }
  });
});
```

**Quality Validation After Backend Changes**:

pre_tool_use hooks block:
- ❌ Hardcoded secrets
- ❌ SQL without parameterization
- ❌ Unauthenticated endpoints
- ❌ Missing rate limiting

post_tool_use hooks trigger:
- ✅ TypeScript compilation
- ✅ ESLint validation
- ✅ Unit tests execution
- ✅ API contract validation

#### Agent 2: Frontend Engineer (After OpenAPI contract available)

```typescript
// Pseudo-code: What Frontend Engineer creates

// 1. Dashboard Page Component (src/app/dashboard/page.tsx)
import { generateMetadata } from 'next';

export const generateMetadata = (): Metadata => ({
  title: 'Dashboard - Real-time Metrics',
  description: 'Private dashboard with real-time metrics',
  robots: { index: false, follow: false }, // Not indexed
});

export default function DashboardPage() {
  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
}

// 2. Dashboard Component (src/features/dashboard/Dashboard.tsx)
import { useMetricsWebSocket } from '../hooks/useMetricsWebSocket';
import { MetricsWidget } from '../components/MetricsWidget';

export const Dashboard = () => {
  const { metrics, isConnected } = useMetricsWebSocket('/api/metrics/subscribe');
  
  return (
    <div className="dashboard" role="main" aria-label="Real-time Dashboard">
      <h1>Dashboard</h1>
      <div className="metrics-grid">
        {metrics.map(metric => (
          <MetricsWidget key={metric.id} metric={metric} />
        ))}
      </div>
      <ConnectionStatus isConnected={isConnected} />
    </div>
  );
};

// 3. WebSocket Hook (src/features/dashboard/hooks/useMetricsWebSocket.ts)
export function useMetricsWebSocket(url: string) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}${url}`);
    
    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onerror = (error) => console.error('WebSocket error:', error);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMetrics(data.metrics);
    };
    
    return () => ws.close();
  }, [url]);
  
  return { metrics, isConnected };
}

// 4. Metrics Widget Component (src/features/dashboard/components/MetricsWidget.tsx)
interface MetricsWidgetProps {
  metric: Metric;
}

export const MetricsWidget: React.FC<MetricsWidgetProps> = ({ metric }) => {
  return (
    <article className="metric-card" role="region" aria-label={metric.name}>
      <h2>{metric.name}</h2>
      <div className="metric-value" aria-live="polite" aria-atomic="true">
        {metric.value}
      </div>
      <div className="metric-change" aria-label={`Change: ${metric.change}%`}>
        {metric.change > 0 ? '📈' : '📉'} {metric.change}%
      </div>
    </article>
  );
};

// 5. Tests (tests/integration/dashboard.test.tsx)
describe('Dashboard', () => {
  it('should render dashboard with metrics', async () => {
    const { getByRole } = render(<Dashboard />);
    expect(getByRole('main')).toBeInTheDocument();
  });
  
  it('should receive real-time updates', async () => {
    const { getByText } = render(<Dashboard />);
    // WebSocket message received
    fireEvent.message(window, {
      data: JSON.stringify({
        metrics: [{ id: 1, name: 'Users', value: 1234, change: 5 }]
      })
    });
    expect(getByText('1234')).toBeInTheDocument();
  });
});
```

**Quality Validation After Frontend Changes**:

web_security_scanner hooks check:
- ✅ No hardcoded API keys
- ✅ Proper WebSocket authentication
- ✅ Input sanitization for metrics display
- ✅ XSS prevention

web_performance_guard hooks check:
- ✅ Bundle size impact (<250KB)
- ✅ Lighthouse score >90
- ✅ Core Web Vitals met

accessibility_validator hooks check:
- ✅ ARIA labels present
- ✅ Semantic HTML used
- ✅ Keyboard navigation works
- ✅ Screen reader compatible

seo_validator hooks check:
- ✅ Meta tags present
- ✅ robots: { index: false } set (private page)
- ✅ No duplicate content

#### Agent 3: Infrastructure Guardian (After backend requirements)

```hcl
# Pseudo-code: What Infrastructure Guardian creates

# 1. Terraform WebSocket Load Balancer (infra/terraform/modules/websocket_lb.tf)
resource "aws_lb" "websocket" {
  name               = "dashboard-websocket-lb"
  internal           = false
  load_balancer_type = "application"
  
  enable_deletion_protection = false
  
  tags = {
    Name = "dashboard-websocket"
  }
}

resource "aws_lb_target_group" "websocket" {
  name        = "dashboard-websocket-tg"
  port        = 3001
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  
  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
    enabled         = true  # Essential for WebSocket
  }
  
  health_check {
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 3
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }
}

# 2. Auto-Scaling Configuration (infra/terraform/modules/websocket_scaling.tf)
resource "aws_autoscaling_group" "websocket" {
  name                = "dashboard-websocket-asg"
  vpc_zone_identifier = var.private_subnet_ids
  target_group_arns   = [aws_lb_target_group.websocket.arn]
  health_check_type   = "ELB"
  
  min_size         = 2
  max_size         = 10
  desired_capacity = 3
  
  tag {
    key                 = "Name"
    value               = "dashboard-websocket"
    propagate_at_launch = true
  }
}

resource "aws_autoscaling_policy" "websocket_scale_up" {
  name                   = "dashboard-websocket-scale-up"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 60
  autoscaling_group_name = aws_autoscaling_group.websocket.name
}

resource "aws_cloudwatch_metric_alarm" "websocket_cpu" {
  alarm_name          = "dashboard-websocket-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "70"
  alarm_actions       = [aws_autoscaling_policy.websocket_scale_up.arn]
}

# 3. Monitoring Dashboard (infra/terraform/modules/monitoring.tf)
resource "aws_cloudwatch_dashboard" "websocket" {
  dashboard_name = "dashboard-websocket"
  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "ActiveConnectionCount"],
            ["AWS/ApplicationELB", "NewConnectionCount"],
            ["AWS/EC2", "CPUUtilization"]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "WebSocket Health"
        }
      }
    ]
  })
}

# 4. Docker Compose for Local Testing (infra/docker/docker-compose.yml)
version: '3.8'

services:
  backend:
    build:
      context: ../../backend
      dockerfile: ../infra/docker/backend.Dockerfile
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: "postgresql://user:pass@postgres:5432/dashboard"
      JWT_SECRET: "dev-secret"
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: dashboard
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

#### Agent 4: Security Reviewer (Parallel to others)

```markdown
# Security Review: Real-Time Dashboard

## Authentication & Authorization
✅ **WebSocket Authentication**
- Token validated on connection
- Tokens refreshed automatically
- Expired tokens disconnect gracefully

✅ **Dashboard Authorization**
- Users can only access own dashboard
- Resource ownership verified on backend

## Input Validation
✅ **API Inputs**
- Dashboard ID validated and sanitized
- Query parameters type-checked
- No SQL injection vectors

## Rate Limiting
✅ **API Rate Limiting**
- 100 requests/minute per user
- WebSocket messages rate limited
- Prevents DoS attacks

## Security Headers
✅ **HTTP Headers**
- CSP: script-src 'self'
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security enabled

## Data Security
✅ **WebSocket Data**
- All WebSocket messages encrypted (WSS)
- Sensitive data not logged
- No PII in metrics

## Dependency Security
✅ **npm audit**
- No critical vulnerabilities
- High: 0, Medium: 0
- Dependencies up-to-date

## Vulnerability Scan
✅ **OWASP Top 10**
- A01:2021 Broken Access Control: ✅ Passed
- A02:2021 Cryptographic Failures: ✅ Passed
- A03:2021 Injection: ✅ Passed
- A07:2021 XSS: ✅ Passed
- A09:2021 SSRF: ✅ Passed

## Recommendations
- Consider rate limiting WebSocket connections per IP
- Add request signing for sensitive metrics

## Status: ✅ APPROVED
```

#### Agent 5: Test Engineer (After backend implementation)

```typescript
// E2E Tests (tests/e2e/dashboard.spec.ts)
import { test, expect } from '@playwright/test';

test('dashboard real-time updates', async ({ page, context }) => {
  // 1. Login
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button:has-text("Login")');
  
  // 2. Navigate to dashboard
  await page.goto('http://localhost:3000/dashboard');
  await expect(page).toHaveTitle('Dashboard');
  
  // 3. Verify initial metrics load
  const metricsCount = await page.locator('.metric-card').count();
  expect(metricsCount).toBeGreaterThan(0);
  
  // 4. Wait for real-time update
  const firstValue = await page.locator('.metric-value').first().textContent();
  await page.waitForTimeout(1000);
  
  // 5. Verify update appeared (within 500ms threshold)
  const updatedValue = await page.locator('[aria-live="polite"]').first().textContent();
  expect(updatedValue).toBeDefined();
  
  // 6. Test keyboard navigation
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => document.activeElement?.getAttribute('role'));
  expect(['button', 'region']).toContain(focused);
});

// Load Testing (tests/e2e/load.spec.ts)
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up
    { duration: '1m30s', target: 100 }, // Stay at 100
    { duration: '30s', target: 0 },    // Ramp down
  ],
};

export default function () {
  const res = http.get('http://localhost:3001/api/metrics?dashboard=123');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}

// Performance Audit (via Lighthouse CI)
// Runs in CI pipeline after each deploy
```

**Test Coverage Report**:
```
Tests Executed:
├── Unit Tests: 45 tests, all passing ✓
├── Integration Tests: 12 tests, all passing ✓
├── E2E Tests: 8 tests, all passing ✓
├── Load Test: 100 concurrent users handled ✓
└── Security Tests: 15 checks, all passing ✓

Coverage: 87% (target: 80%) ✓

Performance:
├── Lighthouse: 94 (target: 90) ✓
├── LCP: 1.2s (target: 2.5s) ✓
├── FID: 45ms (target: 100ms) ✓
└── CLS: 0.08 (target: 0.1) ✓

Security:
├── Dependencies: No vulnerabilities ✓
├── OWASP Top 10: All passed ✓
└── API Security: All checks passed ✓

Accessibility:
├── WCAG 2.1 AA: All passed ✓
└── Keyboard Navigation: Working ✓
```

### Phase 6: Quality Gate Validators

All validators run in parallel:

#### Hook: web_performance_guard.py

```python
# Lighthouse CI Results
# Homepage: 92 (target: 90) ✓
# Dashboard: 94 (target: 90) ✓
# Bundle size: 187KB (target: 250KB) ✓
# Build time: 78s (target: 120s) ✓

# Core Web Vitals
# LCP: 1.5s (target: 2.5s) ✓
# FID: 42ms (target: 100ms) ✓
# CLS: 0.07 (target: 0.1) ✓
```

#### Hook: web_security_scanner.py

```python
# Security Scan Results
# Dependencies: 0 critical, 0 high ✓
# OWASP patterns: All clear ✓
# Secrets: None detected ✓
# Authorization: Verified ✓
# Rate limiting: Configured ✓
```

#### Hook: seo_validator.py

```python
# SEO Validation Results
# Private page correctly marked: robots.index=false ✓
# Meta tags present: title, description ✓
# Open Graph tags: Complete ✓
# Structured data: Valid JSON-LD ✓
# URL structure: SEO-friendly ✓
```

#### Hook: accessibility_validator.py

```python
# Accessibility Results
# WCAG 2.1 AA: All passed ✓
# Keyboard navigation: Complete ✓
# Screen reader: Compatible ✓
# Color contrast: WCAG AA+ ✓
# ARIA labels: Proper usage ✓
```

#### Hook: test_enforcer.py

```python
# Test Coverage Results
# Overall: 87% (target: 80%) ✓
# Critical paths: 100% (target: 100%) ✓
# Branches: 82% (target: 75%) ✓
# New code: 92% (target: 90%) ✓
```

#### Hook: stop_validator.py (Final Gate)

```python
# Final Quality Check
# TypeScript compilation: ✓ PASS
# ESLint: ✓ PASS (0 errors, 0 warnings)
# Prettier: ✓ PASS (formatting correct)
# Tests: ✓ PASS (65/65 passing)
# Coverage: ✓ PASS (87% > 80%)
# Performance: ✓ PASS (Lighthouse 94)
# Security: ✓ PASS (0 critical issues)
# Accessibility: ✓ PASS (WCAG AA)
# SEO: ✓ PASS (meta tags correct)

# Status: ✓✓✓ ALL GATES PASSED ✓✓✓
# Ready for human review and approval
```

### Phase 7: Human Review

Orchestrator presents summary:

```markdown
## Real-Time Dashboard Implementation Summary

### Execution Metrics
- Total execution time: 42 minutes
- Parallelization efficiency: 4.2X
- Number of agents: 5
- Number of files created/modified: 34

### Frontend Changes
✅ **4 components created**
- Dashboard page (with SSR support)
- Real-time metrics widget
- Connection status indicator
- Metrics grid layout

✅ **3 custom hooks**
- useMetricsWebSocket (handles connection lifecycle)
- useMetricsStore (state management)
- useMetricsPolling (fallback to polling)

✅ **SEO Implementation**
- Private page correctly marked (robots.index = false)
- Meta tags added
- Open Graph tags included

✅ **Accessibility**
- All ARIA labels present
- Keyboard navigation complete
- Screen reader compatible
- Color contrast: WCAG AAA

✅ **Performance**
- Bundle size impact: +12KB (within budget)
- Lighthouse score: 94 (target: 90)
- LCP: 1.2s (target: 2.5s)

### Backend Changes
✅ **3 API endpoints**
- GET /api/metrics (fetch metrics)
- POST /api/metrics/subscribe (WebSocket)
- GET /api/metrics/health (health check)

✅ **Business Logic**
- Metrics aggregation service
- Real-time update mechanism
- Query optimization for performance

✅ **Security**
- JWT authentication on all endpoints
- Rate limiting (100 req/min per user)
- WebSocket authentication
- Input validation and sanitization

✅ **Testing**
- 12 integration tests (all passing)
- 100% coverage of core logic
- Load test: 100 concurrent users handled

### Infrastructure Changes
✅ **Auto-Scaling**
- Load balancer configured
- Auto-scaling: 2-10 instances
- Health checks configured

✅ **Monitoring**
- CloudWatch dashboard
- CPU and connection alarms
- Real-time metrics collection

### Quality Gates
✅ All 9 quality gates passed:
1. TypeScript compilation ✓
2. Linting (ESLint) ✓
3. Formatting (Prettier) ✓
4. Unit tests ✓
5. Integration tests ✓
6. Performance budget ✓
7. Security scan ✓
8. Accessibility audit ✓
9. SEO validation ✓

### Risk Assessment
**Low Risk**
- All code follows established patterns
- Full test coverage
- No breaking changes
- Proper error handling
- Security validated

### Recommendations
1. Review WebSocket rate limiting in production
2. Monitor WebSocket connection pool size
3. Consider implementing metrics caching

### Next Steps for Approval
1. ✅ Review generated code in GitHub PR
2. ✅ Run locally: `npm run dashboard:dev`
3. ✅ Test WebSocket updates manually
4. ✅ Approve PR or request changes
5. ✅ Merge → Automatic deployment

**Code is ready for review. Awaiting human approval.**
```

### Phase 8: Human Reviews Generated Code

Developer reviews PR in GitHub:

```markdown
## PR: Implement Real-Time Dashboard

### Files Changed: 34

#### frontend/src/features/dashboard/ (9 files)
- ✅ Dashboard.tsx (main component, 45 lines)
- ✅ hooks/useMetricsWebSocket.ts (WebSocket hook, 38 lines)
- ✅ components/MetricsWidget.tsx (widget, 28 lines)
- ✅ store/dashboardSlice.ts (state, 42 lines)
- ✅ types/dashboard.types.ts (types, 18 lines)
- ✅ tests/dashboard.test.tsx (unit tests, 65 lines)
- ✅ tests/dashboard.e2e.spec.ts (E2E tests, 48 lines)
- ✅ utils/metricsFormatter.ts (utilities, 22 lines)
- ✅ README.md (documentation, 15 lines)

**Code Quality**: ✅ Excellent
- Clear naming conventions
- Proper TypeScript typing
- Accessibility attributes present
- Comprehensive error handling

**Performance**: ✅ Optimized
- Lazy loading implemented
- Memoization where appropriate
- Efficient WebSocket handling

#### backend/api/metrics/ (8 files)
- ✅ metrics.controller.ts (47 lines)
- ✅ metrics.service.ts (89 lines)
- ✅ metrics.gateway.ts (WebSocket server, 76 lines)
- ✅ metrics.dto.ts (DTOs, 24 lines)
- ✅ types/metrics.types.ts (types, 31 lines)
- ✅ tests/metrics.integration.test.ts (78 lines)
- ✅ tests/metrics.websocket.test.ts (95 lines)
- ✅ README.md (documentation, 12 lines)

**Code Quality**: ✅ Excellent
- Proper error handling
- Input validation
- Rate limiting implemented
- Security headers set

**Database**: ✅ Optimized
- Query indexed for performance
- Connection pooling configured
- Migration included

#### infra/terraform/ (6 files)
- ✅ websocket_lb.tf (load balancer, 42 lines)
- ✅ websocket_scaling.tf (auto-scaling, 58 lines)
- ✅ websocket_monitoring.tf (monitoring, 35 lines)
- ✅ variables.tf (variables, 28 lines)
- ✅ outputs.tf (outputs, 15 lines)
- ✅ deploy.sh (deployment script, 22 lines)

**Infrastructure**: ✅ Production-Ready
- High availability configured
- Proper monitoring
- Cost-optimized
- Secure by default

### Reviewer Comments

**@human-reviewer**: "Code looks great! Nice job on the WebSocket implementation.
A few observations:

1. ✅ Real-time updates < 500ms as required
2. ✅ Performance budgets met
3. ✅ Security looks solid
4. ⚠️ Consider adding retry logic to WebSocket reconnection
5. ⚠️ Monitor connection pool in first week

Approved! Ship it!"

### CI Pipeline Results
- ✅ All checks passing
- ✅ Build: 78s (well within budget)
- ✅ Tests: 85/85 passing
- ✅ Coverage: 87%
- ✅ Lighthouse: 94
- ✅ Security: Clean
```

### Phase 9: Approval and Merge

Developer approves:

```bash
# Merge the PR
git merge feature/dashboard

# Triggers CI/CD pipeline automatically
```

### Phase 10: Deployment Pipeline

#### CI/CD in GitHub Actions

```yaml
# .github/workflows/deploy-production.yml

name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test -- --coverage
      
      - name: Run security scan
        run: npm run security:scan
  
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      
      - name: Build frontend
        run: npm run build:frontend
      
      - name: Build backend
        run: npm run build:backend
      
      - name: Build Docker images
        run: |
          docker build -f infra/docker/frontend.Dockerfile -t frontend:latest .
          docker build -f infra/docker/backend.Dockerfile -t backend:latest .
      
      - name: Push to registry
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY
          docker tag frontend:latest $ECR_REGISTRY/frontend:${{ github.sha }}
          docker push $ECR_REGISTRY/frontend:${{ github.sha }}
  
  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: |
          terraform -chdir=infra/terraform/staging apply -auto-approve \
            -var="image_tag=${{ github.sha }}"
      
      - name: Run smoke tests
        run: npm run test:smoke -- --env=staging
  
  deploy-production:
    needs: deploy-staging
    environment: production
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production (blue-green)
        run: |
          ./infra/deploy/blue-green-deploy.sh ${{ github.sha }}
      
      - name: Health checks
        run: |
          for i in {1..10}; do
            if curl -f https://api.example.com/health; then
              echo "Health check passed"
              exit 0
            fi
            sleep 5
          done
          echo "Health checks failed"
          exit 1
      
      - name: Notify team
        run: |
          curl -X POST -H 'Content-type: application/json' \
            --data '{"text":"Real-time dashboard deployed to production"}' \
            $SLACK_WEBHOOK_URL
```

**Deployment Output**:
```
✅ Tests passed: 85/85
✅ Build successful: frontend + backend
✅ Docker images pushed to ECR
✅ Staging deployment: blue-green initiated
✅ Smoke tests passed on staging
✅ Production deployment: blue-green promotion
✅ Health checks: All passing
✅ Monitoring: Alerts configured
✅ Team notified via Slack

Real-time Dashboard is now live in production! 🚀
```

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                       HUMAN DEVELOPER                               │
│  Edits product/ → Submits to Claude Code → Reviews PR → Approves   │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  user_prompt_submit.py │ Validates request
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  prd_validator.py      │ Ensures PRD complete
                    └────────────────────────┘
                                 │
                                 ▼
            ┌─────────────────────────────────────────┐
            │   ORCHESTRATOR (Claude Code)            │
            │   • Analyzes PRD                        │
            │   • Creates execution plan              │
            │   • Delegates to agents                 │
            └─────────────┬───────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┬──────────────┐
        │                 │                 │              │
        ▼                 ▼                 ▼              ▼
    ┌────────────┐  ┌──────────┐  ┌──────────────┐  ┌──────────────┐
    │ Frontend   │  │ Backend  │  │ Infra        │  │ Security     │
    │ Engineer   │  │ Engineer │  │ Guardian     │  │ Reviewer     │
    └────────────┘  └──────────┘  └──────────────┘  └──────────────┘
        │                │               │                  │
        └────────────────┼───────────────┼──────────────────┘
                         │
                    ┌────▼────────────┐
                    │ Hooks fire in   │
                    │ parallel:       │
                    │ • pre_tool_use  │
                    │ • post_tool_use │
                    └────────────────┘
                         │
        ┌────────────────┼───────────────────┐
        │                │                   │
        ▼                ▼                   ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ Performance  │  │ Security     │  │ SEO & A11Y   │
    │ Guard        │  │ Scanner      │  │ Validators   │
    │ • Lighthouse │  │ • CVEs       │  │ • WCAG       │
    │ • Bundle     │  │ • Patterns   │  │ • Meta tags  │
    │ • Core Vitals│  │ • Secrets    │  │ • Keyboard   │
    └──────────────┘  └──────────────┘  └──────────────┘
                         │
                         ▼
                    ┌────────────┐
                    │ Test       │
                    │ Enforcer   │ Validates coverage
                    └─────┬──────┘
                          │
                          ▼
                    ┌────────────────┐
                    │ Stop Validator │ Final gate
                    └─────┬──────────┘
                          │
                          ▼
            ┌─────────────────────────────┐
            │ Orchestrator Synthesis      │
            │ • Summary report            │
            │ • Ready for review          │
            │ • Quality metrics           │
            └─────────────────────────────┘
                          │
                          ▼
            ┌──────────────────────────────┐
            │ Human Reviews PR & Approves  │
            └─────────────┬────────────────┘
                          │
                    Yes ──┴── No (request changes)
                    │
                    ▼
            ┌─────────────────────────┐
            │ Merge to main branch    │
            └──────────┬──────────────┘
                       │
                       ▼
            ┌──────────────────────────┐
            │ GitHub Actions CI/CD     │
            │ • Test & Build           │
            │ • Deploy to staging      │
            │ • Smoke tests            │
            │ • Blue-green to prod     │
            │ • Health checks          │
            └──────────┬───────────────┘
                       │
                       ▼
            ┌──────────────────────────┐
            │ PRODUCTION LIVE          │
            │ Real-time dashboard      │
            │ served to users          │
            └──────────────────────────┘
```

## Summary

This workflow demonstrates:

1. **Clear Separation of Concerns**: Humans define WHAT (PRD), AI determines HOW (implementation)
2. **Parallel Execution**: 5 agents work simultaneously on different layers
3. **Automated Quality**: Multiple hooks enforce standards automatically
4. **Quick Feedback**: All validation happens in minutes, not days
5. **Full Traceability**: Every change audited and version-controlled
6. **Continuous Monitoring**: Observability built-in from the start

**Total time from PRD update to production: ~1-2 hours**
**Total developer hands-on time: ~30 minutes**

This is the power of AI-orchestrated development for web applications.

---

Next: [QUICKSTART.md](./QUICKSTART.md) for practical setup instructions.
