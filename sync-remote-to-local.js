// Script to sync remote D1 database to local for development
import { execSync } from 'child_process';

console.log('🔄 Syncing remote articles to local database...\n');

// Step 1: Get article slugs from remote
console.log('📥 Fetching article list from remote...');
const result = execSync(
  'npx wrangler d1 execute articles --remote --command "SELECT slug FROM articles" --json',
  { encoding: 'utf8' }
);

const data = JSON.parse(result);
const slugs = data[0].results.map(row => row.slug);

console.log(`Found ${slugs.length} articles in remote database\n`);

// Step 2: Clear local database
console.log('🗑️  Clearing local database...');
try {
  execSync('npx wrangler d1 execute articles --local --command "DELETE FROM articles"', { stdio: 'inherit' });
} catch (error) {
  console.log('⚠️  Local database might be empty, continuing...');
}

// Step 3: Copy each article (without vectors to avoid size issues)
console.log('\n📤 Copying articles to local database...\n');
let successCount = 0;

for (const slug of slugs) {
  try {
    process.stdout.write(`  Copying: ${slug}...`);
    
    // Fetch article data (without heavy vectors)
    const articleResult = execSync(
      `npx wrangler d1 execute articles --remote --command "SELECT slug, title, subtitle, author, published_at, read_time_minutes, image_url, seo_description, tags, content_html, engagement_score, trending_velocity, arousal_score, entropy_score FROM articles WHERE slug='${slug}'" --json`,
      { encoding: 'utf8' }
    );
    
    const articleData = JSON.parse(articleResult)[0].results[0];
    
    // Escape single quotes in strings
    const escape = (str) => str ? str.replace(/'/g, "''") : '';
    
    // Build INSERT statement
    const insertSQL = `INSERT INTO articles (slug, title, subtitle, author, published_at, read_time_minutes, image_url, seo_description, tags, content_html, engagement_score, trending_velocity, arousal_score, entropy_score) VALUES ('${escape(articleData.slug)}', '${escape(articleData.title)}', '${escape(articleData.subtitle)}', '${escape(articleData.author)}', '${articleData.published_at}', ${articleData.read_time_minutes || 0}, '${escape(articleData.image_url)}', '${escape(articleData.seo_description)}', '${escape(articleData.tags)}', '${escape(articleData.content_html)}', ${articleData.engagement_score || 0}, ${articleData.trending_velocity || 0}, ${articleData.arousal_score || 0}, ${articleData.entropy_score || 0})`;
    
    // Insert into local
    execSync(`npx wrangler d1 execute articles --local --command "${insertSQL}"`, { stdio: 'pipe' });
    
    successCount++;
    console.log(' ✓');
  } catch (error) {
    console.log(' ✗');
    console.error(`    Error: ${error.message.substring(0, 100)}`);
  }
}

console.log(`\n✅ Successfully copied ${successCount}/${slugs.length} articles to local database!`);
console.log('\n⚠️  Note: Vectors were not copied to avoid size issues.');
console.log('   Recommendations will work but with limited AI features.');
console.log('\n✨ Restart your dev server to see the real articles!');
