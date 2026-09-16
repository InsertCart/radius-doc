<script setup lang="ts">
/**
 * A screenshot slot.
 *
 * Every screen in the product gets one of these, whether or not the image
 * exists yet. When the file is missing the component renders a labelled
 * placeholder showing the exact path to drop the file at and the admin route
 * to capture — so the page is complete and self-describing before anybody
 * takes a single screenshot, and no layout shifts when they do.
 *
 * Usage in any .md file (no import needed, it is registered globally):
 *
 *   <Screenshot
 *     src="settings/general.png"
 *     screen="/admin/settings/general"
 *     alt="The General settings screen"
 *     caption="Site name, logo and timezone all live here." />
 */
import { ref, computed } from 'vue'

const props = defineProps<{
  /** Path under docs/public/images/, e.g. "shop/orders-list.png" */
  src: string
  /** Alt text. Required — these images carry real information. */
  alt: string
  /** Optional caption shown under the image. */
  caption?: string
  /** The admin/storefront route to capture, e.g. "/admin/orders" */
  screen?: string
  /** Let the image break out wider than the prose column. */
  wide?: boolean
  /** Describe a tall screen so the placeholder reserves the right height. */
  tall?: boolean
}>()

const failed = ref(false)
const href = computed(() => `/images/${props.src}`)
</script>

<template>
  <figure class="shot" :class="{ 'shot--wide': wide }">
    <a v-if="!failed" :href="href" target="_blank" rel="noopener" class="shot__link">
      <img
        :src="href"
        :alt="alt"
        loading="lazy"
        decoding="async"
        @error="failed = true"
      />
    </a>

    <div v-else class="shot__todo" :class="{ 'shot__todo--tall': tall }">
      <svg class="shot__glyph" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2.5" y="4.5" width="19" height="15" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.4" />
        <circle cx="8" cy="10" r="1.8" fill="currentColor" />
        <path d="M3 17l5.5-5 4 3.5L16 12l5 5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
      </svg>

      <p class="shot__title">Screenshot to add</p>
      <p class="shot__alt">{{ alt }}</p>

      <dl class="shot__meta">
        <div>
          <dt>Save as</dt>
          <dd><code>docs/public/images/{{ src }}</code></dd>
        </div>
        <div v-if="screen">
          <dt>Capture</dt>
          <dd><code>{{ screen }}</code></dd>
        </div>
      </dl>
    </div>

    <figcaption v-if="caption">{{ caption }}</figcaption>
  </figure>
</template>

<style scoped>
.shot {
  margin: 28px 0;
}

.shot--wide {
  /* Break out of the prose column on wide viewports only. */
  margin-inline: 0;
}
@media (min-width: 1200px) {
  .shot--wide {
    margin-inline: -60px;
  }
}

/* The server renders the <img> (it cannot know the file is missing) and the
   client swaps in the placeholder on error. Carrying the placeholder's own
   striped ground and min-height here means that moment shows a reserved slot
   rather than a collapsed broken-image icon. */
.shot__link {
  display: block;
  min-height: 220px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  background:
    repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 9px,
      var(--vp-c-bg-soft) 9px,
      var(--vp-c-bg-soft) 18px
    );
}
.shot__link:hover {
  border-color: var(--vp-c-brand-1);
}

.shot img {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
  /* Hide the broken-image glyph itself; the ground above stands in. */
  color: transparent;
}

/* ---- placeholder ---- */

.shot__todo {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 220px;
  padding: 32px 20px;
  text-align: center;
  border: 1.5px dashed var(--vp-c-divider);
  border-radius: 8px;
  background:
    repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 9px,
      var(--vp-c-bg-soft) 9px,
      var(--vp-c-bg-soft) 18px
    );
  color: var(--vp-c-text-2);
}
.shot__todo--tall {
  min-height: 420px;
}

.shot__glyph {
  width: 30px;
  height: 30px;
  color: var(--vp-c-text-3);
}

.shot__title {
  margin: 4px 0 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--vp-c-text-2);
}

.shot__alt {
  margin: 0;
  max-width: 46ch;
  font-size: 15px;
  line-height: 1.45;
  color: var(--vp-c-text-1);
}

.shot__meta {
  margin: 12px 0 0;
  display: grid;
  gap: 5px;
  font-size: 12px;
}
.shot__meta div {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  align-items: baseline;
  justify-content: center;
}
.shot__meta dt {
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
  font-size: 10px;
}
.shot__meta dd {
  margin: 0;
}
.shot__meta code {
  font-size: 11.5px;
  padding: 2px 6px;
  background: var(--vp-c-default-soft);
  border-radius: 3px;
  color: var(--vp-c-text-1);
}

.shot figcaption {
  margin-top: 9px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}
</style>
