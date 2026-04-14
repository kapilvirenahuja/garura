# User Management

Core identity, authentication, and user lifecycle management.

**Search patterns:** user authentication, login, password, MFA, user profile, registration, SSO, onboarding, identity, session, access control, account

## Features

### UM-F001: Login / Authentication

Core user authentication — email/password, session management, identity verification.

**When It Matters:**
Login is table stakes for any application with user accounts. The depth depends on security requirements and user sophistication. Consumer apps need frictionless auth (social login, magic links) to minimize drop-off. Enterprise apps need SSO/SAML integration because their users already have corporate identity providers. Developer-facing tools can get away with API keys or token-based auth. The question is never IF but HOW — and the answer comes from who the user is and what they're protecting.

**Depth Spectrum:**
- **Basic:** Email/password with session cookies. Password hashing (bcrypt/argon2). Basic rate limiting on login attempts. Sufficient for internal tools and prototypes.
- **Standard:** Password strength validation, account lockout after failed attempts, remember-me tokens, secure session management with expiry. Production-ready for most applications.
- **Advanced:** Social login (OAuth2 via Google, GitHub, Apple), magic links, passwordless options. Session management across multiple devices. Token refresh flows. Suitable for consumer and B2B SaaS.
- **Enterprise:** SSO/SAML integration, directory sync (LDAP/Active Directory), conditional access policies, device trust evaluation, just-in-time provisioning. Required for enterprise sales.

**Signals:**
Any application with user accounts. PP-1 (User Sophistication) determines depth: level 1-2 (technical) accepts token-based auth; level 4-5 (consumer/assisted) expects social login and progressive onboarding. PP-3 (Persona Complexity) >= 4 (role hierarchy) suggests enterprise-grade auth with SSO. NFR-2 (Security) >= 3 pushes toward advanced/enterprise depth. QP-7 (Security Testing) >= 3 indicates SAST and dependency scanning should cover authentication flows, credential handling, and session management. QP-1 (Testing Depth) >= 3 suggests integration tests for login flows across auth methods (password, social, SSO) and session lifecycle. BRD keywords: "user accounts", "sign in", "authentication", "identity".

**Tradeoffs:**
Including at higher depth: better security posture, enterprise readiness, improved user experience, reduced account compromise risk. Cost: integration complexity (OAuth providers, SAML IdPs, directory services), ongoing maintenance of multiple auth flows, vendor dependencies (Auth0, Cognito, Clerk), increased onboarding complexity for the development team.

### Inclusion
- Default: **mandatory**
- Mandatory when: `project_profile.audience in ['B2C', 'B2B', 'B2B2C']`
- Conditional when: `project_profile.audience == 'internal' and project_profile.security_level in ['medium', 'high', 'critical']`
- Exclude when: `project_profile.audience == 'internal' and project_profile.security_level == 'low' and project_profile.delivery_ambition <= 2`

### Success Criteria
- Login success rate > 95% on first attempt
- p95 login latency < 500ms under 10K concurrent sessions
- Failed-login brute force blocked within 5 attempts per account per 15 minutes

### Failure Scenarios
- Scenario: Login endpoint accepts unlimited attempts from a single IP
  - Impact: Credential-stuffing attackers compromise accounts and the incident becomes a breach disclosure event
  - Mitigation: Enforce per-account and per-IP rate limits with exponential backoff on the login endpoint at the Standard depth or higher
- Scenario: Session cookies leak via XSS or insecure transport
  - Impact: Account takeover without triggering any authentication event, undetectable in logs
  - Mitigation: Issue HttpOnly + Secure + SameSite cookies, bind sessions to TLS, and rotate session IDs on privilege change

### Cross-Tree Refs
- (none)

### Experiential
- Usage count: 0
- Scenarios observed: (none — bootstrap)
- Common mistakes:
  - Skipping rate limiting on the login endpoint because "the WAF will handle it"
  - Building multiple auth flows (password + social + SSO) without a unified session model, leading to inconsistent expiry and logout behavior
- Last promoted: never

---

### UM-F002: Registration / Onboarding

New user account creation, verification, and initial setup experience.

