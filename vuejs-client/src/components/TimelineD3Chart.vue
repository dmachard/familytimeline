<template>
  <div class="timeline-app-container w-100 p-0 overflow-hidden">
    <div class="timeline-split-layout d-flex w-100 h-100 overflow-hidden">
      <!-- Left Panel: Timeline Content (toolbar + graph) -->
      <div id="timeline-content" class="timeline-left-section position-relative flex-grow-1 d-flex flex-column overflow-hidden h-100" :class="{ 'with-sidebar': isProfileSidebarOpen }">
        <!-- Error Message -->
        <div v-if="error" class="alert alert-danger mb-0" role="alert">
          <p class="mb-0">
            Error: {{ error }}
          </p>
        </div>

        <!-- Teleport Person Search to Top Navbar (unclipped container) -->
        <Teleport to="#top-navbar-search" :disabled="!isNavbarTargetReady">
          <div class="search-box-wrapper position-relative">
            <div class="search-pill-group d-flex align-items-center">
              <i class="bi bi-search search-icon text-muted ps-3 pe-2" />
              <input
                ref="searchInput"
                v-model="searchQuery"
                type="text"
                class="search-input flex-grow-1"
                :placeholder="$t('search-person-placeholder')"
                autocomplete="off"
                @focus="isSearchOpen = true"
                @input="isSearchOpen = true"
                @keydown.enter.prevent="selectFirstResult"
                @keydown.esc.prevent="isSearchOpen = false"
              >
              <button
                v-if="searchQuery"
                class="search-clear-btn pe-3 text-muted"
                type="button"
                :title="$t('clear') || 'Clear'"
                @click="clearSearch"
              >
                <i class="bi bi-x-circle-fill" />
              </button>
            </div>

            <!-- Autocomplete suggestions dropdown -->
            <ul
              v-if="isSearchOpen && searchQuery && searchQuery.trim().length > 0"
              class="dropdown-menu show shadow-lg mt-1 py-1 search-dropdown border rounded-3"
            >
              <template v-if="filteredPersons.length > 0">
                <li
                  v-for="person in filteredPersons"
                  :key="person.id"
                >
                  <a
                    class="dropdown-item d-flex align-items-center py-2 px-3 search-result-item"
                    href="#"
                    @click.prevent="focusPerson(person)"
                  >
                    <img
                      :src="getPersonAvatar(person)"
                      width="28"
                      height="28"
                      class="rounded-circle me-2 border shadow-xs"
                      alt=""
                    >
                    <div class="lh-sm flex-grow-1">
                      <div class="fw-semibold text-dark">{{ person.first_name }} {{ person.last_name }}</div>
                      <small class="text-muted" style="font-size: 11px;">
                        {{ getYearFromDate(person.birth_date) || '?' }} &mdash; {{ getYearFromDate(person.death_date) || (person.death_date_verified ? '?' : $t('living')) }}
                      </small>
                    </div>
                    <i class="bi bi-arrow-right-short text-muted fs-5 opacity-50" />
                  </a>
                </li>
              </template>
              <li v-else class="px-3 py-2 text-muted small text-center fst-italic">
                {{ $t('no-results') }}
              </li>
            </ul>
          </div>
        </Teleport>

        <!-- Teleport Timeline Controls to Top Navbar -->
        <Teleport to="#top-navbar-timeline-controls" :disabled="!isNavbarTargetReady">
          <div class="d-flex align-items-center gap-2 flex-nowrap">
            <!-- Mode switch: Dynamic Tree vs Full Tree -->
            <div class="segmented-control flex-shrink-0" role="group">
              <button
                type="button"
                class="segmented-btn"
                :class="{ active: viewMode === 'dynamic' }"
                :title="$t('dynamic-tree-title')"
                @click="toggleViewMode('dynamic')"
              >
                <i class="bi bi-diagram-3-fill" />
                <span class="d-none d-sm-inline">{{ $t('dynamic-tree') }}</span>
              </button>
              <button
                type="button"
                class="segmented-btn"
                :class="{ active: viewMode === 'all' }"
                :title="$t('full-tree-title')"
                @click="toggleViewMode('all')"
              >
                <i class="bi bi-people-fill" />
                <span class="d-none d-sm-inline">{{ $t('full-tree') }}</span>
              </button>
            </div>

            <!-- In dynamic mode: Reset Tree button -->
            <button
              v-if="viewMode === 'dynamic'"
              id="btn-reset-dynamic-tree"
              class="btn btn-sm btn-tool-pill d-flex align-items-center gap-1 border rounded-pill flex-shrink-0 bg-white text-muted"
              type="button"
              :title="$t('reset-tree')"
              @click="resetDynamicTree"
            >
              <i class="bi bi-arrow-counterclockwise" />
              <span class="d-none d-xxl-inline">{{ $t('reset-tree') }}</span>
            </button>

            <!-- Historical Context Toggle Button -->
            <button
              class="btn btn-sm btn-tool-pill d-flex align-items-center gap-1 border rounded-pill flex-shrink-0"
              :class="showHistoryContext ? 'btn-tool-active-primary' : 'bg-white text-muted'"
              type="button"
              :title="showHistoryContext ? $t('hide-history') : $t('show-history')"
              @click="toggleHistoryContext"
            >
              <i class="bi bi-hourglass-split" />
              <span class="fw-medium d-none d-xxl-inline">{{ $t('history-context') }}</span>
              <span class="mini-status-badge ms-1" :class="showHistoryContext ? 'status-on' : 'status-off'">
                {{ showHistoryContext ? 'ON' : 'OFF' }}
              </span>
            </button>

            <!-- Zoom & Fit Scale Controls Group -->
            <div class="zoom-pill-group border rounded-pill d-flex align-items-center bg-white shadow-xs flex-shrink-0" role="group">
              <button
                class="btn btn-sm zoom-btn d-flex align-items-center justify-content-center"
                type="button"
                :title="$t('zoom-in')"
                @click="zoomIn"
              >
                <i class="bi bi-zoom-in" />
              </button>
              <div class="zoom-divider" />
              <button
                class="btn btn-sm zoom-btn d-flex align-items-center justify-content-center"
                type="button"
                :title="$t('zoom-out')"
                @click="zoomOut"
              >
                <i class="bi bi-zoom-out" />
              </button>
              <div class="zoom-divider" />
              <button
                class="btn btn-sm zoom-btn d-flex align-items-center gap-1 px-2"
                type="button"
                :title="$t('fit-scale-title')"
                @click="resetToAutoScale"
              >
                <i class="bi bi-arrows-angle-expand" />
                <span class="d-none d-xl-inline">{{ $t('fit-scale') }}</span>
              </button>
              <template v-if="viewMode === 'dynamic' && dynamicRootPerson">
                <div class="zoom-divider" />
                <button
                  id="btn-center-on-root"
                  class="btn btn-sm zoom-btn d-flex align-items-center gap-1 px-2"
                  type="button"
                  :title="$t('center-on-root')"
                  @click="centerOnRootPerson"
                >
                  <i class="bi bi-crosshair" />
                  <span class="d-none d-xxl-inline">{{ $t('center-on-root-short') }}</span>
                </button>
              </template>
            </div>

            <!-- Expand / Collapse All Bars Button -->
            <button
              class="btn btn-sm btn-tool-pill d-flex align-items-center gap-1 border rounded-pill flex-shrink-0"
              :class="unfoldedPersonIds.size === 0 ? 'bg-white text-muted' : 'btn-tool-active-info'"
              type="button"
              :title="unfoldedPersonIds.size === 0 ? $t('expand-all-bars') : $t('collapse-all-bars')"
              @click="toggleAllBars"
            >
              <i :class="unfoldedPersonIds.size === 0 ? 'bi bi-layout-three-columns' : 'bi bi-dash-square'" />
              <span class="fw-medium d-none d-xl-inline">{{ unfoldedPersonIds.size === 0 ? $t('expand-all-bars') : $t('collapse-all-bars') }}</span>
            </button>
          </div>
        </Teleport>

        <!-- Container for the timeline header and graph with scroll, drag-pan, and zoom -->
        <div
          id="timeline-wrapper"
          :class="{ 'is-dragging': moveGraphStarted }"
          @wheel="onWheelZoom"
          @mousedown="onPointerStart($event, 'mouse')"
          @mousemove="onPointerMove($event, 'mouse')"
          @mouseup="onPointerEnd()"
          @mouseleave="onPointerEnd()"
          @touchstart="onPointerStart($event, 'touch')"
          @touchmove="onPointerMove($event, 'touch')"
          @touchend="onPointerEnd()"
          @touchcancel="onPointerEnd()"
        >
          <div id="timeline-header-container">
            <svg id="timeline-header" />
          </div>
          <div id="timeline-graph-container">
            <svg id="timeline-graph" />
          </div>

          <!-- Person Context Menu (Click on avatar or right-click anywhere on person) -->
          <div
            v-if="contextMenuPerson"
            id="personContextMenu"
            class="person-context-menu dropdown-menu show shadow-lg border py-1"
            :style="contextMenuStyle"
            @click.stop
            @mousedown.stop
            @touchstart.stop
          >
            <!-- Header avec Nom et Dates/Lieux de naissance et décès -->
            <div class="px-3 py-2 border-bottom bg-light bg-opacity-50">
              <div class="d-flex align-items-center justify-content-between gap-2">
                <div class="fw-bold text-dark text-truncate" style="font-size: 14px;">
                  {{ contextMenuPerson.first_name }} {{ contextMenuPerson.last_name }}
                </div>
                <button
                  type="button"
                  class="btn-close shadow-none flex-shrink-0"
                  style="font-size: 9px; opacity: 0.65; cursor: pointer;"
                  title="Fermer (Échap)"
                  aria-label="Close"
                  @click.stop="closeContextMenu"
                />
              </div>
              <div class="d-flex flex-column gap-1 mt-1 text-muted" style="font-size: 11px;">
                <div v-if="contextMenuPerson.birth_date || getPersonBirthInfo(contextMenuPerson)" class="d-flex align-items-center gap-1">
                  <i class="bi bi-star-fill text-warning flex-shrink-0" style="font-size: 9px;" />
                  <span class="text-truncate">{{ formatPersonBirth(contextMenuPerson) }}</span>
                </div>
                <div v-if="contextMenuPerson.death_date || getPersonDeathInfo(contextMenuPerson)" class="d-flex align-items-center gap-1">
                  <span class="text-secondary fw-bold flex-shrink-0" style="font-size: 10px; line-height: 1;">✝</span>
                  <span class="text-truncate">{{ formatPersonDeath(contextMenuPerson) }}</span>
                </div>
                <div v-else-if="!contextMenuPerson.death_date_verified" class="d-flex align-items-center gap-1 text-success">
                  <i class="bi bi-heart-pulse-fill flex-shrink-0" style="font-size: 10px;" />
                  <span class="text-truncate">{{ $t('living') }}</span>
                </div>
              </div>
            </div>

            <!-- Voir profil -->
            <button
              class="dropdown-item d-flex align-items-center gap-2 py-2"
              type="button"
              @click="onContextMenuAction('view-profile')"
            >
              <i class="bi bi-person-lines-fill text-primary" />
              <span>{{ $t('view-profile') }}</span>
            </button>

            <!-- Définir comme racine (dynamic mode) -->
            <button
              v-if="viewMode === 'dynamic'"
              class="dropdown-item d-flex align-items-center gap-2 py-2"
              type="button"
              @click="onContextMenuAction('set-as-root')"
            >
              <i class="bi bi-diagram-3 text-secondary" />
              <span>{{ $t('set-as-root') }}</span>
            </button>

            <div v-if="viewMode === 'dynamic'" class="dropdown-divider my-1" />

            <!-- Parents (dynamic mode) -->
            <button
              v-if="viewMode === 'dynamic' && getPersonParents(contextMenuPerson.id).length > 0"
              class="dropdown-item d-flex align-items-center justify-content-between gap-3 py-2"
              type="button"
              @click="onContextMenuAction('toggle-parents')"
            >
              <span class="d-flex align-items-center gap-2">
                <i class="bi bi-arrow-up-circle text-primary" />
                <span>{{ areAscendantsVisible(contextMenuPerson.id) ? $t('hide-parents') : $t('show-parents') }}</span>
              </span>
              <span class="badge rounded-pill bg-light text-dark border">
                {{ getPersonParents(contextMenuPerson.id).length }}
              </span>
            </button>

            <!-- Conjoints (dynamic mode) -->
            <button
              v-if="viewMode === 'dynamic' && filterSpouses(contextMenuPerson.id).length > 0"
              class="dropdown-item d-flex align-items-center justify-content-between gap-3 py-2"
              type="button"
              @click="onContextMenuAction('toggle-spouses')"
            >
              <span class="d-flex align-items-center gap-2">
                <i class="bi bi-heart-fill text-warning" />
                <span>{{ expandedSpouseIds.has(contextMenuPerson.id) ? $t('hide-spouses') : $t('show-spouses') }}</span>
              </span>
              <span class="badge rounded-pill bg-light text-dark border">
                {{ filterSpouses(contextMenuPerson.id).length }}
              </span>
            </button>

            <!-- Enfants (dynamic mode) -->
            <button
              v-if="viewMode === 'dynamic' && getPersonChildren(contextMenuPerson.id).length > 0"
              class="dropdown-item d-flex align-items-center justify-content-between gap-3 py-2"
              type="button"
              @click="onContextMenuAction('toggle-children')"
            >
              <span class="d-flex align-items-center gap-2">
                <i class="bi bi-arrow-down-circle text-success" />
                <span>{{ areDescendantsVisible(contextMenuPerson.id) ? $t('hide-children') : $t('show-children') }}</span>
              </span>
              <span class="badge rounded-pill bg-light text-dark border">
                {{ getPersonChildren(contextMenuPerson.id).length }}
              </span>
            </button>

            <!-- Frères / Sœurs (dynamic mode) -->
            <button
              v-if="viewMode === 'dynamic' && getPersonSiblings(contextMenuPerson.id).length > 0"
              class="dropdown-item d-flex align-items-center justify-content-between gap-3 py-2"
              type="button"
              @click="onContextMenuAction('toggle-siblings')"
            >
              <span class="d-flex align-items-center gap-2">
                <i class="bi bi-people-fill text-info" />
                <span>{{ areSiblingsVisible(contextMenuPerson.id) ? $t('hide-siblings') : $t('show-siblings') }}</span>
              </span>
              <span class="badge rounded-pill bg-light text-dark border">
                {{ getPersonSiblings(contextMenuPerson.id).length }}
              </span>
            </button>

            <!-- Tantes / Oncles (dynamic mode) -->
            <button
              v-if="viewMode === 'dynamic' && getPersonUnclesAunts(contextMenuPerson.id).length > 0"
              class="dropdown-item d-flex align-items-center justify-content-between gap-3 py-2"
              type="button"
              @click="onContextMenuAction('toggle-uncles-aunts')"
            >
              <span class="d-flex align-items-center gap-2">
                <i class="bi bi-person-badge-fill text-purple" />
                <span>{{ areUnclesAuntsVisible(contextMenuPerson.id) ? $t('hide-uncles-aunts') : $t('show-uncles-aunts') }}</span>
              </span>
              <span class="badge rounded-pill bg-light text-dark border">
                {{ getPersonUnclesAunts(contextMenuPerson.id).length }}
              </span>
            </button>

            <!-- Cousins (dynamic mode) -->
            <button
              v-if="viewMode === 'dynamic' && getPersonCousins(contextMenuPerson.id).length > 0"
              class="dropdown-item d-flex align-items-center justify-content-between gap-3 py-2"
              type="button"
              @click="onContextMenuAction('toggle-cousins')"
            >
              <span class="d-flex align-items-center gap-2">
                <i class="bi bi-diagram-2-fill text-teal" />
                <span>{{ areCousinsVisible(contextMenuPerson.id) ? $t('hide-cousins') : $t('show-cousins') }}</span>
              </span>
              <span class="badge rounded-pill bg-light text-dark border">
                {{ getPersonCousins(contextMenuPerson.id).length }}
              </span>
            </button>

            <div class="dropdown-divider my-1" />

            <!-- Replier / Déplier la barre -->
            <button
              class="dropdown-item d-flex align-items-center gap-2 py-2"
              type="button"
              @click="onContextMenuAction('toggle-bar')"
            >
              <i :class="unfoldedPersonIds.has(contextMenuPerson.id) ? 'bi bi-dash-square text-secondary' : 'bi bi-plus-square text-secondary'" />
              <span>{{ unfoldedPersonIds.has(contextMenuPerson.id) ? $t('fold-bar') : $t('unfold-bar') }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Right Panel: Docked Profile Sidebar -->
      <aside
        v-if="isProfileSidebarOpen && selectedPerson"
        class="timeline-profile-sidebar border-start bg-white d-flex flex-column shadow-sm"
      >
        <ModalProfile
          ref="profileModal"
          class="px-0"
          :person="selectedPerson"
          :data-persons="dataPersons"
          :is-docked="true"
          @refresh-profile="refreshPersonProfile"
          @close="closeProfileSidebar"
        />
      </aside>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

import * as d3 from 'd3'
import debounce from 'lodash/debounce'

import config from '@/config'
import fetchDataMixin from '@/mixins/fetchDataMixin'
import { fetchEnrichedPersons } from '@/services/personsService.js'
import { historicalPeriods, loadHistoricalPeriods } from '@/services/historyEvents.js'

import ModalProfile from './ModalProfile.vue'

export default {
  components: {
    ModalProfile
  },
  mixins: [fetchDataMixin],
  props: {
    minYear: {
      type: Number,
      required: false,
      default: 1800
    },
    maxYear: {
      type: Number,
      required: false,
      default: () => new Date().getFullYear()
    },
    startViewYear: {
      type: Number,
      required: false,
      default: 1800
    },
    stopViewYear: {
      type: Number,
      required: false,
      default: () => new Date().getFullYear()
    }
  },
  emits: ['data-loaded'],
  data () {
    return {
      graphMargin: { top: 20, right: 20, left: 20 },
      selectedPerson: null,
      isProfileSidebarOpen: true,
      isNavbarTargetReady: false,
      dataPersons: [],
      rootPersons: [],
      isDataLoaded: false,
      isMounted: false,
      previousWidth: null,
      previousHeight: null,
      barHeight: 60,
      computedMinYear: this.minYear,
      computedMaxYear: this.maxYear,
      localStartViewYear: this.startViewYear,
      localStopViewYear: this.stopViewYear,
      defaultColor: '#f1f5f9', // Slate 100 lumineux et net
      familyColorsMap: new Map(),
      paleColor: (color) => color, // Conserver la pureté et le contraste des couleurs choisies
      colorScale: d3.scaleOrdinal([
        '#dbeafe', // Bleu ciel royal
        '#dcfce7', // Vert sauge émeraude
        '#fef3c7', // Ambre miel
        '#f3e8ff', // Lavande améthyste
        '#ffedd5', // Pêche abricot
        '#ccfbf1', // Turquoise givré
        '#ffe4e6', // Rose poudré chic
        '#e0e7ff', // Indigo doux
        '#fae8ff', // Orchidée
        '#fef9c3', // Jaune soleil pastel
      ]),
      displayedPersons: new Set(),
      initialPointerX: 0,
      initialTranslateX: 0,
      newTranslateX: 0,
      initialDomain: 0,
      xViewScale: null,
      timelineWidth: 0,
      totalHeight: 0,
      moveGraphStarted: false,
      showHistoryContext: true,
      historicalPeriods: [...historicalPeriods],
      renderedPersons: new Map(),
      coupleBridges: new Map(),
      searchQuery: '',
      isSearchOpen: false,
      viewMode: 'dynamic', // 'dynamic' (arbre vivant par défaut) ou 'all' (vue complète)
      dynamicRootPersonId: null,
      expandedAscendantIds: new Set(),
      expandedDescendantIds: new Set(),
      expandedSpouseIds: new Set(),
      expandedSiblingIds: new Set(),
      expandedUncleAuntIds: new Set(),
      expandedCousinIds: new Set(),
      pinnedPersonIds: new Set(),
      unfoldedPersonIds: new Set(),
      animatingExpansion: null,
      contextMenuPerson: null,
      contextMenuStyle: {}
    }
  },
  computed: {
    ...mapGetters(['shouldReloadTimeline']),
    dynamicRootPerson () {
      if (!this.dynamicRootPersonId) return null
      return this.dataPersons.find(p => p.id === this.dynamicRootPersonId) || null
    },
    filteredPersons () {
      if (!this.searchQuery || !this.searchQuery.trim()) return []
      const normalize = (str) =>
        (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
      const queryNorm = normalize(this.searchQuery)
      const queryTokens = queryNorm.split(/\s+/).filter(Boolean)
      if (queryTokens.length === 0) return []

      return (this.dataPersons || []).filter(p => {
        const first = normalize(p.first_name)
        const last = normalize(p.last_name)
        const fullName = `${first} ${last} ${first}`
        const birthYear = p.birth_date ? p.birth_date.substring(0, 4) : ''
        const deathYear = p.death_date ? p.death_date.substring(0, 4) : ''
        return queryTokens.every(token =>
          fullName.includes(token) || birthYear.includes(token) || deathYear.includes(token)
        )
      }).slice(0, 8)
    },
  },
  watch: {
    '$i18n.locale' () {
      this.drawTimeline()
    },
    startViewYear(newValue) {
      this.localStartViewYear = newValue;
      this.drawTimeline();
    },
    stopViewYear(newValue) {
      this.localStopViewYear = newValue;
      this.drawTimeline();
    },
    minYear(newValue) {
      this.computedMinYear = newValue;
      this.drawTimeline();
    },
    maxYear(newValue) {
      this.computedMaxYear = newValue;
      this.drawTimeline();
    },
    async shouldReloadTimeline(newValue) {
      if (newValue) {      
        // get refreshed data
        await this.fetchInitialData();
        
        // redraw timeline
        this.drawTimeline()

        if (this.selectedPerson) {
          this.selectedPerson = this.dataPersons.find(p => p.id === this.selectedPerson.id) || this.selectedPerson;
        }

        this.$store.dispatch('resetTimelineReload');
      }
    },
  },
  async created () {
    this.dataPersons = await this.fetchData(fetchEnrichedPersons)
    try {
      const loadedPeriods = await loadHistoricalPeriods()
      if (loadedPeriods && loadedPeriods.length > 0) {
        this.historicalPeriods = loadedPeriods
      }
    } catch {
      // Fallback to default historicalPeriods already initialized
    }
    this.dynamicRootPersonId = this.getDefaultDynamicRootPersonId()
    if (!this.selectedPerson && this.dataPersons && this.dataPersons.length > 0) {
      this.selectedPerson = this.dataPersons.find(p => p.id === this.dynamicRootPersonId) || this.dataPersons[0]
    }
    const bounds = this.applyScaleBounds()
    this.isDataLoaded = true
    this.$emit('data-loaded', 'timeline', bounds); 
  },
  mounted () {
    this.isNavbarTargetReady = !!document.getElementById('top-navbar-search') || !!document.getElementById('top-navbar-timeline-controls');
    this.isMounted = true;
    window.addEventListener('resize', this.handleResize);
    document.addEventListener('click', this.handleDocumentClick);
    document.addEventListener('keydown', this.handleKeyDown);
    if (this.isDataLoaded) {
      this.drawTimeline();
    } else {
      const unwatch = this.$watch('isDataLoaded', (newValue) => {
        if (newValue) {
          this.drawTimeline();
          unwatch();
        }
      });
    }
  },
  beforeUnmount () {
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('click', this.handleDocumentClick);
    document.removeEventListener('keydown', this.handleKeyDown);
  },
  methods: {
    async fetchInitialData() {
      let bounds = null;
      try {
        // Use Promise.all to fetch data concurrently
        const [persons] = await Promise.all([
          fetchEnrichedPersons(),
        ]);
        
        this.dataPersons = persons;
        if (!this.selectedPerson && persons && persons.length > 0) {
          this.selectedPerson = persons.find(p => p.id === this.dynamicRootPersonId) || persons[0]
        }
        bounds = this.applyScaleBounds();
      } catch (err) {
        console.error('Failed to fetch enriched persons', err.message);
        this.error = 'Failed to load enriched persons';
      }
      this.$emit('data-loaded', 'timeline', bounds); 
    },

    calculateAutoBounds (persons) {
      const currentYear = new Date().getFullYear();

      if (!persons || !Array.isArray(persons) || persons.length === 0) {
        const defMin = config.minYear || 1800;
        const defMax = config.maxYear || (currentYear + 5);
        return {
          minYear: defMin,
          maxYear: defMax,
          startViewYear: defMin,
          stopViewYear: defMax
        };
      }

      let earliestYear = Infinity;
      let latestYear = -Infinity;
      let hasLivingPerson = false;

      const extractYear = (dateStr) => {
        if (!dateStr) return null;
        if (typeof dateStr === 'number' && dateStr > 1000 && dateStr < 3000) return dateStr;
        const str = String(dateStr).trim();
        const match = str.match(/^(\d{4})/);
        if (match) {
          const y = parseInt(match[1], 10);
          if (!isNaN(y) && y > 0) return y;
        }
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          return d.getFullYear();
        }
        return null;
      };

      persons.forEach(person => {
        // Birth date
        const bYear = extractYear(person.birth_date);
        if (bYear !== null) {
          earliestYear = Math.min(earliestYear, bYear);
        }

        // Death date
        if (person.death_date) {
          const dYear = extractYear(person.death_date);
          if (dYear !== null) {
            latestYear = Math.max(latestYear, dYear);
          }
        } else {
          // No death date recorded -> still alive (lifespan ongoing up to current year)
          hasLivingPerson = true;
        }

        // Related events (marriage, divorce, etc.)
        if (Array.isArray(person.events)) {
          person.events.forEach(evt => {
            const eYear = extractYear(evt.event_date);
            if (eYear !== null) {
              earliestYear = Math.min(earliestYear, eYear);
              latestYear = Math.max(latestYear, eYear);
            }
          });
        }
      });

      if (hasLivingPerson) {
        latestYear = Math.max(latestYear, currentYear);
      }


      if (earliestYear === Infinity) {
        earliestYear = config.minYear || 1800;
      }
      if (latestYear === -Infinity) {
        latestYear = config.maxYear || currentYear;
      }

      if (earliestYear > latestYear) {
        earliestYear = latestYear - 50;
      }

      // Auto bounds:
      // Début : petite marge (arrondi au multiple de 5 inférieur) pour ne pas coller l'avatar/barre au bord gauche
      const minYear = Math.max(0, Math.floor((earliestYear - 1) / 5) * 5);

      // Fin : calé exactement sur l'année la plus récente (ex: 2026) pour que la barre rejoigne le bord droit
      let maxYear = latestYear;

      if (maxYear - minYear < 1) {
        maxYear = minYear + 10;
      }

      return {
        minYear,
        maxYear,
        startViewYear: minYear,
        stopViewYear: maxYear
      };
    },

    getPersonsForScale () {
      if (this.viewMode === 'dynamic') {
        const visibleIds = this.getDynamicVisiblePersonIds()
        if (this.renderedPersons && this.renderedPersons.size > 0) {
          this.renderedPersons.forEach((_, id) => visibleIds.add(id))
        }
        const visiblePersons = this.dataPersons.filter(p => visibleIds.has(p.id))
        if (visiblePersons.length > 0) {
          return visiblePersons
        }
      }
      return this.dataPersons
    },

    getGlobalMinYear () {
      let min = config.minYear || 1800;
      if (this.dataPersons && this.dataPersons.length > 0) {
        this.dataPersons.forEach(p => {
          if (p.birth_date) {
            const yr = parseInt(String(p.birth_date).substring(0, 4), 10);
            if (!isNaN(yr) && yr < min) min = yr;
          }
        });
      }
      return min;
    },

    getGlobalMaxYear () {
      let max = new Date().getFullYear();
      if (this.dataPersons && this.dataPersons.length > 0) {
        this.dataPersons.forEach(p => {
          if (p.death_date) {
            const yr = parseInt(String(p.death_date).substring(0, 4), 10);
            if (!isNaN(yr) && yr > max) max = yr;
          }
        });
      }
      if (config.maxYear && config.maxYear > max) max = config.maxYear;
      return max;
    },

    applyScaleBounds () {
      if (config.autoScale !== false) {
        const bounds = this.calculateAutoBounds(this.getPersonsForScale());
        this.computedMinYear = bounds.minYear;
        this.computedMaxYear = bounds.maxYear;
        this.localStartViewYear = bounds.startViewYear;
        this.localStopViewYear = bounds.stopViewYear;
        return bounds;
      } else {
        this.computedMinYear = this.minYear;
        this.computedMaxYear = this.maxYear;
        this.localStartViewYear = this.startViewYear;
        this.localStopViewYear = this.stopViewYear;
        return {
          minYear: this.minYear,
          maxYear: this.maxYear,
          startViewYear: this.startViewYear,
          stopViewYear: this.stopViewYear
        };
      }
    },

    resetToAutoScale () {
      const bounds = this.calculateAutoBounds(this.getPersonsForScale());
      this.computedMinYear = bounds.minYear;
      this.computedMaxYear = bounds.maxYear;
      this.localStartViewYear = bounds.startViewYear;
      this.localStopViewYear = bounds.stopViewYear;
      this.$emit('data-loaded', 'timeline', bounds);
      this.drawTimeline();
    },

    zoomTimeline (factor, focusX = null) {
      const start = this.localStartViewYear;
      const end = this.localStopViewYear;
      const currentSpan = end - start;

      const globalMin = this.getGlobalMinYear();
      const globalMax = this.getGlobalMaxYear();
      const minBound = Math.min(this.computedMinYear, globalMin) - 5;
      const maxBound = Math.max(this.computedMaxYear, globalMax) + 5;
      const totalSpan = maxBound - minBound;

      // Factor < 1 = Zoom In (span shrinks), Factor > 1 = Zoom Out (span grows)
      if (factor < 1 && currentSpan <= 5) return; // Limite minimum: 5 ans
      if (factor > 1 && currentSpan >= totalSpan) return;

      const newSpan = Math.max(5, currentSpan * factor);

      let ratio = 0.5; // Zoom centré par défaut
      if (focusX !== null && this.timelineWidth > 0) {
        ratio = Math.max(0, Math.min(1, focusX / this.timelineWidth));
      }

      const focusYear = start + ratio * currentSpan;
      let newStart = Math.round(focusYear - ratio * newSpan);
      let newEnd = Math.round(newStart + newSpan);

      if (newStart < minBound) {
        newStart = minBound;
        newEnd = Math.round(newStart + newSpan);
      }
      if (newEnd > maxBound) {
        newEnd = maxBound;
        newStart = Math.round(newEnd - newSpan);
      }

      this.localStartViewYear = newStart;
      this.localStopViewYear = newEnd;

      this.$emit('data-loaded', 'timeline', {
        minYear: this.computedMinYear,
        maxYear: this.computedMaxYear,
        startViewYear: this.localStartViewYear,
        stopViewYear: this.localStopViewYear
      });
      this.drawTimeline();
    },

    zoomIn () {
      this.zoomTimeline(0.75);
    },

    zoomOut () {
      this.zoomTimeline(1.33);
    },

    onWheelZoom (event) {
      // Zoomer si la touche Ctrl / Meta est enfoncée, ou si la molette tourne sur le header
      const isHeader = event.target.closest('#timeline-header-container');
      if (event.ctrlKey || event.metaKey || isHeader) {
        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const factor = event.deltaY < 0 ? 0.82 : 1.22;
        this.zoomTimeline(factor, mouseX);
      }
    },

    getDefaultDynamicRootPersonId () {
      if (!this.dataPersons || this.dataPersons.length === 0) return null

      // Rechercher en priorité une personne ayant à la fois des parents et des enfants (ex: Charles Windsor)
      const personWithBoth = this.dataPersons.find(p => {
        const parents = this.getPersonParents(p.id)
        const children = this.getPersonChildren(p.id)
        return parents.length > 0 && children.length > 0
      })
      if (personWithBoth) return personWithBoth.id

      // Sinon, une personne ayant des conjoints
      const personWithSpouse = this.dataPersons.find(p => {
        const spouses = this.filterSpouses(p.id)
        return spouses.length > 0
      })
      if (personWithSpouse) return personWithSpouse.id

      return this.dataPersons[0].id
    },

    getPersonParents (personId) {
      const person = this.dataPersons.find(p => p.id === personId)
      const parentIds = new Set()
      if (person && Array.isArray(person.relatives)) {
        person.relatives
          .filter(r => r.relation_type === 'father' || r.relation_type === 'mother')
          .forEach(r => parentIds.add(r.id))
      }
      this.dataPersons.forEach(other => {
        if (Array.isArray(other.relatives)) {
          const isChildOfOther = other.relatives.some(r => r.relation_type === 'child' && r.id === personId)
          if (isChildOfOther) parentIds.add(other.id)
        }
      })
      return this.dataPersons.filter(p => parentIds.has(p.id))
    },

    getPersonChildren (personId) {
      const person = this.dataPersons.find(p => p.id === personId)
      const childIds = new Set()
      if (person && Array.isArray(person.relatives)) {
        person.relatives
          .filter(r => r.relation_type === 'child')
          .forEach(r => childIds.add(r.id))
      }
      this.dataPersons.forEach(other => {
        if (Array.isArray(other.relatives)) {
          const isParentOfOther = other.relatives.some(r =>
            (r.relation_type === 'father' || r.relation_type === 'mother') && r.id === personId
          )
          if (isParentOfOther) childIds.add(other.id)
        }
      })
      return this.dataPersons.filter(p => childIds.has(p.id))
    },

    getPersonSiblings (personId) {
      const parents = this.getPersonParents(personId)
      const siblingIds = new Set()
      parents.forEach(parent => {
        const children = this.getPersonChildren(parent.id)
        children.forEach(child => {
          if (child.id !== personId) {
            siblingIds.add(child.id)
          }
        })
      })
      const person = this.dataPersons.find(p => p.id === personId)
      if (person && Array.isArray(person.relatives)) {
        person.relatives
          .filter(r => (r.relation_type === 'brother' || r.relation_type === 'sister' || r.relation_type === 'sibling') && r.id !== personId)
          .forEach(r => siblingIds.add(r.id))
      }
      this.dataPersons.forEach(other => {
        if (other.id !== personId && Array.isArray(other.relatives)) {
          const isSibling = other.relatives.some(r =>
            (r.relation_type === 'brother' || r.relation_type === 'sister' || r.relation_type === 'sibling') && r.id === personId
          )
          if (isSibling) siblingIds.add(other.id)
        }
      })
      return this.dataPersons.filter(p => siblingIds.has(p.id))
    },

    getPersonUnclesAunts (personId) {
      const parents = this.getPersonParents(personId)
      const uncleAuntIds = new Set()
      parents.forEach(parent => {
        const parentSiblings = this.getPersonSiblings(parent.id)
        parentSiblings.forEach(ps => {
          uncleAuntIds.add(ps.id)
          const spouses = this.filterSpouses(ps.id)
          spouses.forEach(sp => uncleAuntIds.add(sp.id))
        })
      })
      parents.forEach(p => uncleAuntIds.delete(p.id))
      uncleAuntIds.delete(personId)
      return this.dataPersons.filter(p => uncleAuntIds.has(p.id))
    },

    getPersonCousins (personId) {
      const parents = this.getPersonParents(personId)
      const siblingIds = new Set(this.getPersonSiblings(personId).map(s => s.id))
      siblingIds.add(personId)
      const cousinIds = new Set()
      parents.forEach(parent => {
        const parentSiblings = this.getPersonSiblings(parent.id)
        parentSiblings.forEach(ps => {
          const children = this.getPersonChildren(ps.id)
          children.forEach(c => {
            if (!siblingIds.has(c.id)) {
              cousinIds.add(c.id)
            }
          })
        })
      })
      return this.dataPersons.filter(p => cousinIds.has(p.id))
    },

    getDynamicVisiblePersonIds () {
      if (!this.dynamicRootPersonId) {
        this.dynamicRootPersonId = this.getDefaultDynamicRootPersonId()
      }
      const visible = new Set()
      if (!this.dynamicRootPersonId) return visible

      // La personne racine est toujours visible
      visible.add(this.dynamicRootPersonId)

      // Les personnes explicitement maintenues visibles (ex: personne cliquée pour masquer ses frères/sœurs)
      if (this.pinnedPersonIds) {
        this.pinnedPersonIds.forEach(id => visible.add(id))
      }

      const checkAndAddSpouses = (pId) => {
        if (!this.expandedSpouseIds.has(pId)) return
        const spouses = this.filterSpouses(pId)
        spouses.forEach(s => {
          visible.add(s.id)
        })
      }

      const visitAscendants = (pId) => {
        if (!this.expandedAscendantIds.has(pId)) return
        const parents = this.getPersonParents(pId)
        parents.forEach(parent => {
          visible.add(parent.id)
        })
      }

      const visitDescendants = (pId) => {
        if (!this.expandedDescendantIds.has(pId)) return
        const children = this.getPersonChildren(pId)
        children.forEach(child => {
          visible.add(child.id)
        })
      }

      const visitSiblings = (pId) => {
        if (!this.expandedSiblingIds.has(pId)) return
        const siblings = this.getPersonSiblings(pId)
        siblings.forEach(sibling => {
          visible.add(sibling.id)
        })
      }

      const visitUnclesAunts = (pId) => {
        if (!this.expandedUncleAuntIds.has(pId)) return
        const unclesAunts = this.getPersonUnclesAunts(pId)
        unclesAunts.forEach(ua => {
          visible.add(ua.id)
        })
      }

      const visitCousins = (pId) => {
        if (!this.expandedCousinIds.has(pId)) return
        const cousins = this.getPersonCousins(pId)
        cousins.forEach(cousin => {
          visible.add(cousin.id)
        })
      }

      // Parcourir de manière itérative uniquement les branches connectées depuis les personnes actuellement visibles
      let prevSize = 0
      while (visible.size > prevSize) {
        prevSize = visible.size
        const currentIds = Array.from(visible)
        currentIds.forEach(id => {
          checkAndAddSpouses(id)
          visitAscendants(id)
          visitDescendants(id)
          visitSiblings(id)
          visitUnclesAunts(id)
          visitCousins(id)
        })
      }

      return visible
    },

    toggleSpouses (personId) {
      const prevIds = new Set(this.renderedPersons.keys())
      const isExpanding = !this.expandedSpouseIds.has(personId)
      this.animatingExpansion = { personId, type: 'spouses', prevIds, isExpanding }

      if (this.expandedSpouseIds.has(personId)) {
        this.expandedSpouseIds.delete(personId)
      } else {
        this.expandedSpouseIds.add(personId)
      }
      this.applyScaleBounds()
      this.$emit('data-loaded', 'timeline', {
        minYear: this.computedMinYear,
        maxYear: this.computedMaxYear,
        startViewYear: this.localStartViewYear,
        stopViewYear: this.localStopViewYear
      })
      this.drawTimeline()
    },

    areAscendantsVisible (personId) {
      if (!personId) return false
      return this.expandedAscendantIds.has(personId)
    },

    areDescendantsVisible (personId) {
      if (!personId) return false
      if (this.expandedDescendantIds.has(personId)) return true
      const spouses = this.filterSpouses(personId)
      if (spouses.some(s => this.expandedDescendantIds.has(s.id))) return true
      const children = this.getPersonChildren(personId)
      if (children.length === 0) return false
      const visibleIds = this.getDynamicVisiblePersonIds()
      const nonRootChildren = children.filter(c => c.id !== this.dynamicRootPersonId)
      return nonRootChildren.length > 0 && nonRootChildren.some(c => visibleIds.has(c.id))
    },

    toggleAscendants (personId) {
      const prevIds = new Set(this.renderedPersons.keys())
      const isVisible = this.areAscendantsVisible(personId)
      const isExpanding = !isVisible
      this.animatingExpansion = { personId, type: 'ascendants', prevIds, isExpanding }

      if (isVisible) {
        // Retirer récursivement les ascendants de cette branche
        const removeAscendants = (id) => {
          this.expandedAscendantIds.delete(id)
          const parents = this.getPersonParents(id)
          parents.forEach(parent => {
            if (parent.id !== this.dynamicRootPersonId) {
              if (this.pinnedPersonIds) this.pinnedPersonIds.delete(parent.id)
              this.expandedAscendantIds.delete(parent.id)
              this.expandedSpouseIds.delete(parent.id)
              this.expandedSiblingIds.delete(parent.id)
              this.expandedUncleAuntIds.delete(parent.id)
              this.expandedCousinIds.delete(parent.id)
            }
            removeAscendants(parent.id)
          })
        }
        removeAscendants(personId)
      } else {
        this.expandedAscendantIds.add(personId)
        // Déplier automatiquement les parents pour que leurs barres de vie et pont d'union atteignent les années de naissance
        this.unfoldedPersonIds.add(personId)
        const parents = this.getPersonParents(personId)
        parents.forEach(p => this.unfoldedPersonIds.add(p.id))
      }
      this.applyScaleBounds()
      this.$emit('data-loaded', 'timeline', {
        minYear: this.computedMinYear,
        maxYear: this.computedMaxYear,
        startViewYear: this.localStartViewYear,
        stopViewYear: this.localStopViewYear
      })
      this.drawTimeline()
    },

    toggleDescendants (personId) {
      const prevIds = new Set(this.renderedPersons.keys())
      const isVisible = this.areDescendantsVisible(personId)
      const isExpanding = !isVisible
      this.animatingExpansion = { personId, type: 'descendants', prevIds, isExpanding }

      if (isVisible) {
        // Retirer récursivement personId, ses conjoints et TOUS leurs descendants de expandedDescendantIds et autres sets
        const removeDescendants = (id) => {
          this.expandedDescendantIds.delete(id)
          const spouses = this.filterSpouses(id)
          spouses.forEach(s => {
            this.expandedDescendantIds.delete(s.id)
          })
          const children = this.getPersonChildren(id)
          children.forEach(child => {
            if (child.id !== this.dynamicRootPersonId) {
              if (this.pinnedPersonIds) this.pinnedPersonIds.delete(child.id)
              this.expandedDescendantIds.delete(child.id)
              this.expandedSpouseIds.delete(child.id)
              this.expandedAscendantIds.delete(child.id)
              this.expandedSiblingIds.delete(child.id)
              this.expandedUncleAuntIds.delete(child.id)
              this.expandedCousinIds.delete(child.id)
            }
            removeDescendants(child.id)
          })
        }
        removeDescendants(personId)
        const spouses = this.filterSpouses(personId)
        spouses.forEach(s => removeDescendants(s.id))
      } else {
        this.expandedDescendantIds.add(personId)
        // Déplier automatiquement les parents pour que leurs barres de vie et pont d'union atteignent les années de naissance
        this.unfoldedPersonIds.add(personId)
        const spouses = this.filterSpouses(personId)
        spouses.forEach(s => {
          this.expandedDescendantIds.add(s.id)
          this.unfoldedPersonIds.add(s.id)
        })
      }
      this.applyScaleBounds()
      this.$emit('data-loaded', 'timeline', {
        minYear: this.computedMinYear,
        maxYear: this.computedMaxYear,
        startViewYear: this.localStartViewYear,
        stopViewYear: this.localStopViewYear
      })
      this.drawTimeline()
    },

    areSiblingsVisible (personId) {
      if (!personId) return false
      // 1. Directement marqué comme ayant déployé la fratrie
      if (this.expandedSiblingIds.has(personId)) return true
      const siblings = this.getPersonSiblings(personId)
      if (siblings.length === 0) return false
      if (siblings.some(s => this.expandedSiblingIds.has(s.id))) return true

      // 2. Ou fratrie déployée via les parents
      const parents = this.getPersonParents(personId)
      if (parents.length > 0 && parents.some(p => this.expandedDescendantIds.has(p.id))) return true

      // 3. Ou au moins un frère/sœur (autre que la racine globale de l'arbre) est visible
      const visibleIds = this.getDynamicVisiblePersonIds()
      const nonRootSiblings = siblings.filter(s => s.id !== this.dynamicRootPersonId)
      if (nonRootSiblings.length > 0 && nonRootSiblings.some(s => visibleIds.has(s.id))) {
        return true
      }

      return false
    },

    areUnclesAuntsVisible (personId) {
      if (!personId) return false
      if (this.expandedUncleAuntIds.has(personId)) return true
      const unclesAunts = this.getPersonUnclesAunts(personId)
      if (unclesAunts.length === 0) return false
      const visibleIds = this.getDynamicVisiblePersonIds()
      const nonRootUncles = unclesAunts.filter(u => u.id !== this.dynamicRootPersonId)
      if (nonRootUncles.length > 0 && nonRootUncles.some(u => visibleIds.has(u.id))) {
        return true
      }
      return false
    },

    areCousinsVisible (personId) {
      if (!personId) return false
      if (this.expandedCousinIds.has(personId)) return true
      const cousins = this.getPersonCousins(personId)
      if (cousins.length === 0) return false
      const visibleIds = this.getDynamicVisiblePersonIds()
      const nonRootCousins = cousins.filter(c => c.id !== this.dynamicRootPersonId)
      if (nonRootCousins.length > 0 && nonRootCousins.some(c => visibleIds.has(c.id))) {
        return true
      }
      return false
    },

    toggleSiblings (personId) {
      const prevIds = new Set(this.renderedPersons.keys())
      const siblings = this.getPersonSiblings(personId)
      const allSiblingIds = [personId, ...siblings.map(s => s.id)]
      const isVisible = this.areSiblingsVisible(personId)
      const isExpanding = !isVisible

      this.animatingExpansion = { personId, type: 'siblings', prevIds, isExpanding }

      if (isVisible) {
        // La personne sur laquelle l'utilisateur a cliqué DOIT TOUJOURS RESTER VISIBLE
        this.pinnedPersonIds.add(personId)

        // Retirer toute la fratrie de expandedSiblingIds
        allSiblingIds.forEach(id => {
          this.expandedSiblingIds.delete(id)
        })

        // Retirer aussi les enfants des parents si les frères et sœurs provenaient d'un déploiement descendant des parents
        const parents = this.getPersonParents(personId)
        parents.forEach(p => {
          this.expandedDescendantIds.delete(p.id)
        })

        // Nettoyer les frères et sœurs masqués (sauf personId et dynamicRootPersonId)
        siblings.forEach(s => {
          if (s.id !== this.dynamicRootPersonId && s.id !== personId) {
            this.pinnedPersonIds.delete(s.id)
            this.expandedSiblingIds.delete(s.id)
            this.expandedSpouseIds.delete(s.id)
            this.expandedDescendantIds.delete(s.id)
            this.expandedAscendantIds.delete(s.id)
            this.expandedUncleAuntIds.delete(s.id)
            this.expandedCousinIds.delete(s.id)
          }
        })
      } else {
        // AFFICHER : garantir que personId reste visible et ajouter à expandedSiblingIds
        this.pinnedPersonIds.add(personId)
        this.expandedSiblingIds.add(personId)
      }

      this.applyScaleBounds()
      this.$emit('data-loaded', 'timeline', {
        minYear: this.computedMinYear,
        maxYear: this.computedMaxYear,
        startViewYear: this.localStartViewYear,
        stopViewYear: this.localStopViewYear
      })
      this.drawTimeline()
    },

    toggleUnclesAunts (personId) {
      const prevIds = new Set(this.renderedPersons.keys())
      const unclesAunts = this.getPersonUnclesAunts(personId)
      const isVisible = this.areUnclesAuntsVisible(personId)
      const isExpanding = !isVisible

      this.animatingExpansion = { personId, type: 'uncles-aunts', prevIds, isExpanding }

      if (isVisible) {
        // La personne cliquée et ses parents doivent rester visibles
        this.pinnedPersonIds.add(personId)
        const parents = this.getPersonParents(personId)
        parents.forEach(p => {
          this.pinnedPersonIds.add(p.id)
          // Retirer aussi les déploiements de frères/sœurs des parents
          this.expandedSiblingIds.delete(p.id)
          // Retirer aussi les enfants des grands-parents si les oncles/tantes provenaient du déploiement des grands-parents
          const grandparents = this.getPersonParents(p.id)
          grandparents.forEach(gp => {
            this.expandedDescendantIds.delete(gp.id)
            const gpSpouses = this.filterSpouses(gp.id)
            gpSpouses.forEach(gps => this.expandedDescendantIds.delete(gps.id))
          })
        })

        this.expandedUncleAuntIds.delete(personId)
        unclesAunts.forEach(u => {
          this.expandedUncleAuntIds.delete(u.id)
          if (u.id !== this.dynamicRootPersonId && u.id !== personId) {
            this.pinnedPersonIds.delete(u.id)
            this.expandedSiblingIds.delete(u.id)
            this.expandedSpouseIds.delete(u.id)
            this.expandedDescendantIds.delete(u.id)
            this.expandedAscendantIds.delete(u.id)
            this.expandedUncleAuntIds.delete(u.id)
            this.expandedCousinIds.delete(u.id)
          }
        })
      } else {
        this.pinnedPersonIds.add(personId)
        this.expandedUncleAuntIds.add(personId)
      }

      this.applyScaleBounds()
      this.$emit('data-loaded', 'timeline', {
        minYear: this.computedMinYear,
        maxYear: this.computedMaxYear,
        startViewYear: this.localStartViewYear,
        stopViewYear: this.localStopViewYear
      })
      this.drawTimeline()
    },

    toggleCousins (personId) {
      const prevIds = new Set(this.renderedPersons.keys())
      const cousins = this.getPersonCousins(personId)
      const isVisible = this.areCousinsVisible(personId)
      const isExpanding = !isVisible

      this.animatingExpansion = { personId, type: 'cousins', prevIds, isExpanding }

      if (isVisible) {
        this.pinnedPersonIds.add(personId)
        const parents = this.getPersonParents(personId)
        parents.forEach(p => this.pinnedPersonIds.add(p.id))

        // Retirer les déploiements descendants des oncles/tantes si les cousins provenaient de leurs enfants
        const unclesAunts = this.getPersonUnclesAunts(personId)
        unclesAunts.forEach(ua => {
          this.expandedDescendantIds.delete(ua.id)
          const uaSpouses = this.filterSpouses(ua.id)
          uaSpouses.forEach(uas => this.expandedDescendantIds.delete(uas.id))
        })

        this.expandedCousinIds.delete(personId)
        cousins.forEach(c => {
          this.expandedCousinIds.delete(c.id)
          if (c.id !== this.dynamicRootPersonId && c.id !== personId) {
            this.pinnedPersonIds.delete(c.id)
            this.expandedSiblingIds.delete(c.id)
            this.expandedSpouseIds.delete(c.id)
            this.expandedDescendantIds.delete(c.id)
            this.expandedAscendantIds.delete(c.id)
            this.expandedUncleAuntIds.delete(c.id)
            this.expandedCousinIds.delete(c.id)
          }
        })
      } else {
        this.pinnedPersonIds.add(personId)
        this.expandedCousinIds.add(personId)
      }

      this.applyScaleBounds()
      this.$emit('data-loaded', 'timeline', {
        minYear: this.computedMinYear,
        maxYear: this.computedMaxYear,
        startViewYear: this.localStartViewYear,
        stopViewYear: this.localStopViewYear
      })
      this.drawTimeline()
    },

    toggleViewMode (mode) {
      this.viewMode = mode
      this.closeContextMenu()
      this.applyScaleBounds()
      this.$emit('data-loaded', 'timeline', {
        minYear: this.computedMinYear,
        maxYear: this.computedMaxYear,
        startViewYear: this.localStartViewYear,
        stopViewYear: this.localStopViewYear
      })
      this.drawTimeline()
    },

    resetDynamicTree () {
      this.dynamicRootPersonId = this.getDefaultDynamicRootPersonId()
      this.expandedAscendantIds.clear()
      this.expandedDescendantIds.clear()
      this.expandedSpouseIds.clear()
      this.expandedSiblingIds.clear()
      this.expandedUncleAuntIds.clear()
      this.expandedCousinIds.clear()
      this.pinnedPersonIds.clear()
      this.closeContextMenu()
      this.applyScaleBounds()
      this.$emit('data-loaded', 'timeline', {
        minYear: this.computedMinYear,
        maxYear: this.computedMaxYear,
        startViewYear: this.localStartViewYear,
        stopViewYear: this.localStopViewYear
      })
      this.drawTimeline()
      this.centerOnRootPerson()
    },

    centerOnRootPerson () {
      if (!this.dynamicRootPerson) return
      const personId = this.dynamicRootPerson.id
      this.$nextTick(() => {
        const pData = this.renderedPersons.get(personId)
        if (pData) {
          const wrapper = document.getElementById('timeline-wrapper')
          if (wrapper && wrapper.scrollHeight > wrapper.clientHeight) {
            wrapper.scrollTo({
              top: Math.max(0, pData.yTop - 120),
              behavior: 'smooth'
            })
          }
          const graphContainer = document.getElementById('timeline-graph-container')
          if (graphContainer && graphContainer.scrollHeight > graphContainer.clientHeight) {
            graphContainer.scrollTo({
              top: Math.max(0, pData.yTop - 120),
              behavior: 'smooth'
            })
          }
          const el = document.getElementById(`person-bar-${personId}`)
          if (el) {
            el.classList.remove('person-highlighted')
            void el.offsetWidth
            el.classList.add('person-highlighted')
            setTimeout(() => {
              el.classList.remove('person-highlighted')
            }, 3000)
          }
        }
      })
    },

    setDynamicRootPerson (personId) {
      this.dynamicRootPersonId = personId
      this.expandedAscendantIds.clear()
      this.expandedDescendantIds.clear()
      this.expandedSpouseIds.clear()
      this.expandedSiblingIds.clear()
      this.expandedUncleAuntIds.clear()
      this.expandedCousinIds.clear()
      this.pinnedPersonIds.clear()
      this.closeContextMenu()
      this.applyScaleBounds()
      this.$emit('data-loaded', 'timeline', {
        minYear: this.computedMinYear,
        maxYear: this.computedMaxYear,
        startViewYear: this.localStartViewYear,
        stopViewYear: this.localStopViewYear
      })
      this.drawTimeline()
    },

    handleKeyDown (e) {
      if (e.key === 'Escape') {
        this.closeContextMenu()
        this.isSearchOpen = false
      }
    },

    handleDocumentClick (e) {
      this.closeContextMenu()
      const searchBox = document.querySelector('.search-box-wrapper')
      if (searchBox && !searchBox.contains(e.target)) {
        this.isSearchOpen = false
      }
    },

    openContextMenu (person, event) {
      if (this.contextMenuPerson && this.contextMenuPerson.id === person.id) {
        this.closeContextMenu()
        return
      }
      this.contextMenuPerson = person

      const wrapper = document.getElementById('timeline-wrapper')
      if (wrapper && event && typeof event.clientX === 'number') {
        const wrapperRect = wrapper.getBoundingClientRect()
        const mouseX = event.clientX - wrapperRect.left + wrapper.scrollLeft
        const mouseY = event.clientY - wrapperRect.top + wrapper.scrollTop
        const menuWidth = 260
        const posX = (mouseX + menuWidth > wrapperRect.width + wrapper.scrollLeft - 20)
          ? Math.max(10, mouseX - menuWidth)
          : Math.max(10, mouseX)

        this.contextMenuStyle = {
          position: 'absolute',
          left: `${posX}px`,
          top: `${Math.max(10, mouseY)}px`,
          zIndex: 1050
        }
      } else if (event && typeof event.clientX === 'number') {
        this.contextMenuStyle = {
          position: 'fixed',
          left: `${event.clientX}px`,
          top: `${event.clientY}px`,
          zIndex: 1050
        }
      } else {
        this.contextMenuStyle = {
          position: 'absolute',
          left: '50px',
          top: '50px',
          zIndex: 1050
        }
      }
    },

    closeContextMenu () {
      this.contextMenuPerson = null
    },

    onContextMenuAction (action) {
      if (!this.contextMenuPerson) return
      const person = this.contextMenuPerson
      this.closeContextMenu()

      switch (action) {
        case 'view-profile':
          this.showPersonProfile(person)
          break
        case 'set-as-root':
          this.setDynamicRootPerson(person.id)
          break
        case 'toggle-parents':
          this.toggleAscendants(person.id)
          break
        case 'toggle-spouses':
          this.toggleSpouses(person.id)
          break
        case 'toggle-children':
          this.toggleDescendants(person.id)
          break
        case 'toggle-siblings':
          this.toggleSiblings(person.id)
          break
        case 'toggle-uncles-aunts':
          this.toggleUnclesAunts(person.id)
          break
        case 'toggle-cousins':
          this.toggleCousins(person.id)
          break
        case 'toggle-bar':
          this.togglePersonBar(person.id)
          break
      }
    },

    formatPersonBirth (person) {
      if (!person) return ''
      const bEv = (person.events || []).find(e => (e.event_type || '').toLowerCase() === 'birth')
      const dateStr = person.birth_date || (bEv ? bEv.event_date : null)
      const placeStr = bEv && bEv.event_place ? bEv.event_place : null
      if (dateStr && placeStr) {
        return `${dateStr} • ${placeStr}`
      }
      return dateStr || placeStr || ''
    },

    formatPersonDeath (person) {
      if (!person) return ''
      const dEv = (person.events || []).find(e => (e.event_type || '').toLowerCase() === 'death')
      const dateStr = person.death_date || (dEv ? dEv.event_date : null)
      const placeStr = dEv && dEv.event_place ? dEv.event_place : null
      if (dateStr && placeStr) {
        return `${dateStr} • ${placeStr}`
      }
      return dateStr || placeStr || ''
    },

    getPersonBirthInfo (person) {
      if (!person || !person.birth_date) return null
      const bEv = (person.events || []).find(e => (e.event_type || '').toLowerCase() === 'birth')
      const bDate = new Date(person.birth_date)
      const bYear = !isNaN(bDate.getTime()) ? bDate.getFullYear() : null
      if (bEv && bEv.event_place) {
        return bYear ? `${bEv.event_place} (${bYear})` : bEv.event_place
      } else if (bYear) {
        return `${bYear}`
      }
      return null
    },

    getPersonDeathInfo (person) {
      if (!person || !person.death_date) return null
      const dEv = (person.events || []).find(e => (e.event_type || '').toLowerCase() === 'death')
      const dDate = new Date(person.death_date)
      const dYear = !isNaN(dDate.getTime()) ? dDate.getFullYear() : null
      if (dEv && dEv.event_place) {
        return dYear ? `${dEv.event_place} (${dYear})` : dEv.event_place
      } else if (dYear) {
        return `${dYear}`
      }
      return null
    },

    filterRootPersons () {
      return this.dataPersons.filter(person => {
        return !person.relatives.some(relative =>
          relative.relation_type === 'father' || relative.relation_type === 'mother'
        )
      })
      .sort((a, b) => new Date(a.birth_date) - new Date(b.birth_date));
    },

    filterSpouses (personId) {
      // Find the person with the given personId
      const person = this.dataPersons.find(p => p.id === personId)

      // If the person is not found, return an empty array
      if (!person) {
        return []
      }

      // Extract the list of relatives
      const relatives = person.relatives || []
      const spouseIds = new Set()
      relatives.filter(r => r.relation_type === 'spouse').forEach(r => spouseIds.add(r.id))
      this.dataPersons.forEach(other => {
        if (Array.isArray(other.relatives)) {
          const isSpouseOfOther = other.relatives.some(r => r.relation_type === 'spouse' && r.id === personId)
          if (isSpouseOfOther) spouseIds.add(other.id)
        }
      })

      const normalizeType = (t) => (t || '').toLowerCase().replace(/[\s_-]+/g, '_')

      // Also include partners from mutual union events
      ;(person.events || []).forEach(e => {
        const nType = normalizeType(e.event_type)
        if (['marriage', 'mariage', 'civil_union', 'union_civile', 'divorce', 'civil_separation', 'separation_civile'].includes(nType)) {
          (e.related_persons || []).forEach(rp => spouseIds.add(rp.id))
        }
      })

      // Get the full details of the spouses from the data list
      const spouseDetails = Array.from(spouseIds).map(spouseId => {
        const spouse = { id: spouseId }
        // Find the full details of each spouse from the data
        const spouseDetail = this.dataPersons.find(p => p.id === spouseId)

        // Initialize the common dates and places to null
        let marriageDate = null
        let marriagePlace = null
        let divorceDate = null
        let divorcePlace = null
        let civilUnionDate = null
        let civilUnionPlace = null
        let civilSeparationDate = null

        // Rassembler tous les événements mutuels du couple (depuis person ET depuis spouseDetail)
        const pEvents = (person.events || [])
          .filter(e => {
            if ((e.related_persons || []).some(rp => rp.id === spouse.id)) return true
            if (spouseIds.size === 1 && ['marriage', 'mariage', 'civil_union', 'union_civile', 'divorce', 'civil_separation', 'separation_civile'].includes(normalizeType(e.event_type))) return true
            return false
          })
        const sEvents = (spouseDetail && spouseDetail.events ? spouseDetail.events : [])
          .filter(e => {
            if ((e.related_persons || []).some(rp => rp.id === person.id)) return true
            if (spouseIds.size === 1 && ['marriage', 'mariage', 'civil_union', 'union_civile', 'divorce', 'civil_separation', 'separation_civile'].includes(normalizeType(e.event_type))) return true
            return false
          })

        // Parcourir les événements des deux conjoints pour extraire dates et lieux
        ;[...pEvents, ...sEvents].forEach(event => {
          const nType = normalizeType(event.event_type)
          switch (nType) {
            case 'marriage':
            case 'mariage':
              if (!marriageDate && event.event_date) marriageDate = event.event_date
              if (!marriagePlace && event.event_place) marriagePlace = event.event_place
              break
            case 'civil_union':
            case 'union_civile':
              if (!civilUnionDate && event.event_date) civilUnionDate = event.event_date
              if (!civilUnionPlace && event.event_place) civilUnionPlace = event.event_place
              break
            case 'divorce':
              if (!divorceDate && event.event_date) divorceDate = event.event_date
              if (!divorcePlace && event.event_place) divorcePlace = event.event_place
              break
            case 'civil_separation':
            case 'separation_civile':
              if (!civilSeparationDate && event.event_date) civilSeparationDate = event.event_date
              break
          }
        })

        // Return the spouse detail with the added common dates and places
        return {
          ...spouseDetail,
          marriage_date: marriageDate,
          marriage_place: marriagePlace,
          divorce_date: divorceDate,
          divorce_place: divorcePlace,
          civil_union_date: civilUnionDate,
          civil_union_place: civilUnionPlace,
          civil_separation_date: civilSeparationDate
        }
      })

      // Return the list of spouse details
      return spouseDetails
    },

    filterChildrenNoSpouse (personId) {
      const children = this.getPersonChildren(personId)
      return children.filter(childDetail => {
        const parents = this.getPersonParents(childDetail.id)
        return !parents.some(parent => parent.id !== personId)
      })
    },

    filterChildren (personId, spouseId) {
      const children = this.getPersonChildren(personId)
      return children.filter(childDetail => {
        const parents = this.getPersonParents(childDetail.id)
        return parents.some(parent => parent.id === spouseId)
      })
    },

    filterOldestAncestor (personId) {
      // Find the person with the given ID
      const currentPerson = this.dataPersons.find(p => p.id === personId)

      // If the person is not found, return null
      if (!currentPerson) {
        return null
      }

      // Recursive function to find the oldest ancestor
      const findAncestor = (person) => {
        // Find the father and mother from the relatives
        const father = person.relatives.find(relative => relative.relation_type === 'father')
        const mother = person.relatives.find(relative => relative.relation_type === 'mother')

        // If both parents are missing, the current person is the oldest ancestor
        if (!father && !mother) {
          return person
        }

        // Prioritize the father if available, otherwise use the mother
        const parent = this.dataPersons.find(p => p.id === (father ? father.id : mother.id))

        // Continue climbing up the ancestor chain with the selected parent
        return findAncestor(parent)
      }

      // Find and return the oldest ancestor
      return findAncestor(currentPerson)
    },

    getYearFromDate (date) {
      return date ? new Date(date).getFullYear() : new Date().getFullYear()
    },

    getFamilyColor (id) {
      const vibrantPalette = [
        '#2563eb', // Bleu royal vif
        '#059669', // Vert émeraude éclatant
        '#ea580c', // Orange mandarine chaleureux
        '#7c3aed', // Violet améthyste lumineux
        '#e11d48', // Framboise / Corail pimpant
        '#0891b2', // Bleu lagon
        '#d97706', // Ambre doré
        '#4f46e5', // Indigo vibrant
        '#16a34a', // Vert prairie vif
        '#c026d3', // Fuchsia éclatant
        '#0284c7', // Bleu azur
        '#b45309', // Caramel chaud
      ]
      const numId = typeof id === 'number' ? id : (parseInt(id, 10) || 1)
      const idx = Math.abs(numId * 7 + 3) % vibrantPalette.length
      return vibrantPalette[idx]
    },

    getDefaultColor (personId = null) {
      if (personId) {
        const fullColor = this.getFamilyColor(personId)
        return d3.interpolateRgb(fullColor, '#ffffff')(0.3)
      }
      return '#94a3b8'
    },

    getPeriods (person, familyColor = null, isChild = false) {
      // Extract birth and death years from the person object
      const birthYear = this.getYearFromDate(person.birth_date)
      const endYear = this.getYearFromDate(person.death_date)
     
      // Default verification status for birth and death dates
      const birthDateVerified = person.birth_date_verified !== null ? person.birth_date_verified : true
      let deathDateVerified = person.death_date_verified !== null ? person.death_date_verified : true
      // set as verified is death is not defined
      if (person.death_date === null && deathDateVerified === false) { deathDateVerified = true }

      // Get spouses
      const spouses = this.filterSpouses(person.id)

      // Initialize the periods array and the starting year
      const periods = []
      let lastEventYear = birthYear

      // Handle case where there are no spouses
      if (!spouses.length) {
        let color = familyColor !== null ? familyColor : this.getDefaultColor(person.id)

        // Check if the person has children (without spouse)
        const children = this.filterChildrenNoSpouse(person.id)

        // If no children, create a single period from birth to death
        if (children.length === 0) {
          // this period is too small, no background color for this case
          if (birthYear === endYear) {
            color = "none"
          }

          periods.push({
            start: birthYear,
            end: endYear,
            color: color,
            birthDateVerified,
            deathDateVerified,
            stillAlive: person.death_date === null
          })
          return periods
        }

        // If the person has children, create two periods:
        // 1. Before the first child is born
        // 2. After the first child is born
        const firstChildBirthYear = new Date(children[0].birth_date).getFullYear()

        // Period before the first child
        if (birthYear < firstChildBirthYear) {
          periods.push({
            start: birthYear,
            end: firstChildBirthYear,
            color: this.getDefaultColor(person.id),
            birthDateVerified,
            deathDateVerified,
            stillAlive: person.death_date === null
          })
        }

        // Generate a unique family key by sorting the IDs and joining them
        const familyNoSpouseKey = this.getFamilyKey(person.id, 0)
        const familyNoSpouseColor = this.getFamilyColor(person.id)
        this.familyColorsMap.set(familyNoSpouseKey, familyNoSpouseColor)

        // Period after the first child
        periods.push({
          start: firstChildBirthYear,
          end: endYear,
          color: familyColor !== null ? familyColor : familyNoSpouseColor,
          birthDateVerified,
          deathDateVerified,
          stillAlive: person.death_date === null
        })
        return periods
      }

      // Handle case where spouses exist
      for (const spouse of spouses) {
        let relationshipStartYear = null

        // Extract years for marriage, civil union, divorce, and separation
        const marriageYear = spouse.marriage_date ? new Date(spouse.marriage_date).getFullYear() : null
        const spouseDeathYear = spouse.death_date ? new Date(spouse.death_date).getFullYear() : null
        // Marriage period ends at: divorce, spouse's death, or person's own end year (whichever comes first)
        let divorceYear = endYear
        if (spouse.divorce_date) {
          divorceYear = new Date(spouse.divorce_date).getFullYear()
        } else if (spouseDeathYear && spouseDeathYear < endYear) {
          divorceYear = spouseDeathYear
        }
        const unionYear = spouse.civil_union_date ? new Date(spouse.civil_union_date).getFullYear() : null

        // Determine relationshipStartYear based on marriage, union, and children
        if (!marriageYear && !unionYear) {
          const children = this.filterChildren(person.id, spouse.id)
          if (children.length > 0) {
            relationshipStartYear = new Date(children[0].birth_date).getFullYear()
          }
        }

        // If relationshipStartYear is still null but unionYear or marriageYear exists
        relationshipStartYear = relationshipStartYear ?? unionYear
        relationshipStartYear = relationshipStartYear ?? marriageYear

        // If both relationshipStartYear and unionYear exist, choose the earliest year
        if (relationshipStartYear && unionYear) {
          relationshipStartYear = Math.min(relationshipStartYear, unionYear)
        }

        if (relationshipStartYear) {
          // Generate a unique family key by sorting the IDs and joining them
          const familyKey = this.getFamilyKey(person.id, spouse.id)

          // Retrieve or generate a color for this spouse
          let spouseColor = this.familyColorsMap.get(familyKey)
          if (!spouseColor) {
            // Derive a unique couple color that doesn't collide with either person's default color
            const ids = familyKey.split('-').map(v => parseInt(v, 10))
            const personDefaultColor = this.getFamilyColor(person.id)
            const spouseDefaultColor = this.getFamilyColor(spouse.id)
            // Try multiple hash seeds until we find a non-colliding color
            for (let attempt = 0; attempt < 12; attempt++) {
              const numKey = (ids[0] * 13 + ids[1] * 7 + attempt * 3) 
              spouseColor = this.getFamilyColor(numKey)
              // Check it doesn't match either person's lifeline color
              if (spouseColor !== personDefaultColor && spouseColor !== spouseDefaultColor) break
            }
            this.familyColorsMap.set(familyKey, spouseColor)
          }

          // Add the period before the relationship started
          if (lastEventYear < relationshipStartYear) {
            periods.push({
              start: lastEventYear,
              end: relationshipStartYear,
              color: isChild ? familyColor : this.getDefaultColor(person.id),
              birthDateVerified,
              deathDateVerified,
              stillAlive: person.death_date === null
            })
          }

          // Add the period during the relationship
          if (unionYear && marriageYear && unionYear < marriageYear && unionYear < divorceYear) {
            const civilUnionEnd = Math.min(marriageYear, divorceYear)
            periods.push({
              start: unionYear,
              end: civilUnionEnd,
              color: spouseColor,
              birthDateVerified,
              deathDateVerified,
              stillAlive: person.death_date === null,
              isRelationship: true,
              spouseName: `${spouse.first_name} ${spouse.last_name}`,
              relationshipType: 'civil_union',
              marriageYear: null,
              civilUnionYear: unionYear,
              divorceYear: civilUnionEnd < divorceYear ? civilUnionEnd : (spouse.divorce_date ? new Date(spouse.divorce_date).getFullYear() : null)
            })

            if (marriageYear < divorceYear) {
              periods.push({
                start: marriageYear,
                end: divorceYear,
                color: spouseColor,
                birthDateVerified,
                deathDateVerified,
                stillAlive: person.death_date === null,
                isRelationship: true,
                spouseName: `${spouse.first_name} ${spouse.last_name}`,
                relationshipType: 'marriage',
                marriageYear: marriageYear,
                civilUnionYear: unionYear,
                divorceYear: spouse.divorce_date ? new Date(spouse.divorce_date).getFullYear() : null
              })
            }
          } else {
            periods.push({
              start: relationshipStartYear,
              end: divorceYear,
              color: spouseColor,
              birthDateVerified,
              deathDateVerified,
              stillAlive: person.death_date === null,
              isRelationship: true,
              spouseName: `${spouse.first_name} ${spouse.last_name}`,
              relationshipType: marriageYear ? 'marriage' : (unionYear ? 'civil_union' : 'union'),
              marriageYear: marriageYear,
              civilUnionYear: unionYear,
              divorceYear: spouse.divorce_date ? new Date(spouse.divorce_date).getFullYear() : null
            })
          }

          // Update the last event year to the end of this relationship
          lastEventYear = divorceYear
        } else {
          // If no relationship start year is available, continue with the default color
          periods.push({
            start: lastEventYear,
            end: endYear,
            color: this.getDefaultColor(person.id),
            birthDateVerified,
            deathDateVerified,
            stillAlive: person.death_date === null
          })
        }
      }

      // Handle the period after the last divorce or spouse death until death or current year
      if (lastEventYear < endYear) {
        periods.push({
          start: lastEventYear,
          end: endYear,
          color: isChild ? familyColor : this.getDefaultColor(person.id),
          birthDateVerified,
          deathDateVerified,
          stillAlive: person.death_date === null
        })
      }
      return periods
    },

    getFamilyKey (personId, spouseId) {
      // Generate a unique family key by sorting the IDs and joining them
      return [personId, spouseId].sort().join('-')
    },

    handleResize: debounce(function () {
      const timelineContent = document.getElementById('timeline-content')
      const width = timelineContent ? timelineContent.clientWidth : window.innerWidth
      const height = window.innerHeight

      if (width !== this.previousWidth || height !== this.previousHeight) {
        this.previousWidth = width
        this.previousHeight = height

        // redraw the graph
        this.drawTimeline()
      }
    }, 300),

    setupGraphSvg () {
      // Get the width of the 'timeline-content' element
      const timelineContent = document.getElementById('timeline-content')
      const timelineContentWidth = timelineContent
         ? parseFloat(window.getComputedStyle(timelineContent).width)
         : window.innerWidth

      // Calculate the available width for the timeline chart
      this.timelineWidth = timelineContentWidth - this.graphMargin.right - this.graphMargin.left

      // Calculate the total height of the chart
      const personCount = this.viewMode === 'dynamic'
        ? Math.max(this.getDynamicVisiblePersonIds().size, 4)
        : this.dataPersons.length
      this.totalHeight = Math.max((personCount + 3) * this.barHeight, window.innerHeight)

      this.xViewScale = d3.scaleLinear()
        .domain([this.localStartViewYear, this.localStopViewYear])
        .range([0, this.timelineWidth]);

      const svg = d3.select('#timeline-graph')
        .attr('width', this.timelineWidth)
        .attr('height', this.totalHeight)
        .append('g')
        .attr('transform', `translate(${this.graphMargin.left},0)`)

      // add blur filter
      const defs = svg.append('defs')
      const filterBlur = defs.append('filter')
        .attr('id', 'blur-filter')
        .attr('x', '-50%') // Extend the filter area to the left
        .attr('y', '0')
        .attr('width', '200%') // Ensure the blur affects enough area
        .attr('height', '100%')
      filterBlur.append('feGaussianBlur')
        .attr('in', 'SourceGraphic')
        .attr('stdDeviation', '6') // Adjust the blur amount

      return { svg }
    },

    onPointerStart(event, type) {
      // Ignorer si on clique dans le menu contextuel
      if (event.target && event.target.closest('.person-context-menu')) {
        return;
      }

      if (this.contextMenuPerson) {
        this.closeContextMenu();
      }

      // Ignorer si on clique sur un élément interactif (personne, pastille, bouton...)
      if (event.target && event.target.closest('.person, .marriage-bar-badge, button, a, input, select, .action-btn')) {
        return;
      }
      
      const isTouchEvent = type === 'touch';
      this.moveGraphStarted = true;

      const clientX = !isTouchEvent ? event.clientX : event.touches[0].clientX;
      this.initialPointerX = clientX;
      this.initialDomain = [...this.xViewScale.domain()];
    },

    onPointerMove(event, type) {
      if (!this.moveGraphStarted) return;

      const isTouchEvent = type === 'touch';
      const currentClientX = !isTouchEvent ? event.clientX : event.touches[0].clientX;

      // Déplacement en pixels
      const dx = currentClientX - this.initialPointerX;
      if (Math.abs(dx) < 1) return;

      // Conversion du déplacement en pixels vers un décalage en années
      const domainSpan = this.initialDomain[1] - this.initialDomain[0];
      const domainShift = dx * domainSpan / (this.timelineWidth || 1000);

      let newDomainStart = this.initialDomain[0] - domainShift;
      let newDomainEnd = this.initialDomain[1] - domainShift;

      // Limites de déplacement
      const globalMin = this.getGlobalMinYear();
      const globalMax = this.getGlobalMaxYear();
      const minBound = Math.min(this.computedMinYear, globalMin) - 10;
      const maxBound = Math.max(this.computedMaxYear, globalMax) + 10;
      if (newDomainStart < minBound) {
        newDomainStart = minBound;
        newDomainEnd = newDomainStart + domainSpan;
      }
      if (newDomainEnd > maxBound) {
        newDomainEnd = maxBound;
        newDomainStart = newDomainEnd - domainSpan;
      }

      this.localStartViewYear = Math.round(newDomainStart);
      this.localStopViewYear = Math.round(newDomainEnd);
      this.xViewScale.domain([this.localStartViewYear, this.localStopViewYear]);

      // Mettre à jour l'en-tête de la règle temporelle en direct
      this.updateTimelineHeader([this.localStartViewYear, this.localStopViewYear]);

      this.initialPointerX = currentClientX;
      this.initialDomain = [this.localStartViewYear, this.localStopViewYear];
    },

    onPointerEnd() {
      if (!this.moveGraphStarted) return;
      this.moveGraphStarted = false;
      this.$emit('data-loaded', 'timeline', {
        minYear: this.computedMinYear,
        maxYear: this.computedMaxYear,
        startViewYear: this.localStartViewYear,
        stopViewYear: this.localStopViewYear
      });
      this.drawTimeline();
    },

    updateTimelineHeader(newDomain) {
      const width = parseFloat(d3.select('#timeline-header').attr('width'));

      // Clear existing header content
      d3.select('#timeline-header').html('');
      
      // Create new header with updated domain
      this.drawTimelineHeader(width, this.graphMargin, newDomain[0], newDomain[1]);
    },

    clearTimeline () {
      // Clear existing content
      d3.select('#timeline-header').html('')
      d3.select('#timeline-graph').html('')

      // Clear some variables
      this.displayedPersons.clear()
      this.familyColorsMap.clear()
      this.renderedPersons.clear()
      this.coupleBridges.clear()
    },

    drawTimeline () {
      if (!this.isMounted || !this.isDataLoaded) {
        return;
      }

      // Clear existing content
      this.clearTimeline()

      // Set up SVG dimensions and scales
      this.setupGraphSvg()

      // 1. Draw historical context background (if enabled)
      if (this.showHistoryContext) {
        this.drawHistoricalContext(this.xViewScale, this.totalHeight)
      }

      // 2. Draw header
      this.drawTimelineHeader(this.timelineWidth, this.graphMargin, this.localStartViewYear, this.localStopViewYear)

      // 3. Draw grid background
      this.drawTimelineBackground(this.xViewScale, this.computedMinYear, this.computedMaxYear, this.totalHeight, this.graphMargin)

      // 4. Draw persons and their periods
      this.drawPersons(this.xViewScale)

      // 5. Draw marriage & couple bridges (registers coupleBridges)
      this.drawMarriageBridges(d3.select('#timeline-graph'), this.xViewScale)

      // 6. Draw family links (filiation parent-child attached to couple/parent at birth date)
      this.drawFamilyLinks(d3.select('#timeline-graph'), this.xViewScale)

      // 7. Ajustement doux du défilement lors d'un déploiement
      if (this.animatingExpansion && this.animatingExpansion.isExpanding) {
        const newlyAdded = []
        this.renderedPersons.forEach((data, id) => {
          if (this.animatingExpansion.prevIds && !this.animatingExpansion.prevIds.has(id)) {
            newlyAdded.push(data)
          }
        })

        if (newlyAdded.length > 0) {
          this.$nextTick(() => {
            const wrapper = document.getElementById('timeline-wrapper')
            if (wrapper) {
              const maxY = Math.max(...newlyAdded.map(d => d.yBottom || d.yCenter || 0))
              const minY = Math.min(...newlyAdded.map(d => d.yTop || d.yCenter || 0))
              const wrapperHeight = wrapper.clientHeight
              const currentScrollTop = wrapper.scrollTop

              if (maxY > currentScrollTop + wrapperHeight - 40) {
                wrapper.scrollTo({
                  top: Math.max(0, maxY - wrapperHeight + 80),
                  behavior: 'smooth'
                })
              } else if (minY < currentScrollTop + 20) {
                wrapper.scrollTo({
                  top: Math.max(0, minY - 40),
                  behavior: 'smooth'
                })
              }
            }
          })
        }

        setTimeout(() => {
          this.animatingExpansion = null
        }, 700)
      }
    },

    drawTimelineHeader (width, margin, yearStart, yearStop) {
      const headerHeight = 46;
      const timelineHeader = d3.select('#timeline-header')
        .attr('width', width)
        .attr('height', headerHeight)
        .html('')
        .append('g')
        .attr('transform', `translate(${margin.left}, 34)`)

      const xScale = d3.scaleLinear()
        .domain([yearStart, yearStop])
        .range([0, width])

      const xAxis = d3.axisTop(xScale).tickFormat(d3.format('d'))

      const axisGroup = timelineHeader.append('g')
        .attr('class', 'x axis')
        .call(xAxis)

      // Sleek baseline
      axisGroup.select('.domain')
        .attr('stroke', '#e2e8f0')
        .attr('stroke-width', 1.5)

      // Custom tick styling & modern typography
      axisGroup.selectAll('.tick').each(function(d) {
        const isCentury = d % 100 === 0;
        const isDecade = d % 10 === 0;
        const tick = d3.select(this);

        if (isCentury) {
          tick.select('line')
            .attr('y2', -9)
            .attr('stroke', '#2563eb')
            .attr('stroke-width', 2);
          tick.select('text')
            .attr('font-weight', '700')
            .attr('fill', '#2563eb')
            .attr('font-size', '12px')
            .attr('y', -12);
        } else if (isDecade) {
          tick.select('line')
            .attr('y2', -6)
            .attr('stroke', '#94a3b8')
            .attr('stroke-width', 1.5);
          tick.select('text')
            .attr('font-weight', '700')
            .attr('fill', '#0f172a')
            .attr('font-size', '11px')
            .attr('y', -10);
        } else {
          tick.select('line')
            .attr('y2', -4)
            .attr('stroke', '#cbd5e1')
            .attr('stroke-width', 1);
          tick.select('text')
            .attr('font-weight', '500')
            .attr('fill', '#64748b')
            .attr('font-size', '10px')
            .attr('y', -8);
        }
      });
    },

    drawTimelineBackground (xScale, yearStart, yearStop, height, margin) {
      // Create a scale for vertical lines every xx years
      let intervalYears = 5;
      if (window.innerWidth < 768) {
        intervalYears = 10;
      }

      const tickValues = d3.range(yearStart - intervalYears * 5, yearStop + intervalYears * 5, intervalYears);
      const xAxisTicks = d3.axisTop(xScale)
        .tickFormat('')
        .tickSize(-(height + margin.top))
        .tickValues(tickValues);

      // Add a group for the vertical lines
      const grahSvg = d3.select('#timeline-graph');
      const xAxisTicksGroup = grahSvg.append('g')
        .attr('class', 'grid-lines-group')
        .call(xAxisTicks);

      // remove border
      xAxisTicksGroup.select('path').remove();

      // Modify the style of the vertical lines: subtle solid grid lines
      xAxisTicksGroup.selectAll('line').each(function(d) {
        const isCentury = d % 100 === 0;
        const isDecade = d % 10 === 0;
        const line = d3.select(this);

        if (isCentury) {
          line
            .attr('stroke', '#cbd5e1')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', 'none')
            .attr('stroke-opacity', 0.8);
        } else if (isDecade) {
          line
            .attr('stroke', '#e2e8f0')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', 'none')
            .attr('stroke-opacity', 0.65);
        } else {
          line
            .attr('stroke', '#f1f5f9')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', 'none')
            .attr('stroke-opacity', 0.9);
        }
      });
    },

    drawRoundedRect (x, y, width, height, radius, roundLeft, roundRight) {
      let path = `M${x + (roundLeft ? radius : 0)},${y}`

      if (roundRight) {
        path += `H${x + width - radius}`
        path += `A${radius},${radius} 0 0 1 ${x + width},${y + radius}`
      } else {
        path += `H${x + width}`
      }

      path += `V${y + height - (roundRight ? radius : 0)}`

      if (roundRight) {
        path += `A${radius},${radius} 0 0 1 ${x + width - radius},${y + height}`
      }
      path += `H${x + (roundLeft ? radius : 0)}`

      if (roundLeft) {
        path += `A${radius},${radius} 0 0 1 ${x},${y + height - radius}`
      }
      path += `V${y + (roundLeft ? radius : 0)}`

      if (roundLeft) {
        path += `A${radius},${radius} 0 0 1 ${x + radius},${y}`
      }

      path += 'Z'

      return path
    },

    drawPersons (xScale) {
      const grahSvg = d3.select('#timeline-graph');
      let yPosition = 0
      const familyColor = null
      const isChild = false

      if (this.viewMode === 'all') {
        this.rootPersons = this.filterRootPersons()
        for (const person of this.rootPersons) {
          if (!this.displayedPersons.has(person.id)) {
            const personPeriods = this.getPeriods(person, familyColor, isChild)
            yPosition = this.drawPerson(person, personPeriods, grahSvg, yPosition, xScale)
            yPosition++
          }
        }
      } else {
        // Mode dynamique : identifier les racines parmi les personnes visibles
        const visibleIds = this.getDynamicVisiblePersonIds()
        const visiblePersons = this.dataPersons.filter(p => visibleIds.has(p.id))

        // Une racine visible est une personne dont aucun parent n'est dans l'ensemble visible
        const visibleRoots = visiblePersons.filter(p => {
          const parents = this.getPersonParents(p.id)
          return !parents.some(parent => visibleIds.has(parent.id))
        }).sort((a, b) => {
          const birthA = this.getYearFromDate(a.birth_date) || 9999
          const birthB = this.getYearFromDate(b.birth_date) || 9999
          return birthA - birthB
        })

        for (const person of visibleRoots) {
          if (!this.displayedPersons.has(person.id)) {
            const personPeriods = this.getPeriods(person, familyColor, isChild)
            yPosition = this.drawPerson(person, personPeriods, grahSvg, yPosition, xScale)
            yPosition++
          }
        }

        // Sécurité mode dynamique : dessiner toute personne visible restante
        for (const person of visiblePersons) {
          if (!this.displayedPersons.has(person.id)) {
            const personPeriods = this.getPeriods(person, familyColor, isChild)
            yPosition = this.drawPerson(person, personPeriods, grahSvg, yPosition, xScale)
            yPosition++
          }
        }
      }
    },

    drawPerson (person, periods, grahSvg, yPosition, xScale) {
      if (this.displayedPersons.has(person.id)) { return yPosition }

      // Extract birth and death years from the person object
      const birthYear = this.getYearFromDate(person.birth_date)

      // Draw each period as a segment of the timeline
      const topOffset = this.showHistoryContext ? 38 : 15
      const y = yPosition * this.barHeight / 2 + topOffset
      const height = 40
      const isUnfolded = this.isBarUnfolded(person.id)
      const isNewlyAdded = Boolean(
        this.animatingExpansion &&
        this.animatingExpansion.isExpanding &&
        this.animatingExpansion.prevIds &&
        !this.animatingExpansion.prevIds.has(person.id)
      )

      const personGroup = grahSvg.append('g')
        .attr('class', `person${isNewlyAdded ? ' person-newly-deployed' : ''}`)
        .attr('id', `person-bar-${person.id}`)
        .datum(person)
        .on('contextmenu', (event) => {
          event.preventDefault()
          event.stopPropagation()
          this.openContextMenu(person, event)
        })

      if (isNewlyAdded) {
        const animType = this.animatingExpansion.type
        const offsetY = animType === 'descendants' ? -18 : (animType === 'ascendants' ? 18 : 0)
        const offsetX = animType === 'spouses' ? -25 : 0

        personGroup
          .attr('transform', `translate(${offsetX}, ${y + offsetY})`)
          .style('opacity', 0)
          .transition()
          .duration(550)
          .ease(d3.easeCubicOut)
          .attr('transform', `translate(0, ${y})`)
          .style('opacity', 1)
      } else {
        personGroup.attr('transform', `translate(0, ${y})`)
      }

      // URL de l'image : photo réelle si disponible, sinon générique selon le genre
      const dataUrl = import.meta.env.MODE === 'development'
        ? import.meta.env.VITE_DATA_URL
        : '/data'
      const imageUrl = person.picture
        ? dataUrl + person.picture
        : (person.gender === 'Male' ? 'profile_men.png' : 'profile_women.png')

      const pillWidth = 175
      const avatarCx = xScale(birthYear) + 20
      const isDynamicRoot = this.viewMode === 'dynamic' && person.id === this.dynamicRootPersonId
      const fullName = `${person.first_name} ${person.last_name}`

      if (!isUnfolded) {
        // ── MODE COMPACT (par défaut) ─────────────────────────────────────────
        // Pastille arrondie centrée sur la date de naissance
        const pillX = xScale(birthYear)
        const pillRadius = height / 2

        // Fond et ombre de la pastille compacte
        personGroup.append('rect')
          .attr('class', 'person-compact-pill')
          .attr('x', pillX)
          .attr('y', y)
          .attr('width', pillWidth)
          .attr('height', height)
          .attr('rx', pillRadius)
          .attr('ry', pillRadius)
          .attr('fill', periods.length > 0 ? periods[0].color : '#e2e8f0')
          .attr('stroke', 'rgba(255, 255, 255, 0.35)')
          .attr('stroke-width', 1.5)
          .style('cursor', 'pointer')
          .style('filter', 'drop-shadow(0 3px 8px rgba(15, 23, 42, 0.14))')
          .on('click', () => this.togglePersonBar(person.id))

        // Ligne de surbrillance supérieure discrète (effet de verre/volume)
        personGroup.append('line')
          .attr('x1', pillX + pillRadius)
          .attr('y1', y + 1.5)
          .attr('x2', pillX + pillWidth - pillRadius)
          .attr('y2', y + 1.5)
          .attr('stroke', 'rgba(255, 255, 255, 0.4)')
          .attr('stroke-width', 1)
          .attr('stroke-linecap', 'round')
          .style('pointer-events', 'none')

        // Cercle blanc derrière l'avatar pour le détacher nettement
        personGroup.append('circle')
          .attr('cx', avatarCx)
          .attr('cy', y + height / 2)
          .attr('r', 16)
          .attr('fill', '#ffffff')
          .attr('stroke', isDynamicRoot ? '#2563eb' : '#ffffff')
          .attr('stroke-width', isDynamicRoot ? 3 : 2.5)
          .style('filter', isDynamicRoot ? 'drop-shadow(0 0 6px rgba(37, 99, 235, 0.45))' : 'drop-shadow(0 2px 5px rgba(15, 23, 42, 0.2))')
          .style('cursor', 'pointer')
          .on('click', (event) => {
            event.preventDefault()
            event.stopPropagation()
            this.openContextMenu(person, event)
          })
          .on('contextmenu', (event) => {
            event.preventDefault()
            event.stopPropagation()
            this.openContextMenu(person, event)
          })

        // Prénom et nom
        const displayName = fullName.length > 13 ? fullName.substring(0, 13) + '…' : fullName

        // Avatar (image de profil)
        const avatarImage = personGroup.append('image')
          .attr('xlink:href', imageUrl)
          .attr('x', avatarCx - 15)
          .attr('y', y + height / 2 - 15)
          .attr('width', 30)
          .attr('height', 30)
          .attr('clip-path', 'circle(15px at 15px 15px)')
          .style('cursor', 'pointer')
          .on('click', (event) => {
            event.preventDefault()
            event.stopPropagation()
            this.openContextMenu(person, event)
          })
          .on('contextmenu', (event) => {
            event.preventDefault()
            event.stopPropagation()
            this.openContextMenu(person, event)
          })

        avatarImage.append('title').text(isDynamicRoot ? `${fullName} (${this.$t('tree-root') || 'Racine de l\'arbre'})` : fullName)

        // Prénom et nom (texte blanc net avec ombre portée pour lisibilité parfaite sur toutes couleurs)
        personGroup.append('text')
          .attr('x', avatarCx + 22)
          .attr('y', y + height / 2)
          .attr('dy', '.35em')
          .attr('text-anchor', 'start')
          .attr('font-size', '12px')
          .attr('font-weight', '700')
          .attr('font-family', 'var(--ft-font)')
          .attr('fill', '#ffffff')
          .style('text-shadow', '0 1px 2px rgba(0, 0, 0, 0.45)')
          .style('user-select', 'none')
          .style('cursor', 'pointer')
          .text(displayName)
          .on('click', () => this.togglePersonBar(person.id))

        // Bouton déplier élégant à l'extrémité droite avec chevron SVG
        const expandBtn = personGroup.append('g')
          .attr('class', 'expand-btn-group')
          .attr('transform', `translate(${pillX + pillWidth - 14}, ${y + height / 2})`)
          .style('cursor', 'pointer')
          .on('mousedown', (event) => {
            event.preventDefault()
            event.stopPropagation()
          })
          .on('touchstart', (event) => {
            event.preventDefault()
            event.stopPropagation()
          })
          .on('click', (event) => {
            event.preventDefault()
            event.stopPropagation()
            this.togglePersonBar(person.id)
          })

        // Zone de clic étendue transparente
        expandBtn.append('circle')
          .attr('r', 14)
          .attr('fill', 'transparent')
          .style('cursor', 'pointer')

        expandBtn.append('circle')
          .attr('class', 'expand-btn-bg')
          .attr('r', 8.5)
          .attr('fill', 'rgba(255, 255, 255, 0.22)')
          .attr('stroke', 'rgba(255, 255, 255, 0.45)')
          .attr('stroke-width', 1)

        expandBtn.append('path')
          .attr('class', 'expand-toggle-icon')
          .attr('d', 'M -1.5,-3 L 1.8,0 L -1.5,3')
          .attr('fill', 'none')
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 1.8)
          .attr('stroke-linecap', 'round')
          .attr('stroke-linejoin', 'round')

        expandBtn.append('title').text('Déplier la barre de vie')
      } else {
        // ── MODE DÉPLIÉ (barre de vie complète) ───────────────────────────────
        // Groupe pour les tranches temporelles de la personne
        const periodsGroup = personGroup.append('g').attr('class', 'person-periods-group')

        // Tracé de chaque période avec extrémités arrondies et bordures douces
        periods.forEach((period, pIndex) => {
          const x = xScale(period.start)
          const width = xScale(period.end) - xScale(period.start)

          let filter = 'none'
          if (!period.birthDateVerified || !period.deathDateVerified) {
            filter = 'url(#blur-filter)'
          }

          const roundLeft = pIndex === 0
          const roundRight = pIndex === periods.length - 1
          const radius = Math.max(0, Math.min(height / 2, width / 2, 8))

          const periodPath = periodsGroup.append('path')
            .attr('class', 'person-period' + (period.isRelationship ? ' period-relationship' : ''))
            .attr('d', this.drawRoundedRect(x, y, width, height, radius, roundLeft, roundRight))
            .attr('fill', period.color)
            .attr('stroke', 'rgba(255, 255, 255, 0.25)')
            .attr('stroke-width', 1)
            .style('cursor', 'pointer')
            .style('filter', filter)
            .on('click', () => this.showPersonProfile(person))

          // Ligne de brillance subtile sur le dessus de la période
          if (width > 6) {
            const hx1 = x + (roundLeft ? radius : 0)
            const hx2 = x + width - (roundRight ? radius : 0)
            if (hx2 > hx1) {
              periodsGroup.append('line')
                .attr('x1', hx1)
                .attr('y1', y + 1)
                .attr('x2', hx2)
                .attr('y2', y + 1)
                .attr('stroke', 'rgba(255, 255, 255, 0.35)')
                .attr('stroke-width', 1)
                .attr('stroke-linecap', 'round')
                .style('pointer-events', 'none')
            }
          }

          if (period.isRelationship) {
            const isCivil = period.relationshipType === 'civil_union'
            const typeLabel = period.relationshipType === 'marriage' ? 'Mariage' : (isCivil ? 'Union civile' : 'Union')
            const periodDates = period.divorceYear ? `(${period.start} - ${period.divorceYear})` : `(depuis ${period.start})`
            const unionEv = person.events ? person.events.find(e => ['marriage', 'mariage', 'civil union', 'civil_union', 'union civile', 'union_civile'].includes((e.event_type || '').toLowerCase()) && e.event_place) : null
            const placeSuffix = (unionEv && unionEv.event_place) ? `\n📍 ${unionEv.event_place}` : ''
            const relTooltip = `${isCivil ? '📜' : '💍'} ${typeLabel} avec ${period.spouseName} ${periodDates}${placeSuffix}`
            periodPath.append('title').text(relTooltip)

            // Badge bijou raffiné avec alliances dorées ou azur au début de la tranche d'union
            if (width >= 28) {
              const ringG = periodsGroup.append('g')
                .attr('class', 'marriage-bar-badge')
                .attr('transform', `translate(${x + 15}, ${y + height / 2})`)
                .style('cursor', 'pointer')
                .on('click', () => this.showPersonProfile(person))

              // Capsule badge de fond
              ringG.append('rect')
                .attr('x', -13)
                .attr('y', -9)
                .attr('width', 26)
                .attr('height', 18)
                .attr('rx', 9)
                .attr('fill', 'rgba(255, 255, 255, 0.92)')
                .attr('stroke', isCivil ? 'rgba(59, 130, 246, 0.5)' : 'rgba(245, 158, 11, 0.5)')
                .attr('stroke-width', 1)
                .style('filter', 'drop-shadow(0 1px 3px rgba(0,0,0,0.15))')

              // Deux anneaux entrelacés
              ringG.append('circle').attr('cx', -3.2).attr('cy', 0).attr('r', 4.2).attr('fill', 'none').attr('stroke', isCivil ? '#2563eb' : '#d97706').attr('stroke-width', 1.8)
              ringG.append('circle').attr('cx', 3.2).attr('cy', 0).attr('r', 4.2).attr('fill', 'none').attr('stroke', isCivil ? '#3b82f6' : '#f59e0b').attr('stroke-width', 1.8)
              ringG.append('title').text(relTooltip)
            }
          }
        })

        // Cercle de fond blanc pour détacher l'avatar
        personGroup.append('circle')
          .attr('cx', avatarCx)
          .attr('cy', y + height / 2)
          .attr('r', 16)
          .attr('fill', '#ffffff')
          .attr('stroke', isDynamicRoot ? '#2563eb' : '#ffffff')
          .attr('stroke-width', isDynamicRoot ? 3 : 2.5)
          .style('filter', isDynamicRoot ? 'drop-shadow(0 0 6px rgba(37, 99, 235, 0.45))' : 'drop-shadow(0 2px 6px rgba(15, 23, 42, 0.22))')
          .style('cursor', 'pointer')
          .on('click', (event) => {
            event.preventDefault()
            event.stopPropagation()
            this.openContextMenu(person, event)
          })
          .on('contextmenu', (event) => {
            event.preventDefault()
            event.stopPropagation()
            this.openContextMenu(person, event)
          })

        // Avatar (image de profil)
        const avatarImageExp = personGroup.append('image')
          .attr('xlink:href', imageUrl)
          .attr('x', avatarCx - 15)
          .attr('y', y + height / 2 - 15)
          .attr('fill', 'none')
          .attr('width', 30)
          .attr('height', 30)
          .attr('clip-path', 'circle(15px at 15px 15px)')
          .style('cursor', 'pointer')
          .on('click', (event) => {
            event.preventDefault()
            event.stopPropagation()
            this.openContextMenu(person, event)
          })
          .on('contextmenu', (event) => {
            event.preventDefault()
            event.stopPropagation()
            this.openContextMenu(person, event)
          })

        avatarImageExp.append('title').text(isDynamicRoot ? `${fullName} (${this.$t('tree-root') || 'Racine de l\'arbre'})` : fullName)

        // Nom de la personne sur la barre (texte blanc net avec ombre)
        personGroup.append('text')
          .attr('class', 'person-bar-name')
          .attr('x', xScale(birthYear) + 44)
          .attr('y', y + height / 2)
          .attr('dy', '.35em')
          .attr('text-anchor', 'start')
          .attr('font-size', '13px')
          .attr('font-weight', '700')
          .attr('font-family', 'var(--ft-font)')
          .attr('fill', '#ffffff')
          .style('text-shadow', '0 1px 2px rgba(0, 0, 0, 0.45)')
          .text(fullName)
          .style('cursor', 'pointer')
          .style('user-select', 'none')
          .on('click', () => this.showPersonProfile(person))

        // Dates vitales et âge affichés à l'extrémité droite de la barre si l'espace le permet
        const lastPeriod = periods[periods.length - 1]
        const totalBarWidth = lastPeriod ? (xScale(lastPeriod.end) - xScale(birthYear)) : 0
        const barEndPixel = lastPeriod ? xScale(lastPeriod.end) : (xScale(birthYear) + 180)

        if (totalBarWidth >= 200) {
          const bYear = this.getYearFromDate(person.birth_date)
          const dYear = person.death_date ? this.getYearFromDate(person.death_date) : null
          let vitalText = ''
          if (bYear && dYear) {
            const age = dYear - bYear
            vitalText = totalBarWidth >= 260 ? `${bYear} – ${dYear} (${age} ans)` : `${bYear} – ${dYear}`
          } else if (bYear && person.death_date === null) {
            const currentYear = new Date().getFullYear()
            const age = currentYear - bYear
            vitalText = totalBarWidth >= 260 ? `depuis ${bYear} (${age} ans)` : `depuis ${bYear}`
          } else if (bYear) {
            vitalText = `${bYear} – …`
          }

          if (vitalText) {
            personGroup.append('text')
              .attr('class', 'person-bar-dates')
              .attr('x', barEndPixel - 14)
              .attr('y', y + height / 2)
              .attr('dy', '.35em')
              .attr('text-anchor', 'end')
              .attr('font-size', '11px')
              .attr('font-weight', '600')
              .attr('font-family', 'var(--ft-font)')
              .attr('fill', 'rgba(255, 255, 255, 0.9)')
              .style('text-shadow', '0 1px 2px rgba(0, 0, 0, 0.45)')
              .style('user-select', 'none')
              .style('pointer-events', 'none')
              .text(vitalText)
          }
        }

        // Bouton de repli élégant avec chevron SVG à l'extrémité droite de la barre
        const collapseX = lastPeriod ? xScale(lastPeriod.end) + 6 : xScale(birthYear) + 180
        const collapseBtn = personGroup.append('g')
          .attr('class', 'collapse-btn-group')
          .attr('transform', `translate(${collapseX + 11}, ${y + height / 2})`)
          .style('cursor', 'pointer')
          .on('mousedown', (event) => {
            event.preventDefault()
            event.stopPropagation()
          })
          .on('touchstart', (event) => {
            event.preventDefault()
            event.stopPropagation()
          })
          .on('click', (event) => {
            event.preventDefault()
            event.stopPropagation()
            this.togglePersonBar(person.id)
          })

        // Zone de clic étendue transparente (facilite grandement le clic sans bouger)
        collapseBtn.append('circle')
          .attr('r', 16)
          .attr('fill', 'transparent')
          .style('cursor', 'pointer')

        collapseBtn.append('circle')
          .attr('class', 'collapse-btn-bg')
          .attr('r', 10)
          .attr('fill', '#ffffff')
          .attr('stroke', '#cbd5e1')
          .attr('stroke-width', 1.2)
          .style('filter', 'drop-shadow(0 1px 3px rgba(15, 23, 42, 0.12))')

        collapseBtn.append('path')
          .attr('class', 'collapse-toggle-icon')
          .attr('d', 'M 1.5,-3.5 L -2,0 L 1.5,3.5')
          .attr('fill', 'none')
          .attr('stroke', '#64748b')
          .attr('stroke-width', 1.6)
          .attr('stroke-linecap', 'round')
          .attr('stroke-linejoin', 'round')

        collapseBtn.append('title').text('Replier la barre de vie')
      }

      // set this person as displayed to avoid duplication
      this.displayedPersons.add(person.id)

      // Store rendered coordinates for family links and search focus
      const actualYTop = y * 2
      const actualYBottom = actualYTop + height
      const actualYCenter = actualYTop + height / 2
      const avatarCenterX = xScale(birthYear) + 20
      const avatarLeftX   = xScale(birthYear) + 4

      // Position X de fin de barre (en pixels) — pour le pont de mariage
      // Compact : fin du pill fixe ; Déplié : fin de la dernière période
      const barEndX = isUnfolded
        ? (() => { const lp = periods[periods.length - 1]; return lp?.end ? xScale(lp.end) : null })()
        : xScale(birthYear) + pillWidth



      this.renderedPersons.set(person.id, {
        id: person.id,
        person: person,
        yPosition: yPosition,
        yTop: actualYTop,
        yCenter: actualYCenter,
        yBottom: actualYBottom,
        birthYear: birthYear,
        anchorXOut: avatarCenterX,
        anchorXIn:  avatarLeftX,
        deathYear: this.getYearFromDate(person.death_date),
        barEndYear: periods.length > 0 ? (periods[periods.length - 1].end ?? null) : null,
        barEndX: barEndX,
        isUnfolded: isUnfolded
      })

      // draw other associated persons
      const spouses = this.filterSpouses(person.id)
      const visibleIds = this.viewMode === 'dynamic' ? this.getDynamicVisiblePersonIds() : null

      if (spouses.length === 0 ) {
        const familyNoSpouseColor = this.familyColorsMap.get(this.getFamilyKey(person.id, 0))
        const isChild = true
        const children = this.filterChildrenNoSpouse(person.id)
        const sortedNoSpouse = [...children].sort((a, b) => {
          const birthA = this.getYearFromDate(a.birth_date) || 9999
          const birthB = this.getYearFromDate(b.birth_date) || 9999
          return birthA - birthB
        })
        for (const child of sortedNoSpouse) {
          const shouldDrawChild = this.viewMode === 'all' || (visibleIds && visibleIds.has(child.id))
          if (shouldDrawChild && !this.displayedPersons.has(child.id)) {
            const childPeriods = this.getPeriods(child, familyNoSpouseColor, isChild)
            yPosition = this.drawPerson(child, childPeriods, grahSvg, yPosition + 1, xScale)
          }
        }
      }
      for (const spouse of spouses) {
        const familyColor = this.familyColorsMap.get(this.getFamilyKey(person.id, spouse.id))
        let isChild = false

        // draw oldest ancestor of spouse (only in 'all' mode, or if spouse's ancestors were expanded)
        if (this.viewMode === 'all' || (visibleIds && this.expandedAscendantIds.has(spouse.id))) {
          const oldestAncestor = this.filterOldestAncestor(spouse.id)
          if (oldestAncestor.id !== spouse.id) {
            const shouldDrawOldest = this.viewMode === 'all' || (visibleIds && visibleIds.has(oldestAncestor.id))
            if (shouldDrawOldest && !this.displayedPersons.has(oldestAncestor.id)) {
              const oldestAncestorPeriods = this.getPeriods(oldestAncestor, familyColor, isChild)
              yPosition = this.drawPerson(oldestAncestor, oldestAncestorPeriods, grahSvg, yPosition + 1, xScale)
            }
          }
        }

        // draw the spouse
        const shouldDrawSpouse = this.viewMode === 'all' || (visibleIds && visibleIds.has(spouse.id))
        if (shouldDrawSpouse && !this.displayedPersons.has(spouse.id)) {
          const spousePeriods = this.getPeriods(spouse, familyColor, isChild)
          yPosition = this.drawPerson(spouse, spousePeriods, grahSvg, yPosition + 1, xScale)
        }

        // draw children sorted chronologically by birth date
        const children = this.filterChildren(person.id, spouse.id)
        const hasVisibleChild = visibleIds ? children.some(c => visibleIds.has(c.id)) : false
        const shouldDrawChildren = this.viewMode === 'all' || hasVisibleChild
        if (shouldDrawChildren) {
          const sortedChildren = [...children].sort((a, b) => {
            const birthA = this.getYearFromDate(a.birth_date) || 9999
            const birthB = this.getYearFromDate(b.birth_date) || 9999
            return birthA - birthB
          })

          for (const child of sortedChildren) {
            const shouldDrawThisChild = this.viewMode === 'all' || (visibleIds && visibleIds.has(child.id))
            if (shouldDrawThisChild && !this.displayedPersons.has(child.id)) {
              isChild = true
              const childPeriods = this.getPeriods(child, familyColor, isChild)
              yPosition = this.drawPerson(child, childPeriods, grahSvg, yPosition + 1, xScale)
            }
          }
        }
      }
      return yPosition
    },

    showPersonProfile (person) {
      this.selectedPerson = person
      if (!this.isProfileSidebarOpen) {
        this.isProfileSidebarOpen = true
        this.$nextTick(() => {
          this.drawTimeline()
        })
      }
    },

    toggleProfileSidebar () {
      this.isProfileSidebarOpen = !this.isProfileSidebarOpen
      if (this.isProfileSidebarOpen && !this.selectedPerson && this.dataPersons && this.dataPersons.length > 0) {
        this.selectedPerson = this.dataPersons.find(p => p.id === this.dynamicRootPersonId) || this.dataPersons[0]
      }
      this.$nextTick(() => {
        this.drawTimeline()
      })
    },

    closeProfileSidebar () {
      this.isProfileSidebarOpen = false
      this.$nextTick(() => {
        this.drawTimeline()
      })
    },

    isBarUnfolded (personId) {
      return this.unfoldedPersonIds.has(personId)
    },

    togglePersonBar (personId, forceShowProfile = false) {
      const newSet = new Set(this.unfoldedPersonIds)
      const isUnfolding = !newSet.has(personId)
      if (!isUnfolding) {
        newSet.delete(personId)
      } else {
        newSet.add(personId)
      }
      this.unfoldedPersonIds = newSet
      if (isUnfolding || forceShowProfile) {
        const person = (this.dataPersons || []).find(p => p.id === personId)
        if (person) {
          this.selectedPerson = person
          this.isProfileSidebarOpen = true
        }
      }
      this.applyScaleBounds()
      this.$emit('data-loaded', 'timeline', {
        minYear: this.computedMinYear,
        maxYear: this.computedMaxYear,
        startViewYear: this.localStartViewYear,
        stopViewYear: this.localStopViewYear
      })
      this.drawTimeline()
    },

    toggleAllBars () {
      if (this.unfoldedPersonIds.size === 0) {
        // Tout déplier : ajouter toutes les personnes affichées
        this.unfoldedPersonIds = new Set(this.renderedPersons.keys())
      } else {
        // Tout replier
        this.unfoldedPersonIds = new Set()
      }
      this.applyScaleBounds()
      this.$emit('data-loaded', 'timeline', {
        minYear: this.computedMinYear,
        maxYear: this.computedMaxYear,
        startViewYear: this.localStartViewYear,
        stopViewYear: this.localStopViewYear
      })
      this.drawTimeline()
    },

    refreshPersonProfile (person) {
      this.selectedPerson = person
    },

    toggleHistoryContext () {
      this.showHistoryContext = !this.showHistoryContext
      this.drawTimeline()
    },

    clearSearch () {
      this.searchQuery = ''
      this.isSearchOpen = false
    },

    selectFirstResult () {
      if (this.filteredPersons && this.filteredPersons.length > 0) {
        this.focusPerson(this.filteredPersons[0])
      }
    },

    getPersonAvatar (person) {
      if (!person) return 'profile_men.png'
      if (person.picture) {
        const dataUrl = import.meta.env.MODE === 'development'
          ? (import.meta.env.VITE_DATA_URL || '/data')
          : '/data'
        return dataUrl + person.picture
      }
      return person.gender === 'Male' ? 'profile_men.png' : 'profile_women.png'
    },

    focusPerson (person) {
      this.searchQuery = `${person.first_name} ${person.last_name}`
      this.isSearchOpen = false
      this.selectedPerson = person

      if (this.viewMode === 'dynamic') {
        this.setDynamicRootPerson(person.id)
      } else {
        const birthYear = this.getYearFromDate(person.birth_date)
        const deathYear = this.getYearFromDate(person.death_date) || (birthYear ? birthYear + 70 : 2000)

        // 1. Adapter le domaine temporel si la personne est hors champ
        let needRedraw = false
        if (birthYear && (birthYear < this.localStartViewYear || birthYear > this.localStopViewYear)) {
          const margin = 25
          this.localStartViewYear = Math.max(this.computedMinYear, Math.floor((birthYear - margin) / 10) * 10)
          this.localStopViewYear = Math.min(this.computedMaxYear, Math.ceil((deathYear + margin) / 10) * 10)
          needRedraw = true
        }

        if (needRedraw) {
          this.drawTimeline()
        }
      }

      // 2. Scroll vertical jusqu'à la personne et mise en lumière
      this.$nextTick(() => {
        const pData = this.renderedPersons.get(person.id)
        if (pData) {
          const container = document.getElementById('timeline-graph-container')
          if (container) {
            container.scrollTo({
              top: Math.max(0, pData.yTop - 120),
              behavior: 'smooth'
            })
          }

          // Effet de halo / pulsation
          const el = document.getElementById(`person-bar-${person.id}`)
          if (el) {
            el.classList.remove('person-highlighted')
            void el.offsetWidth // forcer reflow
            el.classList.add('person-highlighted')
            setTimeout(() => {
              el.classList.remove('person-highlighted')
            }, 4000)
          }
        }
      })
    },

    drawHistoricalContext (xScale, height) {
      const graphSvg = d3.select('#timeline-graph')
      const historyGroup = graphSvg.append('g').attr('class', 'history-context-layer')

      const isEn = this.$i18n && this.$i18n.locale === 'en'
      const ribbonHeight = 26

      // Définitions SVG pour les dégradés et les clipPaths
      let defs = graphSvg.select('defs.history-defs')
      if (defs.empty()) {
        defs = graphSvg.append('defs').attr('class', 'history-defs')
      }

      this.historicalPeriods.forEach((period, index) => {
        const xStart = xScale(period.startYear)
        const xEnd = xScale(period.endYear)
        const width = xEnd - xStart

        if (xEnd > 0 && xStart < this.timelineWidth && width > 0) {
          const clampedX = Math.max(0, xStart)
          const clampedWidth = Math.min(this.timelineWidth - clampedX, width - (clampedX - xStart))

          const fullName = isEn ? period.nameEn : period.nameFr
          const fullLabelWithDates = `${fullName} (${period.startYear}–${period.endYear})`

          // 1. Dégradé vertical tout en douceur pour la colonne pleine hauteur
          const gradId = `hist-col-grad-${period.id}`
          const grad = defs.append('linearGradient')
            .attr('id', gradId)
            .attr('x1', '0%').attr('y1', '0%')
            .attr('x2', '0%').attr('y2', '100%')

          grad.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', period.borderColor)
            .attr('stop-opacity', 0.12)

          grad.append('stop')
            .attr('offset', '35%')
            .attr('stop-color', period.borderColor)
            .attr('stop-opacity', 0.04)

          grad.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', period.borderColor)
            .attr('stop-opacity', 0.01)

          // Colonne de fond avec dégradé subtil
          const band = historyGroup.append('rect')
            .attr('class', 'history-band')
            .attr('x', clampedX)
            .attr('y', ribbonHeight)
            .attr('width', clampedWidth)
            .attr('height', Math.max(0, height - ribbonHeight))
            .attr('fill', `url(#${gradId})`)
            .style('cursor', 'default')

          band.append('title').text(fullLabelWithDates)

          // Ligne séparatrice verticale fine au début de la période
          if (xStart >= 0 && xStart <= this.timelineWidth) {
            historyGroup.append('line')
              .attr('class', 'history-separator-line')
              .attr('x1', xStart)
              .attr('y1', 0)
              .attr('x2', xStart)
              .attr('y2', height)
              .attr('stroke', period.borderColor)
              .attr('stroke-width', 1)
              .attr('stroke-opacity', 0.35)
              .attr('stroke-dasharray', '3,3')
          }

          // 2. Segment de ruban supérieur (Historical Era Ribbon)
          if (clampedWidth >= 16) {
            const ribbonGroup = historyGroup.append('g')
              .attr('class', 'history-ribbon-segment')
              .attr('transform', `translate(${clampedX}, 0)`)
              .style('cursor', 'default')

            // Clip path pour éviter tout débordement de texte
            const clipId = `hist-clip-${period.id}-${index}`
            defs.append('clipPath')
              .attr('id', clipId)
              .append('rect')
              .attr('x', 0)
              .attr('y', 0)
              .attr('width', clampedWidth)
              .attr('height', ribbonHeight)

            // Fond du segment de ruban
            ribbonGroup.append('rect')
              .attr('class', 'history-ribbon-bg')
              .attr('x', 0)
              .attr('y', 0)
              .attr('width', clampedWidth)
              .attr('height', ribbonHeight)
              .attr('fill', period.color)
              .attr('stroke', '#e2e8f0')
              .attr('stroke-width', 1)

            // Accent bar supérieure colorée (3px)
            ribbonGroup.append('rect')
              .attr('class', 'history-ribbon-accent')
              .attr('x', 0)
              .attr('y', 0)
              .attr('width', clampedWidth)
              .attr('height', 3)
              .attr('fill', period.borderColor)

            // Libellé textuel intelligent : mesure précise pour ne JAMAIS couper ni déborder sur les barres verticales
            const displayText = this.getFittingHistoricalText(period, clampedWidth, isEn)

            if (displayText) {
              const textEl = ribbonGroup.append('text')
                .attr('class', 'history-ribbon-text')
                .attr('x', 8)
                .attr('y', 14.5)
                .attr('dominant-baseline', 'central')
                .attr('clip-path', `url(#${clipId})`)
                .attr('font-size', '11px')
                .attr('font-weight', '600')
                .attr('letter-spacing', '0.15px')
                .attr('fill', '#334155')
                .attr('font-family', 'var(--ft-font)')
                .style('user-select', 'none')
                .text(displayText)

              textEl.append('title').text(fullLabelWithDates)
            }

            ribbonGroup.append('title').text(fullLabelWithDates)
          }
        }
      })

      // Ligne continue sous le ruban
      historyGroup.append('line')
        .attr('class', 'history-ribbon-bottom-border')
        .attr('x1', 0)
        .attr('y1', ribbonHeight)
        .attr('x2', this.timelineWidth)
        .attr('y2', ribbonHeight)
        .attr('stroke', '#cbd5e1')
        .attr('stroke-width', 1)
    },

    getFittingHistoricalText (period, clampedWidth, isEn) {
      // Marge de sécurité de 8px de chaque côté (16px au total) pour préserver un espace net
      // avec les séparateurs verticaux de début et de fin d'époque
      const availWidth = clampedWidth - 16
      if (availWidth < 20) {
        return ''
      }

      const fullName = isEn ? period.nameEn : period.nameFr
      const shortName = isEn ? (period.shortNameEn || period.nameEn) : (period.shortNameFr || period.nameFr)
      const font = '600 11px Inter, system-ui, -apple-system, sans-serif'

      const candidates = [
        `${fullName} (${period.startYear}–${period.endYear})`,
        `${fullName}`,
        `${shortName} (${period.startYear}–${period.endYear})`,
        `${shortName}`,
        `${period.startYear}–${period.endYear}`,
        `${period.startYear}`
      ]

      for (const cand of candidates) {
        if (this.measureTextWidth(cand, font) <= availWidth) {
          return cand
        }
      }

      // Si l'espace est encore suffisant (>= 32px), tronquer proprement avec ellipse (…)
      if (availWidth >= 32) {
        let truncated = shortName
        while (truncated.length > 2 && this.measureTextWidth(truncated + '…', font) > availWidth) {
          truncated = truncated.slice(0, -1).trim()
        }
        if (truncated.length > 2) {
          return truncated + '…'
        }
      }

      return ''
    },

    measureTextWidth (text, font = '600 11px sans-serif') {
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        if (navigator && navigator.userAgent && navigator.userAgent.includes('jsdom')) {
          return text.length * 7.2
        }
        if (!this._measureCanvas) {
          this._measureCanvas = document.createElement('canvas')
        }
        if (this._measureCanvas) {
          try {
            const ctx = this._measureCanvas.getContext && this._measureCanvas.getContext('2d')
            if (ctx) {
              ctx.font = font
              return ctx.measureText(text).width
            }
          } catch {
            // fallback
          }
        }
      }
      return text.length * 7.2
    },

    drawMarriageBridges (graphSvg, xScale) {
      // Couche dessinée derrière les barres de vie
      const firstPerson = graphSvg.select('.person')
      const bridgeLayer = firstPerson.node()
        ? graphSvg.insert('g', '.person').attr('class', 'marriage-bridge-layer')
        : graphSvg.append('g').attr('class', 'marriage-bridge-layer')

      const processed = new Set()
      this.coupleBridges.clear()

      this.renderedPersons.forEach((personData) => {
        const spouses = this.filterSpouses(personData.id)
        if (!spouses || spouses.length === 0) return

        spouses.forEach(spouse => {
          const spouseData = this.renderedPersons.get(spouse.id)
          if (!spouseData) return

          // Ne traiter chaque couple qu'une seule fois
          const pairKey = [personData.id, spouse.id].sort().join('-')
          if (processed.has(pairKey)) return
          processed.add(pairKey)

          // Date de début et segments du pont :
          const segments = []
          const mDate = this.getYearFromDate(spouse.marriage_date)
          const uDate = this.getYearFromDate(spouse.civil_union_date)

          if (uDate && mDate && uDate < mDate) {
            segments.push({
              startYear: uDate,
              endYearMax: mDate,
              type: 'civil_union',
              label: 'Union civile'
            })
            segments.push({
              startYear: mDate,
              endYearMax: null,
              type: 'marriage',
              label: 'Mariage'
            })
          } else if (uDate && !mDate) {
            segments.push({
              startYear: uDate,
              endYearMax: null,
              type: 'civil_union',
              label: 'Union civile'
            })
          } else if (mDate) {
            segments.push({
              startYear: mDate,
              endYearMax: null,
              type: 'marriage',
              label: 'Mariage'
            })
          } else {
            // Si pas de mariage ni union civile, débuter dès le 1er enfant commun (coparentalité / union libre)
            const commonChildren = this.filterChildren(personData.id, spouse.id)
            if (commonChildren && commonChildren.length > 0) {
              const sortedKids = [...commonChildren].sort((a, b) => {
                const bA = this.getYearFromDate(a.birth_date) || 9999
                const bB = this.getYearFromDate(b.birth_date) || 9999
                return bA - bB
              })
              const kYear = this.getYearFromDate(sortedKids[0].birth_date)
              if (kYear) {
                segments.push({
                  startYear: kYear,
                  endYearMax: null,
                  type: 'union',
                  label: 'Union'
                })
              }
            }
          }

          if (segments.length === 0) return

          const overallStartYear = segments[0].startYear

          // Date de fin (divorce, séparation, ou décès du premier conjoint)
          const divorceYear = this.getYearFromDate(spouse.divorce_date || spouse.civil_separation_date)

          // Fin de la bande : position X en pixels de la fin de chaque barre
          const fallbackX = xScale(this.localStopViewYear)
          const xEndPerson = personData.barEndX ?? fallbackX
          const xEndSpouse = spouseData.barEndX ?? fallbackX

          let xEndTotal = Math.min(xEndPerson, xEndSpouse)
          if (divorceYear) {
            xEndTotal = Math.min(xEndTotal, xScale(divorceYear))
          }

          // Si un des conjoints est décédé, s'arrêter au premier décès
          const spouseDeathYear = spouseData.deathYear
          const personDeathYear = personData.deathYear
          if (spouseDeathYear && personDeathYear) {
            xEndTotal = Math.min(xEndTotal, xScale(Math.min(spouseDeathYear, personDeathYear)))
          } else if (spouseDeathYear) {
            xEndTotal = Math.min(xEndTotal, xScale(spouseDeathYear))
          } else if (personDeathYear) {
            xEndTotal = Math.min(xEndTotal, xScale(personDeathYear))
          }

          const overallXStart = xScale(overallStartYear)
          if (xEndTotal <= overallXStart) return

          // Déterminer qui est en haut et qui est en bas
          const topData    = personData.yCenter <= spouseData.yCenter ? personData : spouseData
          const bottomData = personData.yCenter <= spouseData.yCenter ? spouseData : personData

          // Gap entre les deux barres
          const gapTop    = topData.yBottom     // bas de la barre du haut
          const gapBottom = bottomData.yTop      // haut de la barre du bas
          const gapHeight = gapBottom - gapTop
          const gapCenterY = (gapTop + gapBottom) / 2

          // Pas de gap visible → rien à dessiner
          if (gapHeight <= 0) return

          // Couleur de la bande : couleur douce et translucide du couple
          const familyKey = this.getFamilyKey(personData.id, spouse.id)
          const bandColor = this.familyColorsMap.get(familyKey) || '#e2e8f0'
          const parsedColor = d3.color(bandColor)
          const bandFill = parsedColor
            ? `rgba(${parsedColor.r}, ${parsedColor.g}, ${parsedColor.b}, 0.16)`
            : 'rgba(245, 158, 11, 0.16)'
          const bandStroke = parsedColor
            ? `rgba(${parsedColor.r}, ${parsedColor.g}, ${parsedColor.b}, 0.35)`
            : 'rgba(245, 158, 11, 0.35)'

          // Enregistrer les métadonnées du pont pour le tracé des liens d'enfants
          this.coupleBridges.set(pairKey, {
            parentA: personData,
            parentB: spouseData,
            topData,
            bottomData,
            gapTop,
            gapBottom,
            gapCenterY: (gapTop + gapBottom) / 2,
            yearStart: overallStartYear,
            xStart: overallXStart,
            xEnd: xEndTotal,
            bandColor
          })

          const isNewCouple = Boolean(
            this.animatingExpansion &&
            this.animatingExpansion.isExpanding &&
            this.animatingExpansion.prevIds &&
            (!this.animatingExpansion.prevIds.has(personData.person.id) || !this.animatingExpansion.prevIds.has(spouseData.person.id))
          )

          // Dessiner chaque segment du pont (union civile, mariage, etc.)
          segments.forEach(seg => {
            const segXStart = xScale(seg.startYear)
            let segXEnd = xEndTotal
            if (seg.endYearMax) {
              segXEnd = Math.min(segXEnd, xScale(seg.endYearMax))
            }
            if (segXEnd <= segXStart) return

            const bridgeWidth = segXEnd - segXStart
            const mBand = bridgeLayer.append('rect')
              .attr('class', 'marriage-band')
              .attr('x', segXStart)
              .attr('y', gapTop)
              .attr('width', bridgeWidth)
              .attr('height', gapHeight)
              .attr('fill', bandFill)
              .attr('stroke', bandStroke)
              .attr('stroke-width', 1)
              .attr('rx', 6)
              .attr('ry', 6)

            mBand.append('title').text(`${seg.type === 'civil_union' ? '📜' : '💍'} ${seg.label} (${seg.startYear}${seg.endYearMax ? ' - ' + seg.endYearMax : ''})`)

            // Anneaux délicats dorés ou bleus au centre du pont
            if (bridgeWidth >= 40 && gapHeight >= 14) {
              const bridgeCenterG = bridgeLayer.append('g')
                .attr('class', 'marriage-bridge-center-badge')
                .attr('transform', `translate(${segXStart + Math.min(22, bridgeWidth / 2)}, ${gapCenterY})`)
                .style('pointer-events', 'none')

              if (seg.type === 'civil_union') {
                bridgeCenterG.append('circle').attr('cx', -2.5).attr('cy', 0).attr('r', 3).attr('fill', 'none').attr('stroke', '#2563eb').attr('stroke-width', 1.2)
                bridgeCenterG.append('circle').attr('cx', 2.5).attr('cy', 0).attr('r', 3).attr('fill', 'none').attr('stroke', '#3b82f6').attr('stroke-width', 1.2)
              } else {
                bridgeCenterG.append('circle').attr('cx', -2.5).attr('cy', 0).attr('r', 3).attr('fill', 'none').attr('stroke', '#d97706').attr('stroke-width', 1.2)
                bridgeCenterG.append('circle').attr('cx', 2.5).attr('cy', 0).attr('r', 3).attr('fill', 'none').attr('stroke', '#f59e0b').attr('stroke-width', 1.2)
              }
            }

            if (isNewCouple) {
              mBand
                .style('opacity', 0)
                .transition()
                .duration(500)
                .ease(d3.easeCubicOut)
                .style('opacity', 1)
            }
          })
        })
      })
    },

    drawFamilyLinks (graphSvg, xScale) {
      // Insérer la couche des liens juste avant les personnes pour qu'elle se trouve EN-DESSOUS (derrière) les barres de vie
      const firstPerson = graphSvg.select('.person')
      const linksGroup = firstPerson.node()
        ? graphSvg.insert('g', '.person').attr('class', 'family-links-layer')
        : graphSvg.append('g').attr('class', 'family-links-layer')

      this.renderedPersons.forEach((childData) => {
        try {
          const child = childData.person
          if (!child || !child.relatives || child.relatives.length === 0) return

          // Trouver père et mère parmi les personnes affichées
          const parentRelatives = child.relatives.filter(r =>
            (r.relation_type === 'father' || r.relation_type === 'mother') &&
            this.renderedPersons.has(r.id)
          )

          if (parentRelatives.length === 0) return

          const birthYear = childData.birthYear
          if (!birthYear) return

          const xBirth = xScale(birthYear)
          const endX   = childData.anchorXIn != null ? childData.anchorXIn : (xBirth + 4)
          const endY   = childData.yCenter != null ? childData.yCenter : (childData.yTop + 20)

          const linkG = linksGroup.append('g')
            .attr('class', 'family-link')
            .attr('data-child-id', child.id)

          // Cas 1 : Deux parents affichés
          if (parentRelatives.length >= 2) {
            const p1 = this.renderedPersons.get(parentRelatives[0].id)
            const p2 = this.renderedPersons.get(parentRelatives[1].id)
            if (!p1 || !p2) return

            const topParent = p1.yCenter <= p2.yCenter ? p1 : p2
            const botParent = p1.yCenter <= p2.yCenter ? p2 : p1
            const pairKey   = [Number(p1.id), Number(p2.id)].sort((a, b) => a - b).join('-')
            const bridge    = this.coupleBridges.get(pairKey)

            const coupleColor = (bridge && bridge.bandColor) ? bridge.bandColor : '#475569'

            // Si les parents sont en mode compact (repliés), le départ part sous les avatars
            const isParentsCollapsed = !topParent.isUnfolded && !botParent.isUnfolded
            const startX = isParentsCollapsed
              ? Math.max(topParent.anchorXOut || 0, botParent.anchorXOut || 0)
              : xBirth

            // Départ : centre de la bande d'union des deux parents à l'année de naissance
            const startY = bridge ? bridge.gapCenterY : (topParent.yBottom + botParent.yTop) / 2

            // Point d'ancrage sous le couple
            linkG.append('circle')
              .attr('class', 'anchor-couple')
              .attr('cx', startX)
              .attr('cy', startY)
              .attr('r', 3.5)
              .attr('fill', coupleColor)
              .attr('stroke', '#ffffff')
              .attr('stroke-width', 1.5)

            // Trait descendant du pont (part de la pointe du pin si affiché, ou du centre de la bande)
            const deltaY = endY - startY
            const cp1x = startX
            const cp1y = startY + deltaY * 0.4
            const cp2x = endX - Math.max(8, (endX - startX) * 0.3)
            const cp2y = endY
            const pathD = `M ${startX},${startY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${endX},${endY}`

            const isNewChild = Boolean(
              this.animatingExpansion &&
              this.animatingExpansion.isExpanding &&
              this.animatingExpansion.prevIds &&
              !this.animatingExpansion.prevIds.has(child.id)
            )

            const linkPath = linkG.append('path')
              .attr('class', 'link-line')
              .attr('d', pathD)
              .attr('fill', 'none')
              .attr('stroke', 'rgba(71, 85, 105, 0.65)')
              .attr('stroke-width', 1.8)
              .attr('stroke-linecap', 'round')

            if (isNewChild) {
              const node = linkPath.node()
              if (node && typeof node.getTotalLength === 'function') {
                try {
                  const len = node.getTotalLength()
                  if (len > 0) {
                    linkPath
                      .attr('stroke-dasharray', `${len} ${len}`)
                      .attr('stroke-dashoffset', len)
                      .transition()
                      .delay(80)
                      .duration(550)
                      .ease(d3.easeCubicOut)
                      .attr('stroke-dashoffset', 0)
                  } else {
                    linkPath.style('opacity', 0).transition().duration(500).style('opacity', 1)
                  }
                } catch {
                  linkPath.style('opacity', 0).transition().duration(500).style('opacity', 1)
                }
              } else {
                linkPath.style('opacity', 0).transition().duration(500).style('opacity', 1)
              }
            }

          } else {
            // Cas 2 : Un seul parent affiché
            const pData = this.renderedPersons.get(parentRelatives[0].id)
            if (!pData) return

            const isParentCollapsed = !pData.isUnfolded
            // Si le parent est replié, le lien part proprement sous son avatar
            const startX = isParentCollapsed ? (pData.anchorXOut ?? (xScale(pData.birthYear) + 20)) : xBirth
            const startY = pData.yBottom
            const deltaY = endY - startY
            const cp1x = startX
            const cp1y = startY + deltaY * 0.4
            const cp2x = endX - Math.max(8, (endX - startX) * 0.3)
            const cp2y = endY
            const pathD = `M ${startX},${startY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${endX},${endY}`

            // Point d'ancrage sous le parent
            linkG.append('circle')
              .attr('class', 'anchor-parent')
              .attr('cx', startX)
              .attr('cy', startY)
              .attr('r', 3.5)
              .attr('fill', '#475569')
              .attr('stroke', '#ffffff')

            const isNewChild = Boolean(
              this.animatingExpansion &&
              this.animatingExpansion.isExpanding &&
              this.animatingExpansion.prevIds &&
              !this.animatingExpansion.prevIds.has(child.id)
            )

            const linkPath = linkG.append('path')
              .attr('class', 'link-line')
              .attr('d', pathD)
              .attr('fill', 'none')
              .attr('stroke', 'rgba(71, 85, 105, 0.65)')
              .attr('stroke-width', 1.8)
              .attr('stroke-linecap', 'round')

            if (isNewChild) {
              const node = linkPath.node()
              if (node && typeof node.getTotalLength === 'function') {
                try {
                  const len = node.getTotalLength()
                  if (len > 0) {
                    linkPath
                      .attr('stroke-dasharray', `${len} ${len}`)
                      .attr('stroke-dashoffset', len)
                      .transition()
                      .delay(80)
                      .duration(550)
                      .ease(d3.easeCubicOut)
                      .attr('stroke-dashoffset', 0)
                  } else {
                    linkPath.style('opacity', 0).transition().duration(500).style('opacity', 1)
                  }
                } catch {
                  linkPath.style('opacity', 0).transition().duration(500).style('opacity', 1)
                }
              } else {
                linkPath.style('opacity', 0).transition().duration(500).style('opacity', 1)
              }
            }
          }
        } catch (err) {
          console.error('Error drawing family link for child:', err)
        }
      })
    }


  }
}
</script>

