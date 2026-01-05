# Dental Clinic Web App (Frontend)

A modern single-page web application for managing a dental clinic workflow:
appointments, patients, and an internal panel for staff.

> This repository contains the **frontend** (React + Vite).  
> Backend API is a separate repository.

---

## Features

- Public pages:
  - Appointment view (weekly calendar)
- Staff panel (JWT protected):
  - Login
  - Patient list + search
  - Patient detail & notes
  - Tooth treatment tracking (done / not done)
  - Appointment management

---

## Tech Stack

- React (SPA)
- Vite
- Fetch API
- CSS (custom UI)

---

## Project Structure (high level)

- `src/pages` – main screens (appointments, patients, panel, login)
- `src/components` – reusable UI components (navbar, etc.)
- `src/utils` – auth/token helpers, API helpers

---

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_BASE=http://localhost:8080
