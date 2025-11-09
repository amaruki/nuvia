import React from 'react';
import { render } from '@react-email/render';

export async function renderEmailTemplate(component: React.ReactElement): Promise<{
  html: string;
  text: string;
}> {
  try {
    // Render React Email component to HTML
    const html = await render(component);

    // Convert HTML to plain text (basic implementation)
    const text = html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();

    return { html, text };
  } catch (error) {
    console.error('Failed to render email template:', error);
    throw new Error('Email template rendering failed');
  }
}