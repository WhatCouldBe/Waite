import React, { useState, useEffect, useRef } from 'react';
import './SpeechTest.css';
import Navbar from '../components/Navbar';

const sentences = [
  "Zebra zoomed zig-zagging zealously.",
  "He yawned yellow yesterday.",
  "Wolves wandered westward, waiting.",
  "Fuzzy Wuzzy was a bear, Fuzzy Wuzzy had no hair.",
  "Uptown umbrellas underlined urban unity.",
  "Baa, baa, black sheep, have you any wool?",
  "Snakes slithered silently, sliding south.",
  "Ravens roamed randomly, resting.",
  "Quick quails quietly questioned.",
  "Peter Piper picked a peck of pickled peppers.",
  "How much wood would a woodchuck chuck, if a woodchuck could chuck wood?",
  "She sells seashells by the seashore."
];

/**
 * Simple Levenshtein distance function to compute string differences.
 */
function levenshtein(a, b) {
  const matrix = [];
  const aLen = a.length;
  const bLen = b.length;
  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  // Initialize the matrix.
  for (let i = 0; i <= bLen; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= aLen; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= bLen; i++) {
    for (let j = 1; j <= aLen; j++) {
      if (b.charAt(i - 1).toLowerCase() === a.charAt(j - 1).toLowerCase()) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,    // deletion
          matrix[i][j - 1] + 1,    // insertion
          matrix[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }
  return matrix[bLen][aLen];
}

/**
 * Returns a percentage similarity between two strings.
 */
function similarityPercentage(str1, str2) {
  const distance = levenshtein(str1, str2);
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 100;
  return ((maxLen - distance) / maxLen) * 100;
}

export default function SpeechTest() {
  const [testSentence, setTestSentence] = useState('');
  const [resultText, setResultText] = useState('');
  const [similarity, setSimilarity] = useState(null);
  const [message, setMessage] = useState('');
  const [testActive, setTestActive] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);

  // Threshold below which we consider speech as “slurred” (i.e. not clear).
  const SIMILARITY_THRESHOLD = 75;

  // Pick a new test sentence at random.
  const pickNewSentence = () => {
    const randomSentence = sentences[Math.floor(Math.random() * sentences.length)];
    setTestSentence(randomSentence);
  };

  // On mount, pick an initial sentence.
  useEffect(() => {
    pickNewSentence();
  }, []);

  // Start the speech recognition process.
  const startRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessage("Sorry, your browser does not support speech recognition.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setResultText(transcript);
      const sim = similarityPercentage(testSentence, transcript);
      setSimilarity(sim.toFixed(2));
      if (sim < SIMILARITY_THRESHOLD) {
        setMessage("Your speech was too slurred. This likely indicates intoxication.");
      } else {
        setMessage("Excellent! Your speech was clear.");
      }
    };
    recognition.onerror = (event) => {
      setMessage("Speech recognition error: " + event.error);
    };
    recognition.onend = () => {
      setTestActive(false);
      clearTimeout(timerRef.current);
      // Prepare a new sentence for the next test.
      pickNewSentence();
    };

    recognition.start();
    recognitionRef.current = recognition;
    setTestActive(true);

    // Automatically stop recognition after 10 seconds if not manually stopped.
    timerRef.current = setTimeout(() => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }, 10000);
  };

  // Start a countdown, then begin recognition.
  const startTest = () => {
    setResultText('');
    setSimilarity(null);
    setMessage('');
    let count = 3;
    setCountdown(count);
    countdownRef.current = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(countdownRef.current);
        setCountdown(null);
        startRecognition();
      }
    }, 1000);
  };

  // Toggle the test on/off.
  const handleTestToggle = () => {
    if (testActive || countdown !== null) {
      // If a test is active or in countdown, stop everything.
      if (recognitionRef.current) recognitionRef.current.stop();
      clearTimeout(timerRef.current);
      clearInterval(countdownRef.current);
      setCountdown(null);
      setTestActive(false);
      setMessage("Test stopped. Press 'Start Test' to try again.");
    } else {
      startTest();
    }
  };

  return (
    <div className="speech-test-container">
      <Navbar onSignOut={() => {
        localStorage.removeItem('bacshotsUser');
        window.location.href = '/signin';
      }} />
      <div className="speech-test-content">
        <h1>Speech Test</h1>
        <p className="instruction">
          When ready, press "Start Test" and clearly recite the sentence below within 10 seconds.
        </p>
        <div className="test-sentence">{testSentence}</div>
        {countdown !== null && (
          <div className="countdown">
            Starting in {countdown}...
          </div>
        )}
        <button className="start-btn" onClick={handleTestToggle}>
          {testActive || countdown !== null ? "Stop Test" : "Start Test"}
        </button>
        {resultText && (
          <div className="result">
            <p>Your Speech: <em>{resultText}</em></p>
            <p>Match Percentage: {similarity}%</p>
            <p>{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
