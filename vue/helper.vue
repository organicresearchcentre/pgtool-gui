<script>
module.exports = {
  name: "helper",
  props: [ "code", "helper" ],
  data() {
    return {
      maxChar: 350,
      truncate: true
    }
  },
  methods: {
    toggle() {
      this.truncate = !this.truncate
    },
    truncateText() {
      var text = this.helper.content
      var isHTML = this.helper.html
      if (isHTML) {
        return clip(text, this.maxChar, { html: true, maxLines: 5 });
      } else {
        return clip(text, this.maxChar);    
      }
    }
  },
  computed: {
    lenghty() {
      return this.code !== 'npkbudget_nutrientbalance' && this.helper.content.length > this.truncateText().length
    },
    truncatedText() {
      if (this.lenghty && this.truncate) {
        return this.truncateText()
      } else {
        return this.helper.content
      }
    },
  }
}
</script>

<template>
	<div class="m-helper" :class="{'row no-gutters': helper.image && helper.content }">
        <div v-if="helper.content" :class="{'col-sm-6': helper.image}">
          <div v-if="helper.html" v-html="truncatedText"></div>
          <p v-else>{{ truncatedText }}</p>
          <button v-if="lenghty" type="button" class="btn btn-sm btn-show-more mb-3" @click="toggle">Show {{ truncate ? 'more' : 'less' }}</button>
        </div>
        <div v-if="helper.image" class="text-center" :class="{'col-sm-6': helper.content}" v-html="helper.image"></div>
    </div>
</template>