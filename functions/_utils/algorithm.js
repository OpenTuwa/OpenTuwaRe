// The Neural Brain - Hybrid AI Recommendation Engine for OpenTuwa

export const SCORING_WEIGHTS = {
  VIEW: 1, 
  READ: 5, 
  SHARE: 10, 
  TIME_SPENT_FACTOR: 0.1,
  TIER_1_CONTENT_MATCH: 35,    
  TIER_1_VISUAL_TRIGGER: 35,   
  TIER_2_SESSION_HABIT: 15,   
  TIER_3_WORLDWIDE_VOTE: 15,
  NOVELTY_BONUS: 15,           // Increased for the slot-machine variance reward
  EMOTIONAL_RESONANCE: 15      // Shifted to prioritize Arousal over simple Valence
};

// =================================================================================================
//  MODULE 1: NEURAL AI ENGINE (Cloudflare Workers AI, Vectorize, KV)
// =================================================================================================
export class NeuralEngine {
  static async getTextEmbedding(env, text) {
    if (!text) return null; 
    const cleanText = text.replace(/<[^>]*>?/gm, ' ').substring(0, 3000);
    try {
      const response = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: cleanText });
      return response.data[0];
    } catch (e) {
      console.error("[AI ERROR] Text Embedding failed:", e.message);
      return null; 
    }
  }

  static async getVisualEmbedding(env, imageArrayBuffer) {
    if (!imageArrayBuffer) return null; 
    try {
      const response = await env.AI.run('@cf/openai/clip-vit-base-patch32', { image: [...new Uint8Array(imageArrayBuffer)] });
      return Array.isArray(response.data[0]) ? response.data[0] : response.data;
    } catch (e) {
      console.error("[AI ERROR] Visual Embedding failed:", e.message);
      return null; 
    }
  }

  // AI Arousal & Sentiment (Called during Ingestion/Queue, NOT Read Path)
  static async getArousalClassification(env, text) {
    if (!text) return { valence: 0, arousal: 0 };
    try {
      // Using a lightweight classification model to map to Circumplex Model of Emotion
      const response = await env.AI.run('@cf/huggingface/distilbert-base-uncased-finetuned-sst-2-english', { text: text.substring(0, 512) });
      // Example mapping: Transform raw model scores into high-arousal negative/positive states
      const isPositive = response[0].label === 'POSITIVE';
      const confidence = response[0].score; // 0.0 to 1.0
      
      // We prioritize arousal (intensity) over valence for viral coefficient
      const arousalScore = Math.min(1.0, confidence * 1.5); 
      return { 
        valence: isPositive ? confidence : -confidence,
        arousal: arousalScore 
      };
    } catch (e) {
      console.error("[AI ERROR] Arousal Classification failed:", e.message);
      return { valence: 0, arousal: 0 };
    }
  }

  // Stateful Hebbian Learning: Updates and persists the user's brain vector in KV
  static async updateUserVectorKV(env, userId, articleVector, actionWeight = 0.1, dimensions = 768) {
    if (!userId || !articleVector) return;
    
    try {
      const kvKey = `user_vector:${userId}`;
      let currentVector = await env.BRAIN_KV.get(kvKey, "json");
      
      if (!currentVector || currentVector.length !== dimensions) {
        currentVector = new Array(dimensions).fill(0);
      }

      // Logarithmic scaling (Weber-Fechner Law) for learning rate
      const alpha = Math.max(0.01, Math.min(0.2 * Math.log10(actionWeight * 10 + 1), 0.8)); 
      
      const newVector = currentVector.map((val, i) => 
        (alpha * (articleVector[i] || 0)) + ((1 - alpha) * val)
      );

      // Fire and forget write back to KV
      env.waitUntil(env.BRAIN_KV.put(kvKey, JSON.stringify(newVector)));
      return newVector;
    } catch (e) {
      console.error("[KV ERROR] Failed to update user vector:", e.message);
    }
  }

  static sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }
}

// =================================================================================================
//  MODULE 2: TEMPORAL GRAVITY ENGINE (Dynamic Physics)
// =================================================================================================
export class TemporalGravity {
  static newtonianCooling(initialTemperature, ageInHours, k = 0.1) {
    const ambientTemperature = 0;
    return ambientTemperature + (initialTemperature - ambientTemperature) * Math.exp(-k * ageInHours);
  }

  // ENHANCED: Dynamic gravity based on real-time trending velocity
  static dynamicGravity(points, hoursSinceSubmit, baseGravity = 1.85, velocity = 0) {
    // High velocity flattens the gravity curve, keeping viral content alive longer
    const dynamicG = Math.max(1.1, baseGravity - (velocity * 0.05));
    return (points - 1) / Math.pow((hoursSinceSubmit + 1.5), dynamicG);
  }
}

