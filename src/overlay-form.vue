<template>
  <mu-v-box
    v-show="visible"
    class="overlay-form"
    style="position: absolute;">
    <mu-bar>
      <mu-button
        button-style="link"
        style="color: #fff"
        @click="expanded = !expanded">
        <mu-icon
          :svg="getPath(triangle)"
          style="fill: #ffffff;" />
        {{ title || '属性' }}
      </mu-button>
      <mu-flex-item size="auto" />
      <mu-icon-button
        button-type="normal"
        button-style="link"
        trigger-type="close"
        style="fill: #fff;"
        @click="onClose" />
    </mu-bar>
    <mu-tabs
      v-show="expanded"
      v-model="activeTabName"
      model-control="external"
      style="padding: 0 8px;">
      <mu-tab-panel
        name="基本信息"
        size="auto"
        style="padding: 8px 0;">
        <mu-form
          v-if="basicVisible"
          layout="flow"
          label-width="48px"
          label-align="left"
          :cellpadding="false">
          <mu-form-field
            label="名称">
            <mu-editor
              v-model.trim="name"
              :disabled="disabled" />
          </mu-form-field>
          <mu-form-field
            v-show="overlay.type==='special'"
            label="路宽"
            align-items="center">
            <mu-editor
              v-model.trim="width"
              type="number"
              :disabled="disabled"
              size="auto" />
            <mu-flex-item size="8px" />
            <mu-flex-item>m</mu-flex-item>
          </mu-form-field>
          <mu-form-field
            v-if="legendFieldVisible"
            label="图例">
            <mu-h-box
              :style="{maxWidth: maxWidth}">
              <img :src="specialFile" width="16" height="16">
              <mu-combo-box
                :clearable="false"
                :disabled="disabled"
                popup-height="154px">
                <mu-option
                  v-for="legend in specialLegends"
                  :key="legend.id"
                  style="padding: 5px 0; text-align: center;"
                  @click="onComboBoxSelect('projectMapLegendId', legend.id)">
                  <img :src="legend.iconUrl" width="16" height="16">
                </mu-option>
              </mu-combo-box>
            </mu-h-box>
            <mu-flex-item size="8px" />
            <mu-h-box
              v-show="overlay.type==='marker'"
              align-items="center">
              <mu-combo-box
                v-model="width"
                :options="legendSpecs"
                :clearable="false"
                :popup-render-to-body="true"
                :disabled="disabled"
                popup-height="154px"
                :style="{maxWidth: maxWidth, maxHeight: '154px'}" />
              <mu-flex-item size="8px" />
              <mu-flex-item>px</mu-flex-item>
            </mu-h-box>
          </mu-form-field>
          <mu-form-field
            v-if="fillFieldVisible"
            label="填充">
            <mu-h-box
              :style="{maxWidth: maxWidth}">
              <mu-input
                :style="{width: maxWidth, background: fillColor}" />
              <color-picker
                v-model.trim="fillColor"
                :clearable="false"
                :disabled="disabled" />
            </mu-h-box>
            <mu-flex-item size="8px" />
            <mu-h-box
              align-items="center">
              <mu-editor
                v-model.trim="fillOpacity"
                type="number"
                :clearable="false"
                :disabled="disabled"
                :style="{maxWidth: maxWidth}" />
              <mu-flex-item size="8px" />
              <mu-flex-item>%</mu-flex-item>
            </mu-h-box>
          </mu-form-field>
          <mu-form-field
            v-if="strokeFieldVisible"
            label="边框">
            <mu-h-box
              :style="{maxWidth: maxWidth}">
              <mu-input
                :style="{width: maxWidth, background: strokeColor}" />
              <color-picker
                v-model.trim="strokeColor"
                :disabled="disabled"
                :clearable="false" />
            </mu-h-box>
            <mu-flex-item size="8px" />
            <mu-editor
              v-model.trim="strokeWeight"
              type="number"
              :clearable="false"
              :disabled="disabled"
              :style="{maxWidth: maxWidth}" />
            <mu-flex-item size="8px" />
            <mu-h-box
              v-show="overlay.type !== 'special'"
              :style="{maxWidth: maxWidth}">
              <mu-icon
                combo-icon
                :svg="getPath(strokeStyle)" />
              <mu-combo-box
                :clearable="false"
                :disabled="disabled"
                :popup-render-to-body="true">
                <mu-option
                  v-for="stroke in strokeSpecs"
                  :key="stroke.value"
                  style="padding: 5px 0; text-align: center;"
                  @click="onComboBoxSelect('strokeStyle', stroke.value)">
                  <mu-icon
                    :svg="getPath(stroke.value)" />
                </mu-option>
              </mu-combo-box>
            </mu-h-box>
          </mu-form-field>
          <mu-form-field
            v-if="fontFieldVisible"
            align-items="center"
            label="字体">
            <mu-h-box
              :style="{maxWidth: maxWidth}">
              <mu-input
                :style="{width: maxWidth, background: strokeColor}" />
              <color-picker
                v-model.trim="strokeColor"
                :disabled="disabled"
                :clearable="false" />
            </mu-h-box>
            <mu-flex-item size="8px" />
            <mu-combo-box
              v-model="width"
              :options="fontSpecs"
              :clearable="false"
              :popup-render-to-body="false"
              :disabled="disabled"
              popup-height="154px"
              :style="{maxWidth: maxWidth}" />
            <mu-flex-item size="8px" />
            <mu-flex-item>px</mu-flex-item>
          </mu-form-field>
          <mu-form-field
            label="锁定">
            <mu-toggle
              v-model="isLocked"
              :disabled="disabled" />
          </mu-form-field>
          <mu-form-field
            label="显示">
            <mu-toggle v-model="isDisplay" />
          </mu-form-field>
          <mu-form-field
            v-if="structures"
            label="构筑物"
            :title="structureName">
            <label>{{ structureName }}</label>
          </mu-form-field>
          <slot name="basic" />
        </mu-form>
      </mu-tab-panel>
      <mu-tab-panel
        name="扩展信息"
        size="auto"
        style="padding: 8px 0;">
        <mu-form
          v-if="basicVisible"
          layout="flow"
          label-width="48px"
          label-align="left"
          :cellpadding="false">
          <mu-form-field
            label="备注">
            <mu-editor
              v-model.trim="remark"
              :disabled="disabled" />
          </mu-form-field>
        </mu-form>
      </mu-tab-panel>
    </mu-tabs>
    <structure-tree
      v-if="structures"
      :structures="structures"
      :overlay="overlay" />
    <slot />
  </mu-v-box>
