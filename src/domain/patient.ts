import { v4 as uuidv4 } from "uuid";

// PHASE 3 — Branded Types

export type PatientId = string & { readonly __brand: unique symbol };
export type PatientName = string & { readonly __brand: unique symbol };
export type Age = number & { readonly __brand: unique symbol };
export type RoomNumber = number & { readonly __brand: unique symbol };
export type Hour = number & { readonly __brand: unique symbol };

// PHASE 4 — Smart Constructors

export function makePatientId(): PatientId {
  return uuidv4() as PatientId;
}

export function makePatientName(s: string): PatientName {
  if (typeof s !== "string") throw new Error("Patient name must be a string.");
  if (s.trim() === "") throw new Error("Patient name cannot be empty.");
  return s.trim() as PatientName; // Trim whitespace for consistency
}

export function makeAge(n: number): Age {
  if (!Number.isInteger(n))
    throw new Error(`Age must be an integer, got: ${n}`);
  if (n < 0 || n > 130)
    throw new Error(`Invalid age: ${n}. Must be between 0 and 130.`);
  return n as Age;
}

export function makeRoomNumber(n: number): RoomNumber {
  if (!Number.isInteger(n))
    throw new Error(`Room number must be an integer, got: ${n}`);
  if (n < 1 || n > 500)
    throw new Error(`Invalid room number: ${n}. Must be between 1 and 500.`);
  return n as RoomNumber;
}

export function makeHour(n: number): Hour {
  if (!Number.isInteger(n))
    throw new Error(`Hour must be an integer, got: ${n}`);
  if (n < 0 || n > 23)
    throw new Error(`Invalid hour: ${n}. Must be between 0 and 23.`);
  return n as Hour;
}

// PHASE 5 — Value Object (VisitWindow)

export type VisitWindow = {
  readonly start: Hour;
  readonly end: Hour;
};

export function makeVisitWindow(start: number, end: number): VisitWindow {
  const startHour = makeHour(start);
  const endHour = makeHour(end);

  if (endHour <= startHour) {
    throw new Error(`End time (${end}) must be after start time (${start}).`);
  }

  return { start: startHour, end: endHour };
}

export function isWithinVisitWindow(
  window: VisitWindow,
  current: number,
): boolean {
  // Validate that current is a valid hour
  const currentHour = makeHour(current);
  return currentHour >= window.start && currentHour < window.end;
}

export function withNewEndTime(
  window: VisitWindow,
  newEnd: number,
): VisitWindow {
  return makeVisitWindow(window.start, newEnd);
}

// PHASE 6 — Entity

export type PatientStatus = "registered" | "checked-in" | "discharged";

export type PatientEvent =
  | {
      type: "PatientCheckedIn";
      payload: { id: PatientId; name: PatientName; roomNumber: RoomNumber };
    }
  | { type: "PatientDischarged"; payload: { id: PatientId } } // Added for completeness
  | {
      type: "PatientRegistered";
      payload: {
        id: PatientId;
        name: PatientName;
        age: Age;
        roomNumber: RoomNumber;
      };
    };

export type Observer = (event: PatientEvent) => void;

export type PatientEntity = {
  readonly id: PatientId;
  readonly name: PatientName;
  readonly age: Age;
  readonly roomNumber: RoomNumber;
  readonly status: PatientStatus;
};

export type ObservablePatient = PatientEntity & {
  readonly observers: Observer[];
};

export function createPatient(
  name: string,
  age: number,
  roomNumber: number,
): ObservablePatient {
  const patient: ObservablePatient = {
    id: makePatientId(),
    name: makePatientName(name),
    age: makeAge(age),
    roomNumber: makeRoomNumber(roomNumber),
    status: "registered",
    observers: [],
  };

  // Notify observers of patient registration
  notify(patient, {
    type: "PatientRegistered",
    payload: {
      id: patient.id,
      name: patient.name,
      age: patient.age,
      roomNumber: patient.roomNumber,
    },
  });

  return patient;
}

export function checkInPatient(patient: ObservablePatient): ObservablePatient {
  if (patient.status !== "registered") {
    throw new Error(
      `Patient must be registered before checking in. Current status: ${patient.status}`,
    );
  }

  const next: ObservablePatient = { ...patient, status: "checked-in" };

  // FIX: Notify with the NEW patient state's observers, not the old one
  notify(next, {
    type: "PatientCheckedIn",
    payload: { id: next.id, name: next.name, roomNumber: next.roomNumber },
  });

  return next;
}

export function dischargePatient(
  patient: ObservablePatient,
): ObservablePatient {
  if (patient.status !== "checked-in") {
    throw new Error(
      `Patient must be checked in before being discharged. Current status: ${patient.status}`,
    );
  }

  const next: ObservablePatient = { ...patient, status: "discharged" };

  // Notify observers of discharge
  notify(next, {
    type: "PatientDischarged",
    payload: { id: next.id },
  });

  return next;
}

// PHASE 7 — Observer helpers

export function subscribe(
  patient: ObservablePatient,
  obs: Observer,
): ObservablePatient {
  // Prevent duplicate subscriptions
  if (patient.observers.includes(obs)) {
    return patient;
  }
  return { ...patient, observers: [...patient.observers, obs] };
}

export function unsubscribe(
  patient: ObservablePatient,
  obs: Observer,
): ObservablePatient {
  return { ...patient, observers: patient.observers.filter((o) => o !== obs) };
}

export function notify(patient: ObservablePatient, event: PatientEvent): void {
  // Safe notification with error handling
  patient.observers.forEach((observer) => {
    try {
      observer(event);
    } catch (error) {
      // Log error but don't stop other observers from being notified
      console.error("Observer notification failed:", error);
    }
  });
}

// PHASE 8 — Additional Helper Functions

/*
Updates the patient's room number
 */
export function updateRoomNumber(
  patient: ObservablePatient,
  newRoom: number,
): ObservablePatient {
  const roomNumber = makeRoomNumber(newRoom);
  return { ...patient, roomNumber };
}

/*
Checks if a patient can be checked in
 */
export function canCheckIn(patient: ObservablePatient): boolean {
  return patient.status === "registered";
}

/*
 Checks if a patient can be discharged
 */
export function canDischarge(patient: ObservablePatient): boolean {
  return patient.status === "checked-in";
}

/*
 Get a read-only view of the patient (without observers)
 */
export function getPatientEntity(patient: ObservablePatient): PatientEntity {
  const { observers, ...entity } = patient;
  return entity;
}
