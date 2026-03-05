"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { useDebounce } from "@/hooks/useDebounce"

interface SearchResult {
  id: string
  name: string
  type: string
  url: string
  details?: any
}

interface SearchResults {
  teachers: SearchResult[]
  classrooms: SearchResult[]
  grades: SearchResult[]
  subjects: SearchResult[]
  schedules: SearchResult[]
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults(null)
      return
    }

    setLoading(true)
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => res.json())
      .then((data) => {
        setResults(data.results)
        setLoading(false)
      })
      .catch((error) => {
        console.error("Error searching:", error)
        setLoading(false)
      })
  }, [debouncedQuery])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === "Escape") {
        setOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const handleResultClick = (result: SearchResult) => {
    router.push(result.url)
    setOpen(false)
    setQuery("")
  }

  const totalResults =
    results &&
    Object.values(results).reduce((sum, arr) => sum + arr.length, 0)

  return (
    <>
      <Button
        variant="outline"
        className="relative w-full sm:w-64 justify-start text-sm text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        Search... <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Search</DialogTitle>
            <DialogDescription>
              Search for teachers, classrooms, grades, subjects, and schedules
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Type to search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
              {query && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                  onClick={() => setQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!loading && query.length >= 2 && totalResults === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No results found
              </div>
            )}

            {!loading && results && totalResults! > 0 && (
              <div className="max-h-[400px] overflow-y-auto space-y-4">
                {results.teachers.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Teachers</h3>
                    <div className="space-y-1">
                      {results.teachers.map((result) => (
                        <div
                          key={result.id}
                          className="p-2 rounded hover:bg-accent cursor-pointer"
                          onClick={() => handleResultClick(result)}
                        >
                          <p className="text-sm font-medium">{result.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results.classrooms.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Classrooms</h3>
                    <div className="space-y-1">
                      {results.classrooms.map((result) => (
                        <div
                          key={result.id}
                          className="p-2 rounded hover:bg-accent cursor-pointer"
                          onClick={() => handleResultClick(result)}
                        >
                          <p className="text-sm font-medium">{result.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results.grades.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Grades</h3>
                    <div className="space-y-1">
                      {results.grades.map((result) => (
                        <div
                          key={result.id}
                          className="p-2 rounded hover:bg-accent cursor-pointer"
                          onClick={() => handleResultClick(result)}
                        >
                          <p className="text-sm font-medium">{result.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results.subjects.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Subjects</h3>
                    <div className="space-y-1">
                      {results.subjects.map((result) => (
                        <div
                          key={result.id}
                          className="p-2 rounded hover:bg-accent cursor-pointer"
                          onClick={() => handleResultClick(result)}
                        >
                          <p className="text-sm font-medium">{result.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results.schedules.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Schedules</h3>
                    <div className="space-y-1">
                      {results.schedules.map((result) => (
                        <div
                          key={result.id}
                          className="p-2 rounded hover:bg-accent cursor-pointer"
                          onClick={() => handleResultClick(result)}
                        >
                          <p className="text-sm font-medium">{result.name}</p>
                          {result.details && (
                            <p className="text-xs text-muted-foreground">
                              {result.details.day} - Slot {result.details.slot} -{" "}
                              {result.details.classroom}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}


