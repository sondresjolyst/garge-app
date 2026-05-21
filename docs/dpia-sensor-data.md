# Data Protection Impact Assessment — Sensor Data

**Last updated:** 2026-05-21
**DPIA version:** v2
**Reviewed by:** Sondre Sjølyst (controller)
**Applies to:** Continuous collection and storage of vehicle/garage sensor readings (battery voltage, temperature, humidity, switch states) tied to customer accounts.
**v2 change (2026-05-21):** triggered by the over-quota suspension + data-retention work — adds a new lawful basis for retention beyond contract (Art. 6(1)(f) legitimate interest with an Art. 21 opt-out), keeps a returning owner's history for the lifetime of the claim, and adds an **anonymized telemetry store** kept indefinitely for ML. Detailed legitimate-interest + re-identification analysis: see `garge-api/docs/legitimate-interest-assessment.md` (LIA). Processing inventory: `docs/article30.md`.

## 1. Necessity of the DPIA

Garge processes sensor readings continuously, ties them to identifiable customers, and uses them in automation rules that control physical equipment (power sockets, fans). Per GDPR Art. 35(3)(c) and the Norwegian Data Protection Authority (Datatilsynet) guidance, systematic monitoring of customer behaviour (even if voluntary, even if their own equipment) triggers a DPIA threshold.

## 2. Description of processing

| Aspect | Detail |
|---|---|
| Operation | Devices publish readings via MQTT to a self-hosted EMQX broker; the API persists them to PostgreSQL; the API runs automation rules and emits notifications |
| Data types | Sensor readings (numeric values, ON/OFF state), timestamps, sensor metadata (custom names) |
| Data subjects | Garge customers (natural persons) |
| Volume | One reading per sensor every few seconds; tens to thousands of rows per day per customer |
| Duration | For the lifetime of the **ownership claim** (while the customer owns the device, incl. while suspended over-quota); severed from customer identity on unclaim/sale, account soft-delete, or the opt-out purge |
| Recipients | Self-hosted only |
| Cross-border | None |
| Anonymized ML store | On unclaim/sale, erasure, account deletion, or opt-out purge, the customer's exclusive readings are moved to a de-identified store (surrogate key, no reverse map) kept indefinitely for analytics/model development. Treated as anonymous (out of GDPR scope) per the LIA §3 — contingent on its pre-launch conditions |

## 3. Necessity + proportionality

| Test | Assessment |
|---|---|
| Lawful basis | Art. 6(1)(b) Contract — readings are the entire reason customers subscribe |
| Purpose limitation | Used only for the customer-facing display, automation rules, and battery-health analytics they explicitly enabled |
| Data minimization | No more granular than what the device publishes; no GPS, no images, no biometrics |
| Accuracy | Values stored as-published; firmware-level outliers are not corrected |
| Retention | Lifetime of the ownership claim (incl. while suspended); anonymized on unclaim/sale/deletion, or 6 months after the opt-out + subscription lapse |
| Lawful basis for retention beyond contract | **Art. 6(1)(f) legitimate interest** — preserving the owner's own history (incl. year-over-year across seasonal gaps), with an **Art. 21 opt-out**. Full LIA: `garge-api/docs/legitimate-interest-assessment.md` |

## 4. Risks to data subjects

### R1 — Behaviour inference from time-series

**Risk:** Charge-cycle and garage-state timestamps reveal when the customer is at home, when they ride, when they leave for work.
**Likelihood:** Medium (anyone with read access can reconstruct routines).
**Severity:** Medium (privacy intrusion, possible burglary planning if combined with other data).

### R2 — Location inference

**Risk:** The billing address (Subscription.BillingAddress) plus sensor activity reveals the customer's garage location and presence patterns there.
**Likelihood:** Medium.
**Severity:** Medium-High.

### R3 — Re-identification of "anonymized" sensor data after account soft-delete

**Risk:** After soft-delete, UserSensors rows are cleared, but the historical readings remain. If an attacker has *external* knowledge (which sensor name belonged to which customer), they could re-identify.
**Likelihood:** Low.
**Severity:** Medium.