</template>
<script>
  import BMap from 'BMap'
  import isEmpty from 'lodash.isempty'
  import { legendSpecs, fontSpecs, strokeSpecs } from './constants'
  import { fixedNumber } from './map/calc/data'

  import svg from './assets/svg-icons'

  import ColorPicker from './color-picker.vue'
  import StructureTree from './structure.vue'

  export default {
    inject: ['baiduMap'],
    components: {
      ColorPicker,
      StructureTree
    },
    props: {
      title: String,
      basicVisible: {
        type: Boolean,
        default: true
      },
      maxWidth: {
        type: String,
        default: '60px'
      }
    },
    data () {
      return {
        visible: true,
        expanded: true,
        activeTabName: '基本信息'
      }
    },
    computed: {
      triangle () {
        return this.expanded ? svg.triangleDown : svg.triangleRight
      },
      legends () {
        return this.baiduMap.legends
      },
      structures () {
        return this.baiduMap.structures
      },
      overlay () {
        return this.baiduMap.activeOverlay || {}
      },
      disabled () {
        return this.overlay.disabled
      },
      overlayType () {
        const type = this.overlay.type || ''

        if (type.includes('special')) return 'special'
        else if (this.overlay instanceof BMap.Polygon) return 'polygon'
        else if (this.overlay instanceof BMap.Polyline) return 'polyline'
        else return type
      },
      legendFieldVisible () {
        return ['marker', 'special'].includes(this.overlayType)
      },
      fillFieldVisible () {
        const type = this.overlayType
        const svgMarker = type === 'marker' && !(this.overlay instanceof BMap.Marker)
        return ['polygon'].includes(type) || svgMarker
      },
      strokeFieldVisible () {
        return !['marker', 'label'].includes(this.overlay.type)
      },
      fontFieldVisible () {
        return this.overlay.type === 'label'
      },
      lockVisible () {
        return this.overlay.type !== 'hotSpot'
      },
      displayVisible () {
        return this.lockVisible
      },
      legendSpecs () {
        return this.getComboOptions(legendSpecs)
      },
      fontSpecs () {
        return this.getComboOptions(fontSpecs)
      },
      strokeSpecs () {
        return strokeSpecs
      },
      specialLegends () {
        return this.legends.filter(
          item => item.type === this.overlayType && item.value !== 'create'
        )
      },
      name: {
        get () {
          return this.overlay.name
        },
        set (val) {
          this.baiduMap.updateOverlay('name', val)
        }
      },
      specialFile () {
        return this.overlay.iconUrl
      },
      width: {
        get () {
          return this.overlay.width
        },
        set (val) {
          this.baiduMap.updateOverlay('width', parseFloat(val))
        }
      },
      height: {
        get () {
          return this.overlay.height || null
        },
        set (val) {
          this.baiduMap.updateOverlay('height', parseFloat(val))
        }
      },
      fillColor: {
        get () {
          return this.overlay.fillColor
        },
        set (val) {
          if (this.fillFieldVisible) {
            this.baiduMap.updateOverlay('fillColor', val)
          }
        }
      },
      fillOpacity: {
        get () {
          return fixedNumber(this.overlay.fillOpacity * 100, 2)
        },
        set (val) {
          if (val === 0) val = 0.00001
          this.baiduMap.updateOverlay('fillOpacity', fixedNumber(val / 100, 4))
        }
      },
      strokeColor: {
        get () {
          return this.overlay.strokeColor
        },
        set (val) {
          this.baiduMap.updateOverlay('strokeColor', val)
        }
      },
      strokeWeight: {
        get () {
          return this.overlay.strokeWeight
        },
        set (val) {
          this.baiduMap.updateOverlay('strokeWeight', val)
        }
      },
      strokeStyle () {
        return this.overlay.strokeStyle
      },
      isLocked: {
        get () {
          return this.overlay.isLocked
        },
        set (val) {
          this.baiduMap.updateOverlay('isLocked', val)
        }
      },
      isDisplay: {
        get () {
          return this.overlay.isCommand ? this.overlay.isDisplay : this.overlay.isCommandDisplay
        },
        set (val) {
          const key = this.overlay.isCommand ? 'isDisplay' : 'isCommandDisplay'
          this.baiduMap.updateOverlay(key, val)
        }
      },
      structureName () {
        return this.overlay.structureName
      },
      remark: {
        get () {
          return this.overlay.remark
        },
        set (val) {
          this.baiduMap.updateOverlay('remark', val)
        }
      }
    },
    watch: {
      overlay (val) {
        this.visible = isEmpty(this.overlay) ? false : !!val
      }
    },
    mounted () {
      this.visible = false
    },
    methods: {
      getPath (icon) {
        const data = {
          dashed: svg.dashed,
          solid: svg.solid
        }
        return data[icon] || icon
      },
      getComboOptions (data) {
        const map = []
        data.map(item => {
          map.push({ value: item, label: item })
        })
        return map
      },
      onClose () {
        this.visible = false
      },
      onComboBoxSelect (key, val) {
        this.baiduMap.updateOverlay(key, val)
      },
      onChangeLevel (val) {
        this.baiduMap.updateOverlay('level', val)
      }
    }
  }
</script>

<style scoped>
  button:hover {
    color: $fontColorWhite !important;
  }

  .mu-editor[disabled] > .mu-input,
  .mu-toggle[disabled] > .mu-toggle-slide-bar {
    background: $bgColorDisabled;
  }

  .mu-color-picker {
    position:absolute;
    max-width: 60px;
    opacity: 0;
    z-index: 10;
    & > input {
      cursor: pointer;
    }
    & > .mu-color-picker-indicator {
      z-index: -1 !important;
    }
  }

  .overlay-form {
    width: 280px;
    top: 72px;
    right: 32px;
    bottom: 108px;
    overflow: auto;
    z-index: 10;
    & *:not(.mu-tab-item):not(.mu-tab-label){
      color: $fontColorGrey;
      font-size: $fontSize !important;
    }
    & > * {
      background: $bgColorLight;
      &.mu-bar,
      & > .mu-bar {
        padding: 0 0 0 8px;
        background: $bgColorDark;
      }
      & img, & [combo-icon] {
        position: absolute;
        top: 8px;
        left: 16px;
        z-index: 10;
      }
    }
  }
</style>
