




export const SCORING_WEIGHTS = {
  
  VIEW: 1,
  READ: 5,
  SHARE: 10,
  TIME_SPENT_FACTOR: 0.1,

  
  TIER_1_CONTENT_MATCH: 40,   
  TIER_2_SESSION_HABIT: 35,   
  TIER_3_WORLDWIDE_VOTE: 25,  

  
  NOVELTY_BONUS: 5,            
  DIVERSITY_PENALTY: 3,        
  CIRCADIAN_BOOST: 2,          
  PREDICTION_ERROR: 4,         
  EMOTIONAL_ALIGNMENT: 3,      
  HOMEOSTATIC_BASELINE: 2      
};




export class NeuralEngine {
  
  static async getEmbedding(env, text, title = '', imageUrl = null) {
    if (!text && !title && !imageUrl) return new Array(768).fill(0);

    const cleanText = (text || '').replace(/<[^>]*>?/gm, ' ').substring(0, 5000);
    const cleanTitle = (title || '').replace(/<[^>]*>?/gm, ' ').substring(0, 500);

    let textVector = null;
    let titleVector = null;
    let imageVector = null;

    try {
      
      if (cleanText.length > 50) {
        const response = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: cleanText });
        textVector = response.data[0];
      }

      
      if (cleanTitle.length > 10) {
        const response = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: cleanTitle });
        titleVector = response.data[0];
      }

      
      
      

      
      const fusion = (vecs) => {
        if (vecs.length === 0) return null;
        const sum = vecs.reduce((acc, v) => acc.map((x, i) => x + v[i]), new Array(768).fill(0));
        return sum.map(x => x / vecs.length);
      };

      const available = [];
      if (textVector) available.push(textVector);
      if (titleVector) available.push(titleVector);
      if (imageVector) available.push(imageVector);

      if (available.length > 0) {
        return fusion(available);
      }
      return new Array(768).fill(0);
    } catch (e) {
      console.error("AI Embedding failed:", e);
      return new Array(768).fill(0);
    }
  }

  
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

  
  static predictiveUpdate(priorMean, priorCovariance, observation, observationCovariance) {
    
    const gain = priorCovariance / (priorCovariance + observationCovariance);
    const posteriorMean = priorMean + gain * (observation - priorMean);
    const posteriorCovariance = (1 - gain) * priorCovariance;
    return { mean: posteriorMean, covariance: posteriorCovariance, innovation: observation - priorMean };
  }

  
  static updateUserProfile(profile, newVector, timeSinceLastHours, interactionCount) {
    if (!profile || !profile.mean) {
      
      return {
        mean: newVector,
        covariance: new Array(768).fill(0.1), 
        lastUpdate: Date.now(),
        surprise: 0
      };
    }

    
    const decayFactor = Math.exp(-0.01 * timeSinceLastHours); 
    const inflatedCov = profile.covariance.map(c => c / decayFactor + 0.001); 

    
    const newMean = [];
    const newCov = [];
    let totalSurprise = 0;
    const obsNoise = 0.05; 

    for (let i = 0; i < 768; i++) {
      const priorMean = profile.mean[i];
      const priorCov = inflatedCov[i];
      const obs = newVector[i] || 0;

      const gain = priorCov / (priorCov + obsNoise);
      const posteriorMean = priorMean + gain * (obs - priorMean);
      const posteriorCov = (1 - gain) * priorCov;
      newMean.push(posteriorMean);
      newCov.push(posteriorCov);

      const innovation = obs - priorMean;
      totalSurprise += Math.abs(innovation);
    }

    return {
      mean: newMean,
      covariance: newCov,
      lastUpdate: Date.now(),
      surprise: totalSurprise / 768 
    };
  }
}




export class TemporalGravity {
  
  static adaptiveCooling(initialTemperature, ageInHours, recentVelocity) {
    const baseK = 0.1;
    const k = baseK * Math.exp(-0.5 * Math.max(0, recentVelocity));
    const ambient = 0;
    return ambient + (initialTemperature - ambient) * Math.exp(-k * ageInHours);
  }

  
  static hackerNewsGravity(points, hoursSinceSubmit, gravity = 1.8, recentSpike = 0) {
    const base = (points - 1) / Math.pow((hoursSinceSubmit + 2), gravity);
    const burstBonus = recentSpike * 0.2;
    return base + burstBonus;
  }

  
  static circadianModifier(hour = new Date().getHours(), minute = new Date().getMinutes()) {
    
    const peakHour = 20;
    const amp = 0.2;
    const circPhase = (hour - peakHour) * (Math.PI / 12);
    const circ = 1 + amp * Math.cos(circPhase);

    
    const ultraAmp = 0.05;
    const ultraPhase = (minute / 90) * 2 * Math.PI; 
    const ultra = 1 + ultraAmp * Math.sin(ultraPhase);

    return circ * ultra;
  }
}




