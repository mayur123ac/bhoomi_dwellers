import { query } from "@/lib/db";
import { generateAiResponse, AiMessage } from "../provider";
import { checkAiQuota, logAiUsage } from "../tracker";
import { generateAssistantSystemPrompt, AssistantContext } from "../prompts/assistant";

export interface ChatRequest {
  organizationId: string;
  userId: string;
  sessionId?: string; // If not provided, a new session is created
  message: string;
  context: AssistantContext;
}

export interface ChatResponse {
  sessionId: string;
  response: string;
}

/**
 * Core orchestration for the Nexora AI Assistant
 */
export async function handleAssistantChat(request: ChatRequest): Promise<ChatResponse> {
  const { organizationId, userId, message, context } = request;
  let sessionId = request.sessionId as string;

  // 1. Verify Quota
  await checkAiQuota(organizationId);

  // 2. Resolve or Create Session
  if (!sessionId) {
    const sessionResult = await query(
      `INSERT INTO ai_sessions (organization_id, user_id, title)
       VALUES ($1, $2, $3) RETURNING id`,
      [organizationId, userId, message.substring(0, 50) + (message.length > 50 ? '...' : '')]
    );
    sessionId = sessionResult[0].id;
  } else {
    // Verify session belongs to this user/org
    const verifyResult = await query(
      `SELECT id FROM ai_sessions WHERE id = $1 AND organization_id = $2 AND user_id = $3`,
      [sessionId, organizationId, userId]
    );
    if (verifyResult.length === 0) {
      throw new Error("Session not found or unauthorized");
    }
  }

  // 3. Save User Message
  await query(
    `INSERT INTO ai_messages (session_id, organization_id, role, content)
     VALUES ($1, $2, $3, $4)`,
    [sessionId, organizationId, 'user', message]
  );

  // 4. Retrieve History for Context Window (Last 10 messages)
  const historyResult = await query(
    `SELECT role, content FROM ai_messages 
     WHERE session_id = $1 
     ORDER BY created_at ASC 
     LIMIT 10`,
    [sessionId]
  );
  
  const messages: AiMessage[] = historyResult.map((row: any) => ({
    role: row.role as AiMessage['role'],
    content: row.content
  }));

  // 5. Generate System Prompt
  const systemPrompt = generateAssistantSystemPrompt(context);

  // 6. Call AI Provider
  const aiResponse = await generateAiResponse(messages, systemPrompt);

  // 7. Save Assistant Message
  await query(
    `INSERT INTO ai_messages (session_id, organization_id, role, content, tokens_used)
     VALUES ($1, $2, $3, $4, $5)`,
    [sessionId, organizationId, 'assistant', aiResponse.content, aiResponse.tokensUsed.total]
  );

  // 8. Log Usage Quota
  await logAiUsage({
    organizationId,
    userId,
    feature: 'assistant',
    tokensUsed: aiResponse.tokensUsed.total,
    modelUsed: aiResponse.model,
    metadata: { sessionId }
  });

  return {
    sessionId,
    response: aiResponse.content
  };
}
