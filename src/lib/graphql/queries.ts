import { gql } from "@apollo/client";

export const CREATE_CONSUMER = gql`
  mutation CreateConsumer($input: CreateConsumerInput!) {
    createConsumer(input: $input) {
      id
      firstName
      lastName
      email
      phoneNumber
    }
  }
`;

export const GET_BUNDLE_TYPES = gql`
  query BundleTypes {
    bundleTypes {
      id
      name
      price
    }
  }
`;

export const GET_FULL_SCHEDULE = gql`
  query GetFullSchedule($contextId: ID!) {
    allocations(contextId: $contextId) {
      id
      startTime
      endTime
      status
      currentReservations
      timeSlot {
        cron
        duration
        agent {
          name
        }
        sessionType {
          name
        }
      }
      reservations {
        id
        status
        forConsumer {
          id
          firstName
          lastName
          email
        }
      }
    }
  }
`;

export const SEARCH_CONSUMERS = gql`
  query SearchConsumers($query: String!, $limit: Int) {
    searchConsumers(query: $query, limit: $limit) {
      id
      firstName
      lastName
      email
      phoneNumber
    }
  }
`;

export const GET_CONSUMER = gql`
  query GetConsumer($id: ID!) {
    consumer(id: $id) {
      id
      firstName
      lastName
      email
      phoneNumber
      bundles {
        id
        status
        remainingUses
        bundleType {
          id
          name
          price
        }
        validFrom
        validTo
      }
      reservations {
        id
        createdAt
        updatedAt
        status
        bundle {
          id
          bundleType {
            name
          }
          remainingUses
        }
        allocation {
          startTime
          timeSlot {
            sessionType {
              name
            }
            agent {
              name
            }
          }
        }
      }
    }
  }
`;

export const UPDATE_RESERVATION_STATUS = gql`
  mutation UpdateReservation($id: ID!, $status: ReservationStatus!) {
    updateReservation(id: $id, input: { status: $status }) {
      id
      status
      forConsumer {
        fullName
      }
      allocation {
        startTime
        timeSlot {
          sessionType {
            name
          }
          agent {
            name
          }
        }
      }
    }
  }
`;

// Define the GraphQL queries and mutations
export const GET_POSSIBLE_ALLOCATIONS = gql`
  query GetPossibleAllocations(
    $contextId: ID!
    $startDate: DateTime!
    $endDate: DateTime!
  ) {
    possibleAllocations(
      contextId: $contextId
      startDate: $startDate
      endDate: $endDate
    ) {
      id
      startTime
      duration
      currentReservations
      timeSlot {
        id
        agent {
          name
        }
        sessionType {
          id
          name
          maxConsumers
        }
      }
    }
  }
`;

export const GET_BUNDLE_TYPE = gql`
  query GetBundleType($id: ID!) {
    bundleType(id: $id) {
      id
      name
      price
    }
  }
`;

export const CREATE_BUNDLE = gql`
  mutation CreateBundle($input: CreateBundleInput!) {
    createBundle(input: $input) {
      id
      status
      validFrom
      validTo
      remainingUses
      note
      bundleType {
        id
        name
        price
      }
    }
  }
`;

export enum BundleStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
  USED = "USED",
}

export const CREATE_ALLOCATION = gql`
  mutation CreateAllocation($input: CreateAllocationInput!) {
    createAllocation(input: $input) {
      id
      startTime
      endTime
      status
      currentReservations
      timeSlot {
        id
        agent {
          name
        }
        sessionType {
          name
          maxConsumers
        }
      }
    }
  }
`;

export const GET_ALLOCATION = gql`
  query GetAllocation($id: ID!) {
    allocation(input: { id: $id }) {
      id
      startTime
      endTime
      status
      currentReservations
      timeSlot {
        id
        agent {
          name
        }
        sessionType {
          name
          maxConsumers
          defaultDuration
        }
      }
    }
  }
`;

export const CREATE_RESERVATION = gql`
  mutation CreateReservation($input: CreateReservationInput!) {
    createReservation(input: $input) {
      id
      status
      allocation {
        startTime
        timeSlot {
          sessionType {
            name
          }
          agent {
            name
          }
        }
      }
      bundle {
        id
        remainingUses
      }
      forConsumer {
        id
        firstName
        lastName
        email
      }
    }
  }
`;

export const SEARCH_CONSUMER_BY_PHONE = gql`
  query SearchConsumerByPhone($phone: String!) {
    searchConsumerByPhone(phone: $phone) {
      id
      firstName
      lastName
      fullName
      email
      phoneNumber
      status
      bundles {
        id
        status
        validFrom
        validTo
        bundleType {
          id
          name
          price
        }
      }
    }
  }
`;

export const SEARCH_CONSUMER_BY_EMAIL = gql`
  query SearchConsumerByEmail($email: String!) {
    searchConsumerByEmail(email: $email) {
      id
      firstName
      lastName
      email
      phoneNumber
      bundles {
        id
        status
        remainingUses
        bundleType {
          id
          name
          price
        }
      }
    }
  }
`;

export const GET_BUNDLE = gql`
  query GetBundle($id: ID!) {
    bundle(id: $id) {
      id
      status
      validFrom
      validTo
      remainingUses
      note
      bundleType {
        id
        name
        price
      }
      consumer {
        id
        firstName
        lastName
        email
      }
    }
  }
`;

export const GET_BUNDLE_USAGES = gql`
  query GetBundleUsages($id: ID!) {
    bundle(id: $id) {
      id
      remainingUses
    }
  }
`;

export const GET_CONSUMER_RESERVATIONS = gql`
  query GetConsumerReservations($consumerId: ID!, $allocationId: ID!) {
    consumer(id: $consumerId) {
      reservations(where: { 
        timeSlot: {
          allocation: {
            id: $allocationId
          }
        }
      }) {
        id
        status
        timeSlot {
          id
          allocation {
            id
            startTime
            endTime
            status
          }
        }
      }
    }
  }
`;

export const CHECK_EXISTING_ALLOCATION = gql`
  query CheckExistingAllocation($timeSlotId: ID!, $startTime: DateTime!) {
    allocation(input: { timeSlotId: $timeSlotId, startTime: $startTime }) {
      id
      startTime
      endTime
      status
      timeSlot {
        id
        sessionType {
          name
          maxConsumers
        }
        agent {
          name
        }
      }
    }
  }
`;

export const CREATE_ALLOCATION_FROM_TIMESLOT = gql`
  mutation CreateAllocationFromTimeSlot($input: CreateAllocationInput!) {
    createAllocation(input: $input) {
      id
      startTime
      endTime
      status
      currentReservations
      timeSlot {
        id
        agent {
          name
        }
        sessionType {
          name
          maxConsumers
        }
      }
    }
  }
`;
