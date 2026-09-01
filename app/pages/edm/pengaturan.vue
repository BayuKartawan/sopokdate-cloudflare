<template>
  <div class="min-h-screen">
    <div class="page-layout">

      <!-- Header -->
      <UiPageHeader title="Pengaturan EDM" :breadcrumbs="[
        { label: 'Beranda', to: '/' },
        { label: 'EDM' },
        { label: 'Pengaturan' },
      ]">
        <template #actions>
          <!-- Tombol Setting Tahun Anggaran -->
          <UiBaseButton text="Tahun Anggaran" @click="showTahunSettingModal = true">
            <template #icon>
              <CalendarDays class="w-4 h-4" />
            </template>
          </UiBaseButton>

          <!-- Tombol Setting Juknis EDM -->
          <UiBaseButton text="Juknis EDM" @click="showJuknisModal = true">
            <template #icon>
              <FileText class="w-4 h-4" />
            </template>
          </UiBaseButton>

          <PrintButton :documentTitle="`SK TPM EDM ${selectedTahunLabel}`">
            <div class="flex flex-col items-center w-full bg-white text-black font-['Arial',sans-serif] text-[12pt]">
              <!-- PAGE 1 -->
              <div class="sk-page w-[210mm] min-h-[297mm] p-[15mm_20mm] bg-white text-black relative box-border">
                <KopSurat class="mb-4" />
                <div class="text-center my-4 uppercase space-y-0.5">
                  <div class="tracking-wide">KEPUTUSAN</div>
                  <div>KEPALA MADRASAH IBTIDA'IYAH NAHDLATUL WATHAN PENYENGGIR</div>
                  <div class="my-0.5">NOMOR: {{ nomorSk }}</div>
                  <div class="mt-2.5 tracking-wide">TENTANG</div>
                  <div>PEMBENTUKAN TIM PENJAMIN MUTU MADRASAH (TPM)</div>
                  <div>MADRASAH IBTIDA'IYAH NAHDLATUL WATHAN PENYENGGIR</div>
                  <div>TAHUN ANGGARAN {{ tahunAnggaranVal }}</div>
                  <div class="mt-3.5 tracking-wide">DENGAN RAHMAT TUHAN YANG MAHA ESA</div>
                  <div class="mt-2.5">Kepala Madrasah Ibtida'iyah Nahdlatul Wathan Penyenggir</div>
                </div>

                <div class="flex items-start mb-1.5 text-justify">
                  <div class="w-24 shrink-0 font-normal">Menimbang</div>
                  <div class="w-4 shrink-0">:</div>
                  <div class="flex-1 space-y-1">
                    <div class="flex items-start gap-1">
                      <span class="w-5 shrink-0">a.</span>
                      <span class="flex-1">bahwa untuk memastikan seluruh proses penyelenggaraan pendidikan telah sesuai
                        dengan
                        standar mutu dan aturan yang telah ditetapkan;</span>
                    </div>
                    <div class="flex items-start gap-1">
                      <span class="w-5 shrink-0">b.</span>
                      <span class="flex-1">bahwa untuk dapat melakukan penjaminan mutu pendidikan dengan baik diperlukan
                        adanya
                        Sistem Penjaminan Mutu di Madrasah Ibtida'iyah Nahdlatul Wathan Penyenggir;</span>
                    </div>
                    <div class="flex items-start gap-1">
                      <span class="w-5 shrink-0">c.</span>
                      <span class="flex-1">bahwa untuk maksud pada poin (b) tersebut di atas, perlu ditetapkan Tim
                        Penjamin Mutu
                        Madrasah (TPM) Madrasah Ibtida'iyah Nahdlatul Wathan Penyenggir Tahun Anggaran {{
                        tahunAnggaranVal
                        }};</span>
                    </div>
                    <div class="flex items-start gap-1">
                      <span class="w-5 shrink-0">d.</span>
                      <span class="flex-1">bahwa berdasarkan pertimbangan sebagaimana dimaksud pada poin (b) dan poin
                        (c) di atas
                        perlu ditetapkan dengan Surat Keputusan Kepala Madrasah;</span>
                    </div>
                  </div>
                </div>

                <div class="flex items-start mt-2 text-justify">
                  <div class="w-24 shrink-0 font-normal">Mengingat</div>
                  <div class="w-4 shrink-0">:</div>
                  <div class="flex-1 space-y-1">
                    <div class="flex items-start gap-1"><span class="w-5 shrink-0">1.</span><span class="flex-1">Undang
                        – Undang
                        Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;</span></div>
                    <div class="flex items-start gap-1"><span class="w-5 shrink-0">2.</span><span
                        class="flex-1">Peraturan
                        Pemerintah Nomor 19 Tahun 2005 tentang Standar Nasional Pendidikan sebagaimana telah diubah
                        dengan
                        Peraturan Pemerintah Nomor 32 Tahun 2015 dan Nomor 13 Tahun 2015 tentang Perubahan kedua
                        Peraturan
                        Pemerintah Nomor 19 Tahun 2005 Tentang Standar Nasional Pendidikan;</span></div>
                    <div class="flex items-start gap-1"><span class="w-5 shrink-0">3.</span><span
                        class="flex-1">Peraturan
                        Pemerintah Nomor 17 Tahun 2010 tentang Pengelolaan dan Penyelenggaraan Pendidikan sebagaimana
                        telah diubah
                        dengan Peraturan Pemerintah Nomor 66 Tahun 2010 tentang Pengelolaan dan Penyelenggaraan
                        Pendidikan;</span>
                    </div>
                    <div class="flex items-start gap-1"><span class="w-5 shrink-0">4.</span><span
                        class="flex-1">Permendikbud
                        Nomor 22 Tahun 2016 tentang Standar Proses Pendidikan Dasar dan Menengah;</span></div>
                    <div class="flex items-start gap-1"><span class="w-5 shrink-0">5.</span><span
                        class="flex-1">Permendikbud
                        Nomor 23 Tahun 2016 tentang Standar Penilaian Pendidikan;</span></div>
                    <div class="flex items-start gap-1"><span class="w-5 shrink-0">6.</span><span
                        class="flex-1">Permendikbud
                        Nomor 28 Tahun 2016 tentang Sistem Penjaminan Mutu Pendidikan Dasar dan Menengah;</span></div>
                  </div>
                </div>
              </div>

              <!-- PAGE 2 -->
              <div class="sk-page w-[210mm] min-h-[297mm] p-[15mm_20mm] bg-white text-black relative box-border">
                <div class="flex items-start text-justify mb-4">
                  <div class="w-24 shrink-0"></div>
                  <div class="w-4 shrink-0"></div>
                  <div class="flex-1 space-y-1">
                    <div class="flex items-start gap-1"><span class="w-5 shrink-0">7.</span><span
                        class="flex-1">Peraturan Menteri
                        Agama No 90 Tahun 2013 Tentang penyelenggaraan Pendidikan madrasah sebagaimana telah diubah
                        dengan PMA No.
                        60 Tahun 2015;</span></div>
                    <div class="flex items-start gap-1"><span class="w-5 shrink-0">8.</span><span
                        class="flex-1">Peraturan Menteri
                        Agama No 58 Tahun 2017 pasal 5 bahwa kepala madrasah bertanggung jawab Menyusun RKJM dan
                        RKTM;</span>
                    </div>
                  </div>
                </div>

                <div class="text-center uppercase my-4 tracking-wider">MEMUTUSKAN</div>

                <div class="space-y-2.5">
                  <div class="flex items-start text-justify">
                    <div class="w-24 shrink-0">Menetapkan</div>
                    <div class="w-4 shrink-0">:</div>
                    <div class="flex-1 uppercase">KEPUTUSAN KEPALA MADRASAH IBTIDA'IYAH NAHDLATUL WATHAN
                      PENYENGGIR
                      TENTANG TIM PENJAMIN MUTU MADRASAH (TPM) MADRASAH IBTIDA'IYAH NAHDLATUL WATHAN PENYENGGIR TAHUN
                      ANGGARAN {{
                      tahunAnggaranVal }}</div>
                  </div>
                  <div class="flex items-start text-justify">
                    <div class="w-24 shrink-0">PERTAMA</div>
                    <div class="w-4 shrink-0">:</div>
                    <div class="flex-1">Membentuk Tim Penjamin Mutu Madrasah (TPM)</div>
                  </div>
                  <div class="flex items-start text-justify">
                    <div class="w-24 shrink-0">KEDUA</div>
                    <div class="w-4 shrink-0">:</div>
                    <div class="flex-1">Nama – nama yang tercantum dalam lampiran surat keputusan ini sebagai Tim
                      Penjamin Mutu
                      Madrasah (TPM) Madrasah Ibtida'iyah Nahdlatul Wathan Penyenggir;</div>
                  </div>
                  <div class="flex items-start text-justify">
                    <div class="w-24 shrink-0">KETIGA</div>
                    <div class="w-4 shrink-0">:</div>
                    <div class="flex-1">Tim Evaluasi Diri Madrasah dimaksud melaksanakan tugas – tugas sebagaimana
                      tertuang pada
                      lampiran surat keputusan ini;</div>
                  </div>
                  <div class="flex items-start text-justify">
                    <div class="w-24 shrink-0">KEEMPAT</div>
                    <div class="w-4 shrink-0">:</div>
                    <div class="flex-1">Dalam melaksanakan tugasnya, Tim Penjamin Mutu Madrasah dimaksud bertanggung
                      jawab kepada
                      Kepala Madrasah Ibtida'iyah Nahdlatul Wathan Penyenggir;</div>
                  </div>
                  <div class="flex items-start text-justify">
                    <div class="w-24 shrink-0">KELIMA</div>
                    <div class="w-4 shrink-0">:</div>
                    <div class="flex-1">Segala biaya yang timbul akibat Pelaksanaan Keputusan ini dibebankan pada
                      Rencana Kegiatan
                      Anggaran Madrasah (RKAM) Tahun {{ tahunAnggaranVal }};</div>
                  </div>
                  <div class="flex items-start text-justify">
                    <div class="w-24 shrink-0">KEENAM</div>
                    <div class="w-4 shrink-0">:</div>
                    <div class="flex-1">Keputusan ini mulai berlaku sejak tanggal ditetapkan dengan ketentuan apabila
                      dikemudian
                      hari ternyata terdapat kekeliruan di dalam penetapannya akan diadakan perubahan dan perbaikan
                      sebagaimana
                      mestinya;</div>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4 items-start mt-8">
                  <!-- Grid Tembusan (Rata Kiri, List Rapih) -->
                  <div class="text-left">
                    <div class="mb-1 font-normal">Tembusan:</div>
                    <ol class="space-y-0.5 pl-1">
                      <li class="flex items-start gap-1.5"><span class="shrink-0">1.</span><span>Kepala Kantor Kementerian Agama Kab/Kota Lombok Timur;</span></li>
                      <li class="flex items-start gap-1.5"><span class="shrink-0">2.</span><span>Ketua Yayasan Nurul Falah Penyenggir;</span></li>
                      <li class="flex items-start gap-1.5"><span class="shrink-0">3.</span><span>Pengawas Pembina;</span></li>
                      <li class="flex items-start gap-1.5"><span class="shrink-0">4.</span><span>Yang bersangkutan untuk diketahui dan dilaksanakan sebagaimana mestinya;</span></li>
                      <li class="flex items-start gap-1.5"><span class="shrink-0">5.</span><span>Arsip.</span></li>
                    </ol>
                  </div>
                  <!-- Grid TTD Kamad (Rata Tengah) -->
                  <div class="text-center">
                    <div>Ditetapkan di Penyenggir</div>
                    <div>pada tanggal {{ tanggalSk }}</div>
                    <div class="mt-2">Kepala Madrasah,</div>
                    <div class="my-2 flex justify-center">
                      <QrcodeVue :value="qrCodeText" :size="105" render-as="svg" />
                    </div>
                    <div class="font-bold">{{ namaKepala }}</div>
                  </div>
                </div>
              </div>

              <!-- PAGE 3 -->
              <div class="sk-page w-[210mm] min-h-[297mm] p-[15mm_20mm] bg-white text-black relative box-border">
                <div class="mb-4 leading-relaxed">
                  <div class="flex"><span class="w-24 shrink-0">Lampiran I</span><span
                      class="w-3 shrink-0">:</span><span>Keputusan Kepala Madrasah Ibtida'iyah Nahdlatul Wathan
                      Penyenggir</span>
                  </div>
                  <div class="flex"><span class="w-24 shrink-0">Nomor</span><span class="w-3 shrink-0">:</span><span>{{
                      nomorSk
                      }}</span></div>
                  <div class="flex"><span class="w-24 shrink-0">Tanggal</span><span
                      class="w-3 shrink-0">:</span><span>{{
                      tanggalSk }}</span></div>
                  <div class="flex"><span class="w-24 shrink-0">Tentang</span><span
                      class="w-3 shrink-0">:</span><span>Pembentukan
                      Tim Penjamin Mutu Madrasah (TPM).</span></div>
                </div>
                <div class="text-center uppercase mb-6 leading-tight">
                  <div>TIM PENJAMIN MUTU MADRASAH (TPM)</div>
                  <div>TAHUN ANGGARAN {{ tahunAnggaranVal }}</div>
                </div>
                <div class="my-6">
                  <table class="w-full border-collapse border border-black text-sm">
                    <thead>
                      <tr class="bg-gray-100 text-center border-b border-black">
                        <th class="border border-black px-3 py-2 w-12 text-center">No</th>
                        <th class="border border-black px-3 py-2 text-center">Nama</th>
                        <th class="border border-black px-3 py-2 text-center">Bagian</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-if="tpmTableData.length === 0">
                        <td colspan="3" class="border border-black px-3 py-4 text-center text-gray-500 italic">
                          Belum ada anggota tim yang ditambahkan
                        </td>
                      </tr>
                      <tr v-else v-for="item in tpmTableData" :key="item.no">
                        <td class="border border-black px-3 py-2 text-center">{{ item.no }}</td>
                        <td class="border border-black px-3 py-2 capitalize">{{ item.nama ? item.nama.toLowerCase() : '' }}</td>
                        <td class="border border-black px-3 py-2">{{ item.bagian }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div class="flex justify-end mt-12">
                  <div class="text-center min-w-[220px]">
                    <div>Kepala Madrasah,</div>
                    <div class="my-2 flex justify-center">
                      <QrcodeVue :value="qrCodeText" :size="105" render-as="svg" />
                    </div>
                    <div class="font-bold">{{ namaKepala }}</div>
                  </div>
                </div>
              </div>

              <!-- PAGE 4 -->
              <div class="sk-page w-[210mm] min-h-[297mm] p-[15mm_20mm] bg-white text-black relative box-border">
                <div class="mb-4 leading-relaxed">
                  <div class="flex"><span class="w-24 shrink-0">Lampiran II</span><span
                      class="w-3 shrink-0">:</span><span>Keputusan Kepala Madrasah Ibtida'iyah Nahdlatul Wathan
                      Penyenggir</span>
                  </div>
                  <div class="flex"><span class="w-24 shrink-0">Nomor</span><span class="w-3 shrink-0">:</span><span>{{
                      nomorSk
                      }}</span></div>
                  <div class="flex"><span class="w-24 shrink-0">Tanggal</span><span
                      class="w-3 shrink-0">:</span><span>{{
                      tanggalSk }}</span></div>
                  <div class="flex"><span class="w-24 shrink-0">Tentang</span><span
                      class="w-3 shrink-0">:</span><span>Pembentukan
                      Tim Penjamin Mutu Madrasah (TPM).</span></div>
                </div>
                <div class="text-center uppercase mb-6 leading-tight">
                  <div>Uraian tugas Tim Penjamin Mutu Madrasah (TPM)</div>
                  <div>Madrasah Ibtida'iyah Nahdlatul Wathan Penyenggir</div>
                </div>
                <div class="space-y-2.5 text-justify">
                  <div class="flex items-start gap-1"><span class="w-5 shrink-0">1.</span><span class="flex-1">TPM
                      Melakukan
                      analisis terhadaap indikator pada setiap aspek budaya mutu madrasah</span></div>
                  <div class="flex items-start gap-1"><span class="w-5 shrink-0">2.</span><span class="flex-1">TPM
                      mengumpulkan
                      data, informasi dan bukti fisik dari berbagai sumber yang relevan untuk dasar penilaian indikator
                      yang ada
                      dalam Instrumen</span></div>
                  <div class="flex items-start gap-1"><span class="w-5 shrink-0">3.</span><span class="flex-1">TPM
                      mendiskusikan
                      dan menetapkan level setiap indikator berdasarkan data, informasi dan bukti fisik</span></div>
                  <div class="flex items-start gap-1"><span class="w-5 shrink-0">4.</span><span class="flex-1">TPM dan
                      TIM dibantu
                      oleh operator madrasah mengisi instrumen yang tersedia secara online atau semi online berdasarkan
                      data,
                      informasi dan bukti fisik yang dikumpulkan;</span></div>
                  <div class="flex items-start gap-1"><span class="w-5 shrink-0">5.</span><span class="flex-1">TPM
                      mengirim hasil
                      pengisian EDM yang sudah disetujui oleh Kepala Madrasah;</span></div>
                  <div class="flex items-start gap-1"><span class="w-5 shrink-0">6.</span><span class="flex-1">TPM
                      melakukan rapat
                      penentuan rencana kegiatan sesuai dengan hasil isian pada EDM;</span></div>
                  <div class="flex items-start gap-1"><span class="w-5 shrink-0">7.</span><span class="flex-1">TPM
                      melakukan
                      distribusi penugasan penanggung jawab indikator dan penanggung jawab kegiatan;</span></div>
                  <div class="flex items-start gap-1"><span class="w-5 shrink-0">8.</span><span class="flex-1">TPM
                      melakukan
                      distribusi rencana pendanaan pengembangan dan operasional;</span></div>
                  <div class="flex items-start gap-1"><span class="w-5 shrink-0">9.</span><span class="flex-1">TPM
                      Menyusun RKAM
                      berdasarkan skala prioritas indikator yang belum memenuhi acuan yang ditetapkan;</span></div>
                </div>
                <div class="flex justify-end mt-16">
                  <div class="text-center min-w-[220px]">
                    <div>Kepala Madrasah,</div>
                    <div class="my-2 flex justify-center">
                      <QrcodeVue :value="qrCodeText" :size="105" render-as="svg" />
                    </div>
                    <div class="font-bold">{{ namaKepala }}</div>
                  </div>
                </div>
              </div>
            </div>
          </PrintButton>
        </template>
      </UiPageHeader>

      <!-- Loading -->
      <div v-if="isLoading" class="flex items-center justify-center py-20">
        <div class="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <template v-else>
        <!-- Empty State: No Tahun -->
        <div v-if="listTahun.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
          <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
            <CalendarDays class="w-7 h-7 text-emerald-500" />
          </div>
          <p class="font-semibold text-base mb-1" style="color: var(--text-heading)">Belum Ada Tahun Anggaran</p>
          <p class="text-sm mb-5" style="color: var(--text-muted)">
            Buat tahun anggaran EDM terlebih dahulu untuk memulai evaluasi diri madrasah.
          </p>
          <UiBaseButton text="Buat Tahun Anggaran" @click="showTahunSettingModal = true; showAddTahunForm = true;">
            <template #icon>
              <Plus class="w-4 h-4" />
            </template>
          </UiBaseButton>
        </div>

        <template v-if="selectedTahunId">
          <!-- Card Pengaturan Metadata SK -->
          <div class="mb-6 rounded-xl p-4 sm:p-5 theme-bg-card border theme-border">
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-sm font-semibold flex items-center gap-2 theme-text-heading">
                <FileText class="w-4 h-4 text-emerald-500" />
                Pengaturan Dokumen SK
              </h2>
              <span
                class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                {{ selectedTahunLabel }}
              </span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label class="block font-medium mb-1 theme-text-muted">Nomor SK</label>
                <input v-model="nomorSk"
                  class="w-full rounded-lg px-3 py-2 text-sm border theme-bg-secondary theme-text theme-border focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              </div>
              <div>
                <label class="block font-medium mb-1 theme-text-muted">Tanggal SK</label>
                <input v-model="tanggalSk"
                  class="w-full rounded-lg px-3 py-2 text-sm border theme-bg-secondary theme-text theme-border focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              </div>
              <div>
                <label class="block font-medium mb-1 theme-text-muted">Nama Kepala Madrasah</label>
                <input v-model="namaKepala"
                  class="w-full rounded-lg px-3 py-2 text-sm border theme-bg-secondary theme-text theme-border focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              </div>
            </div>
          </div>

          <!-- Section Title & Action Button Pembagian Bagian / Tim EDM -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 class="text-sm font-semibold flex items-center gap-2 theme-text-heading">
                <Users class="w-4 h-4 text-emerald-500" />
                Pembagian Tim EDM
              </h2>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <!-- Status perubahan / tersimpan -->
              <span v-if="isDirty"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20 animate-pulse">
                <AlertCircle class="w-3.5 h-3.5" />
                Belum Disimpan
              </span>
              <span v-else
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <CheckCircle2 class="w-3.5 h-3.5" />
                Tersimpan
              </span>

              <!-- Tombol Simpan Pembagian Tim -->
              <UiBaseButton :text="isSaving ? 'Menyimpan...' : 'Simpan Pembagian'"
                title="Simpan pembagian guru ke dalam bagian EDM" :loading="isSaving" :disabled="isSaving || !isDirty"
                @click="handleSave">
                <template #icon>
                  <Save class="w-4 h-4" />
                </template>
              </UiBaseButton>
            </div>
          </div>

          <!-- 5 Bagian Grid — 1 col mobile, 2 col md, 3 col lg -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="b in localBagian" :key="b.nama_bagian"
              class="rounded-xl p-4 sm:p-5 flex flex-col justify-between theme-bg-card border theme-border shadow-sm hover:shadow transition-all">

              <div>
                <!-- Header Bagian -->
                <div class="flex items-center justify-between gap-2 mb-2.5">
                  <span
                    class="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-sm shrink-0"
                    :class="bagianColor(b.nama_bagian)">
                    Bagian {{ b.nama_bagian }}
                  </span>
                  <span
                    class="text-xs font-medium px-2.5 py-1 rounded-full theme-bg-secondary theme-text-muted border theme-border">
                    {{ b.gtk_ids.length }} guru
                  </span>
                </div>

                <!-- Judul Bagian -->
                <h3 class="text-xs font-semibold mb-3 leading-relaxed theme-text-heading">
                  {{ getBagianTitle(b.nama_bagian) }}
                </h3>

                <!-- Daftar Anggota -->
                <div class="space-y-1.5 min-h-[50px] mb-3">
                  <div v-if="b.gtk_ids.length === 0"
                    class="flex flex-col items-center justify-center py-5 text-center rounded-lg border border-dashed theme-border theme-text-muted">
                    <Users class="w-5 h-5 mb-1 opacity-40" />
                    <p class="text-xs">Belum ada anggota tim</p>
                  </div>

                  <div v-else v-for="gtkId in b.gtk_ids" :key="gtkId"
                    class="flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors theme-bg-secondary border theme-border group">
                    <span class="font-medium truncate theme-text pr-2">{{ getGuruName(gtkId) }}</span>
                    <button @click="removeFromBagian(b, gtkId)" type="button"
                      class="text-zinc-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-500/10 shrink-0"
                      title="Hapus dari bagian">
                      <X class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Select Add Guru -->
              <div class="pt-3 border-t theme-border">
                <label class="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 theme-text-muted">
                  Tambah Anggota (Belum Memiliki Bagian)
                </label>
                <SearchableSelect v-model="selectedGuruMap[b.nama_bagian]" :options="getAvailableGuruOptions(b)"
                  option-label="label" option-value="value" placeholder="Pilih guru..."
                  search-placeholder="Cari nama guru..." @change="(opt) => addGuruToBagian(b, opt)" class="w-full" />
              </div>

            </div>
          </div>
        </template>
      </template>

      <!-- Modal: Setting Tahun Anggaran -->
      <Teleport to="body">
        <div v-if="showTahunSettingModal" class="fixed inset-0 z-[999] flex items-center justify-center p-4"
          style="background: var(--shadow-overlay)">
          <div class="relative w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-5"
            style="background: var(--bg-card); border: 1px solid var(--border-primary)">

            <!-- Header Modal -->
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold flex items-center gap-2" style="color: var(--text-heading)">
                <CalendarDays class="w-5 h-5 text-emerald-500" />
                Pengaturan Tahun Anggaran
              </h3>
              <button @click="showTahunSettingModal = false"
                class="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <X class="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <!-- Pilih Tahun Anggaran Aktif -->
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider mb-2" style="color: var(--text-muted)">
                Pilih Tahun Anggaran
              </label>
              <SearchableSelect v-model="selectedTahunId" :options="tahunOptions" option-label="label"
                option-value="value" placeholder="Pilih Tahun Anggaran..." search-placeholder="Cari tahun..."
                @change="onTahunChange" class="w-full" />
            </div>

            <!-- Toggle / Form Tambah Tahun Anggaran -->
            <div class="pt-3 border-t" style="border-color: var(--border-primary)">
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-semibold uppercase tracking-wider" style="color: var(--text-muted)">
                  Tambah Tahun Anggaran Baru
                </span>
                <button type="button" @click="showAddTahunForm = !showAddTahunForm"
                  class="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                  <Plus class="w-3.5 h-3.5" />
                  {{ showAddTahunForm ? 'Tutup Form' : 'Tahun Anggaran Baru' }}
                </button>
              </div>

              <!-- Form Tambah Baru -->
              <div v-if="showAddTahunForm" class="p-4 rounded-xl space-y-3"
                style="background: var(--bg-secondary); border: 1px solid var(--border-primary)">
                <div>
                  <label class="block text-xs font-medium mb-1" style="color: var(--text-secondary)">Tahun</label>
                  <input v-model.number="formTahun.tahun" type="number" min="2020" max="2050"
                    class="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
                    style="background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-input)"
                    placeholder="2026">
                </div>

                <div class="flex items-center gap-3">
                  <button @click="formTahun.is_active = formTahun.is_active === 1 ? 0 : 1" type="button"
                    class="relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none"
                    :class="formTahun.is_active === 1 ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'">
                    <span
                      class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200"
                      :class="formTahun.is_active === 1 ? 'translate-x-5' : ''"></span>
                  </button>
                  <span class="text-xs font-medium" style="color: var(--text-secondary)">Tahun Anggaran Aktif</span>
                </div>

                <div class="flex justify-end pt-1">
                  <button @click="handleSaveTahun" :disabled="isSaving"
                    class="px-4 py-2 rounded-lg text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center gap-1.5">
                    <Save class="w-3.5 h-3.5" />
                    {{ isSaving ? 'Menyimpan...' : 'Simpan Tahun' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Footer Modal -->
            <div class="flex justify-end pt-3 border-t" style="border-color: var(--border-primary)">
              <UiBaseButton text="Tutup" @click="showTahunSettingModal = false" />
            </div>

          </div>
        </div>
      </Teleport>

      <!-- Modal: Setting Juknis EDM -->
      <Teleport to="body">
        <div v-if="showJuknisModal" class="fixed inset-0 z-[999] flex items-center justify-center p-4"
          style="background: var(--shadow-overlay)">
          <div class="relative w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-4"
            style="background: var(--bg-card); border: 1px solid var(--border-primary)">

            <!-- Header Modal -->
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-base font-semibold flex items-center gap-2" style="color: var(--text-heading)">
                  <FileText class="w-5 h-5 text-emerald-500" />
                  Petunjuk Teknis (Juknis) EDM
                </h3>
                <p class="text-xs mt-0.5" style="color: var(--text-muted)">
                  Panduan & petunjuk teknis pengisian evaluasi diri madrasah {{ selectedTahunLabel }}
                </p>
              </div>
              <button @click="showJuknisModal = false"
                class="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <X class="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <!-- Content Textarea -->
            <div>
              <textarea v-model="juknisText" rows="9"
                class="w-full rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all resize-y"
                style="background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-input)"
                placeholder="Tulis petunjuk teknis pengisian EDM di sini..."></textarea>
            </div>

            <!-- Footer Modal -->
            <div class="flex justify-end gap-2 pt-3 border-t" style="border-color: var(--border-primary)">
              <UiBaseButton text="Batal" @click="showJuknisModal = false" />
              <UiBaseButton :text="isSavingJuknis ? 'Menyimpan...' : 'Simpan Juknis'" :loading="isSavingJuknis"
                :disabled="isSavingJuknis" @click="handleSaveJuknisModal">
                <template #icon>
                  <Save class="w-4 h-4" />
                </template>
              </UiBaseButton>
            </div>

          </div>
        </div>
      </Teleport>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import type { NavigationGuardNext } from "vue-router";
import QrcodeVue from "qrcode.vue";
import { useEdm, EDM_BAGIAN_LIST } from "~/composables/edm/useEdm";
import type { TahunAnggaran } from "~/composables/edm/useEdm";
import { fetchFromApi } from "~/utils/api";
import SearchableSelect from "~/components/ui/SearchableSelect.vue";
import { Save, X, FileText, Plus, CalendarDays, Users, AlertCircle, CheckCircle2 } from "lucide-vue-next";
import KopSurat from "~/components/document/KopSurat.vue";
import PrintButton from "~/components/ui/PrintButton.vue";

interface LocalBagian {
  nama_bagian: string;
  gtk_ids: number[];
}

interface GuruData {
  id: number;
  nama_lengkap: string;
  [key: string]: any;
}

interface SelectOption {
  [key: string]: unknown;
  label?: string;
  value?: string | number;
}

interface TpmRow {
  no: number;
  nama: string;
  bagian: string;
}

const {
  isLoading, isSaving, selectedTahunId, listTahun, selectedTahunLabel,
  fetchTahunAnggaran, refetchTahunAnggaran, saveTahunAnggaran,
  setSelectedTahunId, fetchBagian, saveBagian,
} = useEdm();

// --- Modals State ---
const showTahunSettingModal = ref<boolean>(false);
const showAddTahunForm = ref<boolean>(false);
const showJuknisModal = ref<boolean>(false);

// --- Unsaved Changes Tracking ---
const initialStateJson = ref<string>("");

const snapshotState = (): void => {
  initialStateJson.value = JSON.stringify(
    localBagian.value.map((b) => ({
      nama_bagian: b.nama_bagian,
      gtk_ids: [...b.gtk_ids].sort((a, b) => a - b),
    }))
  );
};

const isDirty = computed<boolean>(() => {
  if (!initialStateJson.value || localBagian.value.length === 0) return false;
  const currentJson = JSON.stringify(
    localBagian.value.map((b) => ({
      nama_bagian: b.nama_bagian,
      gtk_ids: [...b.gtk_ids].sort((a, b) => a - b),
    }))
  );
  return currentJson !== initialStateJson.value;
});

// Guard when leaving route via Nuxt Router
onBeforeRouteLeave((_to, _from, next: NavigationGuardNext) => {
  if (isDirty.value) {
    const confirmLeave = window.confirm(
      "Ada perubahan pembagian tim EDM yang belum disimpan. Apakah Anda yakin ingin meninggalkan halaman ini?"
    );
    if (confirmLeave) {
      next();
    } else {
      next(false);
    }
  } else {
    next();
  }
});

// Guard when closing tab or reloading browser
const handleBeforeUnload = (e: BeforeUnloadEvent): string | void => {
  if (isDirty.value) {
    e.preventDefault();
    e.returnValue = "Ada perubahan pembagian tim yang belum disimpan.";
    return e.returnValue;
  }
};

// --- Tahun Anggaran ---
const currentTahun = computed<TahunAnggaran | null>(() => {
  return listTahun.value.find((t) => t.id === selectedTahunId.value) || null;
});

const tahunOptions = computed<SelectOption[]>(() => {
  return listTahun.value.map((t) => ({
    label: `Tahun Anggaran ${t.tahun}${t.is_active === 1 ? ' (Aktif)' : ''}`,
    value: t.id,
  }));
});

const editingTahun = ref<TahunAnggaran | null>(null);
const formTahun = ref<{ tahun: number; is_active: number; id?: number }>({ tahun: new Date().getFullYear(), is_active: 1 });

const handleSaveTahun = async (): Promise<void> => {
  const payload: { tahun: number; is_active: number; id?: number } = { ...formTahun.value };
  if (editingTahun.value) {
    payload.id = editingTahun.value.id;
  }
  const ok = await saveTahunAnggaran(payload);
  if (ok) {
    showAddTahunForm.value = false;
    editingTahun.value = null;
    formTahun.value = { tahun: new Date().getFullYear(), is_active: 1 };
    await refetchTahunAnggaran();
    await loadData();
  }
};

const onTahunChange = (): void => {
  if (isDirty.value) {
    const confirmChange = window.confirm(
      "Ada perubahan pembagian tim pada tahun ini yang belum disimpan. Ganti tahun anggaran?"
    );
    if (!confirmChange) {
      return;
    }
  }
  setSelectedTahunId(selectedTahunId.value);
  loadData();
};

// --- Juknis ---
const juknisText = ref<string>("");
const isSavingJuknis = ref<boolean>(false);

const saveJuknis = async (): Promise<void> => {
  if (!currentTahun.value) return;
  isSavingJuknis.value = true;
  await saveTahunAnggaran({
    id: currentTahun.value.id,
    tahun: currentTahun.value.tahun,
    is_active: currentTahun.value.is_active,
    juknis: juknisText.value,
  });
  isSavingJuknis.value = false;
};

const handleSaveJuknisModal = async (): Promise<void> => {
  await saveJuknis();
  showJuknisModal.value = false;
};

watch(
  () => currentTahun.value,
  (t: TahunAnggaran | null) => {
    if (t) juknisText.value = t.juknis || "";
  },
);

// --- Bagian / Tim ---
const allGuru = ref<GuruData[]>([]);
const localBagian = ref<LocalBagian[]>([]);
const selectedGuruMap = ref<Record<string, number | null>>({
  A: null,
  B: null,
  C: null,
  D: null,
  E: null,
});

// SK Metadata Editable State
const nomorSk = ref<string>("001/MI-B/087/I/2026");
const tanggalSk = ref<string>("1 Januari 2026");
const namaKepala = ref<string>("ABDUL HALIM, S.Pd.I");

const qrCodeText = computed<string>(() => {
  return [
    `No: ${nomorSk.value}`,
    `Tentang: Pembentukan Tim Penjamin Mutu MI NW Penyenggir`,
    `Tanggal: ${tanggalSk.value}`,
    `KAMAD: ${namaKepala.value}`,
  ].join("\n");
});

const BAGIAN_NAMES: string[] = ["A", "B", "C", "D", "E"];

const BAGIAN_TITLE_MAP: Record<string, string> = {
  A: "Kedisiplinan",
  B: "Pengembangan Diri",
  C: "Proses Pembelajaran",
  D: "Sarana dan Prasarana",
  E: "Pembiayaan",
};

const bagianColor = (name: string): string => {
  const colors: Record<string, string> = { A: "bg-blue-600", B: "bg-emerald-600", C: "bg-amber-600", D: "bg-violet-600", E: "bg-rose-600" };
  return colors[name] || "bg-zinc-600";
};

const getBagianTitle = (code: string): string => {
  const meta = EDM_BAGIAN_LIST.find((m) => m.code === code);
  if (meta) return meta.title || meta.name.replace(/^Bagian\s+[A-E]:\s*/i, "");
  return BAGIAN_TITLE_MAP[code] || `Bagian ${code}`;
};

const tahunAnggaranVal = computed<number>(() => {
  const t = listTahun.value.find((t) => t.id === selectedTahunId.value);
  return t ? t.tahun : new Date().getFullYear();
});

watch(
  tahunAnggaranVal,
  (val: number) => {
    if (val) {
      nomorSk.value = `001/MI-B/087/I/${val}`;
      tanggalSk.value = `1 Januari ${val}`;
    }
  },
  { immediate: true }
);

const getGuruName = (gtkId: number): string => {
  const guru = allGuru.value.find((g) => g.id === gtkId);
  return guru?.nama_lengkap || `ID: ${gtkId}`;
};

// Set GTK IDs yang sudah masuk ke bagian apapun
const assignedGtkIds = computed<Set<number>>(() => {
  const ids = new Set<number>();
  localBagian.value.forEach((b) => b.gtk_ids.forEach((id) => ids.add(id)));
  return ids;
});

// Dropdown hanya memunculkan GTK yang belum memiliki bagian
const getAvailableGuruOptions = (_b: LocalBagian): SelectOption[] => {
  return allGuru.value
    .filter((g) => !assignedGtkIds.value.has(g.id))
    .map((g) => ({
      label: g.nama_lengkap,
      value: g.id,
    }));
};

const addGuruToBagian = (b: LocalBagian, opt: any): void => {
  if (!opt) return;
  const rawId = typeof opt === "object" ? opt.value : opt;
  if (!rawId) return;
  const gtkId = typeof rawId === "number" ? rawId : parseInt(String(rawId), 10);
  if (!gtkId || isNaN(gtkId)) return;

  // Add to target bagian
  if (!b.gtk_ids.includes(gtkId)) {
    b.gtk_ids.push(gtkId);
  }

  // Reset dropdown value
  selectedGuruMap.value[b.nama_bagian] = null;
};

const removeFromBagian = (b: LocalBagian, gtkId: number): void => {
  b.gtk_ids = b.gtk_ids.filter((id) => id !== gtkId);
};

// Bagian Anggota Helper for SK Lampiran I (semua anggota tanpa koordinator)
const getBagianSemuaAnggota = (code: string): string[] => {
  const b = localBagian.value.find((item) => item.nama_bagian === code);
  if (!b || !b.gtk_ids || b.gtk_ids.length === 0) return [];
  return b.gtk_ids.map((id) => getGuruName(id));
};

const tpmTableData = computed<TpmRow[]>(() => {
  const list: TpmRow[] = [];
  let no = 1;
  BAGIAN_NAMES.forEach((code) => {
    const anggotaList = getBagianSemuaAnggota(code);
    const bagianName = BAGIAN_TITLE_MAP[code] || `Bagian ${code}`;
    if (anggotaList.length > 0) {
      anggotaList.forEach((nama) => {
        list.push({
          no: no++,
          nama,
          bagian: bagianName,
        });
      });
    }
  });
  return list;
});

const handleSave = async (): Promise<void> => {
  if (!selectedTahunId.value) return;
  const payload = localBagian.value.map((b) => ({
    nama_bagian: b.nama_bagian,
    gtk_ids: b.gtk_ids,
  }));
  const ok = await saveBagian(selectedTahunId.value, payload);
  if (ok) {
    snapshotState();
  }
};

const loadData = async (): Promise<void> => {
  if (!selectedTahunId.value) return;
  try {
    const gtkData = await fetchFromApi("DataGtk");
    allGuru.value = Array.isArray(gtkData) ? gtkData : [];
  } catch {
    allGuru.value = [];
  }
  const bagianData = await fetchBagian(selectedTahunId.value);
  localBagian.value = BAGIAN_NAMES.map((name) => {
    const existing = bagianData.find((b) => (b.nama_bagian || b.nama_kelompok) === name);
    return {
      nama_bagian: name,
      gtk_ids: existing ? existing.anggota.map((a) => a.gtk_id) : [],
    };
  });

  // Load juknis
  if (currentTahun.value) {
    juknisText.value = currentTahun.value.juknis || "";
  }

  // Snapshot initial state
  snapshotState();
};

onMounted(async () => {
  window.addEventListener("beforeunload", handleBeforeUnload);
  await fetchTahunAnggaran();
  if (selectedTahunId.value) {
    await loadData();
  }
});

onUnmounted(() => {
  window.removeEventListener("beforeunload", handleBeforeUnload);
});
</script>

<style scoped>
@media print {
  @page {
    margin: 15mm 20mm;
  }

  body {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    background: white !important;
  }

  .sk-page {
    width: 100% !important;
    min-height: 265mm !important;
    padding: 0 !important;
    margin: 0 !important;
    box-shadow: none !important;
    border: none !important;
    page-break-after: always !important;
    break-after: page !important;
    font-family: Arial, Helvetica, sans-serif !important;
    font-size: 11pt !important;
    color: #000 !important;
    background: #fff !important;
  }

  .sk-page:last-child {
    page-break-after: avoid !important;
    break-after: avoid !important;
  }
}
</style>
