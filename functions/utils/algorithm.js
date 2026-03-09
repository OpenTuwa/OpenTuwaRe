// The Brain - Core Recommendation Algorithm for OpenTuwa
// This module acts as the centralized algorithm for determining 
// "Trending", "Recommended", and "Latest" article feeds across the platform.

// =================================================================================================
//  THE BRAIN STEM (Configuration & Constants)
//  Adjust these weights to change how the platform "learns" from users.
// =================================================================================================
export const SCORING_WEIGHTS = {
  VIEW: 1,
  READ: 5,
  SHARE: 10,
  TIME_SPENT_FACTOR: 0.1, // Points per second of attention
  
  // The 3-Tier Priority System Weights
  TIER_1_CONTENT_MATCH: 40,   // Lexical Matrix overlap (Word math)
  TIER_2_SESSION_HABIT: 35,   // What the user is doing RIGHT NOW (Browser Session)
  TIER_3_WORLDWIDE_VOTE: 25   // What the world thinks is good (Total Engagement)
};

// =================================================================================================
//  THE HIPPOCAMPUS (Long-term Memory / Training Data Schema)
//  We use a "Session Profile" architecture to prevent database explosion.
//  Instead of 1 row per click (which crashes with 1M users), we maintain 1 row per User Session.
//  Every action updates their single row, merging their reading habits into a single 'lexical_history'.
// =================================================================================================
export const SESSION_PROFILE_SCHEMA = [
  'session_id', 'first_seen_at', 'last_seen_at', 
  'total_interactions', 'total_time_spent',
  'user_agent', 'platform', 'language', 'referrer', 
  'screen_width', 'screen_height', 'window_width', 'window_height',
  'timezone', 'connection_type', 'device_memory', 'hardware_concurrency',
  'lexical_history', // JSON string: Merged word-matrix of everything they read this session
  'interaction_history' // JSON string: Specific views/reads/time for every article they touched
];

