# Performance Budget

## Page-Level Budgets

### Homepage

| Metric | Target | Status |
|--------|--------|--------|
| Time to First Byte (TTFB) | <200ms | ⏳ |
| First Contentful Paint (FCP) | <1.5s | ⏳ |
| Largest Contentful Paint (LCP) | <2.5s | ⏳ |
| Time to Interactive (TTI) | <3.5s | ⏳ |
| Total Blocking Time (TBT) | <300ms | ⏳ |
| Cumulative Layout Shift (CLS) | <0.1 | ⏳ |
| JavaScript (gzipped) | <180KB | ⏳ |
| CSS (gzipped) | <40KB | ⏳ |
| Images | <400KB | ⏳ |
| Fonts | <80KB | ⏳ |
| Lighthouse Performance | >90 | ⏳ |
| Lighthouse Accessibility | 100 | ⏳ |
| Lighthouse Best Practices | >90 | ⏳ |
| Lighthouse SEO | 100 | ⏳ |

### Dashboard Page

| Metric | Target | Status |
|--------|--------|--------|
| FCP | <2s | ⏳ |
| LCP | <2.5s | ⏳ |
| TTI | <4s | ⏳ |
| Real-time update latency | <500ms | ⏳ |
| JavaScript | <200KB | ⏳ |
| CSS | <50KB | ⏳ |
| Lighthouse Performance | >88 | ⏳ |

### Blog Post Pages

| Metric | Target | Status |
|--------|--------|--------|
| FCP | <1.5s | ⏳ |
| LCP | <2.5s | ⏳ |
| TTI | <3s | ⏳ |
| JavaScript | <150KB | ⏳ |
| Total images | <800KB | ⏳ |
| Lighthouse Performance | >90 | ⏳ |

## Network Budgets

### 3G Connection (1.6 Mbps down, 750 Kbps up)
- Homepage load: <5 seconds
- Dashboard load: <6 seconds
- TTI: <8 seconds

### 4G Connection (4 Mbps down)
- Homepage load: <3 seconds
- Dashboard load: <3.5 seconds
- TTI: <4 seconds

## Resource Budgets

### JavaScript
- Critical path: <100KB (gzipped)
- Total bundle: <300KB (gzipped)
- Per route chunk: <50KB (gzipped)
- Compression ratio: ≥65% (min 3:1)

### CSS
- Critical CSS: <20KB
- Total CSS: <75KB (gzipped)
- Inline critical CSS: <14KB

### Images
- Above-the-fold: <200KB total
- Per page: <1MB total
- Largest single image: <200KB
- Format: Modern formats (WebP, AVIF) with fallbacks
- Lazy loading: All below-the-fold images

### Fonts
- Total web fonts: <100KB (gzipped)
- Maximum 2 font families
- Variable fonts preferred
- Font loading strategy: `font-display: swap`

## API Performance

### Response Times (95th Percentile)
- GET /api/metrics: <200ms
- POST /api/contact: <400ms
- Any GET endpoint: <500ms
- Any POST endpoint: <800ms
- WebSocket message round-trip: <150ms

### Error Rates
- API error rate: <0.1%
- 5xx errors: <0.01%
- Timeout rate: <0.05%

### Throughput
- Concurrent connections: 10,000+
- Requests per second: 5,000+
- Database connections: <100

## Build Performance

### Development Build
- Initial build: <30 seconds
- Incremental build (single file change): <5 seconds
- Hot module reload: <1 second

### Production Build
- Production build time: <2 minutes
- Total build artifacts: <500MB
- Minification ratio: >60%
- Tree-shaking effectiveness: >90%

## Monitoring and Enforcement

### Automated Checks

- **Lighthouse CI**: Runs on every PR
  - Homepage: Performance >90, Accessibility 100, Best Practices >90, SEO 100
  - Blocks merge if below threshold
  - Reports trend vs. baseline

- **Bundle Size Analysis**: Every build
  - Main bundle: <250KB
  - Vendor bundle: <150KB
  - Critical alerts if >10% increase
  - Detailed breakdown report

- **Performance Regression Alerts**: Every deploy
  - Alert if LCP increases >200ms
  - Alert if FCP increases >100ms
  - Alert if CLS increases >0.05

- **Real User Monitoring (RUM)**: Continuous
  - Google Analytics
  - Real user performance metrics
  - Dashboard showing trends

## Budget Violation Protocol

### Warning Level (within 10% of budget)
- PR comment: "Performance approaching budget"
- Recommendation for optimization
- Merge allowed with approval

### Critical Level (exceed budget)
- PR blocked: Cannot merge
- Detailed report: What exceeded and why
- Required fix: Optimization plan before re-submission

### Resolution Process

1. **Identify Issue**: Use bundle analyzer and Lighthouse reports
2. **Analyze Root Cause**: Is it code, dependencies, or images?
3. **Implement Fix**: Code split, lazy load, optimize images, etc.
4. **Verify**: Re-run performance tests locally
5. **Resubmit**: Push changes, wait for green status

## Optimization Techniques

### Code Splitting
- Route-based: Separate chunk per route
- Component-based: Lazy load heavy components
- Vendor split: Separate vendor dependencies

### Image Optimization
- Responsive images: `srcset` for different sizes
- Modern formats: WebP with JPEG fallback
- Compression: TinyPNG or similar
- SVG: For icons and logos

### Font Optimization
- Subsetting: Only include used characters
- Variable fonts: One font file for all weights
- Preload: Critical fonts preloaded
- Async loading: Non-critical fonts async

### Caching Strategy
- Static assets: 1-year cache (content-hashed)
- Dynamic content: 1-hour cache
- API responses: Client-side cache with invalidation
- Service worker: Cache-first for assets, network-first for API

## Status

**Version**: 1.0  
**Last Updated**: [Date]
