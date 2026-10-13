# Debugging examples

## Valid same-origin requests rejected behind Next's internal URL

**Symptom:** The first browser generation request returned 403 before reaching the model.

**Investigation:** The browser used `127.0.0.1:3000`, while Next's internal request URL could be canonicalized to `localhost:3000`. Comparing Origin to request.url rejected a legitimate request.

**Change:** Compare a parsed HTTP(S) Origin's host to the actual request Host header (falling back to request.url only when Host is absent). Cross-origin requests remain rejected.

**Validation:** A regression test covers `Origin: http://127.0.0.1:3000` with an internal localhost URL. Another test rejects unrelated origins. Browser retries passed the origin boundary and reached the provider.

**Lesson:** Security boundaries must be tested under the actual hosting/proxy behavior, not only direct unit-test URLs.

## A listed model unavailable to new accounts

**Symptom:** Gemini 2.5 Flash appeared in the model listing, but its token-count endpoint returned 404 for this new project.

**Investigation:** A minimal server-side SDK request returned a message saying this model was no longer available to new users and recommending Gemini 3.8 Flash.

**Change:** Updated the configurable default to `gemini-3.8-flash` after checking its official model/pricing documentation.

**Validation:** Token counting worked with the new model. Generation still returned a separate project-level 403: 'Your project has been denied access. Please contact support.' The alternate Interactions endpoint returned the same error. A replacement key supplied by the user was also tested and returned the same denial.

**Later update:** A key from a different account successfully generated a minimal `OK` response. The specific cause of the previous account's denial remains unconfirmed. Full transcript processing then encountered Google's 503 high-demand response. The HTTP layer now distinguishes temporary provider demand from denied access, with a regression test and preserved input; a subsequent route retry confirmed the clearer `PROVIDER_BUSY` response.

**Resolution:** The project key listed Gemini 3.5 Flash-Lite and Google's pricing page showed it on the free tier. Running the same bounded structured pipeline on `gemini-3.5-flash-lite` completed generation and the independent source audit. The configured default was changed to that model; the app does not automatically retry another model because an invisible fallback could consume additional quota and make behavior harder to explain.

**Status:** Live generation and revision now work with the current personal-account key and Gemini 3.5 Flash-Lite. The earlier account's access denial remains unexplained. App input and prior results are preserved when provider requests fail.

**Lesson:** Separate key/model discovery from actual generation authorization, and report external failures honestly.

## Deliberately injected unsupported references

Unit tests insert a nonexistent `s999` reference and chapter gaps. The pipeline retries structural failures once, then stops. Audit fixtures omit a required check, reject a chapter, and mark a quiz question unsupported. The app rejects incomplete audits/unsupported chapters and removes the quiz item with a visible warning. These are synthetic failure tests, not observed model hallucination measurements.

## Shortening dropped an important qualifier

**Symptom:** A live shorter revision of the authored repair-cafe fixture removed its explicit fictional framing. A subsequent attempt preserved more detail but was rejected by the existing length boundary.

**Change:** Made the revision/audit prompts explicit about fictional and hypothetical framing, plans versus observed outcomes, and informal feedback. Supplied a concrete summary word budget calculated from the original instead of relying only on a proportional instruction. Kept the server's existing length rejection and source checks.

**Validation:** The next browser revision passed with a shorter summary that retained fictional framing and seven completed repairs out of nine. Compare and Undo worked, and quiz progress survived. Tests and build passed. The earlier quiz explanation also overstated a planned home repair as completed; the updated audit instruction addresses that distinction, but this exact quiz has not been rerun. Prompt changes reduce ambiguity; they are not deterministic factual verification.
