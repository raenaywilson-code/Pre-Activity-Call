# Security Specification for Carvana Pre-Call Simulator

## Data Invariants
1. A session must have a valid `empId` and `scenarioId`.
2. A session's rating must be between 0 and 100.
3. If a `userId` is present in a session, it must match the authenticated user's UID.
4. Sessions are immutable once created.

## The "Dirty Dozen" Payloads
1. **Unauthenticated Write**: Attempting to create a session without being signed in.
2. **Identity Theft**: Attempting to set `userId` to someone else's UID.
3. **Rating Poisoning**: Attempting to set a rating of -1 or 101.
4. **Massive Payload**: Attempting to inject a huge string into `empId`.
5. **Orphaned Session**: Attempting to create a session without required fields like `createdAt`.
6. **Unauthorized Read**: Attempting to read sessions without signing in.
7. **Malicious ID**: Using a document ID with non-alphanumeric characters.
8. **Shadow Field Injection**: Adding an `isAdmin: true` field to a session document.
9. **Update Hijack**: Attempting to modify an existing session's score.
10. **Delete Attack**: Attempting to delete a session.
11. **Spoofing Metadata**: Attempting to set a fake `createdAt` (though we should ideally use server timestamps).
12. **Query Scraping**: Attempting to list all sessions without a filter (already protected by `read` being authorized).

## Test Recommendations
Run a test suite verifying that all the above unauthorized operations return `PERMISSION_DENIED`.
