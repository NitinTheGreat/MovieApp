"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Moon, Sun, Heart, Search, X } from "lucide-react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

export default function Home() {
  const [query, setQuery] = useState("")
  const [movies, setMovies] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [hasMore, setHasMore] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [popularMovies, setPopularMovies] = useState<any[]>([])
  const [favorites, setFavorites] = useState<any[]>([])
  const [showAllFavorites, setShowAllFavorites] = useState(false)
  const observer = useRef<IntersectionObserver>(null)

  const toggleTheme = () => {
    setDarkMode((prev) => {
      const newMode = !prev
      localStorage.setItem("darkMode", String(newMode))
      document.documentElement.classList.toggle("dark", newMode)
      return newMode
    })
  }

  const toggleFavorite = (movie: any) => {
    setFavorites((prev) => {
      const isFavorite = prev.some((fav) => fav.imdbID === movie.imdbID)
      const newFavorites = isFavorite ? prev.filter((fav) => fav.imdbID !== movie.imdbID) : [...prev, movie]
      localStorage.setItem("favorites", JSON.stringify(newFavorites))
      return newFavorites
    })
  }

  const isFavorite = (id: string) => {
    return favorites.some((fav) => fav.imdbID === id)
  }

  const searchMovies = useCallback(
    async (resetResults = true) => {
      if (query.length < 3) {
        setMovies([])
        return
      }
      try {
        setLoading(true)
        setError("")
        const currentPage = resetResults ? 1 : page
        const res = await fetch(
          `https://www.omdbapi.com/?apikey=${process.env.NEXT_PUBLIC_OMDB_API_KEY}&s=${query}&page=${currentPage}`,
        )
        const data = await res.json()

        if (data.Response === "False") {
          throw new Error(data.Error)
        }

        setMovies((prev) => (resetResults ? data.Search : [...prev, ...data.Search]))
        setHasMore(currentPage * 10 < Number.parseInt(data.totalResults))
        setPage((prev) => (resetResults ? 2 : prev + 1))
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    },
    [query, page],
  )

  const fetchPopularMovies = useCallback(async (page = 1) => {
    try {
      setLoading(true)
      const res = await fetch(
        `https://www.omdbapi.com/?apikey=${process.env.NEXT_PUBLIC_OMDB_API_KEY}&s=movie&type=movie&page=${page}`,
      )
      const data = await res.json()
      if (data.Response === "False") {
        throw new Error(data.Error)
      }
      setPopularMovies((prev) => [...prev, ...data.Search])
      setHasMore(page * 10 < Number.parseInt(data.totalResults))
      setPage((prev) => prev + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [])

  const lastMovieElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading) return
      if (observer.current) observer.current.disconnect()

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          if (query.length >= 3) {
            searchMovies(false)
          } else {
            fetchPopularMovies(page)
          }
        }
      })

      if (node) observer.current.observe(node)
    },
    [loading, hasMore, query, searchMovies, fetchPopularMovies, page],
  )

  useEffect(() => {
    fetchPopularMovies()
    const savedDarkMode = localStorage.getItem("darkMode")
    const initialDarkMode = savedDarkMode === null ? true : savedDarkMode === "true"
    setDarkMode(initialDarkMode)
    document.documentElement.classList.toggle("dark", initialDarkMode)
    const storedFavorites = JSON.parse(localStorage.getItem("favorites") || "[]")
    setFavorites(storedFavorites)
  }, [fetchPopularMovies])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 3) {
        searchMovies(true)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, searchMovies])

  const toggleShowAllFavorites = () => {
    setShowAllFavorites((prev) => !prev)
  }

  const MovieCard = ({ movie }: { movie: any }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="relative group overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
    >
      <a href={`/movie/${movie.imdbID}`}>
        <div className="relative aspect-[2/3] overflow-hidden">
          {movie.Poster !== "N/A" ? (
            <Image
              src={movie.Poster || "/placeholder.svg"}
              alt={movie.Title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
              <span className="text-gray-400">No Poster</span>
            </div>
          )}
        </div>
      </a>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-2 font-serif">
              {movie.Title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{movie.Year}</p>
          </div>
          <button
            onClick={() => toggleFavorite(movie)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label={isFavorite(movie.imdbID) ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={`w-5 h-5 transition-colors duration-300 ${
                isFavorite(movie.imdbID) ? "fill-red-500 text-red-500" : "text-gray-400"
              }`}
            />
          </button>
        </div>
      </div>
    </motion.div>
  )

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-serif">Movie Search</h1>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors duration-300"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-6 h-6 text-yellow-500" /> : <Moon className="w-6 h-6 text-gray-700" />}
          </button>
        </div>

        <form className="relative w-full max-w-2xl mx-auto mb-8">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for movies..."
            className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </form>

        {favorites.length > 0 && (
          <motion.div layout className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-serif mb-4">Your Favorites</h2>
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {(showAllFavorites ? favorites : favorites.slice(0, 6)).map((movie) => (
                  <MovieCard key={movie.imdbID} movie={movie} />
                ))}
              </AnimatePresence>
            </motion.div>
            {favorites.length > 6 && (
              <motion.div layout className="mt-4 text-center">
                <button
                  onClick={toggleShowAllFavorites}
                  className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors duration-300"
                >
                  {showAllFavorites ? "See Less" : "See More"}
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {error && <div className="text-center text-red-500 dark:text-red-400">{error}</div>}

        {loading && query.length >= 3 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="animate-pulse"
              >
                <div className="aspect-[2/3] bg-gray-200 dark:bg-gray-700 rounded-xl" />
                <div className="mt-4 space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {(query.length < 3 ? popularMovies : movies).map((movie, index) => (
                <div
                  key={movie.imdbID}
                  ref={
                    index === (query.length < 3 ? popularMovies.length - 1 : movies.length - 1)
                      ? lastMovieElementRef
                      : undefined
                  }
                >
                  <MovieCard movie={movie} />
                </div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {loading && query.length >= 3 && movies.length > 0 && (
          <div className="flex justify-center mt-8">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </main>
  )
}

