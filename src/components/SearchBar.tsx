import React, { useState, useEffect, useRef } from 'react';
import { useLazyQuery, useQuery } from '@apollo/client';
import { gql } from 'graphql-tag';

// Consultas GraphQL
const SEARCH_ARTICLES = gql`
  query SearchArticles($query: String!) {
    searchArticles(query: $query) {
      title
      content
    }
  }
`;

const POPULAR_SEARCHES = gql`
  query PopularSearches {
    getPopularSearches {
      query
      count
    }
  }
`;

const Search = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [searchArticles, { data: articlesData, loading, error }] = useLazyQuery(SEARCH_ARTICLES);
  const { data: popularData, loading: popularLoading } = useQuery(POPULAR_SEARCHES);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Debounce para evitar consultas excesivas mientras se escribe
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // Espera 300ms después de que el usuario deje de escribir

    return () => clearTimeout(timer); // Limpia el timeout cuando el componente se desmonte o cambie searchTerm
  }, [searchTerm]);

  // Ejecutar la consulta solo cuando debouncedSearchTerm cambie
  useEffect(() => {
    if (debouncedSearchTerm) {
      searchArticles({ variables: { query: debouncedSearchTerm } });
    }
  }, [debouncedSearchTerm, searchArticles]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Filtrar las búsquedas populares para que coincidan con la búsqueda
  const filteredPopularSearches = popularData?.getPopularSearches.filter((search: any) =>
    search.query.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  const combinedResults = [
    ...(filteredPopularSearches || []), // Búsquedas populares filtradas
    ...(articlesData?.searchArticles || []), // Artículos que coinciden con la búsqueda
  ];

  // Función para mantener el foco del input cuando el componente se renderiza
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus(); // Establecer foco en el input cuando se renderiza
    }
  }, [searchTerm]); // Solo cuando searchTerm cambia

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="relative p-4">
      <input
        ref={inputRef} // Establecer la referencia al input
        type="text"
        value={searchTerm}
        onChange={handleChange}
        placeholder="Search for articles..."
        className="p-2 border rounded-md w-full mb-4"
      />

      {/* Dropdown */}
      <div className="absolute top-full left-0 w-full mt-2 border bg-white rounded-md shadow-md">
        {searchTerm && (
          <ul className="max-h-60 overflow-auto">
            {popularLoading ? (
              <p>Loading popular searches...</p>
            ) : (
              <div>
                {/* Mostrar las búsquedas populares primero */}
                {filteredPopularSearches && filteredPopularSearches.length > 0 && (
                  <div className="p-2 border-b">
                    <strong>Popular Searches</strong>
                    <ul>
                      {filteredPopularSearches.map((search: any) => (
                        <li key={search.query} className="p-2 cursor-pointer hover:bg-gray-200">
                          {search.query} ({search.count} searches)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {/* Mostrar los resultados de la búsqueda debajo */}
            {articlesData?.searchArticles && articlesData.searchArticles.length > 0 && (
              <div className="p-2">
                <strong>Search Results</strong>
                <ul>
                  {articlesData.searchArticles.map((article: any) => (
                    <li key={article.title} className="p-2 cursor-pointer hover:bg-gray-200">
                      <h3 className="font-semibold">{article.title}</h3>
                      <p>{article.content}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {combinedResults.length === 0 && !popularLoading && !articlesData?.searchArticles?.length && (
              <div className="p-2 text-center text-gray-500">No results found</div>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Search;
