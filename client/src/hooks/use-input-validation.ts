import { useState, useEffect, useMemo } from "react";

export type QualityLevel = "Poor" | "Basic" | "Good" | "Excellent";

export interface ValidationRuleResult {
  passed: boolean;
  code: string;
  message: string;
}

export interface InputValidationResult {
  charCount: number;
  wordCount: number;
  uniqueWordRatio: number;
  repeatedWordRatio: number;
  qualityScore: number; // 0 to 100
  qualityLevel: QualityLevel;
  isValid: boolean;
  warnings: string[];
  failedRules: string[];
  suggestions: string[];
}

const KEYBOARD_PATTERNS = [
  /qwerty/i,
  /asdf/i,
  /zxcv/i,
  /12345/i,
  /abcd/i,
  /hjkl/i,
  /iop/i,
];

const COMMON_PLACEHOLDERS = [
  "test",
  "testing",
  "hello",
  "sample",
  "demo",
  "new project",
  "my project",
  "asdf",
  "qwerty",
  "abc",
  "xyz",
  "lorem ipsum",
];

const STARTER_SUGGESTIONS = [
  { label: "Describe the problem", prefix: "Problem: " },
  { label: "Describe the users", prefix: "Target users: " },
  { label: "Add technical details", prefix: "Tech stack: " },
  { label: "Explain current blockers", prefix: "Main challenge: " },
  { label: "Explain expected outcome", prefix: "Goal: " },
];