**When It Matters:**
Any product that acquires new users needs a registration flow. The depth depends on how much friction the business can tolerate and how much information is needed upfront. Consumer products need minimal-friction signup (email or social, verify later). B2B products may need company information, role selection, and team invitation. Regulated industries may require identity verification (KYC) during registration. The onboarding experience after registration — tutorials, setup wizards, sample data — is equally important for activation.

**Depth Spectrum:**
- **Basic:** Email + password form, email verification link, redirect to app. No onboarding guidance.
- **Standard:** Social signup option, email verification, basic profile completion prompt, welcome screen with key actions highlighted.
- **Advanced:** Progressive onboarding wizard, sample data population, contextual tooltips, invitation flow for team members, role selection during signup.
- **Enterprise:** Self-service org creation, domain-based auto-join, bulk user import, admin setup wizard, compliance consent collection during registration, SSO auto-provisioning.

**Signals:**
Any product with user acquisition. PP-1 (User Sophistication) determines friction tolerance: level 4-5 (consumer) needs minimal fields and social signup; level 1-2 (technical) tolerates more setup. PP-3 >= 3 (multi-persona) may need role selection during registration. PP-6 (Delivery Ambition) = 1-2 (POC/MVP) can defer onboarding wizards. PP-7 >= 4 (regulated) may require consent collection. QP-6 (Accessibility Standard) >= 3 requires WCAG AA compliance for registration forms, onboarding wizards, and verification flows. QP-1 (Testing Depth) >= 3 suggests e2e tests covering the full registration-to-activation funnel across signup methods. BRD keywords: "sign up", "register", "onboarding", "activation", "invite".

**Tradeoffs:**
Including advanced onboarding: higher activation rates, lower churn, faster time-to-value for users. Cost: significant front-end development, content creation for tutorials, ongoing maintenance as product evolves, A/B testing needed to optimize flows.

### Inclusion
- Default: **mandatory**
- Mandatory when: `project_profile.audience in ['B2C', 'B2B', 'B2B2C']`
- Conditional when: `project_profile.audience == 'internal' and project_profile.delivery_ambition >= 3`
- Exclude when: `project_profile.delivery_ambition <= 2 and project_profile.audience == 'internal'`

### Success Criteria
- Signup-to-activation conversion rate > 60% within 7 days of registration
- Email verification completion rate > 85% within 24 hours of signup
- p95 time from form submit to first successful app screen < 3s

### Failure Scenarios
- Scenario: Signup form asks for 10+ fields before the user sees any product value
  - Impact: Consumer drop-off exceeds 50% at the form, wasting acquisition spend and skewing funnel analytics
  - Mitigation: Collect only email and password at signup; defer profile enrichment to post-activation progressive onboarding
- Scenario: Email verification link expires or is lost and the user has no recovery path
  - Impact: New users sit in a verified=false state, never activate, and churn silently
  - Mitigation: Time-limited tokens with a visible "resend verification" affordance on login, plus a background reminder 24h after signup

### Cross-Tree Refs
- (none)

### Experiential
- Usage count: 0
- Scenarios observed: (none — bootstrap)
- Common mistakes:
  - Shipping an advanced onboarding wizard without A/B testing to confirm it actually lifts activation
  - Treating onboarding content as a one-time deliverable that's never updated as the product evolves
- Last promoted: never

---

### UM-F003: Password Reset / Recovery

Account recovery when users forget credentials or need to change passwords.

**When It Matters:**
Any application with password-based authentication needs password reset. It's a support cost reducer — without it, every forgotten password becomes a support ticket. The depth depends on security requirements and how sensitive the account is. Consumer apps need simple email-based reset. Financial and healthcare apps need stronger verification before allowing password changes.

**Depth Spectrum:**
- **Basic:** Email-based reset link with time-limited token. Password change form.
- **Standard:** Rate-limited reset requests, token expiry, password history enforcement (no reuse), notification of password change via email.
- **Advanced:** Multi-channel recovery (email + SMS), security questions as secondary verification, forced logout of all sessions on password change, admin-initiated password reset.
- **Enterprise:** Recovery via enterprise IdP, self-service account unlock after lockout, audit logging of all recovery attempts, manager-approved recovery for high-privilege accounts.