export class ContentIQ {
  
  static countSyllables(word) {  }
  static fleschKincaidGrade(text) {  }
  static smogGrade(text) {  }
  static calculateEntropy(text) {  }

  
  static sentimentScore(text) {
    const positive = ['good', 'great', 'excellent', 'amazing', 'love', 'best', 'hope', 'inspire'];
    const negative = ['bad', 'terrible', 'awful', 'hate', 'worst', 'poor', 'fear', 'crisis'];
    const words = text.toLowerCase().split(/\W+/);
    let score = 0;
    for (const w of words) {
      if (positive.includes(w)) score += 1;
      if (negative.includes(w)) score -= 1;
    }
    return score / (words.length || 1); 
  }

  
  static keywordDiversity(text) {  }

  
  static noveltyScore(articleEmbedding, recentEmbeddings) {
    if (!articleEmbedding || recentEmbeddings.length === 0) return 0.5;
    let totalDist = 0;
    for (const emb of recentEmbeddings) {
      const sim = NeuralEngine.cosineSimilarity(articleEmbedding, emb);
      totalDist += (1 - sim);
    }
    return totalDist / recentEmbeddings.length;
  }

  
  static calculateFairReadingTime(htmlContent) {  }
}




export class RecommendationEngine {
  constructor(articles, userProfile = null) {
    this.articles = articles || [];
    this.userProfile = userProfile; 
    
    this.weights = { ...SCORING_WEIGHTS };
    
    this.averageRelevance = 0;
    this.nUpdates = 0;
  }

  _hash(str) {  }

  
  _metaLearningRate(baseRate = 0.01) {
    if (!this.userProfile) return baseRate;
    const surprise = this.userProfile.surprise || 0;
    
    return baseRate * (1 + 2 * surprise); 
  }

  
  _homeostaticScale() {
    const total = Object.values(this.weights).reduce((s, v) => s + v, 0);
    const target = SCORING_WEIGHTS.VIEW + SCORING_WEIGHTS.READ + SCORING_WEIGHTS.SHARE +
                   SCORING_WEIGHTS.TIER_1_CONTENT_MATCH + SCORING_WEIGHTS.TIER_2_SESSION_HABIT +
                   SCORING_WEIGHTS.TIER_3_WORLDWIDE_VOTE + SCORING_WEIGHTS.NOVELTY_BONUS +
                   SCORING_WEIGHTS.DIVERSITY_PENALTY + SCORING_WEIGHTS.CIRCADIAN_BOOST +
                   SCORING_WEIGHTS.PREDICTION_ERROR + SCORING_WEIGHTS.EMOTIONAL_ALIGNMENT +
                   SCORING_WEIGHTS.HOMEOSTATIC_BASELINE;
    const factor = target / total;
    for (const k in this.weights) {
      this.weights[k] *= factor;
    }
  }

  
  updateWeights(interactionFeatures, reward, predictedRelevance) {
    const lr = this._metaLearningRate();
    const delta = reward - predictedRelevance; 

    for (const [feature, value] of Object.entries(interactionFeatures)) {
      if (this.weights.hasOwnProperty(feature)) {
        
        this.weights[feature] += lr * delta * value;
        
        this.weights[feature] = Math.max(0, this.weights[feature]);
      }
    }

    
    this._homeostaticScale();
  }

  
  _computeRelevance(article, vectorizeMatches, userContext = {}) {
    let relevance = 0;

    
    const aiMatch = vectorizeMatches.find(v => v.id === article.slug);
    if (aiMatch) {
      relevance += aiMatch.score * (this.weights.TIER_1_CONTENT_MATCH + this.weights.TIER_2_SESSION_HABIT);
    } else {
      
      if (userContext.recentTags && article.tags) {
        const common = (article.tags || []).filter(t => userContext.recentTags.includes(t)).length;
        const max = Math.max(article.tags.length, userContext.recentTags.length, 1);
        relevance += (common / max) * (this.weights.TIER_1_CONTENT_MATCH + this.weights.TIER_2_SESSION_HABIT) * 0.5;
      }
    }

    
    if (article.engagement_score) {
      const hoursOld = Math.max(0, (Date.now() - new Date(article.published_at || Date.now())) / 3600000);
      const recentVelocity = article.trending_velocity || 0;
      const gravityScore = TemporalGravity.hackerNewsGravity(article.engagement_score, hoursOld, 1.8, recentVelocity);
      const normalizedGravity = Math.min(1, Math.log10(gravityScore + 1) / 2);
      const circadian = TemporalGravity.circadianModifier(userContext.hour, userContext.minute);
      relevance += normalizedGravity * this.weights.TIER_3_WORLDWIDE_VOTE * circadian;
    }

    
    if (userContext.recentEmbeddings && article.embedding) {
      const novelty = ContentIQ.noveltyScore(article.embedding, userContext.recentEmbeddings);
      relevance += novelty * this.weights.NOVELTY_BONUS;
    }

    
    if (this.userProfile && article.embedding) {
      
      let surprise = 0;
      for (let i = 0; i < 768; i++) {
        surprise += Math.abs((article.embedding[i] || 0) - this.userProfile.mean[i]);
      }
      surprise /= 768;
      
      const normSurprise = Math.min(1, surprise);
      
      relevance += normSurprise * this.weights.PREDICTION_ERROR;
    }

    
    if (userContext.recentSentiment !== undefined && article.sentiment !== undefined) {
      const alignment = 1 - Math.abs(userContext.recentSentiment - article.sentiment);
      relevance += alignment * this.weights.EMOTIONAL_ALIGNMENT;
    }

    
    if (article.iq_score) {
      relevance += (article.iq_score / 20) * 2; 
    }

    
    relevance += this.weights.HOMEOSTATIC_BASELINE * 0.1; 

    return relevance;
  }

  
  getHybridRecommendations(vectorizeMatches, limit = 6, currentSlug = null, userContext = {}, lambdaBase = 0.3) {
    
    const candidates = this.articles
      .filter(article => !currentSlug || article.slug !== currentSlug)
      .map(article => {
        const relevance = this._computeRelevance(article, vectorizeMatches, userContext);
        return { ...article, _relevance: relevance };
      })
      .filter(c => c._relevance > 0);

    if (candidates.length === 0) {
      
      return this.articles.slice(0, limit).map(a => ({ ...a, _relevance: 1 }));
    }

    
    candidates.sort((a, b) => b._relevance - a._relevance);

    
    let lambda = lambdaBase;
    if (this.userProfile && this.userProfile.surprise > 0.3) {
      lambda = Math.max(0.1, lambdaBase - 0.2); 
    }

    
    const selected = [];
    const remaining = [...candidates];

    while (selected.length < limit && remaining.length > 0) {
      let bestIdx = 0;
      let bestScore = -Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];
        let score = candidate._relevance;

        if (selected.length > 0) {
          let maxSim = 0;
          for (const sel of selected) {
            if (candidate.embedding && sel.embedding) {
              const sim = NeuralEngine.cosineSimilarity(candidate.embedding, sel.embedding);
              if (sim > maxSim) maxSim = sim;
            } else {
              
              const commonTags = (candidate.tags || []).filter(t => (sel.tags || []).includes(t)).length;
              const totalTags = Math.max((candidate.tags || []).length, (sel.tags || []).length, 1);
              maxSim = Math.max(maxSim, commonTags / totalTags);
            }
          }
          score = lambda * candidate._relevance - (1 - lambda) * maxSim;
        }

        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }

