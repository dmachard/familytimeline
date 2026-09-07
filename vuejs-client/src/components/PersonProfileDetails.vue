<template>
  <div class="person-profile-details" :class="{ 'docked-mode': isDocked }">
    <!-- ── HERO PROFILE CARD ───────────────────────────────────────────── -->
    <div class="profile-hero-card p-3 rounded-4 mb-3 border shadow-sm">
      <!-- Top header: Avatar + Name + Edit button -->
      <div class="d-flex align-items-center gap-3">
        <!-- Avatar with gender jewel badge -->
        <div class="position-relative flex-shrink-0">
          <img :src="profileImage" class="profile-hero-avatar rounded-circle border shadow-xs" alt="Photo de profil">
          <span
            v-if="person?.gender"
            class="position-absolute bottom-0 end-0 badge rounded-pill px-1 py-0 shadow-xs border border-white d-flex align-items-center gap-1"
            :class="person.gender === 'Female' ? 'bg-danger text-white' : 'bg-primary text-white'"
            style="font-size: 9px; transform: translate(2px, 2px);"
          >
            <i :class="person.gender === 'Female' ? 'bi bi-gender-female' : 'bi bi-gender-male'" />
            <span class="d-none d-xs-inline">{{ person.gender === 'Female' ? $t('female') : $t('male') }}</span>
          </span>
        </div>

        <!-- Name & Quick Actions -->
        <div class="flex-grow-1 min-w-0">
          <div class="d-flex align-items-center justify-content-between gap-2">
            <div class="min-w-0">
              <h4 class="fw-bold text-dark mb-0 profile-hero-title text-truncate">
                {{ person?.first_name + " " + person?.last_name }}
              </h4>
              <p v-if="person?.middle_names && person.middle_names.length" class="text-muted small mb-0 fst-italic text-truncate">
                {{ person?.middle_names?.map(m => m.middle_name).join(', ') }}
              </p>
            </div>
            <button
              class="btn btn-primary btn-sm rounded-pill px-3 shadow-xs d-flex align-items-center gap-1 hover-lift flex-shrink-0"
              type="button"
              :title="$t('edit')"
              @click="editPerson"
            >
              <i class="bi bi-pencil-square" />
              <span>{{ $t('edit') }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Vital Life Span: Full-width stacked cards (No collisions) -->
      <div v-if="person?.birth_date || person?.death_date" class="vital-facts-stack d-flex flex-column gap-2 mt-3 pt-3 border-top">
        <!-- Naissance -->
        <div v-if="person?.birth_date" class="vital-fact-row p-2 px-3 rounded-3 border bg-white shadow-2xs">
          <div class="d-flex align-items-center justify-content-between gap-2 flex-wrap">
            <div class="d-flex align-items-center gap-2">
              <div class="vital-fact-icon-badge bg-success-subtle text-success rounded-circle d-flex align-items-center justify-content-center flex-shrink-0">
                <i class="bi bi-sun-fill" />
              </div>
              <span class="vital-fact-sublabel text-muted text-uppercase mb-0">{{ $t('birth') }}</span>
              <span v-if="!person?.death_date && age" class="badge rounded-pill bg-primary-subtle text-primary border border-primary-subtle py-0 px-2 fw-semibold" style="font-size: 10px;">
                {{ age }} {{ age > 1 ? $t('yearsOld') : $t('yearOld') }}
              </span>
            </div>
            <span class="fw-bold text-dark vital-fact-main-text">{{ formatDate(person.birth_date) }}</span>
          </div>
          <div v-if="birthPlace" class="vital-fact-place-text text-muted small mt-1 d-flex align-items-center gap-1" :title="birthPlace">
            <i class="bi bi-geo-alt-fill text-danger flex-shrink-0" style="font-size: 11px;" />
            <span class="text-truncate">{{ birthPlace }}</span>
          </div>
        </div>

        <!-- Décès -->
        <div v-if="person?.death_date" class="vital-fact-row p-2 px-3 rounded-3 border bg-white shadow-2xs">
          <div class="d-flex align-items-center justify-content-between gap-2 flex-wrap">
            <div class="d-flex align-items-center gap-2">
              <div class="vital-fact-icon-badge bg-secondary-subtle text-secondary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0">
                <i class="bi bi-clock-history" />
              </div>
              <span class="vital-fact-sublabel text-muted text-uppercase mb-0">{{ $t('death') }}</span>
              <span v-if="age" class="badge rounded-pill bg-primary-subtle text-primary border border-primary-subtle py-0 px-2 fw-semibold" style="font-size: 10px;">
                {{ age }} {{ age > 1 ? $t('yearsOld') : $t('yearOld') }}
              </span>
            </div>
            <span class="fw-bold text-dark vital-fact-main-text">{{ formatDate(person.death_date) }}</span>
          </div>
          <div v-if="deathPlace" class="vital-fact-place-text text-muted small mt-1 d-flex align-items-center gap-1" :title="deathPlace">
            <i class="bi bi-geo-alt-fill text-danger flex-shrink-0" style="font-size: 11px;" />
            <span class="text-truncate">{{ deathPlace }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── SEGMENTED NAVIGATION PILLS ─────────────────────────────────── -->
    <div class="profile-tabs-wrapper mb-3">
      <div class="d-flex p-1 bg-white rounded-pill border shadow-xs gap-1">
        <button
          class="profile-tab-pill flex-fill"
          :class="{ active: activeTab === 'family' }"
          type="button"
          @click="selectTab('family')"
        >
          <i class="bi bi-diagram-3-fill me-1" />
          <span>{{ $t('relatives') }}</span>
          <span class="badge rounded-pill ms-1" :class="activeTab === 'family' ? 'bg-primary text-white' : 'bg-light text-muted border'">
            {{ totalRelativesCount }}
          </span>
        </button>

        <button
          class="profile-tab-pill flex-fill"
          :class="{ active: activeTab === 'events' }"
          type="button"
          @click="selectTab('events')"
        >
          <i class="bi bi-calendar3 me-1" />
          <span>{{ $t('events') }}</span>
          <span class="badge rounded-pill ms-1" :class="activeTab === 'events' ? 'bg-success text-white' : 'bg-light text-muted border'">
            {{ person?.events?.length || 0 }}
          </span>
        </button>

        <button
          class="profile-tab-pill flex-fill"
          :class="{ active: activeTab === 'map' }"
          type="button"
          @click="selectTab('map')"
        >
          <i class="bi bi-geo-alt-fill me-1 text-danger" />
          <span>{{ $t('map') }}</span>
          <span class="badge rounded-pill ms-1" :class="activeTab === 'map' ? 'bg-danger text-white' : 'bg-light text-muted border'">
            {{ totalPlacesCount }}
          </span>
        </button>

        <button
          v-if="allAttachments.length"
          class="profile-tab-pill flex-fill"
          :class="{ active: activeTab === 'gallery' }"
          type="button"
          @click="selectTab('gallery')"
        >
          <i class="bi bi-images me-1" />
          <span>{{ $t('documents') }}</span>
          <span class="badge rounded-pill ms-1" :class="activeTab === 'gallery' ? 'bg-indigo text-white' : 'bg-light text-muted border'">
            {{ allAttachments.length }}
          </span>
        </button>
      </div>
    </div>

    <!-- ── TAB 1: RELATIVES & FAMILY TREE ──────────────────────────────── -->
    <div v-show="activeTab === 'family'" class="tab-pane-fade">
      <!-- Header bar with manage action -->
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div class="text-muted small fw-semibold">
          {{ totalRelativesCount }} {{ totalRelativesCount > 1 ? $t('relatives-recorded-plural') : $t('relatives-recorded-singular') }}
        </div>
        <button
          class="btn btn-sm btn-outline-secondary rounded-pill px-3 d-flex align-items-center gap-1 shadow-xs"
          type="button"
          :title="$t('manage-relatives')"
          @click="manageRelatives"
        >
          <i class="bi bi-gear" />
          <span>{{ $t('manage') }}</span>
        </button>
      </div>

      <!-- Empty State if no relatives -->
      <div v-if="totalRelativesCount === 0" class="card border rounded-4 p-4 text-center bg-white shadow-xs">
        <div class="rounded-circle bg-light text-muted d-inline-flex align-items-center justify-content-center mx-auto mb-2" style="width: 48px; height: 48px;">
          <i class="bi bi-people fs-4" />
        </div>
        <h6 class="fw-bold text-dark mb-1">
          {{ $t('no-relatives-recorded') }}
        </h6>
        <p class="text-muted small mb-3">
          {{ $t('add-relatives-hint') }}
        </p>
        <div>
          <button class="btn btn-sm btn-outline-primary rounded-pill px-3" type="button" @click="manageRelatives">
            <i class="bi bi-plus-lg me-1" />{{ $t('add-relatives') }}
          </button>
        </div>
      </div>

      <div v-else class="d-flex flex-column gap-3">
        <!-- 1. Foyer & Descendance (Conjoints & Enfants) -->
        <div v-if="spouses.length || children.length" class="family-group-card bg-white border rounded-4 p-3 shadow-xs">
          <div class="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
            <i class="bi bi-house-heart-fill text-danger fs-5" />
            <h6 class="fw-bold text-dark mb-0 fs-6">
              {{ $t('direct-household-descendants') }}
            </h6>
          </div>

          <!-- Conjoints -->
          <div v-if="spouses.length" class="mb-3">
            <div class="section-micro-label text-muted small fw-bold text-uppercase mb-2">
              💍 {{ $t('spouses') }} ({{ spouses.length }})
            </div>
            <div class="row g-2">
              <div v-for="item in spouses" :key="item.id" class="col-12" :class="{ 'col-sm-6': !isDocked }">
                <div class="relative-card d-flex align-items-center gap-2 p-2 rounded-3 border bg-light-subtle hover-card" @click="refreshProfile(item.id)">
                  <img :src="getRelativeAvatar(item.id)" class="relative-card-avatar rounded-3" :alt="$t('spouse')">
                  <div class="flex-grow-1 min-w-0">
                    <div class="fw-bold text-dark text-truncate relative-card-name">
                      {{ getRelativePerson(item.id)?.first_name }} {{ getRelativePerson(item.id)?.last_name }}
                    </div>
                    <div class="text-muted small font-monospace" style="font-size: 11px;">
                      {{ getRelativeLifespan(item.id) }}
                    </div>
                  </div>
                  <i class="bi bi-chevron-right text-muted opacity-50 pe-1" />
                </div>
              </div>
            </div>
          </div>

          <!-- Enfants -->
          <div v-if="children.length">
            <div class="section-micro-label text-muted small fw-bold text-uppercase mb-2">
              👶 {{ $t('children') }} ({{ children.length }})
            </div>
            <div class="row g-2">
              <div v-for="item in children" :key="item.id" class="col-12" :class="{ 'col-sm-6': !isDocked }">
                <div class="relative-card d-flex align-items-center gap-2 p-2 rounded-3 border bg-light-subtle hover-card" @click="refreshProfile(item.id)">
                  <img :src="getRelativeAvatar(item.id)" class="relative-card-avatar rounded-3" :alt="$t('child')">
                  <div class="flex-grow-1 min-w-0">
                    <div class="fw-bold text-dark text-truncate relative-card-name">
                      {{ getRelativePerson(item.id)?.first_name }} {{ getRelativePerson(item.id)?.last_name }}
                    </div>
                    <div class="text-muted small font-monospace" style="font-size: 11px;">
                      {{ getRelativeLifespan(item.id) }}
                    </div>
                  </div>
                  <i class="bi bi-chevron-right text-muted opacity-50 pe-1" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Ascendance directe (Parents & Grands-Parents) -->
        <div v-if="parents.length || hasGrandparents" class="family-group-card bg-white border rounded-4 p-3 shadow-xs">
          <div class="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
            <i class="bi bi-tree-fill text-success fs-5" />
            <h6 class="fw-bold text-dark mb-0 fs-6">
              {{ $t('direct-ancestors') }}
            </h6>
          </div>

          <!-- Parents -->
          <div v-if="parents.length" class="mb-3">
            <div class="section-micro-label text-muted small fw-bold text-uppercase mb-2">
              {{ $t('parents') }} ({{ parents.length }})
            </div>
            <div class="row g-2">
              <div v-for="item in parents" :key="item.id" class="col-12" :class="{ 'col-sm-6': !isDocked }">
                <div class="relative-card d-flex align-items-center gap-2 p-2 rounded-3 border bg-light-subtle hover-card" @click="refreshProfile(item.id)">
                  <img :src="getRelativeAvatar(item.id)" class="relative-card-avatar rounded-3" :alt="$t('parent')">
                  <div class="flex-grow-1 min-w-0">
                    <div class="d-flex align-items-center gap-1">
                      <span class="badge bg-primary-subtle text-primary border rounded-pill px-1" style="font-size: 9px;">
                        {{ item.relation_type === 'father' ? $t('father') : $t('mother') }}
                      </span>
                      <span class="fw-bold text-dark text-truncate relative-card-name">
                        {{ getRelativePerson(item.id)?.first_name }} {{ getRelativePerson(item.id)?.last_name }}
                      </span>
                    </div>
                    <div class="text-muted small font-monospace" style="font-size: 11px;">
                      {{ getRelativeLifespan(item.id) }}
                    </div>
                  </div>
                  <i class="bi bi-chevron-right text-muted opacity-50 pe-1" />
                </div>
              </div>
            </div>
          </div>

          <!-- Grands-parents paternels -->
          <div v-if="paternalGrandparents.length" class="mb-3">
            <div class="section-micro-label text-muted small fw-bold text-uppercase mb-2">
              {{ $t('grandparents-paternal') }}
            </div>
            <div class="row g-2">
              <div v-for="item in paternalGrandparents" :key="item.id" class="col-12" :class="{ 'col-sm-6': !isDocked }">
                <div class="relative-card d-flex align-items-center gap-2 p-2 rounded-3 border bg-light-subtle hover-card" @click="refreshProfile(item.id)">
                  <img :src="getRelativeAvatar(item.id)" class="relative-card-avatar rounded-3" :alt="$t('grandparent')">
                  <div class="flex-grow-1 min-w-0">
                    <div class="fw-bold text-dark text-truncate relative-card-name">
                      {{ item.first_name }} {{ item.last_name }}
                    </div>
                    <div class="text-muted small font-monospace" style="font-size: 11px;">
                      {{ getRelativeLifespan(item.id) }}
                    </div>
                  </div>
                  <i class="bi bi-chevron-right text-muted opacity-50 pe-1" />
                </div>
              </div>
            </div>
          </div>

          <!-- Grands-parents maternels -->
          <div v-if="maternalGrandparents.length">
            <div class="section-micro-label text-muted small fw-bold text-uppercase mb-2">
              {{ $t('grandparents-maternal') }}
            </div>
            <div class="row g-2">
              <div v-for="item in maternalGrandparents" :key="item.id" class="col-12" :class="{ 'col-sm-6': !isDocked }">
                <div class="relative-card d-flex align-items-center gap-2 p-2 rounded-3 border bg-light-subtle hover-card" @click="refreshProfile(item.id)">
                  <img :src="getRelativeAvatar(item.id)" class="relative-card-avatar rounded-3" :alt="$t('grandparent')">
                  <div class="flex-grow-1 min-w-0">
                    <div class="fw-bold text-dark text-truncate relative-card-name">
                      {{ item.first_name }} {{ item.last_name }}
                    </div>
                    <div class="text-muted small font-monospace" style="font-size: 11px;">
                      {{ getRelativeLifespan(item.id) }}
                    </div>
                  </div>
                  <i class="bi bi-chevron-right text-muted opacity-50 pe-1" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Fratrie -->
        <div v-if="siblings.length" class="family-group-card bg-white border rounded-4 p-3 shadow-xs">
          <div class="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
            <i class="bi bi-people-fill text-info fs-5" />
            <h6 class="fw-bold text-dark mb-0 fs-6">
              {{ $t('siblings') }} ({{ siblings.length }})
            </h6>
          </div>
          <div class="row g-2">
            <div v-for="item in siblings" :key="item.id" class="col-12" :class="{ 'col-sm-6': !isDocked }">
              <div class="relative-card d-flex align-items-center gap-2 p-2 rounded-3 border bg-light-subtle hover-card" @click="refreshProfile(item.id)">
                <img :src="getRelativeAvatar(item.id)" class="relative-card-avatar rounded-3" :alt="$t('sibling')">
                <div class="flex-grow-1 min-w-0">
                  <div class="d-flex align-items-center gap-1">
                    <span class="badge bg-info-subtle text-info border rounded-pill px-1" style="font-size: 9px;">
                      {{ item.relation_type === 'brother' ? $t('brother') : $t('sister') }}
                    </span>
                    <span class="fw-bold text-dark text-truncate relative-card-name">
                      {{ getRelativePerson(item.id)?.first_name }} {{ getRelativePerson(item.id)?.last_name }}
                    </span>
                  </div>
                  <div class="text-muted small font-monospace" style="font-size: 11px;">
                    {{ getRelativeLifespan(item.id) }}
                  </div>
                </div>
                <i class="bi bi-chevron-right text-muted opacity-50 pe-1" />
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Famille élargie (Oncles, Tantes, Cousins) -->
        <div v-if="hasExtendedFamily" class="family-group-card bg-white border rounded-4 p-3 shadow-xs">
          <div class="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
            <i class="bi bi-diagram-2-fill text-purple fs-5" />
            <h6 class="fw-bold text-dark mb-0 fs-6">
              {{ $t('extended-family') }}
            </h6>
          </div>

          <!-- Oncles & Tantes -->
          <div v-if="unclesAndAuntsList.length" class="mb-3">
            <div class="section-micro-label text-muted small fw-bold text-uppercase mb-2">
              {{ $t('uncles-aunts') }} ({{ unclesAndAuntsList.length }})
            </div>
            <div class="row g-2">
              <div v-for="item in unclesAndAuntsList" :key="item.id" class="col-12" :class="{ 'col-sm-6': !isDocked }">
                <div class="relative-card d-flex align-items-center gap-2 p-2 rounded-3 border bg-light-subtle hover-card" @click="refreshProfile(item.id)">
                  <img :src="getRelativeAvatar(item.id)" class="relative-card-avatar rounded-3" :alt="$t('uncle-aunt')">
                  <div class="flex-grow-1 min-w-0">
                    <div class="d-flex align-items-center gap-1">
                      <span class="badge bg-purple-subtle text-purple border rounded-pill px-1" style="font-size: 9px;">
                        {{ item.relation_type === 'brother' ? $t('uncle') : $t('aunt') }}
                      </span>
                      <span class="fw-bold text-dark text-truncate relative-card-name">
                        {{ getRelativePerson(item.id)?.first_name }} {{ getRelativePerson(item.id)?.last_name }}
                      </span>
                    </div>
                    <div class="text-muted small font-monospace" style="font-size: 11px;">
                      {{ getRelativeLifespan(item.id) }}
                    </div>
                  </div>
                  <i class="bi bi-chevron-right text-muted opacity-50 pe-1" />
                </div>
              </div>
            </div>
          </div>

          <!-- Cousins -->
          <div v-if="cousinsList.length">
            <div class="section-micro-label text-muted small fw-bold text-uppercase mb-2">
              {{ $t('cousins') }} ({{ cousinsList.length }})
            </div>
            <div class="row g-2">
              <div v-for="item in cousinsList" :key="item.id" class="col-12" :class="{ 'col-sm-6': !isDocked }">
                <div class="relative-card d-flex align-items-center gap-2 p-2 rounded-3 border bg-light-subtle hover-card" @click="refreshProfile(item.id)">
                  <img :src="getRelativeAvatar(item.id)" class="relative-card-avatar rounded-3" :alt="$t('cousin')">
                  <div class="flex-grow-1 min-w-0">
                    <div class="fw-bold text-dark text-truncate relative-card-name">
                      {{ getRelativePerson(item.id)?.first_name }} {{ getRelativePerson(item.id)?.last_name }}
                    </div>
                    <div class="text-muted small font-monospace" style="font-size: 11px;">
                      {{ getRelativeLifespan(item.id) }}
                    </div>
                  </div>
                  <i class="bi bi-chevron-right text-muted opacity-50 pe-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── TAB 2: EVENTS & TIMELINE ────────────────────────────────────── -->
    <div v-show="activeTab === 'events'" class="tab-pane-fade">
      <!-- Header bar with manage action -->
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div class="text-muted small fw-semibold">
          {{ sortedEvents.length }} {{ sortedEvents.length > 1 ? $t('chronological-events-plural') : $t('chronological-events-singular') }}
        </div>
        <div class="d-flex gap-2">
          <button
            class="btn btn-sm btn-outline-primary rounded-pill px-3 d-flex align-items-center gap-1 shadow-xs"
            type="button"
            :title="$t('add-event')"
            @click="addEvent"
          >
            <i class="bi bi-plus-lg" />
            <span>{{ $t('add') }}</span>
          </button>
          <button
            class="btn btn-sm btn-outline-secondary rounded-pill px-3 d-flex align-items-center gap-1 shadow-xs"
            type="button"
            :title="$t('manage-events')"
            @click="manageEvents"
          >
            <i class="bi bi-gear" />
            <span>{{ $t('manage') }}</span>
          </button>
        </div>
      </div>

      <!-- Empty State if no events -->
      <div v-if="sortedEvents.length === 0" class="card border rounded-4 p-4 text-center bg-white shadow-xs">
        <div class="rounded-circle bg-light text-muted d-inline-flex align-items-center justify-content-center mx-auto mb-2" style="width: 48px; height: 48px;">
          <i class="bi bi-calendar-x fs-4" />
        </div>
        <h6 class="fw-bold text-dark mb-1">
          {{ $t('no-events-recorded') }}
        </h6>
        <p class="text-muted small mb-3">
          {{ $t('add-events-hint') }}
        </p>
        <div>
          <button class="btn btn-sm btn-outline-primary rounded-pill px-3" type="button" @click="addEvent">
            <i class="bi bi-plus-lg me-1" />{{ $t('add-first-event') }}
          </button>
        </div>
      </div>

      <!-- Vertical Timeline of Events -->
      <div v-else class="timeline-vertical position-relative ps-3 ps-sm-4">
        <div class="timeline-spine-line" />

        <div
          v-for="event in sortedEvents"
          :key="event.id"
          class="timeline-item position-relative mb-3 pb-1"
        >
          <!-- Timeline Marker Dot -->
          <div
            class="timeline-dot rounded-circle shadow-xs"
            :class="'dot-' + (event.event_type || 'other').toLowerCase()"
          />

          <!-- Event Card -->
          <div class="card border rounded-4 bg-white shadow-xs hover-card overflow-hidden">
            <div class="card-body p-3">
              <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start gap-2 mb-2">
                <div>
                  <div class="d-flex align-items-center gap-2 flex-wrap">
                    <span class="badge rounded-pill px-2 py-1" :class="getEventBadgeClass(event.event_type)">
                      <span>{{ $t(event.event_type) || event.event_type }}</span>
                    </span>
                    <span class="fw-bold text-dark fs-6">{{ formatDate(event.event_date) }}</span>
                    <span
                      v-if="person?.birth_date && event.event_date"
                      class="badge bg-light text-muted border rounded-pill"
                      style="font-size: 11px;"
                    >
                      {{ calculateAgeAtEvent(person.birth_date, event.event_date) }} {{ calculateAgeAtEvent(person.birth_date, event.event_date) > 1 ? $t('yearsOld') : $t('yearOld') }}
                    </span>
                  </div>

                  <div v-if="event.event_place" class="text-muted small mt-1 d-flex align-items-center gap-1">
                    <i class="bi bi-geo-alt-fill text-danger" style="font-size: 11px;" />
                    <span>{{ event.event_place }}</span>
                  </div>
                </div>

                <button
                  class="btn btn-sm btn-light rounded-circle text-muted p-0 d-flex align-items-center justify-content-center flex-shrink-0"
                  style="width: 28px; height: 28px;"
                  type="button"
                  :title="$t('edit')"
                  @click="editEvent(event.id)"
                >
                  <i class="bi bi-pencil" style="font-size: 11px;" />
                </button>
              </div>

              <!-- Notes -->
              <p v-if="event.event_notes" class="text-secondary small mb-2 bg-light-subtle p-2 rounded-3 border border-light">
                {{ event.event_notes }}
              </p>

              <!-- Associated Attachments Thumbnails -->
              <div v-if="event.related_attachments && event.related_attachments.length" class="mt-2 pt-2 border-top">
                <div class="text-muted small mb-1 fw-semibold" style="font-size: 11px;">
                  {{ $t('associated-documents') }} ({{ event.related_attachments.length }})
                </div>
                <div class="d-flex flex-wrap gap-2">
                  <div
                    v-for="att in event.related_attachments"
                    :key="att.id"
                    class="attachment-chip d-flex align-items-center gap-1 p-1 rounded-3 border bg-light hover-card"
                    style="cursor: pointer; max-width: 180px;"
                    @click="openAttachmentModal(att.filepath || att.file_path)"
                  >
                    <img
                      :src="getAttachmentPath(att.filepath || att.file_path)"
                      class="rounded-2"
                      style="width: 28px; height: 28px; object-fit: cover;"
                      alt=""
                    >
                    <span class="small text-truncate text-dark pe-1" style="font-size: 11px;">
                      {{ att.description || (att.filepath || att.file_path || '').split('/').pop() }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── TAB 3: GALLERY & ATTACHMENTS ────────────────────────────────── -->
    <div v-show="activeTab === 'gallery'" class="tab-pane-fade">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div class="text-muted small fw-semibold">
          {{ allAttachments.length }} {{ $t('documents-and-photos') }}
        </div>
      </div>

      <div class="row g-2">
        <div
          v-for="att in allAttachments"
          :key="att.id"
          class="col-6 col-sm-4"
        >
          <div
            class="card border rounded-4 overflow-hidden shadow-xs hover-card h-100"
            style="cursor: pointer;"
            @click="openAttachmentModal(att.filepath || att.file_path)"
          >
            <div class="ratio ratio-4x3 bg-light">
              <img
                :src="getAttachmentPath(att.filepath || att.file_path)"
                class="object-fit-cover w-100 h-100"
                alt=""
              >
            </div>
            <div class="p-2 bg-white">
              <div class="fw-semibold text-dark text-truncate small" style="font-size: 12px;">
                {{ att.description || (att.filepath || att.file_path || '').split('/').pop() }}
              </div>
              <div class="text-muted small text-truncate" style="font-size: 10px;">
                {{ formatDate(att.event_date) }} &bull; {{ att.event_type }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── TAB 4: PLACES MAP ───────────────────────────────────────────── -->
    <div v-show="activeTab === 'map'" class="tab-pane-fade">
      <ProfilePlacesMap ref="placesMap" :person="person" @add-event="addEvent" />
    </div>
  </div>
</template>

<script>
import ProfilePlacesMap from './ProfilePlacesMap.vue'

export default {
  name: 'PersonProfileDetails',
  components: {
    ProfilePlacesMap
  },
  inject: {
    openModalWithContext: {
      default: null
    }
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
  emits: ['refresh-profile', 'open-attachment'],
  data () {
    return {
      activeTab: 'family' // 'family' | 'events' | 'map' | 'gallery'
    }
  },
  computed: {
    profileImage () {
      if (this.person?.picture) {
        return this.getDataUrl() + this.person?.picture
      } else {
        return this.person?.gender === 'Female' ? '/profile_women.png' : '/profile_men.png'
      }
    },
    birthPlace () {
      const bEv = (this.person?.events || []).find(e => (e.event_type || '').toLowerCase() === 'birth' && e.event_place)
      return bEv?.event_place || ''
    },
    deathPlace () {
      const dEv = (this.person?.events || []).find(e => (e.event_type || '').toLowerCase() === 'death' && e.event_place)
      return dEv?.event_place || ''
    },
    totalPlacesCount () {
      if (!this.person?.events) return 0
      const places = new Set()
      this.person.events.forEach(ev => {
        if (ev.event_place && ev.event_place.trim()) {
          places.add(ev.event_place.trim())
        }
      })
      return places.size
    },
    sortedEvents () {
      if (!this.person?.events) return []
      return [...this.person.events].sort((a, b) => {
        const dA = new Date(a.event_date || '9999-12-31')
        const dB = new Date(b.event_date || '9999-12-31')
        return dA - dB
      })
    },
    allAttachments () {
      const list = []
      if (!this.person?.events) return list
      this.person.events.forEach(ev => {
        if (ev.related_attachments && ev.related_attachments.length) {
          ev.related_attachments.forEach(att => {
            list.push({
              ...att,
              event_date: ev.event_date,
              event_type: ev.event_type,
              event_place: ev.event_place
            })
          })
        }
      })
      return list
    },
    paternalGrandparents () {
      return this.getGrandparents('father')
    },
    maternalGrandparents () {
      return this.getGrandparents('mother')
    },
    hasGrandparents () {
      return this.paternalGrandparents.length > 0 || this.maternalGrandparents.length > 0
    },
    unclesAndAuntsList () {
      return this.getUnclesAndAunts()
    },
    cousinsList () {
      return this.getCousins()
    },
    hasExtendedFamily () {
      return this.unclesAndAuntsList.length > 0 || this.cousinsList.length > 0
    },
    totalRelativesCount () {
      return (
        this.parents.length +
        this.spouses.length +
        this.children.length +
        this.siblings.length +
        this.paternalGrandparents.length +
        this.maternalGrandparents.length +
        this.unclesAndAuntsList.length +
        this.cousinsList.length
      )
    },
    parents () {
      return this.filteredRelatives('mother').concat(this.filteredRelatives('father')).sort((a, b) => {
        const childA = this.dataPersons.find(person => person.id === a.id)
        const childB = this.dataPersons.find(person => person.id === b.id)
        const birthDateA = new Date(childA?.birth_date || '9999-12-31')
        const birthDateB = new Date(childB?.birth_date || '9999-12-31')
        return birthDateA - birthDateB
      })
    },
    spouses () {
      return this.filteredRelatives('spouse').sort((a, b) => {
        const childA = this.dataPersons.find(person => person.id === a.id)
        const childB = this.dataPersons.find(person => person.id === b.id)
        const birthDateA = new Date(childA?.birth_date || '9999-12-31')
        const birthDateB = new Date(childB?.birth_date || '9999-12-31')
        return birthDateA - birthDateB
      })
    },
    children () {
      return this.filteredRelatives('child').sort((a, b) => {
        const childA = this.dataPersons.find(person => person.id === a.id)
        const childB = this.dataPersons.find(person => person.id === b.id)
        const birthDateA = new Date(childA?.birth_date || '9999-12-31')
        const birthDateB = new Date(childB?.birth_date || '9999-12-31')
        return birthDateA - birthDateB
      })
    },
    siblings () {
      return this.filteredRelatives('brother').concat(this.filteredRelatives('sister')).sort((a, b) => {
        const childA = this.dataPersons.find(person => person.id === a.id)
        const childB = this.dataPersons.find(person => person.id === b.id)
        const birthDateA = new Date(childA?.birth_date || '9999-12-31')
        const birthDateB = new Date(childB?.birth_date || '9999-12-31')
        return birthDateA - birthDateB
      })
    },
    age () {
      if (this.person?.birth_date) {
        const birthDate = new Date(this.person.birth_date)
        const endDate = this.person.death_date ? new Date(this.person.death_date) : new Date()
        let age = endDate.getFullYear() - birthDate.getFullYear()
        const monthDiff = endDate.getMonth() - birthDate.getMonth()
        const dayDiff = endDate.getDate() - birthDate.getDate()

        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
          age--
        }
        return age
      }
      return null
    },
    ageText () {
      if (this.age !== null && this.age > 0) {
        return this.person?.death_date
          ? `${this.$t('ageAtDeath')}: ${this.age} ${this.age > 1 ? this.$t('yearsOld') : this.$t('yearOld')}`
          : `${this.$t('age')}: ${this.age} ${this.age > 1 ? this.$t('yearsOld') : this.$t('yearOld')}`
      }
      return ''
    }
  },
  watch: {
    person: {
      deep: true,
      handler () {
        if (this.activeTab === 'map') {
          this.$nextTick(() => {
            this.$refs.placesMap?.invalidateSize()
          })
        }
      }
    }
  },
  methods: {
    selectTab (tab) {
      this.activeTab = tab
      if (tab === 'map') {
        this.$nextTick(() => {
          this.$refs.placesMap?.invalidateSize()
        })
      }
    },
    formatDate (dateStr) {
      if (!dateStr) return ''
      try {
        const parts = dateStr.split('-')
        if (parts.length === 3) {
          const d = new Date(dateStr)
          if (!isNaN(d.getTime())) {
            const locale = this.$i18n?.locale || 'fr'
            return d.toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          }
        }
        return dateStr
      } catch {
        return dateStr
      }
    },
    getRelativePerson (id) {
      return this.dataPersons.find(p => p.id === id) || null
    },
    getRelativeAvatar (id) {
      const p = this.getRelativePerson(id)
      if (!p) return '/profile_men.png'
      if (p.picture) return this.getDataUrl() + p.picture
      return p.gender === 'Female' ? '/profile_women.png' : '/profile_men.png'
    },
    getRelativeLifespan (id) {
      const p = this.getRelativePerson(id)
      if (!p) return ''
      const bYear = p.birth_date ? new Date(p.birth_date).getFullYear() : '?'
      const presentLabel = this.$t('present') || 'présent'
      const dYear = p.death_date ? new Date(p.death_date).getFullYear() : (p.death_date === null ? presentLabel : '')
      if (dYear === presentLabel) return `${bYear} – ${presentLabel}`
      if (dYear) return `${bYear} – ${dYear}`
      return `${bYear}`
    },
    getEventBadgeClass (type) {
      const t = (type || '').toLowerCase()
      if (t === 'birth') return 'bg-success text-white'
      if (t === 'death') return 'bg-secondary text-white'
      if (t === 'marriage') return 'bg-warning text-dark'
      if (t === 'child') return 'bg-primary text-white'
      if (t === 'divorce') return 'bg-danger text-white'
      return 'bg-info text-dark'
    },
    getCousins () {
      const unclesAndAunts = this.getUnclesAndAunts()
      let cousins = []
      unclesAndAunts.forEach(uncleOrAunt => {
        const relative = this.dataPersons.find(p => p.id === uncleOrAunt.id)
        if (relative && relative.relatives) {
          const children = relative.relatives.filter(r => r.relation_type === 'child')
          cousins = cousins.concat(children)
        }
      })
      return cousins
    },
    getUnclesAndAunts () {
      if (!this.person || !this.person.relatives) return []
      const parentIds = this.person.relatives
        .filter(r => r.relation_type === 'father' || r.relation_type === 'mother')
        .map(p => p.id)
      if (parentIds.length === 0) return []
      const unclesAndAunts = []
      parentIds.forEach(parentId => {
        const parent = this.dataPersons.find(p => p.id === parentId)
        if (parent && parent.relatives) {
          parent.relatives
            .filter(r => r.relation_type === 'brother' || r.relation_type === 'sister')
            .forEach(r => unclesAndAunts.push(r))
        }
      })
      return unclesAndAunts
    },
    getGrandparents (relationType) {
      if (!this.person || !this.person.relatives) return []
      const parentIds = this.person.relatives
        .filter(r => r.relation_type === relationType)
        .map(p => p.id)
      if (parentIds.length === 0) return []
      const grandparentIds = new Set()
      parentIds.forEach(parentId => {
        const parent = this.dataPersons.find(p => p.id === parentId)
        if (parent && parent.relatives) {
          parent.relatives
            .filter(r => r.relation_type === 'father' || r.relation_type === 'mother')
            .forEach(r => grandparentIds.add(r.id))
        }
      })
      return Array.from(grandparentIds)
        .map(id => this.dataPersons.find(person => person.id === id))
        .filter(grandparent => grandparent)
    },
    getDataUrl () {
      return import.meta.env.MODE === 'development'
        ? import.meta.env.VITE_DATA_URL
        : '/data'
    },
    filteredRelatives (relationType) {
      if (!this.person || !this.person.relatives) return []
      return this.person.relatives.filter(r => r.relation_type === relationType)
    },
    getAttachmentPath (filepath) {
      if (!filepath) return ''
      return this.getDataUrl() + filepath
    },
    calculateAgeAtEvent (birthDate, eventDate) {
      if (!birthDate || !eventDate) return ''
      try {
        const birth = new Date(birthDate)
        const event = new Date(eventDate)
        if (isNaN(birth.getTime()) || isNaN(event.getTime())) return ''
        let age = event.getFullYear() - birth.getFullYear()
        const monthDiff = event.getMonth() - birth.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && event.getDate() < birth.getDate())) {
          age--
        }
        return age >= 0 ? age : ''
      } catch {
        return ''
      }
    },
    getPersonName (id) {
      const person = this.dataPersons.find(p => p.id === id)
      if (person) {
        const birthYear = person.birth_date ? new Date(person.birth_date).getFullYear() : 'Unknown'
        return `${person.first_name} ${person.last_name} (${birthYear})`
      }
      return 'Unknown'
    },
    refreshProfile (id) {
      const person = this.dataPersons.find(p => p.id === id)
      if (person) {
        this.$emit('refresh-profile', person)
      }
    },
    editPerson () {
      this.openContextModal('persons', { person: this.person })
    },
    manageRelatives () {
      this.openContextModal('relatives', { person: this.person })
    },
    manageEvents () {
      this.openContextModal('events', { person: this.person })
    },
    addEvent () {
      this.openContextModal('events', { person: this.person, action: 'add' })
    },
    editEvent (eventId) {
      this.openContextModal('events', { person: this.person, eventId })
    },
    openContextModal (modalId, options = {}) {
      if (this.openModalWithContext) {
        this.openModalWithContext(modalId, options)
      }
    },
    openAttachmentModal (filepath) {
      this.$emit('open-attachment', filepath)
    }
  }
}
</script>

<style scoped>
.profile-hero-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 60%, #f1f5f9 100%);
  border-color: #e2e8f0 !important;
}

.profile-hero-avatar {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.1);
}

