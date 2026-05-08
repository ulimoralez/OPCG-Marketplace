interface SearchResultsHeaderProps {
  count: number;
  query: string;
}

export function SearchResultsHeader({ count, query }: SearchResultsHeaderProps) {
  return (
    <div>
      <h1 className="text-xl font-bold">
        {query ? `Resultados para "${query}"` : "Todas las publicaciones"}
      </h1>
      <p className="text-sm text-muted-foreground mt-0.5">
        {count} {count === 1 ? "publicación encontrada" : "publicaciones encontradas"}
      </p>
    </div>
  );
}
