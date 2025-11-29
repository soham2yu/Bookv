import { z } from "zod";

export const insertUserProfileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
});

export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;

export interface UserProfile {
  id: string;
  email: string;
}

export const insertDocumentSchema = z.object({
  userId: z.string(),
  title: z.string().min(1, "Title is required"),
  videoUrl: z.string().optional(),
  originalPdfUrl: z.string().optional(),
  ocrPdfUrl: z.string().optional(),
  nftTokenId: z.string().optional(),
  status: z.enum(["pending", "processing", "completed", "failed"]).default("pending"),
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export interface Document {
  id: number;
  userId: string;
  title: string;
  videoUrl: string | null;
  originalPdfUrl: string | null;
  ocrPdfUrl: string | null;
  nftTokenId: string | null;
  status: "pending" | "processing" | "completed" | "failed";
}
