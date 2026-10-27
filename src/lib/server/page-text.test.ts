import { describe, expect, it } from 'vitest';
import { htmlToText } from './page-text.js';

describe('htmlToText', () => {
  it('keeps the title and the readable text, drops scripts, styles and navigation', () => {
    const page = htmlToText(`
      <html><head><title>Designer &amp; Researcher</title><style>p{color:red}</style></head>
      <body><nav>Home Jobs</nav><h1>Designer</h1><p>Remote&nbsp;role.</p>
      <script>alert("x")</script><ul><li>Research</li><li>Prototypes</li></ul><footer>© Co</footer></body></html>`);
    expect(page.title).toBe('Designer & Researcher');
    expect(page.text).toContain('Designer');
    expect(page.text).toContain('Remote role.');
    expect(page.text).toContain('- Research');
    expect(page.text).not.toContain('alert');
    expect(page.text).not.toContain('Home Jobs');
    expect(page.text).not.toContain('color:red');
  });

  it('decodes numeric entities', () => {
    expect(htmlToText('<p>caf&#233; &#x2014; ok</p>').text).toBe('café — ok');
  });
});
