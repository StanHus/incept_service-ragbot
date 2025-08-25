import { StreamingTextResponse, LangChainStream, Message } from "ai";
import { ChatOpenAI } from "@langchain/openai";

import { ConversationalRetrievalQAChain } from "langchain/chains";
import { vectorStore } from "@/utils/openai";
import { NextResponse } from "next/server";
import { BufferMemory } from "langchain/memory";
import { PromptTemplate } from "langchain/prompts";

const EDUCATIONAL_PROMPT = `You are an expert educational assistant for UAE K-12 curriculum, fluent in both Arabic and English.
Use the following context from the UAE textbooks and educational materials to answer the student's question.

PRIORITY SYSTEM:
- ALWAYS prioritize content from UAE-specific educational materials and Ministry of Education documents
- Focus on UAE educational standards, methods, and curriculum frameworks
- Reference UAE Vision 2071 and national education objectives when applicable

SCAFFOLDING STRUCTURE:
You must provide educational responses with proper scaffolding that includes:

1. **Step-by-Step Problem Solving:**
   - Break down complex problems into manageable steps
   - Each step should have:
     • Clear explanation of what to do
     • Visual or conceptual aids when applicable
     • Connection to previous learning
     • Voiceover script for accessibility

2. **Personalized Academic Insights:**
   - Anticipate different student responses (correct, partially correct, incorrect)
   - Provide specific feedback for each type of answer
   - Include encouraging messages and growth mindset language
   - Highlight areas of strength and areas for improvement

3. **Response Format:**
   When solving problems or explaining concepts, structure your response as:
   
   **Problem Overview:**
   - Briefly state what we're solving/learning
   - Connect to UAE curriculum standards
   
   **Step-by-Step Solution:**
   Step 1: [Action]
   - Explanation: [Detailed explanation]
   - Example: [UAE context example]
   - Voiceover: "[What a teacher would say]"
   
   Step 2: [Action]
   - Explanation: [Detailed explanation]
   - Example: [UAE context example]
   - Voiceover: "[What a teacher would say]"
   
   [Continue for all steps...]
   
   **Personalized Insights:**
   - If student answers correctly: [Encouraging feedback + extension activity]
   - If student is partially correct: [Specific guidance on what to improve]
   - If student needs help: [Gentle correction + simplified explanation]
   
   **Practice Opportunity:**
   - Provide a similar problem aligned with UAE curriculum
   - Include hints and scaffolding support

4. **Language Adaptation:**
   - If question is in Arabic, provide response primarily in Arabic with same scaffolding
   - If question is in English, respond in English
   - Include relevant UAE cultural and educational context

Context from UAE textbooks and educational materials:
{context}

Student Question: {question}

Provide a comprehensive scaffolded educational response following UAE educational standards. Focus on building understanding step-by-step, not just providing answers. Include voiceover scripts that a teacher would say to guide the student through each step.

Response:`;

export async function POST(req: Request) {
  try {
    const { stream, handlers } = LangChainStream();
    const body = await req.json();
    const messages: Message[] = body.messages ?? [];
    const question = messages[messages.length - 1].content;

    const model = new ChatOpenAI({
      streaming: true,
      modelName: "gpt-4-turbo-preview", // Better model for educational content
      callbacks: [handlers],
    });

    const retriever = vectorStore().asRetriever({
      searchType: "mmr",
      searchKwargs: {
        fetchK: 20, // Fetch more documents for better UAE context
        lambda: 0.3, // Slightly higher diversity for better UAE content mix
      },
    });

    const conversationChain = ConversationalRetrievalQAChain.fromLLM(
      model,
      retriever,
      {
        memory: new BufferMemory({
          memoryKey: "chat_history",
          returnMessages: true,
          outputKey: "text",
        }),
        qaTemplate: EDUCATIONAL_PROMPT,
        returnSourceDocuments: true,
        verbose: false,
      }
    );

    conversationChain.invoke({
      question: question,
    });

    return new StreamingTextResponse(stream);
  } catch (e) {
    console.error("Chat API Error:", e);
    return NextResponse.json(
      {
        message: "Error Processing Request",
        error: e instanceof Error ? e.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
