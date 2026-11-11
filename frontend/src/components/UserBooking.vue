<template>
  <div class="bg-white min-h-[580px] p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
    <div>
      <!-- Header -->
      <div class="text-center mb-5">
        <span class="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold mb-2">Pilih Jadwal</span>
        <h1 class="text-lg font-bold text-slate-900">Reservasi Pertemuan</h1>
        <p class="text-xs text-slate-500 mt-0.5">Pilih salah satu jadwal yang tersedia di bawah ini</p>
      </div>

      <!-- 1. Horizontal Date Picker -->
      <div class="mb-5">
        <label class="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2">1. Pilih Tanggal</label>
        
        <div v-if="dates.length === 0" class="text-center py-6 bg-slate-50 rounded-2xl text-xs text-slate-500">
          Saat ini belum ada jadwal yang dibuka oleh admin.
        </div>

        <div v-else class="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            v-for="date in dates"
            :key="date"
            type="button"
            @click="selectDate(date)"
            :class="[
              'flex-shrink-0 w-20 py-3 rounded-2xl border text-center transition-all',
              selectedDate === date
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            ]">
            <div class="text-[11px] font-medium opacity-80">{{ formatDay(date) }}</div>
            <div class="text-base font-extrabold">{{ formatDateNum(date) }}</div>
            <div class="text-[10px] opacity-80">{{ formatMonth(date) }}</div>
          </button>
        </div>
      </div>

      <!-- 2. Time Slot Grid -->
      <div v-if="selectedDate" class="mb-5">
        <label class="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2">2. Pilih Waktu</label>
        
        <div v-if="loadingSlots" class="text-xs text-slate-400 py-3 text-center">Memeriksa ketersediaan jam...</div>
        <div v-else-if="times.length === 0" class="p-3 bg-amber-50 text-amber-700 rounded-xl text-xs text-center font-medium">
          Semua sesi di tanggal ini sudah penuh.
        </div>
        
        <div v-else class="grid grid-cols-3 gap-2">
          <button
            v-for="t in times"
            :key="t"
            type="button"
            @click="selectedTime = t"
            :class="[
              'h-11 rounded-xl text-xs font-semibold border transition-all',
              selectedTime === t
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
            ]">
            {{ t }} WIB
          </button>
        </div>
      </div>

      <!-- 3. Formulir Data Diri -->
      <form v-if="selectedDate && selectedTime" @submit.prevent="submitBooking" class="space-y-3 pt-3 border-t border-slate-100">
        <div>
          <label class="block text-[11px] font-semibold text-slate-600 mb-1">Nama Lengkap</label>
          <input v-model="form.name" required type="text" placeholder="Nama Anda"
            class="w-full h-11 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label class="block text-[11px] font-semibold text-slate-600 mb-1">Email Aktif</label>
          <input v-model="form.email" required type="email" placeholder="nama@email.com"
            class="w-full h-11 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label class="block text-[11px] font-semibold text-slate-600 mb-1">Catatan</label>
          <textarea v-model="form.notes" rows="2" placeholder="Tujuan atau agenda konsultasi..."
            class="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
        </div>

        <button :disabled="submitting" type="submit"
          class="w-full h-12 bg-blue-600 active:bg-blue-700 text-white font-semibold rounded-2xl text-xs shadow-md shadow-blue-200 transition disabled:opacity-50 mt-1">
          {{ submitting ? 'Mengirim Jadwal...' : 'Ajukan Jadwal Sekarang' }}
        </button>
      </form>
    </div>

    <!-- Alert Box -->
    <div v-if="alertMessage" :class="['mt-4 p-3 rounded-2xl text-xs text-center font-medium', alertSuccess ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200']">
      {{ alertMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const dates = ref([]);
const times = ref([]);
const selectedDate = ref('');
const selectedTime = ref('');
const loadingSlots = ref(false);
const submitting = ref(false);

const form = ref({ name: '', email: '', notes: '' });
const alertMessage = ref('');
const alertSuccess = ref(false);

const loadDates = async () => {
  const res = await fetch('/api/client/available-dates');
  dates.value = await res.json();
};

const selectDate = async (date) => {
  selectedDate.value = date;
  selectedTime.value = '';
  loadingSlots.value = true;
  try {
    const res = await fetch(`/api/client/slots?date=${date}`);
    times.value = await res.json();
  } finally {
    loadingSlots.value = false;
  }
};

const formatDay = (str) => new Date(str).toLocaleDateString('id-ID', { weekday: 'short' });
const formatDateNum = (str) => new Date(str).getDate();
const formatMonth = (str) => new Date(str).toLocaleDateString('id-ID', { month: 'short' });

const submitBooking = async () => {
  submitting.value = true;
  alertMessage.value = '';
  try {
    const res = await fetch('/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form.value,
        booking_date: selectedDate.value,
        booking_time: selectedTime.value
      })
    });
    const result = await res.json();
    if (res.ok) {
      alertSuccess.value = true;
      alertMessage.value = result.message;
      form.value = { name: '', email: '', notes: '' };
      selectedTime.value = '';
      selectDate(selectedDate.value);
    } else {
      alertSuccess.value = false;
      alertMessage.value = result.error;
    }
  } catch (e) {
    alertSuccess.value = false;
    alertMessage.value = 'Gagal terhubung ke server backend.';
  } finally {
    submitting.value = false;
  }
};

onMounted(loadDates);
</script>