### R4 — Sensor-data write authorization bypass

**Risk:** A user with write access to a sensor could inject false readings to mislead automation rules of others.
**Likelihood:** Low (gated by SensorAdmin role after security audit).
**Severity:** Medium.

### R5 — Backup leakage

**Risk:** Database snapshots contain all sensor data; a backup-store breach exposes everyone.
**Likelihood:** Low.
**Severity:** High.

### R6 — Continuous monitoring without ongoing reminder

**Risk:** Customer forgets the system is recording everything every few seconds.
**Likelihood:** Medium.
**Severity:** Low.

### R7 — Re-identification of the keep-forever anonymized ML store

**Risk:** Telemetry moved to the indefinitely-retained anonymized store keeps **per-device series with absolute timestamps**. If the de-identification is reversible by any means reasonably likely (e.g. residual mapping in logs/backups, or external knowledge), the "anonymous, out-of-scope" basis fails and personal data is being kept forever.
**Likelihood:** Low.
**Severity:** High (indefinite retention).

## 5. Mitigations

| Risk | Mitigation in place |
|---|---|
| R1 | Per-customer access only; no analytics shared with third parties; successful-path sensor reading values are scrubbed from log lines (only sensor/switch IDs are logged for diagnostics). Rare bad-request and parse-failure warnings retain the literal value for debugging. Older log lines in Loki retention (≤90 days) may still contain reading values until rotation completes |
| R2 | Billing address only displayed to the customer themselves and on their own invoice; not exposed to other Garge users |
| R3 | Soft-delete severs the customer link; sensor + reading rows remain but contain no name/email/phone |
| R4 | Write endpoints (`CreateSensorData*`, `UpdateSensor`, `DeleteSensor*`) require `Admin` or `SensorAdmin` role; same for switch endpoints with `SwitchAdmin`. Verified in `Controllers/SensorController.cs` |
| R5 | Backups encrypted at rest; rotation (3 daily / 4 weekly / 6 monthly, no yearly) deletes residual data within ~6 months of any soft-delete; access RBAC-restricted |
| R7 | Surrogate key with no stored reverse map; independent series (never cross-linked); regenerable battery data dropped; logs (90d) + backups (≤6mo) within the mapping horizon. **Pre-launch conditions (LIA §6):** documented motivated-intruder test, and re-validation against the forthcoming post-*SRB* EDPB anonymisation guidance; if either fails, fall back to aggregate-at-cap. Full analysis: `garge-api/docs/legitimate-interest-assessment.md` §3 |
| R6 | Privacy notice (`/privacy`) explicitly discloses continuous monitoring and what is recorded |

## 6. Residual risk

Residual risk after mitigations: **Low to Medium**.

The behaviour-inference risk (R1) is intrinsic to the service: customers receive value precisely because the system continuously monitors their equipment. The privacy notice discloses this; signing up signals informed acceptance. No further mitigation is feasible without breaking the product.

## 7. Decision

Processing **proceeds** under the controls above. DPIA reviewed annually or on any of the following triggers:

- New sensor type collected (e.g., GPS, image)
- Sharing readings with a third party
- New automation rule that affects safety-critical equipment
- Customer-base expansion to a high-risk segment (children, vulnerable adults)
- Any reportable breach involving sensor data

## 8. Sign-off

| Role | Name | Date |
|---|---|---|
| Controller (v1) | Sondre Sjølyst | 2026-05-08 |
| Controller (v2 — retention/ML + opt-out) | Sondre Sjølyst | 2026-05-21 |

Processing **proceeds** for v2 subject to the LIA §6 pre-launch conditions for the anonymized ML store (motivated-intruder test; post-*SRB* EDPB guidance re-check).

## 9. Document maintenance

- Stored in `garge-app/docs/dpia-sensor-data.md`.
- Update this file in the same PR as any change to sensor processing.
- Reviewed at least annually.
