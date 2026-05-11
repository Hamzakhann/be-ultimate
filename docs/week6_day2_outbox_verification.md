# Week 6 · Day 2 (Day 37) — The Transactional Outbox

> **Mission:** Implement reliable eventual consistency.
> We are solving the distributed dual-write problem by writing events atomically
> to PostgreSQL and using a background relay to feed Elasticsearch via Kafka.

---

## 1. Key Architectural Elements

We created 3 distinct software components ensuring exactly-once transmission logic:

### 1.1 The Atomic Ingress (`apps/wallet-service/.../transfer-money.handler.ts`)
Wraps user-balance manipulation AND event-logging into a standard SQL `BEGIN ... COMMIT`.
* If balance deduction errors -> Event isn't saved.
* If event creation fails -> Money is rolled back.

### 1.2 The Polling Relay Daemon (`apps/wallet-service/.../outbox-relay.service.ts`)
Background polling provider attached to WalletService bootstrap. 
* Periodically executes `SELECT FOR UPDATE` equivalence on `status = 'PENDING'`.
* Broadcasts target JSON payloads via Kafka topic: `transactions-sync`.
* Optimistically locks processed entries.

### 1.3 The Search Bridge Handler (`apps/audit-service/.../audit-service.controller.ts`)
Dedicated consumer of `transactions-sync` topic.
* Maps raw relational data fields to defined search schema.
* Executes native Elasticsearch write via loaded `@app/search` bindings.

---

## 2. Verification & Testing Script

Follow this exact matrix to guarantee your implementation behaves under production stress conditions.

### Test 1 — Database Isolation Assessment
Check if the database table was successfully scaffolded by the TypeORM sync strategy.

**Execution:**
```bash
# Connect directly to Wallet postgres container
docker exec -it fintech_db psql -U admin -d fintech_wallet -c "\d outbox"
```
**Expected Result:**
You should see columns: `id` (uuid), `type` (varchar), `payload` (jsonb), `status` (enum), `createdAt` (timestamp).

---

### Test 2 — The Atomic Write Verification
We test if initiation generates a safe record *before* external components process it.

**Execution:**
1. Shut down Audit Service temporarily to "break" the Kafka listening pipe.
2. Trigger a standard wallet transfer through Swagger UI (`POST /wallet/transfer`) or via CURL through the Gateway.
3. Inspect the DB table immediately.

```bash
docker exec -it fintech_db psql -U admin -d fintech_wallet -c "SELECT id, status, type FROM outbox ORDER BY \"createdAt\" DESC LIMIT 1;"
```

**Expected Behavior:**
You should see one row with `status='PROCESSED'` (if the relay already hit it) or `PENDING`.
Crucially, this proves the application *did not rely* on remote elasticsearch availability to store the state!

---

### Test 3 — Trace Log Journey 
The ultimate audit trail verification. Follow the message across the network.

**Execution:**
Open two terminal panes side-by-side and run your monorepo stack (`npm run dev`).
Trigger a new Money Transfer.

#### Terminal 1 Logs: Wallet Service View
Look for these specific emits:
```bash
[OutboxRelayService] 📦 Found 1 pending outbox message(s). Processing...
[OutboxRelayService] ✅ Relay: Delivered outbox record b92c...
```

#### Terminal 2 Logs: Audit Service View
Wait a millisecond later and spot the hook firing:
```bash
[AuditServiceController] 🔄 Syncing Transaction [450...] to Elasticsearch via Outbox Stream.
[AuditServiceController] ✅ Successfully synced Transaction [450...] to Search Engine.
```

---

### Test 4 — Complete Circuit Proof (The Elasticsearch Query)
Let's visually confirm that the record officially joined our Big Data cluster.

**Execution:**
```bash
curl -X GET "http://localhost:9200/fintech-transactions/_search?pretty" \
     -H 'Content-Type: application/json' \
     -d '{
       "query": {
         "match_all": {}
       },
       "sort": [
         { "timestamp": "desc" }
       ]
     }'
```

**Expected Output:**
Your recently transferred money object sits inside the `hits` Array! Check carefully for the `"status": "PENDING"` property showing the origin snapshot state from PostgreSQL was flawlessly cloned.

---

## 3. Disaster Recovery Drill (Optional High-Level Test)

To truly appreciate this design, try this Advanced Scenario:

1. **Simulate Infrastructure Crash**: Run `docker stop fintech_elasticsearch`.
2. **Process Normal Traffic**: Perform 3-4 Transfer Requests. Notice the app still works *perfectly* and takes users money securely! 
3. **Verify Outbox Backlog**: Notice the outbox table retains data, potentially with some entries moved to error or handled correctly later.
4. **Recovery Action**: Run `docker start fintech_elasticsearch`. Wait 30 seconds.
5. **Check Search Recovery**: Run the search Curl. The 3-4 missing transactions magically appear in search now!

*This proves Zero Data Loss availability.* Day 37 Complete. 💎
