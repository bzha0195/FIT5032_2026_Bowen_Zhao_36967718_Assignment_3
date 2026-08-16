# Elderly Health and Care Platform

A Vue 3 web application for an elderly health charity. It provides health information, charity activity booking, care-service applications, personal records, and an administrator management area.

## Implemented Requirements

### A. Application Development

- **A.1 Development Stack:** Built with Vue 3, Vite, Vue Router, and Pinia.
- **A.2 Responsiveness:** Responsive layouts for desktop and smaller screens.

### B. Core Web Features

- **B.1 Validation:** Client-side validation for registration, login, password reset, profile, and care-service forms.
- **B.2 Dynamic Data:** Dynamic Vue/Pinia data rendering with persistent browser storage and Firestore synchronisation.

### C. Security and User Access

- **C.1 Authentication:** Registration, login, logout, and password-reset flows.
- **C.2 Role-Based Access:** Separate elderly-user, administrator, and pending-administrator access controls.
- **C.3 Rating:** Users can rate articles, activities, and services and view aggregated rating summaries.
- **C.4 Security:** Input validation, sanitisation, XSS-aware handling, and Firestore security rules.

### D. Advanced Features

- **D.1 External Authentication:** Firebase Authentication with email/password login.
- **D.2 Email:** EmailJS-based administrator email composer with up to five attachments.
- **D.3 Interactive Tables:** Searchable, sortable, paginated administrator tables with a 10-row page limit.
- **D.4 Cloud Deployment:** Production build and cloud-hosting configuration are prepared.

### E. Cloud and Integration Features

- **E.1 Cloud Function:** Firebase Cloud Function for rating-summary enquiries.
- **E.2 Geo Location:** Mapbox nearby service search and route navigation on the home page.
- **E.3 Accessibility:** Keyboard navigation, visible focus, skip link, semantic labels, and accessible form feedback.
- **E.4 Export:** CSV export for user, activity-signup, and service-application tables.

### F. Innovation Features

- **F.1 Booking Calendar:** FullCalendar-based activity calendar with booking status indicators.
- **F.2 Health AI Assistant:** Text-based health and wellbeing questions powered by a DeepSeek API proxy.
- **F.3 Data Dashboard:** Administrator dashboard for users, activities, services, applications, and ratings.
- **F.4 Bulk Email:** Select multiple users and send a shared email with up to five attachments.

The application can be accessed at: [https://fit5032-2026-bowen-zhao-36967718-assignment-3.pages.dev/](https://fit5032-2026-bowen-zhao-36967718-assignment-3.pages.dev/)
