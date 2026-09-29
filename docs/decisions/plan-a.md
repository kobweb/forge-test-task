# Plan A — decisions (what · why · cost if wrong)

- The guard looks the user up on every request (spec D14) · a deleted account's token stops working at once · one primary-key query per request
- Unique-violation detection also checks `error.cause.code === '23505'` · drizzle 0.45 wraps driver errors in DrizzleQueryError · a driver change needs a new check (the racing-signup e2e would catch it)
- `DUMMY_HASH` is a precomputed bcrypt hash constant · computing one at import would add ~70 ms to every boot and every test file · none
- Goals are replaced with delete + insert inside one transaction and read back with `ORDER BY goal` · Postgres sorts enum values by declaration order, which is `GOALS` order · reordering the enum would reorder output
- In-memory adapters reject like real ones, and specs pin the clock for anything time-based · a same-millisecond Date made the consent-once test vacuous · none
- Each auth security clause has a test that fails without it: a valid token under `Basic`, a token signed with another secret, an expired token, and the dummy bcrypt compare for an unknown email · the brief's cases also passed against a guard with no scheme check or no signature verification · none
- The dummy-compare test spies on bcryptjs through its default import · its CJS build exports its `default` object, so `import * as` yields a getter-only copy that `jest.spyOn` cannot redefine · none: a packaging change makes the test throw, not pass vacuously
- Local checks use `127.0.0.1:3001`, and the git-ignored `apps/mobile/.env` points there too · on this machine an unrelated server holds `[::1]:3001` and `localhost` resolves to ::1 first, while Nest binds 0.0.0.0 · none: the `.env.example` files keep `localhost:3000` for a clean machine
- The billing port is `find` / `upsert(userId, purchase)`; "one trial per account" lives in `BillingService` · keeps the adapter dumb and the rule unit-tested · none
- Coach-reply tests pin lowercasing, consistency-over-next precedence and the short-on-time session name · a mutation pass showed the brief's 22 cases survive all three regressions · none
