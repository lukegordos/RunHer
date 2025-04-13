// News API service for fetching news data to enhance safety predictions
// API Key: e18c4e1578464a8081ddaa11e2deeb5a

export interface NewsArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

export interface NewsResponse {
  status: string;
  totalResults: number;
  articles: NewsArticle[];
}

export interface NewsSafetyAnalysis {
  score: number;                   // 0-1 scale where 1 is most concerning
  relevantArticles: NewsArticle[]; // Articles that influenced the score
  keywordMatches: {               // Keywords found in the articles
    keyword: string;
    count: number;
    articles: string[];           // Article titles containing this keyword
  }[];
  recentEvents: string[];         // Summary of recent safety events from news
  predictionConfidence: number;   // 0-1 scale of confidence in the prediction
}

// Keywords that might indicate safety concerns in news articles
const safetyKeywords = [
  'crime', 'assault', 'robbery', 'theft', 'shooting', 'violence',
  'attack', 'murder', 'homicide', 'burglary', 'carjacking', 'stabbing',
  'protest', 'riot', 'demonstration', 'police', 'emergency', 'incident',
  'danger', 'warning', 'alert', 'unsafe', 'suspicious', 'investigation'
];

// Severity weights for different keywords (higher = more severe safety concern)
const keywordSeverity: Record<string, number> = {
  'murder': 1.0,
  'homicide': 1.0,
  'shooting': 0.9,
  'stabbing': 0.9,
  'assault': 0.8,
  'attack': 0.8,
  'violence': 0.8,
  'carjacking': 0.7,
  'robbery': 0.7,
  'burglary': 0.6,
  'theft': 0.5,
  'crime': 0.5,
  'danger': 0.5,
  'warning': 0.4,
  'alert': 0.4,
  'police': 0.3,
  'emergency': 0.3,
  'incident': 0.3,
  'protest': 0.3,
  'riot': 0.3,
  'demonstration': 0.2,
  'investigation': 0.2,
  'unsafe': 0.4,
  'suspicious': 0.3
};

