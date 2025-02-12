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
	query PossibleAllocations($contextId: ID!, $startDate: DateTime!, $endDate: DateTime!) {
		possibleAllocations(contextId: $contextId, startDate: $startDate, endDate: $endDate) {
			id
			startTime
			currentReservations 
			duration
      status
			timeSlot {
				id
				agent {
					id
					name
				}
			}
			sessionType {
				id
				name
				maxConsumers
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
  EXPENDED = "EXPENDED"
}