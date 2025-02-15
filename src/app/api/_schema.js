const schema = `#graphql
type Query {
  agency(id: ID!): Agency
  agencies(status: AgencyStatus): [Agency!]!

  getAllocationBySessionTypeTimeSlot(sessionTypeId: String, timeSlotId: String): [Allocation!]!

  agent(id: ID!): Agent
  agents(status: AgentStatus): [Agent!]!

  context(id: ID!): Context
  contexts(agencyId: ID!): [Context!]!

  timeSlot(id: ID!): TimeSlot
  timeSlots(agentId: ID, contextId: ID, sessionTypeId: ID): [TimeSlot!]!
  nextTimeSlot(contextId: String!, currentTime: DateTime!): TimeSlot

  allocation(input: AllocationInput): Allocation
  allocations(contextId: ID!, status: AllocationStatus): [Allocation!]!
  possibleAllocations(
    contextId: ID!
    startDate: DateTime!
    endDate: DateTime!
  ): [Allocation!]!

  sessionType(id: ID!): SessionType
  sessionTypes: [SessionType!]!
  session(id: ID!): Session
  sessions(agentId: ID, status: SessionStatus): [Session!]!

  consumer(id: ID!): Consumer
  consumers(filters: ConsumerFilters, orderBy: ConsumerOrderBy): [Consumer!]!
  consumersWithReservations: [Consumer!]!
  searchConsumers(query: String!, limit: Int = 10): [Consumer!]!
  searchTags(query: String!): [TagWithCount!]!

  bundle(id: ID!): Bundle
  bundles(consumerId: ID!, status: BundleStatus): [Bundle!]!
  bundleType(id: ID!): BundleType
  bundleTypes: [BundleType!]!
  
  reservation(id: ID!): Reservation
  reservations: [Reservation!]!
  groupReservation(id: ID!): GroupReservation
  groupReservations: [GroupReservation!]!

  paymentLinks: [PaymentLink!]!
  paymentLink(id: ID!): PaymentLink
  paymentLinkByUrl(url: String!): PaymentLink
}

type Mutation {
  createAgency(input: CreateAgencyInput!): Agency!
  updateAgency(id: ID!, input: UpdateAgencyInput!): Agency!
  createAgent(input: CreateAgentInput!): Agent!
  updateAgent(id: ID!, input: UpdateAgentInput!): Agent!
  createContext(input: CreateContextInput!): Context!
  updateContext(id: ID!, input: UpdateContextInput!): Context!
  createTimeSlot(input: CreateTimeSlotInput!): TimeSlot!
  updateTimeSlot(id: ID!, input: UpdateTimeSlotInput!): TimeSlot!
  createAllocation(input: CreateAllocationInput!): Allocation!
  updateAllocation(id: ID!, input: UpdateAllocationInput!): Allocation!
  createSessionType(input: CreateSessionTypeInput!): SessionType!
  updateSessionType(id: ID!, input: UpdateSessionTypeInput!): SessionType!
  createSession(input: CreateSessionInput!): Session!
  updateSession(id: ID!, input: UpdateSessionInput!): Session!
  createConsumer(input: CreateConsumerInput!): Consumer!
  updateConsumer(id: ID!, input: UpdateConsumerInput!): Consumer!
  softDeleteConsumer(id: ID!): Consumer
  addTag(consumerId: ID!, tagName: String!): Consumer!
  removeTag(consumerId: ID!, tagName: String!): Consumer!
  createBundle(input: CreateBundleInput!): Bundle!
  updateBundle(id: ID!, input: UpdateBundleInput!): Bundle!
  extendBundle(bundleId: ID!, daysToExtend: Int!): Bundle!

  # Reservations
  createReservation(input: CreateReservationInput!): Reservation!
  updateReservation(id: ID!, input: UpdateReservationInput!): Reservation!
  deleteReservation(id: ID!): Reservation!
  deleteSession(id: ID!): Session!

  createGroupReservation(input: CreateGroupReservationInput!): GroupReservation!
  updateGroupReservation(id: ID!, input: UpdateGroupReservationInput!): GroupReservation!
  # -
  
  createWebhook(input: CreateWebhookInput!): Webhook!

  createPaymentLink(input: CreatePaymentLinkInput!): PaymentLink!
  updatePaymentLink(id: ID!, input: UpdatePaymentLinkInput!): PaymentLink!
  updatePaymentLinkStatus(id: ID!, status: PaymentLinkStatus!): PaymentLink!
  deletePaymentLink(id: ID!): Boolean!
}

type Agency {
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  status: AgencyStatus!
  name: String!
  address: String!
  timezone: String!
  contexts: [Context!]!
  agentSessionTypeAgencies: [AgentSessionTypeAgency!]!
}

type Agent {
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!

  name: String!
  status: AgentStatus!

  timeSlots: [TimeSlot!]!
  agentSessionTypeAgencies: [AgentSessionTypeAgency!]!
  sessions: [Session!]!
  altSessionAgents: [AltSessionAgent!]!
}

type AgentSessionTypeAgency {
  createdAt: DateTime!
  updatedAt: DateTime!
  agent: Agent!
  sessionType: SessionType!
  agency: Agency!
}

type Context {
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  name: String!
  capacity: Int!
  agency: Agency!
  parentContext: Context
  children: [Context!]!
  timeSlots: [TimeSlot!]!
}

type TimeSlot {
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!

  cron: String!
  startYear: Int!
  endYear: Int!

  isRecurring: Boolean!
  duration: Int!

  agentId: String
  agent: Agent
  context: Context!

  sessionType: SessionType!
  allocations: [Allocation!]!
}

type Allocation {
  id: ID
  createdAt: DateTime!
  updatedAt: DateTime!

  startTime: DateTime!
  endTime: DateTime!

  duration: Int
  status: AllocationStatus!
  currentReservations: Int!
  note: String

  timeSlot: TimeSlot!
  sessionType: SessionType!

  sessions: [Session!]!
  reservations: [Reservation!]!
  groupReservations: [GroupReservation!]!
}

type SessionType {
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!

  name: String!

  minAgents: Int!
  maxAgents: Int!
  minConsumers: Int!
  maxConsumers: Int!
  defaultDuration: Int!

  agent: Agent!

  allocations: [Allocation!]!
  timeSlots: [TimeSlot!]!
  agentSessionTypeAgencies: [AgentSessionTypeAgency!]!
}

type Session {
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  status: SessionStatus!
  agent: Agent!
  allocation: Allocation
  sessionConsumers: [SessionConsumer!]!
}

type AltSessionAgent {
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  type: String!
  agent: Agent!
  session: Session!
}

type Consumer {
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!

  firstName: String!
  lastName: String!
  fullName: String!  # Computed field

  email: String!
  phoneNumber: String
  dateOfBirth: DateTime
  status: ConsumerStatus!
  address: String
  isDeleted: Boolean!
  deletedAt: DateTime
  tags: [Tag!]!
  sessionConsumers: [SessionConsumer!]!
  bundles(statuses: [BundleStatus!]): [Bundle!]!
  reservations: [Reservation!]!
}

input ConsumerFilters {
  includeDeleted: Boolean
  statuses: [ConsumerStatus!]
  tags: [String!]
}

type TagWithCount {
  id: ID!
  name: String!
  count: Int!
}

input ConsumerOrderBy {
  field: ConsumerOrderField!
  direction: OrderDirection!
}

enum ConsumerOrderField {
  firstName
  lastName
  email
}

enum OrderDirection {
  asc
  desc
}

input AddressInput {
  street: String!
  city: String!
  state: String!
  postalCode: String!
  country: String!
}

enum ConsumerStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

type Tag {
  id: ID!
  name: String!
}

type Address {
  street: String!
  city: String!
  state: String!
  postalCode: String!
  country: String!
}

type SessionConsumer {
  createdAt: DateTime!
  updatedAt: DateTime!
  session: Session!
  consumer: Consumer
}

type Bundle {
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!

  status: BundleStatus!
  validFrom: DateTime!
  validTo: DateTime!

  isExtended: Boolean

  bundleType: BundleType

  remainingUses: Int
  totalUses: Int

  note: String

  consumer: Consumer!

  parentBundle: Bundle
  children: [Bundle!]!
  
  reservations: [Reservation!]!
  bundleUsageEvents: [BundleUsageEvent!]!
}

type BundleType {
  id: ID!
  name: String
  price: Int
}

type BundleUsageEvent {
  id: ID!
  createdAt: DateTime!
  bundle: Bundle!
  reservation: Reservation!
  type: BundleUsageEventType!
  quantity: Int!
}

type Reservation {
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!

  status: ReservationStatus!

  bundle: Bundle!
  allocation: Allocation!
  forConsumer: Consumer

  onBehalfOfName: String

  groupReservation: GroupReservation
  bundleUsageEvents: [BundleUsageEvent!]!
}

type GroupReservation {
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  note: String
  allocation: Allocation!
  reservations: [Reservation!]!
}

enum AgencyStatus {
  ACTIVE
  INACTIVE
}

enum AgentStatus {
  ACTIVE
  INACTIVE
}

enum AllocationStatus {
  AVAILABLE
  UNAVAILABLE
  CANCELLED
}

enum SessionStatus {
  CANCELLED
  ONGOING
  FINISHED
}

enum BundleUsageEventType {
  USE
  REFUND
  EXPIRE
  CANCEL
}

enum BundleStatus {
  ACTIVE
  EXPIRED
  CANCELLED
  EXPENDED
}

enum ReservationStatus {
  PENDING
  CONFIRMED
  VALIDATED
  CANCELLED
}

scalar DateTime

input CreateAgencyInput {
  name: String!
  address: String!
  timezone: String!
  status: AgencyStatus
}

input UpdateAgencyInput {
  name: String
  address: String
  timezone: String
  status: AgencyStatus
}

input CreateAgentInput {
  status: AgentStatus
}

input UpdateAgentInput {
  status: AgentStatus
}

input CreateContextInput {
  name: String!
  capacity: Int!
  agencyId: ID!
  parentContextId: ID
}

input UpdateContextInput {
  name: String
  capacity: Int
  parentContextId: ID
}

input CreateTimeSlotInput {
  cron: String!
  startYear: Int!
  endYear: Int!
  agentId: ID!
  contextId: ID!
  sessionTypeId: ID!
}

input UpdateTimeSlotInput {
  cron: String
  startYear: Int
  endYear: Int
}

input CreateAllocationInput {
  status: AllocationStatus
  note: String
  timeSlotId: ID!
  startTime: DateTime
}

input UpdateAllocationInput {
  startTime: DateTime
  endTime: DateTime
  status: AllocationStatus
  note: String
}

input CreateSessionTypeInput {
  name: String!
  minAgents: Int!
  maxAgents: Int!
  minConsumers: Int!
  maxConsumers: Int!
  defaultDuration: Int!
}

input UpdateSessionTypeInput {
  name: String
  minAgents: Int
  maxAgents: Int
  minConsumers: Int
  maxConsumers: Int
  defaultDuration: Int
}

input CreateSessionInput {
    status: String!
    agentId: ID!
    startTime: DateTime!
    timeSlotId: String!
    sessionConsumers: [SessionConsumerInput!]
}

input AltSessionAgentInput {
  type: String!     # Rol del agente en la sesión
  agentId: ID!      # ID del agente
}

input SessionConsumerInput {
  consumerId: ID! # ID del consumidor
}

input UpdateSessionInput {
  status: SessionStatus
}

input CreateConsumerInput {
  firstName: String!
  lastName: String!
  email: String!
  phoneNumber: String
  dateOfBirth: DateTime
  address: String
}

input UpdateConsumerInput {
  firstName: String
  lastName: String
  email: String
  phoneNumber: String
  dateOfBirth: DateTime
  address: String
}

input CreateBundleInput {
  status: BundleStatus
  validFrom: DateTime!
  validTo: DateTime!
  note: String
  consumerId: ID!
  parentBundleId: ID
  bundleTypeId: ID
}

input UpdateBundleInput {
  status: BundleStatus
  validFrom: DateTime
  validTo: DateTime
  note: String
}

input AllocationInput {
  id: ID,
  timeSlotId: ID,
  startTime: DateTime
}

input CreateReservationInput {
  bundleId: ID!

  allocationId: ID # Use when available, if not use startTime and timeSlotId

  startTime: DateTime # For when there is no allocation yet
  timeSlotId: ID # For when there is no allocation yet

  status: ReservationStatus
  
  forConsumerId: ID
  onBehalfOfName: String
  groupReservationId: ID
}

input UpdateReservationInput {
  status: ReservationStatus
  forConsumerId: ID
  onBehalfOfName: String
  groupReservationId: ID
}

input CreateGroupReservationInput {
  note: String
  allocationId: ID!
}

input UpdateGroupReservationInput {
  note: String
}

type Webhook {
  id: ID!
  event: String!
  url: String!
}

type WebhookLog {
  id: ID!
  createdAt: DateTime!
  status: String!
  payload: String!
  errorMessage: String
}

enum WebhookEventType {
  BUNDLE_CREATED
  BUNDLE_EXPIRED
  RESERVATION_CREATED
}

input CreateWebhookInput {
    event: WebhookEventType
    url: String!
  }

# Payment Links

enum PaymentLinkStatus {
  ACTIVE
  EXPIRED
  PAID
  CANCELLED
}

type PaymentLink {
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  name: String!
  description: String!
  amount: Int!
  url: String!
  status: PaymentLinkStatus!
  validFrom: DateTime
  expiresAt: DateTime
}

input CreatePaymentLinkInput {
  name: String!
  description: String!
  amount: Int!
  validFrom: DateTime
  expiresAt: DateTime
}

input UpdatePaymentLinkInput {
  name: String
  description: String
  amount: Int
  status: PaymentLinkStatus
  validFrom: DateTime
  expiresAt: DateTime
}

# type ApiKey {
#   key: String!
#   name: String!
#   tier: String!
#   createdAt: Float!
#   lastUsed: Float
#   enabled: Boolean!
# }

# extend type Mutation {
#   createApiKey(tier: String!, name: String!): ApiKey!
#   disableApiKey(key: String!): Boolean!
# }

# extend type Query {
#   listApiKeys: [ApiKey!]!
# }

`

export default schema;