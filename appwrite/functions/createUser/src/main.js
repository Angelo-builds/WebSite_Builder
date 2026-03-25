const sdk = require('node-appwrite');

function generateLicenseKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length));
    part2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `FREE-${part1}-${part2}`;
}

module.exports = async function (context) {
  const client = new sdk.Client();
  
  // You can remove services you don't use
  const databases = new sdk.Databases(client);

  if (
    !context.req.variables.APPWRITE_FUNCTION_ENDPOINT ||
    !context.req.variables.APPWRITE_FUNCTION_API_KEY
  ) {
    context.log('Environment variables are not set. Function cannot use Appwrite SDK.');
    return context.res.send('Environment variables are not set.', 500);
  }

  client
    .setEndpoint(context.req.variables.APPWRITE_FUNCTION_ENDPOINT)
    .setProject(context.req.variables.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(context.req.variables.APPWRITE_FUNCTION_API_KEY);

  const eventData = context.req.body;
  const userId = eventData.$id;
  const email = eventData.email;
  const name = eventData.name;

  const databaseId = context.req.variables.DATABASE_ID;
  const usersCollectionId = context.req.variables.USERS_COLLECTION_ID;
  const licensesCollectionId = context.req.variables.LICENSES_COLLECTION_ID;

  if (!databaseId || !usersCollectionId || !licensesCollectionId) {
    context.log('DATABASE_ID, USERS_COLLECTION_ID, or LICENSES_COLLECTION_ID is not set.');
    return context.res.send('Configuration missing.', 500);
  }

  try {
    const licenseKey = generateLicenseKey();

    // Create a new document in the licenses collection
    await databases.createDocument(
      databaseId,
      licensesCollectionId,
      sdk.ID.unique(),
      {
        key: licenseKey,
        userId: userId,
        plan: 'free',
        status: 'active',
        createdAt: new Date().toISOString()
      }
    );

    // Create a new document in the users collection
    await databases.createDocument(
      databaseId,
      usersCollectionId,
      userId, // Use the same ID as the auth user
      {
        email: email,
        name: name,
        role: 'user', // Default role
        plan: 'free', // Default plan
        licenseKey: licenseKey,
        createdAt: new Date().toISOString()
      }
    );

    context.log(`Successfully created user document and license for ${userId}`);
    return context.res.json({
      success: true,
      message: `User document and license created for ${userId}`,
      licenseKey: licenseKey
    });
  } catch (error) {
    context.error(`Failed to create user document or license: ${error.message}`);
    return context.res.json({
      success: false,
      message: error.message
    }, 500);
  }
};
