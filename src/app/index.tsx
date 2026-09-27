"use client";
import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import * as Speech from "expo-speech";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent, } from "expo-speech-recognition";
import { useEffect, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";


type Exercise = {
  question: string;
  options: string[];
  answer: string;
};

type VocabularyWord = {
  word: string;
  meaning: string;
  example: string;
  options: string[];
  answer: string;
};

type DailyRecord = {
  date: string;
  exercises: number;
  exerciseCorrect: number;
  vocabulary: number;
  vocabularyCorrect: number;
  speaking: number;
  speakingSuccessful: number;
  pronunciation: number;
  reading: number;
  writing: number;
  listening: number;
  scenario: number;
  game: number;
  xp: number;
  dailyWord: boolean;
};

type Goals = {
  exercises: number;
  vocabulary: number;
  speaking: number;
  pronunciation: number;
};

type Lesson = {
  title: string;
  description: string;
  activity: string;
  tip: string;
};

const STORAGE_KEY = "languageTutorComplete";
const exercises: Record<string, Exercise[]> = {
  Beginner: [
    {
      question: "Choose the correct word: She ___ to school every day.",
      options: ["go", "goes", "going"],
      answer: "goes",
    },
    {
      question: "Choose the correct word: I ___ a student.",
      options: ["am", "is", "are"],
      answer: "am",
    },
    {
      question: "Choose the correct word: They ___ happy.",
      options: ["is", "am", "are"],
      answer: "are",
    },
    {
      question: "Choose the correct word: He ___ football.",
      options: ["play", "plays", "playing"],
      answer: "plays",
    },
    {
      question: "Choose the correct word: We ___ English.",
      options: ["learn", "learns", "learning"],
      answer: "learn",
    },
  ],

  Intermediate: [
    {
      question: "Choose the correct sentence.",
      options: [
        "I have finished my homework.",
        "I has finished my homework.",
        "I having finished my homework.",
      ],
      answer: "I have finished my homework.",
    },
    {
      question: "She has lived here ___ 2020.",
      options: ["for", "since", "from"],
      answer: "since",
    },
    {
      question: "He is ___ than his brother.",
      options: ["tall", "taller", "tallest"],
      answer: "taller",
    },
    {
      question: "If I ___ time, I will call you.",
      options: ["have", "had", "having"],
      answer: "have",
    },
    {
      question: "They ___ already eaten lunch.",
      options: ["has", "have", "having"],
      answer: "have",
    },
  ],

  Advanced: [
    {
      question: "Choose the correct sentence.",
      options: [
        "Had I known, I would have helped.",
        "Had I knew, I would have helped.",
        "Had I know, I would have helped.",
      ],
      answer: "Had I known, I would have helped.",
    },
    {
      question:
        "The report, ___ was published yesterday, received attention.",
      options: ["which", "who", "where"],
      answer: "which",
    },
    {
      question: "She insisted ___ paying the bill.",
      options: ["on", "to", "for"],
      answer: "on",
    },
    {
      question: "If I had known, I ___ earlier.",
      options: [
        "would have arrived",
        "will arrive",
        "arrive",
      ],
      answer: "would have arrived",
    },
    {
      question:
        "He suggested that she ___ the problem carefully.",
      options: ["consider", "considers", "considered"],
      answer: "consider",
    },
  ],
};

const translatedExercises: Record<
  string,
  Record<string, Exercise[]>
> = {
  Hindi: {
    Beginner: [
      {
        question: "सही शब्द चुनें: वह हर दिन स्कूल ___।",
        options: ["जाता", "जाती", "जाना"],
        answer: "जाती",
      },
      {
        question: "सही शब्द चुनें: मैं एक छात्र ___।",
        options: ["हूँ", "है", "हैं"],
        answer: "हूँ",
      },
      {
        question: "सही शब्द चुनें: वे खुश ___।",
        options: ["है", "हूँ", "हैं"],
        answer: "हैं",
      },
      {
        question: "सही शब्द चुनें: वह फुटबॉल ___।",
        options: ["खेलना", "खेलता", "खेलते"],
        answer: "खेलता",
      },
      {
        question: "सही शब्द चुनें: हम अंग्रेज़ी ___।",
        options: ["सीखते हैं", "सीखता है", "सीखना"],
        answer: "सीखते हैं",
      },
    ],

    Intermediate: [
      {
        question: "सही वाक्य चुनें।",
        options: [
          "मैंने अपना होमवर्क पूरा कर लिया है।",
          "मैंने अपना होमवर्क पूरा कर लिया हैं।",
          "मैं अपना होमवर्क पूरा कर रहा।",
        ],
        answer: "मैंने अपना होमवर्क पूरा कर लिया है।",
      },
      {
        question: "वह 2020 ___ यहाँ रह रही है।",
        options: ["से", "के लिए", "से पहले"],
        answer: "से",
      },
      {
        question: "वह अपने भाई से ___ है।",
        options: ["लंबा", "लंबा है", "सबसे लंबा"],
        answer: "लंबा है",
      },
      {
        question: "अगर मेरे पास समय ___, तो मैं तुम्हें फोन करूँगा।",
        options: ["है", "था", "होना"],
        answer: "है",
      },
      {
        question: "वे पहले ही दोपहर का खाना ___ चुके हैं।",
        options: ["खा", "खाया", "खाना"],
        answer: "खा",
      },
    ],

    Advanced: [
      {
        question: "सही वाक्य चुनें।",
        options: [
          "अगर मुझे पता होता, तो मैंने मदद की होती।",
          "अगर मुझे पता था, तो मैंने मदद की।",
          "अगर मुझे पता है, तो मैं मदद करता।",
        ],
        answer: "अगर मुझे पता होता, तो मैंने मदद की होती।",
      },
      {
        question: "वह रिपोर्ट, ___ कल प्रकाशित हुई थी, बहुत ध्यान आकर्षित कर रही है।",
        options: ["जो", "जिसने", "जहाँ"],
        answer: "जो",
      },
      {
        question: "उसने बिल का भुगतान करने पर जोर दिया।",
        options: ["पर", "को", "के लिए"],
        answer: "पर",
      },
      {
        question: "अगर मुझे पता होता, तो मैं पहले ___।",
        options: ["पहुंच गया होता", "पहुंचूँगा", "पहुंचता"],
        answer: "पहुंच गया होता",
      },
      {
        question: "उसने सुझाव दिया कि वह समस्या पर ध्यान से ___।",
        options: ["विचार करे", "विचार करता है", "विचार किया"],
        answer: "विचार करे",
      },
    ],
  },

  Kannada: {
    Beginner: [
      {
        question: "ಸರಿಯಾದ ಪದವನ್ನು ಆಯ್ಕೆಮಾಡಿ: ಅವಳು ಪ್ರತಿದಿನ ಶಾಲೆಗೆ ___।",
        options: ["ಹೋಗು", "ಹೋಗುತ್ತಾಳೆ", "ಹೋಗುವುದು"],
        answer: "ಹೋಗುತ್ತಾಳೆ",
      },
      {
        question: "ಸರಿಯಾದ ಪದವನ್ನು ಆಯ್ಕೆಮಾಡಿ: ನಾನು ವಿದ್ಯಾರ್ಥಿ ___।",
        options: ["ಆಗಿದ್ದೇನೆ", "ಆಗಿದ್ದಾನೆ", "ಆಗಿದ್ದಾರೆ"],
        answer: "ಆಗಿದ್ದೇನೆ",
      },
      {
        question: "ಸರಿಯಾದ ಪದವನ್ನು ಆಯ್ಕೆಮಾಡಿ: ಅವರು ಸಂತೋಷವಾಗಿದ್ದಾರೆ ___।",
        options: ["ಇದೆ", "ಇದ್ದೇನೆ", "ಇದ್ದಾರೆ"],
        answer: "ಇದ್ದಾರೆ",
      },
      {
        question: "ಸರಿಯಾದ ಪದವನ್ನು ಆಯ್ಕೆಮಾಡಿ: ಅವನು ಫುಟ್ಬಾಲ್ ___।",
        options: ["ಆಡು", "ಆಡುತ್ತಾನೆ", "ಆಡುವುದು"],
        answer: "ಆಡುತ್ತಾನೆ",
      },
      {
        question: "ಸರಿಯಾದ ಪದವನ್ನು ಆಯ್ಕೆಮಾಡಿ: ನಾವು ಇಂಗ್ಲಿಷ್ ___।",
        options: ["ಕಲಿಯುತ್ತೇವೆ", "ಕಲಿಯುತ್ತಾನೆ", "ಕಲಿಯುವುದು"],
        answer: "ಕಲಿಯುತ್ತೇವೆ",
      },
    ],

    Intermediate: [
      {
        question: "ಸರಿಯಾದ ವಾಕ್ಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
        options: [
          "ನಾನು ನನ್ನ ಮನೆಕೆಲಸವನ್ನು ಮುಗಿಸಿದ್ದೇನೆ.",
          "ನಾನು ನನ್ನ ಮನೆಕೆಲಸವನ್ನು ಮುಗಿಸಿದ್ದಾನೆ.",
          "ನಾನು ನನ್ನ ಮನೆಕೆಲಸವನ್ನು ಮುಗಿಸುತ್ತಿದ್ದೇನೆ.",
        ],
        answer: "ನಾನು ನನ್ನ ಮನೆಕೆಲಸವನ್ನು ಮುಗಿಸಿದ್ದೇನೆ.",
      },
      {
        question: "ಅವಳು 2020 ___ ಇಲ್ಲಿ ವಾಸಿಸುತ್ತಿದ್ದಾಳೆ.",
        options: ["ರಿಂದ", "ಗಾಗಿ", "ಮುಂಚೆ"],
        answer: "ರಿಂದ",
      },
      {
        question: "ಅವನು ತನ್ನ ಸಹೋದರನಿಗಿಂತ ___।",
        options: ["ಎತ್ತರ", "ಎತ್ತರವಾಗಿದ್ದಾನೆ", "ಅತ್ಯಂತ ಎತ್ತರ"],
        answer: "ಎತ್ತರವಾಗಿದ್ದಾನೆ",
      },
      {
        question: "ನನಗೆ ಸಮಯ ___ ನಾನು ನಿಮಗೆ ಕರೆ ಮಾಡುತ್ತೇನೆ.",
        options: ["ಇದ್ದರೆ", "ಇತ್ತು", "ಇರುವುದು"],
        answer: "ಇದ್ದರೆ",
      },
      {
        question: "ಅವರು ಈಗಾಗಲೇ ಮಧ್ಯಾಹ್ನದ ಊಟವನ್ನು ___।",
        options: ["ತಿಂದಿದ್ದಾರೆ", "ತಿನ್ನುತ್ತಾರೆ", "ತಿನ್ನುವುದು"],
        answer: "ತಿಂದಿದ್ದಾರೆ",
      },
    ],

    Advanced: [
      {
        question: "ಸರಿಯಾದ ವಾಕ್ಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
        options: [
          "ನನಗೆ ತಿಳಿದಿದ್ದರೆ, ನಾನು ಸಹಾಯ ಮಾಡುತ್ತಿದ್ದೆ.",
          "ನನಗೆ ತಿಳಿದಿತ್ತು, ನಾನು ಸಹಾಯ ಮಾಡಿದೆ.",
          "ನನಗೆ ತಿಳಿದಿದೆ, ನಾನು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.",
        ],
        answer: "ನನಗೆ ತಿಳಿದಿದ್ದರೆ, ನಾನು ಸಹಾಯ ಮಾಡುತ್ತಿದ್ದೆ.",
      },
      {
        question: "ನಿನ್ನೆ ಪ್ರಕಟವಾದ ವರದಿಯು ಗಮನ ಸೆಳೆಯಿತು. ಸರಿಯಾದ ಪದ ಯಾವುದು?",
        options: ["ಅದು", "ಯಾರು", "ಎಲ್ಲಿ"],
        answer: "ಅದು",
      },
      {
        question: "ಅವಳು ಬಿಲ್ ಪಾವತಿಸುವುದಕ್ಕೆ ___ ಒತ್ತಾಯಿಸಿದಳು.",
        options: ["ಮೇಲೆ", "ಗೆ", "ಗಾಗಿ"],
        answer: "ಮೇಲೆ",
      },
      {
        question: "ನನಗೆ ತಿಳಿದಿದ್ದರೆ, ನಾನು ಮೊದಲೇ ___।",
        options: ["ಬಂದಿರುತ್ತಿದ್ದೆ", "ಬರುತ್ತೇನೆ", "ಬರುತ್ತಿದ್ದೇನೆ"],
        answer: "ಬಂದಿರುತ್ತಿದ್ದೆ",
      },
      {
        question: "ಅವಳು ಸಮಸ್ಯೆಯನ್ನು ಎಚ್ಚರಿಕೆಯಿಂದ ___ ಎಂದು ಸಲಹೆ ನೀಡಿದಳು.",
        options: ["ಪರಿಗಣಿಸಲಿ", "ಪರಿಗಣಿಸುತ್ತಾಳೆ", "ಪರಿಗಣಿಸಿದಳು"],
        answer: "ಪರಿಗಣಿಸಲಿ",
      },
    ],
  },
Tamil: {
    Beginner: [
      {
        question: "சரியான வார்த்தையைத் தேர்ந்தெடுக்கவும்: அவன் தினமும் பள்ளிக்கு ___।",
        options: ["செல்கிறான்", "செல்கிறாள்", "செல்"],
        answer: "செல்கிறான்",
      },
      {
        question: "சரியான வார்த்தையைத் தேர்ந்தெடுக்கவும்: நான் ஒரு மாணவன் ___।",
        options: ["ஆகிறேன்", "ஆகிறான்", "ஆகிறார்கள்"],
        answer: "ஆகிறேன்",
      },
      {
        question: "சரியான வார்த்தையைத் தேர்ந்தெடுக்கவும்: அவர்கள் மகிழ்ச்சியாக ___।",
        options: ["இருக்கிறார்", "இருக்கிறேன்", "இருக்கிறார்கள்"],
        answer: "இருக்கிறார்கள்",
      },
    ],
    Intermediate: [
      {
        question: "சரியான வாக்கியத்தைத் தேர்ந்தெடுக்கவும்.",
        options: [
          "நான் என் வீட்டுப்பாடத்தை முடித்துவிட்டேன்.",
          "நான் என் வீட்டுப்பாடத்தை முடித்துவிட்டான்.",
          "நான் என் வீட்டுப்பாடத்தை முடிப்பேன்.",
        ],
        answer: "நான் என் வீட்டுப்பாடத்தை முடித்துவிட்டேன்.",
      },
    ],
    Advanced: [
      {
        question: "சரியான வாக்கியத்தைத் தேர்ந்தெடுக்கவும்.",
        options: [
          "எனக்குத் தெரிந்திருந்தால், நான் உதவி செய்திருப்பேன்.",
          "எனக்குத் தெரியும், நான் உதவி செய்திருப்பேன்.",
          "எனக்குத் தெரிந்தது, நான் உதவி செய்வேன்.",
        ],
        answer: "எனக்குத் தெரிந்திருந்தால், நான் உதவி செய்திருப்பேன்.",
      },
    ],
  },

  Telugu: {
    Beginner: [
      {
        question: "సరైన పదాన్ని ఎంచుకోండి: అతను ప్రతిరోజూ పాఠశాలకు ___।",
        options: ["వెళ్తాడు", "వెళ్తుంది", "వెళ్ళు"],
        answer: "వెళ్తాడు",
      },
      {
        question: "సరైన పదాన్ని ఎంచుకోండి: నేను విద్యార్థిని ___।",
        options: ["అను", "అతను", "అన్నారు"],
        answer: "అను",
      },
      {
        question: "సరైన పదాన్ని ఎంచుకోండి: వారు సంతోషంగా ___।",
        options: ["ఉన్నాడు", "ఉన్నాను", "ఉన్నారు"],
        answer: "ఉన్నారు",
      },
    ],
    Intermediate: [
      {
        question: "సరైన వాక్యాన్ని ఎంచుకోండి.",
        options: [
          "నేను నా హోంవర్క్ పూర్తి చేశాను.",
          "నేను నా హోంవర్క్ పూర్తి చేశాడు.",
          "నేను నా హోంవర్క్ పూర్తి చేయడం.",
        ],
        answer: "నేను నా హోంవర్క్ పూర్తి చేశాను.",
      },
    ],
    Advanced: [
      {
        question: "సరైన వాక్యాన్ని ఎంచుకోండి.",
        options: [
          "నాకు తెలిసి ఉంటే, నేను సహాయం చేసేవాడిని.",
          "నాకు తెలుసు, నేను సహాయం చేసేవాడిని.",
          "నాకు తెలుసు, నేను సహాయం చేస్తాను.",
        ],
        answer: "నాకు తెలిసి ఉంటే, నేను సహాయం చేసేవాడిని.",
      },
    ],
  },

  Malayalam: {
    Beginner: [
      {
        question: "ശരിയായ വാക്ക് തിരഞ്ഞെടുക്കുക: അവൻ എല്ലാ ദിവസവും സ്കൂളിൽ ___।",
        options: ["പോകുന്നു", "പോകുന്നുൾ", "പോകുക"],
        answer: "പോകുന്നു",
      },
      {
        question: "ശരിയായ വാക്ക് തിരഞ്ഞെടുക്കുക: ഞാൻ ഒരു വിദ്യാർത്ഥി ___।",
        options: ["ആണ്", "ആകുന്നു", "ആയിരുന്നു"],
        answer: "ആണ്",
      },
      {
        question: "ശരിയായ വാക്ക് തിരഞ്ഞെടുക്കുക: അവർ സന്തോഷമുള്ളവർ ___।",
        options: ["ആണ്", "ആകുന്നു", "ആയിരുന്നു"],
        answer: "ആകുന്നു",
      },
    ],
    Intermediate: [
      {
        question: "ശരിയായ വാക്യം തിരഞ്ഞെടുക്കുക.",
        options: [
          "ഞാൻ എന്റെ ഗൃഹപാഠം പൂർത്തിയാക്കി.",
          "ഞാൻ എന്റെ ഗൃഹപാഠം പൂർത്തിയാക്കി ആണ്.",
          "ഞാൻ എന്റെ ഗൃഹപാഠം പൂർത്തിയാക്കുന്നു.",
        ],
        answer: "ഞാൻ എന്റെ ഗൃഹപാഠം പൂർത്തിയാക്കി.",
      },
    ],
    Advanced: [
      {
        question: "ശരിയായ വാക്യം തിരഞ്ഞെടുക്കുക.",
        options: [
          "എനിക്ക് അറിയാമായിരുന്നെങ്കിൽ ഞാൻ സഹായിക്കുമായിരുന്നു.",
          "എനിക്ക് അറിയുന്നു ഞാൻ സഹായിക്കുമായിരുന്നു.",
          "എനിക്ക് അറിയാമായിരുന്നു ഞാൻ സഹായിക്കും.",
        ],
        answer: "എനിക്ക് അറിയാമായിരുന്നെങ്കിൽ ഞാൻ സഹായിക്കുമായിരുന്നു.",
      },
    ],
  },

  Spanish: {
    Beginner: [
      {
        question: "Elige la palabra correcta: Ella ___ a la escuela todos los días.",
        options: ["va", "voy", "ir"],
        answer: "va",
      },
      {
        question: "Elige la palabra correcta: Yo ___ estudiante.",
        options: ["soy", "es", "son"],
        answer: "soy",
      },
      {
        question: "Elige la palabra correcta: Ellos ___ felices.",
        options: ["es", "soy", "son"],
        answer: "son",
      },
    ],
    Intermediate: [
      {
        question: "Elige la oración correcta.",
        options: [
          "He terminado mi tarea.",
          "He termina mi tarea.",
          "He terminando mi tarea.",
        ],
        answer: "He terminado mi tarea.",
      },
    ],
    Advanced: [
      {
        question: "Elige la oración correcta.",
        options: [
          "Si lo hubiera sabido, habría ayudado.",
          "Si lo hubiera sé, habría ayudado.",
          "Si lo sé, habría ayudado.",
        ],
        answer: "Si lo hubiera sabido, habría ayudado.",
      },
    ],
  },

  French: {
    Beginner: [
      {
        question: "Choisissez le bon mot : Elle ___ à l'école tous les jours.",
        options: ["va", "vais", "aller"],
        answer: "va",
      },
      {
        question: "Choisissez le bon mot : Je ___ étudiant.",
        options: ["suis", "est", "sont"],
        answer: "suis",
      },
      {
        question: "Choisissez le bon mot : Ils ___ heureux.",
        options: ["est", "suis", "sont"],
        answer: "sont",
      },
    ],
    Intermediate: [
      {
        question: "Choisissez la phrase correcte.",
        options: [
          "J'ai terminé mes devoirs.",
          "J'ai terminer mes devoirs.",
          "J'ai terminant mes devoirs.",
        ],
        answer: "J'ai terminé mes devoirs.",
      },
    ],
    Advanced: [
      {
        question: "Choisissez la phrase correcte.",
        options: [
          "Si je l'avais su, j'aurais aidé.",
          "Si je l'avais sais, j'aurais aidé.",
          "Si je le sais, j'aurais aidé.",
        ],
        answer: "Si je l'avais su, j'aurais aidé.",
      },
    ],
  },

  German: {
    Beginner: [
      {
        question: "Wähle das richtige Wort: Sie ___ jeden Tag zur Schule.",
        options: ["geht", "gehen", "gehe"],
        answer: "geht",
      },
      {
        question: "Wähle das richtige Wort: Ich ___ Schüler.",
        options: ["bin", "ist", "sind"],
        answer: "bin",
      },
      {
        question: "Wähle das richtige Wort: Sie ___ glücklich.",
        options: ["ist", "bin", "sind"],
        answer: "sind",
      },
    ],
    Intermediate: [
      {
        question: "Wähle den richtigen Satz.",
        options: [
          "Ich habe meine Hausaufgaben beendet.",
          "Ich hat meine Hausaufgaben beendet.",
          "Ich habe meine Hausaufgaben beenden.",
        ],
        answer: "Ich habe meine Hausaufgaben beendet.",
      },
    ],
    Advanced: [
      {
        question: "Wähle den richtigen Satz.",
        options: [
          "Wenn ich es gewusst hätte, hätte ich geholfen.",
          "Wenn ich es gewusst habe, hätte ich geholfen.",
          "Wenn ich es weiß, hätte ich geholfen.",
        ],
        answer: "Wenn ich es gewusst hätte, hätte ich geholfen.",
      },
    ],
  },

  Japanese: {
    Beginner: [
      {
        question: "正しい言葉を選んでください：彼女は毎日学校へ___。",
        options: ["行きます", "行きました", "行く"],
        answer: "行きます",
      },
      {
        question: "正しい言葉を選んでください：私は学生___。",
        options: ["です", "ます", "でした"],
        answer: "です",
      },
      {
        question: "正しい言葉を選んでください：彼らは幸せ___。",
        options: ["です", "ます", "でした"],
        answer: "です",
      },
    ],
    Intermediate: [
      {
        question: "正しい文を選んでください。",
        options: [
          "私は宿題を終えました。",
          "私は宿題を終えますた。",
          "私は宿題を終えるでした。",
        ],
        answer: "私は宿題を終えました。",
      },
    ],
    Advanced: [
      {
        question: "正しい文を選んでください。",
        options: [
          "もし知っていたら、助けていたでしょう。",
          "もし知りますたら、助けていたでしょう。",
          "もし知るなら、助けていました。",
        ],
        answer: "もし知っていたら、助けていたでしょう。",
      },
    ],
  },
};

const vocabulary: VocabularyWord[] = [
  {
    word: "Curious",
    meaning: "Wanting to learn or know something.",
    example: "The curious student asked many questions.",
    options: [
      "Wanting to learn",
      "Feeling tired",
      "Being angry",
      "Running quickly",
    ],
    answer: "Wanting to learn",
  },
  {
    word: "Brave",
    meaning: "Having courage and facing difficulties.",
    example: "She was brave enough to speak in front of the class.",
    options: [
      "Having courage",
      "Being lazy",
      "Being confused",
      "Being sleepy",
    ],
    answer: "Having courage",
  },
  {
    word: "Improve",
    meaning: "To become better or make something better.",
    example: "I practice every day to improve my English.",
    options: [
      "Become better",
      "Become smaller",
      "Stop learning",
      "Forget something",
    ],
    answer: "Become better",
  },
  {
    word: "Ancient",
    meaning: "Very old; belonging to a long time ago.",
    example: "We visited an ancient temple.",
    options: [
      "Very old",
      "Very new",
      "Very small",
      "Very expensive",
    ],
    answer: "Very old",
  },
  {
    word: "Confident",
    meaning: "Feeling sure about your abilities.",
    example: "She felt confident while speaking English.",
    options: [
      "Feeling sure",
      "Feeling sleepy",
      "Feeling hungry",
      "Feeling confused",
    ],
    answer: "Feeling sure",
  },
  {
    word: "Reliable",
    meaning: "Someone or something that can be trusted.",
    example: "She is a reliable friend.",
    options: [
      "Can be trusted",
      "Always late",
      "Very expensive",
      "Hard to understand",
    ],
    answer: "Can be trusted",
  },
];
const translatedVocabulary: Record<
  string,
  VocabularyWord[]
> = {
  Hindi: [
    {
      word: "जिज्ञासु",
      meaning: "कुछ सीखने या जानने की इच्छा रखने वाला।",
      example: "जिज्ञासु छात्र ने बहुत सारे प्रश्न पूछे।",
      options: [
        "सीखने की इच्छा रखने वाला",
        "थका हुआ",
        "गुस्से में",
        "तेज़ दौड़ने वाला",
      ],
      answer: "सीखने की इच्छा रखने वाला",
    },
    {
      word: "बहादुर",
      meaning: "साहस रखने वाला और कठिनाइयों का सामना करने वाला।",
      example: "वह कक्षा के सामने बोलने के लिए बहादुर थी।",
      options: [
        "साहस रखने वाला",
        "आलसी",
        "उलझन में",
        "नींद में",
      ],
      answer: "साहस रखने वाला",
    },
    {
      word: "सुधारना",
      meaning: "किसी चीज़ को बेहतर बनाना।",
      example: "मैं अपनी अंग्रेज़ी सुधारने के लिए रोज़ अभ्यास करता हूँ।",
      options: [
        "बेहतर बनाना",
        "छोटा करना",
        "सीखना बंद करना",
        "कुछ भूलना",
      ],
      answer: "बेहतर बनाना",
    },
    {
      word: "प्राचीन",
      meaning: "बहुत पुराना; बहुत पहले के समय का।",
      example: "हमने एक प्राचीन मंदिर देखा।",
      options: [
        "बहुत पुराना",
        "बहुत नया",
        "बहुत छोटा",
        "बहुत महंगा",
      ],
      answer: "बहुत पुराना",
    },
    {
      word: "आत्मविश्वासी",
      meaning: "अपनी क्षमताओं के बारे में विश्वास महसूस करना।",
      example: "अंग्रेज़ी बोलते समय वह आत्मविश्वासी महसूस कर रही थी।",
      options: [
        "अपने आप पर विश्वास रखने वाला",
        "नींद महसूस करना",
        "भूख महसूस करना",
        "उलझन महसूस करना",
      ],
      answer: "अपने आप पर विश्वास रखने वाला",
    },
    {
      word: "विश्वसनीय",
      meaning: "जिस पर भरोसा किया जा सके।",
      example: "वह एक विश्वसनीय दोस्त है।",
      options: [
        "जिस पर भरोसा किया जा सके",
        "हमेशा देर से आने वाला",
        "बहुत महंगा",
        "समझने में कठिन",
      ],
      answer: "जिस पर भरोसा किया जा सके",
    },
  ],

  Kannada: [
    {
      word: "ಕುತೂಹಲವುಳ್ಳ",
      meaning: "ಏನನ್ನಾದರೂ ಕಲಿಯಲು ಅಥವಾ ತಿಳಿಯಲು ಆಸಕ್ತಿ ಹೊಂದಿರುವ.",
      example: "ಕುತೂಹಲವುಳ್ಳ ವಿದ್ಯಾರ್ಥಿಯು ಅನೇಕ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿದನು.",
      options: [
        "ಕಲಿಯಲು ಆಸಕ್ತಿ ಹೊಂದಿರುವ",
        "ದಣಿದಿರುವ",
        "ಕೋಪಗೊಂಡಿರುವ",
        "ವೇಗವಾಗಿ ಓಡುವ",
      ],
      answer: "ಕಲಿಯಲು ಆಸಕ್ತಿ ಹೊಂದಿರುವ",
    },
    {
      word: "ಧೈರ್ಯಶಾಲಿ",
      meaning: "ಧೈರ್ಯ ಹೊಂದಿರುವ ಮತ್ತು ಕಷ್ಟಗಳನ್ನು ಎದುರಿಸುವ.",
      example: "ಅವಳು ತರಗತಿಯ ಮುಂದೆ ಮಾತನಾಡಲು ಧೈರ್ಯಶಾಲಿಯಾಗಿದ್ದಳು.",
      options: [
        "ಧೈರ್ಯ ಹೊಂದಿರುವ",
        "ಸೋಮಾರಿ",
        "ಗೊಂದಲದಲ್ಲಿರುವ",
        "ನಿದ್ದೆಯಲ್ಲಿರುವ",
      ],
      answer: "ಧೈರ್ಯ ಹೊಂದಿರುವ",
    },
    {
      word: "ಸುಧಾರಿಸು",
      meaning: "ಯಾವುದನ್ನಾದರೂ ಉತ್ತಮಗೊಳಿಸುವುದು.",
      example: "ನನ್ನ ಇಂಗ್ಲಿಷ್ ಸುಧಾರಿಸಲು ನಾನು ಪ್ರತಿದಿನ ಅಭ್ಯಾಸ ಮಾಡುತ್ತೇನೆ.",
      options: [
        "ಉತ್ತಮಗೊಳಿಸುವುದು",
        "ಚಿಕ್ಕದಾಗಿಸುವುದು",
        "ಕಲಿಯುವುದನ್ನು ನಿಲ್ಲಿಸುವುದು",
        "ಏನನ್ನಾದರೂ ಮರೆತುಬಿಡುವುದು",
      ],
      answer: "ಉತ್ತಮಗೊಳಿಸುವುದು",
    },
    {
      word: "ಪ್ರಾಚೀನ",
      meaning: "ಬಹಳ ಹಳೆಯದು; ಬಹಳ ಹಿಂದಿನ ಕಾಲಕ್ಕೆ ಸೇರಿದದ್ದು.",
      example: "ನಾವು ಒಂದು ಪ್ರಾಚೀನ ದೇವಾಲಯಕ್ಕೆ ಭೇಟಿ ನೀಡಿದೆವು.",
      options: [
        "ಬಹಳ ಹಳೆಯದು",
        "ಬಹಳ ಹೊಸದು",
        "ಬಹಳ ಚಿಕ್ಕದು",
        "ಬಹಳ ದುಬಾರಿ",
      ],
      answer: "ಬಹಳ ಹಳೆಯದು",
    },
    {
      word: "ಆತ್ಮವಿಶ್ವಾಸವುಳ್ಳ",
      meaning: "ತನ್ನ ಸಾಮರ್ಥ್ಯದ ಬಗ್ಗೆ ನಂಬಿಕೆ ಹೊಂದಿರುವ.",
      example: "ಇಂಗ್ಲಿಷ್ ಮಾತನಾಡುವಾಗ ಅವಳು ಆತ್ಮವಿಶ್ವಾಸವನ್ನು ಅನುಭವಿಸಿದಳು.",
      options: [
        "ತನ್ನ ಮೇಲೆ ನಂಬಿಕೆ ಹೊಂದಿರುವ",
        "ನಿದ್ದೆ ಅನುಭವಿಸುವ",
        "ಹಸಿವು ಅನುಭವಿಸುವ",
        "ಗೊಂದಲ ಅನುಭವಿಸುವ",
      ],
      answer: "ತನ್ನ ಮೇಲೆ ನಂಬಿಕೆ ಹೊಂದಿರುವ",
    },
    {
      word: "ವಿಶ್ವಾಸಾರ್ಹ",
      meaning: "ಯಾರನ್ನು ಅಥವಾ ಯಾವುದನ್ನು ನಂಬಬಹುದೋ ಅದು.",
      example: "ಅವಳು ವಿಶ್ವಾಸಾರ್ಹ ಸ್ನೇಹಿತೆ.",
      options: [
        "ನಂಬಬಹುದಾದ",
        "ಯಾವಾಗಲೂ ತಡವಾಗುವ",
        "ಬಹಳ ದುಬಾರಿ",
        "ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಕಷ್ಟವಾದ",
      ],
      answer: "ನಂಬಬಹುದಾದ",
    },
  ],

  Tamil: [
    {
      word: "ஆர்வமுள்ள",
      meaning: "எதையாவது கற்றுக்கொள்ள அல்லது தெரிந்துகொள்ள விரும்புபவர்.",
      example: "ஆர்வமுள்ள மாணவர் பல கேள்விகளைக் கேட்டார்.",
      options: [
        "கற்றுக்கொள்ள விரும்புபவர்",
        "சோர்வாக இருப்பவர்",
        "கோபமாக இருப்பவர்",
        "வேகமாக ஓடுபவர்",
      ],
      answer: "கற்றுக்கொள்ள விரும்புபவர்",
    },
    {
      word: "தைரியமான",
      meaning: "தைரியம் கொண்டவர் மற்றும் சிரமங்களை எதிர்கொள்பவர்.",
      example: "அவள் வகுப்பின் முன் பேச தைரியமாக இருந்தாள்.",
      options: [
        "தைரியம் கொண்டவர்",
        "சோம்பேறி",
        "குழப்பமானவர்",
        "தூக்கமாக இருப்பவர்",
      ],
      answer: "தைரியம் கொண்டவர்",
    },
    {
      word: "மேம்படுத்து",
      meaning: "எதையாவது சிறப்பாக மாற்றுவது.",
      example: "என் ஆங்கிலத்தை மேம்படுத்த தினமும் பயிற்சி செய்கிறேன்.",
      options: [
        "சிறப்பாக மாற்றுவது",
        "சிறியதாக்குவது",
        "கற்றலை நிறுத்துவது",
        "எதையாவது மறப்பது",
      ],
      answer: "சிறப்பாக மாற்றுவது",
    },
    {
      word: "பண்டைய",
      meaning: "மிகவும் பழமையானது.",
      example: "நாங்கள் ஒரு பண்டைய கோவிலுக்குச் சென்றோம்.",
      options: [
        "மிகவும் பழமையானது",
        "மிகவும் புதியது",
        "மிகவும் சிறியது",
        "மிகவும் விலை உயர்ந்தது",
      ],
      answer: "மிகவும் பழமையானது",
    },
    {
      word: "தன்னம்பிக்கையுள்ள",
      meaning: "தன் திறமைகளில் நம்பிக்கை கொண்டவர்.",
      example: "ஆங்கிலம் பேசும்போது அவள் தன்னம்பிக்கையுடன் இருந்தாள்.",
      options: [
        "தன் மீது நம்பிக்கை கொண்டவர்",
        "தூக்கமாக இருப்பவர்",
        "பசியுடன் இருப்பவர்",
        "குழப்பமாக இருப்பவர்",
      ],
      answer: "தன் மீது நம்பிக்கை கொண்டவர்",
    },
    {
      word: "நம்பகமான",
      meaning: "நம்பக்கூடிய ஒருவர் அல்லது ஒன்று.",
      example: "அவள் ஒரு நம்பகமான தோழி.",
      options: [
        "நம்பக்கூடிய",
        "எப்போதும் தாமதமாக வருபவர்",
        "மிகவும் விலை உயர்ந்த",
        "புரிந்துகொள்ள கடினமான",
      ],
      answer: "நம்பக்கூடிய",
    },
  ],
  Telugu: [
    {
      word: "సాధించు",
      meaning: "ఒక లక్ష్యాన్ని విజయవంతంగా చేరుకోవడం.",
      example: "ఆమె తన లక్ష్యాన్ని సాధించడానికి కష్టపడి పనిచేసింది.",
      options: ["లక్ష్యాన్ని చేరుకోవడం", "వదిలివేయడం", "ఏదైనా మర్చిపోవడం", "తప్పు చేయడం"],
      answer: "లక్ష్యాన్ని చేరుకోవడం",
    },
    {
      word: "అన్వేషించు",
      meaning: "ఏదైనా విషయం గురించి తెలుసుకోవడానికి వెతకడం.",
      example: "మేము కొత్త నగరాన్ని అన్వేషించాము.",
      options: ["ఏదైనా విషయం గురించి తెలుసుకోవడం", "నిద్రపోవడం", "అన్నింటినీ తప్పించడం", "మర్చిపోవడం"],
      answer: "ఏదైనా విషయం గురించి తెలుసుకోవడం",
    },
    {
      word: "ఉదారమైన",
      meaning: "ఇతరులకు ఇవ్వడానికి లేదా పంచుకోవడానికి సిద్ధంగా ఉండటం.",
      example: "అతను ఉదారంగా తన భోజనాన్ని పంచుకున్నాడు.",
      options: ["పంచుకోవడానికి సిద్ధంగా ఉండటం", "ఎప్పుడూ కోపంగా ఉండటం", "చాలా నిశ్శబ్దంగా ఉండటం", "చాలా అలసిపోయి ఉండటం"],
      answer: "పంచుకోవడానికి సిద్ధంగా ఉండటం",
    },
    {
      word: "నమ్మదగిన",
      meaning: "ఎవరినైనా లేదా దేనినైనా నమ్మగలగడం.",
      example: "ఆమె నమ్మదగిన స్నేహితురాలు.",
      options: ["నమ్మగలిగేది", "ఎప్పుడూ ఆలస్యంగా వచ్చేది", "చాలా ఖరీదైనది", "అర్థం చేసుకోవడం కష్టం"],
      answer: "నమ్మగలిగేది",
    },
    {
      word: "ప్రయత్నం",
      meaning: "ఏదైనా చేయడానికి ఉపయోగించే శక్తి.",
      example: "నీ ప్రయత్నం నీకు మెరుగుపడటానికి సహాయపడుతుంది.",
      options: ["ఏదైనా చేయడానికి ఉపయోగించే శక్తి", "ఒక రకమైన ఆహారం", "చదివే ప్రదేశం", "ఒక ఆట"],
      answer: "ఏదైనా చేయడానికి ఉపయోగించే శక్తి",
    },
  ],

  Malayalam: [
    {
      word: "നേടുക",
      meaning: "ഒരു ലക്ഷ്യത്തിലെത്തുക.",
      example: "അവൾ തന്റെ ലക്ഷ്യം നേടാൻ കഠിനമായി പരിശ്രമിച്ചു.",
      options: ["ഒരു ലക്ഷ്യത്തിലെത്തുക", "ഉപേക്ഷിക്കുക", "എന്തെങ്കിലും മറക്കുക", "ഒരു തെറ്റ് ചെയ്യുക"],
      answer: "ഒരു ലക്ഷ്യത്തിലെത്തുക",
    },
    {
      word: "പര്യവേക്ഷണം ചെയ്യുക",
      meaning: "എന്തെങ്കിലും അറിയാൻ അല്ലെങ്കിൽ കാണാൻ അന്വേഷിക്കുക.",
      example: "ഞങ്ങൾ പുതിയ നഗരം പര്യവേക്ഷണം ചെയ്തു.",
      options: ["എന്തെങ്കിലും അറിയുക", "ഉറങ്ങുക", "എല്ലാം ഒഴിവാക്കുക", "മറക്കുക"],
      answer: "എന്തെങ്കിലും അറിയുക",
    },
    {
      word: "ഉദാരമായ",
      meaning: "മറ്റുള്ളവർക്ക് നൽകാനോ പങ്കിടാനോ തയ്യാറുള്ള.",
      example: "അവൻ ഉദാരനായി തന്റെ ഭക്ഷണം പങ്കിട്ടു.",
      options: ["പങ്കിടാൻ തയ്യാറുള്ള", "എപ്പോഴും ദേഷ്യത്തിലുള്ള", "വളരെ ശാന്തമായ", "വളരെ ക്ഷീണിച്ച"],
      answer: "പങ്കിടാൻ തയ്യാറുള്ള",
    },
    {
      word: "വിശ്വസനീയമായ",
      meaning: "വിശ്വസിക്കാൻ കഴിയുന്ന ഒരാൾ അല്ലെങ്കിൽ വസ്തു.",
      example: "അവൾ വിശ്വസനീയമായ സുഹൃത്താണ്.",
      options: ["വിശ്വസിക്കാൻ കഴിയുന്ന", "എപ്പോഴും വൈകിയെത്തുന്ന", "വളരെ ചെലവേറിയ", "മനസ്സിലാക്കാൻ ബുദ്ധിമുട്ടുള്ള"],
      answer: "വിശ്വസിക്കാൻ കഴിയുന്ന",
    },
    {
      word: "ശ്രമം",
      meaning: "എന്തെങ്കിലും ചെയ്യാൻ ഉപയോഗിക്കുന്ന ഊർജം.",
      example: "നിന്റെ ശ്രമം മെച്ചപ്പെടാൻ സഹായിക്കും.",
      options: ["എന്തെങ്കിലും ചെയ്യാൻ ഉപയോഗിക്കുന്ന ഊർജം", "ഒരു ഭക്ഷണം", "പഠിക്കാനുള്ള സ്ഥലം", "ഒരു കളി"],
      answer: "എന്തെങ്കിലും ചെയ്യാൻ ഉപയോഗിക്കുന്ന ഊർജം",
    },
  ],

  Spanish: [
    {
      word: "Lograr",
      meaning: "Alcanzar una meta con éxito.",
      example: "Ella trabajó duro para lograr su objetivo.",
      options: ["Alcanzar una meta", "Rendirse", "Olvidar algo", "Cometer un error"],
      answer: "Alcanzar una meta",
    },
    {
      word: "Explorar",
      meaning: "Viajar o aprender sobre algo.",
      example: "Exploramos la nueva ciudad.",
      options: ["Aprender sobre algo", "Dormir", "Evitar todo", "Olvidar"],
      answer: "Aprender sobre algo",
    },
    {
      word: "Generoso",
      meaning: "Dispuesto a dar o compartir con otros.",
      example: "Él fue generoso y compartió su comida.",
      options: ["Dispuesto a compartir", "Siempre enojado", "Muy tranquilo", "Muy cansado"],
      answer: "Dispuesto a compartir",
    },
    {
      word: "Confiable",
      meaning: "Alguien o algo en quien se puede confiar.",
      example: "Ella es una amiga confiable.",
      options: ["En quien se puede confiar", "Siempre llega tarde", "Muy caro", "Difícil de entender"],
      answer: "En quien se puede confiar",
    },
    {
      word: "Esfuerzo",
      meaning: "La energía utilizada para hacer algo.",
      example: "Tu esfuerzo te ayudará a mejorar.",
      options: ["Energía utilizada para hacer algo", "Un tipo de comida", "Un lugar para estudiar", "Un juego"],
      answer: "Energía utilizada para hacer algo",
    },
  ],

  French: [
    {
      word: "Accomplir",
      meaning: "Atteindre un objectif avec succès.",
      example: "Elle a travaillé dur pour accomplir son objectif.",
      options: ["Atteindre un objectif", "Abandonner", "Oublier quelque chose", "Faire une erreur"],
      answer: "Atteindre un objectif",
    },
    {
      word: "Explorer",
      meaning: "Découvrir ou apprendre quelque chose.",
      example: "Nous avons exploré la nouvelle ville.",
      options: ["Découvrir quelque chose", "Dormir", "Tout éviter", "Oublier"],
      answer: "Découvrir quelque chose",
    },
    {
      word: "Généreux",
      meaning: "Prêt à donner ou à partager avec les autres.",
      example: "Il était généreux et a partagé son repas.",
      options: ["Prêt à partager", "Toujours en colère", "Très calme", "Très fatigué"],
      answer: "Prêt à partager",
    },
    {
      word: "Fiable",
      meaning: "Quelqu'un ou quelque chose en qui on peut avoir confiance.",
      example: "C'est une amie fiable.",
      options: ["En qui on peut avoir confiance", "Toujours en retard", "Très cher", "Difficile à comprendre"],
      answer: "En qui on peut avoir confiance",
    },
    {
      word: "Effort",
      meaning: "L'énergie utilisée pour faire quelque chose.",
      example: "Ton effort t'aidera à progresser.",
      options: ["Énergie utilisée pour faire quelque chose", "Un aliment", "Un lieu d'étude", "Un jeu"],
      answer: "Énergie utilisée pour faire quelque chose",
    },
  ],

  German: [
    {
      word: "Erreichen",
      meaning: "Ein Ziel erfolgreich erreichen.",
      example: "Sie hat hart gearbeitet, um ihr Ziel zu erreichen.",
      options: ["Ein Ziel erreichen", "Aufgeben", "Etwas vergessen", "Einen Fehler machen"],
      answer: "Ein Ziel erreichen",
    },
    {
      word: "Erkunden",
      meaning: "Etwas kennenlernen oder entdecken.",
      example: "Wir haben die neue Stadt erkundet.",
      options: ["Etwas kennenlernen", "Schlafen", "Alles vermeiden", "Vergessen"],
      answer: "Etwas kennenlernen",
    },
    {
      word: "Großzügig",
      meaning: "Bereit sein, anderen etwas zu geben oder zu teilen.",
      example: "Er war großzügig und teilte sein Essen.",
      options: ["Bereit zu teilen", "Immer wütend", "Sehr ruhig", "Sehr müde"],
      answer: "Bereit zu teilen",
    },
    {
      word: "Zuverlässig",
      meaning: "Jemand oder etwas, dem man vertrauen kann.",
      example: "Sie ist eine zuverlässige Freundin.",
      options: ["Dem man vertrauen kann", "Immer spät", "Sehr teuer", "Schwer zu verstehen"],
      answer: "Dem man vertrauen kann",
    },
    {
      word: "Anstrengung",
      meaning: "Die Energie, die man für etwas verwendet.",
      example: "Deine Anstrengung wird dir helfen, besser zu werden.",
      options: ["Energie für etwas", "Eine Art Essen", "Ein Lernort", "Ein Spiel"],
      answer: "Energie für etwas",
    },
  ],

  Japanese: [
    {
      word: "達成する",
      meaning: "目標を成功させること。",
      example: "彼女は目標を達成するために一生懸命努力しました。",
      options: ["目標を達成する", "あきらめる", "何かを忘れる", "間違いをする"],
      answer: "目標を達成する",
    },
    {
      word: "探検する",
      meaning: "何かについて知るために調べたり見たりすること。",
      example: "私たちは新しい街を探検しました。",
      options: ["何かについて知る", "寝る", "すべてを避ける", "忘れる"],
      answer: "何かについて知る",
    },
    {
      word: "寛大な",
      meaning: "他の人に与えたり分けたりする気持ちがあること。",
      example: "彼は寛大に自分の食事を分けました。",
      options: ["分けることを喜んでする", "いつも怒っている", "とても静か", "とても疲れている"],
      answer: "分けることを喜んでする",
    },
    {
      word: "信頼できる",
      meaning: "信頼することができる人や物。",
      example: "彼女は信頼できる友達です。",
      options: ["信頼できる", "いつも遅れる", "とても高価", "理解するのが難しい"],
      answer: "信頼できる",
    },
    {
      word: "努力",
      meaning: "何かをするために使う力。",
      example: "あなたの努力は上達するのに役立ちます。",
      options: ["何かをするために使う力", "食べ物の種類", "勉強する場所", "ゲーム"],
      answer: "何かをするために使う力",
    },
  ],
};

const dailyVocabulary: VocabularyWord[] = [
  
  {
    word: "Achieve",
    meaning: "To successfully reach a goal.",
    example: "She worked hard to achieve her goal.",
    options: [
      "Reach a goal",
      "Give up",
      "Forget something",
      "Make a mistake",
    ],
    answer: "Reach a goal",
  },
  {
    word: "Explore",
    meaning: "To travel around or learn about something.",
    example: "We explored the new city.",
    options: [
      "Learn about something",
      "Sleep",
      "Avoid everything",
      "Forget",
    ],
    answer: "Learn about something",
  },
  {
    word: "Generous",
    meaning: "Willing to give or share with others.",
    example: "He was generous and shared his lunch.",
    options: [
      "Willing to share",
      "Always angry",
      "Very quiet",
      "Very tired",
    ],
    answer: "Willing to share",
  },
  {
    word: "Reliable",
    meaning: "Someone or something that can be trusted.",
    example: "She is a reliable friend.",
    options: [
      "Can be trusted",
      "Always late",
      "Very expensive",
      "Hard to understand",
    ],
    answer: "Can be trusted",
  },
  {
    word: "Effort",
    meaning: "The energy used to do something.",
    example: "Your effort will help you improve.",
    options: [
      "Energy used to do something",
      "A type of food",
      "A place to study",
      "A kind of game",
    ],
    answer: "Energy used to do something",
  },
];
const translatedDailyVocabulary: Record<string, VocabularyWord[]> = {
  Hindi: [
    {
      word: "सफलता",
      meaning: "Success",
      example: "मेहनत से सफलता मिलती है।",
      options: ["Success", "Failure", "Problem", "Question"],
      answer: "Success",
    },
    {
      word: "खोजना",
      meaning: "Explore",
      example: "मुझे नई जगहें खोजना पसंद है।",
      options: ["Explore", "Forget", "Stop", "Lose"],
      answer: "Explore",
    },
    {
      word: "दयालु",
      meaning: "Generous",
      example: "वह बहुत दयालु व्यक्ति है।",
      options: ["Generous", "Angry", "Lazy", "Quiet"],
      answer: "Generous",
    },
    {
      word: "विश्वसनीय",
      meaning: "Reliable",
      example: "वह एक विश्वसनीय दोस्त है।",
      options: ["Reliable", "Difficult", "Weak", "Slow"],
      answer: "Reliable",
    },
    {
      word: "प्रयास",
      meaning: "Effort",
      example: "हर प्रयास महत्वपूर्ण है।",
      options: ["Effort", "Answer", "Lesson", "Story"],
      answer: "Effort",
    },
  ],

  Kannada: [
    {
      word: "ಸಾಧನೆ",
      meaning: "Achieve",
      example: "ಕಠಿಣ ಪರಿಶ್ರಮದಿಂದ ಸಾಧನೆ ಸಾಧ್ಯ.",
      options: ["Achieve", "Forget", "Stop", "Lose"],
      answer: "Achieve",
    },
    {
      word: "ಅನ್ವೇಷಿಸು",
      meaning: "Explore",
      example: "ನಾನು ಹೊಸ ಸ್ಥಳಗಳನ್ನು ಅನ್ವೇಷಿಸಲು ಇಷ್ಟಪಡುತ್ತೇನೆ.",
      options: ["Explore", "Forget", "Stop", "Lose"],
      answer: "Explore",
    },
    {
      word: "ಉದಾರ",
      meaning: "Generous",
      example: "ಅವನು ತುಂಬಾ ಉದಾರ ವ್ಯಕ್ತಿ.",
      options: ["Generous", "Angry", "Lazy", "Quiet"],
      answer: "Generous",
    },
    {
      word: "ವಿಶ್ವಾಸಾರ್ಹ",
      meaning: "Reliable",
      example: "ಅವನು ವಿಶ್ವಾಸಾರ್ಹ ಸ್ನೇಹಿತ.",
      options: ["Reliable", "Difficult", "Weak", "Slow"],
      answer: "Reliable",
    },
    {
      word: "ಪ್ರಯತ್ನ",
      meaning: "Effort",
      example: "ಪ್ರತಿ ಪ್ರಯತ್ನವೂ ಮುಖ್ಯವಾಗಿದೆ.",
      options: ["Effort", "Answer", "Lesson", "Story"],
      answer: "Effort",
    },
  ],

  Tamil: [
    {
      word: "சாதிக்க",
      meaning: "Achieve",
      example: "கடின உழைப்பால் சாதிக்க முடியும்.",
      options: ["Achieve", "Forget", "Stop", "Lose"],
      answer: "Achieve",
    },
    {
      word: "ஆராய",
      meaning: "Explore",
      example: "நான் புதிய இடங்களை ஆராய விரும்புகிறேன்.",
      options: ["Explore", "Forget", "Stop", "Lose"],
      answer: "Explore",
    },
    {
      word: "தாராளமான",
      meaning: "Generous",
      example: "அவர் மிகவும் தாராளமானவர்.",
      options: ["Generous", "Angry", "Lazy", "Quiet"],
      answer: "Generous",
    },
    {
      word: "நம்பகமான",
      meaning: "Reliable",
      example: "அவர் நம்பகமான நண்பர்.",
      options: ["Reliable", "Difficult", "Weak", "Slow"],
      answer: "Reliable",
    },
    {
      word: "முயற்சி",
      meaning: "Effort",
      example: "ஒவ்வொரு முயற்சியும் முக்கியமானது.",
      options: ["Effort", "Answer", "Lesson", "Story"],
      answer: "Effort",
    },
  ],

  Telugu: [
    {
      word: "సాధించు",
      meaning: "Achieve",
      example: "కష్టపడి పని చేస్తే సాధించవచ్చు.",
      options: ["Achieve", "Forget", "Stop", "Lose"],
      answer: "Achieve",
    },
    {
      word: "అన్వేషించు",
      meaning: "Explore",
      example: "నాకు కొత్త ప్రదేశాలను అన్వేషించడం ఇష్టం.",
      options: ["Explore", "Forget", "Stop", "Lose"],
      answer: "Explore",
    },
    {
      word: "ఉదారమైన",
      meaning: "Generous",
      example: "అతను చాలా ఉదారమైన వ్యక్తి.",
      options: ["Generous", "Angry", "Lazy", "Quiet"],
      answer: "Generous",
    },
    {
      word: "నమ్మదగిన",
      meaning: "Reliable",
      example: "అతను నమ్మదగిన స్నేహితుడు.",
      options: ["Reliable", "Difficult", "Weak", "Slow"],
      answer: "Reliable",
    },
    {
      word: "ప్రయత్నం",
      meaning: "Effort",
      example: "ప్రతి ప్రయత్నం ముఖ్యమైనది.",
      options: ["Effort", "Answer", "Lesson", "Story"],
      answer: "Effort",
    },
  ],

  Malayalam: [
    {
      word: "നേടുക",
      meaning: "Achieve",
      example: "കഠിനാധ്വാനത്തിലൂടെ നേടാം.",
      options: ["Achieve", "Forget", "Stop", "Lose"],
      answer: "Achieve",
    },
    {
      word: "പര്യവേക്ഷണം ചെയ്യുക",
      meaning: "Explore",
      example: "എനിക്ക് പുതിയ സ്ഥലങ്ങൾ പര്യവേക്ഷണം ചെയ്യാൻ ഇഷ്ടമാണ്.",
      options: ["Explore", "Forget", "Stop", "Lose"],
      answer: "Explore",
    },
    {
      word: "ഉദാരമായ",
      meaning: "Generous",
      example: "അവൻ വളരെ ഉദാരനായ വ്യക്തിയാണ്.",
      options: ["Generous", "Angry", "Lazy", "Quiet"],
      answer: "Generous",
    },
    {
      word: "വിശ്വസനീയമായ",
      meaning: "Reliable",
      example: "അവൻ വിശ്വസനീയനായ സുഹൃത്താണ്.",
      options: ["Reliable", "Difficult", "Weak", "Slow"],
      answer: "Reliable",
    },
    {
      word: "ശ്രമം",
      meaning: "Effort",
      example: "ഓരോ ശ്രമവും പ്രധാനമാണ്.",
      options: ["Effort", "Answer", "Lesson", "Story"],
      answer: "Effort",
    },
  ],

  Spanish: [
    {
      word: "Lograr",
      meaning: "Achieve",
      example: "Puedes lograr tus objetivos con esfuerzo.",
      options: ["Achieve", "Forget", "Stop", "Lose"],
      answer: "Achieve",
    },
    {
      word: "Explorar",
      meaning: "Explore",
      example: "Me gusta explorar nuevos lugares.",
      options: ["Explore", "Forget", "Stop", "Lose"],
      answer: "Explore",
    },
    {
      word: "Generoso",
      meaning: "Generous",
      example: "Él es una persona muy generosa.",
      options: ["Generous", "Angry", "Lazy", "Quiet"],
      answer: "Generous",
    },
    {
      word: "Fiable",
      meaning: "Reliable",
      example: "Ella es una amiga fiable.",
      options: ["Reliable", "Difficult", "Weak", "Slow"],
      answer: "Reliable",
    },
    {
      word: "Esfuerzo",
      meaning: "Effort",
      example: "Cada esfuerzo es importante.",
      options: ["Effort", "Answer", "Lesson", "Story"],
      answer: "Effort",
    },
  ],

  French: [
    {
      word: "Accomplir",
      meaning: "Achieve",
      example: "Tu peux accomplir tes objectifs.",
      options: ["Achieve", "Forget", "Stop", "Lose"],
      answer: "Achieve",
    },
    {
      word: "Explorer",
      meaning: "Explore",
      example: "J'aime explorer de nouveaux endroits.",
      options: ["Explore", "Forget", "Stop", "Lose"],
      answer: "Explore",
    },
    {
      word: "Généreux",
      meaning: "Generous",
      example: "Il est très généreux.",
      options: ["Generous", "Angry", "Lazy", "Quiet"],
      answer: "Generous",
    },
    {
      word: "Fiable",
      meaning: "Reliable",
      example: "C'est un ami fiable.",
      options: ["Reliable", "Difficult", "Weak", "Slow"],
      answer: "Reliable",
    },
    {
      word: "Effort",
      meaning: "Effort",
      example: "Chaque effort est important.",
      options: ["Effort", "Answer", "Lesson", "Story"],
      answer: "Effort",
    },
  ],

  German: [
    {
      word: "Erreichen",
      meaning: "Achieve",
      example: "Du kannst deine Ziele erreichen.",
      options: ["Achieve", "Forget", "Stop", "Lose"],
      answer: "Achieve",
    },
    {
      word: "Erkunden",
      meaning: "Explore",
      example: "Ich erkunde gerne neue Orte.",
      options: ["Explore", "Forget", "Stop", "Lose"],
      answer: "Explore",
    },
    {
      word: "Großzügig",
      meaning: "Generous",
      example: "Er ist sehr großzügig.",
      options: ["Generous", "Angry", "Lazy", "Quiet"],
      answer: "Generous",
    },
    {
      word: "Zuverlässig",
      meaning: "Reliable",
      example: "Er ist ein zuverlässiger Freund.",
      options: ["Reliable", "Difficult", "Weak", "Slow"],
      answer: "Reliable",
    },
    {
      word: "Anstrengung",
      meaning: "Effort",
      example: "Jede Anstrengung ist wichtig.",
      options: ["Effort", "Answer", "Lesson", "Story"],
      answer: "Effort",
    },
  ],

  Japanese: [
    {
      word: "達成する",
      meaning: "Achieve",
      example: "努力すれば目標を達成できます。",
      options: ["Achieve", "Forget", "Stop", "Lose"],
      answer: "Achieve",
    },
    {
      word: "探検する",
      meaning: "Explore",
      example: "新しい場所を探検するのが好きです。",
      options: ["Explore", "Forget", "Stop", "Lose"],
      answer: "Explore",
    },
    {
      word: "寛大な",
      meaning: "Generous",
      example: "彼はとても寛大な人です。",
      options: ["Generous", "Angry", "Lazy", "Quiet"],
      answer: "Generous",
    },
    {
      word: "信頼できる",
      meaning: "Reliable",
      example: "彼は信頼できる友達です。",
      options: ["Reliable", "Difficult", "Weak", "Slow"],
      answer: "Reliable",
    },
    {
      word: "努力",
      meaning: "Effort",
      example: "すべての努力が大切です。",
      options: ["Effort", "Answer", "Lesson", "Story"],
      answer: "Effort",
    },
  ],
};

const pronunciationSentencesByLanguage: Record<
  string,
  { sentence: string; tip: string }[]
> = {
  English: [
    { sentence: "I enjoy learning English every day.", tip: "Speak clearly and slowly." },
    { sentence: "She goes to school every morning.", tip: "Focus on the word morning." },
    { sentence: "I am improving my speaking skills.", tip: "Pronounce improving clearly." },
    { sentence: "The weather is beautiful today.", tip: "Pay attention to beautiful." },
    { sentence: "I feel confident when I speak English.", tip: "Speak with confidence." },
  ],

  Hindi: [
    { sentence: "मुझे हर दिन नई चीजें सीखना पसंद है।", tip: "हर शब्द साफ़ बोलें।" },
    { sentence: "वह हर सुबह स्कूल जाती है।", tip: "सुबह शब्द का अभ्यास करें।" },
    { sentence: "मैं अपनी बोलने की क्षमता सुधार रहा हूँ।", tip: "धीरे और स्पष्ट बोलें।" },
    { sentence: "आज मौसम बहुत अच्छा है।", tip: "मौसम शब्द पर ध्यान दें।" },
    { sentence: "मुझे हिंदी बोलने में आत्मविश्वास महसूस होता है।", tip: "आत्मविश्वास शब्द का अभ्यास करें।" },
  ],

  Kannada: [
    { sentence: "ನನಗೆ ಪ್ರತಿದಿನ ಹೊಸ ವಿಷಯಗಳನ್ನು ಕಲಿಯಲು ಇಷ್ಟ.", tip: "ಪ್ರತಿ ಪದವನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಉಚ್ಚರಿಸಿ." },
    { sentence: "ಅವಳು ಪ್ರತಿದಿನ ಬೆಳಿಗ್ಗೆ ಶಾಲೆಗೆ ಹೋಗುತ್ತಾಳೆ.", tip: "ಬೆಳಿಗ್ಗೆ ಪದವನ್ನು ಅಭ್ಯಾಸ ಮಾಡಿ." },
    { sentence: "ನಾನು ನನ್ನ ಮಾತನಾಡುವ ಕೌಶಲ್ಯವನ್ನು ಸುಧಾರಿಸುತ್ತಿದ್ದೇನೆ.", tip: "ನಿಧಾನವಾಗಿ ಮತ್ತು ಸ್ಪಷ್ಟವಾಗಿ ಮಾತನಾಡಿ." },
    { sentence: "ಇಂದು ಹವಾಮಾನ ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ.", tip: "ಹವಾಮಾನ ಪದದ ಮೇಲೆ ಗಮನ ಕೊಡಿ." },
    { sentence: "ನಾನು ಕನ್ನಡ ಮಾತನಾಡುವಾಗ ಆತ್ಮವಿಶ್ವಾಸದಿಂದ ಇರುತ್ತೇನೆ.", tip: "ಆತ್ಮವಿಶ್ವಾಸ ಪದವನ್ನು ಅಭ್ಯಾಸ ಮಾಡಿ." },
  ],

  Tamil: [
    { sentence: "எனக்கு தினமும் புதிய விஷயங்களைக் கற்றுக்கொள்ளப் பிடிக்கும்.", tip: "ஒவ்வொரு சொல்லையும் தெளிவாகப் பேசுங்கள்." },
    { sentence: "அவள் தினமும் காலையில் பள்ளிக்குச் செல்கிறாள்.", tip: "காலையில் என்ற சொல்லைப் பயிற்சி செய்யுங்கள்." },
    { sentence: "நான் என் பேச்சுத் திறனை மேம்படுத்தி வருகிறேன்.", tip: "மெதுவாகவும் தெளிவாகவும் பேசுங்கள்." },
    { sentence: "இன்று வானிலை மிகவும் அழகாக இருக்கிறது.", tip: "வானிலை என்ற சொல்லைக் கவனியுங்கள்." },
    { sentence: "நான் தமிழ் பேசும்போது நம்பிக்கையுடன் இருக்கிறேன்.", tip: "நம்பிக்கையுடன் என்ற சொல்லைப் பயிற்சி செய்யுங்கள்." },
  ],

  Telugu: [
    { sentence: "నాకు ప్రతిరోజూ కొత్త విషయాలు నేర్చుకోవడం ఇష్టం.", tip: "ప్రతి పదాన్ని స్పష్టంగా పలకండి." },
    { sentence: "ఆమె ప్రతిరోజూ ఉదయం పాఠశాలకు వెళ్తుంది.", tip: "ఉదయం అనే పదాన్ని అభ్యసించండి." },
    { sentence: "నేను నా మాట్లాడే నైపుణ్యాలను మెరుగుపరుచుకుంటున్నాను.", tip: "నెమ్మదిగా, స్పష్టంగా మాట్లాడండి." },
    { sentence: "ఈరోజు వాతావరణం చాలా బాగుంది.", tip: "వాతావరణం అనే పదంపై దృష్టి పెట్టండి." },
    { sentence: "నేను తెలుగు మాట్లాడేటప్పుడు ఆత్మవిశ్వాసంగా ఉంటాను.", tip: "ఆత్మవిశ్వాసంగా అనే పదాన్ని అభ్యసించండి." },
  ],

  Malayalam: [
    { sentence: "എനിക്ക് എല്ലാ ദിവസവും പുതിയ കാര്യങ്ങൾ പഠിക്കാൻ ഇഷ്ടമാണ്.", tip: "ഓരോ വാക്കും വ്യക്തമായി പറയുക." },
    { sentence: "അവൾ എല്ലാ ദിവസവും രാവിലെ സ്കൂളിൽ പോകുന്നു.", tip: "രാവിലെ എന്ന വാക്ക് പരിശീലിക്കുക." },
    { sentence: "ഞാൻ എന്റെ സംസാരശേഷി മെച്ചപ്പെടുത്തുകയാണ്.", tip: "പതുക്കെയും വ്യക്തമായും സംസാരിക്കുക." },
    { sentence: "ഇന്ന് കാലാവസ്ഥ വളരെ മനോഹരമാണ്.", tip: "കാലാവസ്ഥ എന്ന വാക്കിൽ ശ്രദ്ധിക്കുക." },
    { sentence: "മലയാളം സംസാരിക്കുമ്പോൾ എനിക്ക് ആത്മവിശ്വാസമുണ്ട്.", tip: "ആത്മവിശ്വാസം എന്ന വാക്ക് പരിശീലിക്കുക." },
  ],

  Spanish: [
    { sentence: "Me gusta aprender cosas nuevas cada día.", tip: "Pronuncia cada palabra con claridad." },
    { sentence: "Ella va a la escuela todas las mañanas.", tip: "Practica la palabra mañanas." },
    { sentence: "Estoy mejorando mis habilidades para hablar.", tip: "Habla despacio y con claridad." },
    { sentence: "El clima está muy bonito hoy.", tip: "Presta atención a la palabra clima." },
    { sentence: "Me siento seguro cuando hablo español.", tip: "Habla con confianza." },
  ],

  French: [
    { sentence: "J'aime apprendre de nouvelles choses chaque jour.", tip: "Prononce chaque mot clairement." },
    { sentence: "Elle va à l'école tous les matins.", tip: "Pratique le mot matins." },
    { sentence: "J'améliore mes compétences en expression orale.", tip: "Parle lentement et clairement." },
    { sentence: "Il fait très beau aujourd'hui.", tip: "Fais attention à la prononciation de aujourd'hui." },
    { sentence: "Je me sens en confiance quand je parle français.", tip: "Parle avec assurance." },
  ],

  German: [
    { sentence: "Ich lerne jeden Tag gerne neue Dinge.", tip: "Sprich jedes Wort deutlich aus." },
    { sentence: "Sie geht jeden Morgen zur Schule.", tip: "Übe das Wort Morgen." },
    { sentence: "Ich verbessere meine Sprechfähigkeiten.", tip: "Sprich langsam und deutlich." },
    { sentence: "Das Wetter ist heute wunderschön.", tip: "Achte auf das Wort wunderschön." },
    { sentence: "Ich fühle mich sicher, wenn ich Deutsch spreche.", tip: "Sprich selbstbewusst." },
  ],

  Japanese: [
    { sentence: "毎日新しいことを学ぶのが好きです。", tip: "一つ一つの言葉をはっきり発音しましょう。" },
    { sentence: "彼女は毎朝学校に行きます。", tip: "毎朝という言葉を練習しましょう。" },
    { sentence: "私は話す力を上達させています。", tip: "ゆっくり、はっきり話しましょう。" },
    { sentence: "今日は天気がとてもいいです。", tip: "天気という言葉に注意しましょう。" },
    { sentence: "日本語を話すとき、自信があります。", tip: "自信という言葉を練習しましょう。" },
  ],
};
const pronunciationSentences = pronunciationSentencesByLanguage.English;

const readingTextsByLanguage = {
  English: [
    {
      title: "A Morning Routine",
      text: "I wake up early every morning. I drink water, get ready for school, and eat breakfast. Then I leave home and meet my friends.",
      question: "What does the student do before leaving home?",
      options: [
        "Gets ready and eats breakfast",
        "Goes to sleep",
        "Plays games all morning",
        "Travels to another city",
      ],
      answer: "Gets ready and eats breakfast",
    },
    {
      title: "Learning English",
      text: "Learning a language takes practice. Reading, listening, speaking, and writing regularly can help a learner become more confident.",
      question: "What helps a learner become more confident?",
      options: [
        "Regular language practice",
        "Never practicing",
        "Only watching movies",
        "Avoiding English",
      ],
      answer: "Regular language practice",
    },
    {
      title: "A Helpful Habit",
      text: "A good learning habit is to practice a little every day. Short and regular practice can make learning easier and more enjoyable.",
      question: "What is a good learning habit?",
      options: [
        "Practicing a little every day",
        "Studying only once a month",
        "Never reviewing",
        "Avoiding practice",
      ],
      answer: "Practicing a little every day",
    },
  ],

  Hindi: [
    {
      title: "सुबह की दिनचर्या",
      text: "मैं हर सुबह जल्दी उठता हूँ। मैं पानी पीता हूँ, स्कूल के लिए तैयार होता हूँ और नाश्ता करता हूँ। फिर मैं घर से निकलकर अपने दोस्तों से मिलता हूँ।",
      question: "घर से निकलने से पहले छात्र क्या करता है?",
      options: [
        "तैयार होकर नाश्ता करता है",
        "सोने चला जाता है",
        "पूरी सुबह खेलता है",
        "दूसरे शहर जाता है",
      ],
      answer: "तैयार होकर नाश्ता करता है",
    },
    {
      title: "भाषा सीखना",
      text: "भाषा सीखने के लिए अभ्यास जरूरी है। नियमित रूप से पढ़ना, सुनना, बोलना और लिखना सीखने वाले को अधिक आत्मविश्वासी बना सकता है।",
      question: "सीखने वाले को अधिक आत्मविश्वासी क्या बनाता है?",
      options: [
        "नियमित भाषा अभ्यास",
        "अभ्यास न करना",
        "केवल फिल्में देखना",
        "भाषा से बचना",
      ],
      answer: "नियमित भाषा अभ्यास",
    },
    {
      title: "अच्छी आदत",
      text: "हर दिन थोड़ा अभ्यास करना एक अच्छी सीखने की आदत है। छोटा और नियमित अभ्यास सीखने को आसान और आनंददायक बना सकता है।",
      question: "एक अच्छी सीखने की आदत क्या है?",
      options: [
        "हर दिन थोड़ा अभ्यास करना",
        "महीने में केवल एक बार पढ़ना",
        "कभी दोहराव न करना",
        "अभ्यास से बचना",
      ],
      answer: "हर दिन थोड़ा अभ्यास करना",
    },
  ],

  Kannada: [
    {
      title: "ಬೆಳಗಿನ ದಿನಚರಿ",
      text: "ನಾನು ಪ್ರತಿದಿನ ಬೆಳಿಗ್ಗೆ ಬೇಗ ಎದ್ದೇಳುತ್ತೇನೆ. ನೀರು ಕುಡಿದು, ಶಾಲೆಗೆ ಸಿದ್ಧವಾಗಿ ಉಪಾಹಾರ ಮಾಡುತ್ತೇನೆ. ನಂತರ ಮನೆಯಿಂದ ಹೊರಟು ನನ್ನ ಸ್ನೇಹಿತರನ್ನು ಭೇಟಿಯಾಗುತ್ತೇನೆ.",
      question: "ಮನೆಯಿಂದ ಹೊರಡುವ ಮೊದಲು ವಿದ್ಯಾರ್ಥಿ ಏನು ಮಾಡುತ್ತಾನೆ?",
      options: [
        "ಸಿದ್ಧವಾಗಿ ಉಪಾಹಾರ ಮಾಡುತ್ತಾನೆ",
        "ಮಲಗಲು ಹೋಗುತ್ತಾನೆ",
        "ಬೆಳಿಗ್ಗೆ മുഴುವತ್ತು ಆಟವಾಡುತ್ತಾನೆ",
        "ಬೇರೆ ನಗರಕ್ಕೆ ಪ್ರಯಾಣಿಸುತ್ತಾನೆ",
      ],
      answer: "ಸಿದ್ಧವಾಗಿ ಉಪಾಹಾರ ಮಾಡುತ್ತಾನೆ",
    },
    {
      title: "ಭಾಷೆ ಕಲಿಯುವುದು",
      text: "ಭಾಷೆ ಕಲಿಯಲು ಅಭ್ಯಾಸ ಅಗತ್ಯ. ನಿಯಮಿತವಾಗಿ ಓದುವುದು, ಕೇಳುವುದು, ಮಾತನಾಡುವುದು ಮತ್ತು ಬರೆಯುವುದು ಕಲಿಯುವವರಿಗೆ ಹೆಚ್ಚು ಆತ್ಮವಿಶ್ವಾಸ ನೀಡುತ್ತದೆ.",
      question: "ಕಲಿಯುವವರಿಗೆ ಹೆಚ್ಚು ಆತ್ಮವಿಶ್ವಾಸವನ್ನು ನೀಡುವುದು ಯಾವುದು?",
      options: [
        "ನಿಯಮಿತ ಭಾಷಾ ಅಭ್ಯಾಸ",
        "ಅಭ್ಯಾಸ ಮಾಡದಿರುವುದು",
        "ಕೇವಲ ಚಲನಚಿತ್ರ ನೋಡುವುದು",
        "ಭಾಷೆಯನ್ನು ತಪ್ಪಿಸುವುದು",
      ],
      answer: "ನಿಯಮಿತ ಭಾಷಾ ಅಭ್ಯಾಸ",
    },
    {
      title: "ಒಳ್ಳೆಯ ಅಭ್ಯಾಸ",
      text: "ಪ್ರತಿದಿನ ಸ್ವಲ್ಪ ಅಭ್ಯಾಸ ಮಾಡುವುದು ಒಳ್ಳೆಯ ಕಲಿಕೆಯ ಅಭ್ಯಾಸವಾಗಿದೆ. ಚಿಕ್ಕ ಮತ್ತು ನಿಯಮಿತ ಅಭ್ಯಾಸವು ಕಲಿಕೆಯನ್ನು ಸುಲಭ ಮತ್ತು ಸಂತೋಷಕರವಾಗಿಸುತ್ತದೆ.",
      question: "ಒಳ್ಳೆಯ ಕಲಿಕೆಯ ಅಭ್ಯಾಸ ಯಾವುದು?",
      options: [
        "ಪ್ರತಿದಿನ ಸ್ವಲ್ಪ ಅಭ್ಯಾಸ ಮಾಡುವುದು",
        "ತಿಂಗಳಿಗೆ ಒಮ್ಮೆ ಮಾತ್ರ ಓದುವುದು",
        "ಪುನರಾವರ್ತನೆ ಮಾಡದಿರುವುದು",
        "ಅಭ್ಯಾಸವನ್ನು ತಪ್ಪಿಸುವುದು",
      ],
      answer: "ಪ್ರತಿದಿನ ಸ್ವಲ್ಪ ಅಭ್ಯಾಸ ಮಾಡುವುದು",
    },
  ],

  Tamil: [
    {
      title: "காலை வழக்கம்",
      text: "நான் தினமும் காலையில் சீக்கிரம் எழுந்திருப்பேன். தண்ணீர் குடித்து, பள்ளிக்குத் தயாராகி, காலை உணவு சாப்பிடுவேன். பிறகு வீட்டை விட்டு வெளியேறி நண்பர்களை சந்திப்பேன்.",
      question: "வீட்டை விட்டு வெளியேறும் முன் மாணவர் என்ன செய்கிறார்?",
      options: [
        "தயாராகி காலை உணவு சாப்பிடுகிறார்",
        "தூங்கச் செல்கிறார்",
        "காலை முழுவதும் விளையாடுகிறார்",
        "வேறு நகரத்திற்குச் செல்கிறார்",
      ],
      answer: "தயாராகி காலை உணவு சாப்பிடுகிறார்",
    },
    {
      title: "மொழி கற்றல்",
      text: "ஒரு மொழியைக் கற்க பயிற்சி அவசியம். தொடர்ந்து படித்தல், கேட்டல், பேசுதல் மற்றும் எழுதுதல் கற்றவருக்கு அதிக நம்பிக்கையை அளிக்கும்.",
      question: "கற்றவருக்கு அதிக நம்பிக்கையை அளிப்பது எது?",
      options: [
        "தொடர்ச்சியான மொழிப் பயிற்சி",
        "பயிற்சி செய்யாமல் இருப்பது",
        "திரைப்படங்கள் மட்டும் பார்ப்பது",
        "மொழியைத் தவிர்ப்பது",
      ],
      answer: "தொடர்ச்சியான மொழிப் பயிற்சி",
    },
    {
      title: "நல்ல பழக்கம்",
      text: "ஒவ்வொரு நாளும் சிறிது பயிற்சி செய்வது ஒரு நல்ல கற்றல் பழக்கம். குறுகிய மற்றும் தொடர்ச்சியான பயிற்சி கற்றலை எளிதாகவும் மகிழ்ச்சியாகவும் மாற்றும்.",
      question: "நல்ல கற்றல் பழக்கம் எது?",
      options: [
        "ஒவ்வொரு நாளும் சிறிது பயிற்சி செய்வது",
        "மாதத்திற்கு ஒருமுறை மட்டும் படிப்பது",
        "மறுபரிசீலனை செய்யாமல் இருப்பது",
        "பயிற்சியைத் தவிர்ப்பது",
      ],
      answer: "ஒவ்வொரு நாளும் சிறிது பயிற்சி செய்வது",
    },
  ],

  Telugu: [
    {
      title: "ఉదయపు దినచర్య",
      text: "నేను ప్రతి ఉదయం త్వరగా లేస్తాను. నీళ్లు తాగి, పాఠశాలకు సిద్ధమై, అల్పాహారం తింటాను. తరువాత ఇంటి నుండి బయలుదేరి నా స్నేహితులను కలుస్తాను.",
      question: "ఇంటి నుండి బయలుదేరే ముందు విద్యార్థి ఏమి చేస్తాడు?",
      options: [
        "సిద్ధమై అల్పాహారం తింటాడు",
        "నిద్రపోవడానికి వెళ్తాడు",
        "ఉదయం మొత్తం ఆటలు ఆడతాడు",
        "మరో నగరానికి వెళ్తాడు",
      ],
      answer: "సిద్ధమై అల్పాహారం తింటాడు",
    },
    {
      title: "భాష నేర్చుకోవడం",
      text: "భాష నేర్చుకోవడానికి సాధన అవసరం. క్రమం తప్పకుండా చదవడం, వినడం, మాట్లాడటం మరియు రాయడం నేర్చుకునే వ్యక్తికి మరింత నమ్మకాన్ని ఇస్తాయి.",
      question: "నేర్చుకునే వ్యక్తికి మరింత నమ్మకాన్ని ఇచ్చేది ఏమిటి?",
      options: [
        "క్రమమైన భాషా సాధన",
        "సాధన చేయకపోవడం",
        "సినిమాలు మాత్రమే చూడడం",
        "భాషను తప్పించుకోవడం",
      ],
      answer: "క్రమమైన భాషా సాధన",
    },
    {
      title: "మంచి అలవాటు",
      text: "ప్రతిరోజూ కొద్దిగా సాధన చేయడం మంచి అభ్యాస అలవాటు. చిన్న మరియు క్రమమైన సాధన నేర్చుకోవడాన్ని సులభంగా మరియు ఆనందంగా చేస్తుంది.",
      question: "మంచి అభ్యాస అలవాటు ఏమిటి?",
      options: [
        "ప్రతిరోజూ కొద్దిగా సాధన చేయడం",
        "నెలకు ఒక్కసారి మాత్రమే చదవడం",
        "ఎప్పుడూ పునశ్చరణ చేయకపోవడం",
        "సాధనను తప్పించుకోవడం",
      ],
      answer: "ప్రతిరోజూ కొద్దిగా సాధన చేయడం",
    },
  ],

  Malayalam: [
    {
      title: "രാവിലെ പതിവ്",
      text: "ഞാൻ എല്ലാ ദിവസവും രാവിലെ നേരത്തെ എഴുന്നേൽക്കും. വെള്ളം കുടിച്ച് സ്കൂളിനായി തയ്യാറായി പ്രഭാതഭക്ഷണം കഴിക്കും. ശേഷം വീട്ടിൽ നിന്ന് ഇറങ്ങി സുഹൃത്തുക്കളെ കാണും.",
      question: "വീട്ടിൽ നിന്ന് ഇറങ്ങുന്നതിന് മുമ്പ് വിദ്യാർത്ഥി എന്ത് ചെയ്യുന്നു?",
      options: [
        "തയ്യാറായി പ്രഭാതഭക്ഷണം കഴിക്കുന്നു",
        "ഉറങ്ങാൻ പോകുന്നു",
        "രാവിലെ മുഴുവൻ കളിക്കുന്നു",
        "മറ്റൊരു നഗരത്തിലേക്ക് പോകുന്നു",
      ],
      answer: "തയ്യാറായി പ്രഭാതഭക്ഷണം കഴിക്കുന്നു",
    },
    {
      title: "ഭാഷ പഠിക്കൽ",
      text: "ഒരു ഭാഷ പഠിക്കാൻ പരിശീലനം ആവശ്യമാണ്. പതിവായി വായിക്കുക, കേൾക്കുക, സംസാരിക്കുക, എഴുതുക എന്നിവ പഠിതാവിന് കൂടുതൽ ആത്മവിശ്വാസം നൽകും.",
      question: "പഠിതാവിന് കൂടുതൽ ആത്മവിശ്വാസം നൽകുന്നത് എന്താണ്?",
      options: [
        "പതിവായ ഭാഷാ പരിശീലനം",
        "പരിശീലനം ചെയ്യാതിരിക്കുക",
        "സിനിമകൾ മാത്രം കാണുക",
        "ഭാഷ ഒഴിവാക്കുക",
      ],
      answer: "പതിവായ ഭാഷാ പരിശീലനം",
    },
    {
      title: "നല്ല ശീലം",
      text: "എല്ലാ ദിവസവും കുറച്ച് പരിശീലിക്കുന്നത് നല്ല പഠനശീലമാണ്. ചെറുതും പതിവുമായ പരിശീലനം പഠനം എളുപ്പവും ആസ്വാദ്യകരവുമാക്കും.",
      question: "നല്ല പഠനശീലം എന്താണ്?",
      options: [
        "എല്ലാ ദിവസവും കുറച്ച് പരിശീലിക്കുക",
        "മാസത്തിൽ ഒരിക്കൽ മാത്രം പഠിക്കുക",
        "ഒരിക്കലും ആവർത്തിക്കാതിരിക്കുക",
        "പരിശീലനം ഒഴിവാക്കുക",
      ],
      answer: "എല്ലാ ദിവസവും കുറച്ച് പരിശീലിക്കുക",
    },
  ],

  Spanish: [
    {
      title: "Una Rutina Matutina",
      text: "Me despierto temprano todas las mañanas. Bebo agua, me preparo para la escuela y desayuno. Después salgo de casa y me encuentro con mis amigos.",
      question: "¿Qué hace el estudiante antes de salir de casa?",
      options: [
        "Se prepara y desayuna",
        "Se va a dormir",
        "Juega toda la mañana",
        "Viaja a otra ciudad",
      ],
      answer: "Se prepara y desayuna",
    },
    {
      title: "Aprender un Idioma",
      text: "Aprender un idioma requiere práctica. Leer, escuchar, hablar y escribir con regularidad puede ayudar al estudiante a tener más confianza.",
      question: "¿Qué ayuda al estudiante a tener más confianza?",
      options: [
        "La práctica regular del idioma",
        "No practicar nunca",
        "Solo ver películas",
        "Evitar el idioma",
      ],
      answer: "La práctica regular del idioma",
    },
    {
      title: "Un Buen Hábito",
      text: "Practicar un poco cada día es un buen hábito de aprendizaje. Una práctica corta y regular puede hacer que aprender sea más fácil y agradable.",
      question: "¿Cuál es un buen hábito de aprendizaje?",
      options: [
        "Practicar un poco cada día",
        "Estudiar solo una vez al mes",
        "Nunca repasar",
        "Evitar la práctica",
      ],
      answer: "Practicar un poco cada día",
    },
  ],

  French: [
    {
      title: "Une Routine Matinale",
      text: "Je me réveille tôt chaque matin. Je bois de l'eau, je me prépare pour l'école et je prends mon petit-déjeuner. Ensuite, je quitte la maison et je retrouve mes amis.",
      question: "Que fait l'élève avant de quitter la maison ?",
      options: [
        "Il se prépare et prend son petit-déjeuner",
        "Il va dormir",
        "Il joue toute la matinée",
        "Il voyage dans une autre ville",
      ],
      answer: "Il se prépare et prend son petit-déjeuner",
    },
    {
      title: "Apprendre une Langue",
      text: "Apprendre une langue demande de la pratique. Lire, écouter, parler et écrire régulièrement peut aider un apprenant à avoir plus confiance en lui.",
      question: "Qu'est-ce qui aide l'apprenant à avoir plus confiance en lui ?",
      options: [
        "La pratique régulière de la langue",
        "Ne jamais pratiquer",
        "Regarder seulement des films",
        "Éviter la langue",
      ],
      answer: "La pratique régulière de la langue",
    },
    {
      title: "Une Bonne Habitude",
      text: "Pratiquer un peu chaque jour est une bonne habitude d'apprentissage. Une pratique courte et régulière peut rendre l'apprentissage plus facile et agréable.",
      question: "Quelle est une bonne habitude d'apprentissage ?",
      options: [
        "Pratiquer un peu chaque jour",
        "Étudier seulement une fois par mois",
        "Ne jamais réviser",
        "Éviter la pratique",
      ],
      answer: "Pratiquer un peu chaque jour",
    },
  ],

  German: [
    {
      title: "Eine Morgenroutine",
      text: "Ich wache jeden Morgen früh auf. Ich trinke Wasser, mache mich für die Schule fertig und frühstücke. Danach verlasse ich das Haus und treffe meine Freunde.",
      question: "Was macht der Schüler, bevor er das Haus verlässt?",
      options: [
        "Er macht sich fertig und frühstückt",
        "Er geht schlafen",
        "Er spielt den ganzen Morgen",
        "Er reist in eine andere Stadt",
      ],
      answer: "Er macht sich fertig und frühstückt",
    },
    {
      title: "Eine Sprache Lernen",
      text: "Eine Sprache zu lernen braucht Übung. Regelmäßiges Lesen, Zuhören, Sprechen und Schreiben kann einem Lernenden mehr Selbstvertrauen geben.",
      question: "Was hilft einem Lernenden, selbstbewusster zu werden?",
      options: [
        "Regelmäßiges Sprachtraining",
        "Nie zu üben",
        "Nur Filme anzusehen",
        "Die Sprache zu vermeiden",
      ],
      answer: "Regelmäßiges Sprachtraining",
    },
    {
      title: "Eine Gute Gewohnheit",
      text: "Jeden Tag ein wenig zu üben ist eine gute Lerngewohnheit. Kurzes und regelmäßiges Üben kann das Lernen einfacher und angenehmer machen.",
      question: "Was ist eine gute Lerngewohnheit?",
      options: [
        "Jeden Tag ein wenig üben",
        "Nur einmal im Monat lernen",
        "Nie wiederholen",
        "Übung vermeiden",
      ],
      answer: "Jeden Tag ein wenig üben",
    },
  ],

  Japanese: [
  {
    title: "朝の習慣",
    text: "私は毎朝早く起きます。水を飲み、学校へ行く準備をして、朝ごはんを食べます。それから家を出て、友達に会います。",
    question: "家を出る前に、学生は何をしますか？",
    options: [
      "準備をして朝ごはんを食べます",
      "寝に行きます",
      "朝ずっとゲームをします",
      "別の町へ行きます",
    ],
    answer: "準備をして朝ごはんを食べます",
  },
  {
    title: "言語を学ぶ",
    text: "言語を学ぶには練習が必要です。定期的に読む、聞く、話す、書くことは、学習者の自信を高めるのに役立ちます。",
    question: "学習者の自信を高めるのに役立つものは何ですか？",
    options: [
      "定期的な言語の練習",
      "まったく練習しないこと",
      "映画だけを見ること",
      "言語を避けること",
    ],
    answer: "定期的な言語の練習",
  },
  {
    title: "良い習慣",
    text: "毎日少しずつ練習することは、良い学習習慣です。短く定期的な練習は、学習を簡単で楽しいものにします。",
    question: "良い学習習慣は何ですか？",
    options: [
      "毎日少しずつ練習すること",
      "月に一度だけ勉強すること",
      "復習をしないこと",
      "練習を避けること",
    ],
    answer: "毎日少しずつ練習すること",
  },
  ],
};
const listeningTextsByLanguage = {
  English: [
    {
      sentence:
        "I practice English every day because I want to become more confident.",
      question: "Why does the speaker practice English?",
      options: [
        "To become more confident",
        "To go to sleep",
        "To avoid studying",
        "To learn mathematics",
      ],
      answer: "To become more confident",
    },
    {
      sentence:
        "My favorite activity is reading because I enjoy discovering new ideas.",
      question: "What is the speaker's favorite activity?",
      options: ["Reading", "Running", "Cooking", "Swimming"],
      answer: "Reading",
    },
    {
      sentence:
        "I listen to English conversations because they help me understand natural speech.",
      question: "Why does the speaker listen to conversations?",
      options: [
        "To understand natural speech",
        "To learn cooking",
        "To play football",
        "To avoid English",
      ],
      answer: "To understand natural speech",
    },
  ],

  Hindi: [
    {
      sentence:
        "मैं हर दिन अंग्रेज़ी का अभ्यास करता हूँ क्योंकि मैं अधिक आत्मविश्वासी बनना चाहता हूँ।",
      question: "वक्ता अंग्रेज़ी का अभ्यास क्यों करता है?",
      options: [
        "अधिक आत्मविश्वासी बनने के लिए",
        "सोने के लिए",
        "पढ़ाई से बचने के लिए",
        "गणित सीखने के लिए",
      ],
      answer: "अधिक आत्मविश्वासी बनने के लिए",
    },
    {
      sentence:
        "मेरी पसंदीदा गतिविधि पढ़ना है क्योंकि मुझे नए विचारों को जानना पसंद है।",
      question: "वक्ता की पसंदीदा गतिविधि क्या है?",
      options: ["पढ़ना", "दौड़ना", "खाना बनाना", "तैरना"],
      answer: "पढ़ना",
    },
    {
      sentence:
        "मैं अंग्रेज़ी की बातचीत सुनता हूँ क्योंकि इससे मुझे स्वाभाविक भाषा समझने में मदद मिलती है।",
      question: "वक्ता बातचीत क्यों सुनता है?",
      options: [
        "स्वाभाविक भाषा समझने के लिए",
        "खाना बनाना सीखने के लिए",
        "फुटबॉल खेलने के लिए",
        "अंग्रेज़ी से बचने के लिए",
      ],
      answer: "स्वाभाविक भाषा समझने के लिए",
    },
  ],

  Kannada: [
    {
      sentence:
        "ನಾನು ಪ್ರತಿದಿನ ಇಂಗ್ಲಿಷ್ ಅಭ್ಯಾಸ ಮಾಡುತ್ತೇನೆ ಏಕೆಂದರೆ ನಾನು ಹೆಚ್ಚು ಆತ್ಮವಿಶ್ವಾಸ ಹೊಂದಲು ಬಯಸುತ್ತೇನೆ.",
      question: "ವಕ್ತಾರನು ಇಂಗ್ಲಿಷ್ ಅನ್ನು ಏಕೆ ಅಭ್ಯಾಸ ಮಾಡುತ್ತಾನೆ?",
      options: [
        "ಹೆಚ್ಚು ಆತ್ಮವಿಶ್ವಾಸ ಹೊಂದಲು",
        "ನಿದ್ರಿಸಲು",
        "ಅಧ್ಯಯನವನ್ನು ತಪ್ಪಿಸಲು",
        "ಗಣಿತ ಕಲಿಯಲು",
      ],
      answer: "ಹೆಚ್ಚು ಆತ್ಮವಿಶ್ವಾಸ ಹೊಂದಲು",
    },
    {
      sentence:
        "ನನ್ನ ನೆಚ್ಚಿನ ಚಟುವಟಿಕೆ ಓದುವುದು, ಏಕೆಂದರೆ ಹೊಸ ವಿಚಾರಗಳನ್ನು ಕಂಡುಹಿಡಿಯುವುದನ್ನು ನಾನು ಆನಂದಿಸುತ್ತೇನೆ.",
      question: "ವಕ್ತಾರನ ನೆಚ್ಚಿನ ಚಟುವಟಿಕೆ ಯಾವುದು?",
      options: ["ಓದುವುದು", "ಓಡುವುದು", "ಅಡುಗೆ ಮಾಡುವುದು", "ಈಜುವುದು"],
      answer: "ಓದುವುದು",
    },
    {
      sentence:
        "ನಾನು ಇಂಗ್ಲಿಷ್ ಸಂಭಾಷಣೆಗಳನ್ನು ಕೇಳುತ್ತೇನೆ ಏಕೆಂದರೆ ಅವು ಸಹಜ ಮಾತನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಸಹಾಯ ಮಾಡುತ್ತವೆ.",
      question: "ವಕ್ತಾರನು ಸಂಭಾಷಣೆಗಳನ್ನು ಏಕೆ ಕೇಳುತ್ತಾನೆ?",
      options: [
        "ಸಹಜ ಮಾತನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು",
        "ಅಡುಗೆ ಕಲಿಯಲು",
        "ಫುಟ್ಬಾಲ್ ಆಡಲು",
        "ಇಂಗ್ಲಿಷ್ ತಪ್ಪಿಸಲು",
      ],
      answer: "ಸಹಜ ಮಾತನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು",
    },
  ],

  Tamil: [
    {
      sentence:
        "நான் தினமும் ஆங்கிலம் பயிற்சி செய்கிறேன், ஏனெனில் நான் அதிக நம்பிக்கையுடன் இருக்க விரும்புகிறேன்.",
      question: "பேசுபவர் ஏன் ஆங்கிலம் பயிற்சி செய்கிறார்?",
      options: [
        "அதிக நம்பிக்கையுடன் இருக்க",
        "தூங்க",
        "படிப்பதைத் தவிர்க்க",
        "கணிதம் கற்க",
      ],
      answer: "அதிக நம்பிக்கையுடன் இருக்க",
    },
    {
      sentence:
        "எனக்கு பிடித்த செயல்பாடு வாசிப்பது, ஏனெனில் புதிய கருத்துகளைக் கண்டுபிடிப்பதை நான் விரும்புகிறேன்.",
      question: "பேசுபவரின் பிடித்த செயல்பாடு என்ன?",
      options: ["வாசிப்பது", "ஓடுவது", "சமைப்பது", "நீந்துவது"],
      answer: "வாசிப்பது",
    },
    {
      sentence:
        "இயல்பான பேச்சைப் புரிந்துகொள்ள ஆங்கில உரையாடல்களைக் கேட்கிறேன்.",
      question: "பேசுபவர் ஏன் உரையாடல்களைக் கேட்கிறார்?",
      options: [
        "இயல்பான பேச்சைப் புரிந்துகொள்ள",
        "சமைக்க கற்க",
        "கால்பந்து விளையாட",
        "ஆங்கிலத்தைத் தவிர்க்க",
      ],
      answer: "இயல்பான பேச்சைப் புரிந்துகொள்ள",
    },
  ],

  Telugu: [
    {
      sentence:
        "నేను ప్రతిరోజూ ఇంగ్లీష్ సాధన చేస్తాను, ఎందుకంటే నేను మరింత ఆత్మవిశ్వాసంగా ఉండాలని కోరుకుంటున్నాను.",
      question: "మాట్లాడేవారు ఇంగ్లీష్ ఎందుకు సాధన చేస్తారు?",
      options: [
        "మరింత ఆత్మవిశ్వాసంగా ఉండటానికి",
        "నిద్రపోవడానికి",
        "చదువును తప్పించుకోవడానికి",
        "గణితం నేర్చుకోవడానికి",
      ],
      answer: "మరింత ఆత్మవిశ్వాసంగా ఉండటానికి",
    },
    {
      sentence:
        "నా ఇష్టమైన కార్యకలాపం చదవడం, ఎందుకంటే కొత్త ఆలోచనలను తెలుసుకోవడం నాకు ఇష్టం.",
      question: "మాట్లాడేవారి ఇష్టమైన కార్యకలాపం ఏమిటి?",
      options: ["చదవడం", "పరుగెత్తడం", "వంట చేయడం", "ఈత కొట్టడం"],
      answer: "చదవడం",
    },
    {
      sentence:
        "సహజమైన మాటలను అర్థం చేసుకోవడానికి నేను ఇంగ్లీష్ సంభాషణలను వింటాను.",
      question: "మాట్లాడేవారు సంభాషణలను ఎందుకు వింటారు?",
      options: [
        "సహజమైన మాటలను అర్థం చేసుకోవడానికి",
        "వంట నేర్చుకోవడానికి",
        "ఫుట్‌బాల్ ఆడటానికి",
        "ఇంగ్లీష్‌ను తప్పించుకోవడానికి",
      ],
      answer: "సహజమైన మాటలను అర్థం చేసుకోవడానికి",
    },
  ],

  Malayalam: [
    {
      sentence:
        "ഞാൻ എല്ലാ ദിവസവും ഇംഗ്ലീഷ് പരിശീലിക്കുന്നു, കാരണം എനിക്ക് കൂടുതൽ ആത്മവിശ്വാസമുള്ളവനാകണം.",
      question: "സംസാരിക്കുന്നയാൾ എന്തുകൊണ്ടാണ് ഇംഗ്ലീഷ് പരിശീലിക്കുന്നത്?",
      options: [
        "കൂടുതൽ ആത്മവിശ്വാസമുള്ളവനാകാൻ",
        "ഉറങ്ങാൻ",
        "പഠനം ഒഴിവാക്കാൻ",
        "ഗണിതം പഠിക്കാൻ",
      ],
      answer: "കൂടുതൽ ആത്മവിശ്വാസമുള്ളവനാകാൻ",
    },
    {
      sentence:
        "എന്റെ പ്രിയപ്പെട്ട പ്രവർത്തനം വായനയാണ്, കാരണം പുതിയ ആശയങ്ങൾ കണ്ടെത്തുന്നത് എനിക്ക് ഇഷ്ടമാണ്.",
      question: "സംസാരിക്കുന്നയാളുടെ പ്രിയപ്പെട്ട പ്രവർത്തനം എന്താണ്?",
      options: ["വായന", "ഓട്ടം", "പാചകം", "നീന്തൽ"],
      answer: "വായന",
    },
    {
      sentence:
        "സ്വാഭാവികമായ സംസാരഭാഷ മനസ്സിലാക്കാൻ ഞാൻ ഇംഗ്ലീഷ് സംഭാഷണങ്ങൾ കേൾക്കുന്നു.",
      question: "സംസാരിക്കുന്നയാൾ സംഭാഷണങ്ങൾ കേൾക്കുന്നത് എന്തുകൊണ്ട്?",
      options: [
        "സ്വാഭാവികമായ സംസാരഭാഷ മനസ്സിലാക്കാൻ",
        "പാചകം പഠിക്കാൻ",
        "ഫുട്ബോൾ കളിക്കാൻ",
        "ഇംഗ്ലീഷ് ഒഴിവാക്കാൻ",
      ],
      answer: "സ്വാഭാവികമായ സംസാരഭാഷ മനസ്സിലാക്കാൻ",
    },
  ],

  Spanish: [
    {
      sentence:
        "Practico inglés todos los días porque quiero tener más confianza.",
      question: "¿Por qué practica inglés el hablante?",
      options: [
        "Para tener más confianza",
        "Para dormir",
        "Para evitar estudiar",
        "Para aprender matemáticas",
      ],
      answer: "Para tener más confianza",
    },
    {
      sentence:
        "Mi actividad favorita es leer porque disfruto descubriendo nuevas ideas.",
      question: "¿Cuál es la actividad favorita del hablante?",
      options: ["Leer", "Correr", "Cocinar", "Nadar"],
      answer: "Leer",
    },
    {
      sentence:
        "Escucho conversaciones en inglés porque me ayudan a entender el habla natural.",
      question: "¿Por qué escucha conversaciones el hablante?",
      options: [
        "Para entender el habla natural",
        "Para aprender a cocinar",
        "Para jugar al fútbol",
        "Para evitar el inglés",
      ],
      answer: "Para entender el habla natural",
    },
  ],

  French: [
    {
      sentence:
        "Je pratique l'anglais tous les jours parce que je veux avoir plus confiance en moi.",
      question: "Pourquoi le locuteur pratique-t-il l'anglais ?",
      options: [
        "Pour avoir plus confiance en lui",
        "Pour dormir",
        "Pour éviter d'étudier",
        "Pour apprendre les mathématiques",
      ],
      answer: "Pour avoir plus confiance en lui",
    },
    {
      sentence:
        "Mon activité préférée est la lecture parce que j'aime découvrir de nouvelles idées.",
      question: "Quelle est l'activité préférée du locuteur ?",
      options: ["La lecture", "La course", "La cuisine", "La natation"],
      answer: "La lecture",
    },
    {
      sentence:
        "J'écoute des conversations en anglais parce qu'elles m'aident à comprendre la langue naturelle.",
      question: "Pourquoi le locuteur écoute-t-il des conversations ?",
      options: [
        "Pour comprendre la langue naturelle",
        "Pour apprendre à cuisiner",
        "Pour jouer au football",
        "Pour éviter l'anglais",
      ],
      answer: "Pour comprendre la langue naturelle",
    },
  ],

  German: [
    {
      sentence:
        "Ich übe jeden Tag Englisch, weil ich selbstbewusster werden möchte.",
      question: "Warum übt der Sprecher Englisch?",
      options: [
        "Um selbstbewusster zu werden",
        "Um zu schlafen",
        "Um das Lernen zu vermeiden",
        "Um Mathematik zu lernen",
      ],
      answer: "Um selbstbewusster zu werden",
    },
    {
      sentence:
        "Meine Lieblingsaktivität ist Lesen, weil ich gerne neue Ideen entdecke.",
      question: "Was ist die Lieblingsaktivität des Sprechers?",
      options: ["Lesen", "Laufen", "Kochen", "Schwimmen"],
      answer: "Lesen",
    },
    {
      sentence:
        "Ich höre englische Gespräche, weil sie mir helfen, natürliche Sprache zu verstehen.",
      question: "Warum hört der Sprecher Gespräche?",
      options: [
        "Um natürliche Sprache zu verstehen",
        "Um Kochen zu lernen",
        "Um Fußball zu spielen",
        "Um Englisch zu vermeiden",
      ],
      answer: "Um natürliche Sprache zu verstehen",
    },
  ],

  Japanese: [
    {
      sentence:
        "私はもっと自信を持ちたいので、毎日英語を練習しています。",
      question: "話し手はなぜ英語を練習していますか？",
      options: [
        "もっと自信を持つため",
        "寝るため",
        "勉強を避けるため",
        "数学を学ぶため",
      ],
      answer: "もっと自信を持つため",
    },
    {
      sentence:
        "私の好きな活動は読書です。新しい考えを発見するのが好きだからです。",
      question: "話し手の好きな活動は何ですか？",
      options: ["読書", "走ること", "料理", "水泳"],
      answer: "読書",
    },
    {
      sentence:
        "自然な話し方を理解するために、英語の会話を聞きます。",
      question: "話し手はなぜ会話を聞きますか？",
      options: [
        "自然な話し方を理解するため",
        "料理を学ぶため",
        "サッカーをするため",
        "英語を避けるため",
      ],
      answer: "自然な話し方を理解するため",
    },
  ],
};
const scenariosByLanguage = {
  English: [
    {
      title: "🏫 At School",
      tutor: "Hello! What subject do you enjoy at school?",
      suggestions: [
        "I enjoy English.",
        "I like science.",
        "My favorite subject is mathematics.",
      ],
    },
    {
      title: "🛍️ At a Shop",
      tutor: "Hello! Can I help you find something?",
      suggestions: [
        "I am looking for a notebook.",
        "How much does this cost?",
        "Can I see another one?",
      ],
    },
    {
      title: "✈️ At the Airport",
      tutor: "Hello! Where are you travelling today?",
      suggestions: [
        "I am travelling to Delhi.",
        "Where is the boarding gate?",
        "Here is my ticket.",
      ],
    },
  ],

  Hindi: [
    {
      title: "🏫 स्कूल में",
      tutor: "नमस्ते! आपको स्कूल में कौन सा विषय पसंद है?",
      suggestions: [
        "मुझे अंग्रेज़ी पसंद है।",
        "मुझे विज्ञान पसंद है।",
        "मेरा पसंदीदा विषय गणित है।",
      ],
    },
    {
      title: "🛍️ दुकान पर",
      tutor: "नमस्ते! क्या मैं आपकी कुछ ढूँढने में मदद कर सकता हूँ?",
      suggestions: [
        "मैं एक नोटबुक ढूँढ रहा हूँ।",
        "इसकी कीमत कितनी है?",
        "क्या मैं दूसरी वाली देख सकता हूँ?",
      ],
    },
    {
      title: "✈️ हवाई अड्डे पर",
      tutor: "नमस्ते! आज आप कहाँ यात्रा कर रहे हैं?",
      suggestions: [
        "मैं दिल्ली जा रहा हूँ।",
        "बोर्डिंग गेट कहाँ है?",
        "यह मेरा टिकट है।",
      ],
    },
  ],

  Kannada: [
    {
      title: "🏫 ಶಾಲೆಯಲ್ಲಿ",
      tutor: "ನಮಸ್ಕಾರ! ಶಾಲೆಯಲ್ಲಿ ನಿಮಗೆ ಯಾವ ವಿಷಯ ಇಷ್ಟ?",
      suggestions: [
        "ನನಗೆ ಇಂಗ್ಲಿಷ್ ಇಷ್ಟ.",
        "ನನಗೆ ವಿಜ್ಞಾನ ಇಷ್ಟ.",
        "ನನ್ನ ನೆಚ್ಚಿನ ವಿಷಯ ಗಣಿತ.",
      ],
    },
    {
      title: "🛍️ ಅಂಗಡಿಯಲ್ಲಿ",
      tutor: "ನಮಸ್ಕಾರ! ನಿಮಗೆ ಏನಾದರೂ ಹುಡುಕಲು ನಾನು ಸಹಾಯ ಮಾಡಬಹುದೇ?",
      suggestions: [
        "ನಾನು ಒಂದು ನೋಟ್‌ಬುಕ್ ಹುಡುಕುತ್ತಿದ್ದೇನೆ.",
        "ಇದರ ಬೆಲೆ ಎಷ್ಟು?",
        "ನಾನು ಇನ್ನೊಂದನ್ನು ನೋಡಬಹುದೇ?",
      ],
    },
    {
      title: "✈️ ವಿಮಾನ ನಿಲ್ದಾಣದಲ್ಲಿ",
      tutor: "ನಮಸ್ಕಾರ! ಇಂದು ನೀವು ಎಲ್ಲಿಗೆ ಪ್ರಯಾಣಿಸುತ್ತಿದ್ದೀರಿ?",
      suggestions: [
        "ನಾನು ದೆಹಲಿಗೆ ಪ್ರಯಾಣಿಸುತ್ತಿದ್ದೇನೆ.",
        "ಬೋರ್ಡಿಂಗ್ ಗೇಟ್ ಎಲ್ಲಿದೆ?",
        "ಇದು ನನ್ನ ಟಿಕೆಟ್.",
      ],
    },
  ],

  Tamil: [
    {
      title: "🏫 பள்ளியில்",
      tutor: "வணக்கம்! பள்ளியில் உங்களுக்கு எந்தப் பாடம் பிடிக்கும்?",
      suggestions: [
        "எனக்கு ஆங்கிலம் பிடிக்கும்.",
        "எனக்கு அறிவியல் பிடிக்கும்.",
        "எனக்கு கணிதம் மிகவும் பிடிக்கும்.",
      ],
    },
    {
      title: "🛍️ கடையில்",
      tutor: "வணக்கம்! ஏதாவது ஒன்றைக் கண்டுபிடிக்க நான் உதவவா?",
      suggestions: [
        "நான் ஒரு நோட்டுப் புத்தகத்தைத் தேடுகிறேன்.",
        "இதன் விலை எவ்வளவு?",
        "இன்னொன்றைப் பார்க்கலாமா?",
      ],
    },
    {
      title: "✈️ விமான நிலையத்தில்",
      tutor: "வணக்கம்! இன்று நீங்கள் எங்கு பயணம் செய்கிறீர்கள்?",
      suggestions: [
        "நான் டெல்லிக்கு பயணம் செய்கிறேன்.",
        "போர்டிங் கேட் எங்கே உள்ளது?",
        "இது என் டிக்கெட்.",
      ],
    },
  ],

  Telugu: [
    {
      title: "🏫 పాఠశాలలో",
      tutor: "హలో! పాఠశాలలో మీకు ఏ విషయం ఇష్టం?",
      suggestions: [
        "నాకు ఇంగ్లీష్ ఇష్టం.",
        "నాకు సైన్స్ ఇష్టం.",
        "నాకు గణితం చాలా ఇష్టం.",
      ],
    },
    {
      title: "🛍️ దుకాణంలో",
      tutor: "హలో! మీరు ఏదైనా వెతకడానికి నేను సహాయం చేయనా?",
      suggestions: [
        "నేను ఒక నోట్‌బుక్ కోసం చూస్తున్నాను.",
        "దీని ధర ఎంత?",
        "నేను మరొకటి చూడవచ్చా?",
      ],
    },
    {
      title: "✈️ విమానాశ్రయంలో",
      tutor: "హలో! ఈ రోజు మీరు ఎక్కడికి ప్రయాణిస్తున్నారు?",
      suggestions: [
        "నేను ఢిల్లీకి ప్రయాణిస్తున్నాను.",
        "బోర్డింగ్ గేట్ ఎక్కడ ఉంది?",
        "ఇదిగో నా టికెట్.",
      ],
    },
  ],

  Malayalam: [
    {
      title: "🏫 സ്കൂളിൽ",
      tutor: "ഹലോ! സ്കൂളിൽ നിങ്ങൾക്ക് ഏത് വിഷയം ഇഷ്ടമാണ്?",
      suggestions: [
        "എനിക്ക് ഇംഗ്ലീഷ് ഇഷ്ടമാണ്.",
        "എനിക്ക് ശാസ്ത്രം ഇഷ്ടമാണ്.",
        "എനിക്ക് ഗണിതമാണ് ഏറ്റവും ഇഷ്ടം.",
      ],
    },
    {
      title: "🛍️ കടയിൽ",
      tutor: "ഹലോ! എന്തെങ്കിലും കണ്ടെത്താൻ ഞാൻ സഹായിക്കട്ടേ?",
      suggestions: [
        "ഞാൻ ഒരു നോട്ട്ബുക്ക് അന്വേഷിക്കുകയാണ്.",
        "ഇതിന് എത്രയാണ് വില?",
        "എനിക്ക് മറ്റൊന്ന് കാണാമോ?",
      ],
    },
    {
      title: "✈️ വിമാനത്താവളത്തിൽ",
      tutor: "ഹലോ! ഇന്ന് നിങ്ങൾ എവിടേക്കാണ് യാത്ര ചെയ്യുന്നത്?",
      suggestions: [
        "ഞാൻ ഡൽഹിയിലേക്ക് യാത്ര ചെയ്യുകയാണ്.",
        "ബോർഡിംഗ് ഗേറ്റ് എവിടെയാണ്?",
        "ഇതാണ് എന്റെ ടിക്കറ്റ്.",
      ],
    },
  ],

  Spanish: [
    {
      title: "🏫 En la escuela",
      tutor: "¡Hola! ¿Qué asignatura te gusta en la escuela?",
      suggestions: [
        "Me gusta el inglés.",
        "Me gusta la ciencia.",
        "Mi asignatura favorita es matemáticas.",
      ],
    },
    {
      title: "🛍️ En una tienda",
      tutor: "¡Hola! ¿Puedo ayudarte a encontrar algo?",
      suggestions: [
        "Estoy buscando un cuaderno.",
        "¿Cuánto cuesta esto?",
        "¿Puedo ver otro?",
      ],
    },
    {
      title: "✈️ En el aeropuerto",
      tutor: "¡Hola! ¿A dónde viajas hoy?",
      suggestions: [
        "Viajo a Delhi.",
        "¿Dónde está la puerta de embarque?",
        "Aquí está mi billete.",
      ],
    },
  ],

  French: [
    {
      title: "🏫 À l'école",
      tutor: "Bonjour ! Quelle matière aimez-vous à l'école ?",
      suggestions: [
        "J'aime l'anglais.",
        "J'aime les sciences.",
        "Ma matière préférée est les mathématiques.",
      ],
    },
    {
      title: "🛍️ Dans un magasin",
      tutor: "Bonjour ! Puis-je vous aider à trouver quelque chose ?",
      suggestions: [
        "Je cherche un cahier.",
        "Combien coûte ceci ?",
        "Puis-je en voir un autre ?",
      ],
    },
    {
      title: "✈️ À l'aéroport",
      tutor: "Bonjour ! Où voyagez-vous aujourd'hui ?",
      suggestions: [
        "Je voyage à Delhi.",
        "Où est la porte d'embarquement ?",
        "Voici mon billet.",
      ],
    },
  ],

  German: [
    {
      title: "🏫 In der Schule",
      tutor: "Hallo! Welches Fach magst du in der Schule?",
      suggestions: [
        "Ich mag Englisch.",
        "Ich mag Naturwissenschaften.",
        "Mein Lieblingsfach ist Mathematik.",
      ],
    },
    {
      title: "🛍️ Im Geschäft",
      tutor: "Hallo! Kann ich dir helfen, etwas zu finden?",
      suggestions: [
        "Ich suche ein Notizbuch.",
        "Wie viel kostet das?",
        "Kann ich ein anderes sehen?",
      ],
    },
    {
      title: "✈️ Am Flughafen",
      tutor: "Hallo! Wohin reist du heute?",
      suggestions: [
        "Ich reise nach Delhi.",
        "Wo ist das Gate?",
        "Hier ist mein Ticket.",
      ],
    },
  ],

  Japanese: [
    {
      title: "🏫 学校で",
      tutor: "こんにちは！学校ではどの教科が好きですか？",
      suggestions: [
        "英語が好きです。",
        "理科が好きです。",
        "数学が一番好きです。",
      ],
    },
    {
      title: "🛍️ お店で",
      tutor: "こんにちは！何かお探しですか？",
      suggestions: [
        "ノートを探しています。",
        "これはいくらですか？",
        "別のものを見てもいいですか？",
      ],
    },
    {
      title: "✈️ 空港で",
      tutor: "こんにちは！今日はどこへ旅行しますか？",
      suggestions: [
        "東京へ旅行します。",
        "搭乗口はどこですか？",
        "これが私のチケットです。",
      ],
    },
  ],
};

const gameWordsByLanguage = {
  English: [
    ["Happy", "Sad"],
    ["Fast", "Slow"],
    ["Big", "Small"],
    ["Hot", "Cold"],
    ["Easy", "Difficult"],
  ],

  Hindi: [
    ["खुश", "दुखी"],
    ["तेज़", "धीमा"],
    ["बड़ा", "छोटा"],
    ["गर्म", "ठंडा"],
    ["आसान", "कठिन"],
  ],

  Kannada: [
    ["ಸಂತೋಷ", "ದುಃಖ"],
    ["ವೇಗವಾದ", "ನಿಧಾನ"],
    ["ದೊಡ್ಡ", "ಚಿಕ್ಕ"],
    ["ಬಿಸಿ", "ತಣ್ಣಗೆ"],
    ["ಸುಲಭ", "ಕಷ್ಟ"],
  ],

  Tamil: [
    ["மகிழ்ச்சி", "சோகம்"],
    ["வேகமான", "மெதுவான"],
    ["பெரிய", "சிறிய"],
    ["சூடான", "குளிரான"],
    ["எளிதான", "கடினமான"],
  ],

  Telugu: [
    ["సంతోషం", "దుఃఖం"],
    ["వేగమైన", "నెమ్మదైన"],
    ["పెద్ద", "చిన్న"],
    ["వేడి", "చల్లని"],
    ["సులభమైన", "కష్టమైన"],
  ],

  Malayalam: [
    ["സന്തോഷം", "ദുഃഖം"],
    ["വേഗമുള്ള", "പതുക്കെയുള്ള"],
    ["വലുത്", "ചെറുത്"],
    ["ചൂടുള്ള", "തണുത്ത"],
    ["എളുപ്പമുള്ള", "ബുദ്ധിമുട്ടുള്ള"],
  ],

  Spanish: [
    ["Feliz", "Triste"],
    ["Rápido", "Lento"],
    ["Grande", "Pequeño"],
    ["Caliente", "Frío"],
    ["Fácil", "Difícil"],
  ],

  French: [
    ["Heureux", "Triste"],
    ["Rapide", "Lent"],
    ["Grand", "Petit"],
    ["Chaud", "Froid"],
    ["Facile", "Difficile"],
  ],

  German: [
    ["Glücklich", "Traurig"],
    ["Schnell", "Langsam"],
    ["Groß", "Klein"],
    ["Heiß", "Kalt"],
    ["Einfach", "Schwierig"],
  ],

  Japanese: [
    ["嬉しい", "悲しい"],
    ["速い", "遅い"],
    ["大きい", "小さい"],
    ["暑い", "寒い"],
    ["簡単", "難しい"],
  ],
};

function todayKey() {
  const d = new Date();

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

function emptyRecord(date: string): DailyRecord {
  return {
    date,
    exercises: 0,
    exerciseCorrect: 0,
    vocabulary: 0,
    vocabularyCorrect: 0,
    speaking: 0,
    speakingSuccessful: 0,
    pronunciation: 0,
    reading: 0,
    writing: 0,
    listening: 0,
    scenario: 0,
    game: 0,
    xp: 0,
    dailyWord: false,
  };
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[.,!?']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function shuffle<T>(items: T[]) {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <View
      style={{
        width: "100%",
        height: 12,
        backgroundColor: "#e0e7ff",
        borderRadius: 10,
        overflow: "hidden",
        marginVertical: 8,
        marginBottom: 15,
      }}
    >
      <View
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          height: "100%",
          backgroundColor: "#4f46e5",
          borderRadius: 10,
        }}
      />
    </View>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
  style={{
    backgroundColor: "#e9d5ff",
    padding: 22,
    borderRadius: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#ffffff",
  }}
>
  {children}
</View>
  );
}

