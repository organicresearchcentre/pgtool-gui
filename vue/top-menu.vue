<script>
module.exports = {
  name: "top-menu",
  mixins: [mixin_currentAssessment, mixin_setInitialValues, mixin_checkCompulsory],
  data: function() {
    return {
      percentages: {},
      menuShowing: true
    }
  },
  created() {
    this.setPercentages()
  },
  mounted() {
    var self = this
    VueBus.$emit('mounted');

    VueBus.$on('updatePercentages', function() {
      self.setPercentages()
    })

    $('#menuinner').on('hidden.bs.collapse', function () {
      self.menuShowing = false
      VueBus.$emit('updateHeight')
    })
    $('#menuinner').on('shown.bs.collapse', function () {
      self.menuShowing = true
      VueBus.$emit('updateHeight')
    })
  },
  computed: {
    categories() {
      return this.$root.pgtoolForm.categories
    },
    itemWidth() {
      return 100 / ((Object.keys(this.categories).length + 1)/2)
    },
    scores() {
      return this.$root.currentAssessmentScores;
    }
  },
  methods: {
    doActions(event, navigate) {
      $('#menuinner').collapse('hide')
      navigate(event)
    },
    hasQuestionsToFill(category_code) {
      return category_code == 'animalhealthwelfare' ? this.hasLivestock() : !['npkbudget'].includes(category_code)
    },
    hasScoring(category_code) {
      return  category_code == 'animalhealthwelfare' ? this.hasLivestock() : !['initialdata'].includes(category_code)
    },
    hasLivestock() {
      return this.toShow(this.$root.pgtoolForm.categories.animalhealthwelfare)
    },
    imgUrl(category_code) {
      return 'img/categories/' + category_code + '.jpg'
    },
    setPercentages() {
      for (category_code in this.categories) {
        if (!this.hasQuestionsToFill(category_code)) continue;
        this.setCategoryPercentages(category_code)
      }
    },
    setCategoryPercentages(category_code) {
      var compulsoryCount = 0
      var compulsoryAnswered = 0
      var indicators = this.categories[category_code].indicators
      for (indicator_code in indicators) {
        var questions = indicators[indicator_code].questions
        for (question_code in questions) {
          var question = questions[question_code]
          if (this.isCompulsory(question)) {
            compulsoryCount++
            try {
              if (this.answered(question_code)) {
                compulsoryAnswered++
              }
            } catch(err) {
              // not answered
            }
            /*var answer = this.currentAssessmentAnswers[question_code]
            var emptyValue = this.setInitialValue(question)
            if (question.answer_type == 'array' || question.question_type == 'multiple_answer') {
              if (!arraysEqual(answer, emptyValue)) {
                compulsoryAnswered++
              }
            } else if (answer !== null && answer !== undefined && answer !== "" && answer !== "null") {
                compulsoryAnswered++
            }*/
          }
        }
      }
      if (compulsoryCount == 0) {
        var perc = 0//null//'- %'
      } else {
        var perc = Math.round((compulsoryAnswered/compulsoryCount) * 100)// + ' %'
      }
      this.$set(this.percentages, category_code, perc)
    }
  }
}
</script>

<template>
  <div id="menu" class="sticky-top bg-white d-print-none">
    <div id="menuinner" class="collapse show h-400">
      <div class="container-fluid nav justify-content-center">
        <div v-for="category, category_code in categories" :key="category_code" class="nav-link" :style="{ width: itemWidth + '%', cursor: 'pointer' }" :id="category_code + '-menu'">
          <router-link :to="'/' + category_code" custom v-slot="{ navigate }">
            <div class="card text-white card-has-bg click-col" :style="{ backgroundImage: 'url(' + imgUrl(category_code) + ')' }" @click="doActions($event, navigate)">
              <img class="card-img d-none" :src="'img/categories/' + category_code + '.jpg'" :alt="category.title">
              <div class="card-img-overlay d-flex flex-column" :style="{ background: hasQuestionsToFill(category_code) && percentages[category_code] == 100 ? 'linear-gradient(0deg, rgba(35, 79, 109, 0%) 0%, #649b35 110%)' : 'linear-gradient(0deg, rgba(35, 79, 109, 0%) 0%, #22586a 110%)' }">
                <div class="card-body">
                  <p class="card-title mt-0 strong"><strong><a class="text-white" herf="#">{{ category.title }}</a></strong></p>
                </div>
                <div class="card-footer">
                  <div v-if="hasQuestionsToFill(category_code)">
                    <p class="progress-description">% complete:</p>
                    <div class="progress">
                      <div class="progress-bar filling" role="progressbar" :style="{width: percentages[category_code] + '%'}">{{ percentages[category_code] + "%" }}</div>
                    </div>
                  </div>
                  <div v-else>
                    <p v-if="category_code == 'npkbudget'" class="progress-description text-center">Automatically filled</p>
                    <p v-if="category_code == 'animalhealthwelfare'" class="progress-description text-center">No livestock added</p>
                  </div>
                  <div v-if="hasScoring(category_code)">
                    <p class="progress-description">Score:</p>
                    <div class="progress">
                      <div class="progress-bar score" role="progressbar" :style="{width: ((100/5) * scores[category_code]) + '%'}">{{ scores[category_code] }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </router-link>
        </div>
        <div class="nav-link" :style="{ width: itemWidth + '%', cursor: 'pointer' }" id="scores-menu'">
          <router-link to="/scores" custom v-slot="{ navigate }">
            <div class="card text-white card-has-bg click-col" style="background-image:url('img/categories/scores.png')" @click="doActions($event, navigate)">
              <img class="card-img d-none" :src="'img/categories/scores.png'">
              <div class="card-img-overlay d-flex flex-column">
                <div class="card-body">
                  <p class="card-title mt-0 strong"><strong><a class="text-white" herf="#">Scores</a></strong></p>
                </div>
              </div>
              <div class="card-footer">
                <div class="media">
                </div>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </div>
    <div class="separator pointer text-center" data-toggle="collapse" data-target="#menuinner">
      <p>Categories<i v-show="menuShowing" class="fas fa-angle-up pl-2"></i><i v-show="!menuShowing" class="fas fa-angle-down pl-2"></i></p>
    </div>
  </div>
</template>