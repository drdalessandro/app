# Handoff — Capa Cliente/negocio (Sesiones, Pagos, Reservar por bots)

Contexto para la integración con ambos repos (`portal` + `recepcionistas`).
Objetivo: cablear en el portal las **Sesiones** y **Pagos** del eje Cliente, y la
**reserva de turnos** de recepción.

> Abrir la sesión scopeada a **ambos** repos: `recepcionistas` (leer el modelo) y
> `portal` (donde se hacen los cambios de código).

## ✅ Cableado en esta sesión

- **Sesiones** y **Pagos** de `/membership` ya son **reales** (antes placeholders).
  - Nuevo módulo de solo lectura `src/fhir/membership.ts`: lee `Coverage`/`Invoice`
    (acotados al paciente por la AccessPolicy) y arma el saldo —sin recalcular
    reglas—, espejando el modelo de recepción
    (`recepcionistas/src/fhir/coverage.ts`, `src/lib/planes.ts`,
    `app/src/lib/panelPlanes.ts`).
  - **Sesiones**: por cada plan activo muestra los baldes *Libres / Agendadas /
    Realizadas / Total* y el aviso de vencimiento (paquete) o renovación (membresía).
  - **Pagos**: lista los `Invoice` del paciente (fecha, concepto, medio, monto ARS,
    estado, marca de *Seña*).
- **AccessPolicy** reconciliada: se sumó `Invoice` (faltaba, sin él Pagos no leía
  nada) y se unificó con la fuente de verdad del seed de recepción
  (`recepcionistas/src/fhir/access-policies.ts`). `Coverage`, `Invoice` y
  `Appointment` quedan de **solo lectura**. Mirror en
  `docs/medplum/access-policy-paciente-portal.json`. **Aplicar en el servidor.**

## Estado actual del portal

- **3 ejes navegables**: Usuario → *Cuenta* (`/account`), Cliente → *Membresía*
  (`/membership`), Paciente → *Salud* (`/health-record`).
- **Membresía** (`src/pages/membership/index.tsx`): muestra
  - **Mis turnos** — real (`<MyAppointments>`, `Appointment?patient=…`).
  - **Sesiones** — ✅ real (saldo por plan desde `Coverage` + turnos).
  - **Cobertura** — real (`Coverage?beneficiary=…`).
  - **Pagos** — ✅ real (`Invoice?subject=…`).
- **Reservar**: el botón "+" del menú inferior (`src/components/BottomNav.tsx`) y
  el Header desktop llevan a `/get-care` (`src/pages/GetCarePage.tsx`), que hoy usa
  las ops nativas `Appointment/$find` y `$hold`, **deshabilitado** con un guard
  ("Reserva en preparación"). **Pendiente** (ver abajo): pasar a *modelo de solicitud*.
- **AccessPolicy** del paciente: `docs/medplum/access-policy-paciente-portal.json`.

## Lo que hay que extraer de `recepcionistas`

### A. Sesiones (saldo y consumo)
1. Recurso del paquete comprado (`Account` / `ChargeItem` / `Contract` / custom) + **JSON de ejemplo real**.
2. Vínculo al paciente (campo + search param).
3. Modelo del saldo: total / consumidas / restantes (¿campo, extensión, o se cuenta?).
4. Cómo se distingue la terapia (HBOT/IHHT/Recovery…): código / `serviceType` / `ActivityDefinition`.
5. Cómo se descuenta una sesión al usarse (¿`Appointment` fulfilled? ¿`ChargeItem`? ¿update de `Account`?).

### B. Pagos / seña
1. Recurso(s) de pago (`Invoice` / `PaymentNotice` / `ChargeItem` / `Account.balance`) + ejemplo.
2. Cómo se marca "seña pagada".
3. Search param por paciente.

### C. Membresía / tipo de socio
- `Coverage` / `Account` / `Contract`; qué campo define el tipo de socio + ejemplo.

### D. Reservar por bots
1. IDs reales de los bots (`bw-reservar-turno`, `bw-reservar-combo`).
2. **Input exacto** + cómo se invoca (`medplum.executeBot(id, input)` o endpoint).
3. **Output** (Appointment creado / errores de regla).
4. Cómo se descubre lo reservable y su disponibilidad (`HealthcareService` / `Schedule`+`Slot` / un bot `$find`).
5. Reglas que valida el bot (orden HBOT primero, capacidad/desfasaje, ventana, seña) — para reflejarlas en la UI.

### E. AccessPolicy
- Confirmar que "Paciente — Portal" da `read` de los recursos de A/B acotado al paciente; si falta alguno, agregarlo a `docs/medplum/access-policy-paciente-portal.json`.

## Puntos de integración en el portal

| Qué | Dónde | Acción |
|---|---|---|
| Sesiones (saldo/consumo) | `src/pages/membership/index.tsx` (sección *Sesiones*) | Reemplazar placeholder por fetch real (nuevo módulo `src/fhir/membership.ts`). |
| Pagos / seña | `src/pages/membership/index.tsx` (sección *Pagos*) | Reemplazar placeholder por fetch real. |
| Tipo de socio | `src/pages/membership/index.tsx` (encabezado) | Mostrar tipo de socio según C. |
| Reservar por bots | `src/pages/GetCarePage.tsx` | Cambiar `$find`/`$hold` por `medplum.executeBot(...)`; manejar errores de regla con `normalizeErrorString`. |
| Descubrir disponibilidad | nuevo `src/fhir/booking.ts` | Listar terapias reservables + slots según D. |
| Permisos | `docs/medplum/access-policy-paciente-portal.json` | Sumar recursos de A/B; aplicar en el server. |

## Reserva online — modelo de **solicitud** (próxima sesión)

Decisión de negocio/seguridad tomada con el cliente: el paciente **no** escribe
`Appointment` ni ejecuta bots directamente. El portal genera una **solicitud** que
Recepción confirma desde su app (donde corren las reglas: R-01 HBOT primero,
R-07 capacidad/desfasaje, R-13 ventana, seña 50%). Beneficio: no abre permisos de
ejecución de bots ni reescritura de agenda al paciente.

Pendiente para implementarlo (sin tocar lo de esta sesión):
1. **Recepción** define el recurso de la solicitud (recomendado `Task`, o
   `Communication` con `category=solicitud-turno`) y un bot que la cree/atienda.
2. **Portal** (`GetCarePage`): reemplazar el `$find`/`$hold` por un formulario que
   cree la solicitud (terapia + franja preferida + nota) acotada al paciente.
3. **AccessPolicy**: si se usa `Task`, sumar `Task` (escritura acotada a
   `Task?requester=%patient` o equivalente) en ambos archivos espejo.
4. Si en el futuro se decide **reserva inmediata por bots**, antes hay que endurecer
   `bw-reservar-turno`/`bw-reservar-combo` para derivar el paciente del login (no del
   input) y dar permiso de ejecutar **solo** esos bots.

## Checklist
- [x] Leer el modelo en `recepcionistas` (Sesiones/Pagos/Cobertura).
- [x] `src/fhir/membership.ts`: fetch de sesiones y pagos por paciente.
- [x] Cablear secciones *Sesiones* y *Pagos* en `/membership`.
- [x] Reconciliar AccessPolicy (sumar `Invoice`; unificar con el seed). **Falta aplicarla en el server.**
- [x] `npm run build` verde.
- [ ] Reserva online por **solicitud** (Task/Communication) — próxima sesión.
