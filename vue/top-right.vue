<script>
module.exports = {
  name: "top-right",
  // tooltips triggered in script.js 'isLoaded' watcher
  methods: {
    downloadData() {
      VueBus.$emit('downloadData');
    }, 
    openLoadDataModal() {
        $('#loadDataModal').modal('show');
        // this is in index.html because modals can't be inside sticky elements
    }
  },
  computed: {
    hasMultipleAssessments() {
      return this.$root.pgtoolAssessmentsNames.length > 1;
    }
  }
}
</script>

<template>
  <div id="top-right" class="text-center nav-tabs soft">
    <div class="float-right mr-2 row">
      <div class="download btn-primary mr-1" @click="openLoadDataModal" data-toggle="tooltip" data-placement="top" title="Open a previously saved data"><i class="fas fa-folder-open"></i><span class="d-none d-md-inline"> Open</span></div>
      <div class="download btn-primary mr-1" @click="downloadData" data-toggle="tooltip" data-placement="top" title="Save your data"><i class="fas fa-download"></i><span class="d-none d-md-inline"> Save</span></div>
    </div>
  </div>
</template>