function StatCard({
  icon,
  title,
  value,
}: {
  icon: string;
  title: string;
  value: string | number;
}) {
 return (
  <View
    style={{
      backgroundColor: "#f5f3ff",
      padding: 15,
      borderRadius: 16,
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: "#c7d2fe",
      marginBottom: 10,
    }}
  >
    <Text style={{ fontSize: 24 }}>{icon}</Text>

    <Text style={{ color: "#64748b", fontSize: 13 }}>
      {title}
    </Text>

    <Text
      style={{
        fontSize: 22,
        fontWeight: "700",
      }}
    >
      {value}
    </Text>
  </View>
);
}

const buttonStyle = {
  padding: "12px 18px",
  border: "none",
  borderRadius: 14,
  background: "linear-gradient(135deg, #2563eb, #7c3aed)",
  color: "#fff",
  cursor: "pointer",
  marginTop: 8,
  fontWeight: 700,
  boxShadow: "0 6px 16px rgba(79, 70, 229, 0.22)",
};

const optionButtonStyle = {
  display: "block",
  width: "100%",
  padding: "14px 16px",
  marginTop: 10,
  border: "1.5px solid #bfdbfe",
  borderRadius: 14,
  background: "#eff6ff",
  color: "#1e3a8a",
  cursor: "pointer",
  textAlign: "left" as const,
  fontWeight: 600,
  transition: "all 0.2s ease",
};

