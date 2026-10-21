const API_BASE = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const res = await fetch(url, {
    ...options,
    headers,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING END-TO-END SMART PARKING SYSTEM TEST SUITE');
  console.log('====================================================\n');

  // 1. Health check
  console.log('1. Testing System Health...');
  const health = await request('/health');
  if (health.status !== 200 || health.data.status !== 'online') {
    throw new Error('Health check failed');
  }
  console.log('   ✅ API Health Online! (Uptime:', health.data.uptimeSeconds, 's)');

  // 2. User login
  console.log('2. Testing Driver Login (john.doe@example.com)...');
  const userLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'john.doe@example.com', password: 'User1234!' }),
  });
  if (userLogin.status !== 200 || !userLogin.data.data.token) {
    throw new Error('User login failed');
  }
  const userToken = userLogin.data.data.token;
  console.log('   ✅ User Authenticated:', userLogin.data.data.user.name);

  // 3. User Dashboard Stats
  console.log('3. Testing User Dashboard Metrics API...');
  const dash = await request('/users/dashboard', {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  if (dash.status !== 200) throw new Error('Dashboard stats failed');
  console.log('   ✅ Total Bookings:', dash.data.data.counts.totalBookings, '| Upcoming:', dash.data.data.counts.upcomingBookings);

  // 4. Slots query
  console.log('4. Querying Parking Slot Availability...');
  const slots = await request('/slots');
  if (slots.status !== 200 || !slots.data.data.length) throw new Error('Slots query failed');
  const availableSlot = slots.data.data.find((s) => s.isAvailable);
  console.log('   ✅ Found', slots.data.data.length, 'slots across decks. Selected available slot:', availableSlot.slotNumber, `(${availableSlot.area})`);

  // 5. Booking creation
  console.log('5. Creating Real-Time Parking Reservation...');
  const now = new Date();
  const startTime = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
  const endTime = new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString();

  const booking = await request('/bookings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({
      slotId: availableSlot._id,
      startTime,
      endTime,
    }),
  });
  if (booking.status !== 201) throw new Error(`Booking creation failed: ${JSON.stringify(booking.data)}`);
  const bData = booking.data.data.booking;
  console.log('   ✅ Reservation Created! Ref:', bData.bookingReference, '| Amount: $' + bData.amount, '| Status:', bData.bookingStatus);

  // 6. Overlapping conflict check
  console.log('6. Testing Concurrency Overlap / Double-Booking Prevention...');
  const conflictAttempt = await request('/bookings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({
      slotId: availableSlot._id,
      startTime,
      endTime,
    }),
  });
  if (conflictAttempt.status === 409) {
    console.log('   ✅ Overlap Collision Successfully Blocked with HTTP 409 Conflict!');
  } else {
    throw new Error(`Double booking was NOT rejected! Status: ${conflictAttempt.status}`);
  }

  // 7. Simulated Demo Payment
  console.log('7. Simulating Instant Payment Confirmation...');
  const payment = await request(`/bookings/${bData._id}/demo-payment`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({
      outcome: 'success',
      method: 'credit_card',
    }),
  });
  if (payment.status !== 200 || payment.data.data.booking.bookingStatus !== 'confirmed') {
    throw new Error('Payment simulation failed');
  }
  console.log('   ✅ Simulated Payment Succeeded! Booking Status:', payment.data.data.booking.bookingStatus, '| Txn:', payment.data.data.receipt.transactionReference);

  // 8. Admin login and overview
  console.log('8. Testing Administrator Authentication (admin@smartpark.com)...');
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@smartpark.com', password: 'Admin1234!' }),
  });
  if (adminLogin.status !== 200 || adminLogin.data.data.user.role !== 'admin') {
    throw new Error('Admin login failed');
  }
  const adminToken = adminLogin.data.data.token;
  console.log('   ✅ Administrator Verified:', adminLogin.data.data.user.name);

  // 9. Admin Stats
  console.log('9. Testing Admin Dashboard Analytics & Revenue Aggregation...');
  const adminStats = await request('/admin/stats', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (adminStats.status !== 200) throw new Error('Admin stats failed');
  console.log('   ✅ Admin Summary:');
  console.log('      - Total Slots:', adminStats.data.data.summary.totalSlots);
  console.log('      - Active Slots:', adminStats.data.data.summary.activeSlots);
  console.log('      - Currently Occupied:', adminStats.data.data.summary.currentlyOccupied);
  console.log('      - Total Simulated Revenue: $' + adminStats.data.data.summary.totalSimulatedRevenue.toFixed(2));

  // 10. Security: Non-admin blocked from admin endpoints
  console.log('10. Security Verification: Non-admin Blocked from Admin APIs...');
  const forbiddenCheck = await request('/admin/stats', {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  if (forbiddenCheck.status === 403) {
    console.log('   ✅ Regular user blocked with HTTP 403 Forbidden!');
  } else {
    throw new Error(`Non-admin was not blocked! Status: ${forbiddenCheck.status}`);
  }

  // 11. Public QR Verification
  console.log('11. Testing Public QR Code Booking Verification Endpoint...');
  const qrCheck = await request(`/bookings/verify/${bData.bookingReference}`);
  if (qrCheck.status !== 200 || qrCheck.data.data.reference !== bData.bookingReference) {
    throw new Error('QR verification failed');
  }
  console.log('   ✅ QR Scan Verification Successful! Status:', qrCheck.data.data.validity, '| Slot:', qrCheck.data.data.slotNumber);

  console.log('\n====================================================');
  console.log('🎉 ALL 11 END-TO-END INTEGRATION TESTS PASSED 100%!');
  console.log('====================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ Test Suite Error:', err.message);
  process.exit(1);
});
