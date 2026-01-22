# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The Bush Chapel is a static website for an Australian Christian liturgy ministry. It provides liturgies following the Christian calendar with an Australian bush theme.

## Development

**Local preview:**
```bash
python3 -m http.server 8000
```
Then visit http://localhost:8000

**Deployment:** Hosted on Vercel (auto-deploys from main branch)

## Architecture

- **Static HTML site** - No build process, plain HTML/CSS/JS
- **styles.css** - Single CSS file with CSS custom properties for theming
  - Color palette uses Australian bush tones (gum greens, ochre, terracotta)
  - Liturgical season colors defined (advent purple, lent purple, pentecost red, etc.)
  - Fonts: Cormorant Garamond (display), Open Sans (body)
- **script.js** - Comment system using localStorage, animations
- **seasons/** - Individual pages for each liturgical season (advent, christmas, lent, easter, pentecost, ordinary-time, epiphany, special)
- **the bush chapel graphics/** - Watercolor botanical images used throughout the site

## Key CSS Classes

- `.season-header` + `.advent`, `.lent`, `.easter`, etc. - Season-specific header styling
- `.season-card` - Homepage season navigation cards
- `.botanical-corner`, `.botanical-divider` - Decorative image placements
- `.gum-border-frame` - Styled content frames
- `.season-page-image`, `.season-divider-image` - Season-specific artwork sizing