// =================================================================================================
//  MODULE 3: CONTENT DEPTH METRICS (Background Queue Processing Only)
// =================================================================================================
export class ContentIQ {
  // NOTE: These functions are strictly for the asynchronous ingestion queue.
  // They are no longer called in the read path to preserve O(1) latency.

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
    for (const w of words) syllableCount += this.countSyllables(w);
    const score = (0.39 * (wordCount / sentences)) + (11.8 * (syllableCount / wordCount)) - 15.59;
    return Math.max(0, Math.min(score, 20)); 
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
//  MODULE 4: THE HYBRID SCORER (AI + Physics + Operant Conditioning)
// =================================================================================================
export class RecommendationEngine {
  constructor(articles) {
    this.articles = articles || [];
  }

  _hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0; 
    }
    return Math.abs(hash);
  }

  getTrending(limit = 100) {
    return this.articles
      .map(article => {
        let score = 0;
        if (article.engagement_score) {
          const hoursOld = Math.max(0, (Date.now() - new Date(article.published_at || Date.now())) / 3600000);
          score = TemporalGravity.dynamicGravity(article.engagement_score, hoursOld, 1.85, article.trending_velocity || 0);
        }
        const chronScore = new Date(article.published_at || Date.now()).getTime() / 10000000000;
        return { ...article, _trending_score: score + chronScore };
      })
      .sort((a, b) => b._trending_score - a._trending_score)
      .slice(0, limit);
  }

  getHybridRecommendations(textMatches, visualMatches, limit = 6, currentSlug = null, sessionPullCount = 0) {
    const safeTextMatches = textMatches || [];
    const safeVisualMatches = visualMatches || [];
    const isAiActive = safeTextMatches.length > 0 || safeVisualMatches.length > 0;

    return this.articles
      .map(article => {
        if (currentSlug && article.slug === currentSlug) return null;

        let relevance = 0;
        const scoreBreakdown = {
          text_ai: 0,
          visual_ai: 0,
          gravity: 0,
          emotion: 0,
          novelty: 0
        };
        
        // 1. Vector Distance Matching
        const aiTextMatch = safeTextMatches.find(v => v.id === article.slug);
        if (aiTextMatch) {
           const activatedScore = NeuralEngine.sigmoid(aiTextMatch.score * 5 - 2.5);
           scoreBreakdown.text_ai = (activatedScore * SCORING_WEIGHTS.TIER_1_CONTENT_MATCH);
           relevance += scoreBreakdown.text_ai;
        }

        const aiVisualMatch = safeVisualMatches.find(v => v.id === article.slug);
        if (aiVisualMatch) {
           const activatedScore = NeuralEngine.sigmoid(aiVisualMatch.score * 5 - 2.5);
           scoreBreakdown.visual_ai = (activatedScore * SCORING_WEIGHTS.TIER_1_VISUAL_TRIGGER);
           relevance += scoreBreakdown.visual_ai;
        }

        // 2. Dynamic Temporal Gravity
        if (article.engagement_score) {
          const hoursOld = Math.max(0, (Date.now() - new Date(article.published_at || Date.now())) / 3600000);
          const velocity = article.trending_velocity || 0;
          const gravityScore = TemporalGravity.dynamicGravity(article.engagement_score, hoursOld, 1.85, velocity);
          const normalizedGravity = Math.min(1, Math.log10(gravityScore + 1.5) / 2);
          scoreBreakdown.gravity = (normalizedGravity * SCORING_WEIGHTS.TIER_3_WORLDWIDE_VOTE); 
          relevance += scoreBreakdown.gravity;
        }

        // 3. Emotional Arousal (Pre-computed in DB via Queue)
        // We use the pre-computed arousal_score (0 to 1.0) rather than real-time string parsing
        const arousal = article.arousal_score || 0; 
        scoreBreakdown.emotion = (arousal * SCORING_WEIGHTS.EMOTIONAL_RESONANCE);
        relevance += scoreBreakdown.emotion;

        // 4. Intermittent Variable Rewards (Skinner Box Mechanics)
        if (currentSlug) {
          // 30% chance of a high-variance outlier to trigger dopamine, but only if they've pulled a few times
          const isSlotMachineTriggered = (Math.random() < 0.3) && (sessionPullCount > 2);
          
          if (isSlotMachineTriggered) {
             scoreBreakdown.novelty = SCORING_WEIGHTS.NOVELTY_BONUS; // Max out the dopamine reward
          } else {
             // Standard predictable novelty
             let novelty = 1.0;
             if (aiTextMatch) novelty = Math.max(0, 1 - aiTextMatch.score); 
             const invertedU = Math.exp(-Math.pow(novelty - 0.3, 2) / 0.05);
             scoreBreakdown.novelty = invertedU * (SCORING_WEIGHTS.NOVELTY_BONUS * 0.4); // Suppressed
          }
          relevance += scoreBreakdown.novelty;
        }

        return { 
          ...article, 
          _relevance: relevance,
          _ai_active: isAiActive,
          _scoring_breakdown: scoreBreakdown
        };
      })
      .filter(article => article !== null) 
      .sort((a, b) => b._relevance - a._relevance)
      .slice(0, limit);
  }

  getHybridVideoRecommendations(textMatches, visualMatches, limit = 6, currentSlug = null, sessionPullCount = 0) {
    const deepPool = this.getHybridRecommendations(textMatches, visualMatches, limit * 4, currentSlug, sessionPullCount);

    const videoArticles = deepPool.filter(article => 
      article.content_html && (article.content_html.includes('<video') || article.content_html.includes('iframe'))
    );
    const textArticles = deepPool.filter(article => 
      !(article.content_html && (article.content_html.includes('<video') || article.content_html.includes('iframe')))
    );

    return [...videoArticles, ...textArticles].slice(0, limit);
  }
}

