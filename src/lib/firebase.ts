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
  orderBy, 
  where, 
  setDoc, 
  getDoc 
} from 'firebase/firestore';
import { 
  getAuth, 
  onAuthStateChanged as firebaseOnAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  updateProfile 
} from 'firebase/auth';
import { Vehicle, FuelLog, MaintenanceLog, VehicleDocument, UserProfile, FuelPrices } from '../types';

const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: "AIzaSyD1W5X3LJNuVpiF6dhZfB-5wGwIOVY6OL4",
  authDomain: "nekorin-garage-v1.firebaseapp.com",
  projectId: "nekorin-garage-v1",
  storageBucket: "nekorin-garage-v1.firebasestorage.app",
  messagingSenderId: "673496496137",
  appId: "1:673496496137:web:67b3ae003f744f2c3360d8",
  measurementId: "G-PX36KG0CG0"
};

// Check if we have valid Firebase config
const hasFirebaseConfig = true;

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
  async signUp(email: string, password: string, displayName: string, garageName: string): Promise<UserProfile> {
    if (!auth || !db) {
      throw new Error('Firebase integration is not initialized. Please configure VITE_FIREBASE_* environment variables.');
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await updateProfile(user, { displayName });

    const profile: UserProfile = {
      uid: user.uid,
      email: user.email || email,
      displayName: displayName || user.email?.split('@')[0] || '',
      garageName: garageName || `${displayName || 'Nekorin'}'s Garage`,
    };

    await setDoc(doc(db, 'users', user.uid), profile);

    // Create a default vehicle for this user
    const defaultVehicle: Vehicle = {
      id: 'altima-' + user.uid,
      userId: user.uid,
      make: 'Nissan',
      model: 'Altima 2014',
      year: 2014,
      color: 'White',
      engine: '2.5L I4 (QR25DE)',
      powerHp: 182,
      torqueNm: 244,
      zeroToSixty: 7.7,
      imageUrl: '/input_file_2.png',
      status: 'active',
      createdAt: Date.now(),
    };
    await setDoc(doc(db, 'vehicles', defaultVehicle.id), defaultVehicle);

    this.currentUserProfile = profile;
    this.triggerAuthChange(profile);
    return profile;
  }

  async signIn(email: string, password: string): Promise<UserProfile> {
    if (!auth || !db) {
      throw new Error('Firebase integration is not initialized. Please configure VITE_FIREBASE_* environment variables.');
    }
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const docSnap = await getDoc(doc(db, 'users', user.uid));
      let profile: UserProfile;
      if (docSnap.exists()) {
        profile = docSnap.data() as UserProfile;
      } else {
        profile = {
          uid: user.uid,
          email: user.email || email,
          displayName: user.displayName || email.split('@')[0],
          garageName: 'Nekorin Garage',
        };
        await setDoc(doc(db, 'users', user.uid), profile);
      }
      
      this.currentUserProfile = profile;
      this.triggerAuthChange(profile);
      return profile;
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        try {
          return await this.signUp(email, password, email.split('@')[0], 'Nekorin Garage');
        } catch (signUpErr) {
          throw error;
        }
      }
      throw error;
    }
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

  // --- Vehicles API ---
  async getVehicles(userId: string): Promise<Vehicle[]> {
    if (!db) return [];
    try {
      const q = query(collection(db, 'vehicles'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        const defaultVehicle: Vehicle = {
          id: 'altima-' + userId,
          userId: userId,
          make: 'Nissan',
          model: 'Altima 2014',
          year: 2014,
          color: 'White',
          engine: '2.5L I4 (QR25DE)',
          powerHp: 182,
          torqueNm: 244,
          zeroToSixty: 7.7,
          imageUrl: '/input_file_2.png',
          status: 'active',
          createdAt: Date.now(),
        };
        await setDoc(doc(db, 'vehicles', defaultVehicle.id), defaultVehicle);
        return [defaultVehicle];
      } else {
        const vehicles: Vehicle[] = [];
        snapshot.forEach((docSnap) => {
          vehicles.push({ id: docSnap.id, ...docSnap.data() } as Vehicle);
        });
        return vehicles;
      }
    } catch (error) {
      console.error('Error fetching vehicles from Firestore:', error);
      return [];
    }
  }

  // --- Fuel Logs API ---
  async getFuelLogs(): Promise<FuelLog[]> {
    if (!db) return [];
    const userId = auth?.currentUser?.uid || this.currentUserProfile?.uid;
    if (!userId) return [];

    try {
      const q = query(
        collection(db, 'fuel_logs'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
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
      return logs;
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
    await deleteDoc(doc(db, 'fuel_logs', id));
  }

  async updateFuelLog(id: string, updatedFields: Partial<Omit<FuelLog, 'id' | 'createdAt'>>): Promise<FuelLog> {
    if (!db) throw new Error('Firestore is not initialized');
    const docRef = doc(db, 'fuel_logs', id);
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
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
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
      return logs;
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
    const docSnap = await getDoc(docRef);
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
    await deleteDoc(doc(db, 'maintenance_logs', id));
  }

  async updateMaintenanceLog(id: string, updatedFields: Partial<Omit<MaintenanceLog, 'id' | 'createdAt'>>): Promise<MaintenanceLog> {
    if (!db) throw new Error('Firestore is not initialized');
    const docRef = doc(db, 'maintenance_logs', id);
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
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
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
      return docsList;
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
    await deleteDoc(doc(db, 'documents', id));
  }

  async updateDocument(id: string, updatedFields: Partial<Omit<VehicleDocument, 'id' | 'createdAt'>>): Promise<VehicleDocument> {
    if (!db) throw new Error('Firestore is not initialized');
    const docRef = doc(db, 'documents', id);
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
    if (!db) return null;
    try {
      const docSnap = await getDoc(doc(db, 'app_config', 'fuel_prices'));
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
    if (!db) throw new Error('Firestore is not initialized');
    try {
      await setDoc(doc(db, 'app_config', 'fuel_prices'), {
        ...prices,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error('Error saving fuel prices to Firestore:', error);
      throw error;
    }
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
