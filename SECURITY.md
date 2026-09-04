# Security Policy - Funded Cobra Support Portal

## 🔒 Security Overview

The Funded Cobra Support Portal implements enterprise-grade security measures to protect customer data and ensure platform integrity.

## 🛡️ Security Features

### Authentication & Authorization

#### Discord OAuth 2.0
- Secure authentication using Discord as identity provider
- No password storage required
- OAuth 2.0 standard implementation
- Secure token exchange flow

#### Session Management
- HTTPOnly cookies for session tokens
- Secure flag enabled in production
- SameSite attribute for CSRF protection
- 7-day session expiration
- Automatic session cleanup

#### Role-Based Access Control (RBAC)
- 5 distinct user roles with specific permissions
- Customer, Support Agent, Finance Team, Partnership Manager, Administrator
- Granular permission checks at route and API level
- Role verification on every request

### Database Security

#### Row Level Security (RLS)
- Enabled on all database tables
- Customers can only access their own tickets
- Staff can only access tickets based on role
- Internal notes completely hidden from customers
- Automatic policy enforcement by Supabase

#### RLS Policy Examples

```sql
-- Customers can only view their own tickets
CREATE POLICY "Customers can view own tickets" ON tickets
  FOR SELECT USING (user_id::text = auth.uid()::text);

-- Staff can view all tickets
CREATE POLICY "Staff can view all tickets" ON tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id::text = auth.uid()::text 
      AND role IN ('support_agent', 'finance_team', 'partnership_manager', 'administrator')
    )
  );

-- Only staff can view internal notes
CREATE POLICY "Only staff can view internal notes" ON internal_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id::text = auth.uid()::text 
      AND role IN ('support_agent', 'finance_team', 'partnership_manager', 'administrator')
    )
  );
```

#### Data Encryption
- All data encrypted at rest by Supabase
- TLS 1.3 for data in transit
- Encrypted database backups
- Secure credential storage

### API Security

#### Rate Limiting
- 10 requests per minute per user (configurable)
- Prevents brute force attacks
- Protects against DoS attacks
- IP-based and user-based limiting

#### Input Validation
- All user inputs validated server-side
- Email format validation
- File type and size validation
- Content sanitization
- SQL injection prevention
- XSS prevention

#### API Authentication
- All API routes require authentication (except public routes)
- Token validation on every request
- Role verification for protected endpoints
- Automatic session expiration

### File Upload Security

#### Restrictions
- Maximum file size: 10MB (configurable)
- Allowed file types:
  - Images: JPEG, PNG, GIF, WebP
  - Documents: PDF, DOC, DOCX
- Filename sanitization
- Malicious file detection

#### Storage Security
- Private Supabase storage bucket
- Signed URLs for file access
- Automatic URL expiration
- Row-level security on storage

### Frontend Security

#### Content Security Policy (CSP)
- Prevents XSS attacks
- Restricts script sources
- Blocks inline scripts (except necessary)
- Controls resource loading

#### HTTP Security Headers
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer
- `Strict-Transport-Security` - Forces HTTPS

#### Client-Side Protection
- No sensitive data in localStorage
- Secure cookie storage
- CSRF token validation
- Input sanitization before display

### Discord Integration Security

#### OAuth Security
- Separate production and development apps
- Client secret never exposed to client
- Redirect URI whitelist
- State parameter for CSRF protection

#### Webhook Security
- Webhook URL kept in environment variables
- HTTPS-only webhooks
- No sensitive data in webhook payloads
- Webhook signature verification (recommended)

## 🚨 Security Best Practices

### For Developers

1. **Environment Variables**
   - Never commit `.env.local` to git
   - Use different credentials for dev/staging/production
   - Rotate secrets regularly
   - Keep service role key secure

2. **Code Security**
   - Always validate user input
   - Use parameterized queries
   - Sanitize HTML output
   - Avoid eval() and dangerous functions
   - Keep dependencies updated

3. **Authentication**
   - Always check user role before sensitive operations
   - Verify session on every protected route
   - Implement proper logout
   - Clear sessions on logout

4. **Data Access**
   - Never expose service role key to client
   - Use RLS policies for all tables
   - Verify user ownership before operations
   - Log all administrative actions

### For Administrators

1. **User Management**
   - Review user roles regularly
   - Remove inactive staff accounts
   - Monitor administrator access
   - Audit permission changes

2. **Monitoring**
   - Review Supabase logs weekly
   - Monitor failed login attempts
   - Track unusual API activity
   - Set up alerts for security events

3. **Backups**
   - Enable automatic database backups
   - Test restore procedures
   - Keep backups encrypted
   - Store backups securely

