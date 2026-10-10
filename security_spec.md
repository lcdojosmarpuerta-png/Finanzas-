# Security Specification: Financial Management System

## 1. Data Invariants
1. **User Identity Invariant**: All personal financial records (incomes, expenses, debts, receivables, categories, settings) must be scoped strictly under `/users/{userId}` where `userId == request.auth.uid`.
2. **Identity Integrity**: Users can never create, read, update, or delete financial records belonging to another user.
3. **Temporal Invariant**: The creation timestamp `createdAt` must match `request.time` on create, and remain immutable on update.
4. **Key Whitelist Invariant**: Payloads must strictly contain only allowed keys without ghost or injected fields.
5. **String Boundary Invariant**: Text fields like descriptions and names must be non-empty strings with constrained maximum lengths (e.g. `<= 200` chars).
6. **Non-Negative Value Invariant**: Monetary amounts (`amountUSD`, `totalAmountUSD`) must be valid non-negative numbers.

## 2. The "Dirty Dozen" Payloads (Designed to break Identity, Integrity, and State)
1. **Payload 1 (Ghost Field Injection)**: An income item with an injected `isAdmin: true` attribute.
2. **Payload 2 (Cross-User Write)**: Writing to `/users/other_user_id/incomes/inc-1` using user `current_user_id` credentials.
3. **Payload 3 (Unauthenticated Read)**: Attempting to list or read `/users/user_123/incomes` without an active auth session.
4. **Payload 4 (Immutable Field Mutation)**: Updating an expense document with an altered `createdAt` timestamp.
5. **Payload 5 (Negative Amount Bypass)**: Creating an expense with `amountUSD: -500`.
6. **Payload 6 (Oversized String DOS)**: Inseting a description consisting of a 50,000 character string.
7. **Payload 7 (Path Traversal ID)**: Inserting a document with an ID containing malicious path characters `../../evil`.
8. **Payload 8 (Terminal State Tampering)**: Changing a paid debt without valid payment sub-records or attempting arbitrary status reverts.
9. **Payload 9 (Client Timestamp Forgery)**: Forging `createdAt` to a past timestamp instead of `request.time`.
10. **Payload 10 (Type Poisoning)**: Setting `amountUSD` as a string `"one hundred"` instead of a number.
11. **Payload 11 (Unbounded Array Injection)**: Injecting 2,000 array elements into a debt payment list.
12. **Payload 12 (Admin Claim Spoofing)**: Submitting a request with unverified email or attempting to claim administrative access.

## 3. Test Runner Design
The tests enforce that all 12 dirty payloads return `PERMISSION_DENIED` under Firestore rules evaluation.