// =================================================================================================
//  THE FAIRNESS METRIC (Content Depth Analyzer)
//  Calculates true "expected" time spent by analyzing not just words, but images and video length.
// =================================================================================================
export function calculateFairReadingTime(htmlContent) {
  if (!htmlContent) return 60; // 1 minute default

  // 1. Calculate reading time (Words)
  // Average reading speed: 200 words per minute
  // Fix: Clean HTML entities before stripping tags to prevent malformed text merging
  const text = htmlContent.replace(/&[a-z0-9#]+;/gi, ' ').replace(/<[^>]*>?/gm, ' ');
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  let expectedSeconds = (wordCount / 200) * 60;

  // 2. Calculate Image Viewing Time
  // Standard metric: 12 seconds for first image, 11 for second, etc. (we'll average 10s per image)
  const imageCount = (htmlContent.match(/<img[^>]+>/g) || []).length;
  expectedSeconds += (imageCount * 10);

  // 3. Calculate Video Watching Time
  // If we detect iframes (YouTube/Vimeo) or video tags, we add substantial buffer time.
  // We can't know exact length without API calls, so we estimate 3 minutes (180s) per video embedded.
  const videoCount = (htmlContent.match(/<iframe[^>]+>|<video[^>]+>/g) || []).length;
  expectedSeconds += (videoCount * 180);

  return Math.max(60, expectedSeconds); // Minimum 1 minute expected
}

// =================================================================================================
//  MODULE 1: ADVANCED LEXICAL ENGINE (The Cortex)
//  Enterprise-grade NLP processing relying on pure mathematics and suffix heuristics.
//  Includes: Porter Stemmer, N-Gram Tokenizer, and BM25 Probabilistic Scoring.
// =================================================================================================

/**
 * The Porter Stemming Algorithm (Martin Porter, 1980)
 * A rigorous heuristic process for removing the commoner morphological and inflexional endings from words in English.
 * This ensures that "connection", "connections", "connective", "connected", and "connecting" map to "connect".
 */
export class PorterStemmer {
  constructor() {
    this.step2list = {
      "ational": "ate", "tional": "tion", "enci": "ence", "anci": "ance",
      "izer": "ize", "bli": "ble", "alli": "al", "entli": "ent",
      "eli": "e", "ousli": "ous", "ization": "ize", "ation": "ate",
      "ator": "ate", "alism": "al", "iveness": "ive", "fulness": "ful",
      "ousness": "ous", "aliti": "al", "iviti": "ive", "biliti": "ble",
      "logi": "log"
    };

    this.step3list = {
      "icate": "ic", "ative": "", "alize": "al", "iciti": "ic",
      "ical": "ic", "ful": "", "ness": ""
    };
  }

  isConsonant(str, i) {
    const char = str.charAt(i);
    if ("aeiou".includes(char)) return false;
    if (char === 'y') {
      if (i === 0) return true;
      return !this.isConsonant(str, i - 1);
    }
    return true;
  }

  measure(str) {
    let n = 0;
    let index = 0;
    const len = str.length;
    while (index < len) {
      if (index >= len) return n;
      if (!this.isConsonant(str, index)) break;
      index++;
    }
    while (index < len) {
      while (true) {
        if (index >= len) return n;
        if (this.isConsonant(str, index)) break;
        index++;
      }
      index++;
      n++;
      while (true) {
        if (index >= len) return n;
        if (!this.isConsonant(str, index)) break;
        index++;
      }
    }
    return n;
  }

  containsVowel(str) {
    for (let i = 0; i < str.length; i++) {
      if (!this.isConsonant(str, i)) return true;
    }
    return false;
  }

  endsWithDoubleConsonant(str) {
    const len = str.length;
    if (len < 2) return false;
    if (str.charAt(len - 1) !== str.charAt(len - 2)) return false;
    return this.isConsonant(str, len - 1);
  }

  cvc(str) {
    const len = str.length;
    if (len < 3) return false;
    if (this.isConsonant(str, len - 1) && !this.isConsonant(str, len - 2) && this.isConsonant(str, len - 3)) {
      const w = str.charAt(len - 1);
      if (w === 'w' || w === 'x' || w === 'y') return false;
      return true;
    }
    return false;
  }

  stem(w) {
    if (w.length < 3) return w;
    const firstChar = w.charAt(0);
    if (firstChar === 'y') w = 'Y' + w.substr(1);

    // Step 1a
    if (w.endsWith("sses")) w = w.substr(0, w.length - 2);
    else if (w.endsWith("ies")) w = w.substr(0, w.length - 2);
    else if (w.endsWith("ss")) w = w;
    else if (w.endsWith("s")) w = w.substr(0, w.length - 1);

    // Step 1b
    if (w.endsWith("eed")) {
      const stem = w.substr(0, w.length - 3);
      if (this.measure(stem) > 0) w = stem + "ee";
    } else {
      let stem = "";
      if (w.endsWith("ed")) {
        stem = w.substr(0, w.length - 2);
        if (this.containsVowel(stem)) {
          w = stem;
          if (w.endsWith("at") || w.endsWith("bl") || w.endsWith("iz")) w += "e";
          else if (this.endsWithDoubleConsonant(w) && !(["l", "s", "z"].includes(w.charAt(w.length - 1)))) {
            w = w.substr(0, w.length - 1);
          } else if (this.measure(w) === 1 && this.cvc(w)) w += "e";
        }
      } else if (w.endsWith("ing")) {
        stem = w.substr(0, w.length - 3);
        if (this.containsVowel(stem)) {
          w = stem;
          if (w.endsWith("at") || w.endsWith("bl") || w.endsWith("iz")) w += "e";
          else if (this.endsWithDoubleConsonant(w) && !(["l", "s", "z"].includes(w.charAt(w.length - 1)))) {
            w = w.substr(0, w.length - 1);
          } else if (this.measure(w) === 1 && this.cvc(w)) w += "e";
        }
      }
    }

    // Step 1c
    if (w.endsWith("y") && this.containsVowel(w.substr(0, w.length - 1))) {
      w = w.substr(0, w.length - 1) + "i";
    }

    // Step 2
    if (this.measure(w) > 0) {
      for (const [suffix, replacement] of Object.entries(this.step2list)) {
        if (w.endsWith(suffix)) {
          const stem = w.substr(0, w.length - suffix.length);
          if (this.measure(stem) > 0) w = stem + replacement;
          break;
        }
      }
    }

    // Step 3
    if (this.measure(w) > 0) {
      for (const [suffix, replacement] of Object.entries(this.step3list)) {
        if (w.endsWith(suffix)) {
          const stem = w.substr(0, w.length - suffix.length);
          if (this.measure(stem) > 0) w = stem + replacement;
          break;
        }
      }
    }

    // Step 4
    if (this.measure(w) > 1) {
      const suffixes = ["al", "ance", "ence", "er", "ic", "able", "ible", "ant", "ement", "ment", "ent", "ou", "ism", "ate", "iti", "ous", "ive", "ize"];
      for (const suffix of suffixes) {
        if (w.endsWith(suffix)) {
          const stem = w.substr(0, w.length - suffix.length);
          if (this.measure(stem) > 1) w = stem;
          break;
        }
      }
      if (w.endsWith("ion")) {
        const stem = w.substr(0, w.length - 3);
        if (this.measure(stem) > 1 && (stem.endsWith("s") || stem.endsWith("t"))) w = stem;
      }
    }

    // Step 5a
    if (this.measure(w) > 1 && w.endsWith("e")) w = w.substr(0, w.length - 1);
    else if (this.measure(w) === 1 && !this.cvc(w) && w.endsWith("e")) w = w.substr(0, w.length - 1);

    // Step 5b
    if (this.measure(w) > 1 && this.endsWithDoubleConsonant(w) && w.endsWith("l")) w = w.substr(0, w.length - 1);

    if (firstChar === 'y') w = 'y' + w.substr(1);
    return w;
  }
}

/**
 * Advanced N-Gram Tokenizer
 * Breaks text into unigrams (words), bigrams (2 words), and trigrams (3 words) to capture context.
 * "Artificial Intelligence" becomes ["artificial", "intelligence", "artificial intelligence"]
 */
export class NGramTokenizer {
  constructor(stopWordsSet) {
    this.stopWords = stopWordsSet || new Set();
    this.stemmer = new PorterStemmer();
  }

  tokenize(text) {
    if (!text) return [];
    
    // 1. Clean and normalize
    const cleanText = text.replace(/&[a-z0-9#]+;/gi, ' ')
                         .replace(/<[^>]*>?/gm, ' ')
                         .toLowerCase()
                         .replace(/[^\w\s]|_/g, " ")
                         .replace(/\s+/g, " ");

    const rawWords = cleanText.split(' ').map(w => w.trim()).filter(w => w.length > 2 && !this.stopWords.has(w));
    const stemmedWords = rawWords.map(w => this.stemmer.stem(w));
    
    const tokens = [...stemmedWords]; // Start with unigrams

    // 2. Generate Bigrams (2-word combinations)
    for (let i = 0; i < stemmedWords.length - 1; i++) {
      tokens.push(`${stemmedWords[i]} ${stemmedWords[i+1]}`);
    }

    // 3. Generate Trigrams (3-word combinations)
    for (let i = 0; i < stemmedWords.length - 2; i++) {
      tokens.push(`${stemmedWords[i]} ${stemmedWords[i+1]} ${stemmedWords[i+2]}`);
    }

    return tokens;
  }
}

/**
 * BM25 (Best Matching 25) Probabilistic Scoring
 * The gold standard in information retrieval functions.
 * Calculates the relevance of a document to a search query/profile based on Term Frequency (TF) 
 * and Inverse Document Frequency (IDF), normalized by document length.
 * 
 * Score(D,Q) = sum( IDF(qi) * (f(qi,D) * (k1 + 1)) / (f(qi,D) + k1 * (1 - b + b * (|D| / avgdl))) )
 */
export class BM25 {
  constructor(k1 = 1.5, b = 0.75) {
    this.k1 = k1; // Term saturation parameter (usually 1.2 - 2.0)
    this.b = b;   // Length normalization parameter (0.75 is standard)
  }

  // Calculate score for a single term in a document
  scoreTerm(tf, docLength, avgDocLength, idf) {
    const numerator = tf * (this.k1 + 1);
    const denominator = tf + this.k1 * (1 - this.b + this.b * (docLength / avgDocLength));
    return idf * (numerator / denominator);
  }

  // Estimated IDF (Inverse Document Frequency)
  // Since we don't scan the whole DB every time, we estimate IDF based on 'rarity'.
  // Longer words and non-common words are assumed to have higher IDF.
  estimateIDF(term) {
    // Heuristic: Rare words are usually longer or contain rarer characters (z, x, q)
    // In a real search engine, this comes from the inverted index.
    // Here we simulate it to maintain pure mathematical reliance without DB lookups.
    let score = Math.log(1 + term.length); 
    if (term.includes(' ')) score *= 1.5; // N-grams are rarer
    return score;
  }
}

// =================================================================================================
//  MODULE 2: VECTOR SPACE MATHEMATICS (The Occipital Lobe)
//  High-precision linear algebra for calculating semantic distance in multi-dimensional space.
//  Implements: Cosine Similarity, Euclidean Distance, Pearson Correlation, and Jaccard Index.
// =================================================================================================
export class VectorMath {
  /**
   * Converts two sparse map objects into aligned dense vectors for computation.
   * @param {Object} mapA - First vector (e.g., {"ai": 5, "code": 2})
   * @param {Object} mapB - Second vector (e.g., {"ai": 1, "data": 3})
   * @returns {Array} [vecA, vecB] - Aligned arrays of values
   */
  static align(mapA, mapB) {
    const keys = new Set([...Object.keys(mapA), ...Object.keys(mapB)]);
    const vecA = [];
    const vecB = [];
    
    for (const key of keys) {
      vecA.push(mapA[key] || 0);
      vecB.push(mapB[key] || 0);
    }
    return [vecA, vecB];
  }

  /**
   * Cosine Similarity
   * Measures the cosine of the angle between two non-zero vectors.
   * Useful for text analysis as it is magnitude-invariant (length of document doesn't bias score).
   * Formula: (A . B) / (||A|| * ||B||)
   */
  static cosineSimilarity(mapA, mapB) {
    const [vecA, vecB] = this.align(mapA, mapB);
    
    let dotProduct = 0;
    let magA = 0;
    let magB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      magA += vecA[i] * vecA[i];
      magB += vecB[i] * vecB[i];
    }
    
    magA = Math.sqrt(magA);
    magB = Math.sqrt(magB);
    
    if (magA === 0 || magB === 0) return 0;
    return dotProduct / (magA * magB);
  }

  /**
   * Euclidean Distance
   * Measures the straight-line distance between two points in vector space.
   * Useful for detecting absolute differences in intensity/frequency.
   * Formula: sqrt(sum((Ai - Bi)^2))
   */
  static euclideanDistance(mapA, mapB) {
    const [vecA, vecB] = this.align(mapA, mapB);
    
    let sumSq = 0;
    for (let i = 0; i < vecA.length; i++) {
      const diff = vecA[i] - vecB[i];
      sumSq += diff * diff;
    }
    
    return Math.sqrt(sumSq);
  }

  /**
   * Pearson Correlation Coefficient
   * Measures linear correlation between two sets of data.
   * Range: [-1, 1]. 1 is perfect positive correlation, -1 is perfect negative.
   * Useful for detecting if User A's tastes move in the same direction as User B's.
   */
  static pearsonCorrelation(mapA, mapB) {
    const [vecA, vecB] = this.align(mapA, mapB);
    const n = vecA.length;
    if (n === 0) return 0;

    let sumA = 0, sumB = 0;
    let sumAsq = 0, sumBsq = 0;
    let pSum = 0;

    for (let i = 0; i < n; i++) {
      sumA += vecA[i];
      sumB += vecB[i];
      sumAsq += vecA[i] ** 2;
      sumBsq += vecB[i] ** 2;
      pSum += vecA[i] * vecB[i];
    }

    const num = pSum - (sumA * sumB / n);
    const den = Math.sqrt((sumAsq - sumA ** 2 / n) * (sumBsq - sumB ** 2 / n));

    if (den === 0) return 0;
    return num / den;
  }

  /**
   * Jaccard Similarity Coefficient
   * Measures similarity between finite sample sets (intersection over union).
   * Ideal for comparing sets of tags or binary features (read vs not read).
   * Formula: |A n B| / |A u B|
   */
  static jaccardIndex(setA, setB) {
    // Treat maps as sets of keys if passed as objects
    const keysA = new Set(Array.isArray(setA) ? setA : Object.keys(setA || {}));
    const keysB = new Set(Array.isArray(setB) ? setB : Object.keys(setB || {}));
    
    if (keysA.size === 0 && keysB.size === 0) return 1; // Both empty = identical
    
    let intersection = 0;
    for (const k of keysA) {
      if (keysB.has(k)) intersection++;
    }
    
    const union = keysA.size + keysB.size - intersection;
    return intersection / union;
  }
}

// =================================================================================================
//  MODULE 3: TEMPORAL GRAVITY ENGINE (The Cerebellum)
//  Physics-based time decay and trending velocity calculations.
//  Models content lifecycle using Newton's Law of Cooling and Kinematic equations.
// =================================================================================================
export class TemporalGravity {
  constructor(decayConstant = 0.05, gravity = 9.8) {
    this.k = decayConstant; // Cooling rate
    this.g = gravity;       // Downward force on older content
  }

  /**
   * Newton's Law of Cooling
   * Models how "hot" content cools down over time.
   * T(t) = T_env + (T_initial - T_env) * e^(-kt)
   * 
   * @param {number} initialTemperature - Starting score (e.g., 100 or current engagement)
   * @param {number} ageInHours - Time elapsed since publication or last action
   * @param {number} k - Cooling constant (higher = faster cooling)
   * @returns {number} Current Temperature
   */
  static newtonianCooling(initialTemperature, ageInHours, k = 0.1) {
    const ambientTemperature = 0;
    // T(t) = Ta + (T0 - Ta)e^-kt
    return ambientTemperature + (initialTemperature - ambientTemperature) * Math.exp(-k * ageInHours);
  }

  /**
   * Hacker News Gravity Formula
   * A simpler, aggressive decay model optimized for fast-moving news feeds.
   * Score = (P - 1) / (T + 2)^G
   * 
   * @param {number} points - Engagement score
   * @param {number} hoursSinceSubmit - Age in hours
   * @param {number} gravity - Gravity factor (default 1.8)
   * @returns {number} Rank Score
   */
  static hackerNewsGravity(points, hoursSinceSubmit, gravity = 1.8) {
    // Add 2 hours to T to prevent division by zero and extreme bias for new items
    return (points - 1) / Math.pow((hoursSinceSubmit + 2), gravity);
  }

  /**
   * Reddit "Hot" Algorithm (Logarithmic scale)
   * Balances massive scores with recent time.
   * Score = log10(z) + (y * tS) / 45000
   * 
   * @param {number} ups - Upvotes/Likes
   * @param {number} downs - Downvotes/Dislikes
   * @param {Date} date - Publication date
   * @returns {number} Hot Score
   */
  static redditHot(ups, downs, date) {
    const s = ups - downs;
    const order = Math.log10(Math.max(Math.abs(s), 1));
    let sign = 0;
    if (s > 0) sign = 1;
    else if (s < 0) sign = -1;
    
    // 1134028003 is the Reddit epoch (Dec 8, 2005)
    const seconds = (date.getTime() / 1000) - 1134028003; 
    return order + (sign * seconds) / 45000;
  }

  /**
   * Velocity (1st Derivative of Engagement)
   * v = Δx / Δt
   * Calculates how fast engagement is growing.
   */
  static calculateVelocity(currentScore, previousScore, timeDeltaHours) {
    if (timeDeltaHours === 0) return 0;
    return (currentScore - previousScore) / timeDeltaHours;
  }

  /**
   * Acceleration (2nd Derivative of Engagement)
   * a = Δv / Δt
   * Calculates if a trend is accelerating (Viral) or decelerating (Plateau).
   * Positive acceleration means the trend is exploding.
   * Negative acceleration means the trend is cooling off.
   */
  static calculateAcceleration(currentVelocity, previousVelocity, timeDeltaHours) {
    if (timeDeltaHours === 0) return 0;
    return (currentVelocity - previousVelocity) / timeDeltaHours;
  }

  /**
   * Wilson Score Interval (Bernoulli Parameter Confidence)
   * Used for sorting items by "Quality" with low data (e.g. 5 stars from 1 user vs 4.8 from 100).
   * Calculates the lower bound of the confidence interval.
   * 
   * @param {number} positive - Number of positive ratings (likes/reads)
   * @param {number} total - Total number of ratings (views)
   * @param {number} confidence - Z-score (1.96 for 95%)
   */
  static wilsonScore(positive, total, confidence = 1.96) {
    if (total === 0) return 0;
    const phat = positive / total;
    const z2 = confidence * confidence;
    
    const numerator = phat + z2 / (2 * total) - confidence * Math.sqrt((phat * (1 - phat) + z2 / (4 * total)) / total);
    const denominator = 1 + z2 / total;
    
    return numerator / denominator;
  }
}

// =================================================================================================
//  MODULE 4: COLLABORATIVE FILTERING & USER CLUSTERING (The Parietal Lobe)
//  Social signal processing to find "Tribes" of similar users.
//  Implements: K-Nearest Neighbors (KNN), Look-alike Modeling, and Taste Prediction.
// =================================================================================================
export class CollaborativeBrain {
  constructor() {
    this.similarityCache = new Map(); // Optimization: Cache user-user similarities
  }

  /**
   * Calculate similarity between two user profiles.
   * Uses a hybrid of Jaccard Index (for shared articles) and Cosine Similarity (for shared topics).
   * 
   * @param {Object} userA - { interaction_history, lexical_history }
   * @param {Object} userB - { interaction_history, lexical_history }
   * @returns {number} Similarity score (0 to 1)
   */
  static calculateUserSimilarity(userA, userB) {
    if (!userA || !userB) return 0;

    // 1. Interaction Similarity (Did they read the same things?)
    // We look at the set of article slugs they both interacted with.
    const historyA = userA.interaction_history ? JSON.parse(userA.interaction_history) : {};
    const historyB = userB.interaction_history ? JSON.parse(userB.interaction_history) : {};
    
    const slugsA = Object.keys(historyA);
    const slugsB = Object.keys(historyB);
    
    const interactionScore = VectorMath.jaccardIndex(slugsA, slugsB);

    // 2. Lexical Similarity (Do they like the same topics?)
    // We compare their "Ghost Profiles" (keyword matrices).
    const lexicalA = userA.lexical_history ? JSON.parse(userA.lexical_history) : {};
    const lexicalB = userB.lexical_history ? JSON.parse(userB.lexical_history) : {};
    
    const topicScore = VectorMath.cosineSimilarity(lexicalA, lexicalB);

    // Weighted Hybrid Score
    // Interaction is explicit (stronger signal), Topic is implicit (broader signal).
    // We give Interaction 60% weight, Topic 40% weight.
    return (interactionScore * 0.6) + (topicScore * 0.4);
  }

  /**
   * K-Nearest Neighbors (KNN)
   * Finds the 'k' users most similar to the target user.
   * O(n) complexity - effectively scans the "Village" to find the user's "Tribe".
   * 
   * @param {Object} targetUser - The user we are recommending for
   * @param {Array} communityUsers - Array of other user session objects
   * @param {number} k - Number of neighbors to find (default 20)
   * @returns {Array} List of { user, score } sorted by similarity
   */
  static findNearestNeighbors(targetUser, communityUsers, k = 20) {
    const neighbors = [];

    for (const peer of communityUsers) {
      if (peer.session_id === targetUser.session_id) continue; // Don't compare to self

      const similarity = CollaborativeBrain.calculateUserSimilarity(targetUser, peer);
      
      // Threshold: Only consider meaningful connections (> 10% similarity)
      if (similarity > 0.1) {
        neighbors.push({ user: peer, score: similarity });
      }
    }

    // Sort by descending similarity and pick top k
    return neighbors.sort((a, b) => b.score - a.score).slice(0, k);
  }

  /**
   * Predictive Rating (User-Based Collaborative Filtering)
   * Predicts how much 'targetUser' will like 'articleSlug' based on their neighbors.
   * Formula: Predicted Rating = Sum(NeighborSimilarity * NeighborRating) / Sum(NeighborSimilarity)
   * 
   * @param {string} articleSlug - The article to predict for
   * @param {Array} neighbors - Result from findNearestNeighbors
   * @returns {number} Predicted Interest Score (0 to 1)
   */
  static predictInterest(articleSlug, neighbors) {
    let weightedSum = 0;
    let similaritySum = 0;

    for (const { user, score } of neighbors) {
      const history = user.interaction_history ? JSON.parse(user.interaction_history) : {};
      const interaction = history[articleSlug];

      if (interaction) {
        // Calculate "Implicit Rating" from interaction metrics
        // View = 1, Read = 2, Share = 3. Capped at 3.
        let rating = 0;
        if (interaction.shares) rating = 3;
        else if (interaction.reads) rating = 2;
        else if (interaction.views) rating = 1;

        // Normalize rating to 0-1 range (approx)
        const normalizedRating = Math.min(1, rating / 3);

        weightedSum += (score * normalizedRating);
        similaritySum += score;
      }
    }

    if (similaritySum === 0) return 0;
    return weightedSum / similaritySum;
  }

  /**
   * Look-alike Audience Generator
   * Identifies users who haven't seen a specific article but share traits with those who liked it.
   * Useful for "You might also like" or targeted content injection.
   * 
   * @param {string} articleSlug - The content we want to find an audience for
   * @param {Array} allUsers - The entire user base
   * @returns {Array} List of users who are high-probability candidates
   */
  static generateLookalikeAudience(articleSlug, allUsers) {
    // 1. Find the "Seed Audience" (Users who already engaged with this article)
    const seedUsers = allUsers.filter(u => {
      const h = u.interaction_history ? JSON.parse(u.interaction_history) : {};
      return h[articleSlug] && (h[articleSlug].reads > 0 || h[articleSlug].shares > 0);
    });

    if (seedUsers.length === 0) return [];

    // 2. Build a "Composite Profile" of the seed audience
    // Average out their lexical vectors to find the "Soul" of the ideal reader.
    const compositeLexical = {};
    for (const u of seedUsers) {
      const lex = u.lexical_history ? JSON.parse(u.lexical_history) : {};
      for (const [word, count] of Object.entries(lex)) {
        compositeLexical[word] = (compositeLexical[word] || 0) + count;
      }
    }

    // 3. Scan all OTHER users to find matches to this Composite Profile
    const candidates = [];
    for (const u of allUsers) {
      // Skip if they already read it
      const h = u.interaction_history ? JSON.parse(u.interaction_history) : {};
      if (h[articleSlug]) continue; 

      const lex = u.lexical_history ? JSON.parse(u.lexical_history) : {};
      const similarity = VectorMath.cosineSimilarity(compositeLexical, lex);

      if (similarity > 0.3) { // Strict threshold for look-alikes
        candidates.push({ user: u, score: similarity });
      }
    }

    return candidates.sort((a, b) => b.score - a.score);
  }
}

// =================================================================================================
//  MODULE 5: CONTENT DEPTH & FAIRNESS METRICS (The Frontal Lobe)
//  Algorithms to measure the "IQ" and information density of content.
//  Implements: Flesch-Kincaid Readability, Shannon Entropy, and Information Gain.
// =================================================================================================
export class ContentIQ {
  /**
   * Count syllables in a word (Heuristic)
   * Essential for readability formulas.
   */
  static countSyllables(word) {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const syllables = word.match(/[aeiouy]{1,2}/g);
    return syllables ? syllables.length : 1;
  }

  /**
   * Flesch-Kincaid Grade Level
   * Returns the US school grade level required to understand the text.
   * Formula: 0.39 * (words/sentences) + 11.8 * (syllables/words) - 15.59
   */
  static calculateGradeLevel(text) {
    if (!text) return 0;
    const sentences = text.split(/[.!?]+/).length || 1;
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length || 1;
    let syllableCount = 0;
    
    for (const w of words) {
      syllableCount += this.countSyllables(w);
    }

    const score = (0.39 * (wordCount / sentences)) + (11.8 * (syllableCount / wordCount)) - 15.59;
    return Math.max(0, Math.min(score, 20)); // Clamp between 0 and 20 (PhD level)
  }

  /**
   * Flesch Reading Ease
   * Returns a score from 0-100 (100 = very easy, 0 = impossible).
   * Formula: 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
   */
  static calculateReadingEase(text) {
    if (!text) return 0;
    const sentences = text.split(/[.!?]+/).length || 1;
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length || 1;
    let syllableCount = 0;
    
    for (const w of words) {
      syllableCount += this.countSyllables(w);
    }

    const score = 206.835 - (1.015 * (wordCount / sentences)) - (84.6 * (syllableCount / wordCount));
    return Math.max(0, Math.min(score, 100));
  }

  /**
   * Shannon Entropy (Information Density)
   * Measures the "unpredictability" or richness of the text.
   * Higher entropy often correlates with deeper, more complex analysis vs repetitive filler.
   * H(X) = -sum(p(x) * log2(p(x)))
   */
  static calculateEntropy(text) {
    if (!text) return 0;
    const len = text.length;
    const frequencies = {};
    
    for (let i = 0; i < len; i++) {
      const char = text.charAt(i);
      frequencies[char] = (frequencies[char] || 0) + 1;
    }

    let entropy = 0;
    for (const count of Object.values(frequencies)) {
      const p = count / len;
      entropy -= p * Math.log2(p);
    }

    return entropy;
  }
}

// =================================================================================================
//  THE LEXICAL PARSER (Poor Man's NLP)
const STOP_WORDS = new Set([
  'a','about','above','after','again','against','all','am','an','and','any','are','aren','as','at','be','because','been','before','being','below','between','both','but','by','can','cannot','could','did','didn','do','does','doesn','doing','don','down','during','each','few','for','from','further','had','hadn','has','hasn','have','haven','having','he','her','here','hers','herself','him','himself','his','how','i','if','in','into','is','isn','it','its','itself','me','more','most','must','my','myself','no','nor','not','of','off','on','once','only','or','other','ought','our','ours','ourselves','out','over','own','same','shan','she','should','shouldn','so','some','such','than','that','the','their','theirs','them','themselves','then','there','these','they','this','those','through','to','too','under','until','up','very','was','wasn','we','were','weren','what','when','where','which','while','who','whom','why','will','with','won','would','wouldn','you','your','yours','yourself','yourselves', 'div', 'class', 'span', 'p', 'br', 'strong', 'em', 'img', 'src', 'href'
]);

export function generateLexicalMatrix(text) {
  if (!text) return '{}';
  
  // USE MODULE 1: Advanced Lexical Engine
  const tokenizer = new NGramTokenizer(STOP_WORDS);
  const tokens = tokenizer.tokenize(text);
  
  const matrix = {};
  for (const token of tokens) {
    matrix[token] = (matrix[token] || 0) + 1;
  }
  
  // Keep top 50 "Heaviest" tokens to save database space
  // This now includes stemmed words (run vs running) AND N-Grams (artificial intelligence)
  const sortedTokens = Object.entries(matrix)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50);
    
  const finalMatrix = {};
  sortedTokens.forEach(([token, count]) => { finalMatrix[token] = count; });
  
  return JSON.stringify(finalMatrix);
}

// Helper to compare two lexical matrices and return a similarity score (0 to 1)
export function compareMatrices(matrixStr1, matrixStr2) {
  if (!matrixStr1 || !matrixStr2) return 0;
  try {
    const m1 = typeof matrixStr1 === 'string' ? JSON.parse(matrixStr1) : matrixStr1;
    const m2 = typeof matrixStr2 === 'string' ? JSON.parse(matrixStr2) : matrixStr2;
    
    // USE MODULE 2: Vector Space Mathematics
    // We use Cosine Similarity for the most accurate angle-based text comparison
    return VectorMath.cosineSimilarity(m1, m2);
  } catch (e) {
    return 0;
  }
}

export class RecommendationEngine {
  constructor(articles) {
    this.articles = articles || [];
  }

  // =================================================================================================
  //  THE SENSORY CORTEX (Data Retrieval)
  // =================================================================================================
  static async fetchCandidates(env, limit = 100, searchQuery = null) {
    let results = [];
    
    // 1. Base Query parts
    // We select standard fields + The Lexical Matrix + Global Metrics (Smashed from User Sessions)
    // The 'articles' table now holds the source of truth for global stats after the Background Smash Job runs.
    const selectClause = `
      SELECT a.slug, a.title, a.subtitle, a.author, a.published_at, a.read_time_minutes, a.image_url, a.tags, a.seo_description, a.lexical_matrix,
             COALESCE(a.engagement_score, 0) as engagement_score,
             COALESCE(a.avg_time_spent, 0) as avg_time_spent,
             COALESCE(a.total_views, 0) as _raw_views
      FROM articles a
    `;

    // 2. Handle Search / Filtering
    if (searchQuery) {
      // search across multiple fields
      const q = searchQuery.trim();
      const wildcard = `%${q.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
      
      const whereClause = `
        WHERE (
          a.title LIKE ? ESCAPE '\\' OR
          a.subtitle LIKE ? ESCAPE '\\' OR
          a.seo_description LIKE ? ESCAPE '\\' OR
          a.content_html LIKE ? ESCAPE '\\' OR
          a.tags LIKE ? ESCAPE '\\' OR
          a.image_url LIKE ? ESCAPE '\\' OR
          a.image_alt LIKE ? ESCAPE '\\' OR
          a.content_html LIKE ? ESCAPE '\\'
        )
      `;
      
      const sql = `${selectClause} ${whereClause} ORDER BY a.published_at DESC LIMIT ?`;
      
      const { results: raw } = await env.DB.prepare(sql)
        .bind(wildcard, wildcard, wildcard, wildcard, wildcard, wildcard, wildcard, wildcard, limit)
        .all();
      results = raw;

    } else {
      // Standard Fetch (Latest)
      const sql = `${selectClause} ORDER BY a.published_at DESC LIMIT ?`;
      const { results: raw } = await env.DB.prepare(sql).bind(limit).all();
      results = raw;
    }

    return results;
  }

  // =================================================================================================
  //  THE SMASHER (Global Data Aggregation)
  //  This function simulates a "MapReduce" job. It reads ALL user sessions, smashes their
  //  interaction histories together, and calculates the new global truth for every article.
  //  It then updates the 'articles' table directly.
  //  NOTE: This should be run via a Cron Trigger (Scheduled Event) periodically.
  // =================================================================================================
  static async aggregateGlobalMetrics(env) {
    // 1. Fetch ALL user sessions (In production, use pagination/cursor)
    // Fix: Added is_aggregated = 0 to prevent the Cron Job from processing the same rows indefinitely
    const { results: sessions } = await env.DB.prepare(`
      SELECT session_id, interaction_history FROM algo_user_sessions 
      WHERE last_seen_at > datetime('now', '-7 days') AND is_aggregated = 0
      LIMIT 1000
    `).all();

    const globalStats = {};

    // 2. SMASH (Map Phase)
    for (const session of sessions) {
      if (!session.interaction_history) continue;
      
      try {
        const history = JSON.parse(session.interaction_history);
        for (const [slug, metrics] of Object.entries(history)) {
          if (!globalStats[slug]) {
            globalStats[slug] = { views: 0, reads: 0, shares: 0, time_spent: 0 };
          }
          
          globalStats[slug].views += (metrics.views || 0);
          globalStats[slug].reads += (metrics.reads || 0);
          globalStats[slug].shares += (metrics.shares || 0);
          globalStats[slug].time_spent += (metrics.time_spent || 0);
        }
      } catch (e) { /* skip corrupt data */ }
    }

    // 3. REDUCE & UPDATE (Reduce Phase)
    // We update the articles table one by one (or batch if possible)
    const stmt = env.DB.prepare(`
      UPDATE articles SET 
        total_views = ?,
        total_reads = ?,
        total_shares = ?,
        avg_time_spent = ?,
        engagement_score = ?
      WHERE slug = ?
    `);

    const batch = [];

    for (const [slug, stats] of Object.entries(globalStats)) {
       // Calculate derived metrics
       const avgTime = stats.views > 0 ? (stats.time_spent / stats.views) : 0;
       
       // Calculate Score using the Centralized Weights
       const score = (stats.views * SCORING_WEIGHTS.VIEW) + 
                     (stats.reads * SCORING_WEIGHTS.READ) + 
                     (stats.shares * SCORING_WEIGHTS.SHARE) +
                     (avgTime * SCORING_WEIGHTS.TIME_SPENT_FACTOR);

       batch.push(stmt.bind(
         stats.views, 
         stats.reads, 
         stats.shares, 
         avgTime, 
         score, 
         slug
       ));
    }

    // Fix: Mark the processed sessions as aggregated so they aren't computed again
    const sessionStmt = env.DB.prepare(`UPDATE algo_user_sessions SET is_aggregated = 1 WHERE session_id = ?`);
    for (const session of sessions) {
      batch.push(sessionStmt.bind(session.session_id));
    }

    // Execute bulk update
    // D1 supports batch execution which is much faster
    if (batch.length > 0) {
      // Split into chunks of 100 to avoid limits
      for (let i = 0; i < batch.length; i += 100) {
        await env.DB.batch(batch.slice(i, i + 100));
      }
    }

    return { updated_articles: batch.length };
  }

  // =================================================================================================
  //  THE FRONTAL CORTEX (Decision Making)
  // =================================================================================================
  
  // Calculates trending score based on time, depth, and engagement metrics
  _calculateTrendingScore(article) {
    // 1. Content Depth (The "IQ" Score)
    // We use Flesch-Kincaid and Entropy to reward intellectually dense content.
    const text = article.content_html ? article.content_html.replace(/<[^>]*>?/gm, ' ') : (article.description || '');
    const gradeLevel = ContentIQ.calculateGradeLevel(text);
    const entropy = ContentIQ.calculateEntropy(text);
    const fairTime = calculateFairReadingTime(article.content_html); // Basic physical length
    
    // Base IQ Score (0-50 points)
    let iqScore = (gradeLevel * 1.5) + (entropy * 5); 
    iqScore = Math.min(50, iqScore); // Cap at 50

    // 2. Physics-based Decay (Temporal Gravity)
    // We calculate "Heat" using Newton's Law of Cooling.
    let heatScore = 0;
    if (article.engagement_score) {
       const pubDate = new Date(article.published_at || Date.now());
       const hoursOld = Math.max(0, (Date.now() - pubDate) / (1000 * 60 * 60));
       
       // Initial Temp = Engagement Score. Environment Temp = 0. Cooling Rate = 0.05.
       heatScore = TemporalGravity.newtonianCooling(article.engagement_score, hoursOld, 0.05);
       
       // Boost with Velocity (Momentum)
       if (article.trending_velocity) {
          heatScore += (article.trending_velocity * 25); // High momentum bonus
       }
    }

    // 3. The "Sticky" Factor (Retention Rate)
    let retentionScore = 0;
    if (article.avg_time_spent && fairTime > 0) {
       const completionRate = Math.min(1.5, article.avg_time_spent / fairTime);
       if (completionRate > 0.8) retentionScore = 30;
       else if (completionRate < 0.2) retentionScore = -20; // Penalty for clickbait
    }

    // Final Composite Score
    return heatScore + iqScore + retentionScore;
  }

  // Get trending articles
  getTrending(limit = 5, excludeSlug = null) {
    let candidates = this.articles;
    
    if (excludeSlug) {
      candidates = candidates.filter(a => a.slug !== excludeSlug);
    }

    return candidates
      .map(article => ({
        ...article,
        _trendingScore: this._calculateTrendingScore(article)
      }))
      .sort((a, b) => b._trendingScore - a._trendingScore)
      .slice(0, limit);
  }

  // Get recommended articles for a specific user context or article context
  getRecommended(contextArticle = null, limit = 3, userSessionMatrix = null) {
    let candidates = this.articles;

    // Parse the user's lexical matrix once
    const parsedUserMatrix = userSessionMatrix ? 
        (typeof userSessionMatrix === 'string' ? JSON.parse(userSessionMatrix) : userSessionMatrix) : null;

    if (contextArticle) {
      // Exclude the current article
      candidates = candidates.filter(a => a.slug !== contextArticle.slug);
      
      // Parse context matrix once
      const parsedContextMatrix = contextArticle.lexical_matrix ? 
        (typeof contextArticle.lexical_matrix === 'string' ? JSON.parse(contextArticle.lexical_matrix) : contextArticle.lexical_matrix) : null;

      // Calculate relevance score using the 3-Tier Priority System with ADVANCED MODULES
      return candidates.map(article => {
        let relevance = 0;
        
        // Parse candidate matrix
        const parsedArticleMatrix = article.lexical_matrix ? 
          (typeof article.lexical_matrix === 'string' ? JSON.parse(article.lexical_matrix) : article.lexical_matrix) : null;

        // =====================================================================
        // TIER 1: CONTENT MATCH (Vector Space Math) - 40% Weight
        // =====================================================================
        let contentScore = 0;
        
        // Exact Author Match
        if (contextArticle.author && article.author === contextArticle.author) {
          contentScore += 15;
        }

        // Vector Cosine Similarity (Replacing simple tag match)
        // Uses the high-dimensional lexical vectors generated by Module 1
        if (parsedContextMatrix && parsedArticleMatrix) {
           const cosineSim = VectorMath.cosineSimilarity(parsedContextMatrix, parsedArticleMatrix);
           contentScore += (cosineSim * 100); // 0-1 scale mapped to 0-100 points
        }
        
        // Cap Content Score at its defined weight
        relevance += Math.min(SCORING_WEIGHTS.TIER_1_CONTENT_MATCH, contentScore);

        // =====================================================================
        // TIER 2: SESSION HABIT (User Vector Alignment) - 35% Weight
        // =====================================================================
        let sessionScore = 0;
        
        if (parsedUserMatrix && parsedArticleMatrix) {
           // We use Pearson Correlation here to see if the user's taste "trends" with this article
           // Pearson is good for implicit ratings in sparse data
           const correlation = VectorMath.pearsonCorrelation(parsedUserMatrix, parsedArticleMatrix);
           // Correlation is -1 to 1. We map it to 0-1.
           const normalizedCorr = (correlation + 1) / 2;
           sessionScore += (normalizedCorr * 100);
        } else {
           // Fallback: Use Newtonian Cooling Recency if we don't know the user
           const pubDate = new Date(article.published_at || Date.now());
           const hoursOld = Math.max(0, (Date.now() - pubDate) / (1000 * 60 * 60));
           const temp = TemporalGravity.newtonianCooling(100, hoursOld, 0.02); // Slower cooling for general recency
           sessionScore += Math.max(0, temp);
        }

        relevance += Math.min(SCORING_WEIGHTS.TIER_2_SESSION_HABIT, sessionScore);

        // =====================================================================
        // TIER 3: WORLDWIDE VOTE (Physics-based Gravity) - 25% Weight
        // =====================================================================
        let worldScore = 0;
        
        if (article.engagement_score) {
          const pubDate = new Date(article.published_at || Date.now());
          const hoursOld = Math.max(0, (Date.now() - pubDate) / (1000 * 60 * 60));
          
          // Use Hacker News Gravity for the worldwide vote
          // This ensures that even high-engagement items eventually fall off the feed
          const gravityScore = TemporalGravity.hackerNewsGravity(article.engagement_score, hoursOld, 1.8);
          
          worldScore += Math.min(100, gravityScore * 10); // Scale up for the point system
        }

        relevance += Math.min(SCORING_WEIGHTS.TIER_3_WORLDWIDE_VOTE, worldScore);

        // Final Assignment
        return { ...article, _relevance: relevance };
      })
      .sort((a, b) => b._relevance - a._relevance)
      .slice(0, limit);
    }

    // Default recommendation if no context (just return top trending basically, or a mix)
    return this.getTrending(limit);
  }

  /**
   * COLLABORATIVE DISCOVERY FEED (The "Tribe" Feed)
   * Uses CollaborativeBrain to find articles liked by users similar to the current user.
   * 
   * @param {Object} currentUser - Full user session object {session_id, lexical_history, ...}
   * @param {Array} communityUsers - List of other user session objects (from DB)
   * @param {number} limit - Number of articles to return
   */
  getCollaborativeFeed(currentUser, communityUsers, limit = 5) {
    if (!currentUser || !communityUsers || communityUsers.length === 0) return [];

    // 1. Find User's Tribe (Nearest Neighbors)
    const neighbors = CollaborativeBrain.findNearestNeighbors(currentUser, communityUsers, 20);
    if (neighbors.length === 0) return [];

    // 2. Identify Potential Articles (Things neighbors read but user hasn't)
    const candidates = new Set();
    const userHistory = currentUser.interaction_history ? JSON.parse(currentUser.interaction_history) : {};
    
    for (const { user } of neighbors) {
      const h = user.interaction_history ? JSON.parse(user.interaction_history) : {};
      for (const slug of Object.keys(h)) {
        if (!userHistory[slug]) { // User hasn't seen it
           candidates.add(slug);
        }
      }
    }

    // 3. Score Candidates using Predictive Rating
    const scoredCandidates = [];
    for (const slug of candidates) {
      const article = this.articles.find(a => a.slug === slug);
      if (!article) continue;

      const predictedInterest = CollaborativeBrain.predictInterest(slug, neighbors);
      
      // We combine the Peer Prediction (Social) with the Content Match (Personal)
      // Peer Prediction is 0-1. We scale to 0-100.
      let socialScore = predictedInterest * 100;
      
      // Add a touch of the User's Personal Taste (Content Match)
      // This prevents recommending popular but irrelevant stuff (e.g. specialized sports to a tech reader)
      let personalScore = 0;
      const parsedUserMatrix = currentUser.lexical_history ? 
          (typeof currentUser.lexical_history === 'string' ? JSON.parse(currentUser.lexical_history) : currentUser.lexical_history) : null;
      const parsedArticleMatrix = article.lexical_matrix ? 
          (typeof article.lexical_matrix === 'string' ? JSON.parse(article.lexical_matrix) : article.lexical_matrix) : null;

      if (parsedUserMatrix && parsedArticleMatrix) {
         personalScore = VectorMath.cosineSimilarity(parsedUserMatrix, parsedArticleMatrix) * 50; 
      }

      scoredCandidates.push({
        ...article,
        _socialScore: socialScore + personalScore
      });
    }

    return scoredCandidates
      .sort((a, b) => b._socialScore - a._socialScore)
      .slice(0, limit);
  }

  // Get standard feed (Latest)
  getLatest(limit = null) {
    const sorted = [...this.articles].sort((a, b) => {
      const dateA = new Date(a.published_at || 0);
      const dateB = new Date(b.published_at || 0);
      return dateB - dateA;
    });

    return limit ? sorted.slice(0, limit) : sorted;
  }
}