<style>

.timeline-app-container {
  margin-top: 56px;
  height: calc(100vh - 56px);
  width: 100vw;
  overflow: hidden;
}

.timeline-split-layout {
  height: 100%;
  width: 100%;
}

#timeline-content {
  margin-top: 0;
  padding: 0;
  height: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.timeline-profile-sidebar {
  width: clamp(380px, 32vw, 500px);
  min-width: 360px;
  max-width: 540px;
  height: 100%;
  overflow: hidden;
  flex-shrink: 0;
  z-index: 5;
}

@media (max-width: 991.98px) {
  .timeline-profile-sidebar {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: min(460px, 92vw);
    z-index: 1050;
    box-shadow: -4px 0 24px rgba(15, 23, 42, 0.18) !important;
  }
}

/* Toolbar */
.timeline-toolbar {
  z-index: 10;
  background-color: rgba(255, 255, 255, 0.96) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid #e2e8f0 !important;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  padding-top: 8px !important;
  padding-bottom: 8px !important;
}

/* Search Box in Navbar / Toolbar */
.search-box-wrapper {
  min-width: 140px;
  max-width: 220px;
  width: 190px;
}

@media (max-width: 1199px) {
  .search-box-wrapper {
    min-width: 120px;
    max-width: 160px;
    width: 145px;
  }
}

