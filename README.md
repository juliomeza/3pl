# Synapse3PL

This is a Next.js project bootstrapped with Firebase Studio, for a third-party logistics (3PL) software platform.

## Core Features

- **Logistics Overview Dashboard**: Displays a logistics overview, inventory, turnover rate, and shipments.
- **Shipment Creation and Tracking**: Enables creation of shipments with tracking and delivery notes.
- **Transaction Export**: Exports transaction data with attachments to a CSV file.
- **Smart Inbox**: Integrates a smart inbox that categorizes emails and attachments automatically, offering users file suggestions.
- **Secure File Vault**: Enables storage of files such as contracts and agreements.
- **AI Logistics Assistant**: An AI assistant tool that analyzes logistics data and provides tailored insights.
- **Order Tracking**: Provides tracking for orders.

## Style Guidelines:

- Primary color: Dark Blue (`#0A183C`), corresponding to HSL(224, 71.4%, 4.1%).
- Background color: Light Gray-Blue (`#FAFBFD`), corresponding to HSL(210, 20%, 98%).
- Accent color: Light Gray (`#F3F4F6`), corresponding to HSL(220, 14.3%, 95.9%).
- Headline font: 'Space Grotesk', sans-serif, for headlines and short amounts of body text; if longer text is anticipated, use this for headlines and 'Inter' for body
- Body font: 'Inter', a grotesque-style sans-serif with a modern, machined, objective, neutral look; suitable for headlines or body text
- Use minimalist icons to represent features and functions, aligning with a modern and clean UI. Consider using boxicons, feather or any icon sets under Apache license
- Maintain a clean and well-spaced layout using a grid system to ensure readability and ease of navigation.
- Implement subtle transitions and animations on interactive elements (buttons, links) to provide user feedback and enhance the overall experience.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- [Next.js](https://nextjs.org/) - React Framework
- [Firebase](https://firebase.google.com/) - Backend Platform
- [Tailwind CSS](https://tailwindcss.com/) - CSS Framework
- [Genkit](https://firebase.google.com/docs/genkit) - AI Framework
- [shadcn/ui](https://ui.shadcn.com/) - UI Components
