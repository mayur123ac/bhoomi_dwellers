import Anthropic from '@anthropic-ai/sdk';

// Initialize the Anthropic client
// It will automatically pick up ANTHROPIC_API_KEY from the environment
const anthropic = new Anthropic();

export type Role = 'user' | 'assistant' | 'system';

export interface AiMessage {
  role: Role;
  content: string;
}

export interface AiProviderResponse {
  content: string;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  model: string;
}

/**
 * A generic AI provider wrapper.
 * Currently backed by Anthropic (Claude 3.5 Sonnet), but designed to be easily swappable
 * or routed to different models based on the task.
 */
export async function generateAiResponse(
  messages: AiMessage[],
  systemPrompt?: string,
  model = 'claude-3-5-sonnet-20240620'
): Promise<AiProviderResponse> {
  try {
    // Anthropic expects system prompt separately from the messages array
    const filteredMessages = messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
      content: m.content
    }));

    const response = await anthropic.messages.create({
      model: model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: filteredMessages,
    });

    // Handle text blocks
    const contentBlocks = response.content;
    const textContent = contentBlocks
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    return {
      content: textContent,
      tokensUsed: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        total: response.usage.input_tokens + response.usage.output_tokens,
      },
      model: model,
    };
  } catch (error) {
    console.error('AI Provider Error:', error);
    throw new Error('Failed to generate AI response.');
  }
}
