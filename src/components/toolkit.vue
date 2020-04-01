<template>
  <mu-h-box class="toolbar">
    <slot />
    <mu-button
      button-style="text"
      @click="save">
      <mu-icon icon-class="ipm-icon-save" />
      保存
    </mu-button>
    <mu-flex-item size="auto" />
    <mu-icon-button
      button-style="text"
      style="font-size: 18px;"
      @click="switchScreen">
      <mu-icon
        :svg="getScreen()"
        style="fill: #fff;" />
    </mu-icon-button>
  </mu-h-box>
</template>
<script>
  import d from '../d'

  export default {
    inject: ['map'],
    data () {
      return {
        busy: false,
        fullScreen: false
      }
    },
    mounted () {
      const exitHandler = () => {
        if (!this.setFullScreen()) {
          this.fullScreen = false
        }
      }
      if (document.addEventListener) {
        document.addEventListener('webkitfullscreenchange', exitHandler, false)
        document.addEventListener('mozfullscreenchange', exitHandler, false)
        document.addEventListener('fullscreenchange', exitHandler, false)
        document.addEventListener('MSFullscreenChange', exitHandler, false)
      }
    },
    methods: {
      getScreen () {
        return this.fullScreen ? d['zoom-down'] : d['zoom-up']
      },
      save () {
        this.map.saveOverlays()
      },
      setFullScreen () {
        return document.fullscreenElement || document.webkitFullscreenElement ||
          document.mozFullScreenElement || document.msFullscreenElement
      },
      switchScreen () {
        if (this.setFullScreen()) {
          this.fullScreen = false
          if (document.exitFullscreen) {
            document.exitFullscreen()
          } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen()
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen()
          } else if (document.msExitFullscreen) {
            document.msExitFullscreen()
          }
        } else {
          const element = document.querySelector('#map')
          this.fullScreen = true
          if (element.requestFullscreen) {
            element.requestFullscreen()
          } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen()
          } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT)
          } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen()
          }
        }
      }
    }
  }
</script>
