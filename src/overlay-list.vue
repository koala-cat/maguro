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
      v-show="overlayListVisible">
      <mu-bar>
        {{ title || '元件列表' }}
        <div size="auto" />
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
          align-items="center"
          @click.native="onClickOverlay(item)">
          <mu-flex-item
            size="60px">
            {{ i + 1 }}
          </mu-flex-item>
          <mu-flex-item
            size="auto"
            text-align="left"
            style="width: 0;">
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
            :title="item.orgName">
            {{ item.orgName }}
          </mu-flex-item>
          <mu-flex-item
            v-show="displayColumnVisible"
            size="60px">
            <mu-toggle
              v-if="item.isCurrentOrg"
              v-model="item.isDisplay"
              @click.stop=""
              @change="onChange(item, 'isDisplay')" />
            <mu-toggle
              v-else
              v-model="item.isCommandDisplay"
              @click.stop=""
              @change="onChange(item, 'isCommandDisplay')" />
          </mu-flex-item>
        </mu-h-box>
      </mu-v-box>
    </mu-v-box>
  </mu-v-box>
</template>
<script>
  import { listSvg } from './assets/svg-icons'

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
        listIcon: listSvg
      }
    },
    computed: {
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
          if (!oly.isCurrentOrg && !oly.isDisplay) continue

          const {
            conditionDisplay,
            conditionStructure
          } = this.getDisplay(oly)
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
    methods: {
      getDisplay (oly) {
        const display = oly.isCurrentOrg ? oly.isDisplay : oly.isCommandDisplay
        const conditionDisplay = this.showHiddenOverlay ? !display : true
        const conditionStructure =
          this.showUnlinkOverlay
            ? !oly.projectStructureId
            : true
        return { conditionDisplay, conditionStructure }
      },
      onClickOverlayWindow () {
        this.baiduMap.switchOverlayWindow('overlayListVisible')
      },
      onClickOverlay (oly) {
        const display =
          oly.isCurrentOrg
            ? oly.isDisplay
            : oly.isCommandDisplay
        if (display) {
          this.baiduMap.selectOverlay(oly)
        }
      },
      onChange (item, key) {
        this.baiduMap.updateOverlay(key, item[key])
      }
    }
  }
</script>

<style scoped>
  .overlay-list > :first-child {
    position: absolute;
    top: -16px;
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
    width: 320px;
    height: 292px;
    top: -16px;
    left: 64px;
    background: $bgColorLight;
    & * {
      color: $fontColorGrey;
      font-size: $fontSize;
    }
    & [text-align="left"] {
      text-align: left;
    }
    & > .mu-bar {
      padding: 4px 12px;
      color: $fontColorWhite;
    }
    & > [header] {
      text-align: center;
      background: $bgColorDark;
      & > * {
        padding: 8px 0;
      }
    }
    .list-item {
      & > *{
        padding: 8px 0;
        text-align: center;
      }
      &:after {
        content: '';
        position: absolute;
        height: 1px;
        right: 10px;
        bottom: 0;
        left: 10px;
        background: $bgColorDark;
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
