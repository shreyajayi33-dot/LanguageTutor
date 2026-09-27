🌐 LanguageTutor

LanguageTutor is a language-learning chatbot application designed to help learners improve their English through interactive practice and personalized learning features.

✨ Features

- 💬 Conversation Practice
- 📚 Grammar Exercises
- 🧠 Vocabulary Learning
- 🎤 Speaking Practice
- 🔊 Pronunciation Practice
- 📖 Reading Practice
- ✍️ Writing Practice
- 🎧 Listening Practice
- 🎭 Real-life Scenarios
- 🎮 Learning Game
- 🧠 Personalized Lessons
- ⭐ XP and Levels
- 🔥 Daily Streaks
- 🏆 Achievements
- 📊 Learning Statistics
- 🎯 Personalized Daily Goals
- 📅 Learning History
- 📜 Certificate
- 🔔 Practice Reminders
- 🔐 Supabase Authentication and Progress Sync
- 🤖 Ollama-powered AI conversation support

🛠️ Technologies Used

- React / React Native
- Expo
- Expo Router
- TypeScript
- Supabase
- Ollama
- AsyncStorage
- Expo Speech
- Expo Speech Recognition
- Expo Notifications

📱 Android Build

The project can be built for Android using EAS Build.

npx eas build --platform android --profile preview

For a production build:

npx eas build --platform android --profile production

💻 Running the Project

Install the dependencies:

npm install

Start the Expo development server:

npx expo start

🤖 Ollama

The application can use Ollama for local AI functionality.

Make sure Ollama is installed and the required model is available before using the AI conversation features.

Example:

ollama list

Keep in mind that when testing on a physical phone, "localhost" refers to the phone itself. The phone and computer need to be on the same network when connecting to an Ollama server running on the computer.

🔐 Environment Variables

Private environment variables should be stored in ".env.local" and must not be uploaded to GitHub.

Do not publish:

- Supabase service-role keys
- Private API keys
- Passwords
- Authentication secrets
- Other credentials

🗂️ Project Structure

LanguageTutor/
├── src/
│   └── app/
│       └── index.tsx
├── lib/
│   └── supabase.ts
├── assets/
├── app.json
├── eas.json
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md

🎯 Project Goal

The goal of LanguageTutor is to provide an interactive learning environment where learners can practice different language skills, track their progress, and receive personalized learning support.

👨‍💻 Project Status

The project is actively developed and includes an Android build configuration through Expo Application Services (EAS).

📌 Note for Evaluators

Some AI functionality depends on a locally running Ollama server. Other application features can be tested independently through the application interface.

---

LanguageTutor — Learn, Practice, Improve. 🚀