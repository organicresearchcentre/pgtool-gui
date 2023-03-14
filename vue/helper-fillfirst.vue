<script>
module.exports = {
  name: "helper-fillfirst",
  props: [ 'pairs' ],
  mixins: [ mixin_getQuestion ],
  methods: {
    title(category) {
      return this.$root.pgtoolForm.categories[category].title
    },
    getQuestionNumber(qcode) {
      var category = this.categoryOf(qcode)
      var indicator = this.indicatorOf(qcode)
      return this.$root.pgtoolForm.categories[category].indicators[indicator].questions[qcode].number
    }
  }
}
</script>

<template>
	<div v-if="pairs.length > 0" class="m-helper-fillfirst soft">
    <template v-if="pairs.length > 1">
      <p>Using info from: 
        <template v-for="qcode, idx in pairs">
          <router-link class="glow-text" :key="idx" :to="'/' + categoryOf(qcode) + '#' + getQuestionNumber(qcode)">{{ title(categoryOf(qcode)) + ' ' + getQuestionNumber(qcode) }}</router-link><span v-if="idx < pairs.length-1" :key="'comma'+idx">, </span>
        </template>
      </p>
    </template>
    <template v-else>
      <p>Using info from: <router-link class="glow-text" :to="'/' + categoryOf(pairs[0]) + '#' + getQuestionNumber(pairs[0])">{{ title(categoryOf(pairs[0])) + ' ' + getQuestionNumber(pairs[0]) }}</router-link></p>
    </template>
  </div>
</template>