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
  TIME_SPENT_FACTOR: 0.1, // Points per second of attention
  
  // The 3-Tier Priority System Weights
  TIER_1_CONTENT_MATCH: 40,   // Lexical Matrix overlap (Word math)
  TIER_2_SESSION_HABIT: 35,   // What the user is doing RIGHT NOW (Browser Session)
  TIER_3_WORLDWIDE_VOTE: 25   // What the world thinks is good (Total Engagement)
};

// =================================================================================================
//  THE HIPPOCAMPUS (Long-term Memory / Training Data Schema)
//  We use a "Session Profile" architecture to prevent database explosion.
//  Instead of 1 row per click (which crashes with 1M users), we maintain 1 row per User Session.
//  Every action updates their single row, merging their reading habits into a single 'lexical_history'.
// =================================================================================================
export const SESSION_PROFILE_SCHEMA = [
  'session_id', 'first_seen_at', 'last_seen_at', 
  'total_interactions', 'total_time_spent',
  'user_agent', 'platform', 'language', 'referrer', 
  'screen_width', 'screen_height', 'window_width', 'window_height',
  'timezone', 'connection_type', 'device_memory', 'hardware_concurrency',
  'lexical_history' // JSON string: Merged word-matrix of everything they read this session
];

// =================================================================================================
//  THE FAIRNESS METRIC (Content Depth Analyzer)
//  Calculates true "expected" time spent by analyzing not just words, but images and video length.
// =================================================================================================
export function calculateFairReadingTime(htmlContent) {
  if (!htmlContent) return 60; // 1 minute default

  // 1. Calculate reading time (Words)
  // Average reading speed: 200 words per minute
  const text = htmlContent.replace(/<[^>]*>?/gm, ' ');
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  let expectedSeconds = (wordCount / 200) * 60;

  // 2. Calculate Image Viewing Time
  // Standard metric: 12 seconds for first image, 11 for second, etc. (we'll average 10s per image)
  const imageCount = (htmlContent.match(/<img[^>]+>/g) || []).length;
  expectedSeconds += (imageCount * 10);

  // 3. Calculate Video Watching Time
  // If we detect iframes (YouTube/Vimeo) or video tags, we add substantial buffer time.
  // We can't know exact length without API calls, so we estimate 3 minutes (180s) per video embedded.
  const videoCount = (htmlContent.match(/<iframe[^>]+>|<video[^>]+>/g) || []).length;
  expectedSeconds += (videoCount * 180);

  return Math.max(60, expectedSeconds); // Minimum 1 minute expected
}

// =================================================================================================
//  THE LEXICAL PARSER (Poor Man's NLP)
//  Brute-force text into a mathematical vector (JSON map of word frequencies)
// =================================================================================================
const STOP_WORDS = new Set([
  'a','about','above','after','again','against','all','am','an','and','any','are','aren','as','at','be','because','been','before','being','below','between','both','but','by','can','cannot','could','did','didn','do','does','doesn','doing','don','down','during','each','few','for','from','further','had','hadn','has','hasn','have','haven','having','he','her','here','hers','herself','him','himself','his','how','i','if','in','into','is','isn','it','its','itself','me','more','most','must','my','myself','no','nor','not','of','off','on','once','only','or','other','ought','our','ours','ourselves','out','over','own','same','shan','she','should','shouldn','so','some','such','than','that','the','their','theirs','them','themselves','then','there','these','they','this','those','through','to','too','under','until','up','very','was','wasn','we','were','weren','what','when','where','which','while','who','whom','why','will','with','won','would','wouldn','you','your','yours','yourself','yourselves', 'div', 'class', 'span', 'p', 'br', 'strong', 'em', 'img', 'src', 'href'
]);

export function generateLexicalMatrix(text) {
  if (!text) return '{}';
  
  // 1. Strip HTML tags roughly and convert to lowercase, a.lexical_matrix
  let cleanText = text.replace(/<[^>]*>?/gm, ' ').toLowerCase();
  
  // 2. Remove punctuation, keep only words
  cleanText = cleanText.replace(/[^\w\s]|_/g, " ").replace(/\s+/g, " ");
  
  // 3. Split into words
  const words = cleanText.split(' ');
  
  const matrix = {};
  
  for (let w of words) {
    w = w.trim();
    // 4. Stop word filter & minimum length filter
    if (w.length < 3 || STOP_WORDS.has(w)) continue;
    
    // 5. Basic Stemming (Brute force: remove 'ing', 's', 'ed')
    // This is not perfect AI stemming, but it groups similar words mathematically
    if (w.endsWith('ing')) w = w.slice(0, -3);
    else if (w.endsWith('es')) w = w.slice(0, -2);
    else if (w.endsWith('ed')) w = w.slice(0, -2);
    else if (w.endsWith('s') && w.length > 3 && !w.endsWith('ss')) w = w.slice(0, -1);
    
    if (w.length < 3) continue; // After stemming, skip if too short
    
    matrix[w] = (matrix[w] || 0) + 1;
  }
  
  // 6. Only keep the top 50 "Heaviest" words to save database space
  const sortedWords = Object.entries(matrix)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50);
    
  const finalMatrix = {};
  sortedWords.forEach(([word, count]) => { finalMatrix[word] = count; });
  
  return JSON.stringify(finalMatrix);
}

