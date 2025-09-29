import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, this should be handled server-side
});

export interface AIScore {
  technical: number;
  clarity: number;
  problem_solving: number;
  overall: number;
  feedback: string;
}

export const generateInterviewQuestions = async (): Promise<Array<{
  question: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeLimit: number;
}>> => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert technical interviewer for full-stack React/Node.js positions. Generate exactly 6 interview questions following this structure:
          - 2 Easy questions (20 seconds each)
          - 2 Medium questions (60 seconds each)  
          - 2 Hard questions (120 seconds each)
          
          Return only a JSON array of objects with this exact format:
          [{"question": "question text", "difficulty": "Easy|Medium|Hard", "timeLimit": number}]
          
          Focus on practical full-stack development scenarios, React concepts, Node.js, databases, and problem-solving.`
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from OpenAI');

    return JSON.parse(content);
  } catch (error) {
    console.error('Error generating questions:', error);
    // Fallback questions
    return [
      { question: "What are React Hooks and why are they useful?", difficulty: "Easy" as const, timeLimit: 20 },
      { question: "Explain the difference between var, let, and const in JavaScript.", difficulty: "Easy" as const, timeLimit: 20 },
      { question: "How would you optimize a React application for performance?", difficulty: "Medium" as const, timeLimit: 60 },
      { question: "Explain how you would implement authentication in a Node.js application.", difficulty: "Medium" as const, timeLimit: 60 },
      { question: "Design a system to handle real-time notifications for a social media platform.", difficulty: "Hard" as const, timeLimit: 120 },
      { question: "How would you implement a caching strategy for a high-traffic web application?", difficulty: "Hard" as const, timeLimit: 120 }
    ];
  }
};

export const scoreAnswer = async (question: string, answer: string, difficulty: string): Promise<AIScore> => {
  try {
    // Check if API key is available
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      console.warn('OpenAI API key not found, using fallback scoring');
      return getFallbackScore(answer, difficulty);
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert technical interviewer evaluating a candidate's answer to a ${difficulty} difficulty full-stack development question. 
          
          Score the answer on three criteria (1-10 scale):
          1. Technical Accuracy: How technically correct and complete is the answer?
          2. Clarity & Communication: How well did they explain their thoughts?
          3. Problem-Solving Approach: How well did they approach the problem?
          
          Calculate an overall score (1-10) as the average of the three criteria and provide brief constructive feedback (max 100 words).
          
          Return ONLY valid JSON in this exact format with no additional text:
          {
            "technical": number,
            "clarity": number, 
            "problem_solving": number,
            "overall": number,
            "feedback": "brief feedback string"
          }
          
          Be fair but critical. Empty or very short answers should score 1-3. Good answers should score 6-8. Excellent answers should score 9-10.`
        },
        {
          role: "user",
          content: `Question: "${question}"\n\nCandidate's Answer: "${answer || 'No answer provided'}"\n\nDifficulty Level: ${difficulty}`
        }
      ],
      temperature: 0.3,
      max_tokens: 300
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error('No content in OpenAI response');
      return getFallbackScore(answer, difficulty);
    }

    // Clean the response to ensure it's valid JSON
    const cleanContent = content.trim().replace(/```json\n?|\n?```/g, '');
    const parsedScore = JSON.parse(cleanContent);
    
    // Validate the parsed score
    if (!parsedScore.technical || !parsedScore.clarity || !parsedScore.problem_solving || !parsedScore.overall) {
      console.error('Invalid score format from OpenAI:', parsedScore);
      return getFallbackScore(answer, difficulty);
    }
    
    return parsedScore;
  } catch (error) {
    console.error('Error scoring answer:', error);
    return getFallbackScore(answer, difficulty);
  }
};

const getFallbackScore = (answer: string, difficulty: string): AIScore => {
  // More intelligent fallback scoring based on answer length and content
  const answerLength = answer?.trim().length || 0;
  const hasKeywords = answer?.toLowerCase().includes('react') || 
                     answer?.toLowerCase().includes('javascript') || 
                     answer?.toLowerCase().includes('node') ||
                     answer?.toLowerCase().includes('function') ||
                     answer?.toLowerCase().includes('component');
  
  let baseScore = 1;
  
  if (answerLength === 0) {
    baseScore = 1;
  } else if (answerLength < 20) {
    baseScore = 2;
  } else if (answerLength < 50) {
    baseScore = hasKeywords ? 4 : 3;
  } else if (answerLength < 100) {
    baseScore = hasKeywords ? 6 : 4;
  } else {
    baseScore = hasKeywords ? 7 : 5;
  }
  
  // Adjust for difficulty
  if (difficulty === 'Easy') {
    baseScore = Math.min(baseScore + 1, 10);
  } else if (difficulty === 'Hard') {
    baseScore = Math.max(baseScore - 1, 1);
  }
  
  return {
    technical: baseScore,
    clarity: Math.max(baseScore - 1, 1),
    problem_solving: baseScore,
    overall: baseScore,
    feedback: answerLength === 0 ? 
      "No answer was provided within the time limit." : 
      `Your answer shows ${baseScore >= 6 ? 'good' : 'basic'} understanding. ${hasKeywords ? 'Good use of technical terminology.' : 'Consider using more specific technical terms.'}`
  };
};

export const generateFinalSummary = async (candidateName: string, questionsAndAnswers: any[]): Promise<string> => {
  try {
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      return generateFallbackSummary(candidateName, questionsAndAnswers);
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert technical interviewer creating a concise summary of a candidate's interview performance. Write 2-3 sentences highlighting their strengths and areas for improvement. Be constructive and specific."
        },
        {
          role: "user",
          content: `Candidate: ${candidateName}\n\nInterview Performance Data:\n${questionsAndAnswers.map((qa, i) => 
            `Q${i+1}: ${qa.question}\nAnswer: ${qa.answer}\nScores: Technical ${qa.score?.technical}/10, Clarity ${qa.score?.clarity}/10, Problem-solving ${qa.score?.problem_solving}/10`
          ).join('\n\n')}`
        }
      ],
      temperature: 0.5,
      max_tokens: 200
    });

    return response.choices[0]?.message?.content || generateFallbackSummary(candidateName, questionsAndAnswers);
  } catch (error) {
    console.error('Error generating summary:', error);
    return generateFallbackSummary(candidateName, questionsAndAnswers);
  }
};

const generateFallbackSummary = (candidateName: string, questionsAndAnswers: any[]): string => {
  const avgScore = questionsAndAnswers.reduce((sum, qa) => sum + (qa.score?.overall || 0), 0) / questionsAndAnswers.length;
  
  if (avgScore >= 7) {
    return `${candidateName} demonstrated strong technical knowledge and problem-solving skills throughout the interview. Their answers showed good understanding of full-stack development concepts with clear communication.`;
  } else if (avgScore >= 5) {
    return `${candidateName} showed decent technical understanding with room for improvement in some areas. They would benefit from deeper knowledge of full-stack development practices and clearer communication of technical concepts.`;
  } else {
    return `${candidateName} completed the interview but showed limited technical knowledge in several areas. Additional study and practice with full-stack development concepts would be beneficial before future interviews.`;
  }
};