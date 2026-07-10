# Security Model

- Passwords are hashed with Argon2.
- Access and refresh tokens are separate and stored in HttpOnly cookies.
- Refresh tokens are rotated and can be revoked per session.
- Organization membership and roles are checked before resource access.
- Jira OAuth tokens are encrypted before database storage.
- Jira write operations require explicit human approval.
- Webhooks are deduplicated and stored before processing.
- Uploaded content, Jira descriptions, comments, and documents are untrusted.
- Logs use request IDs and avoid passwords, API keys, tokens, and full secrets.