.search-pill-group {
  background-color: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 9999px !important;
  height: 34px;
  transition: all 0.2s ease;
  overflow: hidden;
}

.search-pill-group:focus-within {
  background-color: #ffffff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.search-icon {
  font-size: 13px;
  flex-shrink: 0;
  pointer-events: none;
}

.search-input {
  border: none !important;
  background: transparent !important;
  padding: 0 8px 0 0 !important;
  height: 100%;
  font-size: 13px;
  color: #0f172a;
  outline: none !important;
  box-shadow: none !important;
}

.search-input::placeholder {
  color: #94a3b8;
  font-size: 13px;
}

.search-clear-btn {
  background: transparent;
  border: none !important;
  box-shadow: none !important;
  padding: 0 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.search-clear-btn:hover {
  color: #0f172a !important;
}

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1060;
  min-width: 280px;
  max-height: 360px;
  overflow-y: auto;
  border-radius: 14px !important;
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 16px 36px -4px rgba(15, 23, 42, 0.16) !important;
  padding: 6px !important;
}

.search-result-item {
  border-radius: 9px !important;
  transition: all 0.15s ease;
}

.search-result-item:hover {
  background-color: #f1f5f9 !important;
  transform: translateX(2px);
}

/* Segmented Tree Mode Control */
.segmented-control {
  display: inline-flex;
  align-items: center;
  background-color: #f1f5f9;
  border-radius: 9999px;
  padding: 3px;
  gap: 2px;
  border: 1px solid #e2e8f0;
}