export function validateInputText(text: string, minChars = 50, minWords = 10): InputValidationResult {
  const trimmed = text.trim();
  const charCount = text.length;

  // Extract words (alpha-numeric)
  const words = trimmed.toLowerCase().match(/[a-z0-9]+/g) || [];
  const wordCount = words.length;

  // Calculate unique words & repetitions
  const wordFrequency: Record<string, number> = {};
  words.forEach((w) => {
    wordFrequency[w] = (wordFrequency[w] || 0) + 1;
  });

  const uniqueWords = Object.keys(wordFrequency);
  const uniqueWordRatio = wordCount > 0 ? uniqueWords.length / wordCount : 0;
  
  // Highest frequency of a single word
  let maxWordFreq = 0;
  let maxRepeatedWord = "";
  Object.entries(wordFrequency).forEach(([w, count]) => {
    if (count > maxWordFreq) {
      maxWordFreq = count;
      maxRepeatedWord = w;
    }
  });
  const repeatedWordRatio = wordCount > 0 ? maxWordFreq / wordCount : 0;

  // Rule checks
  const failedRules: string[] = [];
  const warnings: string[] = [];

  // Check 1: Empty or whitespace only
  if (charCount === 0) {
    failedRules.push("EMPTY");
    warnings.push("Tell us more about your idea.");
  }

  // Check 2: Minimum character count
  else if (charCount < minChars) {
    failedRules.push("MIN_CHARS");
    warnings.push(`Your description is too short for meaningful AI analysis (${charCount}/${minChars} characters).`);
  }

  // Check 3: Minimum word count
  else if (wordCount < minWords) {
    failedRules.push("MIN_WORDS");
    warnings.push(`Please use at least ${minWords} words to explain your idea (${wordCount}/${minWords} words).`);
  }

  // Check 4: Placeholder text check
  const lowerTrimmed = trimmed.toLowerCase();
  const isExactPlaceholder = COMMON_PLACEHOLDERS.some((p) => lowerTrimmed === p);
  if (isExactPlaceholder) {
    failedRules.push("PLACEHOLDER");
    warnings.push("This looks like placeholder text.");
  }

  // Check 5: Repeated words ratio (> 40%) or single word repeated continuously
  if (wordCount >= 3 && repeatedWordRatio > 0.4) {
    failedRules.push("REPEATED_WORDS");
    warnings.push(`Too many repeated words ("${maxRepeatedWord}"). Please provide a clear description.`);
  }

  // Check 6: Keyboard mash / pattern detection
  const hasKeyboardMash = KEYBOARD_PATTERNS.some((pattern) => pattern.test(lowerTrimmed)) ||
    /(.)\1{4,}/.test(lowerTrimmed); // e.g. "aaaaa" or "sssss"
  if (hasKeyboardMash) {
    failedRules.push("KEYBOARD_MASH");
    warnings.push("We couldn't understand the project description. Avoid random characters.");
  }

  // Check 7: Excessive symbols or numbers
  const symbolCount = (text.match(/[^a-zA-Z0-9\s]/g) || []).length;
  const numberCount = (text.match(/[0-9]/g) || []).length;
  if (charCount > 0 && symbolCount / charCount > 0.35) {
    failedRules.push("EXCESSIVE_SYMBOLS");
    warnings.push("Too many symbols detected. Please use clear text.");
  } else if (charCount > 0 && numberCount / charCount > 0.6) {
    failedRules.push("MOSTLY_NUMBERS");
    warnings.push("Input consists mostly of numbers. Please describe your project idea.");
  }

  // Quality score calculation (0 - 100)
  let score = 0;
  if (charCount > 0) {
    // Character score (max 40)
    const charScore = Math.min(40, (charCount / (minChars * 3)) * 40);
    // Word score (max 30)
    const wordScore = Math.min(30, (wordCount / (minWords * 2.5)) * 30);
    // Diversity score (max 30)
    const diversityScore = uniqueWordRatio * 30;

    score = Math.round(charScore + wordScore + diversityScore);

    // Penalties for failed rules
    if (failedRules.includes("PLACEHOLDER") || failedRules.includes("KEYBOARD_MASH")) {
      score = Math.min(score, 10);
    }
    if (failedRules.includes("REPEATED_WORDS")) {
      score = Math.min(score, 25);
    }
    if (failedRules.includes("EXCESSIVE_SYMBOLS") || failedRules.includes("MOSTLY_NUMBERS")) {
      score = Math.min(score, 20);
    }
    if (failedRules.includes("MIN_CHARS") || failedRules.includes("MIN_WORDS")) {
      score = Math.min(score, 45);
    }
  }

  // Quality Level mapping
  let qualityLevel: QualityLevel = "Poor";
  if (score >= 80 && failedRules.length === 0) {
    qualityLevel = "Excellent";
  } else if (score >= 60 && failedRules.length === 0) {
    qualityLevel = "Good";
  } else if (score >= 40 && !failedRules.includes("PLACEHOLDER") && !failedRules.includes("KEYBOARD_MASH")) {
    qualityLevel = "Basic";
  } else {
    qualityLevel = "Poor";
  }

  const isValid = failedRules.length === 0 && score >= 40;

  // AI Suggestions
  const suggestions = [
    "What problem are you solving?",
    "Who is your target audience?",
    "What inspired this idea?",
    "What technologies do you plan to use?",
    "What makes this idea unique?",
    "What is currently blocking the project?",
  ];

  return {
    charCount,
    wordCount,
    uniqueWordRatio,
    repeatedWordRatio,
    qualityScore: score,
    qualityLevel,
    isValid,
    warnings,
    failedRules,
    suggestions,
  };
}

export function useInputValidation(text: string, minChars = 50, minWords = 10, debounceMs = 300) {
  const [debouncedText, setDebouncedText] = useState(text);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedText(text);
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [text, debounceMs]);

  // Return live count immediately for instant counters, but debounced validation results
  const result = useMemo(() => {
    return validateInputText(debouncedText, minChars, minWords);
  }, [debouncedText, minChars, minWords]);

  return {
    ...result,
    // Real-time character and word counts (immediate)
    liveCharCount: text.length,
    liveWordCount: (text.trim().match(/[a-z0-9]+/g) || []).length,
    starterSuggestions: STARTER_SUGGESTIONS,
  };
}
