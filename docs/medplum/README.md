# Configuración de Medplum (servidor)

Recursos de configuración del servidor Medplum (`https://api.medplum.com.ar`,
proyecto canónico `7ce5e559-f315-4538-abf2-61fa4922f996` — "Segunda Opinión Médica") que el portal necesita pero que
**no** viven en el código de la app. Se versionan acá como referencia y para
compartirlos con la app clínica / recepción.

> Estos archivos son la fuente de referencia; **la aplicación real se hace en el
> servidor Medplum** (app admin o API). El portal no los carga en runtime.

## `access-policy-paciente-portal.json`

AccessPolicy del rol **paciente** (la que usa el `invite` de Recepción y la que
debería estar como `defaultPatientAccessPolicy` del proyecto).

> **Fuente de verdad: el seed de recepción.** Esta definición es un **espejo** de
> `recepcionistas/src/fhir/access-policies.ts` (`POLICY_PACIENTE_PORTAL`), que
> `npm run seed` aplica por `name` (haría *upsert* y sobrescribiría lo que haya en
> el server). Mantener **ambos archivos idénticos**: si cambia uno, cambiar el otro.

Cubre todo lo que el portal lee/escribe:

- **Compartimento del paciente** — **escritura** (autogestión): `Patient` (perfil),
  `Observation` (biomarcadores y signos vitales), `QuestionnaireResponse`,
  `DocumentReference` (consentimiento), `Communication` (mensajes).
- **Compartimento del paciente** — **solo lectura**: `Appointment`, `Coverage`,
  `Invoice` (pagos/señas), `DiagnosticReport`, `ServiceRequest` (sus solicitudes de
  Segunda Opinión), `RiskAssessment` (score PREVENT), `CarePlan`, `MedicationRequest`,
  `Immunization`, `Task` (sus solicitudes de turno). La agenda y los planes/pagos
  los gestiona Recepción; reservar es por *modelo de solicitud*, así que el paciente
  no escribe `Appointment`. La **Segunda Opinión** también es por *modelo de solicitud*:
  el paciente escribe su `QuestionnaireResponse` + `DocumentReference` y ejecuta el bot
  `som-solicitar`, que crea la `ServiceRequest`; el informe (`DiagnosticReport`),
  el score (`RiskAssessment`) y el PDF los genera el bot `bot-som-report` (ver
  `bot-som-interface.md`) y el paciente solo los lee.
- **Definicional / compartido** (`readonly`): `ObservationDefinition` (rangos),
  `Questionnaire`, `Schedule`, `Slot`, `HealthcareService`, `Practitioner`,
  `Organization`, `Binary`.
- **Bot** (`readonly`, acotado): `som-solicitar-turno` (crea su `Task` de solicitud de
  turno de una consulta/estudio cardiovascular) y `som-solicitar` (crea su
  `ServiceRequest` de Segunda Opinión). Son los únicos bots que el paciente puede
  ejecutar; no puede ejecutar ningún otro.

`%patient` lo resuelve Medplum al `Patient` del login. Si en tu server no
resuelve, usar `%profile` (para un login de paciente es el mismo `Patient`).

### Cómo aplicarla

1. En la app de Medplum, abrir la AccessPolicy llamada **"Paciente SOM — Portal"**
   (buscarla por `name`; su `id` es propio de cada proyecto, no hardcodear), pestaña
   **JSON**, pegar el array `resource` del archivo y guardar. El nombre **debe** ser
   exactamente "Paciente SOM — Portal": es el que referencian las `ProjectMembership`
   de los pacientes y el que mantiene `recepcionistas` (`npm run seed`, upsert por nombre).
2. **Project → Default Patient Access Policy** = "Paciente SOM — Portal" (para que los
   nuevos pacientes invitados la hereden).
3. Para pacientes ya creados, confirmar que su `ProjectMembership.access.policy`
   apunta a esta AccessPolicy. Editar este recurso es **retroactivo** para los
   memberships que ya lo referencian.

> `meta.versionId` y `meta.lastUpdated` los gestiona el server; por eso no se
> incluyen en el archivo versionado.
