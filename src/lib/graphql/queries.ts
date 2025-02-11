import { gql } from "@apollo/client";

export const GET_HORARIOS = gql`
  query getAllocations($contextId: ID!) {
    allocations(contextId: $contextId) {
      startTime
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
    }
  }
`;

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