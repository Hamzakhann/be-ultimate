# NestJS Microservices Testing Guide

This guide outlines the strategy and steps for testing services within our Fintech Monorepo.

## 1. Testing Strategy

### Unit Testing (Primary Focus)
- **Goal**: Test individual services/components in isolation.
- **Scope**: Core logic, service methods, validation.
- **Tooling**: Jest, `@nestjs/testing`.
- **Mocking**: Mock ALL external dependencies (DB Repositories, Kafka, gRPC, Redis).
- **Benefit**: Extremely fast, reliable, and helps identify logic bugs early.

### Integration Testing
- **Goal**: Test the interaction between a service and its database or a mock of an external service.
- **Scope**: Repository methods, complex queries, data integrity.
- **Benefit**: Ensures that the data layer is correctly configured.

### End-to-End (E2E) Testing
- **Goal**: Test the entire system from the API Gateway down to the microservices.
- **Scope**: User flows (e.g., Register -> Login -> Transfer).
- **Tooling**: Supertest, Jest.
- **Benefit**: Validates that all pieces of the architecture work together correctly.

## 2. Steps to Test a New Service

### Step 1: Create the `.spec.ts` file
Create a file named `your-service.service.spec.ts` in the same directory as your service.

### Step 2: Set up the Testing Module
Use `Test.createTestingModule` to define the providers. Mock any injected tokens.

```typescript
const module: TestingModule = await Test.createTestingModule({
  providers: [
    YourService,
    { provide: getRepositoryToken(YourEntity), useValue: mockRepo },
    { provide: 'EXTERNAL_CLIENT', useValue: mockClient },
  ],
}).compile();
```

### Step 3: Mock Dependencies
Use `jest.fn()` to mock methods of the external clients.
- For TypeORM: Mock `save`, `findOne`, `create`, `createQueryBuilder`.
- For Kafka: Mock `emit`.
- For gRPC: Mock `getService` and the subsequent service methods (returning `of()` or `throwError()`).

### Step 4: Write Test Cases
Follow the **Arrange-Act-Assert** pattern:
1. **Arrange**: Set up the mocks to return the desired values.
2. **Act**: Call the service method.
3. **Assert**: Verify the result and check that mocks were called with expected parameters.

## 3. Best Practices
- **Isolate Transactions**: When testing code with `QueryRunner`, mock the transaction lifecycle (`connect`, `startTransaction`, `commitTransaction`, `rollbackTransaction`).
- **Test Edge Cases**: Always include tests for negative scenarios (e.g., insufficient funds, invalid inputs).
- **Maintain High Coverage**: Aim for 100% coverage on core financial logic.
- **Use root-level scripts**: Run `npm run test` from the root to verify the entire monorepo.

## 4. Running Tests
- **All tests**: `npm run test`
- **Watch mode**: `npm run test:watch`
- **Coverage**: `npm run test:cov`