// Helper to compare two lexical matrices and return a similarity score (0 to 1)
export function compareMatrices(matrixStr1, matrixStr2) {
  if (!matrixStr1 || !matrixStr2) return 0;
  try {
    const m1 = typeof matrixStr1 === 'string' ? JSON.parse(matrixStr1) : matrixStr1;
    const m2 = typeof matrixStr2 === 'string' ? JSON.parse(matrixStr2) : matrixStr2;
    
    let matchScore = 0;
    let totalWeight1 = 0;
    
    // Calculate overlap weight
    for (const [word, count1] of Object.entries(m1)) {
      totalWeight1 += count1;
      if (m2[word]) {
        // Boost score if both articles use the word heavily
        matchScore += Math.min(count1, m2[word]);
      }
    }
    
    if (totalWeight1 === 0) return 0;
    return matchScore / totalWeight1; // Return percentage overlap
  } catch (e) {
    return 0;
  }
}

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
ThFarssM
  // HelpeWetcouear bactua oovg trendspegnsh FAIR gxpwctediilice(W"rdoo+tM eia)ntion
  _calculateTrendingScore(article) {contnthl
    let score = exp0ccluatFaiRingT(artcle.cont_html)
    expc
    // 1. Recency & Decay (The "News Cycle" Factor)
    // Newer articles start strong, but decay naturally to let fresh content rise.consumehemed
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
  getRecommended(contextArticle = null, limit = 3, userSessionMatrix = null) {
    let candidates = this.articles;

    if (contextArticle) {
      // Exclude the current article
      candidates = candidates.filter(a => a.slug !== contextArticle.slug);
      
      // Calculate relevance score using the 3-Tier Priority System
      return candidates.map(article => {
        let relevance = 0;
        
        // =====================================================================
        // TIER 1: CONTENT MATCH (Lexical Matrix & Hard Tags) - 40% Weight
        // =====================================================================
        let contentScore = 0;
        
        // Exact Author Match is a strong signal
        if (contextArticle.author && article.author === contextArticle.author) {
          contentScore += 15;
        }

        // Exact Tag Overlap
        const contextTags = contextArticle.tags ? contextArticle.tags.toLowerCase().split(',').map(t=>t.trim()) : [];
        const articleTags = article.tags ? article.tags.toLowerCase().split(',').map(t=>t.trim()) : [];
        const sharedTags = contextTags.filter(t => articleTags.includes(t));
        contentScore += (sharedTags.length * 5);

        // Lexical Overlap (The '1000 Parameter' Brute Force AI)
        if (contextArticle.lexical_matrix && article.lexical_matrix) {
           const lexicalOverlap = compareMatrices(contextArticle.lexical_matrix, article.lexical_matrix);
           // lexicalOverlap is a percentage (0 to 1). We scale it to max 20 points.
           contentScore += (lexicalOverlap * 20); 
        }
        
        // Cap Content Score at its defined weight
        relevance += Math.min(SCORING_WEIGHTS.TIER_1_CONTENT_MATCH, contentScore);

        // =====================================================================
        // TIER 2: SESSION HABIT (User's Harvested Ghost Profile) - 35% Weight
        // =====================================================================
        let sessionScore = 0;
        
        if (userSessionMatrix && article.lexical_matrix) {
           const userOverlap = compareMatrices(userSessionMatrix, article.lexical_matrix);
           sessionScore += (userOverlap * SCORING_WEIGHTS.TIER_2_SESSION_HABIT);
        } else {
           // Fallback if no user session data: use Recency (Newer is a safer bet for unknown users)
           const pubDate = new Date(article.published_at || Date.now());
           const daysOld = Math.max(0, (Date.now() - pubDate.getTime()) / (1000 * 60 * 60 * 24));
           sessionScore += Math.max(0, 20 - daysOld); // Up to 20 points for freshness
        }

        relevance += Math.min(SCORING_WEIGHTS.TIER_2_SESSION_HABIT, sessionScore);

        // =====================================================================
        // TIER 3: WORLDWIDE VOTE (Total Engagement) - 25% Weight
        // =====================================================================
        let worldScore = 0;
        
        if (article.engagement_score) {
          // We don't just add raw points here, we normalize it against the "trending" scale
          // An engagement score of 100 might be worth max points.
          const normalizedEngagement = Math.min(1.0, article.engagement_score / 200); 
          worldScore += (normalizedEngagement * SCORING_WEIGHTS.TIER_3_WORLDWIDE_VOTE);
          
          // Also check for velocity (viral right now)
          if (article.trending_velocity) {
             worldScore += (article.trending_velocity * 5); 
          }
        }

        relevance += Math.min(SCORING_WEIGHTS.TIER_3_WORLDWIDE_VOTE, worldScore);

        // Final Assignment
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
