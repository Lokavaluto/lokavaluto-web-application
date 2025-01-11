<template>
  <main class="main">
    <div class="container mt-5">
      <div class="card custom-card custom-card-padding custom-card-prefs">
        <div
          v-for="group in componentDefs"
          :key="group.name"
          class="prefs-group"
        >
          <div class="mb-5">
            <label class="custom-card-title">{{ group.label() }}</label>
          </div>
          <div v-for="componentDef in group.componentDefs" :key="componentDef">
            <component
              :is="componentDef.component.name"
              :prefs-data="componentDef.data"
            />
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
<script lang="ts">
  import { mapState } from "vuex"
  import { Options, Vue } from "vue-class-component"
  import AuthPrefs from "@/components/AuthPrefs.vue"
  import LangPrefs from "@/components/LangPrefs.vue"
  import BiometryPrefs from "@/components/BiometryPrefs.vue"

  @Options({
    name: "Prefs",
    components: { AuthPrefs, LangPrefs, BiometryPrefs },
    computed: {
      ...mapState({
        componentDefs: (state: any) => state.prefs.componentDefs,
      }),
    },
  })
  export default class Prefs extends Vue {}
</script>
<style lang="scss" scoped>
  .custom-card-prefs {
    max-width: 550px;
    margin: auto;
  }
  .prefs-group + .prefs-group {
    margin-top: 3em;
  }
</style>
