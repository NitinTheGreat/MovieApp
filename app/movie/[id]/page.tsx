import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Star } from "lucide-react"

async function getMovie(id: string) {
  const res = await fetch(`https://www.omdbapi.com/?apikey=${process.env.NEXT_PUBLIC_OMDB_API_KEY}&i=${id}&plot=full`)
  const data = await res.json()

  if (data.Response === "False") {
    throw new Error(data.Error)
  }

  return data
}

export default async function MoviePage({ params }: { params: { id: string } }) {
  const movie = await getMovie(params.id)

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to search
        </Link>

        <div className="grid md:grid-cols-[300px_1fr] gap-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="relative aspect-[2/3] rounded-xl overflow-hidden">
            {movie.Poster !== "N/A" ? (
              <Image
                src={movie.Poster || "/placeholder.svg"}
                alt={movie.Title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 300px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                <span className="text-gray-400">No Poster</span>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-serif">{movie.Title}</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                {movie.Year} • {movie.Runtime} • {movie.Genre}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {movie.Ratings.map((rating: any, index: number) => (
                <div key={index} className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-400 mr-1" />
                  <span className="text-gray-900 dark:text-white font-medium">{rating.Value}</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">({rating.Source})</span>
                </div>
              ))}
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 font-serif">Plot</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{movie.Plot}</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 font-serif">Director</h2>
                <p className="text-gray-700 dark:text-gray-300">{movie.Director}</p>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 font-serif">Cast</h2>
                <p className="text-gray-700 dark:text-gray-300">{movie.Actors}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