**Signals:**
Required whenever UM-F001 uses password-based auth. NFR-2 (Security) >= 3 pushes toward advanced recovery with multi-channel verification. PP-7 >= 4 (regulated) needs audit logging of recovery attempts. NFR-7 (Data Sensitivity) >= 3 makes forced session logout on password change essential. QP-7 (Security Testing) >= 3 indicates SAST should cover reset token generation, expiry enforcement, and session invalidation paths. QP-1 (Testing Depth) >= 3 suggests integration tests for the full recovery flow including token lifecycle and brute-force protections.

**Tradeoffs:**
Including at higher depth: reduced support burden, better security (prevents account takeover via reset flow), compliance readiness. Cost: SMS delivery costs, additional UX flows to design and test, complexity of token management and session invalidation.

### Inclusion
- Default: **conditional**
- Mandatory when: `project_profile.auth_methods contains 'password'`
- Conditional when: `project_profile.security_level in ['high', 'critical']` (requires Advanced depth with multi-channel recovery)
- Exclude when: `project_profile.auth_methods == ['sso_only'] or project_profile.auth_methods == ['passwordless_only']`

### Success Criteria
- Reset token usage latency p95 < 2s from link click to password change screen
- Reset flow completion rate > 80% once the reset email is opened
- Reset tokens expire within 60 minutes and are single-use 100% of the time

### Failure Scenarios
- Scenario: Reset token is reusable or does not expire
  - Impact: Attacker who captures an old reset email from a compromised inbox takes over the account months later
  - Mitigation: Enforce one-time-use tokens with a 60-minute TTL and invalidate all existing tokens on any successful reset
- Scenario: Password change does not terminate existing sessions
  - Impact: A compromised session survives the user's recovery attempt, defeating the purpose of the reset
  - Mitigation: Force logout of all sessions on password change at Advanced depth or higher, and send a confirmation email with "this wasn't me" recovery link

### Cross-Tree Refs
- (none)

### Experiential
- Usage count: 0
- Scenarios observed: (none — bootstrap)
- Common mistakes:
  - Failing to invalidate previously-issued reset tokens when a new one is generated
  - Sending reset links without rate-limiting the request endpoint, enabling email-bombing attacks on a target user
- Last promoted: never

---

### UM-F004: Multi-Factor Authentication (MFA)

Second-factor authentication beyond password — TOTP, SMS, hardware keys, biometric.

**When It Matters:**
MFA becomes essential when the application handles sensitive user data, operates in regulated industries (BFSI, healthcare, government), or when organizational security policies require multi-factor verification. For consumer apps with low-risk data, MFA should be optional to avoid onboarding friction. B2B applications serving enterprise customers will often require MFA for compliance (SOC2, ISO 27001). The key question is not just "how sensitive is the data" but "what are the consequences of account compromise" — a compromised admin account in a multi-tenant platform is catastrophic; a compromised social media profile is inconvenient.

**Depth Spectrum:**
- **Basic:** TOTP-based second factor (Google Authenticator, Authy). Single method. User-initiated enrollment.
- **Standard:** TOTP + SMS fallback. Per-user enrollment management. Recovery codes for lost devices. Admin can enforce MFA for specific roles.
- **Advanced:** Hardware key support (WebAuthn/FIDO2), risk-based adaptive MFA that challenges only on suspicious logins (new device, unusual location), biometric options on supported devices.
- **Enterprise:** Conditional access policies (require MFA only for sensitive operations), geo-fencing, device trust evaluation, integration with enterprise IdPs for MFA policy inheritance, step-up authentication for high-risk actions.

**Signals:**
PP-7 (Industry Vertical) >= 4 strongly suggests MFA. PP-3 (Persona Complexity) >= 4 with role hierarchies needs MFA for admin access at minimum. NFR-2 (Security) >= 3 makes MFA essential. NFR-5 (Compliance) >= 3 (SOC2, ISO 27001) often mandates MFA. QP-7 (Security Testing) >= 3 indicates SAST and dependency scanning should cover TOTP secret handling, recovery code generation, and second-factor bypass protections. QP-1 (Testing Depth) >= 3 suggests integration tests for MFA enrollment, verification, fallback, and recovery code flows. BRD keywords: "compliance", "SOC2", "enterprise customers", "sensitive data", "admin access", "financial transactions", "healthcare".

