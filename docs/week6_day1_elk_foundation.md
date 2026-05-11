# Week 6 · Day 1 (Day 36) — ELK Stack Foundation

> **Goal:** Move from "Static Data" to "Searchable Intelligence."
> We wired Elasticsearch, Kibana, and Logstash into the monorepo and built
> a shared `@app/search` library so any microservice can index and search
> transactions with two lines of code.

---

## 1. What We Built

### 1.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        NestJS Monorepo                              │
│                                                                     │
│   wallet-service  ──► SearchService.indexTransaction()             │
│   audit-service   ──► SearchService.indexTransaction()  (future)   │
│                                        │                            │
│                              @app/search library                    │
│                              (libs/search/src/)                     │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │ HTTP REST
                                   ▼
                         ┌──────────────────┐
                         │  Elasticsearch   │  :9200
                         │  fintech-trans-  │
                         │  actions index   │
                         └────────┬─────────┘
                                  │
                    ┌─────────────┴──────────────┐
                    │                            │
             ┌──────▼──────┐           ┌─────────▼────────┐
             │   Kibana    │  :5601    │    Logstash      │
             │  Dashboard  │           │  Kafka → ES pipe │
             └─────────────┘           └──────────────────┘
                                               ▲
                                               │
                                    Kafka topic: transaction.events
