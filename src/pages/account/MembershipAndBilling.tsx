// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, Stack, Table, Text, Title } from '@mantine/core';
import { formatCoding, getReferenceString } from '@medplum/core';
import type { Coverage, Patient } from '@medplum/fhirtypes';
import { useMedplum } from '@medplum/react';
import type { JSX } from 'react';
import { InfoSection } from '../../components/InfoSection';

function CoverageTable({ coverages }: { coverages: Coverage[] }): JSX.Element {
  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Cobertura</Table.Th>
          <Table.Th>N° de afiliado</Table.Th>
          <Table.Th>Relación con el titular</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {coverages.map((c) => (
          <Table.Tr key={c.id}>
            <Table.Td>{c.payor?.[0].display}</Table.Td>
            <Table.Td>{c.subscriberId || '-'}</Table.Td>
            <Table.Td>{formatCoding(c.relationship?.coding?.[0]) || '-'}</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

export function MembershipAndBilling(): JSX.Element {
  const medplum = useMedplum();
  const patient = medplum.getProfile() as Patient;
  const coverages = medplum
    .searchResources('Coverage', {
      beneficiary: getReferenceString(patient),
    })
    .read();

  return (
    <Box p="xl">
      <Title mb="xl">Membresía y Facturación</Title>
      <InfoSection title="Cobertura">
        {coverages.length === 0 ? (
          <Box p="xl">Sin cobertura</Box>
        ) : (
          <Stack gap={0}>
            <CoverageTable coverages={coverages} />
          </Stack>
        )}
      </InfoSection>
      <InfoSection title="Pagos">
        {/*
          F4 (pendiente): mostrar los pagos del paciente desde el modelo de facturación
          de BioWellness (Account / Invoice / ChargeItem). Antes se listaban TODOS los
          PaymentNotice del proyecto sin filtrar por paciente (fuga de datos) y, además,
          PaymentNotice no tiene search param de paciente en FHIR R4, por lo que se quitó
          la consulta global. Cablear a la consulta por paciente al definir el modelo.
        */}
        <Box p="xl">
          <Text c="dimmed">El detalle de pagos estará disponible próximamente.</Text>
        </Box>
      </InfoSection>
    </Box>
  );
}