.profile-hero-title {
  letter-spacing: -0.02em;
  font-size: 1.25rem;
}

/* Vital Facts Stack */
.vital-facts-stack {
  width: 100%;
}

.vital-fact-row {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  transition: all 0.15s ease;
}

.vital-fact-row:hover {
  background-color: #f1f5f9;
  border-color: #cbd5e1;
}

.vital-fact-icon-badge {
  width: 28px;
  height: 28px;
  font-size: 13px;
}

.vital-fact-sublabel {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  color: #64748b;
  line-height: 1;
}

.vital-fact-main-text {
  font-size: 13px;
  line-height: 1.2;
}

.vital-fact-place-text {
  font-size: 12px;
  color: #475569;
  line-height: 1.25;
  padding-left: 36px;
}


/* Tabs */
.profile-tabs-wrapper {
  user-select: none;
}

.profile-tab-pill {
  border: none;
  background: transparent;
  padding: 7px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.profile-tab-pill:hover {
  color: #0f172a;
}

.profile-tab-pill.active {
  background-color: #0f172a;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
}

/* Relative cards */
.relative-card {
  cursor: pointer;
  transition: all 0.15s ease;
}

.relative-card:hover {
  background-color: #eff6ff !important;
  border-color: #bfdbfe !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.08) !important;
}

.relative-card-avatar {
  width: 42px;
  height: 42px;
  object-fit: cover;
  flex-shrink: 0;
  border: 1.5px solid #ffffff;
  box-shadow: 0 2px 4px rgba(15, 23, 42, 0.08);
}

.relative-card-name {
  font-size: 12.5px;
  line-height: 1.2;
}

.section-micro-label {
  font-size: 11px;
  letter-spacing: 0.03em;
}

.hover-card {
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

.hover-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
}

.hover-lift {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.hover-lift:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
}

/* Vertical Timeline */
.timeline-vertical {
  padding-left: 24px;
}

.timeline-spine-line {
  position: absolute;
  top: 14px;
  bottom: 14px;
  left: 7px;
  width: 2px;
  background: linear-gradient(180deg, #93c5fd 0%, #cbd5e1 100%);
  border-radius: 1px;
}

.timeline-dot {
  position: absolute;
  left: -24px;
  top: 16px;
  width: 14px;
  height: 14px;
  background-color: #ffffff;
  border: 3px solid #64748b;
  z-index: 2;
  transition: transform 0.15s ease;
}

.timeline-item:hover .timeline-dot {
  transform: scale(1.25);
}

.timeline-dot.dot-birth { border-color: #10b981; }
.timeline-dot.dot-death { border-color: #64748b; }
.timeline-dot.dot-marriage { border-color: #f59e0b; }
.timeline-dot.dot-child { border-color: #6366f1; }
.timeline-dot.dot-divorce { border-color: #ef4444; }

/* Custom Badge Colors */
.text-purple { color: #8b5cf6 !important; }
.bg-purple-subtle { background-color: #f3e8ff !important; }
.bg-indigo { background-color: #6366f1 !important; }

/* Compact adjustments when docked in sidebar */
.docked-mode .profile-hero-card {
  padding: 0.85rem !important;
}

.docked-mode .profile-hero-avatar {
  width: 54px;
  height: 54px;
}

.docked-mode .profile-hero-title {
  font-size: 1.15rem;
}

.docked-mode .profile-tab-pill {
  padding: 6px 8px;
  font-size: 11px;
}

.docked-mode .profile-tab-pill span:not(.badge) {
  font-size: 11px;
}
</style>
