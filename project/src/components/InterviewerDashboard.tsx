import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Eye, Trophy, Clock, User, ArrowUpDown } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { supabase, Candidate } from '../lib/supabase';
import { CandidateDetailModal } from './CandidateDetailModal';

interface InterviewerDashboardProps {
  refreshTrigger?: number;
}

export const InterviewerDashboard: React.FC<InterviewerDashboardProps> = ({ refreshTrigger }) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'date'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadCandidates = async () => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const baseList = data || [];

      // For candidates with no final_score yet, compute a fallback from answered questions
      const withComputed = await Promise.all(baseList.map(async (c: any) => {
        const totalQuestions = 6;
        // If we already have a final score, infer completed
        if (c?.final_score && c.final_score > 0) {
          return { ...c, _display_status: 'completed' };
        }
        try {
          const { data: qas } = await supabase
            .from('questions_and_answers')
            .select('ai_score')
            .eq('candidate_id', c.id);
          const count = qas?.length || 0;
          let avg = 0;
          if (qas && qas.length) {
            const overalls = qas.map((q: any) => q?.ai_score?.overall || 0).filter((n: number) => typeof n === 'number');
            avg = overalls.length ? Math.round((overalls.reduce((s: number, v: number) => s + v, 0) / overalls.length) * 10) / 10 : 0;
          }
          let displayStatus = c.status;
          if (count >= totalQuestions) displayStatus = 'completed';
          else if (count > 0) displayStatus = 'in_progress';
          return { ...c, _computed_score: avg, _answered_count: count, _display_status: displayStatus };
        } catch (e) {
          console.error('Error computing fallback score for candidate', c.id, e);
          return { ...c, _computed_score: 0, _answered_count: 0 };
        }
      }));

      setCandidates(withComputed);
    } catch (error) {
      console.error('Error loading candidates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, [refreshTrigger]);

  useEffect(() => {
    let filtered = [...candidates];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(candidate =>
        candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(candidate => candidate.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a: any, b: any) => {
      let comparison = 0;
      
      if (sortBy === 'score') {
        const sa = getCandidateScore(a);
        const sb = getCandidateScore(b);
        comparison = sa - sb;
      } else {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredCandidates(filtered);
  }, [candidates, searchTerm, statusFilter, sortBy, sortOrder]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-700 bg-green-100';
      case 'in_progress': return 'text-blue-700 bg-blue-100';
      case 'incomplete': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCandidateScore = (c: any): number => {
    return (c?.final_score && c.final_score > 0) ? c.final_score : (c?._computed_score || 0);
  };

  const getDisplayStatus = (c: any): string => {
    return c?._display_status || c?.status || 'in_progress';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Interviewer Dashboard</h1>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="incomplete">Incomplete</option>
            <option value="onboarding">Onboarding</option>
          </select>
          
          {/* Sort */}
          <div className="flex space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'score' | 'date')}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="score">Sort by Score</option>
              <option value="date">Sort by Date</option>
            </select>
            
            <Button
              variant="secondary"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3"
            >
              <ArrowUpDown className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Candidates</p>
              <p className="text-2xl font-bold text-gray-900">{candidates.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {candidates.filter((c: any) => getDisplayStatus(c) === 'completed').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {candidates.filter((c: any) => getDisplayStatus(c) === 'in_progress').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {(() => {
                  const completed = candidates.filter((c: any) => getDisplayStatus(c) === 'completed');
                  if (!completed.length) return '0';
                  const avg = completed.reduce((sum: number, c: any) => sum + getCandidateScore(c), 0) / completed.length;
                  return Math.round(avg * 10) / 10;
                })()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Candidates List */}
      <div className="flex-1 p-6 overflow-y-auto">
        {filteredCandidates.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No candidates found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCandidates.map((candidate) => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                layout
              >
                <Card hover className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {candidate.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{candidate.name}</h3>
                        <p className="text-sm text-gray-600">{candidate.email}</p>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(getDisplayStatus(candidate))}`}>
                            {getDisplayStatus(candidate).replace('_', ' ')}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(candidate.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Score</p>
                        <p className={`text-2xl font-bold ${getScoreColor(getCandidateScore(candidate))}`}>
                          {getCandidateScore(candidate)}/10
                        </p>
                      </div>
                      
                      <Button
                        variant="secondary"
                        onClick={() => setSelectedCandidate(candidate.id)}
                        className="flex items-center space-x-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <CandidateDetailModal
          candidateId={selectedCandidate}
          isOpen={!!selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
        />
      )}
    </div>
  );
};