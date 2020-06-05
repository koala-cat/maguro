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
          v-show="getVisible(tool)"
          :key="tool.value"
          :title="tool.label"
          :class="{ active: activeToolType === tool.value }"
          @click.native="onSelectTool($event, tool)">
          <mu-icon
            :svg="getPath(tool.value)"
            style="font-size: 20px; fill: #ffffff;" />
        </mu-list-item>
      </mu-v-box>
    </mu-v-box>
    <mu-h-box
      v-show="subTools.length > 0"
      ref="tool"
      :style="style">
      <mu-h-box v-if="activeToolType==='scale'">
        <mu-form
          layout="flow"
          label-width="40px"
          label-align="right"
          :cellpadding="false">
          <mu-form-field
            v-for="tool in subTools"
            :key="tool.type"
            align-items="center"
            size="33%"
            style="font-size: 12px;">
            <label
              style="width: 40px; color: #fff;">
              {{ isUploadPolylineField(tool) ? tool.label : '' }}
              <mu-icon
                v-show="!isUploadPolylineField(tool)"
                :svg="getPath(tool.value)"
                style="font-size: 18px; fill: #ffffff;" />
            </label>
            <mu-combo-box
              v-model="zoomSettings[tool.value]"
              :disabled="!editPermission"
              :options="scaleSpecs"
              :clearable="false"
              :popup-render-to-body="false"
              popup-height="154px"
              @change="onComboBoxSelect(tool.value)" />
          </mu-form-field>
        </mu-form>
      </mu-h-box>
      <mu-h-box
        v-else
        flex-wrap>
        <toolkit
          v-for="tool in subTools"
          :key="tool.id"
          :tool="tool"
          :style="getLegendStyle(tool)"
          @select="onSelect"
          @remove="removeLegend"
          @upload="uploadLegend" />
      </mu-h-box>
    </mu-h-box>
  </mu-v-box>
</template>
<script>
  import { tools, scaleSpecs } from './constants'
  import svg from './assets/svg-icons'

  import Toolkit from './overlay-toolkit.jsx'

  export default {
    inject: ['baiduMap'],
    components: {
      Toolkit
    },
    computed: {
      editPermission () {
        return this.baiduMap.mapEditPermission
      },
      mapType () {
        return this.baiduMap.mapType
      },
      graphicMode () {
        return this.mapType === 'graphic'
      },
      hiddenToolkits () {
        return ['special', 'scale']
      },
      legends () {
        return this.baiduMap.legends
      },
      tools () {
        return tools
      },
      scaleSpecs () {
        const map = []
        scaleSpecs.map(item => {
          map.push({ value: item, label: item })
        })
        return map
      },
      zoomSettings () {
        return this.baiduMap.zoomSettings
      },
      activeTool () {
        return this.baiduMap.activeLegend
      },
      activeToolType () {
        return this.activeTool?.type || this.activeTool?.value || null
      },
      style () {
        return this.activeToolType === 'scale'
          ? 'width: 432px; padding: 8px 0; overflow: visible;'
          : ''
      },
      subTools () {
        const subTools = []
        if (this.activeTool) {
          const value = this.activeTool.type || this.activeTool.value
          let filters = this.legends.filter(
            item => item.type === value && !item.isRemoved && item.isCommand !== false
          )
          if (value === 'label') {
            subTools.splice(0)
          } else if (value === 'scale') {
            filters = tools.filter(item => item.isOverlay)
            subTools.push({ value: 'uploadPolyline', type: 'uploadPolyline', label: '线路' }, ...filters)
          } else {
            subTools.push(...filters)
          }
        }
        return subTools
      }
    },
    methods: {
      getVisible (tool) {
        return !this.graphicMode || (this.graphicMode && !this.hiddenToolkits.includes(tool.value))
      },
      getLegendStyle (tool) {
        return tool.value === 'create'
          ? 'font-size: 16px; line-height: 14px; background: transparent; border: 1px solid rgba(255, 255, 255, 0.6);'
          : this.activeTool === tool
            ? 'background: rgba(255, 255, 255, 0.3)'
            : ''
      },
      getPath (icon) {
        return svg[icon]
      },
      isUploadPolylineField (tool) {
        return tool.type === 'uploadPolyline'
      },
      onSelectTool (e, tool) {
        const el = document.querySelector('.mu-list-item')
        const height = el.getBoundingClientRect().height
        const value = tool.value
        const idx = tools.findIndex(item => item.value === value)
        if (value !== 'label') {
          try {
            e.target.scrollIntoViewIfNeeded()
          } catch {
            e.target.scrollIntoView()
          }
          setTimeout(() => {
            let subToolsHeight = 0
            if (value === 'scale') {
              subToolsHeight = this.$refs.tool.$el.clientHeight - height
            }
            const scrollTop = this.$refs.overlayToolkit.$el.scrollTop
            this.$refs.tool.$el.style.top = `${48 + idx * height - subToolsHeight - scrollTop}px`
          }, 10)
        } else {
          const legend = this.legends.find(item => item.type === value)
          tool.id = legend?.id || null
        }
        this.onSelect(tool)
      },
      onSelect (legend) {
        this.baiduMap.selectLegend(legend)
      },
      onComboBoxSelect (key) {
        this.baiduMap.setMapZoomSettings(key, this.zoomSettings[key])
      },
      removeLegend (legend) {
        this.baiduMap.removeLegend(legend)
      },
      uploadLegend () {
        this.baiduMap.addLegend()
      }
    }
  }
</script>

<style scoped>
  .mu-form-field {
    font-size: $fontSize;
    color: $fontColorWhite !important;
    & > label {
      font-size: $fontSize;
    }
  }
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
    padding: 7px 0 0;
    left: 40px;
    overflow: auto;
    box-shadow: 0 3px 12px rgba(0,0,0,.23),0 3px 12px rgba(0,0,0,.16);
    & a {
      width: 26px;
      height: 26px;
      padding: 4px;
      margin: 0 0 7px 8px;
      color: $fontColorWhite;
      cursor: pointer;
      & img {
        width: 100%;
        height: 100%;
      }
      &:hover {
        background:rgba(255, 255, 255, 0.3)
      }
    }
    & input[disabled] {
      color: $fontColorGrey;
    }
  }

  .overlay-toolkit .mu-list-item {
    padding: 0 6px;
    width: 40px;
    line-height: 40px;
    font-size: 20px;
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
