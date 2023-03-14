<script>
module.exports = {
  name: "location-map",
  mixins: [ mixin_currentAssessment ],
  data: function() {
    return {
      marker: null,
      map: null
    }
  },
  mounted() {
		if (this.map === null) this.setupMap()
  },
  methods: {
    updateCoordinates() {
      var coordinates = this.marker.getLatLng()
      this.$set(this.currentAssessmentAnswers, 'initialdata_farminfo_longitude', coordinates.lng)
      this.$set(this.currentAssessmentAnswers, 'initialdata_farminfo_latitude', coordinates.lat)
    },
    addMarker(latlng) {
      if (this.marker) this.map.removeLayer(this.marker)
      this.marker = L.marker(latlng, {
        draggable: true
      }).addTo(this.map)
      this.marker.on('dragend', this.updateCoordinates);
      this.map.panTo(latlng)
    },
    removeMarker() {
      this.map.removeLayer(this.marker);
      this.marker = null;
    },
    setupMap() {
      var self = this
      this.map = L.map('map').setView([54.093409, -2.89479], 4)

      L.tileLayer.bing({
        bingMapsKey: 'AlnGEbcq_ASZA91ZFMYGam1ByCeZg4Sk2LN3W9C35Y1iOESkGatJ-hWL0P05eTpG',
        imagerySet: 'AerialWithLabels'
      }).addTo(this.map)

      function onMapClick(e) {
        self.addMarker(e.latlng,)
        self.updateCoordinates()
      }

      this.map.on('click', onMapClick);

      this.$watch('currentAssessmentAnswers.initialdata_farminfo_longitude', function(newValue) {
        if (newValue !== null) {
          self.addMarker(L.latLng(self.currentAssessmentAnswers.initialdata_farminfo_latitude, self.currentAssessmentAnswers.initialdata_farminfo_longitude))
        } else if (self.marker) {
          self.removeMarker();
        }
      }, { deep: true });
    }
  },
}
</script>

<template>
	<div class="mt-3">
		<div>
			<p class="m-question">Please, select your approximate location by clicking on the map.</p>
		</div>
		<div id="map"></div>
	</div>
</template>