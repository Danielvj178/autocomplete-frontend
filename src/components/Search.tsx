import { useState, useEffect, ChangeEvent, KeyboardEvent } from 'react';

interface Article {
  title: string;
  content: string;
}

function Search() {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setShowSuggestions(true);
  };

  const fetchResults = async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:3000/article/search?q=${query}`);
      if (!response.ok) {
        throw new Error('Error al realizar la búsqueda');
      }
      const data: Article[] = await response.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchResults();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      setActiveSuggestion((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      setActiveSuggestion((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter' && activeSuggestion >= 0) {
      setQuery(results[activeSuggestion].title);
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    }
  };

  const handleSuggestionClick = (title: string) => {
    setQuery(title);
    setShowSuggestions(false);
  };

  return (
    <div className="flex flex-col items-center mt-10">
      <h1 className="text-2xl font-bold mb-4">Programs search</h1>
      <div className="relative w-full max-w-md">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Programs search..."
          onBlur={() => setShowSuggestions(false)}
          onFocus={() => setShowSuggestions(true)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {loading && <p className="text-center text-gray-500 mt-2">Loading...</p>}
        {error && <p className="text-center text-red-500 mt-2">{error}</p>}

        {showSuggestions && results.length > 0 && (
          <ul className="absolute w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {results.map((result, index) => (
              <li
                key={index}
                onMouseDown={() => handleSuggestionClick(result.title)}
                className={`px-4 py-2 cursor-pointer hover:bg-indigo-100 ${index === activeSuggestion ? 'bg-indigo-100' : ''
                  }`}
              >
                <span className="font-semibold">{result.title}</span>
                {/* <p className="text-sm text-gray-500 truncate">{result.content}</p> */}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Search;