**Tradeoffs:**
Including: stronger security posture, compliance readiness (SOC2, HIPAA, PCI-DSS), enterprise sales eligibility, reduced account compromise risk. Cost: user friction during onboarding and every login, SMS delivery costs if using SMS as factor, support burden for lockouts and lost devices, integration complexity with authenticator apps and hardware keys.

### Inclusion
- Default: **conditional**
- Mandatory when: `project_profile.security_level in ['high', 'critical'] or project_profile.industry in ['BFSI', 'healthcare', 'government'] or project_profile.compliance contains any of ['SOC2', 'ISO27001', 'HIPAA', 'PCI-DSS']`
- Conditional when: `project_profile.persona_complexity >= 4` (required at minimum for admin roles)
- Exclude when: `project_profile.security_level == 'low' and project_profile.audience == 'B2C' and project_profile.delivery_ambition <= 2`

### Success Criteria
- MFA enrollment rate > 90% for users in roles where MFA is enforced
- MFA challenge-to-verification latency p95 < 10s
- Recovery code usage resolves > 95% of lost-device support cases without human support intervention

### Failure Scenarios
- Scenario: User loses their authenticator device with no recovery codes on file
  - Impact: Permanent account lockout, support ticket, and potential data loss for the user
  - Mitigation: Mandate recovery-code generation during enrollment and display them once with explicit "save this now" confirmation before proceeding
- Scenario: SMS fallback is the only second factor and the attacker SIM-swaps the user
  - Impact: MFA is bypassed and the account is compromised despite the security control
  - Mitigation: Offer TOTP or WebAuthn as the primary factor, treat SMS as fallback only, and warn users during enrollment that SMS is the weakest option

### Cross-Tree Refs
- CTC-001 (High security profiles require MFA) — this feature is IMPLIED
- CTC-003 (Regulated industries require MFA) — this feature is IMPLIED

### Experiential
- Usage count: 0
- Scenarios observed: (none — bootstrap)
- Common mistakes:
  - Enforcing MFA on every login for low-risk consumer flows, driving onboarding friction and drop-off
  - Using SMS as the sole second factor because it's easiest to integrate, ignoring SIM-swap risk
- Last promoted: never

---

### UM-F005: User Profile (Primary)

Core user information — name, email, avatar, contact details, account settings.

**When It Matters:**
Any application where users have persistent identity needs a profile. The primary profile holds the basics: display name, email, avatar, contact information, and account-level settings (language, timezone, notifications). Even minimal products need this — users expect to update their email, change their name, and manage notification preferences. The depth depends on how personalized the experience is and how much the product needs to know about the user.

**Depth Spectrum:**
- **Basic:** View/edit name, email, avatar. Change password link. Account deletion.
- **Standard:** Contact details, timezone/locale preferences, notification settings (email, push), profile completeness indicator.
- **Advanced:** Profile photo upload with cropping, linked accounts (social providers), activity history, data export (GDPR), privacy settings, profile visibility controls.
- **Enterprise:** Organization-managed profiles, directory-synced fields (read-only from IdP), delegated profile management, custom fields per organization.

**Signals:**
Required for any product with user accounts. PP-4 (Geographic Scope) >= 3 needs locale/timezone in profile. NFR-5 (Compliance) >= 3 needs data export and deletion (GDPR). PP-3 >= 3 (multi-persona) may need persona-specific profile fields. PP-2 (UX Maturity) >= 3 suggests profile completeness indicators and polished editing experience. QP-6 (Accessibility Standard) >= 3 requires WCAG AA compliance for profile editing forms, avatar upload, and account settings interfaces. QP-3 (Documentation Level) >= 3 indicates API documentation for profile endpoints including data export and deletion flows.

**Tradeoffs:**
Including at higher depth: better user experience, personalization foundation, compliance readiness (data portability). Cost: storage for profile media (avatars), GDPR data export implementation, profile editing UX across devices, privacy settings complexity.

