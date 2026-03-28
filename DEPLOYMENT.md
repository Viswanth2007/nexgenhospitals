# Nexgen Hospitals Deployment

This project is ready to deploy as a Node.js app with a MySQL database.

## Before You Deploy

1. Create a GitHub repository and upload this project.
2. Do not commit your real `.env` file.
3. Create an online MySQL database.

## Required Environment Variables

Set these in your hosting platform:

- `PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

You can use [.env.example](C:\Users\MVS VISWANTH\hospital-app\.env.example) as the template.

## Recommended Hosting

Use one of these:

- Render
- Railway
- VPS with Node.js + MySQL

## Render Setup

1. Push the project to GitHub.
2. Go to Render and create a new `Web Service`.
3. Connect your GitHub repository.
4. Use these settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add the environment variables from `.env.example`.
6. Deploy.

## Railway Setup

1. Push the project to GitHub.
2. Create a new Railway project from the GitHub repo.
3. Add a MySQL service or connect an external MySQL database.
4. Add the same environment variables.
5. Deploy the service.

## Important Notes

- The frontend now uses the same host origin automatically when deployed.
- If you deploy the backend and frontend together, one public URL is enough.
- Your MySQL database must allow connections from the hosting provider.
- If your local schema differs across tables, keep the production schema in sync before inviting users.

## After Deployment

Send your friends the deployed URL, for example:

- `https://nexgenhospitals.onrender.com`
- `https://nexgenhospitals.up.railway.app`

They will be able to use the site from other devices.
