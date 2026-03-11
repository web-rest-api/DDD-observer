import { PatientEvent } from "../../domain/patient.js"

export const logger = (e: PatientEvent): void => {
  console.log("LOG:", e)
}

export const frontDeskNotifier = (e: PatientEvent): void => {
  console.log("NOTIFY: front desk alerted for", e.type)
}

export const emailNotifier = (e: PatientEvent): void => {
  console.log("EMAIL: would send email for", e.type)
}