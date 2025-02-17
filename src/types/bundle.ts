export interface Bundle {
  id: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'EXPENDED';
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