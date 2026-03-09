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
// =================================================================================================
export const SESSION_PROFILE_SCHEMA = [
  'session_id', 'first_seen_at', 'last_seen_at', 
  'total_interactions', 'total_time_spent',
  'user_agent', 'platform', 'language', 'referrer', 
  'screen_width', 'screen_height', 'window_width', 'window_height',
  'timezone', 'connection_type', 'device_memory', 'hardware_concurrency',
  'lexical_history', 
  'interaction_history',
  'is_aggregated'
];

// =================================================================================================
//  THE FAIRNESS METRIC (Content Depth Analyzer)
// =================================================================================================
export function calculateFairReadingTime(htmlContent) {
  if (!htmlContent) return 60; // 1 minute default

  const text = htmlContent.replace(/&[a-z0-9#]+;/gi, ' ').replace(/<[^>]*>?/gm, ' ');
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  let expectedSeconds = (wordCount / 200) * 60;

  const imageCount = (htmlContent.match(/<img[^>]+>/g) || []).length;
  expectedSeconds += (imageCount * 10);

  const videoCount = (htmlContent.match(/<iframe[^>]+>|<video[^>]+>/g) || []).length;
  expectedSeconds += (videoCount * 180);

  return Math.max(60, expectedSeconds); 
}

// =================================================================================================
//  MODULE 1: ADVANCED LEXICAL ENGINE (The Cortex)
// =================================================================================================

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

    if (w.endsWith("sses")) w = w.substr(0, w.length - 2);
    else if (w.endsWith("ies")) w = w.substr(0, w.length - 2);
    else if (w.endsWith("ss")) w = w;
    else if (w.endsWith("s")) w = w.substr(0, w.length - 1);

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

    if (w.endsWith("y") && this.containsVowel(w.substr(0, w.length - 1))) {
      w = w.substr(0, w.length - 1) + "i";
    }

    if (this.measure(w) > 0) {
      for (const [suffix, replacement] of Object.entries(this.step2list)) {
        if (w.endsWith(suffix)) {
          const stem = w.substr(0, w.length - suffix.length);
          if (this.measure(stem) > 0) w = stem + replacement;
          break;
        }
      }
    }

    if (this.measure(w) > 0) {
      for (const [suffix, replacement] of Object.entries(this.step3list)) {
        if (w.endsWith(suffix)) {
          const stem = w.substr(0, w.length - suffix.length);
          if (this.measure(stem) > 0) w = stem + replacement;
          break;
        }
      }
    }

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

    if (this.measure(w) > 1 && w.endsWith("e")) w = w.substr(0, w.length - 1);
    else if (this.measure(w) === 1 && !this.cvc(w) && w.endsWith("e")) w = w.substr(0, w.length - 1);

    if (this.measure(w) > 1 && this.endsWithDoubleConsonant(w) && w.endsWith("l")) w = w.substr(0, w.length - 1);

    if (firstChar === 'y') w = 'y' + w.substr(1);
    return w;
  }
}

export class NGramTokenizer {
  constructor(stopWordsSet) {
    this.stopWords = stopWordsSet || new Set();
    this.stemmer = new PorterStemmer();
  }

