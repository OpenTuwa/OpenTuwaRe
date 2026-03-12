export function isBot(request) {
  const ua = (request.headers.get('user-agent') || '').toLowerCase();
  // Comprehensive regex for Search Engines, Social Crawlers, and AI Scrapers
  const botRegex = /googlebot|bingbot|duckduckbot|applebot|yandexbot|baiduspider|facebookexternalhit|twitterbot|linkedinbot|slackbot|telegrambot|whatsapp|oai-searchbot|chatgpt-user|gptbot|anthropic-ai|claude-web|perplexitybot|bytespider|google-extended|amazonbot/i;
  return botRegex.test(ua);
}
