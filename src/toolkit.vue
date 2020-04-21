<template>
  <mu-h-box class="toolkit">
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
        :svg="screenIcon"
        style="fill: #fff;" />
    </mu-icon-button>
  </mu-h-box>
</template>
<script>
  import svg from './assets/svg-icons'

  export default {
    inject: ['baiduMap'],
    data () {
      return {
        busy: false,
        fullScreen: false
      }
    },
    computed: {
      screenIcon () {
        return this.fullScreen ? svg.zoomDown : svg.zoomUp
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
      save () {
        this.baiduMap.saveOverlays()
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

<style scoped>
  .toolkit {
    position: absolute !important;
    top: 0;
    left: 0;
    right: 0;
    padding: 4px 8px;
    background: $bgColorLight;
    z-index: 100;
    & button {
      color: $fontColorWhite !important;
      font-size: $fontSize !important;
      &[icon-only] {
        font-size: 18px !important;
      }
      &:hover {
        background: $bgColorDark !important;
      }
      &[disabled] {
        color: $fontColorGrey !important;
      }
    }
  }
</style>
