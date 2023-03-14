<script>
module.exports = {
  name: "tab",
  data() {
    return {
        tabs: [],
        currentTab: 0
    }
  },
  created() {
    var self = this;

    this.setupTabs();

    VueBus.$on('updateTabs', function() {
        self.setupTabs();
    })

    VueBus.$on('changeTab', function(index) {
        self.changeTab(index, true);
    })

    VueBus.$on('removeTab', function() {
        self.removeTab()
    })
      
  },
  mounted() {
      this.$nextTick(function() {

        $('#tabs > ul').sortable({
            items: '> li:not(.locked)' //This will prevent sortables to move around the locked item
        });

        VueBus.$emit('mounted');
      })
  },
  methods: {
    openRemoveTabModal() {
        $('#removeTabModal').modal('show');
        // this is in index.html because modals can't be inside sticky elements
    },
      setupTabs() {
        var self = this;
        this.tabs = []

        this.$root.$data.pgtoolAssessmentsNames.forEach(function(assessmentID) {
            self.addTab(assessmentID);
        })
      },
      addNewTab() {
        VueBus.$emit('setupAssessment');
        
        var root = this.$root.$data;
        var index = root.pgtoolAssessmentsNames.length
        this.addTab(root.pgtoolAssessmentsNames[index - 1]);
        this.changeTab(index - 1);
      },
      addTab(name) {
          this.tabs.push({ name: name, editing: false });
      },
      removeTab(index) {
          if (index == null) index = this.currentTab
          if (this.tabs.length == 1) {
              alert("There has to be at least one active assessment.");
              return;
          }
          this.tabs.splice(index, 1)
          this.$root.$data.pgtoolAssessmentsNames.splice(index, 1)
          this.$root.$data.pgtoolAnswers.splice(index, 1)
          this.$root.$data.pgtoolScores.splice(index, 1)
          this.$root.$data.pgtoolRunnedScenario.splice(index, 1)
          this.$root.$data.pgtoolLastSaved.splice(index, 1)
          this.$root.$data.stopWatcher.splice(index, 1)
          this.changeTab(this.tabs.length - 1)
      },
      editTab(index) {
        this.tabs[index].editing = true
      },
      saveTab(index) {
        this.tabs[index].editing = false
        var otherNames = this.$root.$data.pgtoolAssessmentsNames.slice()
        otherNames.splice(index,1);
        if (otherNames.includes(this.tabs[index].name)) {
            alert("This assessment name already exists. Try a new one.")
            this.tabs[index].name = this.$root.pgtoolAssessmentsNames[index]
        } else {
            this.$set(this.$root.pgtoolAssessmentsNames, index, this.tabs[index].name)
        }
      },
      changeTab(index, preventRoutePush = false) {
          this.currentTab = index;
          VueBus.$emit('tabChange', index);
          if (!preventRoutePush && this.$route.name != 'initialdata') router.push('initialdata')
      },
      cloneTab(index) {
          var newPosition = index + 1
          var newTab = $.extend({}, this.tabs[index]) // clone obj
          newTab.name = this.$root.checkName(newTab.name)
          this.tabs.splice(newPosition, 0, newTab); // inserts at given position (0 deletion)
          this.$root.$data.pgtoolAssessmentsNames.splice(newPosition, 0, newTab.name)
          this.$root.$data.pgtoolAnswers.splice(newPosition, 0, $.extend({}, this.pgtoolAnswers[index]))
          this.$root.$data.pgtoolScores.splice(newPosition, 0, $.extend({}, this.pgtoolScores[index]))
          this.$root.$data.pgtoolRunnedScenario.splice(newPosition, 0, this.$root.$data.pgtoolRunnedScenario[index])
          this.$root.$data.pgtoolLastSaved.splice(newPosition, 0, this.$root.$data.pgtoolLastSaved[index])
          this.$root.$data.stopWatcher.splice(newPosition, 0, this.$root.$data.stopWatcher[index])
          this.changeTab(newPosition)
      },
      activeTab(index) {
          return this.currentTab == index;
      }
    },
    computed: {
        pgtoolAssessmentsNames() {
            return this.$root.$data.pgtoolAssessmentsNames
        },
        pgtoolAnswers() {
            return this.$root.$data.pgtoolAnswers
        },
        pgtoolScores() {
            return this.$root.$data.pgtoolScores
        },
    }
}
</script>

<template>
    <div id="tabs">
        <ul class="nav nav-tabs pt-1">
            <li v-for="tab, index in tabs" :key="index" class="nav-item mx-2 soft" @click="changeTab(index, true)">
                <a class="nav-link" :class="{'active': activeTab(index)}" href="#">
                    <input v-if="tab.editing" v-model="tab.name" type="text" @keyup.enter="saveTab(index)">
                    <span v-else>{{tab.name}}</span>
                    <span v-if="activeTab(index)">
                        <i v-if="tab.editing" class="far fa-save" @click="saveTab(index)"></i>
                        <i v-else class="ml-2 fas fa-pencil-alt" @click="editTab(index)"  data-toggle="tooltip" data-placement="top" title="Edit assessment name"></i>
                        <i class="ml-2 far fa-clone" @click.stop="cloneTab(index)" data-toggle="tooltip" data-placement="top" title="Clone assessment"></i>
                        <i class="ml-2 fas fa-times" @click.stop="openRemoveTabModal()" data-toggle="tooltip" data-placement="top" title="Delete assessment"></i>
                        <!-- .stop event modifier prevents the click event propagation, and hence the changeTab -->
                    </span>
                </a>
            </li>
            <li class="nav-item soft locked mx-2">
                <a class="nav-link no-border" href="#" @click="addNewTab()">
                    <i class="fas fa-plus"></i> New assessment
                </a>
            </li>
        </ul>
    </div>
</template>