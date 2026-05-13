# Project Polish & Completeness Plan

To make the existing Fintech application robust, demo-ready, and functionally complete, we will execute the following 5 subtasks one by one.

## Subtask 1: Robust User Profiles (Backend & Frontend)
**Goal:** Expand user identity beyond just an email and ID.
- **Backend:** 
  - Expand `UserProfile` entity to include `firstName`, `lastName`, `avatarUrl`, `phoneNumber`, and `currencyPreference`.
  - Update `UpdateProfileDto` and `UsersController` to accept these fields.
  - Automatically generate a default avatar or "Name Initials" on user creation.
- **Frontend:**
  - Create a proper "Profile Settings" page.
  - Update the Dashboard Header to show the user's name and avatar.

## Subtask 2: Email-based Transfer System
**Goal:** Allow users to send money using an email address instead of a UUID.
- **Backend:**
  - Implement a "User Lookup" endpoint (`GET /api/v1/users/search?email=...`) in `user-service`.
  - Expose this through the API Gateway.
- **Frontend:**
  - Build a "Send Money" wizard.
  - Step 1: Input recipient email and validate.
  - Step 2: Show recipient's name/avatar to confirm identity.
  - Step 3: Input amount and confirm transfer with loading states and success/error toasts.

## Subtask 3: Enriched Transaction History
**Goal:** Make the transaction history human-readable with names and directions.
- **Backend:**
  - Enhance the `getHistory` endpoint to return a "Direction" (`INBOUND` vs `OUTBOUND`) relative to the requesting user.
  - Fetch recipient/sender names from the `user-service` via gRPC and attach them to the transaction records before returning them to the frontend.
- **Frontend:**
  - Design a clear Transaction List component.
  - Show Green `+$50` for Inbound, Red `-$50` for Outbound.
  - Show "Sent to [Name]" or "Received from [Name]" instead of UUIDs.

## Subtask 4: Financial Dashboard & Metrics
**Goal:** Provide insights into the user's financial activity.
- **Backend:**
  - Create a `GET /api/v1/wallet/stats` endpoint.
  - Return: Total Balance, Total Spent (This Month), Total Received (This Month) using Elasticsearch aggregations.
- **Frontend:**
  - Build dashboard metric cards for the stats.
  - Integrate a simple chart plotting income vs expenses over time.

## Subtask 5: Real-time Notifications UI
**Goal:** Make the background notification system visible to the user.
- **Backend:**
  - Ensure `GET /api/v1/notifications` exists in Gateway, fetching from `notification-service`.
- **Frontend:**
  - Add a Notification Bell icon in the header with an unread badge.
  - Implement a dropdown or side-panel showing alerts (e.g., "Transfer Successful", "You received money").
