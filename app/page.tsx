import { createClient } from "@/utils/supabase/server";
import { HomeClient } from "@/components/home-client";

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch top 3 venues for featured section
  const { data: venues } = await (supabase
    .from("venues")
    .select("id, name, wilaya, price_per_day, capacity_max")
    .eq("status", "PUBLISHED")
    .order("created_at", { ascending: false })
    .limit(3) as any);

  const featuredVenues = (venues || []).map((v: any) => ({
    id: v.id,
    name: v.name,
    wilaya: v.wilaya,
    price: v.price_per_day,
    capacity: v.capacity_max,
    rating: 4.8, // placeholder until reviews table
    image: `/images/venue-${Math.floor(Math.random() * 3) + 1}.png`,
  }));

  return <HomeClient venues={featuredVenues} />;
}
