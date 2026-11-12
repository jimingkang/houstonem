# Houston Electron Microscopy

Angular marketing website with a customer portal and a Node.js / SQLite API.
Requires Node.js 24+ and installed frontend dependencies (`npm install`).

## Development

Run in two terminals:

```sh
npm run api
npm run dev
```

Open http://localhost:3000. Angular proxies `/api` to port 3001. Restart an existing Angular development server after changing proxy configuration. The portal is at `/portal`.

SQLite is initialized automatically at `server/data/portal.sqlite`. Set `DATA_DIR` to change its directory. Private reports are stored as BLOBs in SQLite and are never served from the public folder. Back up the database using SQLite's backup tools (including WAL handling); do not copy a live database file alone.

## Customer and report management

Accounts are provisioned by the laboratory; there is no public self-registration. In local development, API startup automatically creates the test customer `test` / `test` if missing. It is not auto-created when `NODE_ENV=production`; remove the test account before using a development database in production. Supply a unique password with at least 12 characters via the environment. To avoid writing a password into shell history, read it interactively first (zsh):

```sh
read -s 'CUSTOMER_PASSWORD?New client password: '
export CUSTOMER_PASSWORD
npm run portal:manage -- customer client@example.com "Client Name" "Client Company"
unset CUSTOMER_PASSWORD
npm run portal:manage -- subscribe client@example.com "SEM / EDS Analysis" "Monthly laboratory service" 2027-01-01
npm run portal:manage -- report client@example.com "Material characterization" "SAMPLE-001" "SEM / EDS" /absolute/path/report.pdf
```

Reports must be PDFs up to 25 MB. Subscriptions describe laboratory service agreements; billing and automatic payment collection are not implemented. Customers can search their own reports and download published PDF files. Empty accounts show an empty state, never sample data.

## Security and deployment

Passwords use salted scrypt hashes. Session tokens are random, stored hashed in SQLite, expire after eight hours, and use HttpOnly / SameSite cookies. API queries enforce ownership for all customer data and downloads. Login attempts are limited per connection IP in memory. Use an edge rate limiter for deployments with multiple instances or a reverse proxy.

For deployment, build Angular, serve its output with SPA fallback, and reverse proxy `/api` to this API on the same origin. Set `NODE_ENV=production`, `APP_ORIGIN=https://your-domain`, and use HTTPS so Secure cookies work. The API binds to loopback by default. The Angular dev server is for local development. No CORS wildcard is enabled.

Account provisioning, subscription changes and PDF publishing use the management CLI for this version. An administrator web interface, password reset email workflow, billing and report notifications are not implemented.

## Verification

```sh
npm run test:api
npm run build
```

API integration tests cover login, private downloads, cross-customer isolation, logout, expired sessions, invalid origins and login throttling.

## Local AI customer assistant (Ollama)

The floating assistant calls the backend `POST /api/chat`, which uses the local Ollama `/api/chat` endpoint. No hosted API key or API credit is needed. The default model is `llama3.2:latest`. Only a loopback Ollama address is accepted; cloud-tagged models are rejected.

```sh
ollama serve
# In another terminal, if the model is not already installed:
ollama pull llama3.2
npm run api
npm run dev
```

If the Ollama desktop app already serves port 11434, do not start another `ollama serve` process. Model download requires network access; inference uses the installed model on the backend computer.

Optional `.env.local` settings (the API startup reads this ignored file):

```env
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2:latest
```

To switch models, first install the model using `ollama pull`, then change `OLLAMA_MODEL` and restart the API. The frontend waits up to 125 seconds, allowing for the backend's 120-second generation/load timeout. Generation is limited to 700 tokens and an 8192-token context. Local inference speed and answer quality depend on the installed model and hardware. No chat history is persisted in SQLite; the browser retains the current conversation in memory.

Public mode uses laboratory knowledge. Account mode is explicit opt-in and checks the current login before passing only the customer's own subscription and report metadata to the local model. Report files, passwords and other customers' records are excluded. Each account-mode question uses fresh context; changing modes clears the visible conversation. The assistant cannot place orders, collect payment or send emails. Confirm quotes, findings and sample handling with the lab.

Hosted-provider keys are unused and have been removed from the local configuration. In deployment, Ollama must run on the same host as the backend (localhost means the backend computer, not each visitor's computer). Keep Ollama bound to loopback; only the application backend should expose chat to customers.

Tests use mocked Ollama responses and need no installed model. They cover request format, conversation history, account isolation, validation, timeouts, missing models and rate limits.

## Laboratory services and estimates

`/services` organizes the laboratory's catalog by testing category and supports keyword search. Each service detail includes sample guidance, expected deliverables and a proposed starting price in USD per sample or project. Rates are illustrative and centrally maintained in `src/app/data/service-pricing.ts`; verify them with the laboratory before publishing as approved prices. Gold sputtering is included when appropriate for an eligible SEM project.

Sample-based estimates multiply the proposed rate by the selected quantity. The quote link carries the service and quantity into the contact form, where the customer can add sample and project details and open an email draft for laboratory review. The site does not send the email or issue a binding quote automatically.

### Ordering a service

Open a service detail, set the sample quantity if applicable, and select **Order this service**. A signed-in client supplies a contact email and sample/testing notes. The server calculates the estimate using the same catalog pricing as the frontend and records a price snapshot in SQLite. The order starts as **Awaiting lab confirmation** and appears under **My orders** in the Client Portal. The lab confirms the scope, quote and payment offline. No online payment or automatic email is sent. Project prices use a quantity of one; included SEM preparation is not a standalone order.

The `/shop` URL redirects to `/services`. Existing accessory orders remain visible for their owners and can still be managed; new accessory orders are no longer accepted. After updating the code, restart `npm run api` so the service-order table is created in the existing database.

```sh
npm run portal:manage -- orders
npm run portal:manage -- order-status HEM-order-id "Confirmed - awaiting payment"
npm run portal:manage -- order-status HEM-order-id "Fulfilled"
# Or cancel a pending or confirmed order:
npm run portal:manage -- order-status HEM-order-id "Cancelled"
```

Only mark an order fulfilled after manual payment and fulfillment checks. Cancelling a historical accessory order still releases its reserved stock.
