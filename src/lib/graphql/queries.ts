import { gql } from "@apollo/client";

export const GET_HORARIOS = gql`
  query getAllocations($contextId: ID!) {
    allocations(contextId: $contextId) {
      startTime
      status
      currentReservations
      timeSlot {
        id
        cron
        duration
        agent {
          name
        }
        sessionType {
          name
        }
      }
    }
  }
`;
