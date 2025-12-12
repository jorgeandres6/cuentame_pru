
// Enums
export enum UserRole {
  STUDENT = 'STUDENT', // Cliente Externo
  PARENT = 'PARENT',   // Cliente Externo
  TEACHER = 'TEACHER', // Cliente Externo (Docente que reporta)
  STAFF = 'STAFF',     // Cliente Interno (Gestor, Psicólogo)
  ADMIN = 'ADMIN'      // Súper Administrador
}

export enum CaseStatus {
  OPEN = 'ABIERTO',
  IN_PROGRESS = 'EN_PROCESO',
  RESOLVED = 'RESUELTO',
  CLOSED = 'CERRADO'
}

export enum RiskLevel {
  LOW = 'BAJO',
  MEDIUM = 'MEDIO',
  HIGH = 'ALTO',
  CRITICAL = 'CRÍTICO'
}

export enum InterventionType {
  TUTORING = 'TUTORÍA',
  PSYCHOLOGY = 'PSICOLOGÍA',
  DIRECTION = 'DIRECCIÓN',
  EXTERNAL = 'AUTORIDADES_EXTERNAS'
}

// Data Models

export interface PsychographicProfile {
  interests: string[];       // Hobbies, gustos
  values: string[];          // Qué valoran (justicia, lealtad, honestidad)
  motivations: string[];     // Metas, qué los mueve
  lifestyle: string[];       // Rutinas, entorno social
  personalityTraits: string[]; // Introvertido, ansioso, líder
}

export interface UserNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  // New fields for bi-directional communication
  type?: 'INFO' | 'REQUEST'; // INFO = Solo lectura, REQUEST = Requiere respuesta
  relatedCaseId?: string;    // Para agrupar mensajes por caso en el admin
  reply?: string;            // La respuesta del usuario
  replyDate?: string;        // Fecha de la respuesta
}

// Repositorio 1: Perfil de Usuario (Acceso Restringido)
export interface UserProfile {
  id: string; // Internal DB ID
  fullName: string; 
  email?: string; 
  password: string; // Contraseña preasignada
  phone: string;
  role: UserRole;
  grade?: string; // Solo educandos
  age?: number;
  encryptedCode: string; // The link to the Case Repository AND Login Username
  demographics: {
    address?: string;
    guardianName?: string;
  };
  psychographics?: PsychographicProfile;
  notifications: UserNotification[]; // Mensajes del sistema al usuario
}

// Repositorio 2: Casos (Acceso Amplio / Anonimizado)
export interface ConflictCase {
  id: string;
  encryptedUserCode: string; // Link to UserProfile
  reporterRole: UserRole; // Rol del usuario que reportó (Estudiante, Padre, Docente)
  createdAt: string;
  updatedAt: string;
  status: CaseStatus;
  
  // AI Classification
  typology: string;
  riskLevel: RiskLevel;
  summary: string;
  recommendations?: string[]; // Nuevas recomendaciones para el staff
  
  // Workflow
  assignedProtocol: InterventionType;
  assignedTo: string; // Role or Dept name
  
  // History
  messages: ChatMessage[];
  interventions: InterventionRecord[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface InterventionRecord {
  id: string;
  date: string;
  actionTaken: string;
  responsible: string;
  outcome?: string;
}

export interface AIClassificationResult {
  typology: string;
  riskLevel: RiskLevel;
  summary: string;
  recommendations: string[]; // Lista de acciones sugeridas
  psychographics: PsychographicProfile;
}
