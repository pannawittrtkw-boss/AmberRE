import { User, Property, PropertyImage, Amenity, BTSMRTStation, Article, ArticleCategory, Review, Project } from "@prisma/client";

export type UserRole = "BUYER" | "OWNER" | "AGENT" | "CO_AGENT" | "ADMIN";
export type PropertyType = "CONDO" | "HOUSE" | "TOWNHOUSE";
export type BuildingType = "LOW_RISE" | "HIGH_RISE" | "NONE";
export type ListingType = "RENT" | "SALE";

export interface PropertyWithRelations extends Property {
  images: PropertyImage[];
  owner: User;
  agent?: User | null;
  propertyAmenities: { amenity: Amenity }[];
  propertyStations: { station: BTSMRTStation; distanceKm: number }[];
  project?: Project | null;
  reviews?: Review[];
}

export interface ArticleWithRelations extends Article {
  category: ArticleCategory;
  author: User;
}

export interface PropertySearchParams {
  keyword?: string;
  listingType?: ListingType;
  propertyType?: PropertyType;
  buildingType?: BuildingType;
  hideSold?: boolean;
  stationId?: number;
  amenityIds?: number[];
  kitchenPartition?: boolean;
  bedroomPartition?: boolean;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  page?: number;
  limit?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  total?: number;
  page?: number;
  totalPages?: number;
}
