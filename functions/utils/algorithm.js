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
  TIME_SPENT_FACTOR: 0.1 // Points per second of attention
};

export class RecommendationEngine {
  constructor(articles) {
    this.articles = articles || [];
  }

  // =================================================================================================
  //  THE SENSORY CORTEX (Data Retrieval)
  //  This is the ONLY place where we write SQL to fetch data for the algorithm.
  //  If you add a new table or metric, update this method.
  // =================================================================================================
  static async fetchCandidates(env, limit = 100, searchQuery = null) {
    let results = [];
    
    // 1. Base Query parts
    // We select standard fields + The 2 Key Algorithm Metrics (Engagement & Time Spent)
    const selectClause = `
      SELECT a.slug, a.title, a.subtitle, a.author, a.published_at, a.read_time_minutes, a.image_url, a.tags, a.seo_description,
             COALESCE(m.engagement_score, 0) as engagement_score,
             COALESCE(m.avg_time_spent, 0) as avg_time_spent,
             COALESCE(m.total_views, 0) as _raw_views
      FROM articles a
      LEFT JOIN algo_metrics m ON a.slug = m.article_slug
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
      // Standard Fetch
      const sql = `${selectClause} ORDER BY a.published_at DESC LIMIT ?`;
      const { results: raw } = await env.DB.prepare(sql).bind(limit).all();
      results = raw;
    }

    return results;
  }

  // =================================================================================================
  //  THE FRONTAL CORTEX (Decision Making)
  // =================================================================================================

  // Helper to calculate a basic "score" for trending
  // Now upgraded with "Silicon Valley" logic: Velocity & Retention
  _calculateTrendingScore(article) {
    let score = 0;
    
    // 1. Recency & Decay (The "News Cycle" Factor)
    // Newer articles start strong, but decay naturally to let fresh content rise.
    const pubDate = new Date(article.published_at || Date.now());
    const now = new Date();
    const hoursOld = Math.max(0, (now - pubDate) / (1000 * 60 * 60)); // Hours instead of days for finer grain
    
    // Base score: 100. Decay: -0.5 points per hour.
    // Articles stay "fresh" for about 48 hours unless they go viral.
    score += Math.max(0, 100 - (hoursOld * 0.5));
    
    // 2. The "Deep Work" Bonus (Content-Centric)
    // We reward "Intellectual Density". Longer articles require more effort, so they get a handicap.
    const readTime = article.read_time_minutes || 5;
    if (readTime > 7) score += 15; // Long-form bonus
    else if (readTime > 3) score += 5; // Standard article

    // 3. Database-driven Signals (User-Centric)
    if (article.engagement_score !== undefined) {
       // A. Raw Popularity (The Crowd Vote)
       score += (article.engagement_score || 0);

       // B. "Sticky" Factor (Retention Rate) - Modeled from Silicon Valley "Time Spent" metrics
       // If avg_time_spent is close to read_time_minutes, it's a high-quality "Sticky" article.
       // We assume `avg_time_spent` comes from DB in seconds.
       if (article.avg_time_spent && article.read_time_minutes) {
          const estimatedSeconds = article.read_time_minutes * 60;
          const completionRate = Math.min(1.5, article.avg_time_spent / estimatedSeconds); // Cap at 150%
          
          if (completionRate > 0.8) score *= 1.5; // Huge multiplier if people actually READ it (High Quality)
          else if (completionRate < 0.2) score *= 0.5; // Penalty for clickbait (High bounce rate)
       }

       // C. Velocity (Virality) - implied by 'trending_velocity' from DB (if available)
       // This represents "Acceleration" of views in the last hour.
       if (article.trending_velocity) {
          score += (article.trending_velocity * 20); // Massive boost for currently viral items
       }
    } else {
       // Cold Start Problem: Simulation for new content without data
       if (article.title) {
           score += (article.title.length % 15); // Pseudo-random noise
           if (article.title.toLowerCase().includes('tuwa')) score += 10; // Brand boost
           if (article.title.toLowerCase().includes('exclusive')) score += 15; // "Curiosity Gap" boost
       }
    }

    return score;
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
  getRecommended(contextArticle = null, limit = 3) {
    let candidates = this.articles;

    if (contextArticle) {
      // Exclude the current article
      candidates = candidates.filter(a => a.slug !== contextArticle.slug);
      
      // Calculate relevance score based on shared tags or author
      return candidates.map(article => {
        let relevance = 0;
        
        // Same author bonus
        if (contextArticle.author && article.author === contextArticle.author) {
          relevance += 30;
        }

        // Shared tags bonus
        const contextTags = contextArticle.tags ? contextArticle.tags.toLowerCase().split(',').map(t=>t.trim()) : [];
        const articleTags = article.tags ? article.tags.toLowerCase().split(',').map(t=>t.trim()) : [];
        
        const sharedTags = contextTags.filter(t => articleTags.includes(t));
        relevance += (sharedTags.length * 20);

        // Fallback to recency if no strong matches
        const pubDate = new Date(article.published_at || Date.now());
        relevance += (1 / (1 + (Date.now() - pubDate.getTime()) / (1000 * 60 * 60 * 24 * 7))); // Slight boost for newer

        // Add engagement score as a tie-breaker or booster
        if (article.engagement_score) {
          relevance += (article.engagement_score * 0.5); 
        }

        return { ...article, _relevance: relevance };
      })
      .sort((a, b) => b._relevance - a._relevance)
      .slice(0, limit);
    }

    // Default recommendation if no context (just return top trending basically, or a mix)
    return this.getTrending(limit);
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