export default function LanguageTutor() {
const [user, setUser] = useState<any>(null);
const [authEmail, setAuthEmail] = useState("");
const [authPassword, setAuthPassword] = useState("");
const [authMessage, setAuthMessage] = useState("");
const [authLoading, setAuthLoading] = useState(false);
const [syncStatus, setSyncStatus] = useState("Not synced");
const [reminderEnabled, setReminderEnabled] = useState(false);
const [reminderTime, setReminderTime] = useState("18:00");
const [reminderMessage, setReminderMessage] = useState("");
const [difficulty, setDifficulty] = useState<"Easy"|"Medium"|"Hard">("Medium");
const [personalizedLesson, setPersonalizedLesson] = useState("General Practice");
const [calendarMonth, setCalendarMonth] = useState(new Date());
const [reminderSettingsLoaded, setReminderSettingsLoaded] = useState(false);
const [speechMode, setSpeechMode] = useState<
  "speaking" | "pronunciation" | null
>(null);
// Load saved reminder settings
useEffect(() => {
  async function loadReminderSettings() {
    const savedSettings = await AsyncStorage.getItem(
      "languageTutorReminder"
    );

    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);

        setReminderEnabled(settings.enabled ?? false);
        setReminderTime(settings.time ?? "18:00");
        setReminderMessage(settings.message ?? "");
      } catch {
        console.log("Could not load reminder settings.");
      }
    }

    setReminderSettingsLoaded(true);
  }

  loadReminderSettings();
}, []);

