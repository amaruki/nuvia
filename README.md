# Community Platform

A modern, scalable platform for managing open source communities, built with Next.js and designed for both hobby communities and professional associations.

## Overview

This platform provides comprehensive community management features including user authentication, membership management, event organization, content management, and financial tracking. Built with a modular architecture that can evolve from a simple monolith to microservices as the community grows.

## Technology Stack

- **Frontend**: Next.js 15+ (App Router), React 18+, TypeScript, Tailwind CSS V4, Radix UI
- **Backend**: Next.js API Routes, Server Actions, Node.js 20+
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Betterauth
- **Caching**: Redis
<!-- - **Monitoring**: Sentry, Vercel Analytics -->

## Architecture

The platform follows a layered architecture design:

```
Client Layer (Browser/Mobile)
    ↓
Controller Layer (Routes/API)
    ↓
Service Layer (Business Logic)
    ↓
Manager Layer (Data Access)
    ↓
Data Layer (PostgreSQL/Redis)
```

## Core Modules

### MVP Features
- **User Management**: Authentication, profiles, RBAC
- **Membership Management**: Multi-tier memberships, payments
- **Event Management**: Event creation, registration, certificates
- **Content Management**: CMS for posts and announcements

### Post-MVP Features
- **Financial System**: Invoicing, donations, reports
- **Directory**: Member and business listings
- **Job Board**: Job postings and applications
- **Forum**: Discussion threads and moderation
- **Newsletter**: Email campaigns and analytics

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis (optional, for caching)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd community-platform
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Configure the following variables:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/community_platform"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
REDIS_URL="redis://localhost:6379" # optional
```

4. Set up the database:
```bash
# Generate Prisma client
bunx prisma generate

# Run migrations
bunx prisma migrate dev

# Seed the database (optional)
bunx prisma db seed
```

5. Start the development server:
```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Development

### Available Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run ESLint
- `bun run test` - Run tests
- `bun run test:e2e` - Run end-to-end tests

### Code Quality

This project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** with strict mode
- **Jest** for unit testing
- **Playwright** for E2E testing

### Project Structure

```
src/
├── app/              # Next.js App Router pages & API routes
├── lib/             # Core business logic
│   ├── services/    # Business logic layer
│   ├── managers/    # Data access layer
│   └── utils/       # Utility functions
├── components/      # React components
├── types/          # TypeScript type definitions
└── middleware.ts   # Next.js middleware
```

## Documentation

<!-- - [Technical Architecture](docs/technical/) -->
- [API Patterns](docs/technical/api-patterns.md)
- [Database Schema](docs/technical/database-schema.md)
- [Security Guidelines](docs/technical/security-guidelines.md)

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Alternative Deployment

The platform can also be deployed to Railway or DigitalOcean App Platform with similar ease.

## Contributing

1. Ensure all tests pass
2. Follow the established code patterns and architecture
3. Update documentation as needed

## Security

This platform implements security best practices including:
- Input validation at all layers
- JWT-based authentication
- Rate limiting
- CORS configuration
- SQL injection prevention
- XSS protection

## License

This project is licensed under the MIT License.
