import { RiskLevel, InterventionType } from "../types";

// FASE 3: Motor de Flujo de Trabajo - Lógica de Derivación Institucional
// Basado en el esquema oficial: "Rutas de derivación condicional"

export const determineProtocol = (risk: RiskLevel, typology: string): { protocol: InterventionType, assignedTo: string, routeDescription: string } => {
  
  // Lógica específica basada en el nivel de riesgo según PDF
  switch (risk) {
    case RiskLevel.LOW:
      // "Si riesgo BAJO -> DECE + seguimiento"
      return {
        protocol: InterventionType.TUTORING,
        assignedTo: 'DECE (Psicólogo Educativo)',
        routeDescription: 'Ruta: DECE + Seguimiento interno'
      };

    case RiskLevel.MEDIUM:
      // "Si riesgo MEDIO -> DECE + Dirección"
      // Tipologías comunes: Acoso escolar, Discriminación, Violencia digital, Abandono
      return {
        protocol: InterventionType.DIRECTION,
        assignedTo: 'DECE y Dirección Académica',
        routeDescription: 'Ruta: DECE + Dirección Institucional'
      };

    case RiskLevel.HIGH:
      // "Si riesgo ALTO -> DECE + Fiscalía"
      // Tipologías comunes: Violencia física grave, Violencia intrafamiliar
      return {
        protocol: InterventionType.EXTERNAL,
        assignedTo: 'DECE y Fiscalía',
        routeDescription: 'Ruta: DECE + Denuncia en Fiscalía'
      };

    case RiskLevel.CRITICAL:
      // "Si riesgo CRÍTICO -> DECE + Fiscalía + UDAI"
      // Tipologías comunes: Violencia sexual, Ideación suicida (Suma Salud)
      let additional = "";
      if (typology.includes("suicida") || typology.includes("autolesiones")) {
        additional = " + Salud Pública";
      }
      return {
        protocol: InterventionType.EXTERNAL,
        assignedTo: 'Equipo Integral de Crisis',
        routeDescription: `Ruta: DECE + Fiscalía + UDAI${additional}`
      };

    default:
      return {
        protocol: InterventionType.TUTORING,
        assignedTo: 'Evaluación Pendiente',
        routeDescription: 'Ruta: Evaluación Inicial'
      };
  }
};