.segmented-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 9999px;
  transition: all 0.15s ease;
  cursor: pointer;
  white-space: nowrap;
}

.segmented-btn:hover {
  color: #0f172a;
}

.segmented-btn.active {
  background-color: #ffffff;
  color: #0f172a;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1), 0 1px 2px rgba(15, 23, 42, 0.06);
}

.segmented-btn.active i {
  color: #2563eb;
}

/* Tool Buttons (Pills) */
.btn-tool-pill {
  font-size: 12px;
  font-weight: 500;
  padding: 5px 11px;
  border-color: #e2e8f0 !important;
  transition: all 0.15s ease;
  height: 32px;
}

.btn-tool-pill:hover {
  background-color: #f8fafc !important;
  border-color: #cbd5e1 !important;
  color: #0f172a !important;
}

.btn-tool-active-primary {
  background-color: #eff6ff !important;
  border-color: #bfdbfe !important;
  color: #2563eb !important;
}

.btn-tool-active-primary:hover {
  background-color: #dbeafe !important;
}

.btn-tool-active-danger {
  background-color: #fef2f2 !important;
  border-color: #fecaca !important;
  color: #dc2626 !important;
}

.btn-tool-active-danger:hover {
  background-color: #fee2e2 !important;
}

.btn-tool-active-info {
  background-color: #f0fdfa !important;
  border-color: #99f6e4 !important;
  color: #0d9488 !important;
}