### Inclusion
- Default: **mandatory**
- Mandatory when: `project_profile.audience in ['B2C', 'B2B', 'B2B2C', 'internal']`
- Conditional when: `project_profile.compliance contains any of ['GDPR', 'CCPA']` (requires Advanced depth for data export and deletion)

### Success Criteria
- Profile edit save success rate > 99% across supported devices
- p95 profile load latency < 300ms
- GDPR data export request fulfilled within 30 days 100% of the time (when Advanced depth is included)

### Failure Scenarios
- Scenario: Email change takes effect immediately without re-verification
  - Impact: An attacker who hijacks a session silently redirects all account communication to a mailbox they control, defeating password-reset protections
  - Mitigation: Require confirmation from both the old and new email addresses before the email change takes effect, and log the event to the audit trail
- Scenario: Avatar upload accepts arbitrary file types and sizes
  - Impact: Storage costs balloon, the CDN serves malicious files, and the upload endpoint becomes a DoS vector
  - Mitigation: Whitelist image MIME types, enforce a maximum size of 5MB, and re-encode uploads server-side to strip metadata and embedded payloads

### Cross-Tree Refs
- (none)

### Experiential
- Usage count: 0
- Scenarios observed: (none — bootstrap)
- Common mistakes:
  - Storing profile media in the same bucket as application assets, mixing privacy scopes
  - Deferring GDPR data export tooling until a regulator asks for it, then scrambling under a 30-day deadline
- Last promoted: never

---

### UM-F006: User Profile (Extended / Preferences)

Extended user data — preferences, settings, personalization inputs, secondary profile information.

**When It Matters:**
When the product needs to personalize the experience beyond basic account settings. Extended profiles capture user preferences (theme, layout, default views), interests (for recommendations), professional information (for B2B), or behavioral preferences (communication channels, frequency). This becomes important when the product has a personalization layer or when different users need different default experiences.

**Depth Spectrum:**
- **Basic:** Theme preference (dark/light), default landing page, a few toggle settings.
- **Standard:** Interest tags, communication preferences (channels, frequency, opt-in/opt-out), saved filters and views, display density preference.
- **Advanced:** Behavioral preference learning (tracking user choices to suggest defaults), preference syncing across devices, preference export/import, A/B test segment assignment.
- **Enterprise:** Organization-level preference templates, managed preferences (admin sets defaults for org), role-based default configurations, compliance-driven preference restrictions.

**Signals:**
PP-2 (UX Maturity) >= 3 suggests preferences beyond basic theme. Products with personalization module (PS-*) need extended profiles as input. PP-3 >= 3 (multi-persona) benefits from role-based defaults. PP-1 >= 3 (business professional and above) expects customizable workspace. QP-3 (Documentation Level) >= 3 indicates API documentation for preference endpoints so downstream services can consume user preferences programmatically. QP-6 (Accessibility Standard) >= 3 requires WCAG AA compliance for preference management interfaces, especially theme and display density controls. BRD keywords: "preferences", "personalization", "settings", "customization", "dashboard configuration".

**Tradeoffs:**
Including: more personalized experience, higher user satisfaction, better engagement metrics, foundation for recommendation engine. Cost: preference management UI, storage and sync complexity, risk of "settings bloat" where too many options overwhelm users, ongoing maintenance as product evolves.

### Inclusion
- Default: **optional**
- Mandatory when: `project_profile.has_personalization_module == true or project_profile.ux_maturity >= 3`
- Conditional when: `project_profile.persona_complexity >= 3` (role-based default configurations become valuable)

### Success Criteria
- Preference save-to-effect latency < 1s end-to-end across the user's active sessions
- Preference sync consistency across devices > 99% within 5s of a change
- Opt-out honoring for communication preferences enforced within 1 notification cycle (100% of the time)

### Failure Scenarios
- Scenario: Preferences UI exposes 40+ toggles on a single screen
  - Impact: Users abandon customization entirely, support tickets rise, and the personalization investment produces no measurable engagement lift
  - Mitigation: Apply progressive disclosure — show the 3-5 most-used preferences first, nest the rest behind "advanced" sections, and measure which settings users actually touch
- Scenario: Preferences fail to sync when the user switches devices
  - Impact: The user sees stale or reset settings and loses trust that the product remembers them
  - Mitigation: Persist preferences server-side with a conflict-resolution rule (last-write-wins with timestamp) and surface a "syncing" indicator during propagation

