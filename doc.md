# Desk4U Coworking Space Website Documentation

This document provides an overview of the Desk4U Coworking Space Website, its features, and the technologies used.

## Project Overview

The Desk4U Coworking Space Website is an online platform designed to facilitate the booking and management of coworking spaces. It provides a seamless experience for users to browse available workspace types, book slots, and manage their reservations. Administrators have access to a dedicated dashboard for managing bookings, users, and dynamic content.

## Key Features

*   **Workspace Booking**: Users can book various workspace types (e.g., hot desks, private offices) for different durations (hourly, daily, weekly, monthly).
*   **Real-time Availability**: The booking system checks for real-time availability of desks to prevent overbooking.
*   **User Authentication**: Secure login and registration for customers and administrators.
*   **Admin Dashboard**: A comprehensive dashboard for administrators to:
    *   View and manage all bookings.
    *   Confirm or reject pending bookings.
    *   Create bookings on behalf of customers.
    *   Manage site-wide settings (e.g., total desks, hourly slots).
*   **Content Management System (CMS)**: Allows administrators to dynamically update various textual and media content across the website without code changes.
*   **Responsive Design**: The website is designed to be fully responsive and accessible on various devices (desktops, tablets, mobile phones).
*   **Contact and About Pages**: Informative sections providing details about the coworking space, its values, team, and contact information.
*   **Pricing Plans**: Detailed display of different pricing plans and add-on services.

## Technologies Used

*   **Frontend**:
    *   **React**: A JavaScript library for building user interfaces.
    *   **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript.
    *   **Tailwind CSS**: A utility-first CSS framework for rapidly building custom designs.
    *   **Vite**: A fast build tool that provides a lightning-fast development experience.
    *   **React Router DOM**: For declarative routing in React applications.
    *   **Lucide React**: A collection of open-source icons.
    *   **React Hot Toast**: For simple and customizable toast notifications.
*   **Backend**:
    *   **Supabase**: An open-source Firebase alternative providing:
        *   **PostgreSQL Database**: For storing all application data (bookings, workspace types, users, content, settings).
        *   **Authentication**: User management and authentication services.
        *   **Edge Functions**: For server-side logic (though not extensively used in this basic setup, it's available).
*   **Deployment**:
    *   **Netlify**: For continuous deployment and hosting of the frontend application.

## Getting Started (Development)

To run this project locally, you'll need to:

1.  **Install Dependencies**: Navigate to the project root in your terminal and run `npm install`.
2.  **Environment Variables**: Set up your Supabase project and obtain your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. These should be configured as environment variables in your development environment.
3.  **Run Development Server**: Execute `npm run dev` to start the development server. The application will typically be available at `http://localhost:5173`.

For database setup and further configuration, refer to the Supabase documentation and the project's `src/lib/supabase.ts` file.