// Save reminder settings
useEffect(() => {
  if (!reminderSettingsLoaded) return;

  const settings = {
    enabled: reminderEnabled,
    time: reminderTime,
    message: reminderMessage,
  };

  AsyncStorage.setItem(
    "languageTutorReminder",
    JSON.stringify(settings)
  );
}, [
  reminderSettingsLoaded,
  reminderEnabled,
  reminderTime,
  reminderMessage,
]);

const requestNotificationPermission = async () => {
  try {
    if (Platform.OS === "web") {
      if (!("Notification" in window)) {
        alert("Notifications are not supported here.");
        return;
      }

      const permission = await Notification.requestPermission();

      alert(
        permission === "granted"
          ? "Notifications enabled! 🔔"
          : "Notification permission was not granted."
      );
      return;
    }

    // Create the Android notification channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "LanguageTutor Reminders",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    // Check and request notification permission
    const currentPermission =
      await Notifications.getPermissionsAsync();

    let finalStatus = currentPermission.status;

    if (finalStatus !== "granted") {
      const permission =
        await Notifications.requestPermissionsAsync();

      finalStatus = permission.status;
    }

    alert(
      finalStatus === "granted"
        ? "Notifications enabled! 🔔"
        : "Notification permission was not granted."
    );
  } catch (error) {
    console.error("Notification permission error:", error);
    alert("Could not enable notifications.");
  }
};