### Cross-Tree Refs
- (none)

### Experiential
- Usage count: 0
- Scenarios observed: (none — bootstrap)
- Common mistakes:
  - Exposing every preference as a top-level setting instead of progressively disclosing by usage frequency ("settings bloat")
  - Treating preferences as a ship-once feature, accumulating dead toggles for removed product features
- Last promoted: never

---

### UM-F007: Social Login (OAuth2)

Authentication via third-party identity providers — Google, Apple, GitHub, Facebook, Microsoft.

**When It Matters:**
Social login reduces registration friction for consumer products — users don't create another password, and the app gets verified email and profile data. It's near-essential for consumer-facing products (PP-1 >= 4) where conversion rate on signup forms directly impacts growth. Less relevant for enterprise products where SSO/SAML replaces social login, and for developer tools where token-based auth is preferred. The choice of providers depends on the target audience — Google and Apple for consumers, GitHub for developers, Microsoft for enterprise.

**Depth Spectrum:**
- **Basic:** Single provider (Google). OAuth2 authorization code flow. Extract email and name. Link to local account.
- **Standard:** Multiple providers (Google, Apple, GitHub). Account linking (connect social to existing account). Profile photo import. Graceful handling of provider-specific quirks.
- **Advanced:** Provider-agnostic abstraction layer. Progressive profile enrichment from social data. Social login on mobile (native SDKs). Automatic account linking on email match.
- **Enterprise:** Social login as supplement to SSO (for external collaborators). Provider allow-listing per organization. Audit logging of social auth events.

**Signals:**
PP-1 (User Sophistication) >= 4 (consumer) strongly suggests social login. PP-1 = 1-2 (technical) may prefer GitHub/GitLab OAuth specifically. PP-6 (Delivery Ambition) >= 3 (market-ready) should include social login for conversion optimization. QP-7 (Security Testing) >= 3 indicates SAST should cover OAuth callback handling, token exchange flows, and state parameter validation to prevent CSRF. QP-1 (Testing Depth) >= 3 suggests integration tests for each OAuth provider flow including account linking and error scenarios. BRD keywords: "social login", "Google sign-in", "sign in with Apple", "OAuth", "one-click signup".

**Tradeoffs:**
Including: lower registration friction, higher conversion rates, verified email addresses, pre-populated profile data. Cost: provider SDK dependencies, ongoing maintenance as providers change APIs, privacy considerations (data sharing with providers), app review requirements (Apple), multiple login path testing.

### Inclusion
- Default: **optional**
- Mandatory when: `project_profile.audience == 'B2C' and project_profile.delivery_ambition >= 3`
- Conditional when: `project_profile.user_sophistication >= 4` (consumer audiences expect social login)
- Exclude when: `project_profile.audience == 'internal' or project_profile.auth_methods == ['sso_only']`

### Success Criteria
- OAuth callback round-trip p95 < 2s from provider redirect to session established
- Social-signup conversion rate > 40% higher than email/password signup on consumer-facing flows
- Account-linking success rate > 98% when the social email matches an existing local account

### Failure Scenarios
- Scenario: OAuth callback does not validate the state parameter
  - Impact: CSRF attacker forces a victim to link their account to the attacker's identity, enabling persistent account takeover
  - Mitigation: Generate a cryptographically random state token per authorization request, bind it to the user's session, and reject callbacks where state does not match
- Scenario: A provider changes its API and the social login button silently breaks
  - Impact: A percentage of new-user signups fail with no error surfaced, conversion drops, and the problem is only caught days later via funnel metrics
  - Mitigation: Synthetic end-to-end test per provider running hourly, with alerting on callback failure rate crossing 2%

### Cross-Tree Refs
- CTC-004 (Consumer products imply social login) — this feature is IMPLIED

### Experiential
- Usage count: 0
- Scenarios observed: (none — bootstrap)
- Common mistakes:
  - Coupling business logic directly to a specific provider's user object, making it painful to add a second provider later
  - Skipping the Apple "Sign in with Apple" integration when targeting iOS, causing App Store review rejection
