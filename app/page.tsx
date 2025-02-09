"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Moon, Sun } from "lucide-react"
import Image from "next/image"
import { Heart } from "lucide-react"

export default function Home() {
  const [query, setQuery] = useState("")
  const [movies, setMovies] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [hasMore, setHasMore] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [popularMovies, setPopularMovies] = useState<any[]>([])
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
    const favorites = JSON.parse(localStorage.getItem("favorites") || "[]")
    const isFavorite = favorites.some((fav: any) => fav.imdbID === movie.imdbID)

    const newFavorites = isFavorite
      ? favorites.filter((fav: any) => fav.imdbID !== movie.imdbID)
      : [...favorites, movie]

    localStorage.setItem("favorites", JSON.stringify(newFavorites))
    setMovies((prev) => [...prev]) // Force re-render
  }

  const isFavorite = (id: string) => {
    const favorites = JSON.parse(localStorage.getItem("favorites") || "[]")
    return favorites.some((fav: any) => fav.imdbID === id)
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
        setPage(currentPage + 1)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    },
    [query, page],
  )

  const fetchPopularMovies = useCallback(
    async (page = 1) => {
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
        setPage(page + 1)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    },
    [setPage, setPopularMovies, setHasMore, setError, setLoading],
  )

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
    [loading, hasMore, query, searchMovies, fetchPopularMovies],
  )

  useEffect(() => {
    fetchPopularMovies()
    const savedDarkMode = localStorage.getItem("darkMode")
    const initialDarkMode = savedDarkMode === null ? true : savedDarkMode === "true"
    setDarkMode(initialDarkMode)
    document.documentElement.classList.toggle("dark", initialDarkMode)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 3) {
        searchMovies(true)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, searchMovies])

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-serif">Movie Search</h1>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-6 h-6 text-yellow-500" /> : <Moon className="w-6 h-6 text-gray-700" />}
          </button>
        </div>

        <form className="relative w-full max-w-2xl mx-auto">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for movies..."
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </form>

        {error && <div className="text-center text-red-500 dark:text-red-400">{error}</div>}

        {loading && query.length >= 3 && movies.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[2/3] bg-gray-200 dark:bg-gray-700 rounded-xl" />
                <div className="mt-4 space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {(query.length < 3 ? popularMovies : movies).map((movie, index) => (
              <div
                key={movie.imdbID}
                ref={
                  index === (query.length < 3 ? popularMovies.length - 1 : movies.length - 1)
                    ? lastMovieElementRef
                    : undefined
                }
                className="relative group overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-lg transition-transform hover:scale-105"
              >
                <a href={`/movie/${movie.imdbID}`}>
                  <div className="relative aspect-[2/3] overflow-hidden">
                    {movie.Poster !== "N/A" ? (
                      <Image
                        src={movie.Poster || "/placeholder.svg"}
                        alt={movie.Title}
                        fill
                        className="object-cover"
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
                        className={`w-5 h-5 ${
                          isFavorite(movie.imdbID) ? "fill-red-500 text-red-500" : "text-gray-400"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {loading && query.length >= 3 && movies.length > 0 && (
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </main>
  )
}

// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   darkMode: ["class"],
//   content: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "./app/**/*.{js,ts,jsx,tsx,mdx}", "*.{js,ts,jsx,tsx,mdx}"],
//   theme: {
//     extend: {
//       fontFamily: {
//         sans: ["var(--font-bricolage)"],
//         serif: ["var(--font-playfair)"],
//       },
//       colors: {
//         border: "hsl(var(--border))",
//         input: "hsl(var(--input))",
//         ring: "hsl(var(--ring))",
//         background: "hsl(var(--background))",
//         foreground: "hsl(var(--foreground))",
//         primary: {
//           DEFAULT: "hsl(var(--primary))",
//           foreground: "hsl(var(--primary-foreground))",
//         },
//         secondary: {
//           DEFAULT: "hsl(var(--secondary))",
//           foreground: "hsl(var(--secondary-foreground))",
//         },
//         destructive: {
//           DEFAULT: "hsl(var(--destructive))",
//           foreground: "hsl(var(--destructive-foreground))",
//         },
//         muted: {
//           DEFAULT: "hsl(var(--muted))",
//           foreground: "hsl(var(--muted-foreground))",
//         },
//         accent: {
//           DEFAULT: "hsl(var(--accent))",
//           foreground: "hsl(var(--accent-foreground))",
//         },
//         popover: {
//           DEFAULT: "hsl(var(--popover))",
//           foreground: "hsl(var(--popover-foreground))",
//         },
//         card: {
//           DEFAULT: "hsl(var(--card))",
//           foreground: "hsl(var(--card-foreground))",
//         },
//         purple: {
//           50: "#faf5ff",
//           100: "#f3e8ff",
//           200: "#e9d5ff",
//           300: "#d8b4fe",
//           400: "#c084fc",
//           500: "#a855f7",
//           600: "#9333ea",
//           700: "#7e22ce",
//           800: "#6b21a8",
//           900: "#581c87",
//           950: "#3b0764",
//         },
//       },
//       borderRadius: {
//         lg: "var(--radius)",
//         md: "calc(var(--radius) - 2px)",
//         sm: "calc(var(--radius) - 4px)",
//       },
//     },
//   },
//   plugins: [require("@tailwindcss/line-clamp"), require("tailwindcss-animate")],
// }

