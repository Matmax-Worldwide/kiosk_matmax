# MatMax Application Flow Diagram

```mermaid
graph TD
    %% Main Nodes
    A[Home Page '/'] --> B[Book Now]
    A --> C[Buy Packages]
    A --> D[Check-in]
    
    %% Main Flow - Book Now
    B --> E[Class Pass '/class-pass']
    E --> F[User Selection '/user-selection']
    F --> G[Schedule '/schedule']
    G --> H[Payment '/payment']
    H --> I[Confirmation '/confirmation']
    
    %% Main Flow - Buy Packages
    C --> J[Buy Packages '/buy-packages']
    J --> F
    
    %% Main Flow - Check-in
    D --> K[Check-in '/check-in']
    
    %% Alternative Paths
    G --> F2[Back to User Selection]
    F2 --> G
    
    H --> G2[Back to Schedule]
    G2 --> H
    
    K --> L[Invalid Code]
    L --> K
    
    I --> M[Book Another Class]
    M --> G
    
    I --> N[Return Home]
    N --> A
    
    %% Error States & Validations
    H --> O[Payment Failed]
    O --> H
    
    F --> P[User Not Found]
    P --> Q[New Registration]
    Q --> F
    
    %% Success States
    I --> R[Go to Check-in]
    R --> K
    
    %% Styling
    classDef page fill:#f9f9f9,stroke:#333,stroke-width:2px;
    classDef current fill:#e6ffe6,stroke:#0d904f,stroke-width:2px;
    classDef error fill:#ffe6e6,stroke:#d04949,stroke-width:2px;
    classDef success fill:#e6ffe6,stroke:#49d049,stroke-width:2px;
    classDef alternative fill:#e6e6ff,stroke:#4949d0,stroke-width:2px;
    
    %% Apply Classes
    class A,B,C,D,E,F,G,H,I,J,K page;
    class A current;
    class O,P,L error;
    class R,M success;
    class F2,G2,N,Q alternative;
    
    %% Subgraphs for organization
    subgraph Main Flows
        direction LR
        S[Booking Flow]
        T[Package Purchase]
        U[Check-in Process]
    end
    
    subgraph Alternative Paths
        direction LR
        V[Back Navigation]
        W[Error Recovery]
        X[Success Actions]
    end
```

## Flow Description

1. **Home Page ('/')**
   - Main entry point
   - Three primary options: Book Now, Buy Packages, Check-in
   - Modern UI with animated transitions

2. **Book Now Flow**
   - Class Pass → User Selection → Schedule → Payment → Confirmation
   - Allows users to book individual classes
   - Alternative paths:
     - Back navigation between steps
     - Error handling for payment failures
     - User registration for new users

3. **Buy Packages Flow**
   - Buy Packages → User Selection → Payment → Confirmation
   - Purchase class packages and memberships
   - Shares user selection and payment flow with Book Now

4. **Check-in Flow**
   - Direct path to check-in for users with existing reservations
   - Alternative paths:
     - Invalid code handling
     - Direct access from confirmation page

5. **Alternative Paths**
   - Back navigation between any steps
   - Error recovery flows
   - Success action options:
     - Book another class
     - Return to home
     - Go to check-in

## Features

- Bilingual support (English/Spanish)
- Animated transitions between pages
- Responsive design
- Modern UI with Tailwind CSS
- GraphQL integration
- Prisma database
- Error handling and recovery
- Flexible navigation paths
- User session management 