import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface WelcomeBackModalProps {
  isOpen: boolean;
  candidateName: string;
  currentQuestion: number;
  totalQuestions: number;
  onContinue: () => void;
  onRestart: () => void;
}

export const WelcomeBackModal: React.FC<WelcomeBackModalProps> = ({
  isOpen,
  candidateName,
  currentQuestion,
  totalQuestions,
  onContinue,
  onRestart
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // Prevent closing without action
      title="Welcome Back!"
    >
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Hello {candidateName}!
          </h3>
          <p className="text-gray-600">
            We found an incomplete interview session. You were on question {currentQuestion} of {totalQuestions}.
          </p>
        </motion.div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-700">
            Your progress has been saved. You can continue from where you left off or start over.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={onRestart}
            className="flex items-center justify-center space-x-2 flex-1"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Start Over</span>
          </Button>
          
          <Button
            onClick={onContinue}
            className="flex items-center justify-center space-x-2 flex-1"
          >
            <span>Continue Interview</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Modal>
  );
};