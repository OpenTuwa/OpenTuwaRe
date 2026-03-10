// The Neural Brain - Hybrid AI Recommendation Engine for OpenTuwa

export const SCORING_WEIGHTS = {
  VIEW: 1, 
  READ: 5, 
  SHARE: 10, 
  TIME_SPENT_FACTOR: 0.1,
  TIER_1_CONTENT_MATCH: 35,    // Increased: Text relevance 
  TIER_1_VISUAL_TRIGGER: 35,   // Increased: Amygdala/Visual hijack 
  TIER_2_SESSION_HABIT: 15,   
  TIER_3_WORLDWIDE_VOTE: 15,
  NOVELTY_BONUS: 10,           // Updated: Dopamine exploration reward
  EMOTIONAL_RESONANCE: 10      // NEW: Emotional intensity weight
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

  // ENHANCED: Applies a non-linear learning curve based on Hebbian principles
  static updateBrainVector(currentVector, newVector, actionWeight = 0.1, dimensions = 768) {
    if (!currentVector || currentVector.length !== dimensions) return newVector;
    if (!newVector || newVector.length !== dimensions) return currentVector;
    
    // Logarithmic scaling (Weber-Fechner Law) for learning rate
    const alpha = Math.max(0.01, Math.min(0.2 * Math.log10(actionWeight * 10 + 1), 0.8)); 
    
    return currentVector.map((val, i) => 
      (alpha * (newVector[i] || 0)) + ((1 - alpha) * val)
    );
  }

  // NEW: Neural Action Potential Threshold
  static sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
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

  // ENHANCED: Slightly sharper decay to prioritize fresh dopamine triggers
  static hackerNewsGravity(points, hoursSinceSubmit, gravity = 1.85) {
    return (points - 1) / Math.pow((hoursSinceSubmit + 1.5), gravity);
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

  static analyzeSentiment(text) {
    if (!text) return { valence: 0, intensity: 0 };
    // Sentiment Model: captures both very positive and very negative valence
    const lexicon = {
      'amazing': 4, 'brilliant': 4, 'excellent': 3, 'fantastic': 4, 'incredible': 4,
      'miracle': 4, 'perfect': 3, 'spectacular': 4, 'wonderful': 4, 'glorious': 4,
      'ecstatic': 4, 'thrilled': 4, 'delighted': 3, 'love': 3, 'beautiful': 3,
      'gorgeous': 3, 'astonishing': 4, 'joy': 3, 'happy': 3, 'great': 3, 'good': 2,
      'terrible': -4, 'awful': -4, 'horrible': -4, 'tragic': -4, 'devastating': -4,
      'appalling': -4, 'disgusting': -4, 'hideous': -4, 'ruined': -3, 'outrageous': -3,
      'catastrophe': -4, 'frightening': -3, 'sorrow': -3, 'terrified': -4, 'panic': -3,
      'angry': -3, 'furious': -4, 'hate': -3, 'disaster': -4, 'bad': -2, 'sad': -2,
      'fear': -3, 'worst': -4, 'dead': -3, 'murder': -4, 'destroy': -3, 'fail': -2
    };
    const words = text.toLowerCase().split(/\W+/);
    let totalValence = 0;
    let wordCount = 0;
    
    for (const w of words) {
      if (w.length > 2) {
        wordCount++;
        if (lexicon[w]) {
          totalValence += lexicon[w];
        }
      }
    }
    
    if (wordCount === 0) return { valence: 0, intensity: 0 };
    
    const avgValence = totalValence / Math.max(1, wordCount * 0.05); 
    const intensity = Math.min(1, Math.abs(avgValence) / 4);
    
    return { valence: avgValence, intensity };
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

  getTrending(limit = 100) {
    return this.articles
      .map(article => {
        let score = 0;
        if (article.engagement_score) {
          const hoursOld = Math.max(0, (Date.now() - new Date(article.published_at || Date.now())) / 3600000);
          score = TemporalGravity.hackerNewsGravity(article.engagement_score, hoursOld, 1.85);
        }
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
        
        // Apply Non-Linear Thresholding to Neural Matches
        const aiTextMatch = textMatches.find(v => v.id === article.slug);
        if (aiTextMatch) {
           // Emphasize high-confidence matches, suppress weak noise
           const activatedScore = NeuralEngine.sigmoid(aiTextMatch.score * 5 - 2.5);
           relevance += (activatedScore * SCORING_WEIGHTS.TIER_1_CONTENT_MATCH);
        }

        const aiVisualMatch = visualMatches.find(v => v.id === article.slug);
        if (aiVisualMatch) {
           const activatedScore = NeuralEngine.sigmoid(aiVisualMatch.score * 5 - 2.5);
           relevance += (activatedScore * SCORING_WEIGHTS.TIER_1_VISUAL_TRIGGER);
        }

        if (article.engagement_score) {
          const hoursOld = Math.max(0, (Date.now() - new Date(article.published_at || Date.now())) / 3600000);
          const gravityScore = TemporalGravity.hackerNewsGravity(article.engagement_score, hoursOld, 1.85);
          const normalizedGravity = Math.min(1, Math.log10(gravityScore + 1.5) / 2);
          relevance += (normalizedGravity * SCORING_WEIGHTS.TIER_3_WORLDWIDE_VOTE); 
        }

        // Explicitly measure and weight emotional intensity of content
        const sentiment = ContentIQ.analyzeSentiment(article.content_html || article.seo_description || article.title || '');
        relevance += (sentiment.intensity * SCORING_WEIGHTS.EMOTIONAL_RESONANCE);

        if (currentSlug) {
          let novelty = 1.0;
          if (aiTextMatch) {
             novelty = Math.max(0, 1 - aiTextMatch.score); 
          }
          // Inverted-U function to novelty: moderately different (around 30% novel) is boosted
          const invertedU = Math.exp(-Math.pow(novelty - 0.3, 2) / 0.05);
          relevance += invertedU * SCORING_WEIGHTS.NOVELTY_BONUS;
        }

        return { ...article, _relevance: relevance };
      })
      .filter(article => article !== null) 
      .sort((a, b) => b._relevance - a._relevance)
      .slice(0, limit);
  }

  getHybridVideoRecommendations(textMatches, visualMatches, limit = 6, currentSlug = null) {
    const deepPool = this.getHybridRecommendations(textMatches, visualMatches, limit * 4, currentSlug);

    const videoArticles = deepPool.filter(article => 
      article.content_html && (article.content_html.includes('<video') || article.content_html.includes('iframe'))
    );
    const textArticles = deepPool.filter(article => 
      !(article.content_html && (article.content_html.includes('<video') || article.content_html.includes('iframe')))
    );

    return [...videoArticles, ...textArticles].slice(0, limit);
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
           COALESCE(a.trending_velocity, 0) as trending_velocity,
           a.neural_vector, a.visual_vector
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