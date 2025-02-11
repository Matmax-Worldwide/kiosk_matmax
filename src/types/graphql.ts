export interface Agent {
    name: string;
  }
  
  export interface SessionType {
    id: string;
    name: string;
    agent?: Agent;
    maxConsumers: number;
    defaultDuration: number;
    description?: {
      en: string;
      es: string;
    };
    expertiseLevel?: string;
  }
  
  export interface Room {
    name: string;
    capacity: number;
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
    room?: Room;
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
    id: string;
    name: string;
    price: number;
    currency: string;
    numberOfClasses: number;
    usagePeriod: number;
  }

  export interface GetBundleQuery {
    bundleTypes: BundleType[];
  }

  export interface GetPossibleAllocationsQuery {
    possibleAllocations: Allocation[];
  }
  
  