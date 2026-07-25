import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc, 
  query, 
  where, 
  setDoc, 
  getDoc 
} from 'firebase/firestore';
import { 
  getAuth, 
  onAuthStateChanged as firebaseOnAuthStateChanged, 
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { Vehicle, FuelLog, MaintenanceLog, VehicleDocument, UserProfile, FuelPrices } from '../types';

const assetUrl = (path: string) => `${(import.meta as any).env?.BASE_URL || '/'}${path.replace(/^\/+/, '')}`;

const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: metaEnv.VITE_FIREBASE_APP_ID,
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID,
};

const hasFirebaseConfig = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.storageBucket,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId,
].every(Boolean);

let app;
let db: ReturnType<typeof getFirestore> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;

if (hasFirebaseConfig) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    console.log('Firebase initialized successfully with project:', firebaseConfig.projectId);
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
  }
} else {
  console.warn('Firebase configuration is missing. Configure VITE_FIREBASE_* variables in AI Studio settings.');
}

class FirebaseService {
  private authCallbacks: ((user: UserProfile | null) => void)[] = [];
  private currentUserProfile: UserProfile | null = null;

  constructor() {
    this.initAuthListener();
  }

  private initAuthListener() {
    if (auth && db) {
      firebaseOnAuthStateChanged(auth, async (user) => {
        if (!user) {
          this.currentUserProfile = null;
          this.triggerAuthChange(null);
        } else {
          try {
            const docSnap = await getDoc(doc(db!, 'users', user.uid));
            if (docSnap.exists()) {
              this.currentUserProfile = docSnap.data() as UserProfile;
            } else {
              // Auto-create profile if missing
              const profile: UserProfile = {
                uid: user.uid,
                email: user.email || '',
                displayName: user.displayName || user.email?.split('@')[0] || 'سائق نيكورين',
                garageName: 'Nekorin Garage',
              };
              await setDoc(doc(db!, 'users', user.uid), profile);
              this.currentUserProfile = profile;
            }
            this.triggerAuthChange(this.currentUserProfile);
          } catch (error) {
            console.error('Error in auth state change fetching user profile:', error);
            // Fallback profile
            const fallbackProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || user.email?.split('@')[0] || 'سائق نيكورين',
              garageName: 'Nekorin Garage',
            };
            this.currentUserProfile = fallbackProfile;
            this.triggerAuthChange(fallbackProfile);
          }
        }
      });
    } else {
      setTimeout(() => {
        this.triggerAuthChange(null);
      }, 0);
    }
  }

  // --- Auth API ---
  async signInWithGoogle(): Promise<UserProfile | null> {
    if (!auth || !db) {
      throw new Error('Firebase integration is not initialized.');
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/i.test(userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isSafari = /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(userAgent);

    if (isIOS || isSafari) {
      await signInWithRedirect(auth, provider);
      return null;
    }

    try {
      const userCredential = await signInWithPopup(auth, provider);
      return this.getOrCreateUserProfile(userCredential.user);
    } catch (error: any) {
      if (
        error?.code === 'auth/popup-blocked'
        || error?.code === 'auth/operation-not-supported-in-this-environment'
      ) {
        await signInWithRedirect(auth, provider);
        return null;
      }
      throw error;
    }
  }

  private async getOrCreateUserProfile(user: { uid: string; email: string | null; displayName: string | null }): Promise<UserProfile> {
    if (!db) throw new Error('Firestore is not initialized');

    const userDocRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const profile = docSnap.data() as UserProfile;
      this.currentUserProfile = profile;
      this.triggerAuthChange(profile);
      return profile;
    }

    const profile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'سائق نيكورين',
      garageName: 'Nekorin Garage',
    };
    await setDoc(userDocRef, profile);
    this.currentUserProfile = profile;
    this.triggerAuthChange(profile);
    return profile;
  }

  async signOut(): Promise<void> {
    if (auth) {
      await firebaseSignOut(auth);
    }
    this.currentUserProfile = null;
    this.triggerAuthChange(null);
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUserProfile;
  }

  onAuthStateChanged(callback: (user: UserProfile | null) => void) {
    this.authCallbacks.push(callback);
    callback(this.currentUserProfile);
    return () => {
      this.authCallbacks = this.authCallbacks.filter(cb => cb !== callback);
    };
  }

  private triggerAuthChange(user: UserProfile | null) {
    this.authCallbacks.forEach(cb => cb(user));
  }

  private getAuthenticatedUserId(): string {
    const userId = auth?.currentUser?.uid;
    if (!db || !userId) throw new Error('User is not authenticated');
    return userId;
  }

  private async assertOwnedRecord(collectionName: string, id: string) {
    if (!db) throw new Error('Firestore is not initialized');
    const userId = this.getAuthenticatedUserId();
    const recordRef = doc(db, collectionName, id);
    const snapshot = await getDoc(recordRef);
    if (!snapshot.exists() || snapshot.data().userId !== userId) {
      throw new Error('Record not found or access denied');
    }
    return snapshot;
  }

  // --- Vehicles API ---
  async getVehicles(userId: string): Promise<Vehicle[]> {
    if (!db || auth?.currentUser?.uid !== userId) return [];

    const q = query(collection(db, 'vehicles'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const vehicles: Vehicle[] = [];
    snapshot.forEach((docSnap) => {
      vehicles.push({ id: docSnap.id, ...docSnap.data() } as Vehicle);
    });
    return vehicles;
  }

  async addVehicle(vehicle: Omit<Vehicle, 'id' | 'userId' | 'createdAt'>): Promise<Vehicle> {
    if (!db) throw new Error('Firestore is not initialized');
    const userId = this.getAuthenticatedUserId();
    const createdAt = Date.now();
    const docRef = await addDoc(collection(db, 'vehicles'), {
      ...vehicle,
      userId,
      createdAt,
    });
    return {
      ...vehicle,
      id: docRef.id,
      userId,
      createdAt,
    };
  }

  // --- Fuel Logs API ---
  async getFuelLogs(): Promise<FuelLog[]> {
    if (!db) return [];
    const userId = auth?.currentUser?.uid || this.currentUserProfile?.uid;
    if (!userId) return [];

    try {
      const q = query(
        collection(db, 'fuel_logs'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const logs: FuelLog[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        logs.push({
          id: docSnap.id,
          date: data.date,
          odometer: Number(data.odometer),
          liters: Number(data.liters),
          pricePerLiter: Number(data.pricePerLiter),
          totalCost: Number(data.totalCost),
          fuelGrade: data.fuelGrade,
          createdAt: data.createdAt || Date.now(),
        });
      });
      return logs.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('Error fetching fuel logs from Firestore:', error);
      return [];
    }
  }

  async addFuelLog(log: Omit<FuelLog, 'id' | 'createdAt'>): Promise<FuelLog> {
    if (!db) throw new Error('Firestore is not initialized');
    const userId = auth?.currentUser?.uid || this.currentUserProfile?.uid;
    if (!userId) throw new Error('User is not authenticated');

    const createdAt = Date.now();
    const docData = {
      ...log,
      userId,
      createdAt,
    };

    const docRef = await addDoc(collection(db, 'fuel_logs'), docData);
    return {
      ...log,
      id: docRef.id,
      createdAt,
    };
  }

  async deleteFuelLog(id: string): Promise<void> {
    if (!db) throw new Error('Firestore is not initialized');
    await this.assertOwnedRecord('fuel_logs', id);
    await deleteDoc(doc(db, 'fuel_logs', id));
  }

  async updateFuelLog(id: string, updatedFields: Partial<Omit<FuelLog, 'id' | 'createdAt'>>): Promise<FuelLog> {
    if (!db) throw new Error('Firestore is not initialized');
    const docRef = doc(db, 'fuel_logs', id);
    await this.assertOwnedRecord('fuel_logs', id);
    await updateDoc(docRef, updatedFields);
    
    const docSnap = await getDoc(docRef);
    const data = docSnap.data() || {};
    return {
      id,
      date: data.date || '',
      odometer: Number(data.odometer) || 0,
      liters: Number(data.liters) || 0,
      pricePerLiter: Number(data.pricePerLiter) || 0,
      totalCost: Number(data.totalCost) || 0,
      fuelGrade: data.fuelGrade || '95',
      createdAt: data.createdAt || Date.now(),
    };
  }

  // --- Maintenance Logs API ---
  async getMaintenanceLogs(): Promise<MaintenanceLog[]> {
    if (!db) return [];
    const userId = auth?.currentUser?.uid || this.currentUserProfile?.uid;
    if (!userId) return [];

    try {
      const q = query(
        collection(db, 'maintenance_logs'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const logs: MaintenanceLog[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        logs.push({
          id: docSnap.id,
          title: data.title,
          date: data.date,
          cost: Number(data.cost),
          odometer: Number(data.odometer),
          notes: data.notes || '',
          completed: Boolean(data.completed),
          createdAt: data.createdAt || Date.now(),
        });
      });
      return logs.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('Error fetching maintenance logs from Firestore:', error);
      return [];
    }
  }

  async addMaintenanceLog(log: Omit<MaintenanceLog, 'id' | 'createdAt'>): Promise<MaintenanceLog> {
    if (!db) throw new Error('Firestore is not initialized');
    const userId = auth?.currentUser?.uid || this.currentUserProfile?.uid;
    if (!userId) throw new Error('User is not authenticated');

    const createdAt = Date.now();
    const docData = {
      ...log,
      userId,
      createdAt,
    };

    const docRef = await addDoc(collection(db, 'maintenance_logs'), docData);
    return {
      ...log,
      id: docRef.id,
      createdAt,
    };
  }

  async toggleMaintenanceLog(id: string): Promise<MaintenanceLog> {
    if (!db) throw new Error('Firestore is not initialized');
    const docRef = doc(db, 'maintenance_logs', id);
    const docSnap = await this.assertOwnedRecord('maintenance_logs', id);
    if (!docSnap.exists()) {
      throw new Error('Maintenance log not found');
    }
    const currentStatus = Boolean(docSnap.data()?.completed);
    await updateDoc(docRef, { completed: !currentStatus });
    
    const updatedSnap = await getDoc(docRef);
    const data = updatedSnap.data() || {};
    return {
      id,
      title: data.title || '',
      date: data.date || '',
      cost: Number(data.cost) || 0,
      odometer: Number(data.odometer) || 0,
      notes: data.notes || '',
      completed: Boolean(data.completed),
      createdAt: data.createdAt || Date.now(),
    };
  }

  async deleteMaintenanceLog(id: string): Promise<void> {
    if (!db) throw new Error('Firestore is not initialized');
    await this.assertOwnedRecord('maintenance_logs', id);
    await deleteDoc(doc(db, 'maintenance_logs', id));
  }

  async updateMaintenanceLog(id: string, updatedFields: Partial<Omit<MaintenanceLog, 'id' | 'createdAt'>>): Promise<MaintenanceLog> {
    if (!db) throw new Error('Firestore is not initialized');
    const docRef = doc(db, 'maintenance_logs', id);
    await this.assertOwnedRecord('maintenance_logs', id);
    await updateDoc(docRef, updatedFields);
    
    const docSnap = await getDoc(docRef);
    const data = docSnap.data() || {};
    return {
      id,
      title: data.title || '',
      date: data.date || '',
      cost: Number(data.cost) || 0,
      odometer: Number(data.odometer) || 0,
      notes: data.notes || '',
      completed: Boolean(data.completed),
      createdAt: data.createdAt || Date.now(),
    };
  }

  // --- Vehicle Documents API ---
  async getDocuments(): Promise<VehicleDocument[]> {
    if (!db) return [];
    const userId = auth?.currentUser?.uid || this.currentUserProfile?.uid;
    if (!userId) return [];

    try {
      const q = query(
        collection(db, 'documents'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const docsList: VehicleDocument[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        docsList.push({
          id: docSnap.id,
          title: data.title,
          docNumber: data.docNumber,
          issueDate: data.issueDate,
          expiryDate: data.expiryDate,
          owner: data.owner,
          category: data.category,
          notes: data.notes || '',
          createdAt: data.createdAt || Date.now(),
        });
      });
      return docsList.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('Error fetching documents from Firestore:', error);
      return [];
    }
  }

  async addDocument(document: Omit<VehicleDocument, 'id' | 'createdAt'>): Promise<VehicleDocument> {
    if (!db) throw new Error('Firestore is not initialized');
    const userId = auth?.currentUser?.uid || this.currentUserProfile?.uid;
    if (!userId) throw new Error('User is not authenticated');

    const createdAt = Date.now();
    const docData = {
      ...document,
      userId,
      createdAt,
    };

    const docRef = await addDoc(collection(db, 'documents'), docData);
    return {
      ...document,
      id: docRef.id,
      createdAt,
    };
  }

  async deleteDocument(id: string): Promise<void> {
    if (!db) throw new Error('Firestore is not initialized');
    await this.assertOwnedRecord('documents', id);
    await deleteDoc(doc(db, 'documents', id));
  }

  async updateDocument(id: string, updatedFields: Partial<Omit<VehicleDocument, 'id' | 'createdAt'>>): Promise<VehicleDocument> {
    if (!db) throw new Error('Firestore is not initialized');
    const docRef = doc(db, 'documents', id);
    await this.assertOwnedRecord('documents', id);
    await updateDoc(docRef, updatedFields);
    
    const docSnap = await getDoc(docRef);
    const data = docSnap.data() || {};
    return {
      id,
      title: data.title || '',
      docNumber: data.docNumber || '',
      issueDate: data.issueDate || '',
      expiryDate: data.expiryDate || '',
      owner: data.owner || '',
      category: data.category || 'insurance',
      notes: data.notes || '',
      createdAt: data.createdAt || Date.now(),
    };
  }

  // --- Fuel Prices Configuration API ---
  async getFuelPrices(): Promise<FuelPrices | null> {
    if (!db || !auth?.currentUser) return null;
    try {
      const docSnap = await getDoc(doc(db, 'app_config', auth.currentUser.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          super98: Number(data.super98),
          special95: Number(data.special95),
          eplus91: Number(data.eplus91),
          diesel: Number(data.diesel),
          month: data.month || '',
          year: data.year || '',
          updatedAt: Number(data.updatedAt || Date.now()),
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching fuel prices from Firestore:', error);
      return null;
    }
  }

  async saveFuelPrices(prices: Omit<FuelPrices, 'updatedAt'>): Promise<void> {
    if (!db || !auth?.currentUser) throw new Error('User is not authenticated');
    try {
      await setDoc(doc(db, 'app_config', auth.currentUser.uid), {
        ...prices,
        userId: auth.currentUser.uid,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (error) {
      console.error('Error saving fuel prices to Firestore:', error);
      throw error;
    }
  }

  async getUserSettings(): Promise<{ syncDatabase: boolean; syncStorage: boolean; useMiles: boolean } | null> {
    if (!db || !auth?.currentUser) return null;
    const docSnap = await getDoc(doc(db, 'app_config', auth.currentUser.uid));
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
      syncDatabase: data.syncDatabase !== false,
      syncStorage: data.syncStorage !== false,
      useMiles: data.useMiles === true,
    };
  }

  async saveUserSettings(settings: { syncDatabase: boolean; syncStorage: boolean; useMiles: boolean }): Promise<void> {
    if (!db || !auth?.currentUser) throw new Error('User is not authenticated');
    await setDoc(doc(db, 'app_config', auth.currentUser.uid), {
      ...settings,
      userId: auth.currentUser.uid,
      updatedAt: Date.now(),
    }, { merge: true });
  }

  // --- Profile API ---
  async updateUserProfile(displayName: string, garageName: string): Promise<UserProfile> {
    if (!db || !auth?.currentUser) throw new Error('Firebase is not initialized or user is not logged in');
    const userId = auth.currentUser.uid;

    await updateProfile(auth.currentUser, { displayName });

    const userDocRef = doc(db, 'users', userId);
    const updatedFields = { displayName, garageName };
    await updateDoc(userDocRef, updatedFields);

    const updatedProfile: UserProfile = {
      uid: userId,
      email: auth.currentUser.email || '',
      displayName,
      garageName,
    };

    this.currentUserProfile = updatedProfile;
    this.triggerAuthChange(updatedProfile);
    return updatedProfile;
  }
}

export const firebaseService = new FirebaseService();
export default firebaseService;