// Function to fetch news data for a specific location
export const fetchNewsForLocation = async (
  latitude: number,
  longitude: number,
  radius: number = 20 // radius in kilometers
): Promise<NewsArticle[]> => {
  try {
    console.log('Fetching news data for:', { latitude, longitude, radius });
    
    // Get location name based on coordinates (reverse geocoding)
    const locationName = await getLocationNameFromCoordinates(latitude, longitude);
    
    // Calculate date range for the past two weeks
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 14); // Go back 14 days
    
    // Format dates for the API query (YYYY-MM-DD format)
    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };
    
    console.log('Date range:', {
      start: formatDate(startDate),
      end: formatDate(endDate)
    });
    
    // Construct the API URL with location name and date range
    const apiKey = 'e18c4e1578464a8081ddaa11e2deeb5a';
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(locationName)}&from=${formatDate(startDate)}&to=${formatDate(endDate)}&sortBy=relevancy&apiKey=${apiKey}`;
    
    console.log('Fetching from URL:', url);
    
    // Fetch data from News API
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: NewsResponse = await response.json();
    console.log('Raw news response:', data);
    
    if (!data.articles || !Array.isArray(data.articles)) {
      console.error('Invalid response format:', data);
      return [];
    }
    
    console.log('Number of articles found:', data.articles.length);
    
    return data.articles;
  } catch (error) {
    console.error('Error fetching news data:', error);
    return [];
  }
};

// Helper function to get location name from coordinates using reverse geocoding
const getLocationNameFromCoordinates = async (latitude: number, longitude: number): Promise<string> => {
  try {
    // For simplicity, we'll use a default location name based on the coordinates
    // In a production environment, you would use a geocoding service like Google Maps API
    
    // Hardcoded location names for common coordinates (for demo purposes)
    const knownLocations: Record<string, string> = {
      '38.9072,-77.0369': 'Washington DC',
      '40.7128,-74.0060': 'New York City',
      '34.0522,-118.2437': 'Los Angeles',
      '41.8781,-87.6298': 'Chicago',
      '29.7604,-95.3698': 'Houston',
      '39.9526,-75.1652': 'Philadelphia',
      '33.4484,-112.0740': 'Phoenix'
    };
    
    // Round coordinates to 4 decimal places for lookup
    const roundedCoords = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    
    // Check if we have a hardcoded location for these coordinates
    for (const [coords, name] of Object.entries(knownLocations)) {
      const [lat, lng] = coords.split(',').map(Number);
      const distance = calculateDistance(latitude, longitude, lat, lng);
      
      // If within 10km, use this location name
      if (distance < 10) {
        return name;
      }
    }
    
    // Default to a generic location name based on coordinates
    return `area near ${latitude.toFixed(2)},${longitude.toFixed(2)}`;
  } catch (error) {
    console.error('Error getting location name:', error);
    return `area near ${latitude.toFixed(2)},${longitude.toFixed(2)}`;
  }
};

// Calculate distance between two points using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI/180);
};

// Analyze news articles for safety concerns with detailed breakdown
export const analyzeNewsForSafety = (articles: NewsArticle[]): NewsSafetyAnalysis => {
  if (articles.length === 0) {
    return {
      score: 0,
      relevantArticles: [],
      keywordMatches: [],
      recentEvents: [],
      predictionConfidence: 0
    };
  }
  
  let safetyScore = 0;
  let relevantArticles: NewsArticle[] = [];
  let keywordMatchMap: Record<string, {count: number, articles: string[]}> = {};
  
  // Analyze each article for safety keywords
  articles.forEach(article => {
    // Combine title and description for analysis
    const content = `${article.title} ${article.description || ''}`.toLowerCase();
    
    // Find all safety keywords in the article
    const matchedKeywords = safetyKeywords.filter(keyword => 
      content.includes(keyword.toLowerCase())
    );
    
    if (matchedKeywords.length > 0) {
      // This article is relevant to safety
      relevantArticles.push(article);
      
      // Calculate impact based on keyword severity and recency
      let articleImpact = 0;
      
      matchedKeywords.forEach(keyword => {
        // Update keyword match count
        if (!keywordMatchMap[keyword]) {
          keywordMatchMap[keyword] = { count: 0, articles: [] };
        }
        keywordMatchMap[keyword].count += 1;
        keywordMatchMap[keyword].articles.push(article.title);
        
        // Add severity impact of this keyword
        const severityImpact = keywordSeverity[keyword] || 0.3; // Default to 0.3 if not specified
        articleImpact += severityImpact;
      });
      
      // Normalize article impact based on number of keywords
      articleImpact = articleImpact / matchedKeywords.length;
      
      // More recent articles have higher impact
      const daysAgo = (new Date().getTime() - new Date(article.publishedAt).getTime()) / (1000 * 3600 * 24);
      const recencyFactor = Math.max(0, 1 - (daysAgo / 14)); // 0-1 scale, newer is higher
      
      // Add to safety score (higher means more safety concerns)
      safetyScore += articleImpact * recencyFactor;
    }
  });
  
  // Normalize score based on number of relevant articles
  const normalizedScore = relevantArticles.length > 0 
    ? Math.min(1, safetyScore / relevantArticles.length) 
    : 0;
  
  // Format keyword matches for the response
  const keywordMatches = Object.entries(keywordMatchMap)
    .map(([keyword, data]) => ({
      keyword,
      count: data.count,
      articles: data.articles
    }))
    .sort((a, b) => b.count - a.count); // Sort by frequency
  
  // Generate summary of recent safety events
  const recentEvents = generateSafetyEventSummaries(relevantArticles, keywordMatches);
  
  // Calculate prediction confidence based on number of articles and keyword diversity
  const predictionConfidence = calculatePredictionConfidence(
    relevantArticles.length,
    keywordMatches.length,
    articles.length
  );
  
  return {
    score: normalizedScore,
    relevantArticles,
    keywordMatches,
    recentEvents,
    predictionConfidence
  };
};

// Generate summaries of safety events from news articles
const generateSafetyEventSummaries = (
  articles: NewsArticle[],
  keywordMatches: {keyword: string, count: number, articles: string[]}[]
): string[] => {
  if (articles.length === 0) return [];
  
  // Sort articles by date (newest first)
  const sortedArticles = [...articles].sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  
  // Take up to 5 most recent relevant articles
  const recentArticles = sortedArticles.slice(0, 5);
  
  // Generate a summary for each recent article
  return recentArticles.map(article => {
    const date = new Date(article.publishedAt).toLocaleDateString();
    return `${date}: ${article.title}`;
  });
};

// Calculate confidence in the prediction based on data quality
const calculatePredictionConfidence = (
  relevantArticleCount: number,
  keywordMatchCount: number,
  totalArticleCount: number
): number => {
  if (totalArticleCount === 0) return 0;
  
  // More relevant articles and keyword diversity increase confidence
  const relevanceRatio = relevantArticleCount / Math.max(1, totalArticleCount);
  const keywordDiversity = keywordMatchCount / safetyKeywords.length;
  
  // Calculate confidence score (0-1)
  return Math.min(1, (relevanceRatio * 0.5) + (keywordDiversity * 0.5));
};

// Calculate predictive safety adjustment based on news data
export const calculateNewsSafetyAdjustment = (newsAnalysis: NewsSafetyAnalysis): {
  adjustment: number;
  confidence: number;
  reasons: string[];
} => {
  // No adjustment if no relevant news
  if (newsAnalysis.score === 0) {
    return {
      adjustment: 0,
      confidence: 0,
      reasons: []
    };
  }
  
  // Convert news impact (0-1 scale where 1 is bad) to safety adjustment (-1 to 0 scale)
  // This will be added to the existing safety score
  const adjustment = -Math.min(1, newsAnalysis.score * 1.5);
  
  // Generate reasons for the adjustment
  const reasons: string[] = [];
  
  // Add top keywords as reasons
  const topKeywords = newsAnalysis.keywordMatches.slice(0, 3);
  if (topKeywords.length > 0) {
    const keywordsList = topKeywords.map(k => k.keyword).join(', ');
    reasons.push(`Recent news mentions ${keywordsList}`);
  }
  
  // Add recency as a reason if we have recent events
  if (newsAnalysis.recentEvents.length > 0) {
    reasons.push(`${newsAnalysis.recentEvents.length} safety-related news stories in the past 14 days`);
  }
  
  return {
    adjustment,
    confidence: newsAnalysis.predictionConfidence,
    reasons
  };
};
