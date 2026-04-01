import type { Location, MediaKind, ReviewVerificationStatus, VerificationLevel } from "./domain";

export interface DoctorCardVM {
  id: string;
  slug: string;
  name: string;
  specialty?: string | null;
  city?: string | null;
  district?: string | null;
  isVerified: boolean;
  isPremium: boolean;
  profileImageUrl?: string | null;
  procedureBadges: string[];
  priceHighlights: Array<{
    procedureSlug: string;
    label: string;
    from?: number | null;
    to?: number | null;
    currency: string;
  }>;
  ratingAvg?: number | null;
  reviewCount: number;
}

export interface DoctorProfileVM {
  id: string;
  slug: string;
  name: string;
  specialty?: string | null;
  bioShort?: string | null;
  bioLong?: string | null;
  yearsExperience?: number | null;
  languages: string[];
  websiteUrl?: string | null;
  emailPublic?: string | null;
  phonePublic?: string | null;
  isClaimed: boolean;
  isVerified: boolean;
  verificationLevel: VerificationLevel;
  isPremium: boolean;
  locations: Location[];
  procedures: Array<{
    id: string;
    slug: string;
    name: string;
    descriptionShort?: string | null;
    priceFrom?: number | null;
    priceTo?: number | null;
    currency: string;
    isPriceVerified: boolean;
  }>;
  reviews: Array<{
    id: string;
    title?: string | null;
    body?: string | null;
    ratingOverall: number;
    verificationStatus: ReviewVerificationStatus;
    createdAt: string;
  }>;
  media: Array<{
    id: string;
    url: string;
    kind: MediaKind;
    alt?: string | null;
  }>;
}
