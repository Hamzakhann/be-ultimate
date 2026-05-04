# 🚀 FintechPlus Frontend

A professional, high-performance fintech dashboard built with Next.js 15, Tailwind CSS, and TanStack Query.

## 🏗️ Tech Stack
- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **State Management**: [TanStack Query v5](https://tanstack.com/query/latest)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **API Client**: [Axios](https://axios-http.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Toasts**: [Sonner](https://sonner.emilkowal.ski/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🚦 Getting Started

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Environment Setup
The app defaults to `http://localhost:3000/api/v1`. If your API Gateway is running elsewhere, create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://your-gateway-url/api/v1
```

### 3. Run Development Server
```bash
npm run dev
```
The dashboard will be available at [http://localhost:3001](http://localhost:3001) (or 3000 if backend is stopped).

## 🧩 Key Features
- **Smart Auth**: JWT persistence and automatic interceptors for secure API calls.
- **Wallet Control**: Real-time balance updates and transactional forms with Zod validation.
- **Activity Stream**: Direct integration with the Audit microservice to show security events.
- **Optimistic UI**: Transactions update the dashboard state immediately for a "snappy" feel.

## 📁 Structure
- `src/lib/api.ts`: Centralized Axios instance with auth interceptors.
- `src/hooks/useAuth.ts`: Custom hook for managing session and navigation.
- `src/app/dashboard/*`: Feature-rich pages integrated with backend microservices.
