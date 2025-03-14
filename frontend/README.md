# TimeTrack Frontend

This is the frontend application for TimeTrack, a project time tracking system built with React, TypeScript, and Vite.

## Features

- View a list of all projects
- Start time tracking for a project
- Stop time tracking for a project
- Visual indication of active projects
- Type-safe development with TypeScript
- Fast development experience with Vite

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```
   cd frontend
   ```
3. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

### Running the Application

Start the development server:

```
npm run dev
```
or
```
yarn dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Building for Production

Build the application for production:

```
npm run build
```
or
```
yarn build
```

The built files will be in the `dist` directory.

### Environment Variables

Create a `.env` file in the frontend directory with the following variables:

```
VITE_API_URL=http://localhost:8080/api
```

Adjust the URL according to your backend configuration.

## Technologies Used

- React
- TypeScript
- Vite (build tool)
- React Router
- Axios for API requests
- CSS for styling 