.btn-tool-active-info:hover {
  background-color: #ccfbf1 !important;
}

.cursor-pointer {
  cursor: pointer;
}

/* Mini status badge inside toggle buttons */
.mini-status-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: 9999px;
  line-height: 1;
}

.status-on {
  background-color: #2563eb;
  color: #ffffff;
}

.status-on-danger {
  background-color: #dc2626;
  color: #ffffff;
}

.status-off {
  background-color: #e2e8f0;
  color: #64748b;
}

/* Zoom Pill Group */
.zoom-pill-group {
  height: 32px;
  border-color: #e2e8f0 !important;
}

.zoom-btn {
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 12px;
  padding: 4px 8px;
  height: 100%;
  border-radius: 0;
  transition: all 0.15s ease;
}

.zoom-btn:first-child {
  border-top-left-radius: 9999px;
  border-bottom-left-radius: 9999px;
  padding-left: 10px;
}

.zoom-btn:last-child {
  border-top-right-radius: 9999px;
  border-bottom-right-radius: 9999px;
  padding-right: 10px;
}

.zoom-btn:hover {
  background-color: #f1f5f9;
  color: #0f172a;
}

.zoom-divider {
  width: 1px;
  height: 16px;
  background-color: #e2e8f0;
}

#timeline-wrapper {
  height: 100%;
  overflow: auto;
  position: relative;
  cursor: grab;
  user-select: none;
}

