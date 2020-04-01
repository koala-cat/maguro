<template>
  <mu-popup-editor-wrapper
    class="mu-color-picker"
    @dropdownmounted="initPicker"
    @beforedropdowndestroy="destroyPicker">
    <div />
    <div class="mu-color-picker-footer mu-background-hover" @click="hidePopup">
      <mu-icon icon="ok" />
    </div>
    <template #expert>
      <div class="mu-color-picker-indicator" />
    </template>
  </mu-popup-editor-wrapper>
</template>
<script>
  import { BasePopupEditor } from 'mussel'
  import AColorPicker from 'a-color-picker'

  export default {
    extends: BasePopupEditor,
    props: {
      popupWidth: {
        type: String,
        default: 'auto'
      },
      popupStyle: {
        type: String,
        default: 'color-picker'
      }
    },
    mounted: function () {
      this.setIndicator(this.value)
    },
    methods: {
      setInputValue: function (value) {
        if (this.$el) this.setIndicator(this.value)
      },
      initPicker: function (el) {
        el.style.overflow = 'hidden'
        this.colorPicker = AColorPicker
          .from(el.querySelector('div'), {
            showHSL: false,
            showRGB: false,
            color: this.value
          })
          .on('change', this.setColor)
      },
      destroyPicker: function () {
        if (this.colorPicker) {
          this.colorPicker[0].destroy()
        }
      },
      setIndicator: function (color) {
        const indicator = this.$el.querySelector('.mu-color-picker-indicator')
        if (!indicator) return
        if (color) {
          const hex = AColorPicker.parseColor(color, 'hex')
          const rgb = AColorPicker.parseColor(color, 'rgb')
          const isDark = rgb[0] * 0.299 + rgb[1] * 0.578 + rgb[2] * 0.114 < 192
          indicator.style.backgroundColor = hex
          indicator.style.color = isDark ? '#eee' : '#222'
          indicator.innerText = hex
          this.params.value = hex
          return hex
        } else {
          indicator.style.backgroundColor = 'transparent'
          indicator.innerText = ''
          this.params.value = ''
        }
      },
      setColor: function (picker, color) {
        const hex = this.setIndicator(color)
        this.$emit('change', hex)
      },
      clear: function () {
        this.setIndicator()
        this.focus()
        this.$emit('clear')
      }
    }
  }
</script>

<style scoped>
  .mu-color-picker input[readonly] {
    background: #fff;
  }
  .mu-dropdown-panel[popup-style="color-picker"] {
    overflow: hidden;
  }
  .mu-dropdown-panel .a-color-picker {
    border-radius: 0;
    box-shadow: none;
  }
  .mu-dropdown-panel canvas {
    border-radius: 0;
  }
  .mu-color-picker-footer {
    padding: 4px;
    text-align: center;
    cursor: pointer;
  }
  .mu-color-picker-indicator {
    position: absolute;
    z-index: 2;
    top: 50%;
    left: 10px;
    padding: 0 10px;
    transform: translateY(-50%);
  }
</style>
