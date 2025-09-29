import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Trophy, Clock, MessageCircle } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { supabase, Candidate, QuestionAnswer } from '../lib/supabase';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface CandidateDetailModalProps {
  candidateId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  candidateId,
  isOpen,
  onClose
}) => {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [questions, setQuestions] = useState<QuestionAnswer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'details'>('overview');

  useEffect(() => {
    if (isOpen && candidateId) {
      loadCandidateData();
    }
  }, [isOpen, candidateId]);

  const loadCandidateData = async () => {
    try {
      setIsLoading(true);
      
      // Load candidate info
      const { data: candidateData, error: candidateError } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .single();

      if (candidateError) throw candidateError;
      setCandidate(candidateData);

      // Load questions and answers
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions_and_answers')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('question_number');

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);
    } catch (error) {
      console.error('Error loading candidate data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const chartData = {
    labels: questions.map((_, i) => `Q${i + 1}`),
    datasets: [
      {
        label: 'Technical',
        data: questions.map(q => q.ai_score?.technical || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      },
      {
        label: 'Clarity',
        data: questions.map(q => q.ai_score?.clarity || 0),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
      },
      {
        label: 'Problem Solving',
        data: questions.map(q => q.ai_score?.problem_solving || 0),
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Performance Breakdown by Question',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 10,
      },
    },
  };

  // Compute a fallback average from the answered questions if final_score is not set
  const answeredAvg = questions.length
    ? Math.round((questions.reduce((sum, q) => sum + (q.ai_score?.overall || 0), 0) / questions.length) * 10) / 10
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {candidate && (
                <>
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {candidate.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{candidate.name}</h2>
                    <p className="text-gray-600">{candidate.email}</p>
                  </div>
                </>
              )}
            </div>
            <Button variant="secondary" size="sm" onClick={onClose} className="p-2 !px-2">
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-4 mt-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'overview' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'details' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Question Details
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              {activeTab === 'overview' && candidate && (
                <div className="space-y-6">
                  {/* Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4">
                      <div className="flex items-center space-x-3">
                        <Trophy className="w-8 h-8 text-green-600" />
                        <div>
                          <p className="text-sm text-gray-600">Final Score</p>
                          <p className="text-2xl font-bold text-gray-900">{(candidate.final_score && candidate.final_score > 0 ? candidate.final_score : answeredAvg)}/10</p>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-4">
                      <div className="flex items-center space-x-3">
                        <Clock className="w-8 h-8 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-600">Questions Answered</p>
                          <p className="text-2xl font-bold text-gray-900">{questions.length}/6</p>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-4">
                      <div className="flex items-center space-x-3">
                        <MessageCircle className="w-8 h-8 text-purple-600" />
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <p className="text-lg font-semibold text-gray-900 capitalize">
                            {candidate.status.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Performance Chart */}
                  {questions.length > 0 && (
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Performance Analytics</h3>
                      <Bar data={chartData} options={chartOptions} />
                    </Card>
                  )}

                  {/* AI Summary */}
                  {candidate.final_summary && (
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">AI-Generated Summary</h3>
                      <p className="text-gray-700 leading-relaxed">{candidate.final_summary}</p>
                    </Card>
                  )}
                </div>
              )}

              {activeTab === 'details' && (
                <div className="space-y-6">
                  {questions.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No questions answered yet</p>
                    </div>
                  ) : (
                    questions.map((qa, index) => (
                      <Card key={qa.id} className="p-6">
                        <div className="space-y-4">
                          {/* Question Header */}
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Question {index + 1}</h3>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                qa.difficulty === 'Easy' ? 'text-green-600 bg-green-100' :
                                qa.difficulty === 'Medium' ? 'text-yellow-600 bg-yellow-100' :
                                'text-red-600 bg-red-100'
                              }`}>
                                {qa.difficulty}
                              </span>
                              <span className="text-sm text-gray-500">
                                {qa.time_taken}/{qa.time_limit}s
                              </span>
                            </div>
                          </div>

                          {/* Question */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="font-medium text-gray-900">{qa.question_text}</p>
                          </div>

                          {/* Answer */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Answer:</h4>
                            <p className="text-gray-700 bg-blue-50 p-4 rounded-lg">
                              {qa.answer || 'No answer provided'}
                            </p>
                          </div>

                          {/* AI Scores */}
                          {qa.ai_score && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="text-center p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm text-gray-600">Technical</p>
                                <p className="text-lg font-bold text-blue-600">{qa.ai_score.technical}/10</p>
                              </div>
                              <div className="text-center p-3 bg-green-50 rounded-lg">
                                <p className="text-sm text-gray-600">Clarity</p>
                                <p className="text-lg font-bold text-green-600">{qa.ai_score.clarity}/10</p>
                              </div>
                              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                <p className="text-sm text-gray-600">Problem Solving</p>
                                <p className="text-lg font-bold text-yellow-600">{qa.ai_score.problem_solving}/10</p>
                              </div>
                              <div className="text-center p-3 bg-purple-50 rounded-lg">
                                <p className="text-sm text-gray-600">Overall</p>
                                <p className="text-lg font-bold text-purple-600">{qa.ai_score.overall}/10</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};