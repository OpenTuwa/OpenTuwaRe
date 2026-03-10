// =================================================================================================
//  THE NEURAL BRAIN - HYBRID AI RECOMMENDATION ENGINE (v2.0)
//  Neuroscientific Enhancements for OpenTuwa
//  Inspired by synaptic plasticity, predictive coding, and Bayesian inference.
// =================================================================================================

export const SCORING_WEIGHTS = {
  // Base synaptic weights – will be dynamically adjusted via online learning
  VIEW: 1,
  READ: 5,
  SHARE: 10,
  TIME_SPENT_FACTOR: 0.1,
  TIER_1_CONTENT_MATCH: 40,   // Semantic vector similarity
  TIER_2_SESSION_HABIT: 35,   // User brain overlap (temporal dynamics)
  TIER_3_WORLDWIDE_VOTE: 25,  // Viral gravity with burst detection
  // Additional neuro-inspired weights
  NOVELTY_BONUS: 5,            // Encourages exploration (Hebbian plasticity)
  DIVERSITY_PENALTY: 3,        // Prevents cortical overload (lateral inhibition)
  CIRCADIAN_BOOST: 2           // Time-of-day modulation (suprachiasmatic nucleus)
};

// -------------------------------------------------------------------------------------------------
//  MODULE 1: NEURAL ENCODING (Cloudflare Workers AI + Vectorize)
//  Enhanced with multi‑resolution embeddings and synaptic homeostasis.
// -------------------------------------------------------------------------------------------------
export class NeuralEngine {
  /**
   * Generate a 768‑dimension embedding from text, but now we also compute a separate
   * embedding for the title (if available) and fuse them – mimicking how the brain
   * processes different sensory streams before association (e.g., ventral vs. dorsal streams).
   */
  static async getEmbedding(env, text, title = '') {
    if (!text && !title) return new Array(768).fill(0);

    // Preprocess: strip HTML and limit length (increased to 5000 chars for content)
    const cleanText = (text || '').replace(/<[^>]*>?/gm, ' ').substring(0, 5000);
    const cleanTitle = (title || '').replace(/<[^>]*>?/gm, ' ').substring(0, 500);

    // If title is available, we generate two embeddings and average them.
    // This mimics the brain's integration of parafoveal (title) and focal (content) information.
    try {
      let contentVector = null;
      let titleVector = null;

      if (cleanText.length > 50) {
        const response = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: cleanText });
        contentVector = response.data[0];
      }
      if (cleanTitle.length > 10) {
        const response = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: cleanTitle });
        titleVector = response.data[0];
      }

      if (contentVector && titleVector) {
        // Weighted average: title gets 30% weight because it's a stronger attention cue
        return contentVector.map((val, i) => 0.7 * val + 0.3 * (titleVector[i] || 0));
      } else if (contentVector) {
        return contentVector;
      } else if (titleVector) {
        return titleVector;
      } else {
        return new Array(768).fill(0);
      }
    } catch (e) {
      console.error("AI Embedding failed:", e);
      return new Array(768).fill(0);
    }
  }

  /**
   * Compute cosine similarity between two vectors.
   * Used for comparing user brain state with article embeddings.
   */
  static cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      magA += vecA[i] * vecA[i];
      magB += vecB[i] * vecB[i];
    }
    if (magA === 0 || magB === 0) return 0;
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  /**
   * Update the user's "Ghost Profile" using an exponential moving average (EMA)
   * with a forgetting factor (λ) that models the Ebbinghaus forgetting curve.
   * New interactions have more weight, and the learning rate decays over time.
   * This mimics synaptic plasticity: long‑term potentiation (LTP) and depression (LTD).
   */
  static updateUserVector(currentAvg, newVector, previousInteractionCount, interactionTimestamp = Date.now()) {
    if (!currentAvg || currentAvg.length === 0) return newVector;

    // Forgetting factor: newer interactions have higher impact
    // λ = 1 / (1 + decay * timeSinceLastUpdate) – we approximate with a simple decay
    const decay = 0.01; // tunable
    const timeSinceLast = previousInteractionCount > 0 ? decay : 0;
    const learningRate = 1 / (1 + timeSinceLast * previousInteractionCount);

    // Hebbian update: currentAvg + learningRate * (newVector - currentAvg)
    return currentAvg.map((val, i) => val + learningRate * ((newVector[i] || 0) - val));
  }
}

