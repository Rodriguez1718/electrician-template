import { defineCollection, z } from 'astro:content';

const commercialCollection = defineCollection({
  type: 'content',
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
  type: 'content',
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
  type: 'content',
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
  type: 'content',
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

export const collections = {
  commercial: commercialCollection,
  residential: residentialCollection,
  specialty: specialtyCollection,
  emergency: emergencyCollection,
};