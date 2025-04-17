"use client";

import { useRef } from "react";
import { useChat } from "ai/react";
import clsx from "clsx";
import {
  VercelIcon,
  GithubIcon,
  LoadingCircle,
  SendIcon,
  UserIcon,
} from "@/components/Icons";
import Footer from '@/components/Footer'
import Textarea from "react-textarea-autosize";
import Image from "next/image";
import { useState } from "react";

const examples = [
  "发现你和前任的聊天记录",
  "你炒股亏了20万，被对象发现了",
  "女朋友吃胖了，你想和她一起减肥ᕙ(`▿´)ᕗ，然后就生气了",
  "你在厕所拉屎，女朋友也在闹肚子，但只有一个马桶，最后女朋友拉在裤兜子里了，她很生气",
];

export default function Chat() {
  const [forgivenessValue, setForgivenessValue] = useState(20);
  const [gameOver, setGameOver] = useState(false);
  const [previousInputs, setPreviousInputs] = useState<Set<string>>(new Set()); // 记录之前的输入
  const [isGeneratingAIScenario, setIsGeneratingAIScenario] = useState(false); // 新增
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, setMessages, input, setInput, handleSubmit, isLoading } = useChat({
    onResponse: async (response) => {
      if (response.status === 500) {
        window.alert("您已达到今天的请求限制。");
        return;
      }
      
      // Clone the response to read the stream separately
      const clonedResponse = response.clone();
      const reader = clonedResponse.body?.getReader();
      let result = '';
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        result += new TextDecoder().decode(value);
        
        const forgivenessMatch = result.match(/原谅值：(\d+)\/100/);
        if (forgivenessMatch) {
          const currentForgiveness = parseInt(forgivenessMatch[1]);
          // 确保原谅值在合理范围内
          const normalizedForgiveness = Math.max(0, Math.min(100, currentForgiveness));
          setForgivenessValue(normalizedForgiveness);
          
          // 游戏结束条件：原谅值达到100或小于等于0
          if (normalizedForgiveness >= 100 || normalizedForgiveness <= 0) {
            setGameOver(true);
          }
        }
      }
    },
    onError: (err: Error) => {
      console.log('err', err)
    }
  });

  const disabled = isLoading || input.length === 0;

  // 新增随机场景生成函数
  function generateRandomScenario() {
    const roles = ["女朋友", "男朋友", "老公", "老婆"];
    const problems = [
      "发现你偷偷给游戏充值了648元",
      "发现你和前任的聊天记录",
      "看到你给异性同事的朋友圈点赞",
      "发现你藏私房钱",
      "发现你偷偷吃她的零食"
    ];
    const reactions = [
      "现在非常生气",
      "气得要分手", 
      "已经三天没理你了",
      "把你拉黑了"
    ];
    
    return `${roles[Math.floor(Math.random() * roles.length)]}${problems[Math.floor(Math.random() * problems.length)]}，${reactions[Math.floor(Math.random() * reactions.length)]}`;
  }

  // 新增AI生成场景函数
  async function generateAIScenario() {
    setIsGeneratingAIScenario(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'scenario' })
      });
      
      if (!response.ok) {
        if (response.status === 405) {
          throw new Error('API endpoint not properly configured. Please check the server setup.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setInput(data.scenario);
      inputRef.current?.focus();
    } catch (e) {
      console.error('Error generating AI scenario:', e);
      // 失败时回退本地
      setInput(generateRandomScenario());
    } finally {
      setIsGeneratingAIScenario(false);
    }
  }

  return (
    <main className="flex flex-col items-center justify-between pb-40 bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="fixed top-0 w-full bg-white shadow-sm z-50">
        <div className="container mx-auto flex justify-between items-center px-4 py-3 max-w-screen-md">
          <a href="https://test.test.com" target="_blank" className="hover:opacity-80 transition-opacity">
            <Image src="/logo.jpg" alt="logo" width={36} height={36} />
          </a>
          <a href="https://github.com/johanazhu/honghongai" target="_blank" className="text-gray-600 hover:text-gray-900">
            <GithubIcon />
          </a>
        </div>
        {/* 将进度条包裹在条件判断中 */}
        {messages.length > 0 && (
          <div className="relative w-full h-2">
            <div className="absolute inset-0 bg-gray-200"></div>
            <div 
              className="absolute h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500 ease-out"
              style={{ width: `${forgivenessValue}%` }}
            >
              <div className="absolute right-0 -top-4 transform -translate-y-full">
                <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-md">
                  原凉值 {forgivenessValue}%
                </div>
                <div className="w-2 h-2 bg-green-500 transform rotate-45 translate-x-1/2 translate-y-[-4px]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 消息列表 */}
      {messages.length > 0 ? (
        <div className="w-full max-w-screen-md mt-20 space-y-4 px-4">
          {messages.map((message, i) => (
            <div
              key={i}
              className={clsx(
                "flex items-start space-x-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="flex-shrink-0">
                  <Image src="/logo.jpg" alt="logo" width={36} height={36} className="rounded-full" />
                </div>
              )}
              <div
                className={clsx(
                  "max-w-[80%] rounded-xl p-3",
                  message.role === "user"
                    ? "bg-green-500 text-white rounded-br-none"
                    : "bg-white shadow-sm rounded-bl-none"
                )}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
              {message.role === "user" && (
                <div className="flex-shrink-0">
                  <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center">
                    <UserIcon />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full max-w-screen-md mt-20 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gray-50 p-6 border-t">
            <div className="flex justify-center"> {/* 新增居中容器 */}
              <Image
                src="/love.jpg"
                alt="哄哄模拟器logo"
                width={320}
                height={180}
                className="mb-4"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">哄哄</h1>
            <div className="text-gray-500">
            AI 赋能的道歉挑战！你的对象生气了，你需要运用语言技巧和沟通能力，在限定次数内获得她的原谅。这绝非易事，但充满乐趣！基于 DeepSeekAI Next.js Vercel 构建，快来体验吧！
            </div>
          </div>
          <div className="bg-gray-50 p-6 border-t">
            <p className="mb-4 text-gray-600 font-medium">👇 选择一个场景，开始模拟哄你的虚拟男/女朋友</p>
            <div className="space-y-3">
              <div className="relative">
                <select
                  onChange={(e) => {
                    setInput(e.target.value);
                    inputRef.current?.focus();
                  }}
                  className="w-full px-4 py-3 text-gray-700 text-sm font-medium leading-relaxed tracking-normal font-sans border-2 border-gray-200 rounded-xl bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all duration-200 appearance-none h-[52px]"
                >
                  <option value="" className="text-gray-400">选择预设场景</option>
                  {examples.map((example, i) => (
                    <option key={i} value={example} className="py-2">
                      {example}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <button
                onClick={generateAIScenario}
                disabled={isGeneratingAIScenario}
                className="w-full px-4 py-3 text-sm font-medium leading-relaxed tracking-normal font-sans bg-white border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 flex justify-between items-center group h-[52px]"
              >
                <span className="text-gray-700 font-medium leading-relaxed tracking-normal font-sans">Ai随机生成场景</span>
                {isGeneratingAIScenario ? (
                  <div className="w-5 h-5 text-purple-500">
                    <LoadingCircle />
                  </div>
                ) : (
                  <span className="text-purple-500 text-xl font-bold ml-2 transition-transform group-hover:translate-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 输入框 */}
      <div className="fixed bottom-0 w-full bg-white border-t border-gray-100">
        <div className="container mx-auto max-w-screen-md px-4">
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="relative rounded-xl bg-white shadow-sm border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all duration-200 mb-4"
          >
            <Textarea
              ref={inputRef}
              tabIndex={0}
              required
              rows={1}
              autoFocus
              placeholder="Send a message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  formRef.current?.requestSubmit();
                  e.preventDefault();
                }
              }}
              spellCheck={false}
              className="w-full bg-transparent pr-12 focus:outline-none border-none focus:ring-0 resize-none py-3 px-4"
            />
            <button
              disabled={disabled}
              className={clsx(
                "absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all",
                disabled
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-white bg-green-500 hover:bg-green-600 shadow-md"
              )}
            >
              {isLoading ? (
                <div className="w-5 h-5 flex items-center justify-center">
                  <LoadingCircle />
                </div>
              ) : (
                <SendIcon className="w-5 h-5" />
              )}
            </button>
          </form>
          <div className="pb-4">
            <Footer />
          </div>
        </div>
      </div>
      {gameOver && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center max-w-md">
            <Image src="/logo.jpg" alt="logo" width={80} height={80} className="mx-auto mb-4" />
            {forgivenessValue >= 100 ? (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">恭喜！</h1>
                <p className="text-green-600 mb-6 text-2xl font-extrabold flex items-center justify-center animate-bounce mt-8">
                  你成功哄好了伴侣！<span className="ml-2">💖🥳</span>
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">游戏结束</h1>
                <p className="text-red-600 mb-6 text-2xl font-extrabold flex items-center justify-center animate-bounce mt-8">
                  你被甩了！<span className="ml-2">💔😭</span>
                </p>
              </>
            )}
            <button
              onClick={() => {
                setGameOver(false);
                setForgivenessValue(20);
                setInput('');
                // 新增重置消息列表和路由跳转
                messages.length > 0 && setMessages([]);
                window.history.pushState({}, '', '/');
              }}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              重新开始
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
