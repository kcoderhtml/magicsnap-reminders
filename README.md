# MagicSnap Reminders

This repo contains the cloudflare worker code for MagicSnap and handles renminders for users of event they have coming up.

## Getting Started
Clone the repository to your local machine.
Install the dependencies by running bun install.
## Development
To start the development server, run bun run dev. This will start the Wrangler development server.

## Deployment
To deploy the application, run bun run deploy. This will use Wrangler to deploy your application.

## Environment Variables
You need to set up the following environment variables:

- LOGSNAG_TOKEN: Your LogSnag token for logging and error tracking.
- EMAIL_API_TOKEN: Your email api token.
- TOKEN: The token used for authorization when fetching data from the API.
Please note that these environment variables should be kept secret and not committed to your repository. You can use a .env file to set these variables during development. Make sure to add .env to your .gitignore file to prevent it from being committed.

## Contributing
Contributions are welcome. Please open an issue or submit a pull request if you would like to contribute to the project.

## License
This repositories code is licensed with the AGPL-3.0 license and you can view it [here](/LICENSE.md)