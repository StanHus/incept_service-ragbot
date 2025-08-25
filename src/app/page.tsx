"use client";

import { useChat } from "ai/react";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

export default function Home() {
  const [waitingForAI, setWaitingForAI] = useState<Boolean>(false);
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Sample educational questions for quick access
  const sampleQuestions = [
    "ما هي أركان الإسلام الخمسة؟",
    "كيف نحسب مساحة المستطيل؟",
    "What are the main tenses in English?",
    "ما هي أجزاء الخلية النباتية؟",
    "اشرح قانون نيوتن الأول",
  ];

  const handleSampleQuestion = (question: string) => {
    handleInputChange({ target: { value: question } } as any);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              UAE K-12 Educational Assistant
            </h1>
            <p className="text-gray-300">
              المساعد التعليمي للمنهج الإماراتي | Powered by AI and UAE
              Curriculum
            </p>
          </div>

          {/* Sample Questions */}
          {messages.length === 0 && (
            <div className="mb-8">
              <p className="text-gray-400 mb-4 text-center">
                Try these sample questions:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {sampleQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSampleQuestion(q)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <div
            ref={chatContainerRef}
            className="bg-gray-800 rounded-lg shadow-lg p-6 mb-4"
            style={{ maxHeight: "60vh", overflowY: "auto" }}
          >
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex justify-center items-center gap-4 mb-4">
                  <img
                    className="w-24"
                    src="/MongoDB_White.svg"
                    alt="MongoDB"
                  />
                  <span className="text-4xl text-white">+</span>
                  <img className="w-16" src="/openAI.svg" alt="OpenAI" />
                </div>
                <p className="text-gray-400">
                  Ask any question about the UAE curriculum (Grades 1-12)
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  اسأل أي سؤال عن المنهج الإماراتي من الصف الأول إلى الثاني عشر
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-3 ${
                      m.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex gap-3 max-w-3xl ${
                        m.role === "user" ? "flex-row-reverse" : ""
                      }`}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gray-700 p-2 flex items-center justify-center">
                          {m.role === "user" ? (
                            <img
                              src="/user.png"
                              alt="User"
                              className="w-full h-full"
                            />
                          ) : (
                            <img
                              src="/bot.png"
                              alt="AI"
                              className="w-full h-full"
                            />
                          )}
                        </div>
                      </div>
                      <div
                        className={`rounded-lg px-4 py-3 ${
                          m.role === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700 text-gray-100"
                        }`}
                      >
                        <div className="text-xs text-gray-400 mb-1">
                          {m.role === "user" ? "You" : "AI Assistant"}
                        </div>
                        {m.role === "assistant" ? (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                              h1: ({ children }) => (
                                <h1 className="text-2xl font-bold mb-4 text-white">
                                  {children}
                                </h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className="text-xl font-bold mb-3 text-white">
                                  {children}
                                </h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className="text-lg font-semibold mb-2 text-white">
                                  {children}
                                </h3>
                              ),
                              p: ({ children }) => (
                                <p className="mb-3 text-gray-100 leading-relaxed">
                                  {children}
                                </p>
                              ),
                              ul: ({ children }) => (
                                <ul className="list-disc list-inside mb-3 space-y-1">
                                  {children}
                                </ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="list-decimal list-inside mb-3 space-y-1">
                                  {children}
                                </ol>
                              ),
                              li: ({ children }) => (
                                <li className="text-gray-100">{children}</li>
                              ),
                              code: ({ children, ...props }) => {
                                const isInline = !props.className;
                                return isInline ? (
                                  <code className="bg-gray-900 px-1 py-0.5 rounded text-sm text-blue-300">
                                    {children}
                                  </code>
                                ) : (
                                  <code className="block bg-gray-900 p-3 rounded-lg overflow-x-auto text-sm text-gray-300">
                                    {children}
                                  </code>
                                );
                              },
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-300 my-3">
                                  {children}
                                </blockquote>
                              ),
                              img: ({ src, alt }) => (
                                <img
                                  src={src}
                                  alt={alt}
                                  className="max-w-full h-auto rounded-lg my-3"
                                />
                              ),
                              strong: ({ children }) => (
                                <strong className="font-bold text-white">
                                  {children}
                                </strong>
                              ),
                              em: ({ children }) => (
                                <em className="italic text-gray-200">
                                  {children}
                                </em>
                              ),
                            }}
                          >
                            {m.content}
                          </ReactMarkdown>
                        ) : (
                          <div className="whitespace-pre-wrap">{m.content}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {(isLoading || waitingForAI) && (
                  <div className="flex justify-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gray-700 p-2 flex items-center justify-center">
                        <img
                          src="/bot.png"
                          alt="AI"
                          className="w-full h-full"
                        />
                      </div>
                    </div>
                    <div className="bg-gray-700 rounded-lg px-4 py-3">
                      <div className="text-xs text-gray-400 mb-1">
                        AI Assistant
                      </div>
                      <div className="flex items-center gap-2">
                        <img
                          src="/1484.gif"
                          alt="Loading"
                          className="w-6 h-6"
                        />
                        <span className="text-gray-300">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              value={input}
              onChange={handleInputChange}
              className="flex-1 px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ask your question in Arabic or English..."
              dir="auto"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
          </form>

          {/* Info Footer */}
          <div className="mt-4 text-center text-xs text-gray-500">
            <p>Powered by UAE Ministry of Education Curriculum • Grades 1-12</p>
            <p className="mt-1">
              يحتوي على المنهج الإماراتي الكامل من الصف الأول إلى الثاني عشر
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