#timeline-wrapper.is-dragging {
  cursor: grabbing !important;
}

#timeline-header-container {
  position: sticky;
  top: 0;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch; 
  height: 46px;
  cursor: grab;
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
  z-index: 5;
}

#timeline-wrapper.is-dragging #timeline-header-container {
  cursor: grabbing !important;
}

#timeline-header {
  width: 100%;
  height: 100%;
  background: #ffffff;
}

#timeline-header .x.axis {
  font-family: var(--ft-font);
}

#timeline-header .x.axis .domain {
  stroke: #e2e8f0;
  stroke-width: 1.5px;
}

#timeline-header .x.axis .tick text {
  font-family: var(--ft-font);
  user-select: none;
}

#timeline-graph-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  cursor: grab;
}

#timeline-wrapper.is-dragging #timeline-graph-container {
  cursor: grabbing !important;
}

#timeline-graph {
  width: 100%;
}

.vertical-bar-group .vertical-bar {
  stroke: #cbd5e1;
}

.vertical-bar-group:hover .vertical-bar {
  stroke: #3b82f6;
}

.person {
  cursor: pointer;
}

.person path {
  transition: filter 0.2s ease, opacity 0.2s ease;
  filter: drop-shadow(0 2px 4px rgba(15, 23, 42, 0.07));
}

