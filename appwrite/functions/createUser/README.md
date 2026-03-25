# Create User Appwrite Function

This function is triggered by the `users.*.create` event in Appwrite. It automatically creates a corresponding document in the `users` collection when a new user signs up.

## Deployment

1. Make sure you have the Appwrite CLI installed and configured.
2. Initialize your Appwrite project if you haven't already: `appwrite init project`
3. Deploy the function: `appwrite deploy function`

## Environment Variables

You need to set the following environment variables in your Appwrite Function settings:

- `APPWRITE_FUNCTION_ENDPOINT`: Your Appwrite endpoint (e.g., `https://api.angihomelab.com/v1`)
- `APPWRITE_FUNCTION_PROJECT_ID`: Your Appwrite project ID
- `APPWRITE_FUNCTION_API_KEY`: An Appwrite API key with `documents.write` permission
- `DATABASE_ID`: The ID of your database
- `USERS_COLLECTION_ID`: The ID of your users collection

## Trigger

Set the function trigger to Event: `users.*.create`
