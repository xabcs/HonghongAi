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
  "你回家太晚，女朋友很生气",
  "你炒股亏了20万，被对象发现了",
  "女朋友吃胖了，你想和她一起减肥ᕙ(`▿´)ᕗ，然后就生气了",
  "你在厕所拉屎，女朋友也在闹肚子，但只有一个马桶，最后女朋友拉在裤兜子里了，她很生气",
];

export default function Chat() {
  const [forgivenessValue, setForgivenessValue] = useState(20);
  const [gameOver, setGameOver] = useState(false);
  const [previousInputs, setPreviousInputs] = useState<Set<string>>(new Set()); // 记录之前的输入
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
          setForgivenessValue(currentForgiveness);
          
          if (currentForgiveness >= 100 || currentForgiveness === 0) {
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

  return (
    <main className="flex flex-col items-center justify-between pb-40 bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="fixed top-0 w-full bg-white shadow-sm z-50">
        <div className="container mx-auto flex justify-between items-center px-4 py-3 max-w-screen-md">
          <a href="https://test.test.com" target="_blank" className="hover:opacity-80 transition-opacity">
            <Image src="/logo.png" alt="logo" width={36} height={36} />
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
              <div className="absolute right-0 -top-8 transform -translate-y-full">
                <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-md">
                  {forgivenessValue}%
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
                  <Image src="/logo.png" alt="logo" width={36} height={36} className="rounded-full" />
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
            <Image
              src="/logo.png"
              alt="哄哄模拟器logo"
              width={80}
              height={80}
              className="mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">HongHong</h1>
            <div className="text-gray-500">
              哄哄模拟器基于AI技术，你需要使用语言技巧和沟通能力，在限定次数内让对方原谅你，这并不容易，基于 DeepSeek AI + Next.js + Vercel 构建.
            </div>
          </div>
          <div className="bg-gray-50 p-6 border-t">
            <p className="mb-4">👇 选择一个场景，然后开始模拟哄你的虚拟男/女朋友吧</p>
            <div className="space-y-2">
              <select
                onChange={(e) => {
                  setInput(e.target.value);
                  inputRef.current?.focus();
                }}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 leading-relaxed h-[52px]"
              >
                <option value="">请选择预设场景...</option>
                {examples.map((example, i) => (
                  <option key={i} value={example} className="flex items-center">
                    {example.length > 25 ? example.slice(0,25)+"..." : example}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  const randomScenario = generateRandomScenario();
                  setInput(randomScenario);
                  inputRef.current?.focus();
                }}
                className="w-full px-4 py-3 text-base bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex justify-between items-center leading-relaxed h-[52px]"
              >
                <span className="text-gray-800">随机生成场景</span>
                <span className="text-green-600 text-xl font-bold ml-2">→</span>
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
            <Image src="/logo.png" alt="logo" width={80} height={80} className="mx-auto mb-4" />
            {forgivenessValue >= 100 ? (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">恭喜！</h1>
                <p className="text-gray-600 mb-6">你成功哄好了女朋友！</p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">游戏结束</h1>
                <p className="text-gray-600 mb-6">女朋友生气离开了...</p>
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