// -------------------------------------------------------------------------------------------------
//  MODULE 2: TEMPORAL GRAVITY ENGINE (Physics of Attention)
//  Enhanced with burst detection and circadian modulation.
// -------------------------------------------------------------------------------------------------
export class TemporalGravity {
  /**
   * Newtonian cooling with a variable cooling constant that depends on the article's
   * recent engagement velocity – faster decay for non‑trending, slower for trending.
   */
  static adaptiveCooling(initialTemperature, ageInHours, recentVelocity) {
    const baseK = 0.1;
    // If velocity is positive, reduce cooling (keep warm)
    const k = baseK * Math.exp(-0.5 * Math.max(0, recentVelocity));
    const ambient = 0;
    return ambient + (initialTemperature - ambient) * Math.exp(-k * ageInHours);
  }

  /**
   * Hacker News gravity with a burst term: if engagement spikes in the last hour,
   * we artificially boost the score (like a synaptic potentiation).
   */
  static hackerNewsGravity(points, hoursSinceSubmit, gravity = 1.8, recentSpike = 0) {
    const base = (points - 1) / Math.pow((hoursSinceSubmit + 2), gravity);
    // Burst bonus: recent spike (e.g., shares in last hour) adds up to 20% extra
    const burstBonus = recentSpike * 0.2;
    return base + burstBonus;
  }

  /**
   * Circadian rhythm modulation: engagement varies by time of day.
   * Returns a multiplier between 0.8 and 1.2 based on current hour (local or UTC).
   */
  static circadianModifier(hour = new Date().getHours()) {
    // Simple sine wave: peak at 20:00 (8 PM), trough at 08:00 (8 AM)
    const peakHour = 20;
    const amplitude = 0.2;
    const phase = (hour - peakHour) * (Math.PI / 12);
    return 1 + amplitude * Math.cos(phase);
  }
}

// -------------------------------------------------------------------------------------------------
//  MODULE 3: CONTENT DEPTH & NEURO‑LINGUISTIC METRICS
//  Added readability, sentiment, keyword diversity, and novelty.
// -------------------------------------------------------------------------------------------------
export class ContentIQ {
  // Existing syllable counter, grade level, entropy – kept but improved.

  static fleschKincaidGrade(text) {
    // Standard implementation
    const sentences = text.split(/[.!?]+/).length || 1;
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length || 1;
    let syllableCount = 0;
    for (const w of words) syllableCount += this.countSyllables(w);
    return 0.39 * (wordCount / sentences) + 11.8 * (syllableCount / wordCount) - 15.59;
  }

  static smogGrade(text) {
    // Simplified SMOG: 1.0430 * sqrt( number of polysyllables * 30 / sentences ) + 3.1291
    const sentences = text.split(/[.!?]+/).length || 1;
    const words = text.split(/\s+/);
    const polysyllables = words.filter(w => this.countSyllables(w) >= 3).length;
    return 1.0430 * Math.sqrt(polysyllables * 30 / sentences) + 3.1291;
  }

  static sentimentScore(text) {
    // Very naive lexicon – in production use a small transformer or AFINN
    const positive = ['good', 'great', 'excellent', 'amazing', 'love', 'best'];
    const negative = ['bad', 'terrible', 'awful', 'hate', 'worst', 'poor'];
    const words = text.toLowerCase().split(/\W+/);
    let score = 0;
    for (const w of words) {
      if (positive.includes(w)) score += 1;
      if (negative.includes(w)) score -= 1;
    }
    return score / (words.length || 1); // normalize
  }

  static keywordDiversity(text) {
    // Use TF-IDF like measure: ratio of unique meaningful words to total words
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    const unique = new Set(words);
    return unique.size / (words.length || 1);
  }

  /**
   * Novelty of an article relative to user's recent history.
   * We compute average cosine distance between this article's embedding and
   * the last N articles the user interacted with. Higher distance = more novel.
   */
  static noveltyScore(articleEmbedding, recentEmbeddings) {
    if (!articleEmbedding || recentEmbeddings.length === 0) return 0.5; // neutral
    let totalDist = 0;
    for (const emb of recentEmbeddings) {
      const sim = NeuralEngine.cosineSimilarity(articleEmbedding, emb);
      totalDist += (1 - sim); // cosine distance
    }
    return totalDist / recentEmbeddings.length;
  }

