import Vue from 'vue'

import MapBidu from './map/map.vue'
import Mode from './mode.vue'
import Toolkit from './toolkit.vue'
import OverlayForm from './overlay-form.vue'
import OverlayList from './overlay-list.vue'
import OverlayToolkit from './overlay-toolkit.vue'

function install ($Vue = Vue) {
  $Vue.component('map-bidu', MapBidu)
  $Vue.component('map-mode', Mode)
  $Vue.component('map-toolkit', Toolkit)
  $Vue.component('map-overlay-form', OverlayForm)
  $Vue.component('map-overlay-list', OverlayList)
  $Vue.component('map-overlay-toolkit', OverlayToolkit)
}

if (Vue) install(Vue)

export {
  MapBidu,
  Mode,
  Toolkit,
  OverlayToolkit,
  OverlayForm,
  OverlayList
}
