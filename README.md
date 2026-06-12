PeopleFlow

«Modern workforce management built for growing teams.»

PeopleFlow is a comprehensive Human Resource Management System (HRMS) designed to simplify how organizations manage employees, attendance, leave requests, assets, payroll records, and workplace operations.

Built with scalability, security, and usability in mind, PeopleFlow enables organizations to streamline HR processes while giving employees and managers a seamless experience.

---

Why PeopleFlow?

Managing people should not require navigating spreadsheets, scattered documents, and disconnected tools.

PeopleFlow brings employee management, attendance tracking, leave administration, asset allocation, reporting, and organizational workflows into a single platform.

Whether you're a startup building your first team or an organization managing hundreds of employees, PeopleFlow helps keep everything organized, transparent, and efficient.

---

Core Features

Employee Management

- Complete employee directory
- Employee profiles and records
- Department and designation management
- Employment history tracking
- Search, filter, and advanced employee lookup

Role-Based Access Control (RBAC)

- Super Admin
- HR Manager
- Department Manager
- Employee
- Granular permission system
- Secure access boundaries across modules

Attendance Management

- Daily attendance tracking
- Check-in / Check-out workflows
- Attendance status management
- Attendance reports and analytics
- Attendance policy support

Leave Management

- Leave request workflows
- Multi-level approval process
- Leave balance tracking
- Leave history and audit records
- Team leave visibility for managers

Asset Management

- Asset inventory management
- Asset assignment and allocation
- Asset return workflows
- Ownership tracking
- Asset history and audit logs

Notifications & Alerts

- Real-time system notifications
- Approval reminders
- Leave status updates
- Attendance-related alerts
- Important HR announcements

Reports & Analytics

- Workforce insights
- Attendance reports
- Leave utilization reports
- Department-level analytics
- Export-ready reporting

Security & Compliance

- Authentication & authorization
- Protected API routes
- Activity auditing
- Secure data handling
- Enterprise-ready access control

---

System Architecture

PeopleFlow follows a modern client-server architecture.

```
Frontend (React + TypeScript)
│
▼
REST API Layer
│
▼
Backend (Node.js / Express)
│
▼
Database (SQL)
```

The architecture is designed to support modular growth, making it easy to introduce additional HR modules without affecting existing functionality.

---

Technology Stack

Frontend

- React
- TypeScript
- Vite
- React Router
- Modern Component Architecture

Backend

- Node.js
- Express.js
- RESTful APIs
- JWT Authentication

Database

- SQL Database
- Relational Data Modeling

Development Tools

- Git
- GitHub
- ESLint
- TypeScript

---

Project Structure

```
peopleflow/
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── hooks/
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── models/
│   └── utils/
│
├── database/
│
└── docs/
```

---

Getting Started

Prerequisites

- Node.js 18+
- npm or pnpm
- SQL Database

Installation

Clone the repository:

```bash
git clone https://github.com/your-org/peopleflow.git
cd peopleflow
```

Install dependencies:

```bash

Frontend

cd frontend
npm install

Backend

cd ../backend
npm install
```

Configure environment variables:

```env
DATABASE_URL=
JWT_SECRET=
PORT=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

Start development servers:

```bash

Backend

npm run dev

Frontend

npm run dev

---

Roadmap

Current

- Employee Management
- Leave Management
- Attendance Tracking
- Asset Management
- Notifications
- Reporting

Planned

- Payroll Management
- Recruitment & Hiring
- Performance Reviews
- Employee Self-Service Enhancements
- Mobile Application
- Advanced Analytics Dashboard

---

Contributing

Contributions, feature requests, and improvements are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a pull request

Please ensure all code follows project conventions and includes appropriate testing where applicable.

---

License

This project is licensed under the MIT License.

---

About

PeopleFlow was created to modernize workforce management by providing organizations with a centralized platform for managing people, processes, and workplace operations.

Built with a focus on usability, transparency, and operational efficiency.