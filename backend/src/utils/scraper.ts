import axios from 'axios';

/**
 * Advanced Web Page Scraper with Browser Emulation and Free Premium Jina Reader Fallback
 * Guaranteed to bypass Cloudflare/403 Forbidden on Medium, GitConnected, etc.
 */
export async function fetchWebpageContent(url: string): Promise<{ text: string; title: string }> {
  let finalUrl = url;
  if (!/^https?:\/\//i.test(url)) {
    finalUrl = 'https://' + url;
  }

  console.log(`🌐 [Scraper] Initiating scrape for: ${finalUrl}`);

  // 1. Attempt Native Scraping with realistic browser headers & referrer
  try {
    const response = await axios.get(finalUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/',
        'Upgrade-Insecure-Requests': '1',
        'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
      timeout: 8000,
    });

    const html = response.data;

    // Extract Title
    let title = url;
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }

    // Check for Cloudflare challenge / verification block (200 OK block page)
    const isCloudflare = 
      title.toLowerCase().includes('just a moment') ||
      title.toLowerCase().includes('cloudflare') ||
      html.includes('cf-challenge') ||
      html.includes('hcaptcha') ||
      html.includes('window._cf_translation') ||
      html.includes('enable cookies');

    if (isCloudflare) {
      throw new Error('Cloudflare verification challenge page detected.');
    }

    // Strip scripts, styles, navs, footers and other non-content meta
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
      .replace(/<[^>]+>/g, ' ') // Replace html tags with spaces
      .replace(/\s+/g, ' ')     // Collapse whitespace
      .trim();

    if (text && text.length > 200) {
      console.log(`✅ [Scraper] Native scrape successful. Extracted ${text.length} characters.`);
      return { text, title };
    }
    
    throw new Error('Native scrape returned too little content, falling back.');
  } catch (err: any) {
    console.warn(`⚠️ [Scraper] Native scrape failed (${err.message}). Activating free Jina Reader premium fallback...`);
  }

  // 2. Premium Fallback: Jina Reader API (https://r.jina.ai/)
  // Completely bypasses Cloudflare and delivers perfect clean markdown ready for RAG.
  try {
    const jinaUrl = `https://r.jina.ai/${finalUrl}`;
    console.log(`📡 [Scraper] Fetching from Jina Reader: ${jinaUrl}`);
    
    const response = await axios.get(jinaUrl, {
      headers: {
        'Accept': 'text/plain',
      },
      timeout: 10000,
    });

    const markdownContent = response.data;
    
    if (!markdownContent || markdownContent.trim().length === 0) {
      throw new Error('Jina Reader returned empty content.');
    }

    // Extract title from Jina markdown response if present (usually begins with Title: or # Title)
    let title = url;
    const titleMatch = markdownContent.match(/^(?:Title:|#)\s*(.*?)$/m);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    } else {
      // Fallback: extract domain name as title
      try {
        const parsed = new URL(finalUrl);
        title = `Webpage from ${parsed.hostname}`;
      } catch {
        title = 'Scraped Webpage';
      }
    }

    // Return the clean reader text
    console.log(`✅ [Scraper] Fallback scrape successful. Extracted ${markdownContent.length} characters.`);
    return {
      text: markdownContent.trim(),
      title,
    };

  } catch (fallbackErr: any) {
    console.error('❌ [Scraper] Both native and Jina Reader fallback failed:', fallbackErr.message);
    throw new Error(`Failed to scrape webpage: ${fallbackErr.message}`);
  }
}
