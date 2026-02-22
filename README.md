# ShotClock Website

This is the official website for ShotClock (GLP-1 & Peptide Tracker), hosted on GitHub Pages at trackglp1.com.

## Files

- `index.html` - Landing page
- `library.html` - Searchable guide directory
- `updates.html` - Dated guide update feed
- `guides/*.html` - Generated dedicated guide pages
- `content/guides.json` - Canonical guide content source
- `content/updates.json` - Update-feed source
- `templates/guide.template.html` - Guide page template
- `templates/updates.template.html` - Updates page template
- `scripts/generate-guides.mjs` - Generates guide pages + sitemap + feeds
- `scripts/validate-guides.mjs` - Schema and citation marker validation
- `scripts/check-links.mjs` - Internal/external link verification
- `privacy.html` - Privacy Policy
- `terms.html` - Terms of Service
- `support.html` - Support center
- `styles.css` - Shared stylesheet
- `sitemap.xml` - SEO sitemap
- `robots.txt` - Robots policy
- `updates.xml` - Atom feed for updates
- `CNAME` - Custom domain configuration

## Content Workflow

1. Edit `content/guides.json` and/or `content/updates.json`.
2. Validate content:
   - `node scripts/validate-guides.mjs`
3. Regenerate pages and SEO artifacts:
   - `node scripts/generate-guides.mjs`
4. Verify links:
   - `node scripts/check-links.mjs`

## Setup Instructions

1. Create a new GitHub repository named `trackglp1-website`
2. Upload all files from this folder
3. Enable GitHub Pages in Settings > Pages
4. Configure Cloudflare DNS (see main setup guide)

## Contact

- Support: support@trackglp1.com
- Privacy: privacy@trackglp1.com
- Legal: legal@trackglp1.com
