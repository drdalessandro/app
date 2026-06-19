// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Alert, Stack, Text, Title } from '@mantine/core';
import { Document } from '@medplum/react';
import { IconFileText } from '@tabler/icons-react';
import type { JSX } from 'react';

/**
 * Consentimiento Informado.
 *
 * Pendiente: cargar el texto a partir del documento Word que provee BioWellness.
 * El flujo final permitirá leer el consentimiento y aceptarlo/firmarlo, generando
 * un recurso FHIR `DocumentReference` asociado al paciente (Ley 26.529 / 25.506).
 */
export function InformedConsent(): JSX.Element {
  return (
    <Document>
      <Title order={1} mb="xs">
        Consentimiento Informado
      </Title>
      <Stack gap="md">
        <Text c="dimmed">
          Aquí vas a poder leer y firmar el consentimiento informado de BioWellness antes de iniciar tus tratamientos.
        </Text>
        <Alert icon={<IconFileText size={16} />} color="blue" radius="md" title="En preparación">
          El contenido del consentimiento se cargará a partir del documento provisto por BioWellness. Una vez aceptado,
          quedará registrado de forma segura como parte de tu historia clínica.
        </Alert>
      </Stack>
    </Document>
  );
}
