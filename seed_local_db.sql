-- Seed local D1 database with sample articles
INSERT INTO articles (slug, title, subtitle, author, published_at, read_time_minutes, image_url, seo_description, tags, content_html, engagement_score, trending_velocity, neural_vector, visual_vector, arousal_score, entropy_score)
VALUES 
('test-article-1', 'Test Article 1', 'A test subtitle', 'Test Author', '2026-03-14 10:00:00', 5, '/img/test.jpg', 'Test description', 'test,sample', '<p>This is a test article.</p>', 10.5, 0.5, '[]', '[]', 0.5, 0.5),
('test-article-2', 'Test Article 2', 'Another test', 'Test Author', '2026-03-13 10:00:00', 3, '/img/test2.jpg', 'Test description 2', 'test,sample', '<p>This is another test article.</p>', 8.5, 0.3, '[]', '[]', 0.4, 0.4),
('test-article-3', 'Test Article 3', 'Third test', 'Test Author', '2026-03-12 10:00:00', 4, '/img/test3.jpg', 'Test description 3', 'test,sample', '<p>This is a third test article.</p>', 12.0, 0.7, '[]', '[]', 0.6, 0.6);
