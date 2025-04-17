import { ChatMessage } from '@/types';
import OpenAI from 'openai';
import type { ChatCompletionMessage } from 'openai/resources/chat';

const openai = process.env.DEEPSEEK_API_KEY ? new OpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY
}) : null;

const initHistory = [
  {
    role: "system",
    content: `你的对象是一位野蛮女友，现在你的对象很生气，你需要做出一些选择来哄她开心，但是你的对象是个比较难哄的人，你需要尽可能的说正确的话来哄ta开心，否则你的对象会更加生气，直到你的对象原谅值达到100，否则你就会被对象甩掉，游戏结束。
    游戏规则如下：第一次用户会提供一个对象生气的理由，如果没有提供则随机生成一个理由，然后开始游戏。
    你的第一次回复是"哼"，然后你的对象会回复你一句话，
    每次根据用户的回复，生成对象的回复，回复的内容包括心情和数值。
    如果用户回复重复的内容，就视为减分
    初始原谅值为20，每次交互会增加或者减少原谅值，直到原谅值达到100，游戏通关，原谅值为0则游戏失败。
    每次用户回复的话请从-10到10分为5个等级：-10为非常生气，-5为生气，0为正常，+5为开心，+10为非常开心。
    除了第一次回复外其他的回复的输出格式为：
    (对象心情)对象说的话\n
    得分：{+-原谅值增减}\n
    原谅值：{当前原谅值}/100`
  }
] as const;

export async function startChatAndSendMessageStream(history: any[], newMessage: string) {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API key is not configured. Please check your environment variables.');
  }

  if (!openai) {
    throw new Error('Failed to initialize OpenAI client. Please check your configuration.');
  }

  const messages: ChatCompletionMessage[] = [
    ...initHistory.map(m => ({
      role: m.role as 'system',
      content: m.content
    })),
    ...history.map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      })),
    { 
      role: 'user' as const,
      content: newMessage 
    }
  ];

  try {
    const stream = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages,
      stream: true,
      max_tokens: 8000,
      temperature: 0.7
    });

    const encodedStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || '';
          const encoded = encoder.encode(text);
          controller.enqueue(encoded);
        }
        controller.close();
      }
    });

    return encodedStream;
  } catch (error) {
    console.error('DeepSeek API Error:', error);
    return error;
  }
}