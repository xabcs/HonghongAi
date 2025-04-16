import OpenAI from 'openai';

const openai = process.env.DEEPSEEK_API_KEY && new OpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY,
  dangerouslyAllowBrowser: true
});

const scenarioPrompt = {
  role: "system",
  content: `你是一个情感场景生成器，请生成一条让用户需要哄对象的虚拟场景。要求：
  1. 字数限制在40字以内
  2. 举例："老公发现你偷偷充值游戏20000元,气得跟你妈妈抱怨"`
} as const;

export const generateScenario = async () => {
  if (!openai) throw new Error('API key not configured');
  
  try {
    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [scenarioPrompt, {
        role: 'user',
        content: '请生成一个虚拟的冲突场景'
      }],
      temperature: 0.9
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('场景生成失败:', error);
    throw error;
  }
};