useEffect(() => {
  let cancelled = false;

  const setupReminder = async () => {
    try {
      // Cancel the previously scheduled reminder
      const oldId = await AsyncStorage.getItem(
        "languageTutorScheduledReminder"
      );

      if (oldId) {
        await Notifications.cancelScheduledNotificationAsync(oldId);
        await AsyncStorage.removeItem(
          "languageTutorScheduledReminder"
        );
      }

      if (!reminderEnabled || cancelled) return;

      // Keep the existing browser reminder behavior
      if (Platform.OS === "web") {
        const checkReminder = async () => {
          const now = new Date();

          const currentTime =
            String(now.getHours()).padStart(2, "0") +
            ":" +
            String(now.getMinutes()).padStart(2, "0");

          const today = now.toDateString();
          const lastReminder = await AsyncStorage.getItem(
            "lastPracticeReminder"
          );

          if (
            currentTime >= reminderTime &&
            lastReminder !== today
          ) {
            alert(
              reminderMessage.trim() ||
                "Time to practice English! 📚"
            );

            await AsyncStorage.setItem(
              "lastPracticeReminder",
              today
            );
          }
        };

        checkReminder();
        const interval = setInterval(checkReminder, 10000);

        return;
      }

      // Mobile notifications require permission
      const permission = await Notifications.getPermissionsAsync();

      if (permission.status !== "granted") {
        console.log("Notification permission is not granted.");
        return;
      }

      const [hour, minute] = reminderTime.split(":").map(Number);

      if (
        !Number.isInteger(hour) ||
        !Number.isInteger(minute) ||
        hour < 0 ||
        hour > 23 ||
        minute < 0 ||
        minute > 59
      ) {
        return;
      }

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "LanguageTutor Reminder 🔔",
          body:
            reminderMessage.trim() ||
            "Time to practice English! 📚",
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId: "default",
        },
      });

      if (cancelled) {
        await Notifications.cancelScheduledNotificationAsync(id);
        return;
      }

      await AsyncStorage.setItem(
        "languageTutorScheduledReminder",
        id
      );
    } catch (error) {
      console.error("Could not schedule reminder:", error);
    }
  };

  setupReminder();

  return () => {
    cancelled = true;
  };
}, [reminderEnabled, reminderTime, reminderMessage]);

const getCalendarDays = () => {
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  return days;
};
const hasLearningActivity = (day: number) => {
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();

  const dateString =
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return history.some(
    (record) => record.date === dateString
  );
};

const signUp = async () => {
  setAuthLoading(true);
  setAuthMessage("");

  const { error } = await supabase.auth.signUp({
    email: authEmail,
    password: authPassword,
  });

  if (error) {
    setAuthMessage(error.message);
  }else{
    setAuthMessage("Account created! Check your email if confirmation is required.");
  }

  setAuthLoading(false);
};

const signIn = async () => {
  setAuthLoading(true);
  setAuthMessage("");

  const { error } = await supabase.auth.signInWithPassword({
    email: authEmail,
    password: authPassword,
  });

  if (error) {
    console.log("SIGN IN ERROR:");
    setAuthMessage(error.message);
  }else{
    console.log("SING IN SUCCESS");
  }
  setAuthLoading(false);
};

const signOut = async () => {
  await supabase.auth.signOut();
  setUser(null);
};
useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    setUser(data.session?.user ?? null);
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);
  });

  return () => {
    subscription.unsubscribe();
  };
}, []);
  const [level, setLevel] = useState("Beginner");
  const [selectedLanguage, setSelectedLanguage] = useState<keyof typeof readingTextsByLanguage>("English");
  const readingTexts =
    readingTextsByLanguage[selectedLanguage] ||
              readingTextsByLanguage.English;
  const listeningTexts =
  listeningTextsByLanguage[selectedLanguage] ||
  listeningTextsByLanguage.English;
  const scenarios =
  scenariosByLanguage[selectedLanguage] ||
  scenariosByLanguage.English;
  const gameWords =
  gameWordsByLanguage[selectedLanguage] ||
  gameWordsByLanguage.English;

  useEffect(() => {
  setPronunciationIndex(0);
}, [selectedLanguage]);
  const currentPronunciationSentences =
  pronunciationSentencesByLanguage[selectedLanguage] ||
  pronunciationSentences;
  
  const languages = [
  "English",
  "Hindi",
  "Kannada",
  "Tamil",
  "Telugu",
  "Malayalam",
  "Spanish",
  "French",
  "German",
  "Japanese",
];
const speechLanguageCodes: Record<string, string> = {
  English: "en-US",
  Hindi: "hi-IN",
  Kannada: "kn-IN",
  Tamil: "ta-IN",
  Telugu: "te-IN",
  Malayalam: "ml-IN",
  Spanish: "es-ES",
  French: "fr-FR",
  German: "de-DE",
  Japanese: "ja-JP",
};

  const [profileName, setProfileName] =
    useState("English Learner");

  const welcomeMessages: Record<string, string> = {
  English: "Hello! 👋 I'm your LanguageTutor. Let's practice English!",
  Hindi: "नमस्ते! 👋 मैं आपका LanguageTutor हूँ। आइए हिंदी सीखें!",
  Kannada: "ನಮಸ್ಕಾರ! 👋 ನಾನು ನಿಮ್ಮ LanguageTutor. ಕನ್ನಡ ಕಲಿಯೋಣ!",
  Tamil: "வணக்கம்! 👋 நான் உங்கள் LanguageTutor. தமிழைப் பயில்வோம்!",
  Telugu: "నమస్కారం! 👋 నేను మీ LanguageTutor. తెలుగు నేర్చుకుందాం!",
  Malayalam: "നമസ്കാരം! 👋 ഞാൻ നിങ്ങളുടെ LanguageTutor. മലയാളം പഠിക്കാം!",
  Spanish: "¡Hola! 👋 Soy tu LanguageTutor. ¡Vamos a practicar español!",
  French: "Bonjour ! 👋 Je suis votre LanguageTutor. Pratiquons le français !",
  German: "Hallo! 👋 Ich bin dein LanguageTutor. Lass uns Deutsch üben!",
  Japanese: "こんにちは！👋 LanguageTutorです。一緒に日本語を練習しましょう！",
};

const [messages, setMessages] = useState<string[]>([
  `Tutor: ${welcomeMessages[selectedLanguage] || welcomeMessages.English}`,
]);

const [message, setMessage] = useState("");

