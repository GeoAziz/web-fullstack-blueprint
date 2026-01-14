# Non-Goals: What We Won't Build (and Why)

## Feature Exclusions

### Native Mobile Apps

**What**: iOS and Android native applications

**Why We're Not Building It**:
- Responsive web app works on all devices
- Mobile web adoption >80% for target users
- Native development triples scope and complexity
- Cross-platform framework (React Native, Flutter) adds overhead
- Support burden for App Store/Play Store deployments

**When We Might Reconsider**: Post-MVP when we have clear evidence that native app improves retention

**Alternative**: Progressive Web App (PWA) with app-like experience on mobile

---

### Real-Time Collaborative Editing

**What**: Google Docs-style simultaneous document editing

**Why We're Not Building It**:
- Requires Operational Transformation (OT) or CRDTs (complex)
- Operational overhead of maintaining consistency
- Limited user demand for MVP
- Async workflows sufficient for product use cases

**When We Might Reconsider**: Post-MVP if collaboration requests spike

**Alternative**: Comment/annotation system with async updates

---

### Advanced Analytics Dashboard

**What**: Custom analytics engine with real-time data warehouse

**Why We're Not Building It**:
- Google Analytics covers 90% of use cases
- Building analytics infrastructure is non-trivial
- Better to use established tools (Mixpanel, Amplitude)
- Scope creep: analytics becomes its own product

**When We Might Reconsider**: Enterprise customers demand custom metrics

**Alternative**: Integrate with third-party analytics platforms

---

### Multi-Language Support (i18n)

**What**: Support for Spanish, French, German, etc. in v1

**Why We're Not Building It**:
- English-only for MVP
- i18n adds 10-15% complexity to every component
- Content translation ongoing cost
- Usage data shows English users 90% for target market

**When We Might Reconsider**: After validating product-market fit in English markets

**Alternative**: Design architecture to support i18n later

---

### Offline Support

**What**: Using application without internet connection

**Why We're Not Building It**:
- Web app assumes online connectivity
- Offline-first architecture significantly more complex
- Service workers + local storage = complexity
- Use case limited for dashboard application

**When We Might Reconsider**: If mobile use cases dominate

**Alternative**: Progressive Web App with basic offline fallback

---

### Admin Panel / CMS

**What**: Self-service admin UI for managing content

**Why We're Not Building It**:
- Scope explosion (every business logic feature needs admin control)
- Use case for MVP: admins use DB directly or basic scripts
- ROI unclear for MVP phase
- Better as separate application later

**When We Might Reconsider**: After MVP launch with operational needs clear

**Alternative**: Database tools (pgAdmin) or scripts for admin tasks

---

### Advanced Permission System (RBAC)

**What**: Granular role-based access control (view/edit/delete on every resource)

**Why We're Not Building It**:
- MVP: Binary (admin/user) sufficient
- RBAC adds ~20% complexity to every endpoint
- Database schema becomes more complex
- Use case: most users have same permissions

**When We Might Reconsider**: Enterprise customers demand granular controls

**Alternative**: Start with simple admin/user roles, extend later

---

### White-Label / Multi-Tenant Architecture

**What**: Support multiple customers with separate data/branding

**Why We're Not Building It**:
- Single-tenant SaaS is simpler and sufficient for MVP
- Data isolation is complex (schema/database/instance level choices)
- Performance impact of multi-tenant queries
- Most SaaS platforms don't start multi-tenant

**When We Might Reconsider**: Enterprise customers demand it or clear market need

**Alternative**: Deploy separate instances per customer initially

---

### Custom Payment Processing

**What**: Build our own payment system

**Why We're Not Building It**:
- Stripe/Square handle 99% of use cases
- Payment security is complex (PCI compliance)
- Scope: implement fraud detection, reconciliation, etc.
- Use established services

**When We Might Reconsider**: Enterprise contracts with custom billing needs

**Alternative**: Stripe integration for standard payments

---

### Video Hosting / Streaming

**What**: Built-in video hosting and streaming

**Why We're Not Building It**:
- Video encoding/transcoding is complex infrastructure
- Vimeo, YouTube, Wistia handle this better
- Bandwidth costs significant
- Content delivery better handled by CDNs

**When We Might Reconsider**: If video is core product feature, not supplementary

**Alternative**: Embed YouTube/Vimeo videos

---

### Machine Learning / AI Features

**What**: Custom ML models for predictions, recommendations, etc.

**Why We're Not Building It**:
- MVP doesn't require ML
- ML infrastructure adds complexity
- Data requirements (labeled training data) not met yet
- Better to use pre-built ML APIs (AWS Rekognition, etc.)

**When We Might Reconsider**: Product usage data shows clear ML use case

**Alternative**: Use third-party ML APIs when needed

---

### Search Engine Optimization (SEO) Optimization

**What**: Building a comprehensive SEO optimization suite as product feature

**Why We're Not Building It**:
- Application itself must be SEO-optimized (in constraints)
- Content SEO (keyword research, optimization) is manual process
- Competitors (SEMrush, Ahrefs) do this better
- Scope: dedicated product

**When We Might Reconsider**: Clear market demand for SEO tooling

**Alternative**: Guide users on SEO best practices

---

### Migration from Other Platforms

**What**: Automated migration tools for users from competitors

**Why We're Not Building It**:
- Migrations are complex and error-prone
- Each source system has different data model
- High support burden
- MVP doesn't need migrations (new users)

**When We Might Reconsider**: User acquisition bottleneck identified

**Alternative**: Manual migration guides and support

---

## Technical Exclusions

### Server-Side Rendering for Dashboard

**What**: SSR for the real-time dashboard (vs. client-side rendering)

**Why We're Not Doing It**:
- Dashboard is private, not SEO-critical
- SSR adds complexity for dynamic real-time content
- Client-side rendering with WebSocket better for real-time
- Performance benefit unclear for dashboard

**Alternative**: SSR for marketing/blog, CSR for dashboard

---

### GraphQL API

**What**: Use GraphQL instead of REST

**Why We're Not Using It**:
- REST simpler for MVP
- GraphQL adds complexity (schema, query parsing, N+1 prevention)
- Tooling maturity lower than REST
- Performance gains not worth complexity

**When We Might Reconsider**: Query complexity becomes bottleneck

**Alternative**: REST with versioning (v1, v2)

---

### Microservices Architecture

**What**: Deploy services as separate microservices

**Why We're Not Doing It**:
- Monolith simpler for MVP
- Microservices add operational complexity (deployment, monitoring)
- Network latency between services
- Not needed at current scale

**When We Might Reconsider**: Performance becomes bottleneck or teams need independence

**Alternative**: Monolithic architecture, refactor later if needed

---

## Summary

| Feature | MVP | Post-MVP | Never |
|---------|-----|----------|-------|
| Native Mobile Apps | ❌ | ✅ Consider | - |
| Collaborative Editing | ❌ | ✅ Maybe | - |
| Advanced Analytics | ❌ | ✅ Maybe | - |
| Multi-Language | ❌ | ✅ Yes | - |
| Offline Support | ❌ | ✅ Maybe | - |
| ML Features | ❌ | ✅ Maybe | - |
| Microservices | ❌ | ✅ Yes | - |
| Custom Payments | ❌ | ❌ | ✅ Use Stripe |
| Video Hosting | ❌ | ❌ | ✅ Use YouTube |
| Custom Search | ❌ | ❌ | ✅ Use Elasticsearch |

---

**Status**: APPROVED  
**Version**: 1.0  
**Last Updated**: [Date]
