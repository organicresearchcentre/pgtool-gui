<script>
module.exports = {
  name: "card",
	props: {
    header: {
      type: String,
      required: true
    },
    body: {
      type: String,
      required: true
    },
    footer: {
      type: String,
      default: null
    },
    footerhtml: {
      type: String,
      default: null
    },
    color: {
      type: String,
      default: null
    }
	}
}
</script>

<template>
	<div class="card border-secondary" style="max-width: 12rem;">
		<div class="card-header border-secondary text-center">{{header}}</div>
		<div class="card-body text-secondary text-center">
			<h5 class="card-title" :style="{ color: color }">{{body}}</h5>
		</div>
		<div v-if="footerhtml" class="card-footer bg-transparent border-secondary text-center text-secondary" v-html="footerhtml"></div>
		<div v-if="footer" class="card-footer bg-transparent border-secondary text-center text-secondary">{{footer}}</div>
	</div>
</template>