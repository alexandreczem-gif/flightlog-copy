import { base44 } from '@/api/base44Client';

export const logAction = async (action, entityName, entityId, details, user = null) => {
  try {
    if (!entityId) {
      console.warn("Logger: entityId não fornecido, pulando log.");
      return;
    }

    const currentUser = user || await base44.auth.me();
    
    if (!currentUser || !currentUser.email) {
      console.warn("Logger: Usuário não identificado ao tentar registrar log.");
      return;
    }

    const logData = {
      user_email: currentUser.email,
      user_name: currentUser.full_name || currentUser.nome_de_guerra || 'Usuário',
      action,
      entity_name: entityName,
      entity_id: String(entityId),
      details: typeof details === 'object' ? JSON.stringify(details) : String(details),
      timestamp: new Date().toISOString()
    };

    await base44.entities.AuditLog.create(logData);
    console.log("AuditLog criado com sucesso:", logData);
  } catch (error) {
    console.error("Erro ao criar AuditLog:", error);
  }
};