import { Client, Account, Databases, Storage, Avatars } from 'appwrite';

export const appwriteConfig = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || '',
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || '',
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || '',
  usersCollectionId: import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID || '',
  licensesCollectionId: import.meta.env.VITE_APPWRITE_LICENSES_COLLECTION_ID || '',
};

const client = new Client();

if (appwriteConfig.endpoint && appwriteConfig.projectId) {
  client
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId);
}

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const avatars = new Avatars(client);
