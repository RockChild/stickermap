# Onboarding and Review Checklist

## For the Claude reviewer
- Verify each Claude-generated file compiles and tests run locally
- Confirm acceptance tests match product requirements
- Validate privacy handling of location data
- Check premium gating logic and payment flows
- Review self-learning data collection for compliance

## Developer onboarding
- Clone repo
- Run ./scripts/bootstrap.sh to create dev env
- Run docker-compose up
- Run unit tests and E2E smoke tests

## Release readiness
- All P0 stories done and acceptance tests passing
- A/B experiments instrumented
- Monitoring and alerts configured

## Final sign-off
- Product owner acceptance
- Security and privacy sign-off
- Claude reviewer sign-off
