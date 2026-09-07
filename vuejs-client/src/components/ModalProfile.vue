<template>
  <!-- ── 1. DOCKED PANEL MODE (Persistent Right Sidebar) ────────────────── -->
  <aside
    v-if="isDocked"
    class="profile-docked-panel h-100 d-flex flex-column bg-white position-relative shadow-sm"
  >
    <!-- Docked Header -->
    <div class="docked-header d-flex align-items-center justify-content-between px-3 py-2 bg-white border-bottom flex-shrink-0">
      <div class="d-flex align-items-center gap-2 min-w-0">
        <div class="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center shadow-xs flex-shrink-0" style="width: 34px; height: 34px;">
          <i class="bi bi-person-vcard fs-6" />
        </div>
        <div class="min-w-0">
          <h6 class="mb-0 fw-bold text-dark text-truncate" style="letter-spacing: -0.01em; font-size: 13.5px;">
            {{ person?.first_name }} {{ person?.last_name }}
          </h6>
          <div class="text-muted text-truncate" style="font-size: 11px;">
            {{ formatLifespanSummary }}
          </div>
        </div>
      </div>
      <div class="d-flex align-items-center gap-1 flex-shrink-0">
        <button
          type="button"
          class="btn btn-sm btn-light rounded-circle text-muted p-0 d-flex align-items-center justify-content-center hover-card"
          style="width: 28px; height: 28px;"
          title="Fermer le volet profil"
          @click="$emit('close')"
        >
          <i class="bi bi-x-lg" style="font-size: 11px;" />
        </button>
      </div>
    </div>

    <!-- Docked Scrollable Body -->
    <div class="docked-body flex-grow-1 overflow-y-auto p-3 bg-light-subtle">
      <PersonProfileDetails
        ref="profileDetails"
        :person="person"
        :data-persons="dataPersons"
        :is-docked="true"
        @refresh-profile="$emit('refresh-profile', $event)"
        @open-attachment="openAttachmentModal"
      />
    </div>

    <!-- Attachment Modal Component -->
    <AttachmentViewModal ref="attachmentModal" :attachment-path="currentAttachment" />
  </aside>

  <!-- ── 2. MODAL DIALOG MODE (Overlay Dialog) ────────────────────────── -->
  <div
    v-else
    id="profileModal"
    class="modal fade"
    data-bs-backdrop="static"
    data-bs-keyboard="false"
    tabindex="-1"
    aria-labelledby="profileLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-lg modal-dialog-scrollable modal-fullscreen-sm-down">
      <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
        <!-- Modal Header -->
        <div class="modal-header d-flex align-items-center justify-content-between px-4 py-3 bg-white border-bottom">
          <div class="d-flex align-items-center gap-2">
            <div class="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center shadow-xs" style="width: 38px; height: 38px;">
              <i class="bi bi-person-vcard fs-5" />
            </div>
            <div>
              <h5 id="profileLabel" class="modal-title mb-0 fw-bold text-dark" style="letter-spacing: -0.01em;">
                {{ $t('profile') }}
              </h5>
              <div class="text-muted small" style="font-size: 12px;">
                {{ person?.first_name }} {{ person?.last_name }}
              </div>
            </div>
          </div>
          <button type="button" class="btn-close shadow-none" data-bs-dismiss="modal" aria-label="Close" />
        </div>

        <div class="modal-body p-3 p-sm-4 bg-light-subtle">
          <PersonProfileDetails
            ref="profileDetails"
            :person="person"
            :data-persons="dataPersons"
            :is-docked="false"
            @refresh-profile="$emit('refresh-profile', $event)"
            @open-attachment="openAttachmentModal"
          />
        </div>
      </div>
    </div>

    <!-- Attachment Modal Component -->
    <AttachmentViewModal ref="attachmentModal" :attachment-path="currentAttachment" />
  </div>
</template>

<script>
import { Modal } from 'bootstrap'
import PersonProfileDetails from './PersonProfileDetails.vue'
import AttachmentViewModal from './ModalAttachmentView.vue'

export default {
  name: 'ModalProfile',
  components: {
    PersonProfileDetails,
    AttachmentViewModal
  },
  props: {
    person: {
      type: Object,
      default: () => ({})
    },
    dataPersons: {
      type: Array,
      required: true
    },
    isDocked: {
      type: Boolean,
      default: false
    }
  },
  emits: ['refresh-profile', 'close'],
  data () {
    return {
      currentAttachment: ''
    }
  },
  computed: {
    formatLifespanSummary () {
      if (!this.person) return ''
      const bYear = this.person.birth_date ? new Date(this.person.birth_date).getFullYear() : ''
      const dYear = this.person.death_date
        ? new Date(this.person.death_date).getFullYear()
        : (this.person.death_date === null ? 'présent' : '')
      if (bYear && dYear) return `${bYear} – ${dYear}`
      if (bYear) return `Né(e) en ${bYear}`
      return ''
    }
  },
  methods: {
    show () {
      if (this.isDocked) return
      const modalElement = document.getElementById('profileModal')
      if (modalElement) {
        const modal = Modal.getInstance(modalElement) || new Modal(modalElement)
        modal.show()
      }
    },
    hide () {
      if (this.isDocked) return
      const modalElement = document.getElementById('profileModal')
      if (modalElement) {
        const modal = Modal.getInstance(modalElement)
        if (modal) {
          modal.hide()
        }
      }
    },
    getDataUrl () {
      return import.meta.env.MODE === 'development'
        ? import.meta.env.VITE_DATA_URL
        : '/data'
    },
    getAttachmentPath (filepath) {
      if (!filepath) return ''
      return this.getDataUrl() + filepath
    },
    openAttachmentModal (filepath) {
      this.currentAttachment = this.getAttachmentPath(filepath)
      this.$refs.attachmentModal.show()
    }
  }
}
</script>

<style scoped>
.profile-docked-panel {
  height: 100%;
  width: 100%;
}

.docked-header {
  height: 52px;
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
}

.docked-body {
  background-color: #f8fafc;
}

.hover-card {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.hover-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
}
</style>