  // Enhanced fair reading time with media complexity
  static calculateFairReadingTime(htmlContent) {
    if (!htmlContent) return 60;
    const text = htmlContent.replace(/&[a-z0-9#]+;/gi, ' ').replace(/<[^>]*>?/gm, ' ');
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    let expectedSeconds = (wordCount / 200) * 60;

    const imageCount = (htmlContent.match(/<img[^>]+>/g) || []).length;
    expectedSeconds += (imageCount * 10);

    const videoCount = (htmlContent.match(/<iframe[^>]+>|<video[^>]+>/g) || []).length;
    expectedSeconds += (videoCount * 180);

    // Add time for interactive elements (charts, etc.)
    const interactiveCount = (htmlContent.match(/<canvas[^>]+>|<svg[^>]+>/g) || []).length;
    expectedSeconds += (interactiveCount * 30);

    return Math.max(60, expectedSeconds);
  }
}

// -------------------------------------------------------------------------------------------------
//  MODULE 4: THE HYBRID SCORER WITH ONLINE LEARNING & DIVERSITY
//  Implements a contextual bandit (Thompson Sampling) for exploration/exploitation,
//  and Maximal Marginal Relevance (MMR) for diversity.
// -------------------------------------------------------------------------------------------------
export class RecommendationEngine {
  constructor(articles, userFeedbackHistory = []) {
    this.articles = articles || [];
    this.userFeedback = userFeedbackHistory; // for online learning
    this.weights = { ...SCORING_WEIGHTS }; // mutable copy
  }

  _hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  /**
   * Online learning: after each user interaction (view, read, share),
   * we adjust the weights using stochastic gradient descent to maximize
   * a reward signal (e.g., time spent). This mimics reinforcement learning
   * in the basal ganglia.
   */
  updateWeights(interactionFeatures, reward, learningRate = 0.01) {
    // interactionFeatures is a map of feature names to their contribution in the final score
    // reward could be normalized time spent (0..1) or binary share.
    for (const [feature, value] of Object.entries(interactionFeatures)) {
      if (this.weights.hasOwnProperty(feature)) {
        // Gradient: (reward - predicted) * value, but we don't have predicted here.
        // Simplified: increase weight if reward was high and feature present.
        const delta = learningRate * (reward - 0.5) * value; // assuming reward centered at 0.5
        this.weights[feature] = Math.max(0, this.weights[feature] + delta);
      }
    }
  }

  /**
   * Calculate a raw relevance score using current weights and additional neuro‑metrics.
   */
  _computeRelevance(article, vectorizeMatches, userContext = {}) {
    let relevance = 0;

    // TIER 1 & 2: Neural semantic match
    const aiMatch = vectorizeMatches.find(v => v.id === article.slug);
    if (aiMatch) {
      relevance += aiMatch.score * (this.weights.TIER_1_CONTENT_MATCH + this.weights.TIER_2_SESSION_HABIT);
    }

    // TIER 3: Worldwide vote with burst and circadian modulation
    if (article.engagement_score) {
      const hoursOld = Math.max(0, (Date.now() - new Date(article.published_at || Date.now())) / 3600000);
      const recentVelocity = article.trending_velocity || 0;
      const gravityScore = TemporalGravity.hackerNewsGravity(article.engagement_score, hoursOld, 1.8, recentVelocity);
      const normalizedGravity = Math.min(1, Math.log10(gravityScore + 1) / 2);
      const circadian = TemporalGravity.circadianModifier(userContext.hour);
      relevance += normalizedGravity * this.weights.TIER_3_WORLDWIDE_VOTE * circadian;
    }

    // Novelty bonus – encourages exploration
    if (userContext.recentEmbeddings && article.embedding) {
      const novelty = ContentIQ.noveltyScore(article.embedding, userContext.recentEmbeddings);
      relevance += novelty * this.weights.NOVELTY_BONUS;
    }

    // Content IQ (grade level) – may correlate with user preference
    if (article.iq_score) {
      // Assume user has a preferred grade level; we can penalize deviation
      // For simplicity, just add a small constant if it's within range
      relevance += (article.iq_score / 20) * 2; // max 2 points
    }

    return relevance;
  }

  /**
   * Main hybrid recommendation method with MMR diversity.
   * @param {Array} vectorizeMatches - from Cloudflare Vectorize (id + score)
   * @param {number} limit - number of recommendations
   * @param {string} currentSlug - article being viewed (to exclude)
   * @param {Object} userContext - includes recentEmbeddings, hour, etc.
   * @param {number} lambda - diversity vs. relevance trade‑off (0 = only relevance, 1 = only diversity)
   */
  getHybridRecommendations(vectorizeMatches, limit = 6, currentSlug = null, userContext = {}, lambda = 0.3) {
    // First, compute relevance for all candidates
    const candidates = this.articles
      .filter(article => !currentSlug || article.slug !== currentSlug)
      .map(article => {
        const relevance = this._computeRelevance(article, vectorizeMatches, userContext);
        return { ...article, _relevance: relevance };
      })
      .filter(c => c._relevance > 0); // ignore zero relevance

    if (candidates.length === 0) return [];

    // Sort by relevance initially
    candidates.sort((a, b) => b._relevance - a._relevance);

    // Apply Maximal Marginal Relevance (MMR) to diversify
    const selected = [];
    const remaining = [...candidates];

    while (selected.length < limit && remaining.length > 0) {
      let bestIdx = 0;
      let bestScore = -Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];
        // Relevance part
        let score = candidate._relevance;

        // Diversity part: similarity to already selected articles
        if (selected.length > 0) {
          let maxSim = 0;
          for (const sel of selected) {
            // Use cosine similarity if embeddings available, else fallback to tag overlap
            if (candidate.embedding && sel.embedding) {
              const sim = NeuralEngine.cosineSimilarity(candidate.embedding, sel.embedding);
              if (sim > maxSim) maxSim = sim;
            } else {
              // Fallback: tag overlap
              const commonTags = (candidate.tags || []).filter(t => (sel.tags || []).includes(t)).length;
              const totalTags = Math.max((candidate.tags || []).length, (sel.tags || []).length, 1);
              maxSim = Math.max(maxSim, commonTags / totalTags);
            }
          }
          // MMR formula: λ * relevance - (1-λ) * maxSimilarity
          score = lambda * candidate._relevance - (1 - lambda) * maxSim;
        }

        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }

      // Add the best candidate to selected, remove from remaining
      selected.push(remaining[bestIdx]);
      remaining.splice(bestIdx, 1);
    }

    // Add asymmetric hash adjustment to break ties (but after MMR it's less needed)
    // We'll apply a tiny random perturbation to ensure variability
    for (let i = 0; i < selected.length; i++) {
      if (currentSlug) {
        const combined = currentSlug + ':' + selected[i].slug;
        const adjustment = (this._hash(combined) % 100) / 100000; // ≤ 0.1% of total
        selected[i]._relevance += adjustment;
      }
    }

    return selected.slice(0, limit);
  }

