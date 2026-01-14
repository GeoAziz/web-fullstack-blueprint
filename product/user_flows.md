# User Flows

User flows map how users interact with the application. Each flow describes the steps users take to accomplish a goal.

## Flow 1: Sign-Up and Email Verification

**Flow Name**: New User Registration

**User Persona**: Potential customer visiting for the first time

**Entry Point**: Click "Sign Up" on homepage or marketing page

**User Goal**: Create a new account and gain access to the application

### Prerequisites
- Not logged in
- Email doesn't exist in system
- JavaScript enabled

### Step-by-Step Flow

```
1. User clicks "Sign Up" button
   → System displays sign-up form
   → UI State: Sign-up form visible

2. User fills in: Email, Password (×2), Full Name
   → Form validates in real-time
   → UI State: Fields filled, validation passed

3. User clicks "Create Account"
   → System sends POST request to /api/auth/signup
   → Backend: Validates input, hashes password, creates user record
   → System sends verification email
   → UI State: Loading indicator shows
   → UI State: Success message: "Check your email to verify your account"

4. User opens email and clicks verification link
   → Link contains token: verify?token=xyz123
   → System validates token (24h expiry)
   → Backend: Marks user as verified, invalidates token
   → UI State: "Email verified! You can now log in."

5. User clicks "Log In" or enters credentials
   → Redirects to dashboard
   → UI State: Authenticated user sees dashboard
```

### Success Outcome
- ✅ User account created
- ✅ Email verified
- ✅ User logged in
- ✅ Redirected to dashboard
- ✅ User sees "Welcome, [Name]!" message

### Failure Scenarios

**Scenario 1: Email Already Exists**
- User enters existing email
- System returns error: "Email already registered"
- UI State: Error message shown in red
- Recovery: User clicks "Forgot Password" or uses existing account

**Scenario 2: Weak Password**
- User enters password < 12 characters
- System validates and shows error in real-time
- UI State: Red border on password field
- Recovery: User enters stronger password

**Scenario 3: Email Verification Timeout**
- User doesn't verify within 24 hours
- Verification link expires
- User can request new verification email
- Recovery: Click "Resend verification email"

**Scenario 4: Network Error During Sign-Up**
- Network disconnects mid-submission
- System shows "Connection failed"
- UI State: Retry button appears
- Recovery: User clicks retry

### Recovery Paths
- **Invalid email format**: Show inline validation error
- **Password mismatch**: Highlight both password fields
- **Network timeout**: Show retry button, keep form data
- **Email verification expired**: Allow requesting new verification email
- **Server error**: Show user-friendly error message

### Analytics Events

| Event | When | Data Captured |
|-------|------|----------------|
| sign_up_started | User opens form | source_page |
| field_filled | User fills field | field_name |
| sign_up_submitted | User clicks submit | email (hashed) |
| sign_up_success | Account created | email (hashed), signup_time |
| email_verified | User verifies email | email (hashed), verify_time |
| sign_up_failed | Sign-up error | error_type |

### SEO Considerations
- Sign-up page: `noindex` (private action)
- Verification link includes `utm_source=email`
- Welcome email includes tracking pixel

### Accessibility Requirements
- Form labels: `<label>` associated with inputs
- Error messages: `aria-live="assertive"` for screen readers
- Password strength: `aria-describedby="password-strength"` aria-live region
- Tab order: Logical (Name → Email → Password → Confirm → Button)
- Keyboard submit: Enter key submits form

---

## Flow 2: User Login

**Flow Name**: Existing User Authentication

**User Persona**: Registered user returning to application

**Entry Point**: Click "Log In" on homepage or redirected from protected page

### Prerequisites
- User account exists and is verified
- User is not already logged in

### Step-by-Step Flow

```
1. User navigates to login page
   → System displays login form
   → UI: Email and password fields

2. User enters email and password
   → System validates input (not empty)
   → UI: Real-time validation feedback

3. User clicks "Log In"
   → System sends POST to /api/auth/login
   → Backend: Validates credentials, generates JWT
   → System stores JWT in secure cookie
   → System redirects to dashboard

4. User sees dashboard
   → Authentication confirmed
   → User profile data loaded
```

### Success Outcome
- ✅ User authenticated
- ✅ JWT token stored securely
- ✅ Session created
- ✅ Redirected to dashboard
- ✅ User sees personalized content

### Failure Scenarios

**Scenario 1: Invalid Email/Password**
- User enters wrong credentials
- System returns error: "Invalid email or password"
- UI State: Error message, form remains
- Recovery: User tries again or uses "Forgot Password"