- Last promoted: never

---

### UM-F008: User Analytics / Audit Trail

Tracking user actions for analytics, compliance, and security monitoring.

**When It Matters:**
Audit trails become essential in regulated industries where every user action affecting sensitive data must be logged and reviewable. Even outside regulation, user analytics (login frequency, feature usage, session duration) inform product decisions. The depth depends on regulatory requirements and how much the business needs behavioral data. BFSI and healthcare require immutable audit logs. SaaS products need usage analytics for product-led growth. The distinction matters: analytics inform the business; audit trails protect the business.

**Depth Spectrum:**
- **Basic:** Login/logout timestamps, failed login attempts, password change events. Stored in application logs.
- **Standard:** Structured event logging (who did what, when, from where). Basic admin dashboard showing user activity. Retention policy (30/90 days).
- **Advanced:** Immutable audit log (append-only, tamper-evident). Search and filter capabilities. Export for compliance reporting. Anomaly detection (unusual login patterns). SIEM integration.
- **Enterprise:** Real-time audit stream, cross-service correlation, regulatory report generation (SOX, HIPAA), legal hold capability, chain-of-custody for audit data, third-party audit access.

**Signals:**
PP-7 (Industry Vertical) >= 4 (regulated) makes audit trails essential. NFR-1 (Risk) >= 3 needs at least standard event logging. NFR-5 (Compliance) >= 3 requires structured audit trails. NFR-7 (Data Sensitivity) >= 4 needs immutable logging. PP-6 >= 3 (market-ready) benefits from user analytics for product decisions. QP-5 (Observability Maturity) >= 3 suggests metrics and alerting for audit ingestion pipeline health and anomalous event patterns. QP-3 (Documentation Level) >= 3 indicates documentation for audit event schemas and compliance reporting procedures. QP-1 (Testing Depth) >= 3 suggests integration tests verifying audit event capture, immutability guarantees, and retention policy enforcement. BRD keywords: "audit", "compliance", "logging", "user activity", "reporting", "SOX", "HIPAA".

**Tradeoffs:**
Including: compliance readiness, security incident investigation capability, product usage insights, legal protection. Cost: storage for high-volume event data, query performance for large audit tables, immutability infrastructure (append-only stores), privacy implications of tracking user behavior (GDPR data minimization), dashboard development and maintenance.

### Inclusion
- Default: **conditional**
- Mandatory when: `project_profile.compliance contains any of ['HIPAA', 'SOX', 'PCI-DSS', 'SOC2'] or project_profile.industry in ['BFSI', 'healthcare', 'government']`
- Conditional when: `project_profile.data_sensitivity >= 4` (immutable logging required) or `project_profile.delivery_ambition >= 3` (analytics for product decisions)
- Exclude when: `project_profile.delivery_ambition <= 2 and project_profile.compliance == []`

### Success Criteria
- Audit event capture rate = 100% for authentication and privileged-action events (zero dropped events)
- Audit query p95 latency < 2s over a rolling 90-day window
- Audit log tamper-evidence verification passes 100% of scheduled integrity checks (at Advanced depth or higher)

### Failure Scenarios
- Scenario: Audit events are written to the same mutable database as application data
  - Impact: An attacker with write access can erase their own trail, defeating the compliance and forensics value of the log
  - Mitigation: Write audit events to an append-only store (or a WORM bucket) with cryptographic chaining, separate from application storage, at Advanced depth or higher
- Scenario: High event volume overwhelms storage, and retention is silently truncated
  - Impact: Regulatory deadlines are missed because events from the relevant window no longer exist, triggering compliance findings
  - Mitigation: Define an explicit retention policy matching the strictest applicable regulation, alert on ingestion lag > 5 minutes, and archive cold events to object storage rather than deleting them

### Cross-Tree Refs
- CTC-002 (Healthcare compliance requires audit logging) — this feature is IMPLIED

### Experiential
- Usage count: 0
- Scenarios observed: (none — bootstrap)
- Common mistakes:
  - Logging everything into unstructured application logs so the data is impossible to query for compliance reports
  - Tracking user behavior at high granularity without a GDPR data-minimization review, creating privacy liability
- Last promoted: never
