
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ConflictCase, RiskLevel, CaseStatus, UserProfile, InterventionRecord } from '../types';
import { sendMessageToGemini, classifyCaseWithGemini } from '../services/geminiService';
import { saveCase, generateEncryptedCode, saveUserProfile, addNotificationToUser } from '../services/storageService';
import { determineProtocol } from '../services/workflowService';

interface ChatInterfaceProps {
  user: UserProfile;
  onCaseSubmitted: (c: ConflictCase) => void;
}

type RobotStatus = 'idle' | 'thinking' | 'speaking';

// Friendly Robot Avatar Component (SVG)
// Added status prop to control animations
const RobotAvatar: React.FC<{ className?: string; status?: RobotStatus }> = ({ className = "w-10 h-10", status = 'idle' }) => (
  <svg className={`${className} text-indigo-600 dark:text-indigo-400 drop-shadow-sm transition-all duration-300`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Body/Head Background */}
    <rect x="20" y="30" width="60" height="50" rx="12" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="3" />
    {/* Ears/Antenna base */}
    <rect x="15" y="45" width="5" height="20" rx="2" fill="currentColor" />
    <rect x="80" y="45" width="5" height="20" rx="2" fill="currentColor" />
    {/* Antenna */}
    <line x1="50" y1="30" x2="50" y2="15" stroke="currentColor" strokeWidth="3" />
    {/* Antenna Light - Animates when Thinking */}
    <circle 
      cx="50" cy="12" r="5" 
      fill="#F59E0B" 
      stroke="currentColor" strokeWidth="2" 
      className={status === 'thinking' ? 'animate-think' : ''}
    />
    {/* Eyes (Friendly/Big) */}
    <circle cx="35" cy="50" r="6" fill="white" />
    <circle cx="35" cy="50" r="2" fill="#1F2937" />
    <circle cx="65" cy="50" r="6" fill="white" />
    <circle cx="65" cy="50" r="2" fill="#1F2937" />
    {/* Mouth (Smile) - Animates when Speaking */}
    <path 
      d="M40 65 Q50 72 60 65" 
      stroke="currentColor" strokeWidth="3" strokeLinecap="round" 
      className={status === 'speaking' ? 'animate-talk' : ''}
    />
  </svg>
);

// User Avatar
const UserAvatar: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <div className={`${className} rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center border-2 border-white dark:border-gray-500 shadow-sm`}>
    <svg className="w-3/5 h-3/5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
  </div>
);

const ChatInterface: React.FC<ChatInterfaceProps> = ({ user, onCaseSubmitted }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `¡Hola! 🤖\n\nSoy tu Agente Escolar. Estoy aquí para escucharte en este espacio seguro.\n\nPara empezar, ¿cómo te gustaría que te llame y con qué género te identificas (masculino, femenino o no binario)?\n(Por favor, elige un apodo o nombre ficticio, es preferible no usar tu nombre real completo por temas de anonimidad 🛡️).`,
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [robotStatus, setRobotStatus] = useState<RobotStatus>('idle');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setRobotStatus('thinking');

    // Call service without callback
    const aiResponseText = await sendMessageToGemini(messages, userMsg.text);

    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      text: aiResponseText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, aiMsg]);
    setLoading(false);
    
    setRobotStatus('speaking');
    setTimeout(() => {
        setRobotStatus('idle');
    }, 4000);
  };

  // Phase 2 -> Phase 3 Transition
  const handleFinalizeReport = async () => {
    setAnalyzing(true);
    setRobotStatus('thinking'); 
    
    // 1. Contextualize & Enriched Classification (Phase 2 Logic)
    const classification = await classifyCaseWithGemini(messages);

    // 2. Automatic Routing (Phase 3 Logic)
    const { protocol, assignedTo } = determineProtocol(classification.riskLevel, classification.typology);

    // Update User Profile with DETAILED detected psychographics
    const updatedUser: UserProfile = { 
      ...user, 
      psychographics: classification.psychographics 
    };
    saveUserProfile(updatedUser);

    // Create the Case Record
    const newCase: ConflictCase = {
      id: `CAS-${Date.now()}`,
      encryptedUserCode: user.encryptedCode,
      reporterRole: user.role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: CaseStatus.OPEN,
      typology: classification.typology,
      riskLevel: classification.riskLevel,
      summary: classification.summary,
      recommendations: classification.recommendations,
      assignedProtocol: protocol,
      assignedTo: assignedTo,
      messages: messages,
      interventions: []
    };

    // Save to Case Repository
    saveCase(newCase);
    
    setAnalyzing(false);
    setRobotStatus('idle');
    onCaseSubmitted(newCase);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[650px] border border-gray-300 dark:border-gray-700 transition-colors duration-200">
      {/* Chat Header */}
      <div className="bg-gray-900 dark:bg-gray-950 p-4 sm:p-5 text-white flex justify-between items-center shadow-lg transition-colors duration-200 z-10">
        <div className="flex items-center gap-4">
          <div className="bg-white dark:bg-gray-800 p-1.5 rounded-full border-2 border-indigo-400 shadow-inner">
             <RobotAvatar className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-600 dark:text-indigo-400" status={robotStatus} />
          </div>
          <div>
            <h2 className="font-extrabold text-xl leading-tight">Agente Escolar</h2>
            <p className="text-xs text-indigo-200 font-bold uppercase tracking-wide flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${robotStatus === 'thinking' ? 'bg-yellow-400 animate-ping' : 'bg-green-400 animate-pulse'}`}></span>
              {robotStatus === 'thinking' ? 'Procesando...' : robotStatus === 'speaking' ? 'Escribiendo...' : 'En línea'}
            </p>
          </div>
        </div>
        {messages.length > 2 && (
            <button
            onClick={handleFinalizeReport}
            disabled={analyzing}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 px-5 rounded-full transition shadow-md disabled:opacity-50 uppercase tracking-wider border border-red-800"
            >
            {analyzing ? 'Procesando...' : 'Finalizar Reporte'}
            </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-200">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'ai' && (
               <div className="hidden sm:block mb-1">
                  <RobotAvatar className="w-8 h-8 text-indigo-600 dark:text-indigo-400" status="idle" />
               </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-4 text-sm shadow-sm font-medium leading-relaxed whitespace-pre-line ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-200 dark:shadow-none'
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>

            {msg.sender === 'user' && (
                <div className="hidden sm:block mb-1">
                    <UserAvatar className="w-8 h-8" />
                </div>
            )}
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start items-end gap-3">
             <div className="hidden sm:block mb-1">
                  <RobotAvatar className="w-8 h-8 text-indigo-600 dark:text-indigo-400 opacity-70" status="thinking" />
             </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-none px-5 py-4 shadow-sm">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 sm:p-5 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-colors duration-200">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Escribe aquí lo que quieras contarme..."
            className="flex-1 border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-full px-6 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 transition font-medium"
            disabled={analyzing}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading || analyzing}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-3 sm:p-4 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex-shrink-0"
          >
            <svg className="w-6 h-6 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
