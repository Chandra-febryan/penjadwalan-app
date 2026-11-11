<template>
  <div class="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 min-h-[580px] flex flex-col justify-between">
    <!-- JIKA BELUM LOGIN ADMIN -->
    <div v-if="!isAuthenticated" class="text-center py-10 my-auto">
      <div class="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-700">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
        </svg>
      </div>
      <h2 class="text-base font-bold text-slate-800 mb-1">Panel Admin</h2>
      <p class="text-xs text-slate-500 mb-4">Masukkan sandi admin untuk mengakses</p>
      
      <input 
        v-model="pinInput" 
        @keyup.enter="loginAdmin"
        type="password" 
        placeholder="Sandi Admin" 
        class="w-full h-11 px-3 text-center text-sm border border-slate-200 rounded-xl mb-3 focus:outline-none focus:ring-2 focus:ring-slate-900"
      />
      <button 
        @click="loginAdmin" 
        class="w-full h-11 bg-slate-900 active:bg-slate-800 text-white text-xs font-semibold rounded-xl">
        Buka Panel
      </button>
    </div>

    <!-- JIKA SUDAH LOGIN -->
    <div v-else class="flex flex-col h-full">
      <!-- Header & Logout -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div>
          <h2 class="text-sm font-bold text-slate-800">Dashboard Admin</h2>
          <span class="text-[11px] text-emerald-600 font-medium">● Terhubung</span>
        </div>
        <button @click="logoutAdmin" class="text-xs text-red-500 hover:text-red-700 font-semibold py-1 px-2.5 bg-red-50 rounded-lg">
          Keluar
        </button>
      </div>

      <!-- Tab Navigasi Admin -->
      <div class="flex bg-slate-100 p-1 rounded-xl mb-4 text-xs font-semibold">
        <button 
          @click="activeSubTab = 'slots'" 
          :class="['flex-1 py-1.5 rounded-lg transition', activeSubTab === 'slots' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800']">
          Buka/Tutup Slot
        </button>
        <button 
          @click="fetchBookingsTab" 
          :class="['flex-1 py-1.5 rounded-lg transition relative', activeSubTab === 'logs' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800']">
          Log Booking
          <span v-if="pendingCount > 0" class="ml-1 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px]">
            {{ pendingCount }}
          </span>
        </button>
      </div>

      <!-- TAB 1: KELOLA SLOT -->
      <div v-if="activeSubTab === 'slots'" class="space-y-4">
        <!-- Form Tambah Slot -->
        <div class="bg-slate-50 p-4 rounded-2xl space-y-3">
          <div>
            <label class="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider">Tanggal</label>
            <input v-model="newDate" :min="today" type="date"
              class="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900" />
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider">Jam Pertemuan</label>
            <div class="grid grid-cols-3 gap-1.5 mb-2">
              <button 
                v-for="t in presetTimes" 
                :key="t" 
                type="button"
                @click="newTime = t"
                :class="['h-8 rounded-lg text-xs font-medium border transition', newTime === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100']">
                {{ t }}
              </button>
            </div>
            <input v-model="newTime" type="time"
              class="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900" />
          </div>

          <button 
            @click="addSlot" 
            :disabled="!newDate || !newTime"
            class="w-full h-10 bg-slate-900 active:bg-slate-800 text-white text-xs font-semibold rounded-xl transition disabled:opacity-40">
            + Buka Slot Ini
          </button>
        </div>

        <!-- Daftar Slot Aktif -->
        <div>
          <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Slot Aktif ({{ slots.length }})</h3>
          <div v-if="slots.length === 0" class="text-center py-6 text-xs text-slate-400">
            Belum ada slot yang dibuka.
          </div>
          <div class="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            <div v-for="slot in slots" :key="slot.id" class="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <span class="text-xs font-bold text-slate-800">{{ slot.slot_date }}</span>
                <span class="text-xs text-slate-500 ml-2">Pukul {{ slot.slot_time }} WIB</span>
              </div>
              <button @click="deleteSlot(slot.id)" class="text-[11px] font-semibold text-red-600 hover:text-red-800 px-2">
                Hapus
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: LOG & RIWAYAT BOOKING -->
      <div v-else class="space-y-3 flex-1 flex flex-col">
        <!-- Filter Pill -->
        <div class="flex gap-1.5 overflow-x-auto pb-1 text-[11px]">
          <button 
            @click="statusFilter = 'ALL'" 
            :class="['px-2.5 py-1 rounded-lg border font-medium transition', statusFilter === 'ALL' ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200']">
            Semua ({{ bookings.length }})
          </button>
          <button 
            @click="statusFilter = 'PENDING'" 
            :class="['px-2.5 py-1 rounded-lg border font-medium transition', statusFilter === 'PENDING' ? 'bg-amber-500 text-white border-amber-500' : 'bg-amber-50 text-amber-700 border-amber-200']">
            Pending
          </button>
          <button 
            @click="statusFilter = 'APPROVED'" 
            :class="['px-2.5 py-1 rounded-lg border font-medium transition', statusFilter === 'APPROVED' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-emerald-50 text-emerald-700 border-emerald-200']">
            Disetujui
          </button>
          <button 
            @click="statusFilter = 'REJECTED'" 
            :class="['px-2.5 py-1 rounded-lg border font-medium transition', statusFilter === 'REJECTED' ? 'bg-red-600 text-white border-red-600' : 'bg-red-50 text-red-700 border-red-200']">
            Ditolak
          </button>
        </div>

        <!-- Daftar Log -->
        <div v-if="filteredBookings.length === 0" class="text-center py-10 my-auto text-xs text-slate-400">
          Tidak ada data riwayat jadwal.
        </div>

        <div v-else class="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
          <div 
            v-for="b in filteredBookings" 
            :key="b.id" 
            class="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs">
            
            <!-- Baris Nama & Status -->
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-900 text-sm">{{ b.name }}</span>
              <span :class="getStatusBadgeClass(b.status)">
                {{ b.status }}
              </span>
            </div>

            <!-- Tanggal & Jam Pertemuan -->
            <div class="text-slate-700 flex items-center gap-1.5 font-medium">
              <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              {{ b.booking_date }} • Pukul {{ b.booking_time }} WIB
            </div>

            <!-- Email & Catatan -->
            <div class="text-slate-500 text-[11px] truncate">✉ {{ b.email }}</div>
            <div v-if="b.notes" class="bg-white p-2 rounded-xl border border-slate-100 text-[11px] text-slate-600 italic">
              "{{ b.notes }}"
            </div>

            <!-- Waktu Request Diajukan -->
            <div class="text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 flex justify-between">
              <span>Diajukan: {{ formatLogTime(b.created_at) }}</span>
              <span v-if="b.gcal_event_id" class="text-blue-600 font-medium">✓ Ada di Kalender</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const isAuthenticated = ref(false);
