<script setup lang="ts">
/**
 * A compact table of the admin routes a page covers.
 *
 * Useful at the top of a section page: it tells a reader which screens the
 * page describes, and doubles as the checklist of screenshots still owed.
 *
 * Usage:
 *
 *   <ScreenList :screens="[
 *     { route: '/admin/products', name: 'Product list', role: 'Editor' },
 *     { route: '/admin/products/create', name: 'New product', role: 'Editor' },
 *   ]" />
 */
defineProps<{
  screens: { route: string; name: string; role?: string; note?: string }[]
}>()
</script>

<template>
  <div class="screens">
    <table>
      <thead>
        <tr>
          <th>Screen</th>
          <th>Route</th>
          <th>Minimum role</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="s in screens" :key="s.route">
          <td>
            {{ s.name }}
            <span v-if="s.note" class="screens__note">{{ s.note }}</span>
          </td>
          <td><code>{{ s.route }}</code></td>
          <td>{{ s.role ?? 'Editor' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.screens {
  margin: 20px 0 28px;
  overflow-x: auto;
}
.screens table {
  width: 100%;
  margin: 0;
  display: table;
}
.screens code {
  font-size: 12.5px;
  white-space: nowrap;
}
.screens__note {
  display: block;
  font-size: 12.5px;
  color: var(--vp-c-text-3);
}
</style>
