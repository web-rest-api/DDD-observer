import {
  createPatient,
  checkInPatient,
  dischargePatient,
  subscribe,
  unsubscribe,
  makeVisitWindow,
  isWithinVisitWindow,
  makeAge,
  makeRoomNumber,
} from "./src/domain/patient.js"

import { logger, frontDeskNotifier, emailNotifier } from "./src/infrastructure/observers/observers.js"

// ============================================================
// PHASE 2 — Dumb plain object (primitive obsessed)
// ============================================================

type DumbPatient = {
  id: string
  name: string
  age: number
  diagnosis: string
  roomNumber: number
}

const patientOne: DumbPatient = {
  id: "123",
  name: "John Doe",
  age: -5,          // silent bug — nothing complains
  diagnosis: "",    // silent bug — nothing complains
  roomNumber: 9999, // silent bug — nothing complains
}

console.log("Phase 2 — dumb patient:", patientOne)

// ============================================================
// PHASE 4 — Smart constructors catching bad values
// ============================================================

try { makeAge(-5) } catch (e) { console.log("Phase 4 — caught:", (e as Error).message) }
try { makeRoomNumber(9999) } catch (e) { console.log("Phase 4 — caught:", (e as Error).message) }

// ============================================================
// PHASE 5 — Value Object
// ============================================================

const visitWindow = makeVisitWindow(9, 17)
console.log("Phase 5 — visiting allowed at 10?", isWithinVisitWindow(visitWindow, 10)) // true
console.log("Phase 5 — visiting allowed at 20?", isWithinVisitWindow(visitWindow, 20)) // false

// ============================================================
// PHASE 6 — Entity identity
// ============================================================

const p1 = createPatient("Alice", 30, 101)
const p2 = createPatient("Bob", 45, 102)
console.log("Phase 6 — same patient?", p1.id === p2.id) // false

// ============================================================
// PHASE 7 — Observer wiring
// ============================================================

let patient = createPatient("Alice", 30, 101)

patient = subscribe(patient, logger)
patient = subscribe(patient, frontDeskNotifier)
patient = subscribe(patient, emailNotifier)

// all three fire:
patient = checkInPatient(patient)

// unsubscribe emailNotifier — only logger and frontDesk fire:
patient = unsubscribe(patient, emailNotifier)
patient = dischargePatient(patient)
patient = subscribe(patient, logger)