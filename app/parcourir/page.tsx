import { createClient } from "@/utils/supabase/server";
import { BrowseClient } from "@/components/browse-client";

export default async function ParcourirPage() {
  const supabase = await createClient();

  // Fetch all published venues with their first photo
  const { data: venues } = await (supabase
    .from("venues")
    .select("id, name, wilaya, address, price_per_day, capacity_max, venue_photos(url, display_order)")
    .eq("status", "PUBLISHED")
    .order("created_at", { ascending: false }) as any);

  const allVenues = (venues || []).map((v: any, i: number) => {
    // Get the first photo sorted by display_order, fallback to local images
    const photos = (v.venue_photos || []).sort(
      (a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)
    );
    const image = photos.length > 0 ? photos[0].url : `/images/venue-${(i % 3) + 1}.png`;

    return {
      id: v.id,
      name: v.name,
      wilaya: v.wilaya,
      address: v.address || "",
      price_per_day: v.price_per_day,
      capacity_max: v.capacity_max,
      rating: 4.5 + (Math.round((i * 0.1 + 0.2) * 10) / 10) % 0.5,
      reviews: 50 + i * 30,
      image,
    };
  });

  // Extract unique wilayas from actual data
  const uniqueWilayas = ["Toutes", ...Array.from(new Set(allVenues.map((v: any) => v.wilaya)))];

  return <BrowseClient venues={allVenues} wilayas={uniqueWilayas as string[]} />;
}
