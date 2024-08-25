# Thebetabase

This project is a monorepo containing both frontend and backend applications.

## Project Structure

- Frontend: `/packages/fe/`
- Backend: `/packages/be/`

## Prerequisites

Before running the application, make sure you have the following installed:

- Node.js (preferably the latest LTS version)
- pnpm (Package manager used in this project)
- nx (Build system for monorepos)

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/SME-AOMA/betabase.git
   cd betabase
   ```

2. Install dependencies:
   ```
   pnpm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the project root directory.
   - Add the following environment variables to the `.env` file:

     ```
     DB_HOST=your_db_host
     DB_NAME=your_db_name
     DB_USER=your_db_user
     DB_PASSWORD=your_db_password

     PRODUCTION=true

     TWILIO_ACCOUNT_SID=your_twilio_account_sid
     TWILIO_AUTH_TOKEN=your_twilio_auth_token

     ```

   - Replace the placeholder values with your actual configuration.
   - Note: The `.env` file is included in `.gitignore` and should not be committed to version control.

## Running the Application Locally

To run both the frontend and backend:

1. Start the backend:
   ```
   npx nx serve be
   ```

2. In a new terminal, start the frontend:
   ```
   npx nx serve fe
   ```

3. Access the application in your browser at `http://localhost:4200` (or the port specified in the console output)

### Troubleshooting

- If you get 'Error: DB_HOST is not defined', ensure you've created the `.env` file in the project root and added the necessary environment variables.
- If you encounter a 404 error on the login page (`Failed to load resource: the server responded with a status of 404 (Not Found) :3000/api/auth/sign-in:1`), make sure both the frontend and backend are running and check your API endpoint configuration.

## Development

- Frontend code is located in `/packages/fe/src/`
- Backend code is located in `/packages/be/src/`

## Deployment

The application is deployed on Heroku. To deploy:

1. Go to https://dashboard.heroku.com/apps/betabase/deploy/heroku-git
2. Pull changes from GitHub
3. Push changes to the Heroku git repository (this should trigger the deployment)
4. Check the logs for deployment status:
   ```
   heroku logs --tail --app betabase
   ```

## Additional Information

For more detailed information about the project structure, available scripts, or contribution guidelines, please refer to the project documentation or contact a team member.

## Environment Variables

The `.env` file should contain the following configuration:

- Database connection details (DB_HOST, DB_NAME, DB_USER, DB_PASSWORD)
- PRODUCTION flag
- Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
- Zendesk API information (ZENDESK_DOMAIN, ZENDESK_EMAIL, ZENDESK_API_TOKEN)

Note: Be cautious with the sensitive information in the `.env` file. Do not share it publicly or commit it to version control.
