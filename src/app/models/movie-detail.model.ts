export interface MovieDetail {
  id: number;
  title: string;
  original_title: string;
  release_date: string;
  runtime: number;
  genres: { id: number; name: string }[];
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  production_companies: {
    name: string;
    logo_path: string | null;
    origin_country: string;
  }[];
  spoken_languages: { english_name: string }[];
  homepage: string | null;
  revenue: number;
  budget: number;
  status: string;
  tagline: string | null;

  // ✅ Credits: Cast & Crew
  credits?: {
    cast: {
      id: number;
      name: string;
      profile_path: string | null;
      character: string;
    }[];
    crew: { id: number; name: string; job: string }[];
  };

  // ✅ Extract the Director from Crew
  director?: { id: number; name: string } | null;

  // ✅ Videos (Trailers, Clips)
  videos?: {
    results: { key: string; site: string; type: string }[];
  };

  // ✅ Images (Backdrops & Posters)
  images?: {
    backdrops: { file_path: string }[];
    posters: { file_path: string }[];
  };

  // ✅ Reviews
  reviews?: {
    results: { author: string; content: string }[];
  };

  // ✅ Related / Similar Movies
  similar?: {
    results: {
      id: number;
      title: string;
      poster_path: string | null;
      vote_average: number;
    }[];
  };

  // ✅ Detailed Movie Description (Optional Extra)
  detailed_description?: string;
}
