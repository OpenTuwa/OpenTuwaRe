// The Neural Brain - Hybrid AI Recommendation Engine for OpenTuwa

export const SCORING_WEIGHTS = {
  VIEW: 1, 
  READ: 5, 
  SHARE: 10, 
  TIER_1_CONTENT_MATCH: 30,    
  TIER_1_VISUAL_TRIGGER: 25,   
  TIER_1_EMOTIONAL_AROUSAL: 15, // NEW: Weight for emotional intensity
  TIER_2_CURIOSITY_GAP: 20,     // NEW: Wundt Curve Novelty
  TIER_3_WORLDWIDE_VOTE: 10   
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
      return new Array(768).fill(0);
    }
  }

  static async getVisualEmbedding(env, imageArrayBuffer) {
    if (!imageArrayBuffer) return new Array(512).fill(0);
    try {
      const response = await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', { image: [...new Uint8Array(imageArrayBuffer)] });
      return response.data[0];
    } catch (e) {
      return new Array(512).fill(0);
    }
  }

  // NEW AI: Emotional Valence/Arousal Scoring (e.g., DistilBERT for sentiment)
  static async getEmotionalArousal(env, text) {
    if (!text) return 0.5; // Neutral
    const cleanText = text.replace(/<[^>]*>?/gm, ' ').substring(0, 500);
    try {
      const response = await env.AI.run('@cf/huggingface/distilbert-sst-2-int8', { text: cleanText });
      // We want *intensity* (arousal), so extreme negative or extreme positive both score high
      const maxScore = Math.max(...response.map(r => r.score));
      return maxScore; 
    } catch (e) {
      return 0.5;
    }
  }

  static updateBrainVector(currentVector, newVector, learningRate = 0.1, dimensions = 768) {
    if (!currentVector || currentVector.length !== dimensions) return newVector;
    if (!newVector || newVector.length !== dimensions) return currentVector;
    return currentVector.map((val, i) => (learningRate * (newVector[i] || 0)) + ((1 - learningRate) * val));
  }
}

// =================================================================================================
//  MODULE 2: TEMPORAL GRAVITY ENGINE
// =================================================================================================
export class TemporalGravity {
  static hackerNewsGravity(points, hoursSinceSubmit, gravity = 1.8) {
    return (points - 1) / Math.pow((hoursSinceSubmit + 2), gravity);
  }
}

// =================================================================================================
//  MODULE 3: THE HYBRID SCORER (Cognitive Modeling)
// =================================================================================================
export class RecommendationEngine {
  constructor(articles) {
    this.articles = articles || [];
  }

  // Wundt Curve implementation: f(x) = x * e^(-x/optimal_novelty)
  // Maps similarity to an inverted-U to maximize the "Information Gap" (Curiosity)
  static calculateCuriosityScore(similarityScore, optimalNovelty = 0.3) {
    const novelty = 1.0 - similarityScore; // 0 is identical, 1 is completely different
    // Peak curiosity happens when novelty is around 0.3 (30% different from what they know)
    return (novelty / optimalNovelty) * Math.exp(1 - (novelty / optimalNovelty));
  }

  getHybridRecommendations(textMatches, visualMatches, limit = 6, currentSlug = null) {
    return this.articles
      .map(article => {
        if (currentSlug && article.slug === currentSlug) return null;

        let relevance = 0;
        
        // 1. Lexical Similarity (Standard) & Curiosity Gap (Inverted-U)
        const aiTextMatch = textMatches.find(v => v.id === article.slug);
        if (aiTextMatch) {
           relevance += (aiTextMatch.score * SCORING_WEIGHTS.TIER_1_CONTENT_MATCH);
           
           // Inject Curiosity
           const curiosityMultiplier = RecommendationEngine.calculateCuriosityScore(aiTextMatch.score);
           relevance += (curiosityMultiplier * SCORING_WEIGHTS.TIER_2_CURIOSITY_GAP);
        }

        // 2. Visual Trigger
        const aiVisualMatch = visualMatches.find(v => v.id === article.slug);
        if (aiVisualMatch) {
           relevance += (aiVisualMatch.score * SCORING_WEIGHTS.TIER_1_VISUAL_TRIGGER);
        }

        // 3. Emotional Arousal (The Amygdala trigger)
        if (article.emotional_arousal_score) {
            relevance += (article.emotional_arousal_score * SCORING_WEIGHTS.TIER_1_EMOTIONAL_AROUSAL);
        }

        // 4. Social Proof / Gravity
        if (article.engagement_score) {
          const hoursOld = Math.max(0, (Date.now() - new Date(article.published_at || Date.now())) / 3600000);
          const gravityScore = TemporalGravity.hackerNewsGravity(article.engagement_score, hoursOld, 1.8);
          relevance += (Math.min(1, Math.log10(gravityScore + 1) / 2) * SCORING_WEIGHTS.TIER_3_WORLDWIDE_VOTE); 
        }

        return { ...article, _relevance: relevance };
      })
      .filter(article => article !== null) 
      .sort((a, b) => b._relevance - a._relevance)
      .slice(0, limit);
  }

  // Retained video logic for schema compatibility
  getHybridVideoRecommendations(textMatches, visualMatches, limit = 6, currentSlug = null) {
    const deepPool = this.getHybridRecommendations(textMatches, visualMatches, limit * 4, currentSlug);
    const videoArticles = deepPool.filter(a => a.content_html && (a.content_html.includes('<video') || a.content_html.includes('iframe')));
    const textArticles = deepPool.filter(a => !(a.content_html && (a.content_html.includes('<video') || a.content_html.includes('iframe'))));
    return [...videoArticles, ...textArticles].slice(0, limit);
  }
}

// Ensure you update your DB to include 'emotional_arousal_score'
export async function fetchCandidates(env, limit = 100, searchQuery = null) {
  let results = [];
  const selectClause = `
    SELECT a.slug, a.title, a.published_at, a.content_html, 
           COALESCE(a.engagement_score, 0) as engagement_score,
           COALESCE(a.emotional_arousal_score, 0.5) as emotional_arousal_score
    FROM articles a
  `;
  // ... (Keep existing fetch logic identical to preserve schema)
  const sql = `${selectClause} ORDER BY a.engagement_score DESC, a.published_at DESC LIMIT ?`;
  const { results: raw } = await env.DB.prepare(sql).bind(limit).all();
  return raw;
}