import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, BarChart3, RefreshCw } from 'lucide-react';
import { OnboardingFlow } from './components/OnboardingFlow';
import { ChatInterface } from './components/ChatInterface';
import { InterviewerDashboard } from './components/InterviewerDashboard';
import { WelcomeBackModal } from './components/WelcomeBackModal';
import { Button } from './components/ui/Button';
import { supabase } from './lib/supabase';
import { generateInterviewQuestions, scoreAnswer, generateFinalSummary } from './lib/openai';
import { saveSessionState, getSessionState, clearSessionState, saveCurrentCandidate, getCurrentCandidate, SessionState } from './lib/storage';

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
}

interface CandidateInfo {
  name: string;
  email: string;
  phone: string;
  resumeFile?: File;
}

function App() {
  const [activeTab, setActiveTab] = useState<'interviewee' | 'interviewer'>('interviewee');
  const [currentCandidate, setCurrentCandidate] = useState<any>(null);
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isWaitingForAnswer, setIsWaitingForAnswer] = useState(false);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [dashboardRefresh, setDashboardRefresh] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Check for existing session on load
  useEffect(() => {
    const existingSession = getSessionState();
    const existingCandidate = getCurrentCandidate();
    
    if (existingSession && existingCandidate && !existingSession.isCompleted) {
      setShowWelcomeBack(true);
      setCurrentCandidate(existingCandidate);
      setSessionState(existingSession);
    }
  }, []);

  const addMessage = (type: 'bot' | 'user', content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
    return message;
  };

  const startInterview = async (candidateInfo: CandidateInfo) => {
    try {
      setIsProcessing(true);
      
      // First check if candidate already exists
      const { data: existingCandidate } = await supabase
        .from('candidates')
        .select('*')
        .eq('email', candidateInfo.email)
        .single();
      
      let candidate;
      
      if (existingCandidate) {
        // Update existing candidate
        const { data: updatedCandidate, error: updateError } = await supabase
          .from('candidates')
          .update({
            name: candidateInfo.name,
            phone: candidateInfo.phone,
            status: 'in_progress'
          })
          .eq('id', existingCandidate.id)
          .select()
          .single();
          
        if (updateError) throw updateError;
        candidate = updatedCandidate;
      } else {
        // Create new candidate
        const { data: newCandidate, error: insertError } = await supabase
          .from('candidates')
          .insert({
            name: candidateInfo.name,
            email: candidateInfo.email,
            phone: candidateInfo.phone,
            status: 'in_progress'
          })
          .select()
          .single();
          
        if (insertError) throw insertError;
        candidate = newCandidate;
      }

      // Generate questions
      const questions = await generateInterviewQuestions();
      
      // Create session state
      const newSessionState: SessionState = {
        candidateId: candidate.id,
        currentQuestion: 0,
        questions,
        startTime: Date.now(),
        isCompleted: false,
        answers: {}
      };

      setCurrentCandidate(candidate);
      setSessionState(newSessionState);
      setMessages([]);
      setCurrentQuestionIndex(0);
      setIsWaitingForAnswer(false);

      // Save to local storage
      saveCurrentCandidate(candidate);
      saveSessionState(newSessionState);

      // Start with first question
      addMessage('bot', `Hello ${candidateInfo.name}! ${existingCandidate ? 'Welcome back to' : 'Welcome to'} your technical interview. We'll go through 6 questions of varying difficulty. Let's begin with your first question.`);
      
      setTimeout(() => {
        askQuestion(0, questions);
        setIsProcessing(false); // Reset processing state after questions start
      }, 2000);

    } catch (error) {
      console.error('Error starting interview:', error);
      
      // Create a fallback message that doesn't rely on messages state
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Try to show the user a helpful error message
      if (errorMessage.includes('email')) {
        alert('There was an issue with your email. Please try again or contact support.');
      } else {
        alert('Sorry, there was an error starting your interview. Please try again.');
      }
      
      // Reset all states
      setIsProcessing(false);
      setCurrentCandidate(null);
      setSessionState(null);
      setMessages([]);
    }
  };

  const askQuestion = (questionIndex: number, questions: any[]) => {
    if (questionIndex >= questions.length) {
      completeInterview();
      return;
    }

    const question = questions[questionIndex];
    addMessage('bot', question.question);
    setCurrentQuestionIndex(questionIndex);
    setIsWaitingForAnswer(true);
  };

  const handleAnswer = async (answer: string, timeTaken: number) => {
    if (!sessionState || !currentCandidate) return;

    setIsWaitingForAnswer(false);
    setIsProcessing(true);
    
    // Add user answer to messages
    addMessage('user', answer);
    const evaluatingMessage = addMessage('bot', 'Thank you for your answer. Let me evaluate it...');

    try {
      const currentQuestion = sessionState.questions[currentQuestionIndex];
      
      console.log('Scoring answer:', { question: currentQuestion.question, answer, difficulty: currentQuestion.difficulty });
      
      // Score the answer with AI
      const aiScore = await scoreAnswer(currentQuestion.question, answer, currentQuestion.difficulty);
      
      console.log('AI Score received:', aiScore);
      
      // Save question and answer to database
      await supabase
        .from('questions_and_answers')
        .insert({
          candidate_id: currentCandidate.id,
          question_number: currentQuestionIndex + 1,
          question_text: currentQuestion.question,
          difficulty: currentQuestion.difficulty,
          time_limit: currentQuestion.timeLimit,
          answer,
          time_taken: timeTaken,
          ai_score: aiScore
        });

      // Update the evaluation message with the score
      setMessages(prev => prev.map(msg => 
        msg.id === evaluatingMessage.id 
          ? { ...msg, content: `Great! I've evaluated your answer. You scored ${aiScore.overall}/10 overall. ${aiScore.feedback}` }
          : msg
      ));

      // Update session state
      const updatedSessionState: SessionState = {
        ...sessionState,
        currentQuestion: currentQuestionIndex + 1,
        answers: {
          ...sessionState.answers,
          [currentQuestionIndex]: {
            answer,
            timeTaken,
            score: aiScore
          }
        }
      };

      setSessionState(updatedSessionState);
      saveSessionState(updatedSessionState);


      // Move to next question or complete interview
      if (currentQuestionIndex + 1 < sessionState.questions.length) {
        setTimeout(() => {
          addMessage('bot', `Let's move on to the next question.`);
          setTimeout(() => {
            askQuestion(currentQuestionIndex + 1, sessionState.questions);
          }, 1500);
        }, 3000);
      } else {
        setTimeout(() => {
          completeInterview();
        }, 3000);
      }

    } catch (error) {
      console.error('Error processing answer:', error);
      // Update the evaluation message with error
      setMessages(prev => prev.map(msg => 
        msg.id === evaluatingMessage.id 
          ? { ...msg, content: 'There was an error evaluating your answer, but let\'s continue with the next question.' }
          : msg
      ));
      
      // Continue with next question even if scoring fails
      setTimeout(() => {
        if (currentQuestionIndex + 1 < sessionState.questions.length) {
          askQuestion(currentQuestionIndex + 1, sessionState.questions);
        } else {
          completeInterview();
        }
      }, 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  const completeInterview = async () => {
    if (!sessionState || !currentCandidate) return;

    try {
      // Calculate final score - average of all overall scores
      const scores = Object.values(sessionState.answers).map(a => a.score?.overall || 0);
      const finalScore = scores.length ? Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10 : 0;
      
      // Generate AI summary
      const questionsAndAnswers = Object.entries(sessionState.answers).map(([index, answer]) => ({
        question: sessionState.questions[parseInt(index)].question,
        answer: answer.answer,
        score: answer.score
      }));
      
      const summary = await generateFinalSummary(currentCandidate.name, questionsAndAnswers);

      // Update candidate in database
      await supabase
        .from('candidates')
        .update({
          status: 'completed',
          final_score: finalScore,
          final_summary: summary
        })
        .eq('id', currentCandidate.id);

      // Update session (local)
      const completedSession = { ...sessionState, isCompleted: true };
      setSessionState(completedSession);
      saveSessionState(completedSession);

      // Show completion message
      addMessage('bot', `Congratulations ${currentCandidate.name}! You've completed the interview. Your final score is ${finalScore}/10. ${summary}`);
      
      // Clear session after completion
      setTimeout(() => {
        clearSessionState();
        setDashboardRefresh(prev => prev + 1);
      }, 5000);

    } catch (error) {
      console.error('Error completing interview:', error);
      addMessage('bot', 'Your interview has been completed. Thank you for your time!');
    }
  };

  const handleContinueInterview = () => {
    if (sessionState && currentCandidate) {
      setShowWelcomeBack(false);
      
      // Restore messages
      const restoredMessages: Message[] = [
        {
          id: '1',
          type: 'bot',
          content: `Welcome back ${currentCandidate.name}! Let's continue with your interview.`,
          timestamp: new Date()
        }
      ];

      // Add previous Q&As to messages
      Object.entries(sessionState.answers).forEach(([index, answer]) => {
        const question = sessionState.questions[parseInt(index)];
        restoredMessages.push({
          id: `q${index}`,
          type: 'bot',
          content: question.question,
          timestamp: new Date()
        });
        restoredMessages.push({
          id: `a${index}`,
          type: 'user',
          content: answer.answer,
          timestamp: new Date()
        });
      });

      setMessages(restoredMessages);
      setCurrentQuestionIndex(sessionState.currentQuestion);

      if (sessionState.currentQuestion < sessionState.questions.length) {
        setTimeout(() => {
          askQuestion(sessionState.currentQuestion, sessionState.questions);
        }, 2000);
      }
    }
  };

  const handleRestartInterview = () => {
    clearSessionState();
    setShowWelcomeBack(false);
    setCurrentCandidate(null);
    setSessionState(null);
    setMessages([]);
    setCurrentQuestionIndex(0);
    setIsWaitingForAnswer(false);
  };

  // Render onboarding if no current candidate
  if (!currentCandidate && !showWelcomeBack) {
    // Check if we have any stored candidate data for initialData
    const storedCandidate = getCurrentCandidate();
    const initialData = storedCandidate ? {
      name: storedCandidate.name || '',
      email: storedCandidate.email || '',
      phone: storedCandidate.phone || ''
    } : {};
    
    return <OnboardingFlow onComplete={startInterview} initialData={initialData} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Interview Assistant
          </h1>
          
          <div className="flex items-center space-x-4">
            {currentCandidate && (
              <div className="text-sm text-gray-600">
                {currentCandidate.name} • {currentCandidate.email}
              </div>
            )}
            
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDashboardRefresh(prev => prev + 1)}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-1 mt-4">
          <button
            onClick={() => setActiveTab('interviewee')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'interviewee'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Interviewee</span>
          </button>
          
          <button
            onClick={() => setActiveTab('interviewer')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'interviewer'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Interviewer</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="h-[calc(100vh-140px)]">
        <AnimatePresence mode="wait">
          {activeTab === 'interviewee' && (
            <motion.div
              key="interviewee"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full"
            >
              <ChatInterface
                currentQuestion={sessionState?.questions[currentQuestionIndex]}
                onAnswer={handleAnswer}
                isWaitingForAnswer={isWaitingForAnswer && !isProcessing}
                messages={messages}
                questionNumber={currentQuestionIndex + 1}
                totalQuestions={6}
              />
            </motion.div>
          )}

          {activeTab === 'interviewer' && (
            <motion.div
              key="interviewer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full"
            >
              <InterviewerDashboard refreshTrigger={dashboardRefresh} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Welcome Back Modal */}
      <WelcomeBackModal
        isOpen={showWelcomeBack}
        candidateName={currentCandidate?.name || ''}
        currentQuestion={sessionState?.currentQuestion || 0}
        totalQuestions={6}
        onContinue={handleContinueInterview}
        onRestart={handleRestartInterview}
      />
    </div>
  );
}

export default App;