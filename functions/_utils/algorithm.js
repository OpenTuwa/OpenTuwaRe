// The Neural Brain - Hybrid AI Recommendation Engine for OpenTuwa
// REFACTORED: Uses manual D1 vectors, no on-the-fly AI generation.

export const SCORING_WEIGHTS = {
  VIEW: 1, 
  READ: 5, 
  SHARE: 10, 
  TIME_SPENT_FACTOR: 0.1,
  TIER_1_CONTENT_MATCH: 35,    
  TIER_1_VISUAL_TRIGGER: 35,   
  TIER_2_SESSION_HABIT: 15,   
  TIER_3_WORLDWIDE_VOTE: 15,
  NOVELTY_BONUS: 15,           
  EMOTIONAL_RESONANCE: 15      
};

// =================================================================================================
//  MODULE 1: NEURAL ENGINE (In-Memory Math & KV Memory)
// =================================================================================================
export class NeuralEngine {
  
  // Fast in-memory distance calculation since vectors are pulled directly from D1
  static cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
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

      const alpha = Math.max(0.01, Math.min(0.2 * Math.log10(actionWeight * 10 + 1), 0.8)); 
      
      const newVector = currentVector.map((val, i) => 
        (alpha * (articleVector[i] || 0)) + ((1 - alpha) * val)
      );

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

  static dynamicGravity(points, hoursSinceSubmit, baseGravity = 1.85, velocity = 0) {
    const dynamicG = Math.max(1.1, baseGravity - (velocity * 0.05));
    return (points - 1) / Math.pow((hoursSinceSubmit + 1.5), dynamicG);
  }
}

// =================================================================================================
//  MODULE 3: CONTENT DEPTH METRICS (Background Queue Processing Only)
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
//  MODULE 4: THE HYBRID SCORER (Math + Physics + Operant Conditioning)
// =================================================================================================
export class RecommendationEngine {
  constructor(articles) {
    this.articles = articles || [];
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
        // eslint-disable-next-line no-unused-vars
        const { neural_vector, visual_vector, ...safe } = article;
        return { ...safe, _trending_score: score + chronScore };
      })
      .sort((a, b) => b._trending_score - a._trending_score)
      .slice(0, limit);
  }

  // Refactored to accept userVector instead of pre-computed Vectorize matches
  getHybridRecommendations(userVector, limit = 6, currentSlug = null, sessionPullCount = 0) {
    const isAiActive = !!userVector && userVector.length > 0;

    return this.articles
      .map(article => {
        if (currentSlug && article.slug === currentSlug) return null;

        let relevance = 0;
        const scoreBreakdown = { text_ai: 0, visual_ai: 0, gravity: 0, emotion: 0, novelty: 0 };
        
        let textSimilarity = 0;
        let visualSimilarity = 0;

        // 1. Vector Distance Matching (Calculated on the fly against D1 JSON vectors)
        if (isAiActive) {
          if (article.neural_vector) {
            textSimilarity = NeuralEngine.cosineSimilarity(userVector, article.neural_vector);
            const activatedScore = NeuralEngine.sigmoid(textSimilarity * 5 - 2.5);
            scoreBreakdown.text_ai = (activatedScore * SCORING_WEIGHTS.TIER_1_CONTENT_MATCH);
            relevance += scoreBreakdown.text_ai;
          }

          if (article.visual_vector) {
            visualSimilarity = NeuralEngine.cosineSimilarity(userVector, article.visual_vector);
            const activatedScore = NeuralEngine.sigmoid(visualSimilarity * 5 - 2.5);
            scoreBreakdown.visual_ai = (activatedScore * SCORING_WEIGHTS.TIER_1_VISUAL_TRIGGER);
            relevance += scoreBreakdown.visual_ai;
          }
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

        // 3. Emotional Arousal
        const arousal = article.arousal_score || 0; 
        scoreBreakdown.emotion = (arousal * SCORING_WEIGHTS.EMOTIONAL_RESONANCE);
        relevance += scoreBreakdown.emotion;

        // 4. Intermittent Variable Rewards
        if (currentSlug) {
          const isSlotMachineTriggered = (Math.random() < 0.3) && (sessionPullCount > 2);
          
          if (isSlotMachineTriggered) {
             scoreBreakdown.novelty = SCORING_WEIGHTS.NOVELTY_BONUS; 
          } else {
             let novelty = 1.0;
             if (isAiActive) novelty = Math.max(0, 1 - textSimilarity); 
             const invertedU = Math.exp(-Math.pow(novelty - 0.3, 2) / 0.05);
             scoreBreakdown.novelty = invertedU * (SCORING_WEIGHTS.NOVELTY_BONUS * 0.4); 
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

  getHybridVideoRecommendations(userVector, limit = 6, currentSlug = null, sessionPullCount = 0) {
    const deepPool = this.getHybridRecommendations(userVector, limit * 4, currentSlug, sessionPullCount);

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
//  MODULE 5: DATA INGESTION & PARSING
// =================================================================================================

// Fetch everything from D1, including your manual vectors
export async function fetchCandidates(env, limit = 100, searchQuery = null) {
  let results = [];
  
  // Explicitly selecting neural_vector and visual_vector from the D1 database
  const selectClause = `
    SELECT a.slug, a.title, a.subtitle, a.author, a.published_at, a.read_time_minutes, a.image_url, a.tags, a.seo_description,
           a.content_html, 
           COALESCE(a.engagement_score, 0) as engagement_score,
           COALESCE(a.avg_time_spent, 0) as avg_time_spent,
           COALESCE(a.total_views, 0) as _raw_views,
           COALESCE(a.trending_velocity, 0) as trending_velocity,
           COALESCE(a.arousal_score, 0) as arousal_score, 
           COALESCE(a.entropy_score, 0) as entropy_score,
           a.neural_vector,
           a.visual_vector
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

  // Parse the stringified JSON vectors from D1 back into actual arrays
  return results.map(row => {
    try {
      row.neural_vector = row.neural_vector ? JSON.parse(row.neural_vector) : null;
    } catch(e) { row.neural_vector = null; }
    
    try {
      row.visual_vector = row.visual_vector ? JSON.parse(row.visual_vector) : null;
    } catch(e) { row.visual_vector = null; }
    
    return row;
  });
}