export interface SearchResult {
  address: string;
  lat: number;
  lng: number;
}

export async function searchLocation(
  query: string
): Promise<SearchResult[]> {
  if (!query || query.length < 3) return [];

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query
    )}&format=jsonv2&limit=5`
  );

  const data = await res.json();

  return data.map((item: any) => ({
    address: item.display_name,
    lat: Number(item.lat),
    lng: Number(item.lon),
  }));
}