```

### 1.2 Files Created / Modified

#### New — Infrastructure

| File | What it does |
|------|-------------|
| `docker-compose.yml` | Added `elasticsearch`, `kibana`, `logstash` services + `elasticsearch_data` volume |
| `logstash/pipeline/fintech.conf` | Reads `transaction.events` from Kafka, renames fields to match ES mapping, upserts into `fintech-transactions` with document-id idempotency |

#### New — `@app/search` Library

| File | What it does |
|------|-------------|
| `libs/search/src/search.module.ts` | `@Global()` NestJS module. Wires `@nestjs/elasticsearch` using `ELASTICSEARCH_NODE` env var with retry/timeout config |
| `libs/search/src/search.service.ts` | Core service with 3 public methods + `onModuleInit` that auto-creates the index |
| `libs/search/src/index.ts` | Barrel export |
| `libs/search/tsconfig.lib.json` | TypeScript config for the library |

#### Modified — Monorepo Config

| File | Change |
|------|--------|
| `nest-cli.json` | Registered `search` as a new library project |
| `tsconfig.json` | Added `@app/search` and `@app/search/*` path aliases |

#### Modified — `wallet-service`

| File | Change |
|------|--------|
| `apps/wallet-service/src/app.module.ts` | Imports `SearchModule` from `@app/search` |
| `apps/wallet-service/.env` | Added `ELASTICSEARCH_NODE=http://localhost:9200` |

---

### 1.3 The `SearchService` API

```typescript
// Auto-called on startup — creates fintech-transactions index if missing
onModuleInit(): Promise<void>

// Index one transaction document (upsert by ID — safe to call multiple times)
indexTransaction(doc: {
  id: string;          // ES document ID — ensures idempotency
  sender_id: string;
  receiver_id?: string;
  amount: number;
  currency?: string;
  status?: string;     // e.g. 'COMPLETED' | 'FAILED' | 'PENDING'
  event_type?: string;
  description?: string;
  timestamp: string | Date;
}): Promise<void>

// Full-text search on description + optional keyword filters
searchTransactions(opts: {
  query?: string;      // searches `description` field
  status?: string;     // exact-match keyword filter
  sender_id?: string;  // exact-match keyword filter
  from?: number;       // pagination offset
  size?: number;       // page size
}): Promise<{ hits: any[]; total: number }>

// Health probe — returns true if ES is reachable
ping(): Promise<boolean>
```

### 1.4 The `fintech-transactions` Index Mapping

| Field | ES Type | Why |
|-------|---------|-----|
| `id` | `keyword` | Exact-match; used as document ID |
| `sender_id` | `keyword` | Filter by user — no tokenisation needed |
| `receiver_id` | `keyword` | Same as above |
| `amount` | `double` | Accurate floating-point for money |
| `currency` | `keyword` | Aggregation / filter (USD, EUR…) |
| `status` | `keyword` | Exact filter (COMPLETED, FAILED…) |
| `event_type` | `keyword` | Exact filter (transfer.completed…) |
| `description` | `text` + `.keyword` sub-field | Full-text search via standard analyser; `.keyword` for sorting |
| `timestamp` | `date` | Time-range queries and Kibana time series |

> **Settings:** 1 shard, 0 replicas — correct for a single-node dev cluster.

---

## 2. How to Test Everything

### Step 1 — Start Docker Desktop, then spin up ELK

```bash
# Start only the ELK services (your existing stack can stay running)
docker compose up -d elasticsearch kibana logstash

# Watch logs until ES is green (~60 seconds on first pull)
docker compose logs -f elasticsearch
# Look for: "Active license is now [BASIC]" and "started"
```

---

### Step 2 — Verify Elasticsearch is healthy

```bash
curl http://localhost:9200/_cluster/health?pretty
```

Expected:
```json
{
  "cluster_name" : "docker-cluster",
  "status" : "green",
  "number_of_nodes" : 1
}
```

---

### Step 3 — Open Kibana

Go to **http://localhost:5601** — you should see the Kibana home screen.
No login required (security is disabled for local dev).

---

### Step 4 — Verify the index was auto-created by NestJS

```bash
npm run dev:wallet
```

Watch the terminal for:
```
[SearchService] Index "fintech-transactions" created successfully.
```

On subsequent restarts it will say:
```
[SearchService] Index "fintech-transactions" already exists — skipping creation.
```

Confirm via curl:
```bash
# Index exists?
curl http://localhost:9200/fintech-transactions?pretty

# Inspect mapping
curl http://localhost:9200/fintech-transactions/_mapping?pretty
```

---

### Step 5 — Manually index a test document

```bash
curl -X POST "http://localhost:9200/fintech-transactions/_doc/test-001" \
  -H "Content-Type: application/json" \
  -d '{
    "id":          "test-001",
    "sender_id":   "user-abc",
    "receiver_id": "user-xyz",
    "amount":      250.00,
    "currency":    "USD",
    "status":      "COMPLETED",
    "event_type":  "transfer.completed",
    "description": "Payment for pizza delivery",
    "timestamp":   "2026-05-08T02:30:00.000Z"
  }'
```

Expected: `{ "result": "created", "_id": "test-001" }`

---

### Step 6 — Run search queries via Kibana Dev Tools

Open **http://localhost:5601 → Menu → Dev Tools** and paste these:

#### Full-text search on description
```json
GET fintech-transactions/_search
{
  "query": {
    "match": { "description": "pizza" }
  }
}
```

#### Filter by status (exact keyword)
```json
GET fintech-transactions/_search
{
  "query": {
    "term": { "status": "COMPLETED" }
  }
}
```

#### Combined full-text + filter (mirrors `searchTransactions()`)
```json
GET fintech-transactions/_search
{
  "query": {
    "bool": {
      "must":   [{ "match": { "description": "pizza" } }],
      "filter": [{ "term":  { "status": "COMPLETED"  } }]
    }
  },
  "sort": [{ "timestamp": { "order": "desc" } }]
}
```

#### Amount range query
```json
GET fintech-transactions/_search
{
  "query": {
    "range": { "amount": { "gte": 100, "lte": 500 } }
  }
}
```

---

### Step 7 — Test `SearchService` from NestJS (temporary endpoints)

Add to `WalletController` temporarily:

```typescript
@Get('search/ping')
async pingElastic() {
  const alive = await this.searchService.ping();
  return { elasticsearch: alive ? 'connected' : 'unreachable' };
}

@Get('search')
async search(@Query('q') q: string, @Query('status') status?: string) {
  return this.searchService.searchTransactions({ query: q, status });
}
```

Then test:
```bash
curl http://localhost:3002/search/ping
curl "http://localhost:3002/search?q=pizza"
curl "http://localhost:3002/search?q=pizza&status=COMPLETED"
```

---

### Step 8 — Test the Logstash Kafka → ES pipeline

```bash
# Enter the Kafka container
docker exec -it fintech_kafka bash

# Open a producer
/opt/kafka/bin/kafka-console-producer.sh \
  --broker-list localhost:9092 \
  --topic transaction.events
```

Paste this JSON and press Enter:
```json
{"id":"kafka-test-001","userId":"user-abc","amount":99.99,"currency":"USD","status":"COMPLETED","eventType":"transfer.completed","description":"Kafka pipe test","timestamp":"2026-05-08T03:00:00.000Z"}
```

Then confirm Logstash indexed it:
```bash
curl "http://localhost:9200/fintech-transactions/_doc/kafka-test-001?pretty"
```

---

### Step 9 — Set up Kibana Data View (for dashboards)

1. **http://localhost:5601** → Stack Management → Data Views → Create data view
2. **Index pattern:** `fintech-transactions`
3. **Timestamp field:** `timestamp`
4. Save → go to **Analytics → Discover** to browse live data

---

## 3. Quick Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `curl 9200` hangs | ES not started yet | `docker compose logs elasticsearch` — wait for "started" |
| Kibana "server not ready" | Kibana waiting on ES healthcheck | Wait ~90s after ES shows healthy |
| Index not found | wallet-service never started | Run `npm run dev:wallet` once |
| Logstash not indexing | Kafka topic not yet created | Publish one message — auto-create is enabled |
| `ELASTICSEARCH_NODE` missing | Env var not loaded | Check `apps/wallet-service/.env` |

---

## 4. What's Next — Day 37

- **Wire `indexTransaction()`** into the CQRS `TransactionCompletedEvent` handler in `wallet-service`
- **API Gateway search endpoint** — `GET /transactions/search?q=pizza` proxied from the gateway to wallet-service
- **Kibana dashboard** — real-time panel: amount histogram by hour, status donut chart
- **Edge-ngram analyser** — upgrade `description` mapping for search-as-you-type UX