// =================================================================================================
//  MODULE 5: DATA INGESTION & NATIVE VECTOR FILTERING
// =================================================================================================

// ENHANCED: Searches Vectorize natively FIRST, then fetches D1 data
export async function fetchCandidatesFromVectorize(env, userVector, limit = 100) {
  if (!userVector) return [];
  
  try {
    // 1. Query Vectorize natively (C++ speed, offloads V8 memory)
    const vectorMatches = await env.VECTORIZE_INDEX.query(userVector, { topK: limit });
    const matchIds = vectorMatches.matches.map(m => m.id);
    
    if (matchIds.length === 0) return [];

    // 2. Fetch rich data from D1 using the Vectorize IDs
    const placeholders = matchIds.map(() => '?').join(',');
    const sql = `
      SELECT slug, title, subtitle, author, published_at, read_time_minutes, image_url, tags, seo_description,
             content_html, 
             COALESCE(engagement_score, 0) as engagement_score,
             COALESCE(avg_time_spent, 0) as avg_time_spent,
             COALESCE(total_views, 0) as _raw_views,
             COALESCE(trending_velocity, 0) as trending_velocity,
             COALESCE(arousal_score, 0) as arousal_score,
             COALESCE(entropy_score, 0) as entropy_score
      FROM articles 
      WHERE slug IN (${placeholders})
    `;
    
    const { results } = await env.DB.prepare(sql).bind(...matchIds).all();
    return results || [];
    
  } catch (err) {
    console.error("[VECTORIZE/DB ERROR] fetchCandidatesFromVectorize failed:", err.message);
    return [];
  }
}

// Fallback / Standard chronological & trending fetch
export async function fetchCandidates(env, limit = 100, searchQuery = null) {
  let results = [];
  const selectClause = `
    SELECT a.slug, a.title, a.subtitle, a.author, a.published_at, a.read_time_minutes, a.image_url, a.tags, a.seo_description,
           a.content_html, 
           COALESCE(a.engagement_score, 0) as engagement_score,
           COALESCE(a.avg_time_spent, 0) as avg_time_spent,
           COALESCE(a.total_views, 0) as _raw_views,
           COALESCE(a.trending_velocity, 0) as trending_velocity,
           COALESCE(a.arousal_score, 0) as arousal_score, 
           COALESCE(a.entropy_score, 0) as entropy_score
    FROM articles a
  `;

  try {
    if (searchQuery) {
      const q = searchQuery.trim();
      const wildcard = `%${q.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
      const sql = `${selectClause} WHERE (a.title LIKE ? ESCAPE '\\' OR a.subtitle LIKE ? ESCAPE '\\' OR a.seo_description LIKE ? ESCAPE '\\') ORDER BY a.published_at DESC LIMIT ?`;
      const { results: raw } = await env.DB.prepare(sql).bind(wildcard, wildcard, wildcard, limit).all();
      results = raw || [];
    } else {
      const sql = `${selectClause} ORDER BY a.engagement_score DESC, a.published_at DESC LIMIT ?`;
      const { results: raw } = await env.DB.prepare(sql).bind(limit).all();
      results = raw || [];
    }
  } catch (err) {
    console.error("[DB ERROR] fetchCandidates failed:", err.message);
    return [];
  }
  return results;
}