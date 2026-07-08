// SPDX-FileCopyrightText: Copyright Segunda Opinión Médica
// SPDX-License-Identifier: Apache-2.0
//
// Patient Journey — pantalla de primera vez. Ramifica según el origen del paciente:
// "Bienvenida" para auto-registrados y "Onboarding" para invitados (Recepción o colega
// que deriva). Se muestra una sola vez: al tocar "Comenzar" se marca la extensión
// onboarding-completed en el Patient y no vuelve a aparecer (gate en OnboardingGate).
import { Button, Card, Container, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { formatHumanName } from '@medplum/core';
import type { Patient } from '@medplum/fhirtypes';
import { useMedplum } from '@medplum/react';
import { IconArrowRight, IconFileCheck, IconHeartbeat, IconStethoscope, IconUserCheck } from '@tabler/icons-react';
import type { Icon } from '@tabler/icons-react';
import { useState } from 'react';
import type { JSX } from 'react';
import { useNavigate } from 'react-router';
import { getPatientOrigin, marcarOnboardingCompleto } from '../fhir/onboarding';
import { showErrorNotification } from '../utils/notifications';

interface Paso {
  readonly icon: Icon;
  readonly title: string;
  readonly description: string;
}

const PASOS_SELF: Paso[] = [
  {
    icon: IconUserCheck,
    title: 'Completá tu perfil',
    description: 'Revisá tus datos personales para que el informe salga a tu nombre.',
  },
  {
    icon: IconFileCheck,
    title: 'Firmá el consentimiento',
    description: 'Leé y firmá el consentimiento informado del servicio.',
  },
  {
    icon: IconStethoscope,
    title: 'Pedí tu Segunda Opinión',
    description: 'Contanos tu caso, subí tus estudios y recibí tu informe cardiológico.',
  },
];

const PASOS_INVITADO: Paso[] = [
  {
    icon: IconUserCheck,
    title: 'Confirmá tus datos',
    description: 'Verificá que tu información personal esté correcta.',
  },
  {
    icon: IconFileCheck,
    title: 'Firmá el consentimiento',
    description: 'Leé y firmá el consentimiento informado del servicio.',
  },
  {
    icon: IconStethoscope,
    title: 'Completá tu solicitud',
    description: 'Sumá el motivo de consulta y los estudios que tengas para tu Segunda Opinión.',
  },
];

export function Welcome(): JSX.Element {
  const medplum = useMedplum();
  const navigate = useNavigate();
  const patient = medplum.getProfile() as Patient;
  const origin = getPatientOrigin(patient);
  const nombre = patient.name?.[0] ? formatHumanName(patient.name[0]) : '';
  const [saving, setSaving] = useState(false);

  const esInvitado = origin !== 'self';
  const titulo = esInvitado ? `Hola ${nombre}, te estábamos esperando` : `¡Bienvenido/a ${nombre}!`;
  const intro = esInvitado
    ? origin === 'referral'
      ? 'Tu médico te derivó a Segunda Opinión Médica para una revisión cardiológica experta. Ya tenemos tus datos; en unos pasos completás tu solicitud.'
      : 'Nuestro equipo te invitó a Segunda Opinión Médica. Ya tenemos tus datos; en unos pasos completás tu solicitud.'
    : 'Creaste tu cuenta en Segunda Opinión Médica: una segunda opinión cardiológica experta, basada en tus datos y en la evidencia.';
  const pasos = esInvitado ? PASOS_INVITADO : PASOS_SELF;

  const comenzar = async (): Promise<void> => {
    setSaving(true);
    try {
      await marcarOnboardingCompleto(medplum, patient);
      navigate('/')?.catch(console.error);
    } catch (err) {
      showErrorNotification(err);
      setSaving(false);
    }
  };

  return (
    <Container size={640} py={{ base: 24, sm: 64 }}>
      <Stack gap="lg">
        <Group gap="xs">
          <ThemeIcon size={44} radius="xl" variant="light">
            <IconHeartbeat size={26} stroke={1.5} />
          </ThemeIcon>
          <Text fw={700} c="dimmed" size="sm" tt="uppercase">
            Segunda Opinión Médica
          </Text>
        </Group>

        <Title order={1} style={{ letterSpacing: '-0.01em' }}>
          {titulo}
        </Title>
        <Text size="lg" c="gray.7">
          {intro}
        </Text>

        <Stack gap="sm" mt="sm">
          {pasos.map((p, i) => (
            <Card key={p.title} withBorder radius="md" p="md">
              <Group wrap="nowrap" align="flex-start">
                <ThemeIcon size={40} radius="xl" variant="light">
                  <p.icon size={22} stroke={1.5} />
                </ThemeIcon>
                <div>
                  <Text fw={600}>
                    {i + 1}. {p.title}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {p.description}
                  </Text>
                </div>
              </Group>
            </Card>
          ))}
        </Stack>

        <Group mt="md">
          <Button size="md" radius="xl" rightSection={<IconArrowRight size={18} />} loading={saving} onClick={comenzar}>
            Comenzar
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}
