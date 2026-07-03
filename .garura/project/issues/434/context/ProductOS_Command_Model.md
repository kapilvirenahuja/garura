# ProductOS and Command Model

## Core Principle

Preserve: - Product Structure - Intent - Decisions

Generate everything else on demand.

------------------------------------------------------------------------

## ProductOS

### Product Model

``` yaml
Domain
  -> Capability
      -> Functionality
```

Example:

``` yaml
Order Management:
  Checkout:
    - Guest Checkout
    - One Click Checkout
```

### ICE Model

``` yaml
intent:
  goals: []
  constraints: []
  failures: []

context:
  users: []
  systems: []
  dependencies: []
  assumptions: []

expectations:
  outcomes: []
  metrics: []
  acceptance: []
```

### Decision Model

``` yaml
decision:
  title:
  reason:
  alternatives:
  status:
```

------------------------------------------------------------------------

## Commands

### Strategic

### /vision

Business Goal -\> Domain -\> Capability

Creates initial ProductOS node and seed ICE.

### /understand

Capability -\> Rich ICE

Expands: - Intent - Context - Expectations

### /shape

Capability + ICE -\> Functionality

Creates: - Functionalities - Personas - Journeys

### /roadmap

Prioritizes capabilities and investments.

### /learn

Updates ProductOS from real-world outcomes.

------------------------------------------------------------------------

## Realization

### /realize capability

Produces: - UX intent - Architecture intent - Delivery intent - Quality
intent

### /realize functionality

Produces: - Epics - Dependencies - Acceptance criteria

### /realize epic

Produces: - Stories - Tests - Implementation targets

------------------------------------------------------------------------

## Engineering

### /implement

Reads: - ProductOS - Repository

Writes: - Code - Tests - Documentation

### /validate

Checks implementation against expectations.

------------------------------------------------------------------------

## Maintenance

### /fix

Fix bugs without changing ProductOS.

### /refactor

Improve code without changing ProductOS.

### /operate

Handle runtime and production concerns.

------------------------------------------------------------------------

## Navigation

### /status

Show current ProductOS state.

### /next

Recommend highest-value next action.

------------------------------------------------------------------------

## Mental Model

``` text
CMO Goal
    ↓
ProductOS

Domain
  ↓
Capability
  ↓
Functionality

    +
   ICE

    ↓

Realization

    ↓

Repository

    ↓

Code
```

## Key Insight

ProductOS is maintained.

Specs are temporary.

Architecture is derived from: - Repository (brownfield) - Realization
(greenfield)

Agents consume: - ProductOS - Repository

Everything else is generated on demand.
