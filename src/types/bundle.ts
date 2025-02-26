export interface Bundle {
  id: string;
  status: BundleStatus;
  remainingUses: number;
  bundleType: {
    id: string;
    name: string;
    price: number;
  };
}

export interface BundleType {
  id: string;
  name: string;
  price: number;
} 

export interface BundleUsageEvent {
  id: string;
  bundleId: string;
  eventType: 'USE' | 'REFUND' | 'EXPIRE' | 'CANCEL';
  eventDate: Date;
}

export enum BundleUsageEventType {
  USE = 'USE',
  REFUND = 'REFUND',
  EXPIRE = 'EXPIRE',
  CANCEL = 'CANCEL',
}

export enum BundleStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  USED = 'USED',
}