4. **Updates**
   - Keep Next.js and dependencies updated
   - Monitor security advisories
   - Apply security patches promptly
   - Test updates in staging first

## 🔍 Security Checklist

### Pre-Launch Security Audit

- [ ] All RLS policies are enabled and tested
- [ ] Environment variables are secure and not committed
- [ ] Service role key is only used server-side
- [ ] HTTPS is enabled (SSL certificate)
- [ ] Security headers are configured
- [ ] Rate limiting is implemented
- [ ] File upload restrictions are in place
- [ ] Input validation on all forms
- [ ] XSS protection is enabled
- [ ] CSRF protection is enabled
- [ ] Session management is secure
- [ ] OAuth configuration is correct
- [ ] Database backups are configured
- [ ] Error messages don't leak sensitive info
- [ ] Admin routes are properly protected

### Regular Security Maintenance

- [ ] Review user permissions monthly
- [ ] Update dependencies quarterly
- [ ] Rotate secrets every 6 months
- [ ] Audit database access logs
- [ ] Review and update RLS policies
- [ ] Test backup restoration
- [ ] Monitor security advisories
- [ ] Review API rate limits

## 🚫 Common Security Pitfalls to Avoid

1. **Exposing Secrets**
   - ❌ Never log environment variables
   - ❌ Don't send service role key to client
   - ❌ Don't commit secrets to git
   - ❌ Don't hardcode API keys

2. **Weak Authentication**
   - ❌ Don't skip role verification
   - ❌ Don't trust client-side data
   - ❌ Don't use long session expiration
   - ❌ Don't forget to clear sessions

3. **Insufficient Validation**
   - ❌ Don't trust user input
   - ❌ Don't skip server-side validation
   - ❌ Don't allow arbitrary file uploads
   - ❌ Don't forget SQL injection protection

4. **Poor Error Handling**
   - ❌ Don't expose stack traces to users
   - ❌ Don't leak database structure in errors
   - ❌ Don't show detailed error messages in production
   - ❌ Don't log sensitive user data

## 🔐 Sensitive Data Handling

### What is Considered Sensitive

- Discord IDs and usernames
- Email addresses
- Transaction IDs
- Account IDs
- Order IDs
- Internal staff notes
- User sessions
- API keys and secrets

### How We Protect Sensitive Data

1. **In Transit**
   - HTTPS/TLS 1.3 encryption
   - Secure WebSocket connections
   - No sensitive data in URLs
   - Encrypted API requests

2. **At Rest**
   - Database encryption by Supabase
   - Encrypted backups
   - Secure file storage
   - No plaintext secrets

3. **In Use**
   - Minimal data exposure
   - Role-based access
   - Data masking where appropriate
   - Secure memory handling

## 📊 Security Monitoring

### What to Monitor

- Failed login attempts
- Unusual API activity
- Large file uploads
- Database connection errors
- Rate limit violations
- Permission denied errors
- Suspicious user behavior

### Logging Best Practices

```typescript
// ✅ Good - Don't log sensitive data
console.log('User login attempt', { userId: user.id });

// ❌ Bad - Logs sensitive data
console.log('User login', { user, password, session });

// ✅ Good - Log security events
console.log('Permission denied', { 
  userId: user.id, 
  action: 'view_ticket', 
  ticketId: ticket.id 
});
```

## 🆘 Security Incident Response

### If a Security Issue is Discovered

1. **Immediate Actions**
   - Assess the severity
   - Contain the issue (disable feature if needed)
   - Document the issue
   - Notify the team

2. **Investigation**
   - Review logs
   - Identify affected users
   - Determine impact scope
   - Find root cause

3. **Resolution**
   - Develop fix
   - Test thoroughly
   - Deploy fix
   - Verify resolution

4. **Post-Incident**
   - Notify affected users if needed
   - Document lessons learned
   - Update security procedures
   - Implement preventive measures

## 📞 Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** create a public GitHub issue
2. Email security concerns to: security@fundedcobra.com
3. Include detailed description of the vulnerability
4. Provide steps to reproduce if possible
5. Wait for acknowledgment before public disclosure

We take security seriously and will respond promptly to legitimate security reports.

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [Discord OAuth Security](https://discord.com/developers/docs/topics/oauth2#security)

## 🔄 Security Update Policy

- Security patches applied within 48 hours
- Critical vulnerabilities addressed immediately
- Regular security audits quarterly
- Dependency updates monthly
- Security documentation updated continuously

---

**Last Updated:** 2026-08-31

**Security is everyone's responsibility. Stay vigilant and report any concerns immediately.**
