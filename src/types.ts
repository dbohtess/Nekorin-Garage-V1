export interface Vehicle {
  id: string;
  userId: string;
  make: string;
  model: string;
  year: number;
  color: string;
  engine: string;
  powerHp: number;
  torqueNm: number;
  zeroToSixty: number;
  imageUrl: string;
  status: 'active' | 'modding' | 'maintenance' | 'tuning';
  createdAt: number;
}

export interface FuelLog {
  id: string;
  date: string;
  odometer: number;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  fuelGrade: '91' | '95' | '98' | 'Diesel';
  createdAt: number;
}

export interface MaintenanceLog {
  id: string;
  title: string;
  date: string;
  cost: number;
  odometer: number;
  notes: string;
  completed: boolean;
  createdAt: number;
}

export interface VehicleDocument {
  id: string;
  title: string;
  docNumber: string;
  issueDate: string;
  expiryDate: string;
  owner: string;
  category: 'insurance' | 'registration' | 'license';
  notes: string;
  createdAt: number;
}

export interface ModLog {
  id: string;
  vehicleId: string;
  title: string;
  category: 'Engine' | 'Suspension' | 'Exhaust' | 'Brakes' | 'Exterior' | 'Interior' | 'Maintenance';
  cost: number;
  hpGain: number;
  notes: string;
  date: string;
  createdAt: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  garageName: string;
}

export interface FuelPrices {
  super98: number;
  special95: number;
  eplus91: number;
  diesel: number;
  month: string;
  year: string;
  updatedAt: number;
}