const [lastTutorMessage, setLastTutorMessage] = useState(
  welcomeMessages[selectedLanguage] || welcomeMessages.English
);
useEffect(() => {
  const newWelcome =
    welcomeMessages[selectedLanguage] || welcomeMessages.English;

  setMessages([`Tutor: ${newWelcome}`]);
  setLastTutorMessage(newWelcome);
}, [selectedLanguage]);
  const [tutorTopic, setTutorTopic] = useState("General English");

  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [exerciseResult, setExerciseResult] = useState("");
  const [exerciseScore, setExerciseScore] = useState(0);
  const [exerciseAttempts, setExerciseAttempts] = useState(0);
  const [exerciseCorrect, setExerciseCorrect] = useState(0);

  const [vocabularyIndex, setVocabularyIndex] = useState(0);
  const [vocabularyResult, setVocabularyResult] = useState("");
  const [vocabularyScore, setVocabularyScore] = useState(0);
  const [vocabularyAttempts, setVocabularyAttempts] = useState(0);
  const [vocabularyCorrect, setVocabularyCorrect] = useState(0);

  const [dailyResult, setDailyResult] = useState("");
  const [dailyLearned, setDailyLearned] = useState(false);

  const [speakingAttempts, setSpeakingAttempts] = useState(0);
  const [speakingSuccessful, setSpeakingSuccessful] = useState(0);
  const [isListening, setIsListening] = useState(false);

  const [pronunciationIndex, setPronunciationIndex] = useState(0);
  const [pronunciationAttempts, setPronunciationAttempts] =
    useState(0);
  const [pronunciationResult, setPronunciationResult] =
    useState("");
    const [pronunciationScore, setPronunciationScore] = useState(0);
  const [pronunciationFeedback, setPronunciationFeedback] =
    useState("");
  const [pronunciationListening, setPronunciationListening] =
    useState(false);

  const [readingIndex, setReadingIndex] = useState(0);
  const [readingResult, setReadingResult] = useState("");

  const [writingText, setWritingText] = useState("");
  const [writingFeedback, setWritingFeedback] = useState("");
  const [writingCount, setWritingCount] = useState(0);

  const [listeningIndex, setListeningIndex] = useState(0);
  const [listeningResult, setListeningResult] = useState("");

  const [scenarioIndex, setScenarioIndex] = useState(0);

  const [gameIndex, setGameIndex] = useState(0);
  const [gameScore, setGameScore] = useState(0);
  const [gameResult, setGameResult] = useState("");

  const [xp, setXp] = useState(0);
  const [levelMessage, setLevelMessage] = useState("");

  const [history, setHistory] = useState<DailyRecord[]>([]);

  const [goals, setGoals] = useState<Goals>({
    exercises: 3,
    vocabulary: 3,
    speaking: 2,
    pronunciation: 2,
  });

  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [lastActiveDate, setLastActiveDate] = useState("");

  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const currentExercise =
  translatedExercises[selectedLanguage]?.[level]?.[exerciseIndex] ??
  exercises[level][exerciseIndex];
  const currentWord =
  translatedVocabulary[selectedLanguage]?.[vocabularyIndex] ??
  vocabulary[vocabularyIndex];

  const dailyWord = useMemo(() => {
  const d = new Date();

  const number =
    Math.floor(
      Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) /
        86400000
    );

  const languageWords =
  translatedDailyVocabulary?.[selectedLanguage];

if (languageWords?.length) {
  return languageWords[number % languageWords.length];
}

  return dailyVocabulary[number % dailyVocabulary.length];
}, [selectedLanguage]);

  const [dailyOptions, setDailyOptions] = useState<string[]>([]);

  const [exerciseOptions, setExerciseOptions] = useState<string[]>([]);
  const [vocabularyOptions, setVocabularyOptions] =
    useState<string[]>([]);

  const [lesson, setLesson] = useState<Lesson>({
    title: "🧠 Personalized Lesson",
    description:
      "Complete a few activities and LanguageTutor will personalize your practice.",
    activity: "Start with a grammar exercise.",
    tip: "Regular short practice is better than waiting for a perfect study session.",
  });

  useEffect(() => {
    setDailyOptions(shuffle(dailyWord.options));
  }, [dailyWord]);

  useEffect(() => {
    setExerciseOptions(shuffle(currentExercise.options));
  }, [currentExercise]);

  useEffect(() => {
    setVocabularyOptions(shuffle(currentWord.options));
  }, [currentWord]);

  const today = todayKey();

  const todayRecord =
    history.find((record) => record.date === today) ??
    emptyRecord(today);

  const xpLevel = Math.floor(xp / 100) + 1;
  const xpInLevel = xp % 100;

  const xpTitle =
    xpLevel < 2
      ? "🌱 English Beginner"
      : xpLevel < 4
      ? "📘 English Learner"
      : xpLevel < 7
      ? "🚀 English Explorer"
      : xpLevel < 10
      ? "⭐ English Pro"
      : "🏆 English Master";

  const exerciseProgress = Math.min(
    100,
    Math.round(
      (exerciseScore / exercises[level].length) * 100
    )
  );

  const vocabularyProgress = Math.min(
    100,
    Math.round(
      (vocabularyScore / vocabulary.length) * 100
    )
  );

  const speakingProgress = Math.min(
    100,
    speakingAttempts * 20
  );

  const pronunciationProgress = Math.min(
    100,
    pronunciationAttempts * 20
  );

  const overallProgress = Math.round(
    (exerciseProgress +
      vocabularyProgress +
      speakingProgress +
      pronunciationProgress) /
      4
  );

  const exerciseAccuracy =
    exerciseAttempts === 0
      ? 0
      : Math.round(
          (exerciseCorrect / exerciseAttempts) * 100
        );

  const goalProgress = {
    exercises: Math.min(
      100,
      Math.round(
        (todayRecord.exercises / Math.max(goals.exercises, 1)) *
          100
      )
    ),
    vocabulary: Math.min(
      100,
      Math.round(
        (todayRecord.vocabulary /
          Math.max(goals.vocabulary, 1)) *
          100
      )
    ),
    speaking: Math.min(
      100,
      Math.round(
        (todayRecord.speaking /
          Math.max(goals.speaking, 1)) *
          100
      )
    ),
    pronunciation: Math.min(
      100,
      Math.round(
        (todayRecord.pronunciation /
          Math.max(goals.pronunciation, 1)) *
          100
      )
    ),
  };

  const goalOverall = Math.round(
    (goalProgress.exercises +
      goalProgress.vocabulary +
      goalProgress.speaking +
      goalProgress.pronunciation) /
      4
  );

  const weeklyRecords = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));

    const key = `${d.getFullYear()}-${String(
      d.getMonth() + 1
    ).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    return (
      history.find((record) => record.date === key) ??
      emptyRecord(key)
    );
  });

  const weeklyActivity = weeklyRecords.reduce(
    (sum, record) =>
      sum +
      record.exercises +
      record.vocabulary +
      record.speaking +
      record.pronunciation +
      record.reading +
      record.writing +
      record.listening +
      record.scenario +
      record.game,
    0
  );

  const weeklyXP = weeklyRecords.reduce(
    (sum, record) => sum + record.xp,
    0
  );

  const weeklyDays = weeklyRecords.filter(
    (record) =>
      record.exercises +
        record.vocabulary +
        record.speaking +
        record.pronunciation +
        record.reading +
        record.writing +
        record.listening +
        record.scenario +
        record.game >
      0
  ).length;

    useEffect(() => {
  if (!user) return;

  const loadProgress = async () => {
    let progressData: any = null;

    // 1. Try loading progress from Supabase
    const { data, error } = await supabase
      .from("learning_progress")
      .select("progress")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
  console.log("Cloud load error:", error.message);
}

// 2. If cloud progress exists, use it
if (data?.progress) {
  progressData = data.progress;

  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(progressData)
  );

  console.log("Cloud progress loaded successfully.");
} else {
  // 3. Otherwise use local progress
  const raw = await AsyncStorage.getItem(STORAGE_KEY);

  if (raw) {
    try {
      progressData = JSON.parse(raw);
      console.log("Local progress loaded.");
    } catch {
      console.log("Could not load saved progress.");
    }
  }
}

    // 4. Apply progress to the app
    if (progressData) {
      setLevel(progressData.level ?? "Beginner");
      setProfileName(
        progressData.profileName ?? "English Learner"
      );

      setMessages(
        progressData.messages ?? [
          "Tutor: Hello! 👋 I'm your LanguageTutor. Let's practice English!",
        ]
      );

      setLastTutorMessage(
        progressData.lastTutorMessage ??
          "Hello! 👋 I'm your LanguageTutor. Let's practice English!"
      );

      setExerciseIndex(progressData.exerciseIndex ?? 0);
      setExerciseScore(progressData.exerciseScore ?? 0);
      setExerciseAttempts(progressData.exerciseAttempts ?? 0);
      setExerciseCorrect(progressData.exerciseCorrect ?? 0);

      setVocabularyIndex(progressData.vocabularyIndex ?? 0);
      setVocabularyScore(progressData.vocabularyScore ?? 0);
      setVocabularyAttempts(progressData.vocabularyAttempts ?? 0);
      setVocabularyCorrect(progressData.vocabularyCorrect ?? 0);

      setDailyLearned(progressData.dailyLearned ?? false);

      setSpeakingAttempts(progressData.speakingAttempts ?? 0);
      setSpeakingSuccessful(
        progressData.speakingSuccessful ?? 0
      );

      setPronunciationIndex(
        progressData.pronunciationIndex ?? 0
      );

      setPronunciationAttempts(
        progressData.pronunciationAttempts ?? 0
      );

      setPronunciationResult(
        progressData.pronunciationResult ?? ""
      );

      setPronunciationFeedback(
        progressData.pronunciationFeedback ?? ""
      );

      setReadingIndex(progressData.readingIndex ?? 0);

      setWritingCount(progressData.writingCount ?? 0);

      setListeningIndex(progressData.listeningIndex ?? 0);

      setScenarioIndex(progressData.scenarioIndex ?? 0);

      setGameIndex(progressData.gameIndex ?? 0);
      setGameScore(progressData.gameScore ?? 0);

      setXp(progressData.xp ?? 0);

      setHistory(progressData.history ?? []);

      setGoals(
        progressData.goals ?? {
          exercises: 3,
          vocabulary: 3,
          speaking: 2,
          pronunciation: 2,
        }
      );

      setCurrentStreak(progressData.currentStreak ?? 0);
      setLongestStreak(progressData.longestStreak ?? 0);
      setLastActiveDate(
        progressData.lastActiveDate ?? ""
      );
    }

    // 5. Tell the app loading is finished
    setLoaded(true);
  };

  loadProgress();
}, [user]);

  useEffect(() => {
    if (!loaded) return;

    const todayDate = todayKey();

    if (lastActiveDate === todayDate) return;

    if (lastActiveDate === yesterdayKey()) {
      setCurrentStreak((value) => value + 1);
    } else {
      setCurrentStreak(1);
    }

    setLastActiveDate(todayDate);
  }, [loaded, lastActiveDate]);

  useEffect(() => {
    if (!loaded) return;

    setLongestStreak((value) =>
      Math.max(value, currentStreak)
    );
  }, [loaded, currentStreak]);

  useEffect(() => {
  if (!loaded) return;

  async function saveProgress() {
    const data = {
      level,
      profileName,
      messages,
      lastTutorMessage,
      exerciseIndex,
      exerciseScore,
      exerciseAttempts,
      exerciseCorrect,
      vocabularyIndex,
      vocabularyScore,
      vocabularyAttempts,
      vocabularyCorrect,
      dailyLearned,
      speakingAttempts,
      speakingSuccessful,
      pronunciationIndex,
      pronunciationAttempts,
      pronunciationResult,
      pronunciationFeedback,
      readingIndex,
      writingCount,
      listeningIndex,
      scenarioIndex,
      gameIndex,
      gameScore,
      xp,
      history,
      goals,
      currentStreak,
      longestStreak,
      lastActiveDate,
    };

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    );

    console.log("SAVE BUTTON CODE REACHED");
    saveProgressToSupabase();
    setSaved(true);

    const timer = setTimeout(
      () => setSaved(false),
      1200
    );

    return () => clearTimeout(timer);
  }

  saveProgress();
}, [
  loaded,
  level,
  profileName,
  messages,
  lastTutorMessage,
  exerciseIndex,
  exerciseScore,
  exerciseAttempts,
  exerciseCorrect,
  vocabularyIndex,
  vocabularyScore,
  vocabularyAttempts,
  vocabularyCorrect,
  dailyLearned,
  speakingAttempts,
  speakingSuccessful,
  pronunciationIndex,
  pronunciationAttempts,
  pronunciationResult,
  pronunciationFeedback,
  readingIndex,
  writingCount,
  listeningIndex,
  scenarioIndex,
  gameIndex,
  gameScore,
  xp,
  history,
  goals,
  currentStreak,
  longestStreak,
  lastActiveDate,
]);

  function updateToday(
    field: keyof DailyRecord,
    amount = 1
  ) {
    setHistory((previous) => {
      const date = todayKey();

      const existing =
        previous.find((record) => record.date === date) ??
        emptyRecord(date);

      const current = existing[field];

      const updated = {
        ...existing,
        [field]:
          typeof current === "number"
            ? current + amount
            : current,
      };

      return [
        ...previous.filter((record) => record.date !== date),
        updated,
      ].sort((a, b) =>
        a.date.localeCompare(b.date)
      );
    });
  }
  function getTotalActivity() {
  return history.reduce(
    (total, record) =>
      total +
      record.exercises +
      record.vocabulary +
      record.speaking +
      record.pronunciation +
      record.reading +
      record.writing +
      record.listening +
      record.scenario +
      record.game,
    0
  );
}

function getTotalXP() {
  return history.reduce(
    (total, record) => total + record.xp,
    0
  );
}
function getAchievementCount() {
  let count = 0;

  if (getTotalActivity() >= 10) count++;
  if (getTotalActivity() >= 50) count++;
  if (getActiveDays() >= 7) count++;
  if (getTotalXP() >= 500) count++;

  return count;
}
function getOverallAccuracy() {
  const totalAttempts = history.reduce(
    (sum, record) =>
      sum + record.exercises + record.vocabulary,
    0
  );

  const totalCorrect = history.reduce(
    (sum, record) =>
      sum +
      record.exerciseCorrect +
      record.vocabularyCorrect,
    0
  );

  if (totalAttempts === 0) return 0;

  return Math.round(
    (totalCorrect / totalAttempts) * 100
  );
}
function updatePersonalizedLessonPlan() {
  const accuracy = getOverallAccuracy();

  if (accuracy < 60) {
    setPersonalizedLesson("Foundation Practice");
  } else if (accuracy < 80) {
    setPersonalizedLesson("Skill Builder");
  } else {
    setPersonalizedLesson("Challenge Practice");
  }
}
useEffect(() => {
  updatePersonalizedLessonPlan();
}, [history]);
function updateDifficulty() {
  const accuracy = getOverallAccuracy();

  if (accuracy >= 85) {
    setDifficulty("Hard");
  } else if (accuracy >= 60) {
    setDifficulty("Medium");
  } else {
    setDifficulty("Easy");
  }
}
useEffect(() => {
  updateDifficulty();
}, [history]);

function getActiveDays() {
  
  return history.filter(
    (record) =>
      record.exercises +
      record.vocabulary +
      record.speaking +
      record.pronunciation +
      record.reading +
      record.writing +
      record.listening +
      record.scenario +
      record.game >
      0
  ).length;
}
function getBestDay() {
  if (history.length === 0) return "No activity yet";

  const best = history.reduce((currentBest, record) => {
    const activity =
      record.exercises +
      record.vocabulary +
      record.speaking +
      record.pronunciation +
      record.reading +
      record.writing +
      record.listening +
      record.scenario +
      record.game;

    const bestActivity =
      currentBest.exercises +
      currentBest.vocabulary +
      currentBest.speaking +
      currentBest.pronunciation +
      currentBest.reading +
      currentBest.writing +
      currentBest.listening +
      currentBest.scenario +
      currentBest.game;

    return activity > bestActivity ? record : currentBest;
  });

  return best.date;
}
function getBestDayActivity() {
  if (history.length === 0) return 0;

  return Math.max(
    ...history.map(
      (record) =>
        record.exercises +
        record.vocabulary +
        record.speaking +
        record.pronunciation +
        record.reading +
        record.writing +
        record.listening +
        record.scenario +
        record.game
    )
  );
}

  function addXP(amount: number) {
    const oldLevel = Math.floor(xp / 100) + 1;
    const newXP = xp + amount;
    const newLevel = Math.floor(newXP / 100) + 1;

    setXp(newXP);
    updateToday("xp", amount);

    if (newLevel > oldLevel) {
      setLevelMessage(
        `🎉 Level Up! You reached Level ${newLevel}!`
      );
    }
  }

 function speak(text: string) {
  if (!text.trim()) return;

  Speech.stop();

  const languageCodes: Record<string, string> = {
    English: "en-US",
    Hindi: "hi-IN",
    Kannada: "kn-IN",
    Tamil: "ta-IN",
    Telugu: "te-IN",
    Malayalam: "ml-IN",
    Spanish: "es-ES",
    French: "fr-FR",
    German: "de-DE",
    Japanese: "ja-JP",
  };

  Speech.speak(text, {
    language: languageCodes[selectedLanguage] ?? "en-US",
    rate: 0.9,
    pitch: 1,
  });
}

 function tutorReply(text: string) {
  const lower = text.toLowerCase();

  const replies: Record<string, Record<string, string>> = {
    English: {
      hello: `Hello! 👋 You're currently practicing ${tutorTopic}. Let's learn together!`,
      how: "I'm doing great! 😊 Let's continue practicing English together.",
      name: "I'm LanguageTutor, your English practice assistant.",
      help: "I can help you practice grammar, vocabulary, speaking, pronunciation, reading, writing, listening, and conversation.",
      grammar: `📚 Grammar practice! Since you're at the ${level} level, try writing one sentence using a correct verb.`,
      vocabulary: "🧠 Vocabulary practice! Tell me a new English word you learned, and I'll help you use it in a sentence.",
      pronunciation: "🗣️ Pronunciation practice! Say a sentence clearly and try to speak at a comfortable pace.",
      speaking: "🎤 Speaking practice! Tell me about your day in 2 or 3 sentences.",
      reading: "📖 Reading practice! Try reading a short English paragraph and tell me what you understood.",
      writing: "✍️ Writing practice! Write a few sentences about your favorite topic.",
      listening: "🎧 Listening practice! Listen carefully to English sentences and try to repeat the main idea.",
      thanks: "You're welcome! 😊 Keep practicing!",
      bye: "Goodbye! Keep practicing your English! 👋",
      fallback: "👍 Good attempt! Try using a short and simple English sentence.",
    },

    Hindi: {
      hello: `नमस्ते! 👋 आप अभी ${tutorTopic} का अभ्यास कर रहे हैं। आइए साथ में सीखते हैं!`,
      how: "मैं बहुत अच्छा हूँ! 😊 आइए हिंदी में अभ्यास जारी रखें।",
      name: "मैं LanguageTutor हूँ, आपका भाषा अभ्यास सहायक।",
      help: "मैं व्याकरण, शब्दावली, बोलने, उच्चारण, पढ़ने, लिखने, सुनने और बातचीत का अभ्यास कराने में मदद कर सकता हूँ।",
      grammar: `📚 व्याकरण अभ्यास! आप ${level} स्तर पर हैं। सही क्रिया का उपयोग करके एक वाक्य लिखने की कोशिश करें।`,
      vocabulary: "🧠 शब्दावली अभ्यास! आपने जो नया शब्द सीखा है, उसे बताइए और मैं उसे वाक्य में इस्तेमाल करने में मदद करूँगा।",
      pronunciation: "🗣️ उच्चारण अभ्यास! एक वाक्य स्पष्ट रूप से बोलें और आराम से बोलने की कोशिश करें।",
      speaking: "🎤 बोलने का अभ्यास! अपने दिन के बारे में 2 या 3 वाक्य बताइए।",
      reading: "📖 पढ़ने का अभ्यास! एक छोटा पैराग्राफ पढ़ें और बताइए कि आपने क्या समझा।",
      writing: "✍️ लिखने का अभ्यास! अपने पसंदीदा विषय के बारे में कुछ वाक्य लिखें।",
      listening: "🎧 सुनने का अभ्यास! ध्यान से सुनें और मुख्य बात दोहराने की कोशिश करें।",
      thanks: "आपका स्वागत है! 😊 अभ्यास करते रहें!",
      bye: "अलविदा! अपनी भाषा का अभ्यास करते रहें! 👋",
      fallback: "👍 अच्छा प्रयास! एक छोटा और सरल वाक्य बनाने की कोशिश करें।",
    },

    Kannada: {
      hello: `ನಮಸ್ಕಾರ! 👋 ನೀವು ಈಗ ${tutorTopic} ಅಭ್ಯಾಸ ಮಾಡುತ್ತಿದ್ದೀರಿ. ಒಟ್ಟಿಗೆ ಕಲಿಯೋಣ!`,
      how: "ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ! 😊 ಕನ್ನಡದಲ್ಲಿ ಅಭ್ಯಾಸವನ್ನು ಮುಂದುವರಿಸೋಣ.",
      name: "ನಾನು LanguageTutor, ನಿಮ್ಮ ಭಾಷಾ ಅಭ್ಯಾಸ ಸಹಾಯಕ.",
      help: "ವ್ಯಾಕರಣ, ಪದಸಂಪತ್ತು, ಮಾತನಾಡುವುದು, ಉಚ್ಚಾರಣೆ, ಓದುವುದು, ಬರೆಯುವುದು, ಕೇಳುವುದು ಮತ್ತು ಸಂಭಾಷಣೆಯ ಅಭ್ಯಾಸದಲ್ಲಿ ನಾನು ಸಹಾಯ ಮಾಡಬಹುದು.",
      grammar: `📚 ವ್ಯಾಕರಣ ಅಭ್ಯಾಸ! ನೀವು ${level} ಹಂತದಲ್ಲಿದ್ದೀರಿ. ಸರಿಯಾದ ಕ್ರಿಯಾಪದವನ್ನು ಬಳಸಿ ಒಂದು ವಾಕ್ಯ ಬರೆಯಲು ಪ್ರಯತ್ನಿಸಿ.`,
      vocabulary: "🧠 ಪದಸಂಪತ್ತಿನ ಅಭ್ಯಾಸ! ನೀವು ಕಲಿತ ಹೊಸ ಪದವನ್ನು ಹೇಳಿ. ಅದನ್ನು ವಾಕ್ಯದಲ್ಲಿ ಬಳಸಲು ನಾನು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.",
      pronunciation: "🗣️ ಉಚ್ಚಾರಣೆ ಅಭ್ಯಾಸ! ಒಂದು ವಾಕ್ಯವನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಮತ್ತು ನಿಧಾನವಾಗಿ ಹೇಳಲು ಪ್ರಯತ್ನಿಸಿ.",
      speaking: "🎤 ಮಾತನಾಡುವ ಅಭ್ಯಾಸ! ನಿಮ್ಮ ದಿನದ ಬಗ್ಗೆ 2 ಅಥವಾ 3 ವಾಕ್ಯಗಳಲ್ಲಿ ಹೇಳಿ.",
      reading: "📖 ಓದುವ ಅಭ್ಯಾಸ! ಒಂದು ಚಿಕ್ಕ ಪ್ಯಾರಾಗ್ರಾಫ್ ಓದಿ ಮತ್ತು ನಿಮಗೆ ಅರ್ಥವಾದುದನ್ನು ಹೇಳಿ.",
      writing: "✍️ ಬರವಣಿಗೆ ಅಭ್ಯಾಸ! ನಿಮ್ಮ ಮೆಚ್ಚಿನ ವಿಷಯದ ಬಗ್ಗೆ ಕೆಲವು ವಾಕ್ಯಗಳನ್ನು ಬರೆಯಿರಿ.",
      listening: "🎧 ಕೇಳುವ ಅಭ್ಯಾಸ! ಗಮನದಿಂದ ಕೇಳಿ ಮತ್ತು ಮುಖ್ಯ ವಿಷಯವನ್ನು ಪುನರಾವರ್ತಿಸಲು ಪ್ರಯತ್ನಿಸಿ.",
      thanks: "ಸ್ವಾಗತ! 😊 ಅಭ್ಯಾಸ ಮುಂದುವರಿಸಿ!",
      bye: "ವಿದಾಯ! ನಿಮ್ಮ ಭಾಷಾ ಅಭ್ಯಾಸವನ್ನು ಮುಂದುವರಿಸಿ! 👋",
      fallback: "👍 ಉತ್ತಮ ಪ್ರಯತ್ನ! ಒಂದು ಚಿಕ್ಕ ಮತ್ತು ಸರಳ ವಾಕ್ಯವನ್ನು ಬಳಸಲು ಪ್ರಯತ್ನಿಸಿ.",
    },

    Tamil: {
      hello: `வணக்கம்! 👋 நீங்கள் இப்போது ${tutorTopic} பயிற்சி செய்கிறீர்கள். ஒன்றாகக் கற்போம்!`,
      how: "நான் நன்றாக இருக்கிறேன்! 😊 தொடர்ந்து பயிற்சி செய்வோம்.",
      name: "நான் LanguageTutor, உங்கள் மொழிப் பயிற்சி உதவியாளர்.",
      help: "இலக்கணம், சொற்களஞ்சியம், பேசுதல், உச்சரிப்பு, வாசிப்பு, எழுதுதல், கேட்டல் மற்றும் உரையாடலில் நான் உதவ முடியும்.",
      grammar: `📚 இலக்கணப் பயிற்சி! நீங்கள் ${level} நிலையில் உள்ளீர்கள். சரியான வினைச்சொல்லைப் பயன்படுத்தி ஒரு வாக்கியம் எழுதுங்கள்.`,
      vocabulary: "🧠 சொற்களஞ்சியப் பயிற்சி! நீங்கள் கற்ற புதிய சொல்லைச் சொல்லுங்கள். அதை ஒரு வாக்கியத்தில் பயன்படுத்த உதவுகிறேன்.",
      pronunciation: "🗣️ உச்சரிப்புப் பயிற்சி! ஒரு வாக்கியத்தை தெளிவாகப் பேச முயற்சி செய்யுங்கள்.",
      speaking: "🎤 பேசும் பயிற்சி! உங்கள் நாளைப் பற்றி 2 அல்லது 3 வாக்கியங்களில் சொல்லுங்கள்.",
      reading: "📖 வாசிப்புப் பயிற்சி! ஒரு சிறிய பத்தியைப் படித்து நீங்கள் புரிந்ததைச் சொல்லுங்கள்.",
      writing: "✍️ எழுதும் பயிற்சி! உங்களுக்குப் பிடித்த தலைப்பைப் பற்றி சில வாக்கியங்கள் எழுதுங்கள்.",
      listening: "🎧 கேட்கும் பயிற்சி! கவனமாகக் கேட்டு முக்கிய கருத்தை மீண்டும் சொல்ல முயற்சி செய்யுங்கள்.",
      thanks: "வரவேற்கிறேன்! 😊 தொடர்ந்து பயிற்சி செய்யுங்கள்!",
      bye: "விடைபெறுகிறேன்! உங்கள் மொழிப் பயிற்சியைத் தொடருங்கள்! 👋",
      fallback: "👍 நல்ல முயற்சி! ஒரு சிறிய மற்றும் எளிய வாக்கியத்தைப் பயன்படுத்த முயற்சி செய்யுங்கள்.",
    },

    Telugu: {
      hello: `నమస్కారం! 👋 మీరు ప్రస్తుతం ${tutorTopic} సాధన చేస్తున్నారు. కలిసి నేర్చుకుందాం!`,
      how: "నేను బాగున్నాను! 😊 సాధన కొనసాగిద్దాం.",
      name: "నేను LanguageTutor, మీ భాషా సాధన సహాయకుడిని.",
      help: "వ్యాకరణం, పదజాలం, మాట్లాడటం, ఉచ్చారణ, చదవడం, రాయడం, వినడం మరియు సంభాషణలో నేను సహాయం చేయగలను.",
      grammar: `📚 వ్యాకరణ సాధన! మీరు ${level} స్థాయిలో ఉన్నారు. సరైన క్రియను ఉపయోగించి ఒక వాక్యం రాయండి.`,
      vocabulary: "🧠 పదజాల సాధన! మీరు నేర్చుకున్న కొత్త పదాన్ని చెప్పండి. దాన్ని వాక్యంలో ఉపయోగించడంలో సహాయం చేస్తాను.",
      pronunciation: "🗣️ ఉచ్చారణ సాధన! ఒక వాక్యాన్ని స్పష్టంగా మాట్లాడటానికి ప్రయత్నించండి.",
      speaking: "🎤 మాట్లాడే సాధన! మీ రోజు గురించి 2 లేదా 3 వాక్యాల్లో చెప్పండి.",
      reading: "📖 చదివే సాధన! ఒక చిన్న పేరాగ్రాఫ్ చదివి మీరు అర్థం చేసుకున్నదాన్ని చెప్పండి.",
      writing: "✍️ రాయడం సాధన! మీకు ఇష్టమైన విషయం గురించి కొన్ని వాక్యాలు రాయండి.",
      listening: "🎧 వినే సాధన! జాగ్రత్తగా విని ముఖ్యమైన విషయాన్ని చెప్పడానికి ప్రయత్నించండి.",
      thanks: "స్వాగతం! 😊 సాధన కొనసాగించండి!",
      bye: "వీడ్కోలు! మీ భాషా సాధనను కొనసాగించండి! 👋",
      fallback: "👍 మంచి ప్రయత్నం! చిన్న మరియు సరళమైన వాక్యాన్ని ఉపయోగించడానికి ప్రయత్నించండి.",
    },

    Malayalam: {
      hello: `നമസ്കാരം! 👋 നിങ്ങൾ ഇപ്പോൾ ${tutorTopic} പരിശീലിക്കുകയാണ്. നമുക്ക് ഒരുമിച്ച് പഠിക്കാം!`,
      how: "എനിക്ക് സുഖമാണ്! 😊 നമുക്ക് പരിശീലനം തുടരാം.",
      name: "ഞാൻ LanguageTutor, നിങ്ങളുടെ ഭാഷാ പരിശീലന സഹായി.",
      help: "വ്യാകരണം, പദസമ്പത്ത്, സംസാരിക്കൽ, ഉച്ചാരണം, വായന, എഴുത്ത്, കേൾവി, സംഭാഷണം എന്നിവയിൽ ഞാൻ സഹായിക്കാം.",
      grammar: `📚 വ്യാകരണ പരിശീലനം! നിങ്ങൾ ${level} ലെവലിലാണ്. ശരിയായ ക്രിയ ഉപയോഗിച്ച് ഒരു വാക്യം എഴുതാൻ ശ്രമിക്കുക.`,
      vocabulary: "🧠 പദസമ്പത്ത് പരിശീലനം! നിങ്ങൾ പഠിച്ച പുതിയ വാക്ക് പറയൂ. അത് ഒരു വാക്യത്തിൽ ഉപയോഗിക്കാൻ ഞാൻ സഹായിക്കാം.",
      pronunciation: "🗣️ ഉച്ചാരണ പരിശീലനം! ഒരു വാക്യം വ്യക്തമായി പറയാൻ ശ്രമിക്കുക.",
      speaking: "🎤 സംസാര പരിശീലനം! നിങ്ങളുടെ ദിവസത്തെക്കുറിച്ച് 2 അല്ലെങ്കിൽ 3 വാക്യങ്ങൾ പറയൂ.",
      reading: "📖 വായന പരിശീലനം! ഒരു ചെറിയ പാരഗ്രാഫ് വായിച്ച് നിങ്ങൾ മനസ്സിലാക്കിയതു പറയൂ.",
      writing: "✍️ എഴുത്ത് പരിശീലനം! നിങ്ങളുടെ ഇഷ്ടപ്പെട്ട വിഷയത്തെക്കുറിച്ച് കുറച്ച് വാക്യങ്ങൾ എഴുതൂ.",
      listening: "🎧 കേൾവി പരിശീലനം! ശ്രദ്ധിച്ച് കേട്ട് പ്രധാന ആശയം ആവർത്തിക്കാൻ ശ്രമിക്കുക.",
      thanks: "സ്വാഗതം! 😊 പരിശീലനം തുടരൂ!",
      bye: "വിട! നിങ്ങളുടെ ഭാഷാ പരിശീലനം തുടരൂ! 👋",
      fallback: "👍 നല്ല ശ്രമം! ഒരു ചെറിയ ലളിതമായ വാക്യം ഉപയോഗിക്കാൻ ശ്രമിക്കുക.",
    },

    Spanish: {
      hello: `¡Hola! 👋 Estás practicando ${tutorTopic}. ¡Aprendamos juntos!`,
      how: "¡Estoy muy bien! 😊 Sigamos practicando.",
      name: "Soy LanguageTutor, tu asistente de práctica de idiomas.",
      help: "Puedo ayudarte con gramática, vocabulario, conversación, pronunciación, lectura, escritura y comprensión auditiva.",
      grammar: `📚 ¡Práctica de gramática! Estás en el nivel ${level}. Intenta escribir una oración usando un verbo correcto.`,
      vocabulary: "🧠 ¡Práctica de vocabulario! Dime una palabra nueva y te ayudaré a usarla en una oración.",
      pronunciation: "🗣️ ¡Práctica de pronunciación! Di una oración claramente y a un ritmo cómodo.",
      speaking: "🎤 ¡Práctica oral! Cuéntame sobre tu día en 2 o 3 oraciones.",
      reading: "📖 ¡Práctica de lectura! Lee un párrafo corto y dime qué entendiste.",
      writing: "✍️ ¡Práctica de escritura! Escribe algunas oraciones sobre tu tema favorito.",
      listening: "🎧 ¡Práctica auditiva! Escucha atentamente e intenta repetir la idea principal.",
      thanks: "¡De nada! 😊 ¡Sigue practicando!",
      bye: "¡Adiós! ¡Sigue practicando! 👋",
      fallback: "👍 ¡Buen intento! Intenta usar una oración corta y sencilla.",
    },

    French: {
      hello: `Bonjour ! 👋 Tu pratiques actuellement ${tutorTopic}. Apprenons ensemble !`,
      how: "Je vais très bien ! 😊 Continuons à pratiquer.",
      name: "Je suis LanguageTutor, votre assistant de pratique linguistique.",
      help: "Je peux vous aider avec la grammaire, le vocabulaire, la conversation, la prononciation, la lecture, l'écriture et l'écoute.",
      grammar: `📚 Pratique de grammaire ! Vous êtes au niveau ${level}. Essayez d'écrire une phrase avec un verbe correct.`,
      vocabulary: "🧠 Pratique du vocabulaire ! Dites-moi un nouveau mot et je vous aiderai à l'utiliser dans une phrase.",
      pronunciation: "🗣️ Pratique de la prononciation ! Prononcez une phrase clairement et à un rythme confortable.",
      speaking: "🎤 Pratique orale ! Parlez-moi de votre journée en 2 ou 3 phrases.",
      reading: "📖 Pratique de lecture ! Lisez un court paragraphe et dites-moi ce que vous avez compris.",
      writing: "✍️ Pratique d'écriture ! Écrivez quelques phrases sur votre sujet préféré.",
      listening: "🎧 Pratique d'écoute ! Écoutez attentivement et essayez de répéter l'idée principale.",
      thanks: "Je vous en prie ! 😊 Continuez à pratiquer !",
      bye: "Au revoir ! Continuez à pratiquer ! 👋",
      fallback: "👍 Bon effort ! Essayez d'utiliser une phrase courte et simple.",
    },

    German: {
      hello: `Hallo! 👋 Du übst gerade ${tutorTopic}. Lass uns gemeinsam lernen!`,
      how: "Mir geht es sehr gut! 😊 Lass uns weiter üben.",
      name: "Ich bin LanguageTutor, dein Sprachlern-Assistent.",
      help: "Ich kann dir bei Grammatik, Wortschatz, Sprechen, Aussprache, Lesen, Schreiben, Hören und Konversation helfen.",
      grammar: `📚 Grammatikübung! Du bist auf dem Niveau ${level}. Versuche, einen Satz mit einem richtigen Verb zu schreiben.`,
      vocabulary: "🧠 Wortschatzübung! Nenne mir ein neues Wort und ich helfe dir, es in einem Satz zu verwenden.",
      pronunciation: "🗣️ Ausspracheübung! Sprich einen Satz deutlich und in einem angenehmen Tempo.",
      speaking: "🎤 Sprechübung! Erzähle mir in 2 oder 3 Sätzen von deinem Tag.",
      reading: "📖 Leseübung! Lies einen kurzen Absatz und erzähle mir, was du verstanden hast.",
      writing: "✍️ Schreibübung! Schreibe einige Sätze über dein Lieblingsthema.",
      listening: "🎧 Hörübung! Höre aufmerksam zu und versuche, die Hauptidee zu wiederholen.",
      thanks: "Gern geschehen! 😊 Übe weiter!",
      bye: "Auf Wiedersehen! Übe weiter! 👋",
      fallback: "👍 Guter Versuch! Versuche einen kurzen und einfachen Satz.",
    },

    Japanese: {
      hello: `こんにちは！👋 今は${tutorTopic}を練習しています。一緒に学びましょう！`,
      how: "元気です！😊 一緒に練習を続けましょう。",
      name: "私はLanguageTutorです。あなたの言語学習アシスタントです。",
      help: "文法、語彙、会話、発音、読解、作文、リスニングの練習をサポートできます。",
      grammar: `📚 文法練習です！現在のレベルは${level}です。正しい動詞を使って文を書いてみましょう。`,
      vocabulary: "🧠 語彙練習です！新しく覚えた言葉を教えてください。文で使う練習をしましょう。",
      pronunciation: "🗣️ 発音練習です！文をはっきり、ゆっくり話してみましょう。",
      speaking: "🎤 スピーキング練習です！今日のことを2〜3文で話してください。",
      reading: "📖 読解練習です！短い文章を読んで、理解したことを教えてください。",
      writing: "✍️ 作文練習です！好きなテーマについていくつか文を書いてみましょう。",
      listening: "🎧 リスニング練習です！よく聞いて、主な内容を繰り返してみましょう。",
      thanks: "どういたしまして！😊 練習を続けましょう！",
      bye: "さようなら！これからも練習を続けてください！👋",
      fallback: "👍 よくできました！短くて簡単な文を使ってみましょう。",
    },
  };

  const currentReplies =
    replies[selectedLanguage] || replies.English;

  if (
    lower.includes("hello") ||
    lower.includes("hi") ||
    lower.includes("hey")
  ) {
    return currentReplies.hello;
  }

  if (lower.includes("how are you")) {
    return currentReplies.how;
  }

  if (lower.includes("your name")) {
    return currentReplies.name;
  }

  if (
    lower.includes("what can you do") ||
    lower.includes("help me")
  ) {
    return currentReplies.help;
  }

  if (lower.includes("grammar")) {
    return currentReplies.grammar;
  }

  if (lower.includes("vocabulary")) {
    return currentReplies.vocabulary;
  }

  if (lower.includes("pronunciation")) {
    return currentReplies.pronunciation;
  }

  if (
    lower.includes("speaking") ||
    lower.includes("conversation")
  ) {
    return currentReplies.speaking;
  }

  if (lower.includes("reading")) {
    return currentReplies.reading;
  }

  if (lower.includes("writing")) {
    return currentReplies.writing;
  }

  if (lower.includes("listening")) {
    return currentReplies.listening;
  }

  if (lower.includes("thank")) {
    return currentReplies.thanks;
  }

  if (lower.includes("bye")) {
    return currentReplies.bye;
  }

  if (level === "Intermediate") {
    return selectedLanguage === "Hindi"
      ? "🌟 अच्छा प्रयास! अपने उत्तर में थोड़ा और विवरण जोड़ने की कोशिश करें।"
      : selectedLanguage === "Kannada"
      ? "🌟 ಉತ್ತಮ ಪ್ರಯತ್ನ! ನಿಮ್ಮ ಉತ್ತರಕ್ಕೆ ಸ್ವಲ್ಪ ಹೆಚ್ಚು ವಿವರವನ್ನು ಸೇರಿಸಲು ಪ್ರಯತ್ನಿಸಿ."
      : selectedLanguage === "Tamil"
      ? "🌟 நல்ல முயற்சி! உங்கள் பதிலில் இன்னும் கொஞ்சம் விவரங்களைச் சேர்க்க முயற்சி செய்யுங்கள்."
      : selectedLanguage === "Telugu"
      ? "🌟 మంచి ప్రయత్నం! మీ సమాధానంలో కొంచెం ఎక్కువ వివరాలను జోడించండి."
      : selectedLanguage === "Malayalam"
      ? "🌟 നല്ല ശ്രമം! നിങ്ങളുടെ ഉത്തരത്തിൽ കുറച്ച് കൂടുതൽ വിശദാംശങ്ങൾ ചേർക്കാൻ ശ്രമിക്കൂ."
      : selectedLanguage === "Spanish"
      ? "🌟 ¡Buen esfuerzo! Intenta añadir un poco más de detalle a tu respuesta."
      : selectedLanguage === "French"
      ? "🌟 Bon effort ! Essayez d'ajouter un peu plus de détails à votre réponse."
      : selectedLanguage === "German"
      ? "🌟 Gute Arbeit! Versuche, deiner Antwort etwas mehr Details hinzuzufügen."
      : selectedLanguage === "Japanese"
      ? "🌟 よくできました！答えにもう少し詳しい内容を加えてみましょう。"
      : "🌟 Good effort! Try adding a little more detail to your sentence.";
  }

  return currentReplies.fallback;
}

  async function sendMessage(text?: string) {
  const input = (text ?? message).trim();

  if (!input) return;

  setMessage("");

  const topic = input.toLowerCase();

  setTutorTopic(
    topic.includes("grammar")
      ? "Grammar"
      : topic.includes("vocabulary")
      ? "Vocabulary"
      : topic.includes("pronunciation")
      ? "Pronunciation"
      : topic.includes("speaking") ||
        topic.includes("conversation")
      ? "Speaking"
      : topic.includes("reading")
      ? "Reading"
      : topic.includes("writing")
      ? "Writing"
      : topic.includes("listening")
      ? "Listening"
      : "General English"
  );

  setMessages((previous) =>
    [...previous, `You: ${input}`].slice(-20)
  );

  updateToday("speaking");

  try {
    const response = await fetch(
      "http://10.45.156.238:11434/api/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3.2:latest",
          messages: [
            {
              role: "system",
              content: `You are LanguageTutor, a friendly language-learning tutor.
The user's selected language is ${selectedLanguage}.
Help the user practice that language with simple explanations,
natural conversations, and helpful corrections.
Keep replies clear and encouraging.`,
            },
            {
              role: "user",
              content: input,
            },
          ],
          stream: false,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Ollama request failed");
    }

    const data = await response.json();
    const reply = data.message.content;

    setMessages((previous) =>
      [...previous, `Tutor: ${reply}`].slice(-20)
    );

    setLastTutorMessage(reply);
  } catch (error) {
    const reply =
      "I couldn't connect to Ollama. Please check that Ollama is running.";

    setMessages((previous) =>
      [...previous, `Tutor: ${reply}`].slice(-20)
    );

    setLastTutorMessage(reply);
  }
}

  function checkExercise(option: string) {
    setExerciseAttempts((value) => value + 1);
    updateToday("exercises");

    if (option === currentExercise.answer) {
      setExerciseResult("✅ Correct!");
      setExerciseScore((value) => value + 1);
      setExerciseCorrect((value) => value + 1);
      updateToday("exerciseCorrect");
      addXP(10);
    } else {
      setExerciseResult(
        `❌ Correct answer: ${currentExercise.answer}`
      );
      addXP(2);
    }
  }

  function nextExercise() {
  setExerciseIndex(
    (value) =>
      (value + 1) %
      (translatedExercises[selectedLanguage]?.[level]?.length ??
        exercises[level].length)
  );
  setExerciseResult("");
}

  function checkVocabulary(option: string) {
    setVocabularyAttempts((value) => value + 1);
    updateToday("vocabulary");

    if (option === currentWord.answer) {
      setVocabularyResult("✅ Correct!");
      setVocabularyScore((value) => value + 1);
      setVocabularyCorrect((value) => value + 1);
      updateToday("vocabularyCorrect");
      addXP(10);
    } else {
      setVocabularyResult(
        `❌ Correct answer: ${currentWord.answer}`
      );
      addXP(2);
    }
  }

  function nextVocabulary() {
    setVocabularyIndex(
      (value) => (value + 1) % vocabulary.length
    );
    setVocabularyResult("");
  }

  function checkDaily(option: string) {
    if (option === dailyWord.answer) {
      setDailyResult("✅ Correct! Great job!");
      addXP(5);
    } else {
      setDailyResult(
        `❌ Correct answer: ${dailyWord.answer}`
      );
    }
  }

  function markDailyLearned() {
    if (dailyLearned) return;

    setDailyLearned(true);

    setHistory((previous) => {
      const date = todayKey();

      const existing =
        previous.find((record) => record.date === date) ??
        emptyRecord(date);

      return [
        ...previous.filter((record) => record.date !== date),
        {
          ...existing,
          dailyWord: true,
        },
      ];
    });

    addXP(5);
  }

