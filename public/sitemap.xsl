<?xml version="1.0" encoding="UTF-8"?>
<!-- Shows sitemap.xml as a readable page in a browser. Search engines read the XML itself and ignore this. -->
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <xsl:output method="html" encoding="UTF-8" indent="yes" />
  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <title>Sitemap · Faiz Fayez LTD</title>
        <style>
          body { margin: 0; background: #f3f6f1; color: #3e4a44; font: 15px/1.6 system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; }
          main { width: min(980px, 100% - 32px); margin: 40px auto; }
          h1 { margin: 0 0 6px; color: #102019; font-size: 28px; }
          p { margin: 0 0 22px; }
          table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e2e8e2; border-radius: 12px; overflow: hidden; }
          th, td { padding: 12px 14px; text-align: left; border-bottom: 1px solid #e2e8e2; vertical-align: middle; }
          th { background: #1f4d3b; color: #fff; font-size: 13px; letter-spacing: .04em; text-transform: uppercase; }
          tr:last-child td { border-bottom: 0; }
          a { color: #1f4d3b; font-weight: 600; word-break: break-all; }
          img { width: 56px; height: 42px; object-fit: cover; border-radius: 6px; display: block; }
          .n { color: #6b7770; width: 40px; }
        </style>
      </head>
      <body>
        <main>
          <h1>Sitemap</h1>
          <p>All <xsl:value-of select="count(s:urlset/s:url)" /> pages of the Faiz Fayez LTD website, for search engines such as Google and Bing.</p>
          <table>
            <tr><th class="n">#</th><th>Page</th><th>Photo</th><th>Updated</th></tr>
            <xsl:for-each select="s:urlset/s:url">
              <tr>
                <td class="n"><xsl:value-of select="position()" /></td>
                <td><a href="{s:loc}"><xsl:value-of select="s:loc" /></a></td>
                <td><xsl:if test="image:image/image:loc"><img src="{image:image/image:loc}" alt="" loading="lazy" /></xsl:if></td>
                <td><xsl:value-of select="s:lastmod" /></td>
              </tr>
            </xsl:for-each>
          </table>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
