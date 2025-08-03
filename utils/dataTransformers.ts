// utils/dataTransformers.ts
import type { Experience } from "../App";

export const dataTransformers = {
  serverToApp: (item: any): Experience => ({
    id: item.id ?? item.postId ?? 0,
    title: item.title || "",
    description: item.description || "",
    emotion: item.emotion || "joy",
    location: item.location || "",
    date: item.experienceDate ?? item.date ?? item.createdAt ?? new Date().toISOString(),
    tags: Array.isArray(item.tags) ? item.tags : [],
    trendScore: item.score ?? item.trendScore ?? 0,
    trendId: item.trendId || 0,
    trendName: item.trendName ?? item.trendTitle ?? `트렌드 #${item.trendId}`,
    latitude: item.latitude,
    longitude: item.longitude,
  }),
  
  appToServer: (experience: Experience) => ({
    title: experience.title,
    description: experience.description,
    emotion: experience.emotion.toUpperCase(),
    location: experience.location,
    experienceDate: experience.date,
    tags: experience.tags,
    trendId: experience.trendId,
    latitude: experience.latitude || 0,
    longitude: experience.longitude || 0,
  })
};