import { gql } from "@apollo/client";

export const GET_BUNDLE_TYPES = gql`
  query BundleTypes {
    bundleTypes {
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
          maxConsumers
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
			}
		}
	}
`;
