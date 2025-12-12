
import { UserProfile, ConflictCase, UserRole, UserNotification } from '../types';

// In-memory simulation of the two distinct repositories
// In a real architecture, these would be separate encrypted databases or tables with strict RLS.

const USERS_KEY = 'CUENTAME_USERS';
const CASES_KEY = 'CUENTAME_CASES';

// Datos semilla para probar la aplicación inmediatamente
const INITIAL_USERS: UserProfile[] = [
  {
    id: 'usr_001',
    fullName: 'Estudiante Demo',
    encryptedCode: 'EST-2024-A',
    password: '123',
    role: UserRole.STUDENT,
    phone: 'N/A',
    grade: '10',
    demographics: { address: 'Calle Ficticia 123' },
    psychographics: { 
        interests: [], 
        personalityTraits: [],
        values: [],
        motivations: [],
        lifestyle: []
    },
    notifications: []
  },
  {
    id: 'usr_002',
    fullName: 'Padre Demo',
    encryptedCode: 'FAM-2024-B',
    password: '123',
    role: UserRole.PARENT,
    phone: '555-0000',
    demographics: { address: 'Avenida Siempre Viva' },
    psychographics: { 
        interests: [], 
        personalityTraits: [],
        values: [],
        motivations: [],
        lifestyle: []
    },
    notifications: []
  },
  {
    id: 'usr_003',
    fullName: 'Profesor Demo',
    encryptedCode: 'DOC-2024-C',
    password: '123',
    role: UserRole.TEACHER,
    phone: 'N/A',
    demographics: {},
    psychographics: {
        interests: [],
        personalityTraits: [],
        values: [],
        motivations: [],
        lifestyle: []
    },
    notifications: []
  },
  {
    id: 'usr_admin',
    fullName: 'Director General',
    encryptedCode: 'ADM-MASTER',
    password: 'admin',
    role: UserRole.ADMIN,
    phone: 'N/A',
    demographics: {},
    notifications: []
  },
  {
    id: 'usr_staff',
    fullName: 'Psicóloga Escolar',
    encryptedCode: 'STAFF-PSI',
    password: 'staff',
    role: UserRole.STAFF,
    phone: 'N/A',
    demographics: {},
    notifications: []
  }
];

// Helper to check and seed data if empty
const initializeData = () => {
  const users = localStorage.getItem(USERS_KEY);
  if (!users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
  }
};

// Initialize immediately upon import
initializeData();

// Helper to simulate encryption/hashing
export const generateEncryptedCode = (userId: string): string => {
  return `ENC-${userId.substring(0, 4)}-${Math.random().toString(36).substring(7).toUpperCase()}`;
};

// --- Repository 1: User Profiles (Restricted) ---

export const saveUserProfile = (profile: UserProfile): void => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === profile.id);
  if (index >= 0) {
    users[index] = profile;
  } else {
    users.push(profile);
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const getUsers = (): UserProfile[] => {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
};

// Only accessible by ADMIN or System Process during Report Generation
export const getUserProfileByCode = (encryptedCode: string): UserProfile | undefined => {
  const users = getUsers();
  return users.find(u => u.encryptedCode === encryptedCode);
};

// Modified Login: Uses Code and Password instead of Email
export const loginUserByCredentials = (code: string, password: string): UserProfile | undefined => {
  const users = getUsers();
  // Case insensitive check for code
  return users.find(u => u.encryptedCode.toUpperCase() === code.toUpperCase() && u.password === password);
};

// Helper to Add Notification to User
export const addNotificationToUser = (
    encryptedCode: string, 
    title: string, 
    message: string,
    type: 'INFO' | 'REQUEST' = 'INFO',
    relatedCaseId?: string
): void => {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.encryptedCode === encryptedCode);
    
    if (userIndex >= 0) {
        const newNotification: UserNotification = {
            id: Date.now().toString(),
            title,
            message,
            date: new Date().toISOString(),
            read: false,
            type,
            relatedCaseId
        };
        
        // Ensure notifications array exists
        if (!users[userIndex].notifications) {
            users[userIndex].notifications = [];
        }
        
        users[userIndex].notifications.unshift(newNotification); // Add to top
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
};

// Helper for User to Reply to a Notification
export const replyToNotification = (encryptedCode: string, notificationId: string, replyText: string): UserProfile | null => {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.encryptedCode === encryptedCode);
    
    if (userIndex >= 0) {
        const user = users[userIndex];
        const notifIndex = user.notifications.findIndex(n => n.id === notificationId);
        
        if (notifIndex >= 0) {
            user.notifications[notifIndex].reply = replyText;
            user.notifications[notifIndex].replyDate = new Date().toISOString();
            user.notifications[notifIndex].read = true;
            
            users[userIndex] = user;
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
            return user;
        }
    }
    return null;
};

// --- Repository 2: Casos (Broad Access - Anonymous) ---

export const saveCase = (conflictCase: ConflictCase): void => {
  const cases = getCases();
  const index = cases.findIndex(c => c.id === conflictCase.id);
  if (index >= 0) {
    cases[index] = conflictCase;
  } else {
    cases.push(conflictCase);
  }
  localStorage.setItem(CASES_KEY, JSON.stringify(cases));
};

export const getCases = (): ConflictCase[] => {
  const data = localStorage.getItem(CASES_KEY);
  return data ? JSON.parse(data) : [];
};

export const getCaseByCode = (code: string): ConflictCase | undefined => {
  return getCases().find(c => c.encryptedUserCode === code);
};
