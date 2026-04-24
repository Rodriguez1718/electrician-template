import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const commercialCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/commercial' }),
  schema: z.object({
    id: z.string().optional(),
    title: z.string(),
    icon: z.string(),
    description: z.string().optional(),
    category: z.string().optional(),
    color: z.string().optional(),
    bgColor: z.string().optional(),
    borderColor: z.string().optional(),
    tabColor: z.string().optional(),
    tabBackground: z.string().optional(),
  }),
});

const residentialCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/residential' }),
  schema: z.object({
    id: z.string().optional(),
    title: z.string(),
    icon: z.string(),
    description: z.string().optional(),
    category: z.string().optional(),
    color: z.string().optional(),
    bgColor: z.string().optional(),
    borderColor: z.string().optional(),
    tabColor: z.string().optional(),
    tabBackground: z.string().optional(),
  }),
});

const specialtyCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/specialty' }),
  schema: z.object({
    id: z.string().optional(),
    title: z.string(),
    icon: z.string(),
    description: z.string().optional(),
    category: z.string().optional(),
    color: z.string().optional(),
    bgColor: z.string().optional(),
    borderColor: z.string().optional(),
    tabColor: z.string().optional(),
    tabBackground: z.string().optional(),
  }),
});

const emergencyCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/emergency' }),
  schema: z.object({
    id: z.string().optional(),
    title: z.string(),
    icon: z.string(),
    description: z.string().optional(),
    category: z.string().optional(),
    color: z.string().optional(),
    bgColor: z.string().optional(),
    borderColor: z.string().optional(),
    tabColor: z.string().optional(),
    tabBackground: z.string().optional(),
  }),
});

const servicesCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    metaDescription: z.string(),
    keywords: z.string(),
    heroLine1: z.string(),
    heroLine2: z.string(),
    heroLine3: z.string(),
    heroDescription: z.string(),
    backgroundImage: z.string(),
    image: z.string().optional(),
    sectionTag: z.string(),
    serviceTitle: z.string(),
    highlightedText: z.string(),
    serviceDescription: z.string(),
    companyName: z.string(),
    badgeNumber: z.string(),
    badgeText: z.array(z.string()),
    showProcessTimeline: z.boolean().default(false),
    processTimeline: z.object({
      sectionTag: z.string().optional(),
      title: z.string().optional(),
      highlightedText: z.string().optional(),
      description: z.string().optional(),
      steps: z.array(z.object({
        number: z.string(),
        title: z.string(),
        description: z.string(),
        icon: z.string(),
        color: z.enum(['primary', 'secondary', 'accent', 'red'])
      })).optional()
    }).optional(),
    features: z.array(z.object({
      title: z.string(),
      description: z.string(),
      icon: z.string(),
      color: z.string()
    })),
  }),
});

const serviceAreasCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/service-areas' }),
  schema: z.object({
    title: z.string(),
    city: z.string(),
    state: z.string(),
    description: z.string(),
    metaDescription: z.string(),
    keywords: z.string(),
    heroLine1: z.string().optional(),
    heroLine2: z.string(),
    heroLine3: z.string(),
    heroDescription: z.string(),
    backgroundImage: z.string(),
    image: z.string().optional(),
    latitude: z.number(),
    longitude: z.number(),
    zoom: z.number().default(13),
    tier: z.enum(['primary', 'secondary', 'tertiary']).default('primary'),
    yearsServing: z.number().optional(),
    neighborhoods: z.array(z.string()).optional(),
    features: z.array(z.object({
      title: z.string(),
      description: z.string(),
      icon: z.string(),
      color: z.string()
    })).optional(),
  }),
});

export const collections = {
  commercial: commercialCollection,
  residential: residentialCollection,
  specialty: specialtyCollection,
  emergency: emergencyCollection,
  services: servicesCollection,
  'service-areas': serviceAreasCollection,
};