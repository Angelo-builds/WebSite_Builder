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
        plan: 'Starter',
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
        plan: 'Starter', // Default plan
        licenseKey: licenseKey,
        usedStorage: 0,
        createdAt: new Date().toISOString()
      }
    );

    // Create the Interactive Tutorial Project
    const tutorialHtml = `
      <header class="p-12 bg-[#3b82f6] text-white text-center font-sans">
        <h1 class="text-5xl font-bold mb-6 tracking-tight">Welcome to your first Blockra Site!</h1>
        <p class="text-xl mb-10 opacity-90 max-w-2xl mx-auto font-light">Let's learn how to build beautiful websites in minutes.</p>
      </header>
      <section class="p-12 bg-white text-[#161618] font-sans">
        <div class="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="p-8 border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
              <span class="bg-[#3b82f6] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
              Left Side
            </h2>
            <p class="text-gray-600 leading-relaxed">Use the Page Manager to add new pages.</p>
          </div>
          <div class="p-8 border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
              <span class="bg-[#3b82f6] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
              Right Side
            </h2>
            <p class="text-gray-600 leading-relaxed">Select any element to change colors, fonts, and layouts in the Style Manager.</p>
          </div>
        </div>
      </section>
      <section class="p-16 bg-[#f8fafc] text-center font-sans border-y border-gray-100">
        <h2 class="text-3xl font-bold mb-6 text-[#161618]">Interactive Area</h2>
        <p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">Try dragging a new Block from the '+' menu into this area!</p>
        <div class="min-h-[200px] border-2 border-dashed border-[#3b82f6]/30 rounded-2xl flex items-center justify-center bg-white">
           <span class="text-gray-400 font-medium">Drop blocks here</span>
        </div>
      </section>
      <footer class="p-8 bg-[#161618] text-white/80 text-center font-sans">
        <p class="text-lg">When ready, click <strong class="text-[#3b82f6]">PUBLISH</strong> to go live on Appwrite Storage.</p>
      </footer>
    `;

    const initialProjectData = {
      metadata: { description: 'Interactive Tutorial', category: 'Tutorial', templateHtml: tutorialHtml, updatedAt: new Date().toISOString(), sharedWith: [] },
      assets: [],
      styles: [],
      pages: [{ frames: [{ component: { type: 'wrapper', components: [] } }] }]
    };
    
    const initialCustomPages = [{ id: 'index', name: 'index', html: tutorialHtml, css: '' }];

    const sitesCollectionId = context.req.variables.SITES_COLLECTION_ID || '69b7b49e002e8aebabf6';

    await databases.createDocument(
      databaseId,
      sitesCollectionId,
      sdk.ID.unique(),
      {
        name: '🚀 Start Here: Welcome to Blockra',
        description: 'Interactive Tutorial',
        category: 'Tutorial',
        data: JSON.stringify(initialProjectData),
        pages: JSON.stringify(initialCustomPages),
        ownerId: userId,
        updatedAt: new Date().toISOString()
      },
      [
        sdk.Permission.read(sdk.Role.user(userId)),
        sdk.Permission.update(sdk.Role.user(userId)),
        sdk.Permission.delete(sdk.Role.user(userId)),
      ]
    );

    context.log(`Successfully created user document, license, and tutorial project for ${userId}`);
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
