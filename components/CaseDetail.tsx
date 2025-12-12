
import React, { useState, useEffect } from 'react';
import { ConflictCase, CaseStatus, InterventionRecord, UserProfile } from '../types';
import { saveCase, getUserProfileByCode, addNotificationToUser } from '../services/storageService';
import jsPDF from 'jspdf';

interface CaseDetailProps {
  caseData: ConflictCase;
  onBack: () => void;
  onUpdate: () => void;
}

const CaseDetail: React.FC<CaseDetailProps> = ({ caseData, onBack, onUpdate }) => {
  const [interventionNote, setInterventionNote] = useState('');
  const [messageToUser, setMessageToUser] = useState('');
  const [newStatus, setNewStatus] = useState<CaseStatus>(caseData.status);
  const [linkedProfile, setLinkedProfile] = useState<UserProfile | undefined>(undefined);

  // Fetch the linked profile (simulating secure access to display psychographics)
  useEffect(() => {
    const profile = getUserProfileByCode(caseData.encryptedUserCode);
    setLinkedProfile(profile);
  }, [caseData.encryptedUserCode, caseData]); // Add dependency to refresh when parent updates

  // Sync internal status selection when caseData updates (e.g. status changed via button or reload)
  useEffect(() => {
    setNewStatus(caseData.status);
  }, [caseData.status]);

  const handleAddIntervention = () => {
    if (!interventionNote) return;

    const record: InterventionRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      actionTaken: interventionNote,
      responsible: 'Usuario Actual (Admin/Staff)' // In real app, from auth context
    };

    const updatedCase = {
      ...caseData,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      interventions: [...caseData.interventions, record]
    };

    saveCase(updatedCase);
    
    // NOTIFICAR AL USUARIO REPORTANTE (INFO)
    addNotificationToUser(
        caseData.encryptedUserCode,
        `Actualización de Caso #${caseData.id}`,
        `Se ha registrado una nueva acción: "${interventionNote}". El estado del caso es: ${newStatus}.`,
        'INFO',
        caseData.id
    );

    setInterventionNote('');
    onUpdate();
  };

  const handleSendMessageToUser = () => {
      if (!messageToUser) return;
      
      // Send a REQUEST type notification
      addNotificationToUser(
          caseData.encryptedUserCode,
          `Mensaje del Encargado - Caso #${caseData.id}`,
          messageToUser,
          'REQUEST',
          caseData.id
      );

      setMessageToUser('');
      // Force refresh to show the message in the list below
      onUpdate();
      
      // Manually refresh local profile state to show new message immediately in list
      const updatedProfile = getUserProfileByCode(caseData.encryptedUserCode);
      setLinkedProfile(updatedProfile);
  };

  // FASE 5: Cierre y Generación de Informe PDF
  const handleGenerateReport = () => {
    const userProfile = getUserProfileByCode(caseData.encryptedUserCode);

    if (!userProfile) {
      alert("Error crítico: No se puede desanonimizar el usuario para el reporte.");
      return;
    }

    const doc = new jsPDF();
    let yPos = 20;

    // Helper for page breaks
    const checkPageBreak = (heightNeeded: number) => {
        if (yPos + heightNeeded > 280) {
            doc.addPage();
            yPos = 20;
        }
    };
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229); // Indigo
    doc.text("INFORME CONFIDENCIAL DE CIERRE - CUÉNTAME", 20, yPos);
    yPos += 10;
    
    // Audit Info
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`ID Caso: ${caseData.id}`, 20, yPos);
    yPos += 5;
    doc.text(`Código Auditoría: AUD-${Date.now()}`, 20, yPos);
    yPos += 5;
    doc.text(`Fecha Generación: ${new Date().toLocaleDateString()}`, 20, yPos);
    yPos += 15;

    // Section 1: User Profile
    checkPageBreak(30);
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("1. Perfil del Estudiante (Desanonimizado)", 20, yPos);
    yPos += 10;
    doc.setFontSize(11);
    doc.text(`Nombre: ${userProfile.fullName}`, 20, yPos);
    yPos += 5;
    doc.text(`Grado: ${userProfile.grade || 'N/A'}`, 20, yPos);
    yPos += 10;
    
    // Add Psychographics to PDF
    checkPageBreak(30);
    doc.text("Perfil Psicográfico (Detectado por IA):", 20, yPos);
    yPos += 7;
    const interests = userProfile.psychographics?.interests.join(', ') || 'N/A';
    const traits = userProfile.psychographics?.personalityTraits.join(', ') || 'N/A';
    doc.setFontSize(10);
    doc.setTextColor(80);
    
    const splitInterests = doc.splitTextToSize(`Intereses: ${interests}`, 170);
    doc.text(splitInterests, 25, yPos);
    yPos += (splitInterests.length * 5);
    
    const splitTraits = doc.splitTextToSize(`Rasgos: ${traits}`, 170);
    doc.text(splitTraits, 25, yPos);
    yPos += (splitTraits.length * 5) + 10;

    // Section 2: Case Details
    checkPageBreak(40);
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("2. Detalle del Conflicto", 20, yPos);
    yPos += 10;
    doc.setFontSize(11);
    doc.text(`Tipología: ${caseData.typology}`, 20, yPos);
    yPos += 5;
    doc.text(`Nivel de Riesgo: ${caseData.riskLevel}`, 20, yPos);
    yPos += 10;
    
    const splitSummary = doc.splitTextToSize(caseData.summary, 170);
    checkPageBreak(splitSummary.length * 5);
    doc.text(splitSummary, 20, yPos);
    yPos += (splitSummary.length * 5) + 10;
    
    // Section 3: Recommendations
    checkPageBreak(30);
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("3. Recomendaciones Técnicas (IA)", 20, yPos);
    yPos += 10;
    doc.setFontSize(10);
    
    if (caseData.recommendations && caseData.recommendations.length > 0) {
        caseData.recommendations.forEach((rec, i) => {
            const splitRec = doc.splitTextToSize(`- ${rec}`, 170);
            checkPageBreak(splitRec.length * 5);
            doc.text(splitRec, 20, yPos);
            yPos += (splitRec.length * 5);
        });
    } else {
        doc.text("No hay recomendaciones registradas.", 20, yPos);
        yPos += 5;
    }
    yPos += 10;

    // Section 4: Chat History (New)
    checkPageBreak(30);
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("4. Transcripción del Chat (Evidencia)", 20, yPos);
    yPos += 10;
    doc.setFontSize(9);
    
    if (caseData.messages && caseData.messages.length > 0) {
        caseData.messages.forEach(msg => {
            const sender = msg.sender === 'user' ? 'USUARIO' : 'AGENTE';
            const timestamp = new Date(msg.timestamp).toLocaleString();
            const prefix = `[${timestamp}] ${sender}: `;
            
            // Color differentiation
            if (msg.sender === 'user') {
                doc.setTextColor(0, 0, 139); // DarkBlue
            } else {
                doc.setTextColor(105, 105, 105); // DimGray
            }
            
            const fullLine = `${prefix}${msg.text}`;
            const splitMsg = doc.splitTextToSize(fullLine, 170);
            
            checkPageBreak(splitMsg.length * 4 + 2);
            doc.text(splitMsg, 20, yPos);
            yPos += (splitMsg.length * 4) + 2;
        });
    } else {
        doc.setTextColor(100);
        doc.text("No hay historial de chat disponible.", 20, yPos);
        yPos += 5;
    }
    yPos += 10;

    // Section 5: Interventions
    checkPageBreak(30);
    doc.setFontSize(14);
    doc.setTextColor(0); // Reset to black
    doc.text("5. Historial de Intervención", 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    if (caseData.interventions && caseData.interventions.length > 0) {
        caseData.interventions.forEach((intrv) => {
            const line = `${new Date(intrv.date).toLocaleDateString()} (${intrv.responsible}) - ${intrv.actionTaken}`;
            const splitLine = doc.splitTextToSize(line, 170);
            
            checkPageBreak(splitLine.length * 5);
            doc.text(splitLine, 20, yPos);
            yPos += (splitLine.length * 5) + 2;
        });
    } else {
        doc.text("No hay intervenciones registradas.", 20, yPos);
    }

    doc.save(`Informe_Cierre_${caseData.id}.pdf`);
    
    if (caseData.status !== CaseStatus.CLOSED) {
        const closedCase = { ...caseData, status: CaseStatus.CLOSED, updatedAt: new Date().toISOString() };
        saveCase(closedCase);
        
        // NOTIFICAR CIERRE
        addNotificationToUser(
            caseData.encryptedUserCode,
            `Caso Cerrado #${caseData.id}`,
            `El protocolo ha finalizado y el caso se ha marcado como CERRADO.`
        );

        onUpdate();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-300 dark:border-gray-700 p-8 space-y-8 transition-colors duration-200">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-gray-200 dark:border-gray-700 pb-6">
        <div>
          <button onClick={onBack} className="text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-indigo-800 dark:hover:text-indigo-400 mb-2 flex items-center gap-1 transition">
            ← Volver al Panel
          </button>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Gestión de Caso: <span className="text-indigo-700 dark:text-indigo-400">{caseData.id}</span></h1>
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-1">Usuario Código: {caseData.encryptedUserCode}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
            <span className={`px-4 py-2 rounded-lg text-sm font-bold text-white shadow-sm ${
                caseData.riskLevel === 'CRÍTICO' ? 'bg-red-700' : 
                caseData.riskLevel === 'ALTO' ? 'bg-orange-600' :
                caseData.riskLevel === 'MEDIO' ? 'bg-amber-500' : 'bg-emerald-600'
            }`}>
                Riesgo: {caseData.riskLevel}
            </span>
             <span className="text-xs font-bold text-gray-400">Creado: {new Date(caseData.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Psychographic Profile Section */}
      {linkedProfile?.psychographics && (
        <div className="bg-indigo-900 dark:bg-indigo-950 text-white rounded-xl p-6 shadow-md border border-indigo-950 dark:border-indigo-900">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-indigo-700 pb-2">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                Perfil Psicográfico (IA Insight)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                    <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Intereses</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {linkedProfile.psychographics.interests.length > 0 ? 
                            linkedProfile.psychographics.interests.map((t, i) => <span key={i} className="text-xs bg-indigo-700 px-3 py-1.5 rounded-full font-semibold border border-indigo-500">{t}</span>) 
                            : <span className="text-xs text-indigo-400 italic">No detectado</span>}
                    </div>
                </div>
                <div>
                    <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Valores</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {linkedProfile.psychographics.values?.length > 0 ? 
                            linkedProfile.psychographics.values.map((t, i) => <span key={i} className="text-xs bg-indigo-700 px-3 py-1.5 rounded-full font-semibold border border-indigo-500">{t}</span>)
                            : <span className="text-xs text-indigo-400 italic">No detectado</span>}
                    </div>
                </div>
                <div>
                    <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Motivaciones</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {linkedProfile.psychographics.motivations?.length > 0 ? 
                            linkedProfile.psychographics.motivations.map((t, i) => <span key={i} className="text-xs bg-indigo-700 px-3 py-1.5 rounded-full font-semibold border border-indigo-500">{t}</span>)
                            : <span className="text-xs text-indigo-400 italic">No detectado</span>}
                    </div>
                </div>
                <div>
                    <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Rasgos Emocionales</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {linkedProfile.psychographics.personalityTraits.length > 0 ? 
                            linkedProfile.psychographics.personalityTraits.map((t, i) => <span key={i} className="text-xs bg-indigo-700 px-3 py-1.5 rounded-full font-semibold border border-indigo-500">{t}</span>)
                            : <span className="text-xs text-indigo-400 italic">No detectado</span>}
                    </div>
                </div>
                <div className="col-span-1 md:col-span-2">
                    <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Estilo de Vida</span>
                    <p className="text-sm text-indigo-100 mt-2 bg-indigo-800 p-3 rounded border border-indigo-600">
                        {linkedProfile.psychographics.lifestyle?.join(', ') || 'No hay información suficiente.'}
                    </p>
                </div>
            </div>
        </div>
      )}

      {/* Grid Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
            {/* Recommendations Section */}
            {caseData.recommendations && caseData.recommendations.length > 0 && (
                <div className="mb-8">
                     <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 border-l-4 border-purple-600 pl-2">Recomendaciones para el Encargado</h3>
                     <div className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-lg border-2 border-purple-200 dark:border-purple-800 transition-colors duration-200">
                        <ul className="list-disc list-inside space-y-2">
                            {caseData.recommendations.map((rec, i) => (
                                <li key={i} className="text-sm font-semibold text-purple-900 dark:text-purple-200">{rec}</li>
                            ))}
                        </ul>
                     </div>
                </div>
            )}

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 border-l-4 border-indigo-600 pl-2">Resumen del Conflicto</h3>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-lg text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 font-medium leading-relaxed transition-colors duration-200">
                {caseData.summary}
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-3 border-l-4 border-blue-600 pl-2">Protocolo Activado</h3>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-lg text-blue-900 dark:text-blue-100 border-2 border-blue-200 dark:border-blue-800 transition-colors duration-200">
                <p className="mb-2"><strong className="text-blue-950 dark:text-blue-200">Tipo:</strong> {caseData.assignedProtocol}</p>
                <p><strong className="text-blue-950 dark:text-blue-200">Asignado a:</strong> {caseData.assignedTo}</p>
            </div>
        </div>

        <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 border-l-4 border-green-600 pl-2">Módulo de Intervención</h3>
            <div className="space-y-4 bg-gray-50 dark:bg-gray-700/50 p-5 rounded-lg border border-gray-300 dark:border-gray-600 transition-colors duration-200">
                <div className="flex gap-2">
                    <select 
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as CaseStatus)}
                        className="w-full border-2 border-gray-600 dark:border-gray-500 bg-gray-800 dark:bg-gray-700 text-white font-semibold rounded-lg px-4 py-2.5"
                    >
                        {Object.values(CaseStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <textarea
                    className="w-full border-2 border-gray-600 dark:border-gray-500 bg-gray-800 dark:bg-gray-700 text-white placeholder-gray-400 rounded-lg p-3 text-sm focus:border-indigo-500 focus:outline-none font-medium"
                    rows={4}
                    placeholder="Registrar nueva acción, entrevista o medida tomada..."
                    value={interventionNote}
                    onChange={(e) => setInterventionNote(e.target.value)}
                />
                <button 
                    onClick={handleAddIntervention}
                    className="w-full bg-indigo-700 hover:bg-indigo-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white py-3 rounded-lg text-sm font-bold transition shadow-md border border-indigo-900 dark:border-indigo-800"
                >
                    REGISTRAR INTERVENCIÓN
                </button>
            </div>
        </div>
      </div>

      {/* Direct Communication Module (New) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-200 dark:border-gray-700 pt-8">
          <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                 <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                 Comunicación Directa con Usuario
              </h3>
              <div className="space-y-4 bg-gray-50 dark:bg-gray-700/50 p-5 rounded-lg border border-gray-300 dark:border-gray-600">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Envía mensajes o solicita información adicional al usuario. Esto aparecerá en su buzón de notificaciones.</p>
                  <textarea
                      className="w-full border-2 border-gray-600 dark:border-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 rounded-lg p-3 text-sm focus:border-indigo-500 focus:outline-none font-medium"
                      rows={3}
                      placeholder="Escribe un mensaje para el usuario..."
                      value={messageToUser}
                      onChange={(e) => setMessageToUser(e.target.value)}
                  />
                  <button 
                      onClick={handleSendMessageToUser}
                      disabled={!messageToUser}
                      className="w-full bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:hover:bg-indigo-900 text-indigo-800 dark:text-indigo-200 py-2 rounded-lg text-sm font-bold transition border border-indigo-200 dark:border-indigo-700 disabled:opacity-50"
                  >
                      ENVIAR MENSAJE AL USUARIO
                  </button>
              </div>
          </div>
          <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Historial de Mensajes</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                  {linkedProfile?.notifications?.filter(n => n.relatedCaseId === caseData.id && n.type === 'REQUEST').length === 0 ? (
                      <div className="text-sm text-gray-500 italic">No hay mensajes directos enviados para este caso.</div>
                  ) : (
                      linkedProfile?.notifications?.filter(n => n.relatedCaseId === caseData.id && n.type === 'REQUEST').map(msg => (
                          <div key={msg.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm text-sm">
                              <div className="flex justify-between items-start mb-1">
                                  <span className="font-bold text-indigo-700 dark:text-indigo-400">Enviado</span>
                                  <span className="text-xs text-gray-400">{new Date(msg.date).toLocaleDateString()}</span>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 mb-2">{msg.message}</p>
                              
                              {msg.reply ? (
                                  <div className="mt-2 pl-3 border-l-2 border-green-500 bg-green-50 dark:bg-green-900/20 p-2 rounded-r">
                                      <p className="text-xs font-bold text-green-700 dark:text-green-400 mb-1">Respuesta del Usuario ({new Date(msg.replyDate!).toLocaleDateString()}):</p>
                                      <p className="text-gray-800 dark:text-gray-200 font-medium">{msg.reply}</p>
                                  </div>
                              ) : (
                                  <div className="mt-2 text-xs font-bold text-orange-500 flex items-center gap-1">
                                      <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                                      Esperando respuesta...
                                  </div>
                              )}
                          </div>
                      ))
                  )}
              </div>
          </div>
      </div>

      {/* History */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">Historial de Acciones</h3>
        {caseData.interventions.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded text-center text-gray-500 dark:text-gray-400 font-medium">No hay intervenciones registradas aún.</div>
        ) : (
            <div className="space-y-4">
                {caseData.interventions.slice().reverse().map((rec) => (
                    <div key={rec.id} className="flex gap-5 border-l-4 border-indigo-600 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-r-lg shadow-sm transition-colors duration-200">
                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 min-w-[90px] uppercase tracking-wider pt-1">{new Date(rec.date).toLocaleDateString()}</span>
                        <div>
                            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{rec.actionTaken}</p>
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-1 uppercase">Responsable: {rec.responsible}</p>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-gray-300 dark:border-gray-700 pt-8 flex justify-end">
        <button
            onClick={handleGenerateReport}
            className="flex items-center gap-2 bg-gray-900 dark:bg-black text-white px-8 py-4 rounded-lg hover:bg-black dark:hover:bg-gray-900 transition shadow-xl font-bold border border-gray-800 dark:border-gray-700"
        >
            <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            CERRAR CASO & GENERAR PDF
        </button>
      </div>
    </div>
  );
};

export default CaseDetail;
