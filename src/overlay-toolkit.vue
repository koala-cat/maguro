<template>
  <mu-v-box
    class="overlay-toolkit"
    size="auto">
    <mu-v-box
      ref="overlayToolkit"
      style="position: absolute; top: 48px; bottom: auto; overflow: auto;">
      <mu-v-box
        size="auto">
        <mu-list-item
          v-for="tool in tools"
          :key="tool.value"
          :label="tool.label"
          :class="{ active: activeToolType === tool.value }"
          @click.native="onSelectTool($event, tool)"
        />
      </mu-v-box>
    </mu-v-box>
    <mu-h-box
      v-show="subTools.length > 0"
      ref="tool"
      flex-wrap>
      <a
        v-for="(tool, index) in subTools"
        :key="index"
        :style="getLegendStyle(tool)">
        <span
          v-if="tool.value === 'create'"
          @click="uploadLegend">+</span>
        <img
          v-else
          :src="tool.iconUrl"
          @click="onSelect(tool)">
        <span
          v-if="!tool.disabled"
          class="icon ipm-icon-error-circle"
          style="position: absolute; top: 0; right: -6px; color: #f5222d; line-height: 0;"
          @click.stop="removeLegend(tool)" />
      </a>
      <input
        ref="fileSelector"
        type="file"
        accept=".png,.jpeg,.jpg,.svg"
        style="display: none;">
    </mu-h-box>
  </mu-v-box>
</template>
<script>
  import { tools } from './constants'

  export default {
    inject: ['baiduMap'],
    computed: {
      legends () {
        return this.baiduMap.legends
      },
      tools () {
        return tools
      },
      activeTool () {
        return this.baiduMap.activeLegend
      },
      activeToolType () {
        return this.activeTool?.type || this.activeTool?.value || null
      },
      subTools () {
        const subTools = []
        if (this.activeTool) {
          const value = this.activeTool.type || this.activeTool.value
          const filters = this.legends.filter(
            item => item.type === value && !item.isRemoved
          )
          if (value === 'label') {
            subTools.splice(0)
          } else {
            subTools.push(...filters)
          }
        }
        return subTools
      }
    },
    methods: {
      getLegendStyle (tool) {
        return this.activeTool === tool && tool.value !== 'create'
          ? 'border: 1px solid #1890ff'
          : ''
      },
      onSelectTool (e, tool) {
        const height = e.target.getBoundingClientRect().height
        const value = tool.value
        const idx = tools.findIndex(item => item.value === value)
        if (value !== 'label') {
          try {
            e.target.scrollIntoViewIfNeeded()
          } catch {
            e.target.scrollIntoView()
          }
          setTimeout(() => {
            const scrollTop = this.$refs.overlayToolkit.$el.scrollTop
            this.$refs.tool.$el.style.top = `${48 + idx * height - scrollTop}px`
          }, 10)
        }
        this.onSelect(tool)
      },
      onSelect (legend) {
        this.baiduMap.selectLegend(legend)
      },
      removeLegend (legend) {
        this.baiduMap.removeLegend(legend)
      },
      uploadLegend (legend) {
        this.$refs.fileSelector.click()
        this.$refs.fileSelector.addEventListener('change', (e) => {
          this.baiduMap.addLegend(e)
        })
      }
    }
  }
</script>

<style scoped>
  .overlay-toolkit {
    position: absolute !important;
    top: 40px;
    width: 40px;
    margin: 16px;
    text-align: center;
    z-index: 100;
  }

  .overlay-toolkit > div {
    background: $bgColorLight;
    &::-webkit-scrollbar {
      width: 0;
    }
  }

  .overlay-toolkit > div:last-child {
    position: absolute;
    width: 152px;
    max-height: 120px;
    height: auto;
    padding: 8px 0 0;
    left: 40px;
    overflow: auto;
    box-shadow: 0 3px 12px rgba(0,0,0,.23),0 3px 12px rgba(0,0,0,.16);
    & a {
      width: 28px;
      height: 28px;
      padding: 4px;
      margin: 0 0 8px 8px;
      background: $fontColorWhite;
      & img {
        width: 100%;
        height: 100%;
      }
    }
  }

  .overlay-toolkit .mu-list-item {
    padding: 0 6px;
    width: 40px;
    line-height: 40px;
    font-size: $fontSize;
    color: $fontColorWhite !important;
    &:hover {
      cursor: pointer;
      background: $bgColorHover;
    }
    &.active {
      background: $bgColorActive;
    }
  }
</style>
