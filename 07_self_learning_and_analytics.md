# Self-Learning Mechanisms and Analytics

## Goals
- Improve onboarding, publish rate, and premium conversion via data-driven experiments.
- Use anonymized telemetry to train models that suggest UI tweaks and feature improvements.

## Telemetry schema (events)
- board_created { board_id, user_id, mode, timestamp }
- sticker_added { board_id, sticker_type, timestamp }
- board_saved { board_id, visibility, location_type, timestamp }
- map_pin_viewed { pin_id, user_id, timestamp }
- invite_sent { board_id, invite_type, paid, timestamp }
- crayon_used { board_id, user_id, tool, duration, premium_used, timestamp }

## Privacy-preserving collection
- Hash user identifiers; store only aggregated metrics for experiments
- Location stored only as city/country; no precise coordinates in analytics
- Provide opt-out and data deletion endpoints

## Self-learning loop
1. Collect anonymized events
2. Aggregate weekly metrics (publish rate, conversion)
3. Train small models to predict churn and conversion (lightweight models)
4. Propose UI experiments (agent suggests variants)
5. A/B test proposals automatically for 2 weeks
6. Evaluate and deploy winning variant

## Implementation notes
- Use BigQuery / Snowflake or Postgres OLAP for analytics
- Use MLflow for model tracking
- Schedule weekly retrain jobs; keep model explainability logs
- Agents should propose experiments with clear hypothesis and metrics

## Example agent task
- "Find top 3 UI flows where users drop before saving a board. Propose 3 hypotheses and generate A/B test variants with instrumentation and acceptance criteria."
