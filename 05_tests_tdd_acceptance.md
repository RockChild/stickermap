# Tests, TDD, and Acceptance Criteria

## TDD philosophy
- Write failing tests first (unit в†’ integration в†’ E2E)
- Keep tests deterministic and fast
- CI must block merges on failing tests

## Example acceptance tests (Gherkin)

Feature: Publish board to map
  Scenario: Owner saves a board with one sticker and sets visibility to public
    Given I am authenticated as the board owner
    When I create a board titled "Coffee Ideas"
    And I add one sticker to the board
    And I set visibility to public
    And I save the board
    Then the board should be published
    And a map pin should exist at the city centroid
    And the map pin should show the board title and preview

Feature: Private board map behavior
  Scenario: Owner saves a board with visibility private
    Given I am authenticated as the board owner
    When I create a board and set visibility to private and save
    Then the map should show an anonymous pin with no title or preview

Feature: Premium edit grant
  Scenario: Owner invites editor without premium
    Given owner is on free plan
    When owner attempts to invite an editor
    Then the system should block and show upgrade CTA

## Test suites to implement
- Unit tests: models, ACL logic, geocoding privacy reduction
- Integration tests: API flows (create board, add sticker, save, publish)
- E2E tests: map discovery, open board, invite flow, payment flow
- Performance tests: map pin queries under load

## Example test commands
- Unit tests: npm run test:unit or pytest tests/unit
- Integration tests: npm run test:integration
- E2E tests: npx cypress run or npx playwright test
- CI pipeline should run all suites on PR

## Acceptance test checklist for reviewer
- All Gherkin scenarios pass
- Security review for location handling
- Privacy checklist completed
