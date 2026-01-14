# Technical Constraints

## Browser Support

### Desktop
- **Chrome**: 90+ (Latest 2 versions)
- **Firefox**: 88+ (Latest 2 versions)
- **Safari**: 14+ (Latest 2 versions)
- **Edge**: 90+ (Latest 2 versions)

### Mobile
- **iOS Safari**: 14+
- **Chrome Mobile**: Latest 2 versions
- **Firefox Mobile**: Latest 2 versions

### Unsupported
- ❌ Internet Explorer 11 (EOL, <1% usage)
- ❌ Opera Mini (limited testing)
- ❌ Older Android browsers

## Performance Constraints

### Page Load Budgets

**Homepage**
- TTFB: <200ms
- FCP: <1.5s
- LCP: <2.5s
- TTI: <3.5s
- CLS: <0.1
- Bundle size: <200KB (gzipped)

**Dashboard**
- FCP: <2s
- LCP: <2.5s
- TTI: <4s
- Real-time updates: <500ms

**Blog Pages**
- FCP: <1.5s
- LCP: <2.5s
- Image-heavy pages: <3MB total

### Build Performance
- Development build: <30 seconds
- Production build: <2 minutes
- Hot module reload: <1 second

## Security Constraints

### Authentication
- Method: JWT + secure cookies
- Token lifetime: 1 hour
- Refresh token lifetime: 30 days
- Password min length: 12 characters
- Password requirements: uppercase, lowercase, number, special char

### Rate Limiting
- Login attempts: 5 per IP per 15 minutes
- API calls: 100 per minute per user
- Sign-up: 10 per IP per hour

### HTTPS
- ✅ All traffic encrypted
- ✅ HSTS enabled (1 year)
- ✅ No mixed content
- ✅ Secure cookies (HttpOnly, Secure, SameSite=Strict)

### Security Headers
- CSP: script-src 'self' cdn.example.com
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

## Compliance Constraints

### GDPR (if EU users)
- Data processing agreement
- Right to access implementation
- Right to deletion implementation
- Data retention policy (max 2 years)
- Consent management for cookies

### CCPA (if CA users)
- Privacy policy disclosure
- Opt-out mechanism
- Data sale opt-out
- Do Not Track support

### Accessibility
- WCAG 2.1 Level AA compliance (minimum)
- Keyboard navigation on all pages
- Screen reader compatibility
- Color contrast WCAG AA (4.5:1 minimum)

## Infrastructure Constraints

### Cloud Provider
- Primary: AWS (us-east-1)
- Failover region: us-west-2
- CDN: CloudFront

### Database
- PostgreSQL 13+
- Max connections: 100
- Backup frequency: Daily, retention 30 days
- RTO: <1 hour, RPO: <15 minutes

### Scalability
- Concurrent users: 10,000+
- Requests per second: 5,000+
- Database replicas: 2 (read-only)
- Auto-scaling: 2-20 instances

## Third-Party Service Constraints

### Email
- SendGrid for transactional emails
- Max 100 emails per second
- Bounce rate threshold: <2%

### Monitoring
- Datadog for APM
- Sentry for error tracking
- Retention: 30 days of logs

### Content Delivery
- CloudFront for static assets
- Max file size: 2GB
- TTL: 1 year for versioned files, 1 hour for dynamic

## Status

**Version**: 1.0  
**Last Updated**: [Date]
