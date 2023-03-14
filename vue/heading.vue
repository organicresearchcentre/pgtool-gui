<script>
module.exports = {
  name: "heading",
  props: [ 'heading' ]
}
</script>

<template>
	<div v-if="heading">
      <p>
        <span v-if="heading.html" v-html="heading.content"></span>
        <span v-else>{{ heading.content }}</span>
        <slot></slot>
      </p>
  </div>
</template>