import { onRequestGet as __api_bak_admin_sync_vectors_js_onRequestGet } from "C:\\Users\\SCSM11\\Downloads\\OpenTuwaRe\\functions\\api.bak\\admin\\sync-vectors.js"
import { onRequestGet as __api_bak_article__slug__js_onRequestGet } from "C:\\Users\\SCSM11\\Downloads\\OpenTuwaRe\\functions\\api.bak\\article\\[slug].js"
import { onRequestGet as __api_bak_article_js_onRequestGet } from "C:\\Users\\SCSM11\\Downloads\\OpenTuwaRe\\functions\\api.bak\\article.js"
import { onRequestGet as __api_bak_author_js_onRequestGet } from "C:\\Users\\SCSM11\\Downloads\\OpenTuwaRe\\functions\\api.bak\\author.js"
import { onRequestGet as __api_bak_authors_1_js_onRequestGet } from "C:\\Users\\SCSM11\\Downloads\\OpenTuwaRe\\functions\\api.bak\\authors_1.js"
import { onRequestGet as __api_bak_recommendations_js_onRequestGet } from "C:\\Users\\SCSM11\\Downloads\\OpenTuwaRe\\functions\\api.bak\\recommendations.js"
import { onRequestPost as __api_bak_subscribe_js_onRequestPost } from "C:\\Users\\SCSM11\\Downloads\\OpenTuwaRe\\functions\\api.bak\\subscribe.js"
import { onRequestPost as __api_bak_subscribe_contribute_js_onRequestPost } from "C:\\Users\\SCSM11\\Downloads\\OpenTuwaRe\\functions\\api.bak\\subscribe_contribute.js"
import { onRequestPost as __api_bak_track_interaction_js_onRequestPost } from "C:\\Users\\SCSM11\\Downloads\\OpenTuwaRe\\functions\\api.bak\\track-interaction.js"
import { onRequest as __api_bak_get_author_js_onRequest } from "C:\\Users\\SCSM11\\Downloads\\OpenTuwaRe\\functions\\api.bak\\get-author.js"
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
      routePath: "/api.bak/admin/sync-vectors",
      mountPath: "/api.bak/admin",
      method: "GET",
      middlewares: [],
      modules: [__api_bak_admin_sync_vectors_js_onRequestGet],
    },
  {
      routePath: "/api.bak/article/:slug",
      mountPath: "/api.bak/article",
      method: "GET",
      middlewares: [],
      modules: [__api_bak_article__slug__js_onRequestGet],
    },
  {
      routePath: "/api.bak/article",
      mountPath: "/api.bak",
      method: "GET",
      middlewares: [],
      modules: [__api_bak_article_js_onRequestGet],
    },
  {
      routePath: "/api.bak/author",
      mountPath: "/api.bak",
      method: "GET",
      middlewares: [],
      modules: [__api_bak_author_js_onRequestGet],
    },
  {
      routePath: "/api.bak/authors_1",
      mountPath: "/api.bak",
      method: "GET",
      middlewares: [],
      modules: [__api_bak_authors_1_js_onRequestGet],
    },
  {
      routePath: "/api.bak/recommendations",
      mountPath: "/api.bak",
      method: "GET",
      middlewares: [],
      modules: [__api_bak_recommendations_js_onRequestGet],
    },
  {
      routePath: "/api.bak/subscribe",
      mountPath: "/api.bak",
      method: "POST",
      middlewares: [],
      modules: [__api_bak_subscribe_js_onRequestPost],
    },
  {
      routePath: "/api.bak/subscribe_contribute",
      mountPath: "/api.bak",
      method: "POST",
      middlewares: [],
      modules: [__api_bak_subscribe_contribute_js_onRequestPost],
    },
  {
      routePath: "/api.bak/track-interaction",
      mountPath: "/api.bak",
      method: "POST",
      middlewares: [],
      modules: [__api_bak_track_interaction_js_onRequestPost],
    },
  {
      routePath: "/api.bak/get-author",
      mountPath: "/api.bak",
      method: "",
      middlewares: [],
      modules: [__api_bak_get_author_js_onRequest],
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