import { onRequestGet as __api_admin_sync_vectors_js_onRequestGet } from "C:\\Users\\SCSM11\\Downloads\\OpenTuwaRe\\functions\\api\\admin\\sync-vectors.js"
import { onRequestGet as __api_article__slug__js_onRequestGet } from "C:\\Users\\SCSM11\\Downloads\\OpenTuwaRe\\functions\\api\\article\\[slug].js"
import { onRequestGet as __api_article_js_onRequestGet } from "C:\\Users\\SCSM11\\Downloads\\OpenTuwaRe\\functions\\api\\article.js"
import { onRequestGet as __api_author_js_onRequestGet } from "C:\\Users\\SCSM11\\Downloads\\OpenTuwaRe\\functions\\api\\author.js"
import { onRequestGet as __api_authors_1_js_onRequestGet } from "C:\\Users\\SCSM11\\Downloads\\OpenTuwaRe\\functions\\api\\authors_1.js"
import { onRequestGet as __api_recommendations_js_onRequestGet } from "C:\\Users\\SCSM11\\Downloads\\OpenTuwaRe\\functions\\api\\recommendations.js"
import { onRequestPost as __api_subscribe_js_onRequestPost } from "C:\\Users\\SCSM11\\Downloads\\OpenTuwaRe\\functions\\api\\subscribe.js"
import { onRequestPost as __api_subscribe_contribute_js_onRequestPost } from "C:\\Users\\SCSM11\\Downloads\\OpenTuwaRe\\functions\\api\\subscribe_contribute.js"
import { onRequestPost as __api_track_interaction_js_onRequestPost } from "C:\\Users\\SCSM11\\Downloads\\OpenTuwaRe\\functions\\api\\track-interaction.js"
import { onRequest as __api_get_author_js_onRequest } from "C:\\Users\\SCSM11\\Downloads\\OpenTuwaRe\\functions\\api\\get-author.js"
import { onRequestGet as __player__slug__js_onRequestGet } from "C:\\Users\\SCSM11\\Downloads\\OpenTuwaRe\\functions\\player\\[slug].js"
import { onRequest as __articles__slug__js_onRequest } from "C:\\Users\\SCSM11\\Downloads\\OpenTuwaRe\\functions\\articles\\[slug].js"
import { onRequestGet as __about_js_onRequestGet } from "C:\\Users\\SCSM11\\Downloads\\OpenTuwaRe\\functions\\about.js"
import { onRequestGet as __archive_js_onRequestGet } from "C:\\Users\\SCSM11\\Downloads\\OpenTuwaRe\\functions\\archive.js"
import { onRequestGet as __feed_xml_js_onRequestGet } from "C:\\Users\\SCSM11\\Downloads\\OpenTuwaRe\\functions\\feed.xml.js"
import { onRequestGet as __legal_js_onRequestGet } from "C:\\Users\\SCSM11\\Downloads\\OpenTuwaRe\\functions\\legal.js"
import { onRequestGet as __news_sitemap_xml_js_onRequestGet } from "C:\\Users\\SCSM11\\Downloads\\OpenTuwaRe\\functions\\news-sitemap.xml.js"
import { onRequestGet as __robots_txt_js_onRequestGet } from "C:\\Users\\SCSM11\\Downloads\\OpenTuwaRe\\functions\\robots.txt.js"
import { onRequestGet as __sitemap_xml_js_onRequestGet } from "C:\\Users\\SCSM11\\Downloads\\OpenTuwaRe\\functions\\sitemap.xml.js"
import { onRequestGet as __index_js_onRequestGet } from "C:\\Users\\SCSM11\\Downloads\\OpenTuwaRe\\functions\\index.js"

export const routes = [
    {
      routePath: "/api/admin/sync-vectors",
      mountPath: "/api/admin",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_sync_vectors_js_onRequestGet],
    },
  {
      routePath: "/api/article/:slug",
      mountPath: "/api/article",
      method: "GET",
      middlewares: [],
      modules: [__api_article__slug__js_onRequestGet],
    },
  {
      routePath: "/api/article",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_article_js_onRequestGet],
    },
  {
      routePath: "/api/author",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_author_js_onRequestGet],
    },
  {
      routePath: "/api/authors_1",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_authors_1_js_onRequestGet],
    },
  {
      routePath: "/api/recommendations",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_recommendations_js_onRequestGet],
    },
  {
      routePath: "/api/subscribe",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_subscribe_js_onRequestPost],
    },
  {
      routePath: "/api/subscribe_contribute",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_subscribe_contribute_js_onRequestPost],
    },
  {
      routePath: "/api/track-interaction",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_track_interaction_js_onRequestPost],
    },
  {
      routePath: "/api/get-author",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_get_author_js_onRequest],
    },
  {
      routePath: "/player/:slug",
      mountPath: "/player",
      method: "GET",
      middlewares: [],
      modules: [__player__slug__js_onRequestGet],
    },
  {
      routePath: "/articles/:slug",
      mountPath: "/articles",
      method: "",
      middlewares: [],
      modules: [__articles__slug__js_onRequest],
    },
  {
      routePath: "/about",
      mountPath: "/",
      method: "GET",
      middlewares: [],
      modules: [__about_js_onRequestGet],
    },
  {
      routePath: "/archive",
      mountPath: "/",
      method: "GET",
      middlewares: [],
      modules: [__archive_js_onRequestGet],
    },
  {
      routePath: "/feed.xml",
      mountPath: "/",
      method: "GET",
      middlewares: [],
      modules: [__feed_xml_js_onRequestGet],
    },
  {
      routePath: "/legal",
      mountPath: "/",
      method: "GET",
      middlewares: [],
      modules: [__legal_js_onRequestGet],
    },
  {
      routePath: "/news-sitemap.xml",
      mountPath: "/",
      method: "GET",
      middlewares: [],
      modules: [__news_sitemap_xml_js_onRequestGet],
    },
  {
      routePath: "/robots.txt",
      mountPath: "/",
      method: "GET",
      middlewares: [],
      modules: [__robots_txt_js_onRequestGet],
    },
  {
      routePath: "/sitemap.xml",
      mountPath: "/",
      method: "GET",
      middlewares: [],
      modules: [__sitemap_xml_js_onRequestGet],
    },
  {
      routePath: "/",
      mountPath: "/",
      method: "GET",
      middlewares: [],
      modules: [__index_js_onRequestGet],
    },
  ]