**Scenario 2: Account Locked (5 failed attempts)**
- User makes 5 wrong attempts
- System locks account for 15 minutes
- UI State: "Account temporarily locked. Try again in 15 minutes."
- Recovery: User uses "Forgot Password" or waits

### Recovery Paths
- **Forgot password**: Link to reset flow
- **Account locked**: Try again later or reset password
- **Network error**: Retry button

---

## Flow 3: Real-Time Dashboard Usage

**Flow Name**: Viewing and Interacting with Analytics

**User Persona**: Product manager analyzing metrics

**Entry Point**: User clicks on Dashboard in main navigation

### Prerequisites
- User is logged in
- User has permission to view dashboard
- Dashboard data exists

### Step-by-Step Flow

```
1. User navigates to /dashboard
   → System checks authentication
   → System loads initial metrics (last 30 days by default)
   → UI: Dashboard appears with loading skeleton screens

2. WebSocket connects for real-time updates
   → System establishes WebSocket connection to /api/metrics/subscribe
   → System sends auth token with connection
   → Backend: Validates token and authorizes connection

3. Dashboard displays metrics
   → UI: Metric cards appear with current values
   → UI: Charts populate with historical data
   → System ready for real-time updates

4. Metrics update in real-time
   → Every 10 seconds: Backend sends latest metrics via WebSocket
   → UI: [aria-live="polite"] regions update without page refresh
   → User sees "Last updated: 2 seconds ago"

5. User changes date range
   → User clicks "Last 7 Days"
   → System updates filter
   → UI: Charts re-animate with new data
   → Real-time updates continue with new data range

6. User exports data
   → User clicks "Export CSV"
   → System generates CSV file
   → Browser downloads file automatically
```

### Success Outcome
- ✅ Dashboard loads quickly (<2.5s)
- ✅ Real-time updates appear (<500ms latency)
- ✅ Charts display correctly
- ✅ Export generates valid CSV file
- ✅ Metrics match source data

---

## Flow 4: Blog Post Discovery and Reading

**Flow Name**: Finding and Reading Content

**User Persona**: Potential customer researching product

**Entry Point**: Click "Blog" in header or Google search result

### Prerequisites
- Blog post exists and is published
- User is not logged in (public content)

### Step-by-Step Flow

```
1. User searches or navigates to blog
   → System displays blog post list
   → Posts sorted by newest first
   → UI: Post preview cards with image, title, excerpt

2. User clicks on a post
   → System loads post detail page
   → UI: Full post content renders
   → Content loads from CDN for performance

3. User reads post
   → Post content displays
   → Related posts appear at bottom
   → Comment section available below

4. User shares post
   → User clicks share button
   → System displays share options (LinkedIn, Twitter, etc.)
   → User clicks platform
   → Social share dialog opens
```

### Success Outcome
- ✅ Post loads quickly (<2s)
- ✅ Content renders properly
- ✅ Related posts appear
- ✅ Share buttons work
- ✅ Comments visible

### SEO Considerations
- Post title in `<h1>` tag
- Meta tags with post title, excerpt, featured image
- Structured data: Article schema with author, date, image
- Internal links to related posts
- Canonical URL set

---

## Flow 5: Error Recovery

**Flow Name**: Handling and Recovering from Errors

**Failure Point**: Network timeout during metric update

### Step-by-Step Recovery

```
1. WebSocket connection drops
   → System detects connection loss
   → UI: "Connection lost. Reconnecting..." message appears
   → [aria-live="assertive"] announces disconnection

2. System attempts reconnection
   → Exponential backoff: 1s, 2s, 4s, 8s, 16s (max 1 minute)
   → Backend checks user still authenticated
   → If auth expired: redirect to login

3. Reconnection successful
   → UI: "Reconnected" message appears
   → System requests latest metrics
   → Charts update with latest data

4. User can manually refresh
   → User clicks "Refresh" button
   → System fetches latest data from /api/metrics
   → Real-time updates resume
```

---

## Summary of Key User Flows

| Flow | Entry Point | Success Metric | Time Budget |
|------|-------------|----------------|----|
| Sign-Up | Homepage | Email verified | 3 minutes |
| Login | Login page | Dashboard loaded | 30 seconds |
| Dashboard | Main nav | Metrics displayed | 2.5 seconds |
| Blog Reading | Blog link | Post renders | 2 seconds |
| Error Recovery | Auto-triggered | Connection restored | 5 seconds |

---

**Status**: DRAFT  
**Version**: 1.0
