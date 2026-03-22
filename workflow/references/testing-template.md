# {PROJECT_NAME} — Testing

## Test Command

```bash
{TEST_COMMAND}
```

## Strategy

- Unit tests for business logic
- Integration tests for API endpoints / data flows
- E2E tests for critical user journeys

## Conventions

- Test files live alongside source files (or in `tests/` directory)
- Name tests descriptively: `test_{what}_{condition}_{expected}`
- Each new feature must include tests before marking complete

## How to Add Tests

1. Identify what to test (happy path, edge cases, error cases)
2. Write test following existing patterns in the codebase
3. Run `{TEST_COMMAND}` to verify
4. Ensure no existing tests break