.person:hover path {
  filter: drop-shadow(0 6px 14px rgba(15, 23, 42, 0.16));
}

.person text {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 13px;
  font-weight: 700;
  fill: #ffffff;
  letter-spacing: -0.01em;
}

/* Family Links */
.family-link .link-line {
  transition: stroke 0.2s ease, stroke-width 0.2s ease;
}

.family-link:hover .link-line {
  stroke: #2563eb;
  stroke-width: 3;
}

.family-link:hover circle {
  fill: #2563eb;
}

/* Marriage Badges on bars */
.marriage-bar-badge circle {
  transition: stroke-width 0.2s ease, r 0.2s ease;
}

.marriage-bar-badge:hover circle {
  stroke-width: 2.5;
  stroke: #d97706;
}

/* Highlight pulse on search focus */
@keyframes personPulse {
  0% {
    filter: drop-shadow(0 0 0 rgba(37, 99, 235, 0.8));
  }
  50% {
    filter: drop-shadow(0 0 16px rgba(37, 99, 235, 0.9));
  }
  100% {
    filter: drop-shadow(0 0 0 rgba(37, 99, 235, 0));
  }
}

.person-highlighted {
  animation: personPulse 1.2s ease-in-out 3;
}

/* Animation de nouveau déploiement */
@keyframes newlyDeployedGlow {
  0% {
    filter: drop-shadow(0 0 0 rgba(37, 99, 235, 0.7));
  }
  40% {
    filter: drop-shadow(0 0 12px rgba(37, 99, 235, 0.6));
  }
  100% {
    filter: drop-shadow(0 2px 6px rgba(15, 23, 42, 0.1));
  }
}

