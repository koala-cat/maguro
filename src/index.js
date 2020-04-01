
import Vue from 'vue'

import MapBidu from './map/map.vue'
import Toolkit from './toolkit.vue'
import OverlayForm from './overlay-form.vue'
import OverlayList from './overlay-list.vue'
import OverlayToolkit from './overlay-toolkit.vue'

import './theme.pcss'

function install ($Vue = Vue) {
  $Vue.component('maguro', MapBidu)
  $Vue.component('maguro-toolkit', Toolkit)
  $Vue.component('maguro-overlay-form', OverlayForm)
  $Vue.component('maguro-overlay-list', OverlayList)
  $Vue.component('maguro-overlay-toolkit', OverlayToolkit)
}

if (Vue) install(Vue)

export {
  MapBidu,
  Toolkit,
  OverlayToolkit,
  OverlayForm,
  OverlayList
}