  tokenize(text) {
    if (!text) return [];
    
    const cleanText = text.replace(/&[a-z0-9#]+;/gi, ' ')
                         .replace(/<[^>]*>?/gm, ' ')
                         .toLowerCase()
                         .replace(/[^\w\s]|_/g, " ")
                         .replace(/\s+/g, " ");

    const rawWords = cleanText.split(' ').map(w => w.trim()).filter(w => w.length > 2 && !this.stopWords.has(w));
    const stemmedWords = rawWords.map(w => this.stemmer.stem(w));
    
    const tokens = [...stemmedWords];

    for (let i = 0; i < stemmedWords.length - 1; i++) {
      tokens.push(`${stemmedWords[i]} ${stemmedWords[i+1]}`);
    }

    for (let i = 0; i < stemmedWords.length - 2; i++) {
      tokens.push(`${stemmedWords[i]} ${stemmedWords[i+1]} ${stemmedWords[i+2]}`);
    }

    return tokens;
  }
}

export class BM25 {
  constructor(k1 = 1.5, b = 0.75) {
    this.k1 = k1; 
    this.b = b;   
  }

  scoreTerm(tf, docLength, avgDocLength, idf) {
    const numerator = tf * (this.k1 + 1);
    const denominator = tf + this.k1 * (1 - this.b + this.b * (docLength / avgDocLength));
    return idf * (numerator / denominator);
  }

  estimateIDF(term) {
    let score = Math.log(1 + term.length); 
    if (term.includes(' ')) score *= 1.5; 
    return score;
  }
}

// =================================================================================================
//  MODULE 2: VECTOR SPACE MATHEMATICS (The Occipital Lobe)
// =================================================================================================
export class VectorMath {
  static cosineSimilarity(mapA, mapB) {
    let dotProduct = 0;
    let magA = 0;
    let magB = 0;
    
    for (const key in mapA) {
      const valA = mapA[key];
      magA += valA * valA;
      if (mapB[key]) {
        dotProduct += valA * mapB[key];
      }
    }
    
    for (const key in mapB) {
      const valB = mapB[key];
      magB += valB * valB;
    }
    
    if (magA === 0 || magB === 0) return 0;
    return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  static euclideanDistance(mapA, mapB) {
    let sumSq = 0;
    
    for (const key in mapA) {
      const valA = mapA[key];
      const valB = mapB[key] || 0;
      const diff = valA - valB;
      sumSq += diff * diff;
    }
    
    for (const key in mapB) {
      if (mapA[key] === undefined) { 
        const valB = mapB[key];
        sumSq += valB * valB;
      }
    }
    
    return Math.sqrt(sumSq);
  }

  static pearsonCorrelation(mapA, mapB) {
    let sumA = 0, sumB = 0;
    let sumAsq = 0, sumBsq = 0;
    let pSum = 0;
    let n = 0;
    
    for (const key in mapA) {
      n++;
      const valA = mapA[key];
      const valB = mapB[key] || 0;
      
      sumA += valA;
      sumAsq += valA * valA;
      if (mapB[key] !== undefined) {
        sumB += valB;
        sumBsq += valB * valB;
        pSum += valA * valB;
      }
    }
    
    for (const key in mapB) {
      if (mapA[key] === undefined) {
        n++;
        const valB = mapB[key];
        sumB += valB;
        sumBsq += valB * valB;
      }
    }

    if (n === 0) return 0;

    const num = pSum - (sumA * sumB / n);
    const den = Math.sqrt((sumAsq - sumA ** 2 / n) * (sumBsq - sumB ** 2 / n));

    if (den === 0) return 0;
    return num / den;
  }

  static jaccardIndex(setA, setB) {
    const keysA = new Set(Array.isArray(setA) ? setA : Object.keys(setA || {}));
    const keysB = new Set(Array.isArray(setB) ? setB : Object.keys(setB || {}));
    
    if (keysA.size === 0 && keysB.size === 0) return 1; 
    
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
// =================================================================================================
export class TemporalGravity {
  static newtonianCooling(initialTemperature, ageInHours, k = 0.1) {
    const ambientTemperature = 0;
    return ambientTemperature + (initialTemperature - ambientTemperature) * Math.exp(-k * ageInHours);
  }

  static hackerNewsGravity(points, hoursSinceSubmit, gravity = 1.8) {
    return (points - 1) / Math.pow((hoursSinceSubmit + 2), gravity);
  }

  static redditHot(ups, downs, date) {
    const s = ups - downs;
    const order = Math.log10(Math.max(Math.abs(s), 1));
    let sign = 0;
    if (s > 0) sign = 1;
    else if (s < 0) sign = -1;
    
    const seconds = (date.getTime() / 1000) - 1134028003; 
    return order + (sign * seconds) / 45000;
  }

  static calculateVelocity(currentScore, previousScore, timeDeltaHours) {
    if (timeDeltaHours === 0) return 0;
    return (currentScore - previousScore) / timeDeltaHours;
  }

  static calculateAcceleration(currentVelocity, previousVelocity, timeDeltaHours) {
    if (timeDeltaHours === 0) return 0;
    return (currentVelocity - previousVelocity) / timeDeltaHours;
  }

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
// =================================================================================================
export class CollaborativeBrain {
  constructor() {
    this.similarityCache = new Map(); 
  }

  static calculateUserSimilarity(userA, userB) {
    if (!userA || !userB) return 0;

    const slugsA = Object.keys(userA.interaction_history || {});
    const slugsB = Object.keys(userB.interaction_history || {});
    
    const interactionScore = VectorMath.jaccardIndex(slugsA, slugsB);
    const topicScore = VectorMath.cosineSimilarity(userA.lexical_history || {}, userB.lexical_history || {});

    return (interactionScore * 0.6) + (topicScore * 0.4);
  }

  static findNearestNeighbors(targetUser, communityUsers, k = 20) {
    const neighbors = [];

    const targetProfile = {
      interaction_history: targetUser.interaction_history ? JSON.parse(targetUser.interaction_history) : {},
      lexical_history: targetUser.lexical_history ? JSON.parse(targetUser.lexical_history) : {}
    };

    for (const peer of communityUsers) {
      if (peer.session_id === targetUser.session_id) continue; 

      const peerProfile = {
        interaction_history: peer.interaction_history ? JSON.parse(peer.interaction_history) : {},
        lexical_history: peer.lexical_history ? JSON.parse(peer.lexical_history) : {}
      };

      const similarity = CollaborativeBrain.calculateUserSimilarity(targetProfile, peerProfile);
      
      if (similarity > 0.1) {
        neighbors.push({ user: peer, score: similarity, parsedProfile: peerProfile });
      }
    }

    return neighbors.sort((a, b) => b.score - a.score).slice(0, k);
  }

  static predictInterest(articleSlug, neighbors) {
    let weightedSum = 0;
    let similaritySum = 0;

    for (const { score, parsedProfile } of neighbors) {
      const interaction = parsedProfile.interaction_history ? parsedProfile.interaction_history[articleSlug] : null;

      if (interaction) {
        let rating = 0;
        if (interaction.shares) rating = 3;
        else if (interaction.reads) rating = 2;
        else if (interaction.views) rating = 1;

        const normalizedRating = Math.min(1, rating / 3);

        weightedSum += (score * normalizedRating);
        similaritySum += score;
      }
    }

    if (similaritySum === 0) return 0;
    return weightedSum / similaritySum;
  }

  static generateLookalikeAudience(articleSlug, allUsers) {
    const seedUsers = allUsers.filter(u => {
      const h = u.interaction_history ? JSON.parse(u.interaction_history) : {};
      return h[articleSlug] && (h[articleSlug].reads > 0 || h[articleSlug].shares > 0);
    });

    if (seedUsers.length === 0) return [];

    const compositeLexical = {};
    for (const u of seedUsers) {
      const lex = u.lexical_history ? JSON.parse(u.lexical_history) : {};
      for (const [word, count] of Object.entries(lex)) {
        compositeLexical[word] = (compositeLexical[word] || 0) + count;
      }
    }

    const candidates = [];
    for (const u of allUsers) {
      const h = u.interaction_history ? JSON.parse(u.interaction_history) : {};
      if (h[articleSlug]) continue; 

      const lex = u.lexical_history ? JSON.parse(u.lexical_history) : {};
      const similarity = VectorMath.cosineSimilarity(compositeLexical, lex);

      if (similarity > 0.3) { 
        candidates.push({ user: u, score: similarity });
      }
    }

    return candidates.sort((a, b) => b.score - a.score);
  }
}

// =================================================================================================
//  MODULE 5: CONTENT DEPTH & FAIRNESS METRICS (The Frontal Lobe)
// =================================================================================================
export class ContentIQ {
  static countSyllables(word) {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const syllables = word.match(/[aeiouy]{1,2}/g);
    return syllables ? syllables.length : 1;
  }

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
    return Math.max(0, Math.min(score, 20)); 
  }

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
//  THE LEXICAL PARSER
// =================================================================================================
const STOP_WORDS = new Set([
  'a','about','above','after','again','against','all','am','an','and','any','are','aren','as','at','be','because','been','before','being','below','between','both','but','by','can','cannot','could','did','didn','do','does','doesn','doing','don','down','during','each','few','for','from','further','had','hadn','has','hasn','have','haven','having','he','her','here','hers','herself','him','himself','his','how','i','if','in','into','is','isn','it','its','itself','me','more','most','must','my','myself','no','nor','not','of','off','on','once','only','or','other','ought','our','ours','ourselves','out','over','own','same','shan','she','should','shouldn','so','some','such','than','that','the','their','theirs','them','themselves','then','there','these','they','this','those','through','to','too','under','until','up','very','was','wasn','we','were','weren','what','when','where','which','while','who','whom','why','will','with','won','would','wouldn','you','your','yours','yourself','yourselves', 'div', 'class', 'span', 'p', 'br', 'strong', 'em', 'img', 'src', 'href'
]);

export function generateLexicalMatrix(text) {
  if (!text) return '{}';
  
  const tokenizer = new NGramTokenizer(STOP_WORDS);
  const tokens = tokenizer.tokenize(text);
  
  const matrix = {};
  for (const token of tokens) {
    matrix[token] = (matrix[token] || 0) + 1;
  }
  
  const sortedTokens = Object.entries(matrix)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50);
    
  const finalMatrix = {};
  sortedTokens.forEach(([token, count]) => { finalMatrix[token] = count; });
  
  return JSON.stringify(finalMatrix);
}

export function compareMatrices(matrixStr1, matrixStr2) {
  if (!matrixStr1 || !matrixStr2) return 0;
  try {
    const m1 = typeof matrixStr1 === 'string' ? JSON.parse(matrixStr1) : matrixStr1;
    const m2 = typeof matrixStr2 === 'string' ? JSON.parse(matrixStr2) : matrixStr2;
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
  //  THE LIVE PULSE (Real-Time Session Aggregator)
  //  Computes on-the-fly engagement scores from raw, un-aggregated sessions.
  //  This is the fallback brain when the Smasher (aggregateGlobalMetrics) hasn't run yet,
  //  which is why the algorithm was falling back to pure chronological order.
  // =================================================================================================
  static async computeLiveScoresFromSessions(env) {
    try {
      const { results: sessions } = await env.DB.prepare(`
        SELECT interaction_history FROM algo_user_sessions
        WHERE is_aggregated = 0
          AND interaction_history IS NOT NULL
          AND last_seen_at > datetime('now', '-7 days')
        LIMIT 2000
      `).all();

      const liveScores = {};

      for (const session of sessions) {
        try {
          const history = JSON.parse(session.interaction_history);
          for (const [slug, metrics] of Object.entries(history)) {
            if (!liveScores[slug]) {
              liveScores[slug] = { views: 0, reads: 0, shares: 0, time_spent: 0 };
            }
            liveScores[slug].views      += (metrics.views      || 0);
            liveScores[slug].reads      += (metrics.reads      || 0);
            liveScores[slug].shares     += (metrics.shares     || 0);
            liveScores[slug].time_spent += (metrics.time_spent || 0);
          }
        } catch (e) { /* skip malformed session rows */ }
      }

      // Compute derived scores the same way the Smasher does
      for (const slug of Object.keys(liveScores)) {
        const s = liveScores[slug];
        s.engagement_score =
          (s.views      * SCORING_WEIGHTS.VIEW)             +
          (s.reads      * SCORING_WEIGHTS.READ)             +
          (s.shares     * SCORING_WEIGHTS.SHARE)            +
          (s.time_spent * SCORING_WEIGHTS.TIME_SPENT_FACTOR);
        // Velocity mirrors what the Smasher writes: batchScore * 0.5
        s.trending_velocity = s.engagement_score * 0.5;
      }

      return liveScores;
    } catch (e) {
      console.error('[LivePulse] Failed to compute live scores:', e.message);
      return {};
    }
  }

  // =================================================================================================
  //  THE SENSORY CORTEX (Data Retrieval)
  // =================================================================================================
  static async fetchCandidates(env, limit = 100, searchQuery = null) {
    let results = [];
    
    const selectClause = `
      SELECT a.slug, a.title, a.subtitle, a.author, a.published_at, a.read_time_minutes, a.image_url, a.tags, a.seo_description, a.lexical_matrix,
             COALESCE(a.engagement_score, 0) as engagement_score,
             COALESCE(a.avg_time_spent, 0) as avg_time_spent,
             COALESCE(a.total_views, 0) as _raw_views
      FROM articles a
    `;

    if (searchQuery) {
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
      const sql = `${selectClause} ORDER BY a.engagement_score DESC, a.published_at DESC LIMIT 500`;
      const { results: raw } = await env.DB.prepare(sql).bind().all();
      results = raw;
    }

    // ----- LIVE PULSE HYDRATION -----
    // If the Smasher hasn't run yet (all engagement_scores are 0), the algorithm
    // would fall back to pure chronological order. This merges real-time session
    // data directly into the article objects so scoring always reflects true engagement.
    const allZero = results.every(a => !a.engagement_score || a.engagement_score === 0);
    if (allZero) {
      const liveScores = await RecommendationEngine.computeLiveScoresFromSessions(env);

      if (Object.keys(liveScores).length > 0) {
        results = results.map(article => {
          const live = liveScores[article.slug];
          if (!live) return article;

          const prevViews  = article._raw_views || 0;
          const newViews   = prevViews + live.views;
          const newAvgTime = newViews > 0
            ? ((article.avg_time_spent || 0) * prevViews + live.time_spent) / newViews
            : 0;

          return {
            ...article,
            engagement_score:  (article.engagement_score  || 0) + live.engagement_score,
            trending_velocity: (article.trending_velocity || 0) + live.trending_velocity,
            avg_time_spent:    newAvgTime,
            _raw_views:        newViews,
            _live_hydrated:    true
          };
        });
      }
    }

    return results;
  }

  // =================================================================================================
  //  THE SMASHER (Global Data Aggregation) - BULLETPROOF FIX APPLIED
  // =================================================================================================
  static async aggregateGlobalMetrics(env) {
    console.log("[Smasher] Starting aggregation job...");
    
    // FIX 1: Catch NULL is_aggregated values which happens on newly created rows or schema updates
    let sessions = [];
    try {
      const queryResult = await env.DB.prepare(`
        SELECT session_id, interaction_history FROM algo_user_sessions 
        WHERE last_seen_at > datetime('now', '-7 days') 
        AND (is_aggregated = 0 OR is_aggregated IS NULL)
        LIMIT 1000
      `).all();
      sessions = queryResult.results;
      console.log(`[Smasher] Found ${sessions.length} sessions to process.`);
    } catch (e) {
      console.error("[Smasher] Failed to fetch sessions: ", e.message);
      return { error: e.message };
    }

    if (sessions.length === 0) return { updated_articles: 0 };

    const globalStats = {};

    // SMASH (Map Phase)
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
      } catch (e) { console.error("Bad JSON in session", session.session_id); }
    }

    // FIX 2 & 3 & 4: Safe Math, Correct Logic, Velocity Simulation
    // IMPORTANT: Make sure your D1 column is actually 'total_shares' and not 'total_share'.
    // If it is total_share, remove the 's' below.
    const stmt = env.DB.prepare(`
      UPDATE articles SET 
        total_views = COALESCE(total_views, 0) + ?,
        total_reads = COALESCE(total_reads, 0) + ?,
        total_shares = COALESCE(total_shares, 0) + ?,
        
        avg_time_spent = CASE 
            WHEN COALESCE(total_views, 0) + ? = 0 THEN 0 
            ELSE ((COALESCE(avg_time_spent, 0) * COALESCE(total_views, 0)) + ?) / (COALESCE(total_views, 0) + ?) 
        END,
        
        engagement_score = COALESCE(engagement_score, 0) + ?,
        
        -- Velocity formula: Change in score / 1 hour (simulated momentum)
        trending_velocity = COALESCE(trending_velocity, 0) + (? * 0.5) 
      WHERE slug = ?
    `);

    const batch = [];

    for (const [slug, stats] of Object.entries(globalStats)) {
       const batchScore = (stats.views * SCORING_WEIGHTS.VIEW) + 
                          (stats.reads * SCORING_WEIGHTS.READ) + 
                          (stats.shares * SCORING_WEIGHTS.SHARE) +
                          (stats.time_spent * SCORING_WEIGHTS.TIME_SPENT_FACTOR); 

       batch.push(stmt.bind(
         stats.views,         // 1. total_views
         stats.reads,         // 2. total_reads
         stats.shares,        // 3. total_shares
         stats.views,         // 4. denominator check
         stats.time_spent,    // 5. numerator addition
         stats.views,         // 6. denominator addition
         batchScore,          // 7. engagement_score accumulation
         batchScore,          // 8. trending_velocity momentum bump
         slug                 // 9. WHERE slug
       ));
    }

    const sessionStmt = env.DB.prepare(`UPDATE algo_user_sessions SET is_aggregated = 1 WHERE session_id = ?`);
    for (const session of sessions) {
      batch.push(sessionStmt.bind(session.session_id));
    }

    // FIX 5: Try-Catch wrapper around Batch Execution
    if (batch.length > 0) {
      try {
        console.log(`[Smasher] Executing D1 batch with ${batch.length} queries...`);
        for (let i = 0; i < batch.length; i += 100) {
          await env.DB.batch(batch.slice(i, i + 100));
        }
        console.log(`[Smasher] Batch successful!`);
      } catch (e) {
        console.error("[Smasher] D1 BATCH FAILED! Error:", e.message);
        console.error("If this says 'no such column', check your D1 schema spelling (e.g., total_shares vs total_share)");
        throw e; // Throw so we don't silently pretend it worked
      }
    }

    return { updated_articles: Object.keys(globalStats).length, processed_sessions: sessions.length };
  }

  // =================================================================================================
  //  THE FRONTAL CORTEX (Decision Making)
  // =================================================================================================
  
  _calculateTrendingScore(article) {
    const sampleText = (article.title || '') + '. ' + (article.subtitle || '') + '. ' + (article.seo_description || '');
    
    const gradeLevel = article.iq_score || ContentIQ.calculateGradeLevel(sampleText) || 10;
    const entropy = article.entropy_score || ContentIQ.calculateEntropy(sampleText) || 3;
    const fairTime = article.fair_time_seconds || 120;
    
    let iqScore = (gradeLevel * 1.5) + (entropy * 5); 
    iqScore = Math.min(50, iqScore); 

    let heatScore = 0;
    if (article.engagement_score) {
       const pubDate = new Date(article.published_at || Date.now());
       const hoursOld = Math.max(0, (Date.now() - pubDate) / (1000 * 60 * 60));
       
       heatScore = TemporalGravity.newtonianCooling(article.engagement_score, hoursOld, 0.05);
       
       if (article.trending_velocity) {
          heatScore += (article.trending_velocity * 25); 
       }
    }

    let retentionScore = 0;
    if (article.avg_time_spent && fairTime > 0) {
       const completionRate = Math.min(1.5, article.avg_time_spent / fairTime);
       if (completionRate > 0.8) retentionScore = 30;
       else if (completionRate < 0.2) retentionScore = -20; 
    }

    const pubDate = new Date(article.published_at || Date.now());
    const hoursOld = Math.max(0, (Date.now() - pubDate) / (1000 * 60 * 60));
    let freshnessScore = 0;
    if (hoursOld < 72) {
       freshnessScore = (72 - hoursOld) * 0.5; 
    }

    const chaos = article.slug.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 13;

    return heatScore + iqScore + retentionScore + freshnessScore + chaos;
  }

  getTrending(limit = 20, excludeSlug = null) {
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

  getRecommended(contextArticle = null, limit = 6, userSessionMatrix = null) {
    let candidates = this.articles;

    const parsedUserMatrix = userSessionMatrix ? 
        (typeof userSessionMatrix === 'string' ? JSON.parse(userSessionMatrix) : userSessionMatrix) : null;

    if (contextArticle) {
      candidates = candidates.filter(a => a.slug !== contextArticle.slug);
      
      const parsedContextMatrix = contextArticle.lexical_matrix ? 
        (typeof contextArticle.lexical_matrix === 'string' ? JSON.parse(contextArticle.lexical_matrix) : contextArticle.lexical_matrix) : null;

      return candidates.map(article => {
        let relevance = 0;
        
        const parsedArticleMatrix = article.lexical_matrix ? 
          (typeof article.lexical_matrix === 'string' ? JSON.parse(article.lexical_matrix) : article.lexical_matrix) : null;

        // ---------------------------------------------------------
        // TIER 1: CONTENT MATCH (Lexical Overlap)
        // ---------------------------------------------------------
        let contentScore = 0;
        
        // Bonus for same author
        if (contextArticle.author && article.author === contextArticle.author) {
          contentScore += 5; // Small bonus, don't overwhelm lexical match
        }

        // Lexical Cosine Similarity
        if (parsedContextMatrix && parsedArticleMatrix) {
           const cosineSim = VectorMath.cosineSimilarity(parsedContextMatrix, parsedArticleMatrix);
           // STRICT BALANCING: Pure proportional weight
           // If similarity is 1.0 (identical), it gets full TIER_1 points.
           // If similarity is 0.5, it gets half.
           contentScore += (cosineSim * SCORING_WEIGHTS.TIER_1_CONTENT_MATCH); 
        }
        
        relevance += contentScore;

        // ---------------------------------------------------------
        // TIER 2: SESSION HABIT (User "Ghost Profile")
        // ---------------------------------------------------------
        let sessionScore = 0;
        
        if (parsedUserMatrix && parsedArticleMatrix) {
           // We use Cosine Similarity here too for User History vs Article
           // This checks if the article uses the same words the user has been "collecting"
           const userSim = VectorMath.cosineSimilarity(parsedUserMatrix, parsedArticleMatrix);
           
           // STRICT BALANCING: Proportional weight
           sessionScore += (userSim * SCORING_WEIGHTS.TIER_2_SESSION_HABIT);
        } else {
           // Cold Start / Fallback for no session data
           const pubDate = new Date(article.published_at || Date.now());
           const hoursOld = Math.max(0, (Date.now() - pubDate) / (1000 * 60 * 60));
           
           const recency = TemporalGravity.newtonianCooling(1, hoursOld, 0.05); // Normalized 0-1
           
           const sampleText = (article.title || '') + '. ' + (article.subtitle || '') + '. ' + (article.seo_description || '');
           const iq = article.iq_score || ContentIQ.calculateGradeLevel(sampleText) || 10;
           const entropy = article.entropy_score || ContentIQ.calculateEntropy(sampleText) || 3;
           
           // Normalize Quality roughly to 0-1 range for the weight multiplication
           const quality = Math.min(1, ((iq * 1.5) + (entropy * 5)) / 50);
           
           // Fallback score uses a portion of the Tier 2 weight
           sessionScore += ((recency * 0.6) + (quality * 0.4)) * (SCORING_WEIGHTS.TIER_2_SESSION_HABIT * 0.5);
        }

        relevance += sessionScore;

        // ---------------------------------------------------------
        // TIER 3: WORLDWIDE VOTE (Engagement)
        // ---------------------------------------------------------
        let worldScore = 0;
        
        if (article.engagement_score) {
          const pubDate = new Date(article.published_at || Date.now());
          const hoursOld = Math.max(0, (Date.now() - pubDate) / (1000 * 60 * 60));
          
          // HackerNews Gravity returns a score that can be high, we need to normalize/clamp it
          // typically gravity score drops fast. 
          const gravityScore = TemporalGravity.hackerNewsGravity(article.engagement_score, hoursOld, 1.8);
          
          // Logarithmic dampening to prevent viral posts from completely breaking the scale
          // coupled with the Tier 3 weight.
          const normalizedGravity = Math.min(1, Math.log10(gravityScore + 1) / 2); // Assumes gravity ~100 is "hot"
          
          worldScore += (normalizedGravity * SCORING_WEIGHTS.TIER_3_WORLDWIDE_VOTE); 
        }

        relevance += worldScore;

        return { ...article, _relevance: relevance };
      })
      .sort((a, b) => b._relevance - a._relevance)
      .slice(0, limit);
    }

    return this.getTrending(limit);
  }

  getCollaborativeFeed(currentUser, communityUsers, limit = 5) {
    if (!currentUser || !communityUsers || communityUsers.length === 0) return [];

    const neighbors = CollaborativeBrain.findNearestNeighbors(currentUser, communityUsers, 20);
    if (neighbors.length === 0) return [];

    const candidates = new Set();
    const userHistory = currentUser.interaction_history ? JSON.parse(currentUser.interaction_history) : {};
    
    for (const { user } of neighbors) {
      const h = user.interaction_history ? JSON.parse(user.interaction_history) : {};
      for (const slug of Object.keys(h)) {
        if (!userHistory[slug]) { 
           candidates.add(slug);
        }
      }
    }

    const scoredCandidates = [];
    for (const slug of candidates) {
      const article = this.articles.find(a => a.slug === slug);
      if (!article) continue;

      const predictedInterest = CollaborativeBrain.predictInterest(slug, neighbors);
      
      let socialScore = predictedInterest * 100;
      
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

  getLatest(limit = null) {
    const sorted = [...this.articles].sort((a, b) => {
      const dateA = new Date(a.published_at || 0);
      const dateB = new Date(b.published_at || 0);
      return dateB - dateA;
    });

    return limit ? sorted.slice(0, limit) : sorted;
  }
}