# Experimentation Engine — Testing

## Suite

`backend/tests/experimentation/ExperimentEngine.test.js` — Jest, 4 tests, all against `ExperimentEngine.js`'s live functions (no mocking of Mongoose or the DB).

| Test | Covers |
|---|---|
| `creates a hypothesis with proposed status` | `createHypothesis` persists a Hypothesis and defaults `status` to `"proposed"`. |
| `designs an experiment linked to its hypothesis` | `createExperiment` persists an Experiment with `hypothesisId` matching the source Hypothesis and `status: "designed"`. |
| `evaluates a VARIANT_SUPPORTED result and persists ExperimentResult + Learning` | Full flow — hypothesis → experiment → seeded `control`/`variant` `ExperimentVariant`s → `evaluateExperiment` with control 380/10000 vs. variant 470/10000 conversions. Asserts `success: true`, `resultState: "VARIANT_SUPPORTED"` (the rate difference is statistically significant at the default 95% confidence — z ≈ 3.15), a non-empty `learning.statement`, and that `ExperimentResult.find({experimentId})` returns exactly 2 documents (control + variant). |
| `rejects evaluation with no ExperimentVariants` | `evaluateExperiment` against an experiment with zero seeded `ExperimentVariant`s returns `success: false` and `error` containing `"MISSING_EXPERIMENT_VARIANTS"`, without ever calling `LearningService`. |

## Running it

```
cd backend
npm test
```

Runs via `jest.config.js` (`preset: "ts-jest"`, `testEnvironment: "node"`, `testMatch: ["**/tests/**/*.test.js"]`).

## Requirements — not mocked

This suite connects to a **live MongoDB instance** via `mongoose.connect(process.env.MONGODB_URI)` in `beforeAll`, and disconnects in `afterAll`. Nothing is mocked — no in-memory Mongo, no stubbed models. This means:

- `backend/.env` must define `MONGODB_URI`, and dotenv must actually find it (dotenv resolves `.env` relative to `process.cwd()` — a `backend/.env` file is required; the repo-root `.env` alone is not picked up when running `npm test` from `backend/`).
- Whatever machine/CI runs the suite needs real network access to that MongoDB instance. Against the Atlas cluster currently in `backend/.env`, this was verified in this session to be **blocked** from this sandbox by Atlas's IP allowlist (confirmed via a standalone connectivity script that returned Atlas's explicit "IP not whitelisted" error, not a generic timeout). The suite's logic has not yet been confirmed to pass end-to-end from any environment in this session — only that the code compiles/loads and that the connection step is what's currently blocking it.
- Because every test run failed at the `mongoose.connect()` step in `beforeAll`, execution never reached the `await import(...)` calls that load `ExperimentEngine.js` and the model files (which are ESM `.js` in a `"type": "commonjs"` package). Whether Jest's dynamic `import()` successfully parses those untransformed ESM files under the current `ts-jest` config (which only transforms `.ts`) is **still unverified** — this is a real open risk, not just the Atlas connectivity issue, and should be checked once DB access is available.
- The suite creates real documents (Hypothesis, Experiment, ExperimentVariant, ExperimentResult, AgentLearning) against whatever database `MONGODB_URI` points to and does not clean them up afterward — there is no `afterEach`/teardown that deletes test data. Running it against a shared or production database will leave test records behind.
