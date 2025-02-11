export interface Agent {
    name: string;
  }
  
  export interface SessionType {
    name: string;
    agent?: Agent;
  }
  
  export interface TimeSlot {
    id: string;
    cron: string;
    startYear: number;
    endYear: number;
    isRecurring: boolean;
    duration: number;
    agentId?: string;
    agent?: Agent;
    sessionType: SessionType;
  }
  
  export interface Allocation {
    id: string;
    createdAt: string;
    updatedAt: string;
    startTime: string;
    endTime: string;
    duration: number;
    status: string;
    currentReservations: number;
    note?: string;
    timeSlot: TimeSlot;
    sessionType: SessionType;
  }
  
  export interface GetHorariosQuery {
    allocations: Allocation[];
  } 

  export interface BundleType {
    name: string;
    price: number;
  }

  export interface GetBundleQuery {
    bundleTypes: BundleType[];
  }
  
  