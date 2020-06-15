<template>
  <mu-v-box
    class="overlay-list">
    <mu-icon-button
      button-type="normal"
      button-style="link">
      <mu-icon
        :svg="listIcon"
        :class="{active: overlayListVisible}"
        @click="onClickOverlayWindow" />
    </mu-icon-button>
    <mu-v-box
      v-show="overlayListVisible"
      class="list">
      <mu-bar style="border-bottom: 1px solid #a5a5a5;">
        {{ title || '元件列表' }}
      </mu-bar>
      <mu-bar>
        <label
          v-show="hiddenFilterVisible">
          <input
            v-model="showHiddenOverlay"
            type="checkbox">
          只显示已隐藏
        </label>
        <label
          v-show="unlinkFilterVisible">
          <input
            v-model="showUnlinkOverlay"
            type="checkbox">
          只显示未关联
        </label>
      </mu-bar>
      <mu-v-box
        class="grid"
        size="auto">
        <mu-h-box header>
          <mu-flex-item
            v-for="(item, index) in headers"
            v-show="!item.hidden"
            :key="index"
            :size="item.size"
            :text-align="item.textAlign">
            {{ item.label }}
          </mu-flex-item>
        </mu-h-box>
        <mu-v-box
          size="auto"
          style="overflow: auto;">
          <mu-h-box
            v-for="(item, i) in filterOverlays"
            :key="item.id"
            :class="{active: item === overlay}"
            class="list-item"
            align-items="center">
            <mu-flex-item
              size="60px"
              @click.native="onClickOverlay(item)">
              {{ i + 1 }}
            </mu-flex-item>
            <mu-flex-item
              size="auto"
              text-align="left"
              style="width: 0;"
              @click.native="onClickOverlay(item)">
              <div
                class="mu-text-ellipsis"
                style="color: #fff;"
                :title="item.name">
                {{ item.name }}
              </div>
              <div
                class="mu-text-ellipsis"
                :title="item.structureName">
                {{ item.structureName }}
              </div>
            </mu-flex-item>
            <mu-flex-item
              v-show="sourceColumnVisible"
              size="80px"
              class="mu-text-ellipsis"
              :title="item.orgName"
              @click.native="onClickOverlay(item)">
              {{ item.orgName }}
            </mu-flex-item>
            <mu-flex-item
              v-show="displayColumnVisible && item.type !== 'hotspot'"
              size="60px">
              <mu-toggle
                v-if="item.isCommand === false"
                v-model="item.isCommandDisplay"
                :disabled="!editPermission"
                @change="onChange(item, 'isCommandDisplay')" />
              <mu-toggle
                v-else
                v-model="item.isDisplay"
                :disabled="!editPermission"
                @change="onChange(item, 'isDisplay')" />
            </mu-flex-item>
          </mu-h-box>
        </mu-v-box>
      </mu-v-box>
    </mu-v-box>
  </mu-v-box>
</template>
<script>
  import svg from './assets/svg-icons'

  export default {
    inject: ['baiduMap'],
    props: {
      title: String,
      hiddenFilterVisible: {
        type: Boolean,
        default: true
      },
      unlinkFilterVisible: {
        type: Boolean,
        default: true
      },
      sourceColumnVisible: {
        type: Boolean,
        default: true
      },
      displayColumnVisible: {
        type: Boolean,
        default: true
      }
    },
    data () {
      return {
        showHiddenOverlay: false,
        showUnlinkOverlay: false,
        listIcon: svg.list
      }
    },
    computed: {
      editPermission () {
        return this.baiduMap.mapEditPermission
      },
      mapType () {
        return this.baiduMap.mapType
      },
      structures () {
        return this.baiduMap.structures
      },
      overlays () {
        return this.baiduMap.overlays
      },
      overlayListVisible () {
        return this.baiduMap.overlayListVisible
      },
      overlay () {
        return this.baiduMap.activeOverlay || {}
      },
      filterOverlays () {
        const groupIds = []
        const result = []
        for (const oly of this.overlays) {
          if (oly.isCommand === false && !oly.isDisplay) continue

          const { conditionDisplay, conditionStructure } = this.getDisplay(oly)
          if (conditionDisplay &&
            conditionStructure &&
            !groupIds.includes(oly.parentId)) {
            result.push(oly)
          }
          if (oly.parentId &&
            oly.parentId !== -1 &&
            !groupIds.includes(oly.parentId)) {
            groupIds.push(oly.parentId)
          }
        }
        result.sort((a, b) => b.id - a.id)
        return result
      },
      headers () {
        return [
          {
            size: '60px',
            label: '序号'
          },
          {
            size: 'auto',
            label: '元件名称',
            textAlign: 'left'
          },
          {
            size: '80px',
            label: '来源',
            hidden: !this.sourceColumnVisible
          },
          {
            size: '60px',
            label: '显示',
            hiddel: !this.displayColumnVisible
          }
        ]
      }
    },
    watch: {
      mapType () {
        this.setListHeight()
      }
    },
    mounted () {
      this.$nextTick(() => {
        this.setListHeight()
      })
    },
    methods: {
      getDisplay (oly) {
        const display = oly.isCommand === false ? oly.isCommandDisplay : oly.isDisplay
        const structure = this.structures.find(item => item.id === oly.projectStructureId)

        const conditionDisplay = this.showHiddenOverlay ? !display : true
        const conditionStructure =
          this.showUnlinkOverlay
            ? !oly.projectStructureId || !structure
            : true
        return { conditionDisplay, conditionStructure }
      },
      setListHeight () {
        const el = document.querySelector('.overlay-toolkit > :first-child')
        const listEl = document.querySelector('.overlay-list > :last-child')
        Object.assign(listEl.style, { height: `${el.clientHeight + 48}px` })
      },
      onClickOverlayWindow () {
        this.baiduMap.switchOverlayWindow('overlayListVisible')
      },
      onClickOverlay (oly) {
        const display =
          oly.isCommand === false
            ? oly.isCommandDisplay
            : oly.isDisplay
        if (display) {
          this.baiduMap.selectOverlay(oly)
        }
      },
      onChange (overlay, key) {
        this.baiduMap.updateOverlay(key, overlay[key], overlay)
      }
    }
  }
</script>

<style scoped>
  input[type="checkbox"] {
    margin: 3px 0;
  }
  .overlay-list > :first-child {
    position: absolute;
    top: 56px;
    left: 16px;
    width: 40px;
    height: 40px;
    line-height: 40px;
    text-align: center;
    background: $bgColorLight !important;
    z-index: 5;
    & > .mu-icon {
      width: 100%;
      height: 100%;
      font-size: 18px;
      fill: #fff;
    }
    & >.active{
      background: $bgColorActive;
    }
  }

  .overlay-list > :last-child {
    position: absolute !important;
    width: 300px;
    top: 56px;
    left: 64px;
    background: $bgColorLight;
    & * {
      color: $fontColorGrey;
      font-size: $fontSize;
    }
    & [text-align="left"] {
      text-align: left;
    }
    & .grid {
      margin: 0 12px 12px;
      border: 1px solid #217091;
      overflow: auto;
    }
    & .mu-bar {
      padding: 8px 12px;
      color: $fontColorWhite;
    }
    & [header] {
      text-align: center;
      background: $bgColorDark;
      & > * {
        padding: 8px 0;
      }
    }
    .list-item {
      text-align: center;
      & > *{
        padding: 8px 0;
      }
      & + .list-item {
        border-top: 1px solid #217091;
      }
      &:hover {
        cursor: pointer;
        background: $bgColorHover;
      }
      &.active {
        background: $bgColorActive;
      }
    }
  }
</style>
