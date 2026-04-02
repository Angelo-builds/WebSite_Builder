import { Client, Account, Databases, Storage, ID, Query, Permission, Role } from 'appwrite';

export const appwriteConfig = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://api.angihomelab.com/v1',
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || '69b3402700309dc6660c',
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || '69b4036d001f9322929d',
  usersCollectionId: import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID || '69b40b450023d774f727',
  licensesCollectionId: import.meta.env.VITE_APPWRITE_LICENSES_COLLECTION_ID || '69b40b5d000ce0bf77eb',
  sitesCollectionId: import.meta.env.VITE_APPWRITE_SITES_COLLECTION_ID || '69b7b49e002e8aebabf6',
  assetsBucketId: import.meta.env.VITE_APPWRITE_ASSETS_BUCKET_ID || '69b9088300022cef1a0d',
  publishedSitesBucketId: import.meta.env.VITE_APPWRITE_PUBLISHED_SITES_BUCKET_ID || '69cb98690016a44f6d57',
};

export const client = new Client();

client
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export { ID, Query, Permission, Role };

export const getOwnerPermissions = (userId: string) => [
  Permission.read(Role.user(userId)),
  Permission.update(Role.user(userId)),
  Permission.delete(Role.user(userId)),
];
