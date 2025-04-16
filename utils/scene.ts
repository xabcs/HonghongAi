import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
  dangerouslyAllowBrowser: true
});

export const runtime = 'edge';

export async function POST() {
  try {
    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{
        role: 'system',
        content: `生成中文情感冲突场景，包含角色+问题+反应，30-50字。示例："老公发现你偷偷充值游戏648元，气得要回娘家"`
      }, {
        role: 'user',
        content: '生成一个场景'
      }],
      temperature: 0.9,
      max_tokens: 100
    });

    return new Response(JSON.stringify({ 
      scenario: completion.choices[0].message.content?.trim() 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      error: {
        code: 'SCENARIO_ERROR',
        message: error.message
      }
    }), { status: 500 });
  }
}