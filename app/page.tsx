"use client"

import { useEffect, useState, useRef } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import MovieCard from "./components/movie-card"
import MovieCardSkeleton from "./components/movie-card-skeleton"
import { useInView } from "react-intersection-observer"

interface Movie {
  imdbID: string
  Title: string
  Year: string
  Poster: string
}

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [favorites, setFavorites] = useState<Movie[]>([])
  const [isDark, setIsDark] = useState(false)
  const lastSearch = useRef("")

  const { ref, inView } = useInView()

  // Load favorites from localStorage on mount
  useEffect(() => {
    const storedFavorites = localStorage.getItem("movieFavorites")
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites))
    }

    // Check for dark mode preference
    if (typeof window !== "undefined") {
      const isDarkMode = localStorage.getItem("darkMode") === "true"
      setIsDark(isDarkMode)
      if (isDarkMode) {
        document.documentElement.classList.add("dark")
      }
    }
  }, [])

  // Save favorites to localStorage when updated
  useEffect(() => {
    localStorage.setItem("movieFavorites", JSON.stringify(favorites))
  }, [favorites])

  // Handle dark mode toggle
  const toggleDarkMode = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle("dark")
    localStorage.setItem("darkMode", (!isDark).toString())
  }

  const searchMovies = async (pageNumber: number, newSearch?: string) => {
    try {
      setLoading(true)
      setError("")

      const searchTerm = newSearch ?? search
      const response = await fetch(
        `https://www.omdbapi.com/?apikey=${process.env.NEXT_PUBLIC_OMDB_API_KEY}&s=${searchTerm}&page=${pageNumber}`,
      )
      const data = await response.json()

      if (data.Response === "True") {
        if (newSearch || pageNumber === 1) {
          setMovies(data.Search)
        } else {
          setMovies((prev) => [...prev, ...data.Search])
        }
        setHasMore(data.Search.length === 10)
      } else {
        if (pageNumber === 1) {
          setMovies([])
        }
        setHasMore(false)
        if (pageNumber === 1) {
          setError("No movies found")
        }
      }
    } catch (err) {
      setError("Failed to fetch movies")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search !== lastSearch.current) {
      lastSearch.current = search
      setPage(1)
      searchMovies(1, search)
    }
  }

  const toggleFavorite = (movie: Movie) => {
    setFavorites((prev) => {
      const isFavorite = prev.some((fav) => fav.imdbID === movie.imdbID)
      if (isFavorite) {
        return prev.filter((fav) => fav.imdbID !== movie.imdbID)
      } else {
        return [...prev, movie]
      }
    })
  }

  // Handle infinite scroll
  useEffect(() => {
    if (inView && hasMore && !loading && search === lastSearch.current) {
      setPage((prev) => prev + 1)
      searchMovies(page + 1)
    }
  }, [inView, hasMore, loading, page, search, lastSearch]) // Added missing dependencies

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Movie Search</h1>
          <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <Input
              type="search"
              placeholder="Search for movies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">Search</Button>
          </div>
        </form>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {movies.map((movie) => (
            <MovieCard
              key={movie.imdbID}
              movie={movie}
              isFavorite={favorites.some((fav) => fav.imdbID === movie.imdbID)}
              onFavoriteToggle={() => toggleFavorite(movie)}
            />
          ))}
          {loading && (
            <>
              <MovieCardSkeleton />
              <MovieCardSkeleton />
              <MovieCardSkeleton />
              <MovieCardSkeleton />
            </>
          )}
        </div>

        <div ref={ref} className="h-10" />
      </div>
    </div>
  )
}

