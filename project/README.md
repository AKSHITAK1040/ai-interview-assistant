# AI Interview Assistant

An intelligent technical interview platform that standardizes, streamlines, and enhances the hiring process using AI-powered evaluation and automated resume parsing.

## 🚀 Features

### For Candidates
- **Smart Resume Upload**: Automatic PDF parsing and data extraction
- **Structured Interviews**: 6 questions with varying difficulty levels (Easy, Medium, Hard)
- **Real-time Feedback**: Instant AI evaluation and scoring
- **Fair Assessment**: Consistent, bias-free evaluation process

### For Interviewers
- **Comprehensive Dashboard**: Real-time candidate analytics and performance metrics
- **AI-Generated Summaries**: Detailed candidate assessments and insights
- **Data-Driven Decisions**: Visual analytics and scoring breakdowns
- **Efficient Workflow**: Reduced time-to-hire with automated evaluation

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express.js
- **AI Integration**: OpenAI GPT-4
- **Database**: Supabase (PostgreSQL)
- **PDF Processing**: PDF.js
- **Charts**: Chart.js with React Chart.js 2
- **Build Tool**: Vite
- **Deployment**: Ready for Vercel

## 🏁 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenAI API Key
- Supabase Account

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd ai-interview-assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Start the development servers**
   ```bash
   # Start the frontend (in project root)
   npm run dev
   
   # Start the backend server (in another terminal)
   cd server
   node index.js
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 📊 Database Setup

### Supabase Tables

The application requires the following tables:

#### `candidates`
```sql
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  status TEXT DEFAULT 'in_progress',
  final_score DECIMAL,
  final_summary TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `questions_and_answers`
```sql
CREATE TABLE questions_and_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id),
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  time_limit INTEGER NOT NULL,
  answer TEXT NOT NULL,
  time_taken INTEGER NOT NULL,
  ai_score JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🎯 Usage

### For Candidates
1. **Upload Resume**: Drag and drop or select a PDF resume
2. **Verify Information**: Review and complete extracted details
3. **Start Interview**: Begin the structured 6-question interview
4. **Answer Questions**: Respond within time limits for each difficulty level
5. **View Results**: Receive immediate AI feedback and scoring

### For Interviewers
1. **Access Dashboard**: Switch to the "Interviewer" tab
2. **Review Candidates**: View all candidate submissions and statuses
3. **Analyze Performance**: Review detailed AI-generated assessments
4. **Make Decisions**: Use comprehensive data for informed hiring choices

## 🔧 Configuration

### Interview Questions
Questions are generated dynamically by OpenAI based on:
- 2 Easy questions (20 seconds each)
- 2 Medium questions (60 seconds each) 
- 2 Hard questions (120 seconds each)

### AI Evaluation
Each answer is scored on:
- Technical accuracy
- Problem-solving approach
- Communication clarity
- Overall competency (1-10 scale)

## 🚀 Deployment

### Vercel Deployment
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel`
4. Configure environment variables in Vercel dashboard

### Environment Variables for Production
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Features Roadmap

- [ ] Video interview integration
- [ ] Multiple programming language support
- [ ] Custom question templates
- [ ] Advanced analytics and reporting
- [ ] Integration with ATS systems
- [ ] Mobile-responsive design enhancements

## 💡 About

This AI Interview Assistant was built to solve the challenges of modern technical hiring:
- Inconsistent interview experiences
- Time-consuming manual evaluations
- Unconscious bias in hiring decisions
- Lack of standardized assessment metrics

By leveraging AI and modern web technologies, this platform creates a fair, efficient, and insightful interview process for both candidates and hiring teams.

---