      selected.push(remaining[bestIdx]);
      remaining.splice(bestIdx, 1);
    }

    
    for (let i = 0; i < selected.length; i++) {
      if (currentSlug) {
        const combined = currentSlug + ':' + selected[i].slug;
        const adjustment = (this._hash(combined) % 100) / 100000;
        selected[i]._relevance += adjustment;
      }
    }

    return selected.slice(0, limit);
  }

  
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




export async function fetchCandidates(env, limit = 100, searchQuery = null) {
  let results = [];
  const selectClause = `
    SELECT a.slug, a.title, a.subtitle, a.author, a.published_at, a.read_time_minutes, a.image_url, a.tags, a.seo_description,
           a.content_html,
           COALESCE(a.engagement_score, 0) as engagement_score,
           COALESCE(a.avg_time_spent, 0) as avg_time_spent,
           COALESCE(a.total_views, 0) as _raw_views,
           COALESCE(a.trending_velocity, 0) as trending_velocity,
           a.embedding_cache,
           a.sentiment_score   -- new column if you store it
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

  for (const row of results) {
    if (row.tags && typeof row.tags === 'string') {
      try {
        row.tags = JSON.parse(row.tags);
      } catch {
        row.tags = row.tags.split(',').map(t => t.trim());
      }
    }
    if (row.embedding_cache && typeof row.embedding_cache === 'string') {
      try {
        row.embedding = JSON.parse(row.embedding_cache);
      } catch {
        row.embedding = null;
      }
    }
    
    if (row.sentiment_score === undefined || row.sentiment_score === null) {
      const sampleText = (row.title || '') + '. ' + (row.subtitle || '') + '. ' + (row.seo_description || '');
      row.sentiment = ContentIQ.sentimentScore(sampleText);
    } else {
      row.sentiment = row.sentiment_score;
    }
  }
  return results;
}