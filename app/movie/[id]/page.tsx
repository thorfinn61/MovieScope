import { movieService } from "../../../app/services/tmdb";
import Image from "next/image";
import { FiClock, FiCalendar, FiDollarSign, FiGlobe } from "react-icons/fi";
import MovieCard from "../../components/MovieCard";
import MovieHero from "@/components/movie/MovieHero";
import MoviePoster from "@/components/movie/MoviePoster";
import MovieTrailers from "@/components/movie/MovieTrailers";
import MovieCast from "@/components/movie/MovieCast";
import WatchProviders from "@/components/movie/WatchProviders";

function formatBudget(amount: number | null | undefined): string {
  if (!amount) return "Non défini";
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(2)}B $`;
  }
  return `${(amount / 1000000).toFixed(1)}M $`;
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function MovieDetail(props: Props) {
  const params = await props.params;
  const id = params.id;
  const [movie, credits, videos, watchProviders] = await Promise.all([
    movieService.getMovieDetails(id),
    movieService.getMovieCredits(id),
    movieService.getMovieVideos(id),
    movieService.getWatchProviders(id),
  ]);

  // Logique des recommandations
  const movieGenreIds = movie.genres?.map((genre: any) => genre.id) || [];
  const [recommendations, similarMovies] = await Promise.all([
    movieService.getMovieRecommendations(id),
    movieService.getSimilarMovies(id),
  ]);

  const allSuggestions = [
    ...(recommendations.results || []),
    ...(similarMovies.results || []),
  ]
    .filter(
      (movie, index, self) => index === self.findIndex((m) => m.id === movie.id)
    )
    .map((movie) => ({
      ...movie,
      genreMatchCount:
        movie.genre_ids?.filter((id: number) => movieGenreIds.includes(id))
          .length || 0,
      poster_path: movie.poster_path || "",
      title: movie.title || "",
      vote_average: movie.vote_average || 0,
      release_date: movie.release_date || "",
      id: movie.id,
    }))
    .sort((a, b) => {
      if (b.genreMatchCount !== a.genreMatchCount) {
        return b.genreMatchCount - a.genreMatchCount;
      }
      const scoreA =
        a.vote_average * Math.log10(a.vote_count) + a.popularity / 100;
      const scoreB =
        b.vote_average * Math.log10(b.vote_count) + b.popularity / 100;
      return scoreB - scoreA;
    })
    .filter((movie) => movie.genreMatchCount > 0)
    .slice(0, 5);

  const hasRecommendations = allSuggestions.length > 0;

  // Filtrer les trailers
  const trailers = videos.results?.filter(
    (video: any) =>
      (video.type === "Trailer" || video.type === "Teaser") &&
      (video.iso_639_1 === "fr" || video.iso_639_1 === "en")
  );

  return (
    <main className="min-h-screen bg-[#121212]">
      <MovieHero backdropPath={movie.backdrop_path} title={movie.title} />

      <div className="container mx-auto px-4 -mt-32 sm:-mt-64 relative z-10">
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-12">
          {/* Colonne de gauche */}
          <div className="w-full lg:w-1/3 mb-6 sm:mb-8">
            <MoviePoster movie={movie} />

            {/* Infos rapides */}
            <div className="mt-8 bg-[#1a1a1a] rounded-xl p-6 space-y-4">
              <InfoItem
                icon={<FiCalendar />}
                label="Date de sortie"
                value={new Date(movie.release_date).toLocaleDateString("fr-FR")}
              />
              <InfoItem
                icon={<FiClock />}
                label="Durée"
                value={`${movie.runtime} minutes`}
              />
              <InfoItem
                icon={<FiGlobe />}
                label="Langue"
                value={movie.original_language.toUpperCase()}
              />

              {/* Section financière */}
              <div className="border-t border-white/10 pt-4 mt-4">
                <h3 className="text-lg font-medium mb-3 text-white/90">
                  Informations financières
                </h3>
                <div className="space-y-3">
                  <InfoItem
                    icon={<FiDollarSign />}
                    label="Coût de production"
                    value={formatBudget(movie.budget)}
                  />
                  <InfoItem
                    icon={<FiDollarSign />}
                    label="Gains en salles"
                    value={formatBudget(movie.revenue)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Colonne de droite */}
          <div className="w-full lg:w-2/3 space-y-6 sm:space-y-8">
            {/* En-tête et genres */}
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-white">
                {movie.title}
              </h1>
              <div className="flex flex-wrap gap-3 mb-6">
                {movie.genres?.map((genre: any) => (
                  <span
                    key={genre.id}
                    className="bg-indigo-500/20 text-indigo-300 px-4 py-1.5 rounded-full text-sm font-medium
                    hover:bg-indigo-500/30 transition-colors duration-300"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Note et Popularité */}
            <div className="flex items-center gap-6">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full bg-yellow-500/20" />
                <div className="absolute inset-1 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                  <span className="text-2xl font-bold text-yellow-500">
                    {movie.vote_average.toFixed(1)}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-white/60">Note des utilisateurs</p>
                <p className="text-white/90">
                  Basé sur {movie.vote_count.toLocaleString()} votes
                </p>
              </div>
            </div>

            {/* Synopsis */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Synopsis</h2>
              <p className="text-lg leading-relaxed text-white/80">
                {movie.overview || "Aucun synopsis disponible."}
              </p>
            </div>

            <MovieTrailers trailers={trailers} />
            <MovieCast cast={credits.cast} />
          </div>
        </div>
      </div>

      {/* Recommandations */}
      {hasRecommendations && (
        <div className="container mx-auto px-4 py-12">
          <h2 className="text-2xl font-semibold mb-6">Films recommandés</h2>
          <div className="flex gap-4 overflow-x-auto whitespace-nowrap">
            {allSuggestions.map((movie: any) => (
              <div className="inline-block min-w-[150px]" key={movie.id}>
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        </div>
      )}

      <WatchProviders providers={watchProviders.results?.FR} />
    </main>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 text-white/80">
      <div className="text-indigo-400 text-xl">{icon}</div>
      <div>
        <p className="text-sm text-white/60">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