function startSpeaking() {
  if (Platform.OS === "web") {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported.");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang =
        speechLanguageCodes[selectedLanguage] || "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    setSpeechMode("speaking");
    setIsListening(true);
    setMessage("");

    recognition.onresult = (event: any) => {
      const transcript =
        event.results[0][0].transcript;

      void sendMessage(transcript);
      setSpeakingAttempts((value) => value + 1);

      updateToday("speaking");

      if (transcript.trim().split(/\s+/).length >= 3) {
        setSpeakingSuccessful((value) => value + 1);
        updateToday("speakingSuccessful");
      }

      addXP(5);
    };

    recognition.onerror = () => {
      setIsListening(false);
      alert("Could not hear your voice. Please try again.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    return;
  }

  async function startNativeSpeaking() {
    try {
      const permission =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();

      if (!permission.granted) {
        setIsListening(false);
        alert(
          "Microphone permission is required for Speaking Practice."
        );
        return;
      }
      setSpeechMode("speaking");
      setIsListening(true);
      setMessage("");

      ExpoSpeechRecognitionModule.start({
      lang:
        speechLanguageCodes[selectedLanguage] || "en-US",
        interimResults: false,
        continuous: false,
});

    } catch (error) {
      console.log("Speaking recognition error:", error);
      setIsListening(false);
      alert("Could not start the microphone.");
    }
  }

  startNativeSpeaking();
}

useSpeechRecognitionEvent("result", (event) => {
  if (Platform.OS === "web") return;

  const transcript = event.results?.[0]?.transcript ?? "";

  if (!transcript.trim()) return;

  if (speechMode === "pronunciation") {
    const target =
      currentPronunciationSentences[pronunciationIndex] ||
      pronunciationSentences[0];

    checkPronunciation(transcript, target.sentence);
    setSpeechMode(null);
    setPronunciationListening(false);
    setIsListening(false);

    return;
  }

  if (speechMode === "speaking") {
    setIsListening(false);
    setSpeechMode(null);

    setMessage(transcript);

    setSpeakingAttempts((previous) => previous + 1);
    updateToday("speaking");

    const wordCount = transcript.trim().split(/\s+/).length;

    if (wordCount >= 3) {
      setSpeakingSuccessful((previous) => previous + 1);
      addXP(5);
    } else {
      addXP(2);
    }

    sendMessage(transcript);

    return;
  }
});

useSpeechRecognitionEvent("end", () => {
  if (Platform.OS === "web") return;

  setIsListening(false);
  setPronunciationListening(false);
  setSpeechMode(null);
});

useSpeechRecognitionEvent("error", (event) => {
  if (Platform.OS === "web") return;

  setIsListening(false);
  setPronunciationListening(false);
  setSpeechMode(null);

  alert("Could not hear your voice. Please try again.");
});

function checkPronunciation(
  transcript: string,
  target: string
) {
  setPronunciationResult(transcript);
  setPronunciationAttempts((value) => value + 1);

  updateToday("pronunciation");
  addXP(5);

  const targetWords = normalize(target).split(" ");
  const spokenWords = normalize(transcript).split(" ");

  const matched = targetWords.filter((word) =>
    spokenWords.includes(word)
  ).length;

  const percentage =
    targetWords.length > 0
      ? Math.round((matched / targetWords.length) * 100)
      : 0;

  setPronunciationScore(percentage);

  if (percentage >= 80) {
    setPronunciationFeedback(
      "🌟 Excellent! Your pronunciation is very close."
    );
  } else if (percentage >= 50) {
    setPronunciationFeedback(
      "👍 Good effort! Try speaking a little more slowly."
    );
  } else {
    setPronunciationFeedback(
      "💪 Keep practicing. Listen to the sentence and try again."
    );
  }

  setPronunciationListening(false);

  if (Platform.OS !== "web") {
    ExpoSpeechRecognitionModule.stop();
  }
}

function startPronunciation() {
  const target =
    currentPronunciationSentences[pronunciationIndex].sentence;

  if (Platform.OS === "web") {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported.");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = speechLanguageCodes[selectedLanguage]|| "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    setSpeechMode("pronunciation");
    setPronunciationListening(true);
    setPronunciationResult("");
    setPronunciationFeedback("");

    recognition.onresult = (event: any) => {
      const transcript =
        event.results[0][0].transcript;

      if (transcript) {
        checkPronunciation(transcript, target);
      }
    };

    recognition.onerror = () => {
      setPronunciationListening(false);
      alert("Could not hear your voice. Please try again.");
    };

    recognition.onend = () => {
      setPronunciationListening(false);
    };

    recognition.start();
    return;
  }

  async function startNativeRecognition() {
    try {
      const permission =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();

      if (!permission.granted) {
        setPronunciationListening(false);
        alert(
          "Microphone permission is required for pronunciation practice."
        );
        return;
      }

      setSpeechMode("pronunciation");
      setPronunciationListening(true);
      setPronunciationResult("");
      setPronunciationFeedback("");
      setPronunciationScore(0);

      ExpoSpeechRecognitionModule.start({
       lang:
    speechLanguageCodes[selectedLanguage] || "en-US",
     interimResults: false,
  continuous: false,
    });
    } catch (error) {
      console.log("Speech recognition error:", error);
      setPronunciationListening(false);
      alert("Could not start the microphone.");
    }
  }

  startNativeRecognition();
}

  function nextPronunciation() {
    setPronunciationIndex(
      (value) =>
        (value + 1) % currentPronunciationSentences.length
    );

    setPronunciationResult("");
    setPronunciationFeedback("");
    setPronunciationScore(0);
  }

  function checkReading(option: string) {
    updateToday("reading");

    if (option === readingTexts[readingIndex].answer) {
      setReadingResult("✅ Correct!");
      addXP(10);
    } else {
      setReadingResult("❌ Try again!");
      addXP(2);
    }
  }

  function nextReading() {
    setReadingIndex(
      (value) => (value + 1) % readingTexts.length
    );
    setReadingResult("");
  }

  function checkWriting() {
    const text = writingText.trim();

    if (!text) {
      setWritingFeedback("Please write a sentence first.");
      return;
    }

    setWritingCount((value) => value + 1);
    updateToday("writing");
    addXP(5);

    const words = text.split(/\s+/).length;

    if (words < 5) {
      setWritingFeedback(
        "💡 Try writing at least 5 words."
      );
    } else if (!/[.!?]$/.test(text)) {
      setWritingFeedback(
        "👍 Good sentence. Remember punctuation at the end."
      );
    } else {
      setWritingFeedback(
        "🌟 Nice writing! Your sentence has good structure."
      );
    }
  }

 function checkListening(option: string) {
  updateToday("listening");

  if (
    option === listeningTexts[listeningIndex].answer
  ) {
    setListeningResult("✅ Correct!");
    addXP(10);
  } else {
    setListeningResult("❌ Try again!");
    addXP(2);
  }
}

function playListening() {
  speak(listeningTexts[listeningIndex].sentence);
}

function nextListening() {
  setListeningIndex(
    (value) => (value + 1) % listeningTexts.length
  );
  setListeningResult("");
}

function useScenario(text: string) {
  const reply = scenarios[scenarioIndex].tutor;

  setMessages((previous) => [
    ...previous,
    `You: ${text}`,
    `Tutor: ${reply}`,
  ]);

  setLastTutorMessage(reply);
  updateToday("scenario");
  addXP(5);
}

function nextScenario() {
  setScenarioIndex(
    (value) => (value + 1) % scenarios.length
  );
}

  function playGame() {
    if (gameResult) return;

    const answer = gameWords[gameIndex][1];

    setGameResult(answer);
    setGameScore((value) => value + 1);

    updateToday("game");
    addXP(10);
  }

  function nextGame() {
    setGameIndex(
      (value) => (value + 1) % gameWords.length
    );
    setGameResult("");
  }

  function updateGoal(
    key: keyof Goals,
    value: number
  ) {
    setGoals((previous) => ({
      ...previous,
      [key]: Math.max(1, Math.min(50, value || 1)),
    }));
  }

  function updatePersonalizedLesson() {
    if (pronunciationAttempts < 2) {
      setLesson({
        title: "🧠 Personalized Lesson: Pronunciation",
        description:
          "Your next lesson focuses on speaking clearly and confidently.",
        activity:
          "Practice the current pronunciation sentence twice.",
        tip:
          "Listen first, then speak slowly and clearly.",
      });
      return;
    }

    if (speakingAttempts < 2) {
  setLesson({
    title: `🧠 Personalized Lesson: ${selectedLanguage} Speaking`,
    description:
      `Your next lesson focuses on building speaking confidence in ${selectedLanguage}.`,
    activity:
      `Use Speaking Practice and say at least three sentences in ${selectedLanguage}.`,
    tip:
      `Focus on communicating naturally in ${selectedLanguage}. Small mistakes are okay.`,
  });
  return;
}

if (exerciseAccuracy < 70) {
  setLesson({
    title: `🧠 Personalized Lesson: ${selectedLanguage} Grammar`,
    description:
      `Your practice should focus on grammar accuracy in ${selectedLanguage}.`,
    activity:
      `Complete three grammar exercises in ${selectedLanguage} carefully.`,
    tip:
      `Read the entire sentence before choosing an answer.`,
  });
  return;
}

setLesson({
  title: `🧠 Personalized Lesson: ${selectedLanguage} Vocabulary`,
  description:
    `Your current progress is ready for vocabulary expansion in ${selectedLanguage}.`,
  activity:
    `Learn three new ${selectedLanguage} vocabulary words and use each in a sentence.`,
  tip:
    `Try using new ${selectedLanguage} words in your conversations.`,
}); 
  }

  const saveProgressToSupabase = async () => {
  if (!user) {
    setSyncStatus("Not synced");
    return;
  }

  const data = await AsyncStorage.getItem(STORAGE_KEY);

  if (!data) return;

  setSyncStatus("Syncing...");

  try {
    const { error } = await supabase
      .from("learning_progress")
      .upsert({
        user_id: user.id,
        progress: JSON.parse(data),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.log("Cloud save error:", error.message);
      setSyncStatus("Sync failed");
      return;
    }

    setSyncStatus("Synced ✓");
  } catch (error) {
    console.log("Cloud save error:", error);
    setSyncStatus("Sync failed");
  }
};

  async function resetProgress() {
  alert("Progress reset.");

  await AsyncStorage.removeItem(STORAGE_KEY);
}
 if (!user) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#f5f3ff",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 420,
          alignSelf: "center",
          backgroundColor: "#e9d5ff",
          padding: 30,
          borderRadius: 22,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 5,
        }}
      >
        <Text
          style={{
            textAlign: "center",
            color: "#4f46e5",
            fontSize: 30,
            fontWeight: "bold",
            marginBottom: 10,
          }}
        >
          🌐 LanguageTutor
        </Text>

        <Text
          style={{
            textAlign: "center",
            color: "#475569",
            fontSize: 16,
            marginBottom: 12,
          }}
        >
          Choose your learning language
        </Text>

        <View
          style={{
            backgroundColor: "white",
            borderRadius: 12,
            borderWidth: 1.5,
            borderColor: "#c7d2fe",
            marginBottom: 18,
            overflow: "hidden",
          }}
        >
          <Pressable
  onPress={() => {
    const currentIndex = languages.indexOf(selectedLanguage);
    const nextLanguage =
      languages[(currentIndex + 1) % languages.length] as keyof typeof readingTextsByLanguage;

    setSelectedLanguage(nextLanguage);

    const welcome =
      welcomeMessages[nextLanguage] || welcomeMessages.English;

    setMessages((previous) =>
      previous.map((msg, index) =>
        index === 0 ? `Tutor: ${welcome}` : msg
      )
    );

    setLastTutorMessage(welcome);
  }}
  style={{
    padding: 14,
    backgroundColor: "white",
  }}
>
  <Text
    style={{
      fontSize: 16,
      color: selectedLanguage ? "#1e293b" : "#64748b",
      textAlign: "center",
    }}
  >
    {selectedLanguage
      ? `🌍 ${selectedLanguage}`
      : "🌍 Select a language"}
  </Text>
</Pressable>
        </View>

        <Text
          style={{
            textAlign: "center",
            color: "#475569",
            fontSize: 15,
            marginBottom: 15,
          }}
        >
          Sign in to save and sync your learning progress.
        </Text>

        <TextInput
          value={authEmail}
          onChangeText={setAuthEmail}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 12,
            borderWidth: 1.5,
            borderColor: "#c7d2fe",
            borderRadius: 12,
            backgroundColor: "white",
            boxSizing: "border-box",
          }}
        />

        <TextInput
          value={authPassword}
          onChangeText={setAuthPassword}
          placeholder="Password"
          secureTextEntry
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 12,
            borderWidth: 1.5,
            borderColor: "#c7d2fe",
            borderRadius: 12,
            backgroundColor: "#ffffff",
            color:"#111827",
            boxSizing: "border-box",
          }}
        />

        <Pressable
          onPress={signIn}
          disabled={authLoading || !selectedLanguage}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 12,
            backgroundColor:
              authLoading || !selectedLanguage ? "#cbd5e1" : "#4f46e5",
            marginBottom: 10,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "white",
              fontWeight: "bold",
              fontSize: 16,
            }}
          >
            {authLoading ? "Please wait..." : "🔐 Sign In"}
          </Text>
        </Pressable>

        <Pressable
          onPress={signUp}
          disabled={authLoading || !selectedLanguage}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 12,
            backgroundColor:
              authLoading || !selectedLanguage ? "#cbd5e1" : "#7c3aed",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "white",
              fontWeight: "bold",
              fontSize: 16,
            }}
          >
            📝 Create Account
          </Text>
        </Pressable>

        {!selectedLanguage && (
          <Text
            style={{
              marginTop: 12,
              textAlign: "center",
              color: "#64748b",
              fontSize: 14,
            }}
          >
            Please select a language first.
          </Text>
        )}

        {authMessage && (
          <Text
            style={{
              marginTop: 15,
              textAlign: "center",
              color: "#475569",
            }}
          >
            {authMessage}
          </Text>
        )}
      </View>
    </View>
  );
}
   
    return (
  <ScrollView
    style={{ flex: 1, backgroundColor: "#f5f7ff" }}
    contentContainerStyle={{
      padding: 15,
      paddingBottom: 40,
    }}
  >
    <Text
      style={{
        textAlign: "center",
        color: "#4f46e5",
        fontSize: 32,
        fontWeight: "700",
        marginBottom: 6,
      }}
    >
      🌐 LanguageTutor
    </Text>

    <Text
      style={{
        textAlign: "center",
        color: "#64748b",
        fontSize: 16,
        marginBottom: 24,
      }}
    >
      Your complete English learning companion 🚀
    </Text>

    {levelMessage && (
      <Card>
        <View
          style={{
            backgroundColor: "#fef3c7",
            padding: 15,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontWeight: "700",
              textAlign: "center",
              marginBottom: 10,
            }}
          >
            {levelMessage}
          </Text>

          <Pressable
            style={{
              backgroundColor: "#4f46e5",
              padding: 12,
              borderRadius: 10,
            }}
            onPress={() => setLevelMessage("")}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              Continue
            </Text>
          </Pressable>
        </View>
      </Card>
    )}

    <Card>
      <Text
        style={{
          color: "#4f46e5",
          fontSize: 22,
          fontWeight: "700",
          marginBottom: 12,
        }}
      >
        👤 Profile
      </Text>

      <TextInput
        value={profileName}
        onChangeText={setProfileName}
        placeholder="Your name"
        style={{
          width: "100%",
          padding: 12,
          borderWidth: 1.5,
          borderColor: "#c7d2fe",
          borderRadius: 12,
          marginBottom: 10,
        }}
      />

      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          marginBottom: 5,
        }}
      >
        {profileName}
      </Text>

      <Text style={{ marginBottom: 5 }}>{xpTitle}</Text>

      <Text style={{ fontWeight: "700", marginBottom: 8 }}>
        Level {xpLevel} — {xpInLevel}/100 XP
      </Text>

      <ProgressBar value={xpInLevel} />
    </Card>

    <Card>
      <Text
        style={{
          color: "#f59e0b",
          fontSize: 22,
          fontWeight: "700",
          marginBottom: 12,
        }}
      >
        🔥 Daily Streak
      </Text>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <StatCard
            icon="🔥"
            title="Current Streak"
            value={`${currentStreak} days`}
          />
        </View>

        <View style={{ flex: 1 }}>
          <StatCard
            icon="🏆"
            title="Longest Streak"
            value={`${longestStreak} days`}
          />
        </View>
      </View>
    </Card>

    <Card>
      <Text
        style={{
          color: "#7c3aed",
          fontSize: 22,
          fontWeight: "700",
          marginBottom: 12,
        }}
      >
        🏅 Achievements
      </Text>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {[
          exerciseScore >= 1 && "📝 First Exercise",
          vocabularyScore >= 1 && "📚 First Vocabulary",
          speakingAttempts >= 1 && "🎤 First Speaking",
          pronunciationAttempts >= 1 &&
            "🗣️ First Pronunciation",
          readingIndex > 0 && "📖 Reader",
          writingCount >= 1 && "✍️ Writer",
          listeningIndex > 0 && "🎧 Listener",
          gameScore >= 1 && "🎮 Gamer",
          xp >= 100 && "⭐ 100 XP",
          currentStreak >= 3 && "🔥 3-Day Streak",
          overallProgress >= 50 && "🌟 Explorer",
          overallProgress >= 80 && "🏆 English Star",
        ]
          .filter(Boolean)
          .map((badge) => (
            <View
              key={String(badge)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 20,
                backgroundColor: "#ede9fe",
                borderWidth: 1,
                borderColor: "#ddd6fe",
              }}
            >
              <Text>{String(badge)}</Text>
            </View>
          ))}
      </View>
    </Card>

    <Card>
      <Text
        style={{
          color: "#2563eb",
          fontSize: 22,
          fontWeight: "700",
          marginBottom: 12,
        }}
      >
        🧠 Personalized Lesson
      </Text>

      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          marginBottom: 8,
        }}
      >
        {lesson.title}
      </Text>

      <Text style={{ marginBottom: 12 }}>
        {lesson.description}
      </Text>

      <View
        style={{
          backgroundColor: "#eff6ff",
          padding: 15,
          borderRadius: 12,
          marginBottom: 12,
        }}
      >
        <Text style={{ fontWeight: "700" }}>
          Today's Activity:
        </Text>

        <Text style={{ marginTop: 5, marginBottom: 12 }}>
          {lesson.activity}
        </Text>

        <Text style={{ fontWeight: "700" }}>
          💡 Tip:
        </Text>

        <Text style={{ marginTop: 5 }}>
          {lesson.tip}
        </Text>
      </View>

      <Pressable
        style={{
          backgroundColor: "#4f46e5",
          padding: 12,
          borderRadius: 10,
          alignItems: "center",
        }}
        onPress={() =>updatePersonalizedLesson()}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          🔄 Personalize My Lesson
        </Text>
      </Pressable>
    </Card>

    <Card>
      <Text
        style={{
          color: "#4f46e5",
          fontSize: 22,
          fontWeight: "700",
          marginBottom: 12,
        }}
      >
        📅 Word of the Day
      </Text>

      <Text
        style={{
          fontSize: 22,
          fontWeight: "700",
          marginBottom: 8,
        }}
      >
        {dailyWord.word}
      </Text>

      <Text style={{ marginBottom: 8 }}>
        <Text style={{ fontWeight: "700" }}>
          Meaning:
        </Text>{" "}
        {dailyWord.meaning}
      </Text>

      <Text style={{ marginBottom: 12 }}>
        <Text style={{ fontWeight: "700" }}>
          Example:
        </Text>{" "}
        {dailyWord.example}
      </Text>

      <Pressable
        style={{
          backgroundColor: "#4f46e5",
          padding: 12,
          borderRadius: 10,
          alignItems: "center",
          marginBottom: 12,
        }}
        onPress={() => speak(dailyWord.word)}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          🔊 Hear Word
        </Text>
      </Pressable>

      <Text
        style={{
          fontSize: 18,
          fontWeight: "700",
          marginBottom: 8,
        }}
      >
        Quick Quiz
      </Text>

      {dailyOptions.map((option) => (
        <Pressable
          key={option}
          style={{
            backgroundColor: "#eef2ff",
            padding: 12,
            borderRadius: 10,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: "#c7d2fe",
          }}
          onPress={() => checkDaily(option)}
        >
          <Text>{option}</Text>
        </Pressable>
      ))}

      <Text style={{ marginVertical: 8 }}>
        {dailyResult}
      </Text>

      <Pressable
        style={{
          backgroundColor: "#4f46e5",
          padding: 12,
          borderRadius: 10,
          alignItems: "center",
        }}
        onPress={markDailyLearned}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          {dailyLearned
            ? "✅ Learned"
            : "📖 Mark as Learned"}
        </Text>
      </Pressable>
    </Card>

    <Card>
      <Text
        style={{
          color: "#2563eb",
          fontSize: 22,
          fontWeight: "700",
          marginBottom: 12,
        }}
      >
        📊 Progress Dashboard
      </Text>

      <Text>📝 Exercises — {exerciseProgress}%</Text>
      <ProgressBar value={exerciseProgress} />

      <Text>📚 Vocabulary — {vocabularyProgress}%</Text>
      <ProgressBar value={vocabularyProgress} />

      <Text>🎤 Speaking — {speakingProgress}%</Text>
      <ProgressBar value={speakingProgress} />

      <Text>
        🗣️ Pronunciation — {pronunciationProgress}%
      </Text>
      <ProgressBar value={pronunciationProgress} />

      <Text
        style={{
          fontSize: 18,
          fontWeight: "700",
          marginTop: 8,
        }}
      >
        Overall Progress: {overallProgress}%
      </Text>

      <ProgressBar value={overallProgress} />
    </Card>

    <Card>
      <Text
        style={{
          color: "#7c3aed",
          fontSize: 22,
          fontWeight: "700",
          marginBottom: 12,
        }}
      >
        📈 Learning Statistics
      </Text>

      <View
        style={{
          backgroundColor: "#f8fafc",
          padding: 12,
          borderRadius: 12,
          marginBottom: 15,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            marginBottom: 10,
          }}
        >
          📅 Weekly Activity
        </Text>

        <Text style={{ marginBottom: 5 }}>
          📝 Exercises:{" "}
          <Text style={{ fontWeight: "700" }}>
            {exerciseAttempts}
          </Text>
        </Text>

        <Text style={{ marginBottom: 5 }}>
          📚 Vocabulary:{" "}
          <Text style={{ fontWeight: "700" }}>
            {vocabularyScore}
          </Text>
        </Text>

        <Text style={{ marginBottom: 5 }}>
          🎤 Speaking:{" "}
          <Text style={{ fontWeight: "700" }}>
            {speakingAttempts}
          </Text>
        </Text>

        <Text style={{ marginBottom: 5 }}>
          🗣️ Pronunciation:{" "}
          <Text style={{ fontWeight: "700" }}>
            {pronunciationAttempts}
          </Text>
        </Text>

        <Text style={{ marginBottom: 5 }}>
          📖 Reading:{" "}
          <Text style={{ fontWeight: "700" }}>
            {history.reduce(
              (sum, r) => sum + r.reading,
              0
            )}
          </Text>
        </Text>

        <Text style={{ marginBottom: 5 }}>
          ✍️ Writing:{" "}
          <Text style={{ fontWeight: "700" }}>
            {history.reduce(
              (sum, r) => sum + r.writing,
              0
            )}
          </Text>
        </Text>

        <Text style={{ marginBottom: 5 }}>
          🎧 Listening:{" "}
          <Text style={{ fontWeight: "700" }}>
            {history.reduce(
              (sum, r) => sum + r.listening,
              0
            )}
          </Text>
        </Text>

        <Text
          style={{
            marginTop: 15,
            fontWeight: "700",
          }}
        >
          📊 Overall Progress
        </Text>

        <ProgressBar
          value={Math.min(
            getTotalActivity() * 2,
            100
          )}
        />

        <Text style={{ color: "#64748b" }}>
          {Math.min(
            getTotalActivity() * 2,
            100
          )}
          % activity progress
        </Text>

        <Text
          style={{
            marginTop: 15,
            fontWeight: "700",
          }}
        >
          🎯 Weekly Goal
        </Text>

        <Text style={{ marginBottom: 8 }}>
          {Math.min(getTotalActivity(), 50)} / 50 activities
        </Text>

        <ProgressBar
          value={Math.min(
            (getTotalActivity() / 50) * 100,
            100
          )}
        />

        <Text style={{ marginTop: 12 }}>
          🧠 Current Difficulty:{" "}
          <Text style={{ fontWeight: "700" }}>
            {difficulty}
          </Text>
        </Text>

        <Text style={{ marginTop: 8 }}>
          🎯 Personalized Lesson:{" "}
          <Text style={{ fontWeight: "700" }}>
            {personalizedLesson}
          </Text>
        </Text>

        <Text style={{ marginTop: 8 }}>
          🏆 Achievements Unlocked:{" "}
          <Text style={{ fontWeight: "700" }}>
            {getAchievementCount()}
          </Text>
        </Text>

        <Text
          style={{
            marginTop: 15,
            fontWeight: "700",
          }}
        >
          🏅 Milestones
        </Text>

        <Text style={{ marginTop: 6 }}>
          {getTotalActivity() >= 10 ? "✅" : "🔒"} First 10 Activities
        </Text>

        <Text style={{ marginTop: 6 }}>
          {getTotalActivity() >= 50 ? "✅" : "🔒"} 50 Activities
        </Text>

        <Text style={{ marginTop: 6 }}>
          {getActiveDays() >= 7 ? "✅" : "🔒"} 7-Day Learner
        </Text>

        <Text style={{ marginTop: 6 }}>
          {getTotalXP() >= 500 ? "✅" : "🔒"} 500 XP
        </Text>

        <Text style={{ marginTop: 6 }}>
          {vocabularyScore >= 20 ? "✅" : "🔒"} Vocabulary Explorer
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        <StatCard
          icon="📝"
          title="Exercise Attempts"
          value={exerciseAttempts}
        />

        <StatCard
          icon="🎯"
          title="Exercise Accuracy"
          value={`${exerciseAccuracy}%`}
        />

        <StatCard
          icon="📚"
          title="Vocabulary"
          value={vocabularyScore}
        />

        <StatCard
          icon="🎤"
          title="Speaking"
          value={speakingAttempts}
        />

        <StatCard
          icon="🗣️"
          title="Pronunciation"
          value={pronunciationAttempts}
        />

        <StatCard
          icon="⭐"
          title="Total XP"
          value={xp}
        />

        <StatCard
          icon="📊"
          title="Total Activity"
          value={getTotalActivity()}
        />

        <StatCard
          icon="⚡"
          title="History XP"
          value={getTotalXP()}
        />
      </View>
    </Card>

    <Card>
      <Text
        style={{
          color: "#2563eb",
          fontSize: 22,
          fontWeight: "700",
          marginBottom: 12,
        }}
      >
        📅 Weekly Learning Report
      </Text>

      <StatCard
        icon="📆"
        title="Days Learned"
        value={`${weeklyDays}/7`}
      />

      <StatCard
        icon="📊"
        title="Activities"
        value={weeklyActivity}
      />

      <StatCard
        icon="⭐"
        title="XP This Week"
        value={weeklyXP}
      />

      <Text
        style={{
          fontSize: 18,
          fontWeight: "700",
          marginVertical: 12,
        }}
      >
        Weekly Activity
      </Text>

      <View
        style={{
          backgroundColor: "#eff6ff",
          padding: 10,
          borderRadius: 12,
        }}
      >
        {weeklyRecords.map((record) => {
          const activity =
            record.exercises +
            record.vocabulary +
            record.speaking +
            record.pronunciation +
            record.reading +
            record.writing +
            record.listening +
            record.scenario +
            record.game;

          const height = Math.min(
            Math.max(activity * 12, 6),
            100
          );

          return (
            <View
              key={record.date}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  width: 90,
                  fontSize: 12,
                }}
              >
                {new Date(
                  `${record.date}T12:00:00`
                ).toLocaleDateString("en-US", {
                  weekday: "short",
                })}
              </Text>

              <View
                style={{
                  flex: 1,
                  height: 12,
                  backgroundColor: "#dbeafe",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: `${height}%`,
                    height: "100%",
                    backgroundColor: "#3b82f6",
                  }}
                />
              </View>
            </View>
          );
        })}
      </View>

      <Text
        style={{
          marginTop: 20,
          fontWeight: "700",
        }}
      >
        📅 Consistency
      </Text>

      <Text style={{ marginTop: 5 }}>
        {getActiveDays()} active day
        {getActiveDays() === 1 ? "" : "s"}
      </Text>

      <Text style={{ marginTop: 5 }}>
        Keep practicing regularly to build your learning streak!
      </Text>

      <Text
        style={{
          marginTop: 20,
          fontWeight: "700",
        }}
      >
        🏆 Best Learning Day
      </Text>

      <Text style={{ marginTop: 5 }}>
        {getBestDay()}
      </Text>

      <Text style={{ marginTop: 5 }}>
        {getBestDayActivity()} activities completed
      </Text>
    </Card>

    <Card>
      <Text
        style={{
          color: "#4f46e5",
          fontSize: 22,
          fontWeight: "700",
          marginBottom: 12,
        }}
      >
        🎯 Personalized Daily Goals
      </Text>

      <Text
        style={{
          fontSize: 18,
          fontWeight: "700",
        }}
      >
        Today's Goal Progress: {goalOverall}%
      </Text>

      <ProgressBar value={goalOverall} />

      {(
        [
          ["exercises", "📝 Exercises", todayRecord.exercises],
          ["vocabulary", "📚 Vocabulary", todayRecord.vocabulary],
          ["speaking", "🎤 Speaking", todayRecord.speaking],
          [
            "pronunciation",
            "🗣️ Pronunciation",
            todayRecord.pronunciation,
          ],
        ] as const
      ).map(([key, title, current]) => {
        const progress = Math.min(
          100,
          Math.round(
            (current / Math.max(goals[key], 1)) * 100
          )
        );

        return (
          <View key={key} style={{ marginTop: 15 }}>
            <Text style={{ fontWeight: "700" }}>
              {title}
            </Text>

            <Text style={{ marginVertical: 5 }}>
              {current} / {goals[key]}
            </Text>

            <ProgressBar value={progress} />

            <TextInput
              keyboardType="numeric"
              value={String(goals[key])}
              onChangeText={(value) =>
                updateGoal(key, Number(value) || 1)
              }
              style={{
                width: "100%",
                padding: 9,
                borderWidth: 1.5,
                borderColor: "#c7d2fe",
                borderRadius: 12,
              }}
            />
          </View>
        );
      })}
    </Card>

    <Card>
      <Text
        style={{
          color: "#7c3aed",
          fontSize: 22,
          fontWeight: "700",
          marginBottom: 12,
        }}
      >
        💬 Conversation Practice
      </Text>

      <View
  style={{
    backgroundColor: "#eff6ff",
    padding: 12,
    borderRadius: 14,
    height: 220,
    marginBottom: 10,
  }}
