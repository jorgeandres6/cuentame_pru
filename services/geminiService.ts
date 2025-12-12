
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ChatMessage, RiskLevel, AIClassificationResult } from "../types";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelId = "gemini-2.5-flash"; // Optimized for speed and logic

// Las 10 Tipologías oficiales del PDF
const OFFICIAL_TYPOLOGIES = [
  "Conflicto leve entre pares",
  "Acoso escolar (bullying)",
  "Violencia física grave",
  "Violencia sexual",
  "Violencia intrafamiliar detectada",
  "Discriminación o xenofobia",
  "Ideación suicida o autolesiones",
  "Violencia digital",
  "Abandono escolar o negligencia",
  "Conflicto docente-estudiante"
];

// System instruction for the "Phase 2" Conversational Agent
const CHAT_SYSTEM_INSTRUCTION = `
Eres el "Agente escolar", un asistente empático y asertivo del sistema "CUÉNTAME".
Tu misión tiene dos pilares: 1) Recopilar información para triaje y 2) Ofrecer contención emocional y estrategias.

--- FASE 1: CONTEXTO INICIAL ---
- El chat inició pidiendo: Alias y Género. Si el usuario responde, saluda y PREGUNTA: "¿Prefieres las preguntas una por una o en bloques?".

--- FASE 2: TONO Y CONFORT ---
- Sé positivo, valida sentimientos y busca fortalezas en el usuario.

--- FASE 3: CICLO DE ESTRATEGIAS DE AUTORESOLUCIÓN ---
Si detectas un conflicto LEVE o MEDIO, propón estrategias de afrontamiento (ej. ignorar, banco de niebla), pero tu objetivo principal es clasificar el riesgo.

--- REGLAS DE EFICIENCIA ---
- Intenta cerrar el ciclo en 5-7 interacciones.
`;

export const sendMessageToGemini = async (
  history: ChatMessage[], 
  newMessage: string
): Promise<string> => {
  try {
    const chatHistory = history.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const chat = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction: CHAT_SYSTEM_INSTRUCTION,
      },
      history: chatHistory
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "Entendido. ¿Podrías darme un detalle más?";

  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Hubo un error de conexión momentáneo.";
  }
};

// Schema for Phase 2 Classification matching the PDF Logic exactly
const classificationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    typology: {
      type: Type.STRING,
      enum: OFFICIAL_TYPOLOGIES,
      description: "La categoría exacta del conflicto según el manual.",
    },
    riskLevel: {
      type: Type.STRING,
      enum: [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL],
      description: "Nivel de riesgo derivado de la tipología y gravedad. NOTA: 'Acoso escolar (bullying)' es SIEMPRE Riesgo MEDIO.",
    },
    summary: {
      type: Type.STRING,
      description: "Resumen ejecutivo del caso en 1 o 2 oraciones.",
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Lista de 3 a 5 acciones técnicas recomendadas para el profesional encargado (Staff/Psicólogo).",
    },
    psychographics: {
      type: Type.OBJECT,
      description: "Perfilado psicográfico.",
      properties: {
        interests: { type: Type.ARRAY, items: { type: Type.STRING } },
        values: { type: Type.ARRAY, items: { type: Type.STRING } },
        motivations: { type: Type.ARRAY, items: { type: Type.STRING } },
        lifestyle: { type: Type.ARRAY, items: { type: Type.STRING } },
        personalityTraits: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["interests", "values", "motivations", "lifestyle", "personalityTraits"]
    }
  },
  required: ["typology", "riskLevel", "summary", "recommendations", "psychographics"]
};

export const classifyCaseWithGemini = async (messages: ChatMessage[]): Promise<AIClassificationResult> => {
  const conversationText = messages.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n');
  
  const prompt = `
    Analiza esta conversación de reporte escolar.
    
    1. CLASIFICACIÓN (Sigue ESTRICTAMENTE esta tabla lógica):
       - "Conflicto leve entre pares" -> Riesgo BAJO
       - "Acoso escolar (bullying)" -> Riesgo MEDIO (Estricto: No importa la gravedad percibida, el protocolo indica MEDIO)
       - "Violencia física grave" -> Riesgo ALTO
       - "Violencia sexual" -> Riesgo CRÍTICO (SIEMPRE)
       - "Violencia intrafamiliar detectada" -> Riesgo ALTO
       - "Discriminación o xenofobia" -> Riesgo MEDIO
       - "Ideación suicida o autolesiones" -> Riesgo CRÍTICO
       - "Violencia digital" -> Riesgo MEDIO
       - "Abandono escolar o negligencia" -> Riesgo MEDIO
       - "Conflicto docente-estudiante" -> Riesgo MEDIO
    
    2. RECOMENDACIONES TÉCNICAS:
       - Genera 3 a 5 recomendaciones accionables y profesionales dirigidas al EQUIPO TÉCNICO (Psicólogo, Inspector, Director).
       - NO des consejos al alumno.
       - Ejemplo: "Citar a representantes legales", "Activar protocolo de violencia sexual", "Realizar observación áulica", "Notificar a UDAI".
    
    3. PERFILADO: Extrae intereses, valores y estilo de vida implícitos.
    
    TRANSCRIPCIÓN:
    ${conversationText}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: classificationSchema
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result as AIClassificationResult;
  } catch (error) {
    console.error("Classification Error:", error);
    // Fallback in case of error
    return {
      typology: "Conflicto leve entre pares",
      riskLevel: RiskLevel.MEDIUM,
      summary: "Error en clasificación automática. Revisión manual requerida.",
      recommendations: ["Revisar caso manualmente", "Entrevistar al estudiante"],
      psychographics: {
        interests: [],
        values: [],
        motivations: [],
        lifestyle: [],
        personalityTraits: []
      }
    };
  }
};
