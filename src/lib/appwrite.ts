import { Client, Account, Databases, Storage, Avatars, Permission, Role } from 'appwrite';

// 1. Centralizzazione Config: Endpoint e Project ID hardcoded
// Rimuoviamo i riferimenti a import.meta.env per queste due variabili.
// In questo modo non dipendiamo dal file .env per la distribuzione del frontend.
export const appwriteConfig = {
  endpoint: 'https://api.angihomelab.com/v1',
  projectId: 'YOUR_PROJECT_ID', // Sostituisci con il tuo vero Project ID
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || '',
  usersCollectionId: import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID || '',
  licensesCollectionId: import.meta.env.VITE_APPWRITE_LICENSES_COLLECTION_ID || '',
  sitesCollectionId: import.meta.env.VITE_APPWRITE_SITES_COLLECTION_ID || '',
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

// 2. Sicurezza dei Dati: Permessi a livello di documento (DLS)
// Funzione helper per generare i permessi in cui l'utente loggato è l'owner
export const getOwnerPermissions = (userId: string) => {
  return [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ];
};

// Esempio di salvataggio sicuro (da usare per siti, utenti, licenze)
export const saveDocumentSecurely = async (
  collectionId: string, 
  documentId: string, 
  data: any, 
  userId: string
) => {
  try {
    const permissions = getOwnerPermissions(userId);
    return await databases.createDocument(
      appwriteConfig.databaseId,
      collectionId,
      documentId,
      data,
      permissions
    );
  } catch (error) {
    console.error(`Errore durante il salvataggio sicuro nella collezione ${collectionId}:`, error);
    throw error;
  }
};

// 3. Gestione Piani: Funzione per controllare il piano dell'utente
export const checkUserPlan = async (userId: string): Promise<'free' | 'basic' | 'pro'> => {
  try {
    if (!appwriteConfig.databaseId || !appwriteConfig.licensesCollectionId) {
      console.warn('Database ID o Licenses Collection ID non configurati.');
      return 'free'; // Fallback
    }

    // Interroghiamo la collezione licenses cercando il documento associato all'utente
    // Assumiamo che il documentId della licenza sia uguale allo userId, 
    // oppure che ci sia un attributo 'userId' nel documento.
    // Qui usiamo getDocument assumendo che l'ID del documento sia l'ID utente.
    // Se usi un attributo, dovresti usare listDocuments con Query.equal('userId', userId)
    const licenseDoc = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.licensesCollectionId,
      userId
    );

    // Assumiamo che il documento abbia un attributo 'plan' o 'role'
    const plan = licenseDoc.plan || licenseDoc.role || 'free';
    return plan as 'free' | 'basic' | 'pro';
  } catch (error: any) {
    // Se il documento non esiste (es. errore 404), l'utente è 'free'
    if (error.code === 404) {
      return 'free';
    }
    console.error('Errore nel recupero del piano utente:', error);
    return 'free'; // Fallback in caso di errore
  }
};
