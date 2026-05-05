const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Seeding mock data...');

  // 1. Sign up Owner
  console.log('Signing up Owner...');
  const { data: ownerData, error: ownerError } = await supabase.auth.signUp({
    email: 'owner@saha-event.com',
    password: 'password123',
    options: {
      data: {
        full_name: 'Test Owner',
        phone: '0555000001',
        role: 'OWNER'
      }
    }
  });
  if (ownerError) console.error('Owner error:', ownerError.message);

  // 2. Sign up Admin
  console.log('Signing up Admin...');
  const { data: adminData, error: adminError } = await supabase.auth.signUp({
    email: 'admin@saha-event.com',
    password: 'password123',
    options: {
      data: {
        full_name: 'Test Admin',
        phone: '0555000002',
        role: 'ADMIN' // Triggers will fallback to CLIENT if invalid, but we will fix with SQL later
      }
    }
  });
  if (adminError) console.error('Admin error:', adminError.message);

  // 3. Sign up Client
  console.log('Signing up Client...');
  const { data: clientData, error: clientError } = await supabase.auth.signUp({
    email: 'client@saha-event.com',
    password: 'password123',
    options: {
      data: {
        full_name: 'Test Client',
        phone: '0555000003',
        role: 'CLIENT'
      }
    }
  });
  if (clientError) console.error('Client error:', clientError.message);

  // Wait a few seconds for profiles to be created by triggers
  await new Promise(r => setTimeout(r, 2000));

  if (!ownerData?.user?.id || !clientData?.user?.id) {
    console.error('Missing user IDs, cannot create venue/reservation.');
    return;
  }

  // 4. Create Venue for Owner
  console.log('Creating Venue...');
  const { data: venue, error: venueError } = await supabase.from('venues').insert({
    owner_id: ownerData.user.id,
    name: 'Grand Palace Test',
    wilaya: 'Alger',
    address: '123 Test Street, Bab Ezzouar',
    description: 'A beautiful wedding hall for testing.',
    capacity_max: 500,
    area_m2: 1200,
    price_per_day: 100000,
    deposit_percentage: 33,
    options: { parking: true, clim: true },
    status: 'PUBLISHED',
    ccp_name: 'Test Owner',
    ccp_number: '123456 78',
    ccp_key: '90'
  }).select().single();

  if (venueError) console.error('Venue error:', venueError.message);

  if (venue) {
    // 5. Create Reservation for Client
    console.log('Creating Reservation...');
    // Create date tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const startDate = tomorrow.toISOString().split('T')[0];
    const endDateObj = new Date(tomorrow);
    endDateObj.setDate(endDateObj.getDate() + 1);
    const endDate = endDateObj.toISOString().split('T')[0];
    const referenceCode = `SE-${Date.now().toString(36).toUpperCase()}`;

    const { error: resError } = await supabase.from('reservations').insert({
      venue_id: venue.id,
      client_id: clientData.user.id,
      reference_code: referenceCode,
      start_date: startDate,
      end_date: endDate,
      total_price: 100000,
      deposit_amount: 33000,
      status: 'PENDING'
    });
    if (resError) console.error('Reservation error:', resError.message);
  }

  console.log('Done!');
}

main();