.person-newly-deployed {
  animation: newlyDeployedGlow 1.2s ease-out;
}

/* Person life bars aesthetic */
.person-period {
  filter: drop-shadow(0 2px 5px rgba(15, 23, 42, 0.08));
  transition: filter 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
}

.person:hover .person-period {
  filter: drop-shadow(0 3px 8px rgba(15, 23, 42, 0.16)) brightness(1.03);
}

.person-compact-pill {
  transition: filter 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.person:hover .person-compact-pill {
  filter: drop-shadow(0 4px 12px rgba(15, 23, 42, 0.2)) brightness(1.03);
}

.expand-btn-group circle {
  transition: fill 0.15s ease, stroke 0.15s ease;
}

.expand-btn-group:hover circle.expand-btn-bg {
  fill: rgba(255, 255, 255, 0.45);
  stroke: rgba(255, 255, 255, 0.85);
}

.collapse-btn-group circle {
  transition: fill 0.15s ease, stroke 0.15s ease;
}

.collapse-btn-group path {
  transition: stroke 0.15s ease;
}

.collapse-btn-group:hover circle.collapse-btn-bg {
  fill: #eff6ff;
  stroke: #3b82f6;
}

.collapse-btn-group:hover path {
  stroke: #2563eb;
}

.marriage-bar-badge rect {
  transition: fill 0.15s ease, stroke 0.15s ease;
}

.marriage-bar-badge:hover rect {
  fill: #ffffff;
  stroke: #f59e0b;
}

.marriage-band {
  transition: fill-opacity 0.2s ease, stroke-opacity 0.2s ease;
}

.marriage-band:hover {
  fill-opacity: 0.85;
}

/* Timeline Interactive Toolbar Aesthetic */
.timeline-toolbar {
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}


/* Person Context Menu (Magnifique style harmonisé) */
.person-context-menu {
  min-width: 245px;
  max-width: 320px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 14px 35px -5px rgba(0, 0, 0, 0.14), 0 8px 12px -6px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
  font-size: 13px;
  z-index: 1050;
  user-select: none;
  overflow: hidden;
  animation: fadeInContextMenu 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeInContextMenu {
  from {
    opacity: 0;
    transform: translateY(4px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.person-context-menu .dropdown-item {
  cursor: pointer;
  padding: 7px 12px;
  margin: 1px 4px;
  width: calc(100% - 8px);
  border-radius: 8px;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.1s ease;
  font-size: 13px;
  font-weight: 500;
  color: #334155;
}

.person-context-menu .dropdown-item:hover {
  background-color: #f1f5f9;
  color: #0f172a;
}

.person-context-menu .dropdown-item:active {
  transform: scale(0.98);
}

.person-context-menu .dropdown-divider {
  border-top: 1px solid #f1f5f9;
  margin: 4px 0;
}

.person-context-menu .badge.rounded-pill {
  font-weight: 600;
  font-size: 11px;
  padding: 2px 7px;
  background-color: #f8fafc !important;
  color: #475569 !important;
  border: 1px solid #e2e8f0 !important;
}

.text-purple {
  color: #8b5cf6 !important;
}

.text-teal {
  color: #0d9488 !important;
}
</style>
