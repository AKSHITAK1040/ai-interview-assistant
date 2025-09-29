import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User } from 'lucide-react';
import { Button } from './ui/Button';
import { Timer } from './ui/Timer';

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface ChatInterfaceProps {
  currentQuestion?: {
    question: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    timeLimit: number;
  };
  onAnswer: (answer: string, timeTaken: number) => void;
  isWaitingForAnswer: boolean;
  messages: Message[];
  questionNumber: number;
  totalQuestions: number;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  currentQuestion,
  onAnswer,
  isWaitingForAnswer,
  messages,
  questionNumber,
  totalQuestions
}) => {
  const [inputValue, setInputValue] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (currentQuestion && isWaitingForAnswer) {
      setStartTime(Date.now());
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [currentQuestion, isWaitingForAnswer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !startTime) return;

    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    onAnswer(inputValue.trim(), timeTaken);
    setInputValue('');
    setStartTime(null);
  };

  const handleTimeUp = () => {
    if (!startTime) return;
    
    const timeTaken = currentQuestion?.timeLimit || 0;
    onAnswer(inputValue.trim() || 'No answer provided', timeTaken);
    setInputValue('');
    setStartTime(null);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const TypingIndicator = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center space-x-2 text-gray-500 text-sm"
    >
      <Bot className="w-4 h-4" />
      <span>AI is typing</span>
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-gray-400 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </motion.div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Interview Session</h2>
          <div className="text-sm text-gray-600">
            Question {questionNumber} of {totalQuestions}
          </div>
        </div>
        
        {currentQuestion && isWaitingForAnswer && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center space-x-2">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(currentQuestion.difficulty)}`}
              >
                {currentQuestion.difficulty}
              </span>
            </div>
            <Timer
              duration={currentQuestion.timeLimit}
              onTimeUp={handleTimeUp}
              isActive={isWaitingForAnswer && !!startTime}
            />
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-[80%] p-4 rounded-2xl shadow-sm
                  ${message.type === 'user' 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                    : 'bg-white border border-gray-200 text-gray-900'
                  }
                `}
              >
                <div className="flex items-start space-x-2">
                  {message.type === 'bot' && (
                    <Bot className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  )}
                  {message.type === 'user' && (
                    <User className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-2 opacity-70 ${message.type === 'user' ? 'text-white' : 'text-gray-500'}`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {isWaitingForAnswer && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 border-t bg-gray-50"
        >
          <form onSubmit={handleSubmit} className="flex space-x-3">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your answer here..."
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Button
              type="submit"
              disabled={!inputValue.trim()}
              className="px-6"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </motion.div>
      )}
    </div>
  );
};