>
  <ScrollView
    style={{ flex: 1 }}
    nestedScrollEnabled
    showsVerticalScrollIndicator
    contentContainerStyle={{ paddingBottom: 12 }}
  >
    {messages.map((item, index) => (
      <Text
        key={index}
        style={{
          marginBottom: 8,
          lineHeight: 21,
        }}
      >
        {item}
      </Text>
    ))}
  </ScrollView>
</View>

      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder="Type in English..."
        multiline
        style={{
          padding: 12,
          borderWidth: 1.5,
          borderColor: "#c7d2fe",
          borderRadius: 12,
          marginBottom: 8,
        }}
      />

      <Pressable
        style={{
          backgroundColor: "#4f46e5",
          padding: 12,
          borderRadius: 10,
          alignItems: "center",
        }}
        onPress={() =>sendMessage()}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          Send
        </Text>
      </Pressable>
    </Card>

    <Card>
      <Text
        style={{
          color: "#2563eb",
          fontSize: 22,
          fontWeight: "700",
          marginBottom: 12,
        }}
      >
        🔊 Tutor Voice
      </Text>

      <Text style={{ fontWeight: "700" }}>
        Latest Tutor Reply:
      </Text>

      <Text style={{ marginVertical: 8 }}>
        {lastTutorMessage}
      </Text>

      <Text style={{ marginBottom: 12 }}>
        📚 Current Topic:{" "}
        <Text style={{ fontWeight: "700" }}>
          {tutorTopic}
        </Text>
      </Text>

      <Text style={{ fontWeight: "700", marginBottom: 8 }}>
        🌍 Choose Language:
      </Text>

      <Pressable
        style={{
          padding: 12,
          borderWidth: 1.5,
          borderColor: "#c7d2fe",
          borderRadius: 12,
          marginBottom: 12,
        }}
        onPress={() => {
          const currentIndex =
            languages.indexOf(selectedLanguage);

          const nextIndex =
            (currentIndex + 1) % languages.length;

          const language = languages[nextIndex] as keyof typeof readingTextsByLanguage;
           setSelectedLanguage(language);

          const welcome =
            welcomeMessages[language] ||
            welcomeMessages.English;

          setMessages((previous) =>
            previous.map((msg, index) =>
              index === 0
                ? `Tutor: ${welcome}`
                : msg
            )
          );

          setLastTutorMessage(welcome);
        }}
      >
        <Text>
          {selectedLanguage || "Choose Language"} ▼
        </Text>
      </Pressable>

      <Pressable
        style={{
          backgroundColor: "#4f46e5",
          padding: 12,
          borderRadius: 10,
          alignItems: "center",
          marginBottom: 8,
        }}
        onPress={() => speak(lastTutorMessage)}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          🔊 Listen to Latest Reply
        </Text>
      </Pressable>

      <Pressable
        style={{
          backgroundColor: "#64748b",
          padding: 12,
          borderRadius: 10,
          alignItems: "center",
        }}
        onPress={() => Speech.stop()}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          ⏹️ Stop
        </Text>
      </Pressable>
    </Card>

    <Card>
      <Text
        style={{
          color: "#2563eb",
          fontSize: 22,
          fontWeight: "700",
          marginBottom: 12,
        }}
      >
        🎤 Speaking Practice
      </Text>

      <Text style={{ marginBottom: 12 }}>
        Speak naturally in {selectedLanguage}. Your speech will appear in
        the conversation box.
      </Text>

      <Pressable
        style={{
          backgroundColor: isListening
            ? "#dc2626"
            : "#2563eb",
          padding: 12,
          borderRadius: 10,
          alignItems: "center",
        }}
        onPress={startSpeaking}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          {isListening
            ? "🎙️ Listening..."
            : "🎤 Start Speaking"}
        </Text>
      </Pressable>

      <Text style={{ marginTop: 10 }}>
        Attempts: {speakingAttempts}
      </Text>

      <Text>
        Successful: {speakingSuccessful}
      </Text>
    </Card>

    <Card>
  <Text
    style={{
      color: "#7c3aed",
      fontSize: 22,
      fontWeight: "700",
      marginBottom: 12,
    }}
  >
    🗣️ Pronunciation Practice
  </Text>

  <Text
    style={{
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 8,
    }}
  >
    {(
      currentPronunciationSentences[pronunciationIndex] ||
      pronunciationSentences[0]
    ).sentence}
  </Text>

  <Text style={{ marginBottom: 12 }}>
    💡{" "}
    {(
      currentPronunciationSentences[pronunciationIndex] ||
      pronunciationSentences[0]
    ).tip}
  </Text>

  <Pressable
    style={{
      backgroundColor: "#4f46e5",
      padding: 12,
      borderRadius: 10,
      alignItems: "center",
      marginBottom: 8,
    }}
    onPress={() =>
      speak(
        (
          currentPronunciationSentences[pronunciationIndex] ||
          pronunciationSentences[0]
        ).sentence
      )
    }
  >
    <Text style={{ color: "#fff", fontWeight: "700" }}>
      🔊 Hear Sentence
    </Text>
  </Pressable>

  <Pressable
    style={{
      backgroundColor: "#7c3aed",
      padding: 12,
      borderRadius: 10,
      alignItems: "center",
    }}
    onPress={startPronunciation}
  >
    <Text style={{ color: "#fff", fontWeight: "700" }}>
      {pronunciationListening
        ? "🎙️ Listening..."
        : "🎤 Speak Sentence"}
    </Text>
  </Pressable>

  {pronunciationResult && (
    <Text style={{ marginTop: 12 }}>
      <Text style={{ fontWeight: "700" }}>You said:</Text>{" "}
      {pronunciationResult}
    </Text>
  )}

  {pronunciationFeedback && (
    <Text style={{ marginTop: 8 }}>
      {pronunciationFeedback}
    </Text>
  )}

  <Text style={{ marginTop: 10 }}>
    🎯 Pronunciation Accuracy:{" "}
    <Text style={{ fontWeight: "700" }}>
      {pronunciationScore >= 80
        ? "🌟 Excellent"
        : pronunciationScore >= 50
        ? "👍 Good"
        : pronunciationScore > 0
        ? "💪 Keep Practicing"
        : "—"}
    </Text>
  </Text>

  {pronunciationResult && (
  <Text style={{ marginTop: 8 }}>
    🎯 Pronunciation Score:{" "}
    <Text style={{ fontWeight: "700" }}>
      {pronunciationScore}%
    </Text>
  </Text>
    )}

  <Text style={{ marginTop: 10 }}>
    Sentence {pronunciationIndex + 1} of{" "}
    {currentPronunciationSentences.length}
  </Text>

  <Pressable
    style={{
      backgroundColor: "#4f46e5",
      padding: 12,
      borderRadius: 10,
      alignItems: "center",
      marginTop: 10,
    }}
    onPress={nextPronunciation}
  >
    <Text style={{ color: "#fff", fontWeight: "700" }}>
      ➡️ Next Sentence
    </Text>
  </Pressable>
</Card>

    <Card>
      <Text
        style={{
          color: "#4f46e5",
          fontSize: 22,
          fontWeight: "700",
          marginBottom: 12,
        }}
      >
        📚 Vocabulary Practice
      </Text>

      <Text
        style={{
          fontSize: 22,
          fontWeight: "700",
        }}
      >
        {currentWord.word}
      </Text>

      <Text style={{ marginVertical: 8 }}>
        {currentWord.meaning}
      </Text>

      <Text style={{ marginBottom: 12 }}>
        <Text style={{ fontWeight: "700" }}>
          Example:
        </Text>{" "}
        {currentWord.example}
      </Text>

      {vocabularyOptions.map((option) => (
        <Pressable
          key={option}
          style={{
            backgroundColor: "#eef2ff",
            padding: 12,
            borderRadius: 10,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: "#c7d2fe",
          }}
          onPress={() => checkVocabulary(option)}
        >
          <Text>{option}</Text>
        </Pressable>
      ))}

      <Text style={{ marginVertical: 8 }}>
        {vocabularyResult}
      </Text>

      <Text>
        Score: {vocabularyScore}/{vocabulary.length}
      </Text>

      <Pressable
        style={{
          backgroundColor: "#4f46e5",
          padding: 12,
          borderRadius: 10,
          alignItems: "center",
          marginTop: 10,
        }}
        onPress={nextVocabulary}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          ➡️ Next Word
        </Text>
      </Pressable>
    </Card>

    <Card>
      <Text
        style={{
          color: "#2563eb",
          fontSize: 22,
          fontWeight: "700",
          marginBottom: 12,
        }}
      >
        🎯 Choose Your Level
      </Text>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {Object.keys(exercises).map((item) => (
          <Pressable
            key={item}
            style={{
              backgroundColor:
                level === item
                  ? "#7c3aed"
                  : "#94a3b8",
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 10,
            }}
            onPress={() => {
              setLevel(item);
              setExerciseIndex(0);
              setExerciseResult("");
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              {item}
            </Text>
          </Pressable>
        ))}
      </View>
    </Card>

    <Card>
      <Text
        style={{
          color: "#7c3aed",
          fontSize: 22,
          fontWeight: "700",
          marginBottom: 12,
        }}
      >
        📝 English Exercise
      </Text>

      <Text
        style={{
          fontSize: 19,
          fontWeight: "700",
          marginBottom: 10,
        }}
      >
        {currentExercise.question}
      </Text>

      {exerciseOptions.map((option) => (
        <Pressable
          key={option}
          style={{
            backgroundColor: "#eef2ff",
            padding: 12,
            borderRadius: 10,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: "#c7d2fe",
          }}
          onPress={() => checkExercise(option)}
        >
          <Text>{option}</Text>
        </Pressable>
      ))}

      <Text style={{ marginVertical: 8 }}>
        {exerciseResult}
      </Text>

      <Text>
        Score: {exerciseScore}/{exercises[level].length}
      </Text>

      <Pressable
        style={{
          backgroundColor: "#4f46e5",
          padding: 12,
          borderRadius: 10,
          alignItems: "center",
          marginTop: 10,
        }}
        onPress={nextExercise}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          ➡️ Next Exercise
        </Text>
      </Pressable>
    </Card>

    <Card>
      <Text
        style={{
          color: "#2563eb",
          fontSize: 22,
          fontWeight: "700",
          marginBottom: 12,
        }}
      >
        📖 Reading Practice
      </Text>

      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          marginBottom: 8,
        }}
      >
        {readingTexts[readingIndex].title}
      </Text>

      <Text style={{ marginBottom: 12 }}>
        {readingTexts[readingIndex].text}
      </Text>

      <Text
        style={{
          fontSize: 18,
          fontWeight: "700",
          marginBottom: 8,
        }}
      >
        {readingTexts[readingIndex].question}
      </Text>

      {readingTexts[readingIndex].options.map(
        (option) => (
          <Pressable
            key={option}
            style={{
              backgroundColor: "#eef2ff",
              padding: 12,
              borderRadius: 10,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: "#c7d2fe",
            }}
            onPress={() => checkReading(option)}
          >
            <Text>{option}</Text>
          </Pressable>
        )
      )}

      <Text style={{ marginVertical: 8 }}>
        {readingResult}
      </Text>

      <Pressable
        style={{
          backgroundColor: "#4f46e5",
          padding: 12,
          borderRadius: 10,
          alignItems: "center",
        }}
        onPress={nextReading}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          ➡️ Next Reading
        </Text>
      </Pressable>
    </Card>

    <Card>
      <Text
        style={{
          color: "#7c3aed",
          fontSize: 22,
          fontWeight: "700",
          marginBottom: 12,
        }}
      >
        ✍️ Writing Practice
      </Text>

      <Text style={{ marginBottom: 10 }}>
        Write a short sentence about your day.
      </Text>

      <TextInput
        value={writingText}
        onChangeText={setWritingText}
        placeholder="Example: I learned English today."
        multiline
        textAlignVertical="top"
        style={{
          width: "100%",
          minHeight: 100,
          padding: 12,
          borderWidth: 1.5,
          borderColor: "#c7d2fe",
          borderRadius: 12,
          marginBottom: 10,
        }}
      />

      <Pressable
        style={{
          backgroundColor: "#4f46e5",
          padding: 12,
          borderRadius: 10,
          alignItems: "center",
        }}
        onPress={checkWriting}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          ✨ Check Writing
        </Text>
      </Pressable>

      <Text style={{ marginTop: 10 }}>
        {writingFeedback}
      </Text>

      <Text style={{ marginTop: 8 }}>
        Writing attempts: {writingCount}
      </Text>
    </Card>

    <Card>
      <Text
        style={{
          color: "#2563eb",
          fontSize: 22,
          fontWeight: "700",
          marginBottom: 12,
        }}
      >
        🎧 Listening Practice
      </Text>

      <Text style={{ marginBottom: 10 }}>
        Listen carefully and answer the question.
      </Text>

      <Pressable
        style={{
          backgroundColor: "#4f46e5",
          padding: 12,
          borderRadius: 10,
          alignItems: "center",
          marginBottom: 12,
        }}
        onPress={playListening}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          🔊 Play Audio
        </Text>
      </Pressable>

      <Text
        style={{
          fontSize: 18,
          fontWeight: "700",
          marginBottom: 8,
        }}
      >
        {listeningTexts[listeningIndex].question}
      </Text>

      {listeningTexts[listeningIndex].options.map(
        (option) => (
          <Pressable
            key={option}
            style={{
              backgroundColor: "#eef2ff",
              padding: 12,
              borderRadius: 10,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: "#c7d2fe",
            }}
            onPress={() => checkListening(option)}
          >
            <Text>{option}</Text>
          </Pressable>
        )
      )}

      <Text style={{ marginVertical: 8 }}>
        {listeningResult}
      </Text>

      <Pressable
        style={{
          backgroundColor: "#4f46e5",
          padding: 12,
          borderRadius: 10,
          alignItems: "center",
        }}
        onPress={nextListening}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          ➡️ Next Listening
        </Text>
      </Pressable>
    </Card>

    <Card>
      <Text
        style={{
          color: "#4f46e5",
          fontSize: 22,
          fontWeight: "700",
          marginBottom: 12,
        }}
      >
        💬 Conversation Scenarios
      </Text>

      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          marginBottom: 8,
        }}
      >
        {scenarios[scenarioIndex].title}
      </Text>

      <Text style={{ marginBottom: 10 }}>
        <Text style={{ fontWeight: "700" }}>
          Tutor:
        </Text>{" "}
        {scenarios[scenarioIndex].tutor}
      </Text>

      {scenarios[scenarioIndex].suggestions.map(
        (suggestion) => (
          <Pressable
            key={suggestion}
            style={{
              backgroundColor: "#eef2ff",
              padding: 12,
              borderRadius: 10,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: "#c7d2fe",
            }}
            onPress={() => useScenario(suggestion)}
          >
            <Text>{suggestion}</Text>
          </Pressable>
        )
      )}

      <Pressable
        style={{
          backgroundColor: "#4f46e5",
          padding: 12,
          borderRadius: 10,
          alignItems: "center",
        }}
        onPress={nextScenario}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          ➡️ Next Scenario
        </Text>
      </Pressable>
    </Card>

    <Card>
      <Text
        style={{
          color: "#7c3aed",
          fontSize: 22,
          fontWeight: "700",
          marginBottom: 12,
        }}
      >
        🎮 Mini English Game
      </Text>

      <Text style={{ marginBottom: 8 }}>
        Find the opposite of:
      </Text>

      <Text
        style={{
          fontSize: 24,
          fontWeight: "700",
          marginBottom: 12,
        }}
      >
        {gameWords[gameIndex][0]}
      </Text>

      <Pressable
        style={{
          backgroundColor: "#4f46e5",
          padding: 12,
          borderRadius: 10,
          alignItems: "center",
          marginBottom: 10,
        }}
        onPress={playGame}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          🎯 Show Answer
        </Text>
      </Pressable>

      {gameResult && (
        <Text style={{ marginBottom: 10 }}>
          Answer:{" "}
          <Text style={{ fontWeight: "700" }}>
            {gameResult}
          </Text>
        </Text>
      )}

      <Text style={{ marginBottom: 10 }}>
        Game Score: {gameScore}
      </Text>

      <Pressable
        style={{
          backgroundColor: "#4f46e5",
          padding: 12,
          borderRadius: 10,
          alignItems: "center",
        }}
        onPress={nextGame}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          ➡️ Next Game
        </Text>
      </Pressable>
    </Card>

    <Card>
      <Text
        style={{
          color: "#f59e0b",
          fontSize: 22,
          fontWeight: "700",
          marginBottom: 12,
        }}
      >
        🏆 Certificate
      </Text>

      {overallProgress >= 80 ? (
        <View
          style={{
            borderWidth: 3,
            borderColor: "#f59e0b",
            padding: 25,
            borderRadius: 15,
            alignItems: "center",
            backgroundColor: "#fffbeb",
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            🏆 Certificate of Achievement
          </Text>

          <Text style={{ marginBottom: 8 }}>
            This certificate is presented to
          </Text>

          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
              marginBottom: 8,
            }}
          >
            {profileName}
          </Text>

          <Text
            style={{
              textAlign: "center",
              marginBottom: 10,
            }}
          >
            for completing major English learning
            activities in LanguageTutor.
          </Text>

          <Text style={{ fontWeight: "700" }}>
            Level {xpLevel} • {xp} XP
          </Text>
        </View>
      ) : (
        <Text>
          Reach 80% overall progress to unlock your certificate.
        </Text>
      )}
    </Card>

    <Card>
      <Text
        style={{
          color: "#2563eb",
          fontSize: 22,
          fontWeight: "700",
          marginBottom: 12,
        }}
      >
        📋 Learning History
      </Text>

      {history.length === 0 ? (
        <Text>
          Your learning activities will appear here.
        </Text>
      ) : (
        history
          .slice()
          .sort((a, b) =>
            b.date.localeCompare(a.date)
          )
          .slice(0, 7)
          .map((record) => (
            <View
              key={record.date}
              style={{
                padding: 12,
                marginBottom: 8,
                backgroundColor: "#eff6ff",
                borderRadius: 14,
              }}
            >
              <Text style={{ fontWeight: "700" }}>
                📅 {record.date}
              </Text>

              <Text style={{ marginTop: 6 }}>
                📝 {record.exercises} exercises • 📚{" "}
                {record.vocabulary} vocabulary
              </Text>

              <Text style={{ marginTop: 4 }}>
                🎤 {record.speaking} speaking • 🗣️{" "}
                {record.pronunciation} pronunciation
              </Text>

              <Text style={{ marginTop: 4 }}>
                📖 {record.reading} reading • ✍️{" "}
                {record.writing} writing
              </Text>

              <Text style={{ marginTop: 4 }}>
                🎧 {record.listening} listening • 🎮{" "}
                {record.game} games
              </Text>

              <Text
                style={{
                  fontWeight: "700",
                  marginTop: 6,
                }}
              >
                ⭐ {record.xp} XP earned
              </Text>
            </View>
          ))
      )}
    </Card>

    <Card>
      <Text
        style={{
          color: "#4f46e5",
          fontSize: 22,
          fontWeight: "700",
          marginBottom: 12,
        }}
      >
        💾 Saved Progress
      </Text>

      <View
        style={{
          backgroundColor: "#f8fafc",
          padding: 12,
          borderRadius: 12,
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            color: "#7c3aed",
            fontSize: 20,
            fontWeight: "700",
            marginBottom: 12,
          }}
        >
          🔔 Daily Practice Reminder
        </Text>

        <Pressable
          onPress={() => alert("Test reminder")}
          style={{
            backgroundColor: "#e2e8f0",
            padding: 10,
            borderRadius: 8,
            marginBottom: 8,
          }}
        >
          <Text>🧪 Test Notification</Text>
        </Pressable>

        <Pressable
          onPress={requestNotificationPermission}
          style={{
            backgroundColor: "#e2e8f0",
            padding: 10,
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          <Text>🔔 Enable Notifications</Text>
        </Pressable>

        <Pressable
          onPress={() =>
            setReminderEnabled(!reminderEnabled)
          }
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderWidth: 2,
              borderColor: "#4f46e5",
              borderRadius: 5,
              marginRight: 8,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {reminderEnabled && (
              <Text style={{ fontSize: 14 }}>
                ✓
              </Text>
            )}
          </View>

          <Text>Enable daily reminder</Text>
        </Pressable>

        <Text style={{ marginBottom: 8 }}>
          Choose your practice time:
        </Text>

        <TextInput
          value={reminderTime}
          onChangeText={setReminderTime}
          placeholder="18:00"
          style={{
            padding: 10,
            borderWidth: 1.5,
            borderColor: "#c7d2fe",
            borderRadius: 12,
            marginBottom: 12,
          }}
        />

        <Text style={{ marginBottom: 8 }}>
          Reminder message:
        </Text>

        <TextInput
          value={reminderMessage}
          onChangeText={setReminderMessage}
          placeholder="Time to practice English! 📚"
          style={{
            width: "100%",
            padding: 12,
            borderWidth: 1.5,
            borderColor: "#c7d2fe",
            borderRadius: 12,
            marginBottom: 10,
          }}
        />

        <Text>
          {reminderEnabled
            ? `Reminder enabled for ${reminderTime}`
            : "Your daily reminder is currently off."}
        </Text>
      </View>

      <View>
        <Text
          style={{
            color: "#2563eb",
            fontSize: 20,
            fontWeight: "700",
            marginBottom: 12,
          }}
        >
          📅 Learning Calendar
        </Text>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 15,
          }}
        >
          <Pressable
            style={{
              backgroundColor: "#4f46e5",
              padding: 10,
              borderRadius: 8,
            }}
            onPress={() =>
              setCalendarMonth(
                new Date(
                  calendarMonth.getFullYear(),
                  calendarMonth.getMonth() - 1,
                  1
                )
              )
            }
          >
            <Text style={{ color: "#fff" }}>◀</Text>
          </Pressable>

          <Text style={{ fontWeight: "700" }}>
            {calendarMonth.toLocaleString(
              "default",
              {
                month: "long",
                year: "numeric",
              }
            )}
          </Text>

          <Pressable
            style={{
              backgroundColor: "#4f46e5",
              padding: 10,
              borderRadius: 8,
            }}
            onPress={() =>
              setCalendarMonth(
                new Date(
                  calendarMonth.getFullYear(),
                  calendarMonth.getMonth() + 1,
                  1
                )
              )
            }
          >
            <Text style={{ color: "#fff" }}>▶</Text>
          </Pressable>
        </View>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
          }}
        >
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
            (day) => (
              <View
                key={day}
                style={{
                  width: "14.28%",
                  paddingVertical: 6,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontWeight: "700" }}>
                  {day}
                </Text>
              </View>
            )
          )}

          {getCalendarDays().map((day, index) => (
            <View
              key={index}
              style={{
                width: "14.28%",
                minHeight: 42,
                padding: 5,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: day
                  ? hasLearningActivity(day)
                    ? "#dcfce7"
                    : "#eff6ff"
                  : "transparent",
                marginBottom: 4,
              }}
            >
              <Text
                style={{
                  fontWeight:
                    day &&
                    hasLearningActivity(day)
                      ? "700"
                      : "400",
                }}
              >
                {day &&
                hasLearningActivity(day)
                  ? "✅ "
                  : ""}
                {day}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={{ marginTop: 15 }}>
        ☁️ Cloud Sync:{" "}
        <Text style={{ fontWeight: "700" }}>
          {syncStatus}
        </Text>
      </Text>

      <Text style={{ marginTop: 8 }}>
        {saved
          ? "✅ Progress saved!"
          : "Your progress is saved automatically."}
      </Text>

      <Pressable
        style={{
          backgroundColor: "#dc2626",
          padding: 12,
          borderRadius: 10,
          alignItems: "center",
          marginTop: 12,
        }}
        onPress={resetProgress}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          🗑️ Reset All Progress
        </Text>
      </Pressable>
    </Card>

    <Text
      style={{
        textAlign: "center",
        color: "#64748b",
        paddingVertical: 20,
      }}
    >
      LanguageTutor • Keep learning, keep improving 🚀
    </Text>
  </ScrollView>
);
}