const pinInput = ref('');
const adminToken = ref(sessionStorage.getItem('admin_token') || '');

const activeSubTab = ref('slots');
const statusFilter = ref('ALL');

const slots = ref([]);
const bookings = ref([]);
const newDate = ref('');
const newTime = ref('');
const today = new Date().toISOString().split('T')[0];
const presetTimes = ['09:00', '10:00', '11:00', '13:30', '15:00', '16:00'];

const pendingCount = computed(() => bookings.value.filter(b => b.status === 'PENDING').length);

const filteredBookings = computed(() => {
  if (statusFilter.value === 'ALL') return bookings.value;
  return bookings.value.filter(b => b.status === statusFilter.value);
});

const loadSlots = async () => {
  try {
    const res = await fetch('/api/admin/slots', {
      headers: { 'x-admin-key': adminToken.value }
    });
    if (res.ok) {
      slots.value = await res.json();
      isAuthenticated.value = true;
    } else {
      isAuthenticated.value = false;
      sessionStorage.removeItem('admin_token');
    }
  } catch (e) {
    console.error(e);
  }
};

const loadBookings = async () => {
  try {
    const res = await fetch('/api/admin/bookings', {
      headers: { 'x-admin-key': adminToken.value }
    });
    if (res.ok) {
      bookings.value = await res.json();
    }
  } catch (e) {
    console.error(e);
  }
};

const fetchBookingsTab = async () => {
  activeSubTab.value = 'logs';
  await loadBookings();
};

const loginAdmin = async () => {
  adminToken.value = pinInput.value;
  sessionStorage.setItem('admin_token', pinInput.value);
  await loadSlots();
  if (isAuthenticated.value) {
    await loadBookings();
  } else {
    alert('Sandi Admin salah!');
  }
};

const logoutAdmin = () => {
  isAuthenticated.value = false;
  adminToken.value = '';
  sessionStorage.removeItem('admin_token');
};

const addSlot = async () => {
  if (!newDate.value || !newTime.value) return;
  const res = await fetch('/api/admin/slots', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminToken.value
    },
    body: JSON.stringify({ date: newDate.value, time: newTime.value })
  });

  if (res.ok) {
    newTime.value = '';
    loadSlots();
  } else {
    const data = await res.json();
    alert(data.error);
  }
};

const deleteSlot = async (id) => {
  await fetch(`/api/admin/slots/${id}`, {
    method: 'DELETE',
    headers: { 'x-admin-key': adminToken.value }
  });
  loadSlots();
};

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'APPROVED':
      return 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800';
    case 'REJECTED':
      return 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800';
    default:
      return 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse';
  }
};

const formatLogTime = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

onMounted(() => {
  if (adminToken.value) {
    loadSlots();
    loadBookings();
  }
});
</script>