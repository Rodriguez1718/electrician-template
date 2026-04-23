# Service Areas with Slugs - Implementation Guide

## Overview

Your service areas now use a content collection system with slug-based URLs. This provides:
- SEO-friendly URLs (e.g., `/service-areas/denver`, `/service-areas/santa-monica`)
- Clickable area tags that link to dedicated pages
- Smooth map transitions for areas without dedicated pages
- Easy content management through markdown files

## How It Works

### 1. Content Collection

Service areas are defined in `src/content/serviceAreas/` as markdown files:

```
src/content/serviceAreas/
├── denver.md
├── santa-monica.md
└── [other-cities].md
```

### 2. Dynamic Pages

The file `src/pages/service-areas/[slug].astro` automatically generates pages for each service area based on the markdown files.

### 3. Smart Tags

In the `ServiceAreas` component:
- **Areas with pages** (like Denver, Santa Monica) → Clickable links to dedicated pages
- **Areas without pages** → Buttons that trigger smooth map animations

## Adding a New Service Area

### Step 1: Create a Markdown File

Create a new file in `src/content/serviceAreas/` (e.g., `pasadena.md`):

```markdown
---
title: "Pasadena Electrician Services | VoltBully"
city: "Pasadena"
state: "CA"
description: "Professional electrical services in Pasadena, CA"
metaDescription: "VoltBully provides professional electrical services in Pasadena..."
keywords: "Pasadena electrician, Pasadena electrical services..."
heroLine1: ""
heroLine2: "PASADENA,"
heroLine3: "CA"
heroDescription: "Professional electrical services for Pasadena homes and businesses."
backgroundImage: "/images/electrical.webp"
latitude: 34.1478
longitude: -118.1445
zoom: 13
tier: "primary"
yearsServing: 5
features:
  - title: "Feature 1"
    description: "Description here"
    icon: '<svg>...</svg>'
    color: "primary"
---

## Your content here

Write about your services in this area...
```

### Step 2: That's It!

The system automatically:
1. Generates a page at `/service-areas/pasadena`
2. Makes the "Pasadena" tag clickable in the ServiceAreas component
3. Uses the coordinates for map positioning

## Schema Fields

### Required Fields

- `title`: Page title (for SEO)
- `city`: City name (must match the name in primaryAreas/secondaryAreas/tertiaryAreas)
- `state`: State abbreviation
- `description`: Short description
- `metaDescription`: Meta description for SEO
- `keywords`: SEO keywords
- `heroLine2`: Main hero text (usually city name)
- `heroLine3`: Secondary hero text (usually state)
- `heroDescription`: Hero section description
- `backgroundImage`: Path to background image
- `latitude`: Map latitude coordinate
- `longitude`: Map longitude coordinate

### Optional Fields

- `heroLine1`: Optional first line in hero
- `zoom`: Map zoom level (default: 13)
- `tier`: "primary", "secondary", or "tertiary" (default: "primary")
- `yearsServing`: Number of years serving the area
- `neighborhoods`: Array of neighborhood names
- `features`: Array of feature objects with title, description, icon, and color

## URL Structure

- File: `src/content/serviceAreas/denver.md`
- URL: `/service-areas/denver`

- File: `src/content/serviceAreas/santa-monica.md`
- URL: `/service-areas/santa-monica`

## Map Coordinates

Find coordinates for your service areas:
1. Go to [Google Maps](https://maps.google.com)
2. Right-click on the location
3. Click the coordinates to copy them
4. Use in your markdown frontmatter

## Customization

### Change Area Lists

Edit `src/components/section/ServiceAreas.astro`:

```typescript
primaryAreas = ["Denver", "Santa Monica", "Your City"]
secondaryAreas = ["Area 1", "Area 2"]
tertiaryAreas = ["Area 3", "Area 4"]
```

### Fallback Coordinates

For areas without dedicated pages, add coordinates in `ServiceAreas.astro`:

```typescript
const fallbackCoordinates = {
  "Your Area": { lat: 34.0522, lng: -118.2437, zoom: 13 }
};
```

## Benefits

1. **SEO**: Each service area gets its own optimized page
2. **User Experience**: Smooth map transitions + dedicated content pages
3. **Easy Management**: Add new areas by creating markdown files
4. **Flexibility**: Mix linked areas (with pages) and map-only areas (without pages)
5. **Content Rich**: Each area page can have custom content, features, and images

## Example URLs

- `/service-areas/denver` - Denver service area page
- `/service-areas/santa-monica` - Santa Monica service area page
- `/service-areas/pasadena` - Pasadena service area page (when you create it)

## Next Steps

1. Create markdown files for your primary service areas
2. Add high-quality images for each area
3. Write unique content for each area page
4. Update coordinates to match your actual service locations
5. Test the map transitions and page links
