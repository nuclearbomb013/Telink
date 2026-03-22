/**
 * Developer Profile Types
 *
 * Extended user types for developer showcase functionality
 */

import type { User, UserRole } from './user.types';

/**
 * Developer profile extending the base User interface
 */
export interface DeveloperProfile extends User {
  /** Display name of the developer */
  displayName: string;
  /** Expertise areas of the developer */
  expertise: string[];
  /** GitHub profile URL */
  githubUrl?: string;
  /** Portfolio website URL */
  portfolioUrl?: string;
  /** Developer statistics */
  stats: {
    projectsCount: number;
    contributions: number;
  };
  /** Contribution level classification */
  contributionLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master';
  /** Join date of the platform */
  joinDate: Date;
  /** Last activity timestamp */
  lastActivity: Date;
  /** Reputation score based on community engagement */
  reputationScore: number;
  /** Whether this developer is featured */
  featured: boolean;
  /** Additional skills/tags */
  skills: string[];
  /** Links to social profiles */
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
}

/**
 * Criteria for filtering developers
 */
export interface DeveloperFilter {
  /** Expertise areas to filter by */
  expertise?: string[];
  /** Skills to filter by */
  skills?: string[];
  /** Minimum number of projects */
  minProjects?: number;
  /** Minimum reputation score */
  minReputation?: number;
  /** Show only featured developers */
  showFeaturedOnly?: boolean;
  /** User role filter */
  roles?: UserRole[];
}

/**
 * Options for sorting developers
 */
export interface DeveloperSortOption {
  /** Field to sort by */
  field: 'reputationScore' | 'projectsCount' | 'contributions' | 'joinedDate' | 'lastActive' | 'displayName';
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Parameters for fetching developers
 */
export interface GetDevelopersParams {
  /** Filters to apply */
  filters?: DeveloperFilter;
  /** Sorting options */
  sort?: DeveloperSortOption;
  /** Pagination: page number (starting from 0) */
  page?: number;
  /** Pagination: number of items per page */
  limit?: number;
}

/**
 * Response interface for developer queries
 */
export interface DevelopersResponse {
  /** Array of developer profiles */
  developers: DeveloperProfile[];
  /** Total count (useful for pagination) */
  totalCount: number;
  /** Whether there are more results available */
  hasMore: boolean;
}