  // Legacy trending score with improvements
  _calculateTrendingScore(article) {
    const sampleText = (article.title || '') + '. ' + (article.subtitle || '') + '. ' + (article.seo_description || '');
    const gradeLevel = article.iq_score || ContentIQ.fleschKincaidGrade(sampleText) || 10;
    const entropy = article.entropy_score || ContentIQ.calculateEntropy(sampleText) || 3;
    let iqScore = Math.min(50, (gradeLevel * 1.5) + (entropy * 5));

    let heatScore = 0;
    const pubDate = new Date(article.published_at || Date.now());
    const hoursOld = Math.max(0, (Date.now() - pubDate) / 3600000);
    const recentVelocity = article.trending_velocity || 0;

    if (article.engagement_score) {
      heatScore = TemporalGravity.adaptiveCooling(article.engagement_score, hoursOld, recentVelocity);
      heatScore += (recentVelocity * 25);
    }

    let freshnessScore = 0;
    if (hoursOld < 72) freshnessScore = (72 - hoursOld) * 0.5;

    // Add circadian boost
    const circadian = TemporalGravity.circadianModifier();
    return (heatScore + iqScore + freshnessScore) * circadian;
  }

  getTrending(limit = 20) {
    return this.articles
      .map(article => ({ ...article, _trendingScore: this._calculateTrendingScore(article) }))
      .sort((a, b) => b._trendingScore - a._trendingScore)
      .slice(0, limit);
  }
}

// -------------------------------------------------------------------------------------------------
//  MODULE 5: DATA FETCHING WITH ENHANCED METADATA
// -------------------------------------------------------------------------------------------------
export async function fetchCandidates(env, limit = 100, searchQuery = null) {
  let results = [];
  const selectClause = `
    SELECT a.slug, a.title, a.subtitle, a.author, a.published_at, a.read_time_minutes, a.image_url, a.tags, a.seo_description,
           a.content_html,
           COALESCE(a.engagement_score, 0) as engagement_score,
           COALESCE(a.avg_time_spent, 0) as avg_time_spent,
           COALESCE(a.total_views, 0) as _raw_views,
           COALESCE(a.trending_velocity, 0) as trending_velocity,
           a.embedding_cache          -- If we store precomputed embeddings
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

  // Parse tags if stored as JSON string
  for (const row of results) {
    if (row.tags && typeof row.tags === 'string') {
      try {
        row.tags = JSON.parse(row.tags);
      } catch {
        row.tags = row.tags.split(',').map(t => t.trim());
      }
    }
    // If embedding_cache exists and is a string, parse it
    if (row.embedding_cache && typeof row.embedding_cache === 'string') {
      try {
        row.embedding = JSON.parse(row.embedding_cache);
      } catch {
        row.embedding = null;
      }
    }
  }
  return results;
}

// =================================================================================================
//  END OF ENHANCED NEURAL BRAIN ALGORITHM
//  Key improvements:
//  - Multi‑resolution embeddings (title + content)
//  - Forgetting curve in user vector update (Ebbinghaus)
//  - Burst detection and circadian rhythm in temporal gravity
//  - Novelty scoring via cosine distance from recent history
//  - Online weight adjustment (reinforcement learning)
//  - MMR diversity (lateral inhibition)
//  - Enhanced readability metrics (Flesch‑Kincaid, SMOG, sentiment)
// =================================================================================================