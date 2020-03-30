<template>
  <mu-v-box
    class="overlay-bar"
    size="auto">
    <mu-v-box
      ref="overlayBar"
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
          :src="tool.imgUrl"
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
  import { tools } from '../constants'

  export default {
    inject: ['map'],
    computed: {
      legends () {
        return this.map.legends
      },
      tools () {
        return tools
      },
      activeTool () {
        return this.map.active.tool
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
            const scrollTop = this.$refs.overlayBar.$el.scrollTop
            this.$refs.tool.$el.style.top = `${48 + idx * height - scrollTop}px`
          }, 10)
        }
        this.onSelect(tool)
      },
      onSelect (tool) {
        this.map.selectTool(tool)
      },
      removeLegend (legend) {
        this.map.removeLegend(legend)
      },
      uploadLegend (legend) {
        this.$refs.fileSelector.click()
        this.$refs.fileSelector.onchange = (e) => {
          console.log(e)
          this.map.addLegend(e)
        }
      }
    }
  }
</script>
