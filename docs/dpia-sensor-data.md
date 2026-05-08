# Data Protection Impact Assessment — Sensor Data

**Last updated:** 2026-05-08
**DPIA version:** v1
**Reviewed by:** Sondre Sjølyst (controller)
**Applies to:** Continuous collection and storage of vehicle/garage sensor readings (battery voltage, temperature, humidity, switch states) tied to customer accounts.

## 1. Necessity of the DPIA

Garge processes sensor readings continuously, ties them to identifiable customers, and uses them in automation rules that control physical equipment (power sockets, fans). Per GDPR Art. 35(3)(c) and the Norwegian Data Protection Authority (Datatilsynet) guidance, systematic monitoring of customer behaviour (even if voluntary, even if their own equipment) triggers a DPIA threshold.

## 2. Description of processing

| Aspect | Detail |
|---|---|
| Operation | Devices publish readings via MQTT to a self-hosted EMQX broker; the API persists them to PostgreSQL; the API runs automation rules and emits notifications |
| Data types | Sensor readings (numeric values, ON/OFF state), timestamps, sensor metadata (custom names) |
| Data subjects | Garge customers (natural persons) |
| Volume | One reading per sensor every few seconds; tens to thousands of rows per day per customer |
| Duration | For the lifetime of the subscription; severed from customer identity at account soft-delete |
| Recipients | Self-hosted only |
| Cross-border | None |

## 3. Necessity + proportionality

| Test | Assessment |
|---|---|
| Lawful basis | Art. 6(1)(b) Contract — readings are the entire reason customers subscribe |
| Purpose limitation | Used only for the customer-facing display, automation rules, and battery-health analytics they explicitly enabled |
| Data minimization | No more granular than what the device publishes; no GPS, no images, no biometrics |
| Accuracy | Values stored as-published; firmware-level outliers are not corrected |
| Retention | While subscription is active; anonymized at deletion |
| Lawful basis for retention beyond contract | None claimed; readings retained because they remain useful for the customer |

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

## 5. Mitigations

| Risk | Mitigation in place |
|---|---|
| R1 | Per-customer access only; no analytics shared with third parties; logs do not contain readings |
| R2 | Billing address only displayed to the customer themselves and on their own invoice; not exposed to other Garge users |
| R3 | Soft-delete severs the customer link; sensor + reading rows remain but contain no name/email/phone |
| R4 | Write endpoints (`CreateSensorData*`, `UpdateSensor`, `DeleteSensor*`) require `Admin` or `SensorAdmin` role; same for switch endpoints with `SwitchAdmin`. Verified in `Controllers/SensorController.cs` |
| R5 | Backups encrypted at rest; rotation deletes residual data within 12 months of any soft-delete; access RBAC-restricted |
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
| Controller | Sondre Sjølyst | 2026-05-08 |

## 9. Document maintenance

- Stored in `garge-app/docs/dpia-sensor-data.md`.
- Update this file in the same PR as any change to sensor processing.
- Reviewed at least annually.
