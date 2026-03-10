// The Neural Brain - Hybrid AI Recommendation Engine for OpenTuwa

export const SCORING_WEIGHTS = {
  VIEW: 1, 
  READ: 5, 
  SHARE: 10, 
  TIME_SPENT_FACTOR: 0.1,
  TIER_1_CONTENT_MATCH: 40,   // Neural Vector similarity
  TIER_2_SESSION_HABIT: 35,   // User Brain overlap
  TIER_3_WORLDWIDE_VOTE: 25   // Viral Gravity
};

// =================================================================================================
//  MODULE 1: NEURAL AI ENGINE (Cloudflare Workers AI + Vectorize)
// =================================================================================================
export class NeuralEngine {
  // Generates a 768-dimension vector using Cloudflare GPUs
  static async getEmbedding(env, text) {
    if (!text) return new Array(768).fill(0);
    // Limit text length to prevent AI token limits (increased to 3000 chars)
    const cleanText = text.replace(/<[^>]*>?/gm, ' ').substring(0, 3000);
    try {
      const response = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: cleanText });
      return response.data[0];
    } catch (e) {
      console.error("AI Embedding failed:", e);
      return new Array(768).fill(0);
    }
  }

  // Updates the user's "Ghost Profile" by averaging their brain vector with the new article
  static updateAverageVector(currentAvg, newVector, previousInteractionCount) {
    if (!currentAvg || currentAvg.length === 0) return newVector;
    return currentAvg.map((val, i) => 
      ((val * previousInteractionCount) + (newVector[i] || 0)) / (previousInteractionCount + 1)
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

export function calculateFairReadingTime(htmlContent) {
  if (!htmlContent) return 60;
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
//  MODULE 4: THE HYBRID SCORER (AI + Physics)
// =================================================================================================
export class RecommendationEngine {
  constructor(articles) {
    this.articles = articles || [];
  }

  _calculateTrendingScore(article) {
    const sampleText = (article.title || '') + '. ' + (article.subtitle || '') + '. ' + (article.seo_description || '');
    const gradeLevel = article.iq_score || ContentIQ.calculateGradeLevel(sampleText) || 10;
    const entropy = article.entropy_score || ContentIQ.calculateEntropy(sampleText) || 3;
    let iqScore = Math.min(50, (gradeLevel * 1.5) + (entropy * 5)); 

    let heatScore = 0;
    const pubDate = new Date(article.published_at || Date.now());
    const hoursOld = Math.max(0, (Date.now() - pubDate) / 3600000);

    if (article.engagement_score) {
       heatScore = TemporalGravity.newtonianCooling(article.engagement_score, hoursOld, 0.05);
       if (article.trending_velocity) {
          heatScore += (article.trending_velocity * 25); 
       }
    }

    let freshnessScore = 0;
    if (hoursOld < 72) freshnessScore = (72 - hoursOld) * 0.5; 

    return heatScore + iqScore + freshnessScore;
  }

  getTrending(limit = 20) {
    return this.articles
      .map(article => ({ ...article, _trendingScore: this._calculateTrendingScore(article) }))
      .sort((a, b) => b._trendingScore - a._trendingScore)
      .slice(0, limit);
  }

  getHybridRecommendations(vectorizeMatches, limit = 6) {
    return this.articles.map(article => {
      let relevance = 0;
      
      // TIER 1 & 2: Neural Semantic Match (From Cloudflare Vectorize)
      // Vectorize returns scores between 0 and 1. We multiply by our weights.
      const aiMatch = vectorizeMatches.find(v => v.id === article.slug);
      if (aiMatch) {
         relevance += (aiMatch.score * (SCORING_WEIGHTS.TIER_1_CONTENT_MATCH + SCORING_WEIGHTS.TIER_2_SESSION_HABIT));
      }

      // TIER 3: Worldwide Vote & Gravity (From D1)
      if (article.engagement_score) {
        const hoursOld = Math.max(0, (Date.now() - new Date(article.published_at || Date.now())) / 3600000);
        const gravityScore = TemporalGravity.hackerNewsGravity(article.engagement_score, hoursOld, 1.8);
        const normalizedGravity = Math.min(1, Math.log10(gravityScore + 1) / 2);
        relevance += (normalizedGravity * SCORING_WEIGHTS.TIER_3_WORLDWIDE_VOTE); 
      }

      return { ...article, _relevance: relevance };
    })
    .sort((a, b) => b._relevance - a._relevance)
    .slice(0, limit);
  }
}

export async function fetchCandidates(env, limit = 100, searchQuery = null) {
  let results = [];
  const selectClause = `
    SELECT a.slug, a.title, a.subtitle, a.author, a.published_at, a.read_time_minutes, a.image_url, a.tags, a.seo_description,
           a.content_html,   -- Added to include full article content
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
    const sql = `${selectClause} ORDER BY a.engagement_score DESC, a.published_at DESC LIMIT 500`;
    const { results: raw } = await env.DB.prepare(sql).bind().all();
    results = raw;
  }
  return results;
}