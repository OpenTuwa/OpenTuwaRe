// The Brain - Core Recommendation Algorithm for OpenTuwa
// This module acts as the centralized algorithm for determining 
// "Trending", "Recommended", and "Latest" article feeds across the platform.

export class RecommendationEngine {
  constructor(articles) {
    this.articles = articles || [];
  }

  // Helper to calculate a basic "score" for trending
  // In a real app, this would use pageviews, likes, shares, etc.
  // Here we simulate it based on read_time, publish date, and a pseudo-random engagement factor
  _calculateTrendingScore(article) {
    let score = 0;
    
    // 1. Recency factor (newer articles score higher)
    const pubDate = new Date(article.published_at || Date.now());
    const now = new Date();
    const daysOld = Math.max(0, (now - pubDate) / (1000 * 60 * 60 * 24));
    
    // Base score is 100, drops off by 2 points per day old
    score += Math.max(10, 100 - (daysOld * 2));
    
    // 2. Read time factor (longer, in-depth articles get a slight bump)
    const readTime = article.read_time_minutes || 5;
    score += Math.min(20, readTime * 2);

    // 3. Simulated engagement factor based on title length or specific keywords (just for demonstration)
    // In reality, this data would come from analytics.
    if (article.title) {
        score += (article.title.length % 15);
        if (article.title.toLowerCase().includes('tuwa')) score += 10;
        if (article.title.toLowerCase().includes('exclusive')) score += 15;
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
