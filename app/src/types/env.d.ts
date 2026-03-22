/// <reference types="vite/client" />

/**
 * Type definitions for environment variables
 * 
 * All VITE_ prefixed env variables are exposed to the client.
 * See .env.example for documentation of each variable.
 */
interface ImportMetaEnv {
  /** Application name */
  readonly VITE_APP_NAME: string;
  /** Application URL */
  readonly VITE_APP_URL: string;
  /** Application description */
  readonly VITE_APP_DESCRIPTION: string;
  
  /** Newsletter API endpoint */
  readonly VITE_NEWSLETTER_API_URL?: string;
  /** Contact form API endpoint */
  readonly VITE_CONTACT_API_URL?: string;
  
  /** Google Analytics Measurement ID */
  readonly VITE_GA_MEASUREMENT_ID?: string;
  /** Umami Analytics script URL */
  readonly VITE_UMAMI_SCRIPT_URL?: string;
  /** Umami Analytics website ID */
  readonly VITE_UMAMI_WEBSITE_ID?: string;
  
  /** Enable newsletter feature */
  readonly VITE_FEATURE_NEWSLETTER: string;
  /** Enable search feature */
  readonly VITE_FEATURE_SEARCH: string;
  /** Enable dark mode feature */
  readonly VITE_FEATURE_DARK_MODE: string;
  
  /** Enable source maps in production */
  readonly VITE_SOURCE_MAP?: string;
  /** Enable bundle analyzer */
  readonly VITE_ANALYZE_BUNDLE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
