import * as cheerio from "cheerio";

export interface ScrapedContent {
    title: string;
    authorName?: string;
    description?: string;
    cleanText: string;
    thumbnailUrl?: string;
}

export async function scrapeUrlContent(targetUrl: string): Promise<ScrapedContent> {
    const response = await fetch(targetUrl, {
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch target URL: HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove scripts, stylesheets, and iframe clutter
    $("script, style, noscript, nav, footer, header, svg").remove();

    const title =
        $('meta[property="og:title"]').attr("content") ||
        $("title").text().trim() ||
        targetUrl;

    const authorName =
        $('meta[name="author"]').attr("content") ||
        $('meta[property="og:site_name"]').attr("content") ||
        new URL(targetUrl).hostname;

    const description =
        $('meta[property="og:description"]').attr("content") ||
        $('meta[name="description"]').attr("content") ||
        "";

    const thumbnailUrl =
        $('meta[property="og:image"]').attr("content") || undefined;

    // Extract clean visible text blocks
    const textBlocks: string[] = [];
    $("p, h1, h2, h3, h4, pre, code").each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 20) {
            textBlocks.push(text);
        }
    });

    const cleanText = textBlocks.slice(0, 30).join("\n\n");

    return {
        title,
        authorName,
        description,
        cleanText: cleanText || description,
        thumbnailUrl,
    };
}