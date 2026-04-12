# JudgeTracker

A React web application for tracking and analyzing judicial behavior in the United States. It provides transparency by indexing federal and state judges, their opinions, and judicial statistics using public records and open-licensed data (such as CourtListener).

## Tech Stack

- **Frontend:** React 19 with Create React App (CRA)
- **Routing:** React Router 7
- **Styling:** CSS3 (global + component styles)
- **Package Manager:** npm
- **Build Tool:** react-scripts (CRA)

## Project Structure

- `src/API/` — API integrations (CourtListener, mock API)
- `src/components/` — Reusable UI components (Header, Footer, JudgeCard, etc.)
- `src/pages/` — Page-level components (HomePage, JudgeSearchPage, JudgeProfilePage, AboutPage, WhichJudgeGamePage, DataSourcesPage)
- `src/data/` — Static sample data and quiz questions
- `src/security/` — Input validation and security helpers
- `src/media/` — Local image assets
- `public/` — Static HTML, icons, manifest

## Running the App

The app runs on port 5000 using:
```
PORT=5000 HOST=0.0.0.0 npm start
```

## Deployment

Configured as a static site deployment:
- Build command: `npm run build`
- Public directory: `build`
