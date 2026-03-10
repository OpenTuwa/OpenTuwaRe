// The Neural Brain - Hybrid AI Recommendation Engine for OpenTuwa

export const SCORING_WEIGHTS = {
  VIEW: 1, 
  READ: 5, 
  SHARE: 10, 
  TIME_SPENT_FACTOR: 0.1,
  TIER_1_CONTENT_MATCH: 30,    // Text relevance 
  TIER_1_VISUAL_TRIGGER: 30,   // Amygdala/Visual hijack 
  TIER_2_SESSION_HABIT: 20,   
  TIER_3_WORLDWIDE_VOTE: 20   
};

// =================================================================================================
//  MODULE 1: NEURAL AI ENGINE (Cloudflare Workers AI + Vectorize)
// =================================================================================================
export class NeuralEngine {
  static async getTextEmbedding(env, text) {
    if (!text) return new Array(768).fill(0);
    const cleanText = text.replace(/<[^>]*>?/gm, ' ').substring(0, 3000);
    try {
      const response = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: cleanText });
      return response.data[0];
    } catch (e) {
      console.error("Text Embedding failed:", e);
      return new Array(768).fill(0);
    }
  }

  static async getVisualEmbedding(env, imageArrayBuffer) {
    if (!imageArrayBuffer) return new Array(512).fill(0);
    try {
      const response = await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', { image: [...new Uint8Array(imageArrayBuffer)] });
      return response.data[0];
    } catch (e) {
      console.error("Visual Embedding failed:", e);
      return new Array(512).fill(0);
    }
  }

  static updateBrainVector(currentVector, newVector, actionWeight = 0.1, dimensions = 768) {
    if (!currentVector || currentVector.length !== dimensions) return newVector;
    if (!newVector || newVector.length !== dimensions) return currentVector;
    
    const alpha = Math.max(0.05, Math.min(actionWeight, 0.5)); 
    
    return currentVector.map((val, i) => 
      (alpha * (newVector[i] || 0)) + ((1 - alpha) * val)
    );
  }
}

// =================================================================================================
//  MODULE 2: TEMPORAL GRAVITY ENGINE (Physics)
// =================================================================================================
export class TemporalGravity {
  static newtonianCooling(initialTemperature, ageInHours, k = 0.1) {
    const ambientTemperature = 0;
    return ambientTemperature + (initialTemperature - ambientTemperature) * Math.exp(-k * ageInHours);
  }

  static hackerNewsGravity(points, hoursSinceSubmit, gravity = 1.8) {
    return (points - 1) / Math.pow((hoursSinceSubmit + 2), gravity);
  }
}

// =================================================================================================
//  MODULE 3: CONTENT DEPTH & FAIRNESS METRICS
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
//  MODULE 4: THE HYBRID SCORER (AI + Physics)
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

  // Restored: Standard temporal gravity feed for Home & Archive endpoints
  getTrending(limit = 100) {
    return this.articles
      .map(article => {
        let score = 0;
        if (article.engagement_score) {
          const hoursOld = Math.max(0, (Date.now() - new Date(article.published_at || Date.now())) / 3600000);
          score = TemporalGravity.hackerNewsGravity(article.engagement_score, hoursOld, 1.8);
        }
        // Fallback to strict chronology if no engagement exists yet
        const chronScore = new Date(article.published_at || Date.now()).getTime() / 10000000000;
        return { ...article, _trending_score: score + chronScore };
      })
      .sort((a, b) => b._trending_score - a._trending_score)
      .slice(0, limit);
  }

  getHybridRecommendations(textMatches, visualMatches, limit = 6, currentSlug = null) {
    const maxWeight = SCORING_WEIGHTS.TIER_1_CONTENT_MATCH +
                      SCORING_WEIGHTS.TIER_1_VISUAL_TRIGGER +
                      SCORING_WEIGHTS.TIER_2_SESSION_HABIT +
                      SCORING_WEIGHTS.TIER_3_WORLDWIDE_VOTE; 

    return this.articles
      .map(article => {
        if (currentSlug && article.slug === currentSlug) return null;

        let relevance = 0;
        
        const aiTextMatch = textMatches.find(v => v.id === article.slug);
        if (aiTextMatch) {
           relevance += (aiTextMatch.score * SCORING_WEIGHTS.TIER_1_CONTENT_MATCH);
        }

// Inside RecommendationEngine class in algorithm.js, add this new method below getHybridRecommendations:

  getHybridVideoRecommendations(textMatches, visualMatches, limit = 6, currentSlug = null) {
    // Uses the exact same algorithm set, but strictly filters for video-containing articles
    return this.getHybridRecommendations(textMatches, visualMatches, limit * 3, currentSlug)
      .filter(article => article.content_html && (article.content_html.includes('<video') || article.content_html.includes('iframe')))
      .slice(0, limit);
  }

        const aiVisualMatch = visualMatches.find(v => v.id === article.slug);
        if (aiVisualMatch) {
           relevance += (aiVisualMatch.score * SCORING_WEIGHTS.TIER_1_VISUAL_TRIGGER);
        }

        if (article.engagement_score) {
          const hoursOld = Math.max(0, (Date.now() - new Date(article.published_at || Date.now())) / 3600000);
          const gravityScore = TemporalGravity.hackerNewsGravity(article.engagement_score, hoursOld, 1.8);
          const normalizedGravity = Math.min(1, Math.log10(gravityScore + 1) / 2);
          relevance += (normalizedGravity * SCORING_WEIGHTS.TIER_3_WORLDWIDE_VOTE); 
        }

        if (currentSlug) {
          const combined = currentSlug + ':' + article.slug; 
          const adjustment = (this._hash(combined) % 100) / 10000 * maxWeight; 
          relevance += adjustment;
        }

        return { ...article, _relevance: relevance };
      })
      .filter(article => article !== null) 
      .sort((a, b) => b._relevance - a._relevance)
      .slice(0, limit);
  }
}

export async function fetchCandidates(env, limit = 100, searchQuery = null) {
  let results = [];
  const selectClause = `
    SELECT a.slug, a.title, a.subtitle, a.author, a.published_at, a.read_time_minutes, a.image_url, a.tags, a.seo_description,
           a.content_html, 
           COALESCE(a.engagement_score, 0) as engagement_score,
           COALESCE(a.avg_time_spent, 0) as avg_time_spent,
           COALESCE(a.total_views, 0) as _raw_views,
           COALESCE(a.trending_velocity, 0) as trending_velocity
    FROM articles a
  `;

  if (searchQuery) {
    const q = searchQuery.trim();
    const wildcard = `%${q.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
    const sql = `${selectClause} WHERE (a.title LIKE ? ESCAPE '\\' OR a.subtitle LIKE ? ESCAPE '\\' OR a.seo_description LIKE ? ESCAPE '\\') ORDER BY a.published_at DESC LIMIT ?`;
    const { results: raw } = await env.DB.prepare(sql).bind(wildcard, wildcard, wildcard, limit).all();
    results = raw;
  } else {
    const sql = `${selectClause} ORDER BY a.engagement_score DESC, a.published_at DESC LIMIT ?`;
    const { results: raw } = await env.DB.prepare(sql).bind(limit).all();
    results = raw;
  }
  return results;
}