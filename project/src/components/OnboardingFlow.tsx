import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, FileText } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { ResumeUpload } from './ResumeUpload';

interface CandidateInfo {
  name: string;
  email: string;
  phone: string;
  resumeFile?: File;
}

interface OnboardingFlowProps {
  onComplete: (candidateInfo: CandidateInfo) => void;
  initialData?: Partial<CandidateInfo>;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, initialData = {} }) => {
  // Skip to step 2 if we already have name and email from initialData
  const hasInitialData = initialData.name && initialData.email;
  const [step, setStep] = useState(hasInitialData ? 2 : 1);
  const [candidateInfo, setCandidateInfo] = useState<CandidateInfo>({
    name: initialData.name || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleResumeUpload = (file: File, extractedData: any) => {
    // Only apply fields that were actually found to avoid overwriting with undefined
    const safeName = typeof extractedData?.name === 'string' && extractedData.name.trim() ? extractedData.name.trim() : undefined;
    const safeEmail = typeof extractedData?.email === 'string' && extractedData.email.trim() ? extractedData.email.trim() : undefined;
    const safePhone = typeof extractedData?.phone === 'string' && extractedData.phone.trim() ? extractedData.phone.trim() : undefined;

    setCandidateInfo(prev => ({
      ...prev,
      ...(safeName ? { name: safeName } : {}),
      ...(safeEmail ? { email: safeEmail } : {}),
      ...(safePhone ? { phone: safePhone } : {}),
      resumeFile: file
    }));
    setStep(2);
  };

  const handleInputChange = (field: keyof CandidateInfo, value: string) => {
    setCandidateInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step === 2) {
      // Validate required fields
      if (!candidateInfo.name || !candidateInfo.email) {
        alert('Please fill in all required fields.');
        return;
      }
      setStep(3);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    
    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      alert('The request is taking too long. Please try again.');
    }, 30000); // 30 second timeout
    
    try {
      // Validate required fields before proceeding
      if (!candidateInfo.name.trim() || !candidateInfo.email.trim()) {
        alert('Please fill in all required fields.');
        clearTimeout(timeoutId);
        setIsLoading(false);
        return;
      }
      
      // Always call onComplete regardless of whether data is "new" or "existing"
      await Promise.race([
        onComplete(candidateInfo),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 25000)
        )
      ]);
      
      clearTimeout(timeoutId);
      // Success - loading state will be managed by parent component
      
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Error completing onboarding:', error);
      
      if (error instanceof Error && error.message === 'Timeout') {
        alert('The request timed out. Please check your connection and try again.');
      } else {
        alert('There was an error starting your interview. Please try again.');
      }
      
      setIsLoading(false);
    }
  };

  const steps = [
    { id: 1, title: 'Upload Resume', icon: FileText },
    { id: 2, title: 'Verify Information', icon: User },
    { id: 3, title: 'Ready to Start', icon: Mail }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((stepItem, index) => {
            const Icon = stepItem.icon;
            const isActive = step === stepItem.id;
            const isCompleted = step > stepItem.id;
            
            return (
              <div key={stepItem.id} className="flex items-center">
                <motion.div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center font-bold
                    ${isActive ? 'bg-blue-600 text-white' : 
                      isCompleted ? 'bg-green-600 text-white' : 
                      'bg-gray-200 text-gray-500'}
                  `}
                  animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <Icon className="w-5 h-5" />
                </motion.div>
                
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-4 rounded-full ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        <Card className="p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome to the AI Interview Assistant
                  </h1>
                  <p className="text-gray-600">
                    Let's start by uploading your resume to extract your basic information
                  </p>
                </div>
                
                <ResumeUpload onUpload={handleResumeUpload} />
                
                {/* Option to skip resume upload */}
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-3">or</p>
                  <Button 
                    onClick={() => setStep(2)} 
                    variant="secondary" 
                    className="w-full"
                  >
                    Skip Resume Upload - Enter Manually
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {hasInitialData ? 'Welcome Back!' : 'Verify Your Information'}
                  </h2>
                  <p className="text-gray-600">
                    {hasInitialData 
                      ? 'Please review your information and click Continue to start your interview'
                      : 'Please review and complete any missing information'
                    }
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={candidateInfo.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="email"
                        value={candidateInfo.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Enter your email address"
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="tel"
                        value={candidateInfo.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="Enter your phone number"
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleNext} className="w-full" size="lg">
                  {hasInitialData && candidateInfo.name && candidateInfo.email 
                    ? 'Start Interview Setup' 
                    : 'Continue'
                  }
                </Button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6 text-center"
              >
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Ready to Start Your Interview!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Your interview will consist of 6 questions with different difficulty levels.
                    Each question is timed, so be prepared to think quickly!
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold text-green-700">Easy Questions</h3>
                    <p className="text-sm text-green-600">2 questions • 20 seconds each</p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h3 className="font-semibold text-yellow-700">Medium Questions</h3>
                    <p className="text-sm text-yellow-600">2 questions • 60 seconds each</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <h3 className="font-semibold text-red-700">Hard Questions</h3>
                    <p className="text-sm text-red-600">2 questions • 120 seconds each</p>
                  </div>
                </div>

                <Button 
                  onClick={handleComplete} 
                  className="w-full" 
                  size="lg"
                  isLoading={isLoading}
                >
                  Start Interview
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
};