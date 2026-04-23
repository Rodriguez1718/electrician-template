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
  'service-areas': serviceAreasCollection,
};